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
            const totalSubscriptions = await this.prisma.client.subscribed.count();
           
        }
        catch (error) {
            throw error;
        }
    }
}