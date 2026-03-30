import { successResponse } from "@/common/response";
import { PrismaService } from "@/lib/prisma/prisma.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class OverviewService {
    constructor(private readonly prisma: PrismaService) { }

    async getOverview(userId: string) {
        try {
            const totalFiles = await this.prisma.client.cloudData.count({
                where: {
                    userId,
                },
            });
            const storageAnalytics = await this.prisma.client.cloudData.aggregate({
                where: {
                    userId,
                },
                _sum: {
                    fileSize: true,
                },
            });
            const totalFolders = await this.prisma.client.folder.count({
                where: {
                    userId,
                },
            });

            return successResponse("Overview fetched successfully", {
                totalFiles,
                totalUsed: storageAnalytics._sum.fileSize || 0,
                totalFolders,
                totalStorage: storageAnalytics._sum.fileSize || 0,
            });
        } catch (error) {
            throw error;
        }
    }

    async getAnalytics(userId: string) {
        try {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
            sixMonthsAgo.setDate(1);
            sixMonthsAgo.setHours(0, 0, 0, 0);

            const lastDayOfThisMonth = new Date();
            lastDayOfThisMonth.setHours(23, 59, 59, 999);

            const sixMonthsAgoData = await this.prisma.client.cloudData.findMany({
                where: {
                    userId,
                    uploaded_at: {
                        gte: sixMonthsAgo,
                        lte: lastDayOfThisMonth,
                    },
                },
            });

            const monthlyData: { months: string; count: number }[] = [];

            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                const monthYear = `${month}-${year}`;

                const count = sixMonthsAgoData.filter((item) => {
                    const itemDate = new Date(item.uploaded_at);
                    return (
                        itemDate.getMonth() === date.getMonth() &&
                        itemDate.getFullYear() === date.getFullYear()
                    );
                }).length;

                monthlyData.push({ months: monthYear, count });
            }

            const monthlyStorageUses: { months: string; used: number }[] = [];

            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                const monthYear = `${month}-${year}`;

                const used = sixMonthsAgoData.filter((item) => {
                    const itemDate = new Date(item.uploaded_at);
                    return (
                        itemDate.getMonth() === date.getMonth() &&
                        itemDate.getFullYear() === date.getFullYear()
                    );
                }).reduce((acc, item) => acc + item.fileSize, 0);

                monthlyStorageUses.push({ months: monthYear, used });
            }

            return successResponse("Analytics fetched successfully", { monthlyData, monthlyStorageUses });
        } catch (error) {
            throw error;
        }
    }
}