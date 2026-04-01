/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { GetSubscriptionsDto } from './dto/get-subscriptions.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { Prisma, SubscriptionStatus } from '@prisma';
import { successResponse } from '@/common/response';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async getSubscriptions(query: GetSubscriptionsDto) {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SubscribedWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      // If there's a search term, find users matching the email or name
      const users = await this.prisma.client.user.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);

      where.userId = { in: userIds };
    }

    const [subscriptions, total] = await Promise.all([
      this.prisma.client.subscribed.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.subscribed.count({ where }),
    ]);

    // Format output with user info if possible (since we might need to manually attach user details)
    const userIds = subscriptions.map((s) => s.userId);
    const users = await this.prisma.client.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    // Similarly fetch plan details and pricing details for a rich admin dashboard
    const planIds = subscriptions.map((s) => s.subscriptionPlanId);
    const pricingIds = subscriptions.map((s) => s.packagePricingId);

    const [plans, pricings] = await Promise.all([
      this.prisma.client.subscriptionPlan.findMany({
        where: { id: { in: planIds } },
        select: { id: true, name: true },
      }),
      this.prisma.client.packagePricing.findMany({
        where: { id: { in: pricingIds } },
        select: { id: true, price: true, billingCycle: true },
      }),
    ]);

    const enrichedSubscriptions = subscriptions.map((sub) => {
      return {
        ...sub,
        user: users.find((u) => u.id === sub.userId) || null,
        plan: plans.find((p) => p.id === sub.subscriptionPlanId) || null,
        pricing: pricings.find((p) => p.id === sub.packagePricingId) || null,
      };
    });

    return successResponse('Subscriptions fetched successfully', {
      data: enrichedSubscriptions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  async updateSubscription(
    subscriptionId: string,
    updateData: UpdateSubscriptionDto,
  ) {
    const subscription = await this.prisma.client.subscribed.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Sync isActive with status if status is updated
    if (updateData.status) {
      updateData.isActive = updateData.status === SubscriptionStatus.PAID;
    }

    // If plan or pricing changed, we should update the limits accordingly for consistency
    if (updateData.packagePricingId) {
      const newPricing = await this.prisma.client.packagePricing.findUnique({
        where: { id: updateData.packagePricingId },
      });

      if (newPricing) {
        // Enforce limits and billing cycle from the new pricing tier
        (updateData as any).storageLimit = newPricing.maxStorage;
        (updateData as any).fileLimit = newPricing.maxFiles;
        (updateData as any).billingCycle = newPricing.billingCycle;
      }
    }

    const updatedSubscription = await this.prisma.client.subscribed.update({
      where: { id: subscriptionId },
      data: updateData as any,
    });

    return successResponse(
      'Subscription updated successfully',
      updatedSubscription,
    );
  }
}
