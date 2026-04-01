import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/lib/prisma/prisma.service";

@Injectable()
export class AdminDashboardService {
    constructor(private readonly prisma: PrismaService) { }

    async getDashboardStats() {
        try {
            const totalUsers = await this.prisma.client.user.count();
            const totalFiles = await this.prisma.client.cloudData.count();
            const totalStorage = await this.prisma.client.cloudData.aggregate({
                _sum: {
                    fileSize: true
                }
            });

            // Calculate total revenue from active subscriptions
            const activeSubscriptions = await this.prisma.client.subscribed.findMany({
                where: { status: 'PAID' },
                include: { package: true }
            });

            const totalRevenue = activeSubscriptions.reduce((sum, sub) => sum + (sub.package?.price || 0), 0);

            return {
                totalUsers,
                totalFiles,
                totalRevenue,
                totalStorageUsed: totalStorage._sum.fileSize || 0,
                activeSubscriptions: activeSubscriptions.length
            };
        }
        catch (error) {
            throw error;
        }
    }
}