import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { successResponse } from '@/common/response';
import { StripeService } from '@/config/stripe/stripe.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  async createSubscriptionPlan(dto: CreateSubscriptionPlanDto) {
    const plan = await this.stripeService.stripe.products.create({
      name: dto.name,
      description: dto.description,
      active: true,
      metadata: {
        planIncludes: dto.planIncludes.join(','),
        category: 'subscription',
      },
    });

    const stripePrices = await Promise.all(
      dto.pricings.map(async (pricing) => {
        const price = await this.stripeService.stripe.prices.create({
          product: plan.id,
          unit_amount: Math.round(pricing.price * 100),
          currency: 'usd',
          recurring: {
            interval: pricing.billingCycle === 'MONTHLY' ? 'month' : 'year',
          },
        });
        return { ...pricing, stripePriceId: price.id };
      }),
    );

    const savedPlan = await this.prisma.client.subscriptionPlan.create({
      data: {
        name: dto.name,
        description: dto.description,
        isPopular: dto.isPopular,
        planIncludes: dto.planIncludes,
        autoRenew: dto.autoRenew,
        stripeProductId: plan.id,
        pricings: {
          create: stripePrices.map((p) => ({
            price: p.price,
            maxStorage: p.maxStorage,
            maxFiles: p.maxFiles,
            billingCycle: p.billingCycle,
            stripePriceId: p.stripePriceId,
          })),
        },
      },
      include: { pricings: true },
    });

    return successResponse('Subscription plan created successfully', savedPlan);
  }

  async getMySubscription(userId: string) {
    const subscription = await this.prisma.client.subscribed.findFirst({
      where: { userId, isActive: true },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            planIncludes: true,
          },
        },
        package: {
          select: {
            price: true,
            maxStorage: true,
            maxFiles: true,
            billingCycle: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(
      'Subscription fetched successfully',
      subscription ?? null,
    );
  }

  async verifyAndActivate(sessionId: string, userId: string) {
    const session = await this.stripeService.stripe.checkout.sessions.retrieve(
      sessionId,
      {
        expand: ['subscription'],
      },
    );

    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Payment not completed');
    }

    const metaUserId = session.metadata?.userId;
    if (metaUserId !== userId) {
      throw new BadRequestException('Session does not belong to this user');
    }

    const subscribedId = session.metadata?.subscribedId;
    const historyId = session.metadata?.historyId;
    const pricingId = session.metadata?.pricingId;

    const stripeSubscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    await this.prisma.client.subscribed.updateMany({
      where: { userId, isActive: true, id: { not: subscribedId } },
      data: { isActive: false, status: 'CANCELLED' },
    });

    const pricing = await this.prisma.client.packagePricing.findUnique({
      where: { id: pricingId },
    });

    const activated = await this.prisma.client.subscribed.update({
      where: { id: subscribedId },
      data: {
        isActive: true,
        status: 'PAID',
        stripeSubscriptionId: stripeSubscriptionId ?? null,
        storageLimit: pricing?.maxStorage ?? BigInt(0),
        fileLimit: pricing?.maxFiles ?? 0,
        billingCycle: pricing?.billingCycle ?? 'MONTHLY',
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            planIncludes: true,
          },
        },
        package: {
          select: {
            price: true,
            maxStorage: true,
            maxFiles: true,
            billingCycle: true,
          },
        },
      },
    });

    if (historyId) {
      await this.prisma.client.subscriptionPaymentPlanHistory.update({
        where: { id: historyId },
        data: { isActive: true, status: 'PAID' },
      });
    }

    return successResponse('Subscription activated successfully', activated);
  }

  async getAllSubscriptionPlans() {
    const plans = await this.prisma.client.subscriptionPlan.findMany({
      include: { pricings: true },
    });

    return successResponse('Subscription plans fetched successfully', plans);
  }

  async getSubscriptionPlanById(id: string) {
    const plan = await this.prisma.client.subscriptionPlan.findUnique({
      where: { id },
      include: { pricings: true },
    });

    if (!plan) throw new NotFoundException('Subscription plan not found');

    return successResponse('Subscription plan fetched successfully', plan);
  }

  async updateSubscriptionPlan(id: string, dto: CreateSubscriptionPlanDto) {
    const plan = await this.prisma.client.subscriptionPlan.findUnique({
      where: { id },
      include: { pricings: true },
    });

    if (!plan) throw new NotFoundException('Subscription plan not found');

    await this.stripeService.stripe.products.update(plan.stripeProductId, {
      name: dto.name,
      description: dto.description,
      metadata: {
        planIncludes: dto.planIncludes.join(','),
        category: 'subscription',
      },
    });

    const updatedPricings = await Promise.all(
      dto.pricings.map(async (pricing) => {
        const existingPricing = plan.pricings.find((p) => p.id === pricing.id);

        if (!existingPricing) {
          const price = await this.stripeService.stripe.prices.create({
            product: plan.stripeProductId,
            unit_amount: Math.round(pricing.price * 100),
            currency: 'usd',
            recurring: {
              interval: pricing.billingCycle === 'MONTHLY' ? 'month' : 'year',
            },
          });
          return { ...pricing, stripePriceId: price.id };
        }

        if (existingPricing.price !== pricing.price) {
          await this.stripeService.stripe.prices.update(
            existingPricing.stripePriceId,
            { active: false },
          );
          const newPrice = await this.stripeService.stripe.prices.create({
            product: plan.stripeProductId,
            unit_amount: Math.round(pricing.price * 100),
            currency: 'usd',
            recurring: {
              interval: pricing.billingCycle === 'MONTHLY' ? 'month' : 'year',
            },
          });
          return { ...pricing, stripePriceId: newPrice.id };
        }

        return { ...pricing, stripePriceId: existingPricing.stripePriceId };
      }),
    );

    const updatedPlan = await this.prisma.client.subscriptionPlan.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        isPopular: dto.isPopular,
        planIncludes: dto.planIncludes,
        autoRenew: dto.autoRenew,
        pricings: {
          upsert: updatedPricings.map((p) => ({
            where: { id: p.id || '00000000-0000-0000-0000-000000000000' },
            update: {
              price: p.price,
              maxStorage: p.maxStorage,
              maxFiles: p.maxFiles,
              billingCycle: p.billingCycle,
              stripePriceId: p.stripePriceId,
            },
            create: {
              price: p.price,
              maxStorage: p.maxStorage,
              maxFiles: p.maxFiles,
              billingCycle: p.billingCycle,
              stripePriceId: p.stripePriceId,
            },
          })),
        },
      },
      include: { pricings: true },
    });

    return successResponse(
      'Subscription plan updated successfully',
      updatedPlan,
    );
  }

  async deleteSubscriptionPlan(id: string) {
    const plan = await this.prisma.client.subscriptionPlan.findUnique({
      where: { id },
      include: { pricings: true },
    });

    if (!plan) throw new NotFoundException('Subscription plan not found');

    await this.stripeService.stripe.products.update(plan.stripeProductId, {
      active: false,
    });
    await this.prisma.client.subscriptionPlan.delete({ where: { id } });

    return successResponse('Subscription plan deleted successfully');
  }

  async subscribe(
    planId: string,
    userId: string,
    billingCycle: 'MONTHLY' | 'YEARLY' = 'MONTHLY',
  ) {
    const subscriptionPlan =
      await this.prisma.client.subscriptionPlan.findUnique({
        where: { id: planId },
        include: { pricings: true },
      });

    if (!subscriptionPlan)
      throw new NotFoundException('Subscription plan not found');

    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const createdCustomer = await this.stripeService.createStripeCustomer(
        user.email,
        user.name,
      );
      stripeCustomerId = createdCustomer.id;
      await this.prisma.client.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    if (!subscriptionPlan.stripeProductId) {
      throw new BadRequestException('Subscription plan is not active');
    }

    const pricing = subscriptionPlan.pricings.find(
      (p) => p.billingCycle === billingCycle,
    );
    if (!pricing) throw new NotFoundException('Pricing not found');

    if (pricing.price === 0) {
      const hasPaidHistory = await this.prisma.client.subscribed.findFirst({
        where: { userId, status: 'PAID' },
      });
      if (hasPaidHistory) {
        throw new BadRequestException(
          'You cannot downgrade to a free plan after having a paid subscription.',
        );
      }
    }

    const existingSessions =
      await this.stripeService.stripe.checkout.sessions.list({
        customer: stripeCustomerId,
        limit: 100,
      });

    for (const session of existingSessions.data) {
      if (session.status === 'open') {
        await this.stripeService.stripe.checkout.sessions.expire(session.id);
      }
    }

    const historyRecord =
      await this.prisma.client.subscriptionPaymentPlanHistory.create({
        data: {
          userId: user.id,
          subscriptionPlanId: subscriptionPlan.id,
          packagePricingId: pricing.id,
          isActive: false,
          status: 'PENDING',
        },
      });

    const subscribedRecord = await this.prisma.client.subscribed.create({
      data: {
        userId: user.id,
        subscriptionPlanId: subscriptionPlan.id,
        packagePricingId: pricing.id,
        isActive: false,
        status: 'PENDING',
      },
    });

    const session = await this.stripeService.stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{ price: pricing.stripePriceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
      metadata: {
        userId: user.id,
        planId: subscriptionPlan.id,
        pricingId: pricing.id,
        subscribedId: subscribedRecord.id,
        historyId: historyRecord.id,
      },
    });

    return successResponse('Checkout session created successfully', {
      checkoutSessionId: session.id,
      checkoutUrl: session.url,
    });
  }

  async upgradeSubscription(id: string, userId: string) {
    const subscription = await this.prisma.client.subscribed.findUnique({
      where: { id },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');

    const subscriptionPlan =
      await this.prisma.client.subscriptionPlan.findUnique({
        where: { id: subscription.subscriptionPlanId },
        include: { pricings: true },
      });
    if (!subscriptionPlan)
      throw new NotFoundException('Subscription plan not found');

    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const createdCustomer = await this.stripeService.createStripeCustomer(
        user.email,
        user.name,
      );
      stripeCustomerId = createdCustomer.id;
      await this.prisma.client.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    if (!subscriptionPlan.stripeProductId) {
      throw new BadRequestException('Subscription plan is not active');
    }

    const oldPricing = await this.prisma.client.packagePricing.findUnique({
      where: { id: subscription.packagePricingId },
    });
    if (!oldPricing) throw new NotFoundException('Old pricing not found');

    const pricing = subscriptionPlan.pricings.find(
      (p) => p.billingCycle === oldPricing.billingCycle,
    );
    if (!pricing) throw new NotFoundException('Pricing not found');

    const existingSessions =
      await this.stripeService.stripe.checkout.sessions.list({
        customer: stripeCustomerId,
        limit: 100,
      });

    for (const session of existingSessions.data) {
      if (session.status === 'open') {
        await this.stripeService.stripe.checkout.sessions.expire(session.id);
      }
    }

    const historyRecord =
      await this.prisma.client.subscriptionPaymentPlanHistory.create({
        data: {
          userId: user.id,
          subscriptionPlanId: subscriptionPlan.id,
          packagePricingId: pricing.id,
          isActive: false,
          status: 'PENDING',
        },
      });

    const session = await this.stripeService.stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{ price: pricing.stripePriceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
      metadata: {
        userId: user.id,
        planId: subscriptionPlan.id,
        pricingId: pricing.id,
        historyId: historyRecord.id,
      },
    });

    return successResponse('Checkout session created successfully', {
      checkoutSessionId: session.id,
      checkoutUrl: session.url,
    });
  }

  async unsubscribe(id: string, userId: string) {
    const subscription = await this.prisma.client.subscribed.findUnique({
      where: { id },
    });

    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.userId !== userId)
      throw new BadRequestException('Unauthorized');

    if (subscription.stripeSubscriptionId) {
      await this.stripeService.stripe.subscriptions.cancel(
        subscription.stripeSubscriptionId,
      );
    }

    await this.prisma.client.subscribed.update({
      where: { id },
      data: { isActive: false, status: 'CANCELLED' },
    });

    return successResponse('Unsubscribed successfully');
  }
}
