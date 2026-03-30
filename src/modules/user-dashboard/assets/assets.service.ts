import { successResponse } from "@/common/response";
import { PrismaService } from "@/lib/prisma/prisma.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AssetsService {
    constructor(private readonly prisma: PrismaService) { }

    async getAssets(userId: string, page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;
            const assets = await this.prisma.client.cloudData.findMany({
                where: {
                    userId,
                },
                skip,
                take: limit,
            });
            const totalAssets = await this.prisma.client.cloudData.count({
                where: {
                    userId,
                },
            });
            return successResponse("Assets fetched successfully", { assets, page, totalAssets });
        } catch (error) {
            throw error;
        }
    }

    async getAssetById(id: string) {
        try {
            const asset = await this.prisma.client.cloudData.findUnique({
                where: {
                    id,
                },
            });
            return successResponse("Asset fetched successfully", asset);
        } catch (error) {
            throw error;
        }
    }

    async deleteAsset(id: string) {
        try {
            const asset = await this.prisma.client.cloudData.delete({
                where: {
                    id,
                },
            });
            return successResponse("Asset deleted successfully", asset);
        } catch (error) {
            throw error;
        }
    }
}