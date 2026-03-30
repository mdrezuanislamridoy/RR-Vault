import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/lib/prisma/prisma.service";

@Injectable()
export class AppsService {
    constructor(private readonly prisma: PrismaService) { }

    async getApps(userId: string) {
        return this.prisma.client.appData.findMany({
            where: {
                cloudSecret: {
                    userId,
                },
            },
        });
    }

    async getAppById(id: string) {
        return this.prisma.client.appData.findUnique({
            where: {
                id,
            },
        });
    }

    async createApp(userId: string) {
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
                    name: "New App",
                    appId: secrets.id,
                    cloudSecretId: secret.id,
                },
            });

            return app;
        } catch (error) {
            console.error("Error creating app:", error);
            throw error;
        }
    }

    async deleteApp(id: string) {
        return this.prisma.client.appData.delete({
            where: {
                id,
            },
        });
    }
}