import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/lib/prisma/prisma.service";
import { CreateAppDto } from "./dto/create-app.dto";
import { successResponse } from "@/common/response";

@Injectable()
export class AppsService {
    constructor(private readonly prisma: PrismaService) { }

    async getApps(userId: string) {
        try {
            const apps = await this.prisma.client.appData.findMany({
                where: {
                    cloudSecret: {
                        userId,
                    },
                },
            });

            if (!apps) throw new NotFoundException('Apps not found');

            return successResponse("Apps found successfully", apps);
        } catch (error) {
            console.error("Error getting apps:", error);
            throw error;
        }
    }

    async getAppById(userId: string, id: string) {
        try {
            const app = await this.prisma.client.appData.findUnique({
                where: {
                    id,
                    cloudSecret: {
                        userId,
                    },
                },
            });

            if (!app) throw new NotFoundException('App not found');

            return successResponse("App found successfully", app);
        } catch (error) {
            console.error("Error getting app:", error);
            throw error;
        }
    }

    async createApp(userId: string, dto: CreateAppDto) {
        try {
            const secrets = await this.prisma.client.cloudSecret.findFirst({
                where: {
                    userId,
                },
            });

            if (!secrets) {
                throw new Error("Secrets not found");
            }

            const secret = await this.prisma.client.cloudSecret.findFirst({
                where: {
                    userId,
                },
            });

            if (!secret) {
                throw new Error("Secret not found");
            }

            const app = await this.prisma.client.appData.create({
                data: {
                    name: dto.name,
                    appId: secrets.id,
                    cloudSecretId: secret.id,
                },
            });

            return successResponse("App created successfully", app);
        } catch (error) {
            console.error("Error creating app:", error);
            throw error;
        }
    }

    async deleteApp(userId: string, id: string) {
        try {
            const app = await this.prisma.client.appData.findUnique({
                where: {
                    id,
                    cloudSecret: {
                        userId,
                    },
                },
            });

            if (!app) throw new NotFoundException('App not found');

            const deletedApp = await this.prisma.client.appData.delete({
                where: {
                    id,

                },
            });

            return successResponse("App deleted successfully", deletedApp);
        } catch (error) {
            console.error("Error deleting app:", error);
            throw error;
        }
    }
}