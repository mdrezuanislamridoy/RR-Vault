import { Controller, Post, Req, Res, Headers } from '@nestjs/common';
import { Public } from '@/common/decorators/public.decorator';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { StripeService } from '@/config/stripe/stripe.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Payment Webhook')
@Controller('payment/webhook')
@Public()
export class WebhookController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Stripe Webhook Handler',
    description: 'Public Endpoint used by Stripe to send events',
  })
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    let event: Stripe.Event;

    try {
      event = this.stripeService.stripe.webhooks.constructEvent(
        req.body,
        signature,
        endpointSecret,
      );
    } catch (error: unknown) {
      return res
        .status(400)
        .send(
          `Webhook signature verification failed: ${(error as Error).message}`,
        );
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.onCheckoutCompleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await this.onPaymentSuccess(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.onPaymentFailed(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.onSubscriptionCancelled(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }

  // Checkout complete — activate the existing PENDING subscribed record
  async onCheckoutCompleted(session: Stripe.Checkout.Session) {
    try {
      const userId = session.metadata?.userId;
      const historyId = session.metadata?.historyId;
      const subscribedId = session.metadata?.subscribedId;
      const pricingId = session.metadata?.pricingId;

      if (!userId || !subscribedId || !pricingId) {
        console.error('Missing metadata in checkout session');
        return;
      }

      const sessionWithLineItems =
        await this.stripeService.stripe.checkout.sessions.retrieve(session.id, {
          expand: ['subscription'],
        });
      const stripeSubscriptionId =
        typeof sessionWithLineItems.subscription === 'string'
          ? sessionWithLineItems.subscription
          : sessionWithLineItems.subscription?.id;

      // Deactivate other active subscriptions (not the current pending one)
      await this.prisma.client.subscribed.updateMany({
        where: { userId, isActive: true, id: { not: subscribedId } },
        data: { isActive: false, status: 'CANCELLED' },
      });

      const pricing = await this.prisma.client.packagePricing.findUnique({
        where: { id: pricingId },
      });

      // Activate the existing PENDING record
      await this.prisma.client.subscribed.update({
        where: { id: subscribedId },
        data: {
          isActive: true,
          status: 'PAID',
          stripeSubscriptionId: stripeSubscriptionId ?? null,
          storageLimit: pricing?.maxStorage ?? BigInt(0),
          fileLimit: pricing?.maxFiles ?? 0,
          billingCycle: pricing?.billingCycle ?? 'MONTHLY',
        },
      });

      // Mark the PENDING history entry as PAID
      if (historyId) {
        await this.prisma.client.subscriptionPaymentPlanHistory.update({
          where: { id: historyId },
          data: { isActive: true, status: 'PAID' },
        });
      }

      console.log(`Checkout Completed & Subscription Activated for: ${userId}`);
    } catch (error) {
      console.error('Failed to handle checkout session completed:', error);
    }
  }

  // Renewal payment — append new history entry only, subscribed record stays unchanged
  async onPaymentSuccess(invoice: Stripe.Invoice) {
    try {
      let subscriptionId: string | undefined;
      if (invoice.parent?.type === 'subscription_details') {
        const sub = invoice.parent.subscription_details?.subscription;
        subscriptionId = typeof sub === 'string' ? sub : sub?.id;
      }

      if (!subscriptionId) return;

      const subscriptionData =
        await this.stripeService.stripe.subscriptions.retrieve(subscriptionId);
      const userId = subscriptionData.metadata?.userId;
      const planId = subscriptionData.metadata?.planId;
      const pricingId = subscriptionData.metadata?.pricingId;

      if (!userId || !planId || !pricingId) return;

      // Append-only: add new history record for this renewal payment
      await this.prisma.client.subscriptionPaymentPlanHistory.create({
        data: {
          userId,
          subscriptionPlanId: planId,
          packagePricingId: pricingId,
          isActive: true,
          status: 'PAID',
        },
      });

      console.log(`Invoice Payment Succeeded (renewal) for user: ${userId}`);
    } catch (error) {
      console.error('Failed to handle invoice payment succeeded:', error);
    }
  }

  async onPaymentFailed(invoice: Stripe.Invoice) {
    try {
      let subscriptionId: string | undefined;
      if (invoice.parent?.type === 'subscription_details') {
        const sub = invoice.parent.subscription_details?.subscription;
        subscriptionId = typeof sub === 'string' ? sub : sub?.id;
      }

      if (!subscriptionId) return;

      const subscriptionData =
        await this.stripeService.stripe.subscriptions.retrieve(subscriptionId);
      const userId = subscriptionData.metadata?.userId;

      if (!userId) return;

      await this.prisma.client.subscribed.updateMany({
        where: { stripeSubscriptionId: subscriptionId, userId },
        data: { isActive: false, status: 'FAILED' },
      });

      console.log(
        `Invoice Payment Failed. Subscription deactivated for user: ${userId}`,
      );
    } catch (error) {
      console.error('Failed to handle invoice payment failed:', error);
    }
  }

  async onSubscriptionCancelled(subscription: Stripe.Subscription) {
    try {
      const userId = subscription.metadata?.userId;
      if (!userId) return;

      await this.prisma.client.subscribed.updateMany({
        where: { stripeSubscriptionId: subscription.id, userId },
        data: { isActive: false, status: 'CANCELLED' },
      });

      console.log(`Subscription Cancelled for user: ${userId}`);
    } catch (error) {
      console.error('Failed to handle subscription cancelled:', error);
    }
  }
}
