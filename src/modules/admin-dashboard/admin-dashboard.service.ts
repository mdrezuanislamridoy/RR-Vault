import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { successResponse } from '@/common/response';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) { }

  async getDashboardStats() {
    try {
      const totalUsers = await this.prisma.client.user.count();
      const totalFiles = await this.prisma.client.cloudData.count();
      const totalStorage = await this.prisma.client.cloudData.aggregate({
        _sum: { fileSize: true },
      });

      const activeSubscriptions = await this.prisma.client.subscriptionPaymentPlanHistory.findMany({
        where: { status: 'PAID' },
        include: {
          packagePricing: {
            select: {
              price: true,
            },
          },
        },
      });

      const totalRevenue = activeSubscriptions.reduce(
        (sum, sub) => sum + (sub.packagePricing?.price || 0),
        0,
      );

      const totalActiveSubscription = await this.prisma.client.subscribed.count({
        where: { status: 'PAID' },
      });

      return {
        totalUsers,
        totalFiles,
        totalRevenue,
        totalStorageUsed: totalStorage._sum.fileSize || 0,
        activeSubscriptions: totalActiveSubscription,
      };
    } catch (error) {
      throw error;
    }
  }

  async getAnalytics() {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const [users, subscriptions] = await Promise.all([
        this.prisma.client.user.findMany({
          where: { created_at: { gte: sixMonthsAgo }, isDeleted: false },
          select: { created_at: true },
        }),
        this.prisma.client.subscribed.findMany({
          where: { createdAt: { gte: sixMonthsAgo }, status: 'PAID' },
          select: { createdAt: true },
        }),
      ]);

      const months: { month: string; users: number; subscriptions: number }[] =
        [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const label = date.toLocaleString('default', {
          month: 'short',
          year: '2-digit',
        });
        const m = date.getMonth();
        const y = date.getFullYear();

        const userCount = users.filter((u) => {
          const d = new Date(u.created_at);
          return d.getMonth() === m && d.getFullYear() === y;
        }).length;

        const subCount = subscriptions.filter((s) => {
          const d = new Date(s.createdAt);
          return d.getMonth() === m && d.getFullYear() === y;
        }).length;

        months.push({
          month: label,
          users: userCount,
          subscriptions: subCount,
        });
      }

      return successResponse('Analytics fetched successfully', months);
    } catch (error) {
      throw error;
    }
  }

  async getRecentUsers() {
    try {
      const users = await this.prisma.client.user.findMany({
        where: { isDeleted: false },
        orderBy: { created_at: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          accountType: true,
          isEmailVerified: true,
          isBlocked: true,
          created_at: true,
        },
      });

      return successResponse('Recent users fetched successfully', users);
    } catch (error) {
      throw error;
    }
  }

  async getAllApps() {
    try {
      const apps = await this.prisma.client.appData.findMany({
        include: {
          cloudSecret: {
            select: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const normalized = apps.map((app) => ({
        id: app.id,
        name: app.name,
        appId: app.appId,
        createdAt: app.createdAt,
        user: app.cloudSecret?.user || null,
      }));

      return successResponse('Apps fetched successfully', normalized);
    } catch (error) {
      throw error;
    }
  }
}
