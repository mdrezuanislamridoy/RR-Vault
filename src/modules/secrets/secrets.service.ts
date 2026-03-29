import { successResponse } from "@/common/response";
import { PrismaService } from "@/lib/prisma/prisma.service";
import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { randomBytes } from "crypto";

@Injectable()
export class SecretsService {
    constructor(private readonly prisma: PrismaService) { }

    async generateSecretKey(userId: string) {
        try {
            const existingSecret = await this.prisma.client.cloudSecret.findUnique({
                where: { userId }
            })

            if (existingSecret) {
                throw new BadRequestException('Secret key already exists')
            }

            const secretKey = randomBytes(32).toString('hex');
            const secret = await this.prisma.client.cloudSecret.update({
                where: {
                    userId
                },
                data: {
                    api_secret: `sk_${secretKey}`
                }
            })

            return successResponse('Secret key generated successfully', secret)
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error
            }
            throw new InternalServerErrorException('Failed to generate secret key')
        }
    }

    async generateAppId(userId: string, name: string) {
        try {

            const existingSecret = await this.prisma.client.cloudSecret.findUnique({
                where: { userId }
            })

            const appId = randomBytes(32).toString('hex');
            const secret = await this.prisma.client.cloudSecret.update({
                where: {
                    userId
                },
                data: {
                    app_data: {
                        create: {
                            appId: `app_${appId}`,
                            name
                        }
                    }
                },
                include: {
                    app_data: true
                }
            })

            return successResponse('App id generated successfully', { appIds: secret.app_data })
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error
            }
            throw new InternalServerErrorException('Failed to generate app id')
        }
    }

    async getSecretKey(userId: string) {
        try {
            const existingSecret = await this.prisma.client.cloudSecret.findUnique({
                where: { userId },
                select: {
                    api_secret: true
                }
            })

            if (!existingSecret?.api_secret) {
                throw new BadRequestException('No secret key found')
            }

            return successResponse('Secret key fetched successfully', { secretKey: existingSecret.api_secret })
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error
            }
            throw new InternalServerErrorException('Failed to fetch secret key')
        }
    }

    async getAppIds(userId: string) {
        try {
            const existingSecret = await this.prisma.client.cloudSecret.findUnique({
                where: { userId },
                include: {
                    app_data: true
                }
            })

            if (!existingSecret?.app_data.length) {
                throw new BadRequestException('No app id found')
            }

            return successResponse('App id fetched successfully', { appIds: existingSecret.app_data })
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error
            }
            throw new InternalServerErrorException('Failed to fetch app id')
        }
    }

    async appDetails(userId: string, appId: string) {
        try {
            const existingSecret = await this.prisma.client.cloudSecret.findUnique({
                where: { userId },
                include: {
                    app_data: true
                }
            })

            if (!existingSecret?.app_data.length) {
                throw new BadRequestException('No app id found')
            }

            const appData = existingSecret.app_data.find((app) => app.id === appId || app.appId === appId);

            if (!appData) {
                throw new BadRequestException('App id not found')
            }

            return successResponse('App details fetched successfully', { appData })
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error
            }
            throw new InternalServerErrorException('Failed to fetch app details')
        }
    }
    async getApiKey(userId: string) {
        try {
            const existingSecret = await this.prisma.client.cloudSecret.findUnique({
                where: { userId },
                select: {
                    api_key: true
                }
            })

            if (!existingSecret?.api_key) {
                throw new BadRequestException('No api key found')
            }

            return successResponse('Api key fetched successfully', { apiKey: existingSecret.api_key })
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error
            }
            throw new InternalServerErrorException('Failed to fetch api key')
        }
    }

    async deleteAppId(userId: string, appId: string) {
        try {
            const existingSecret = await this.prisma.client.cloudSecret.findUnique({
                where: { userId },
                include: {
                    app_data: true
                }
            })

            if (!existingSecret?.app_data.length) {
                throw new BadRequestException('No app id found')
            }

            const appDataToDelete = existingSecret.app_data.find((app) => app.id === appId || app.appId === appId);

            if (!appDataToDelete) {
                throw new BadRequestException('App id not found')
            }

            await this.prisma.client.appData.delete({
                where: {
                    id: appDataToDelete.id
                }
            });

            const updatedSecret = await this.prisma.client.cloudSecret.findUnique({
                where: { userId },
                include: {
                    app_data: true
                }
            });

            return successResponse('App id deleted successfully', { appIds: updatedSecret?.app_data || [] })
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error
            }
            throw new InternalServerErrorException('Failed to delete app id')
        }
    }

    async updateApiSecret(userId: string) {
        try {
            const existingSecret = await this.prisma.client.cloudSecret.findUnique({
                where: { userId }
            })

            if (!existingSecret) {
                throw new BadRequestException('Secret key not found')
            }

            const secretKey = randomBytes(32).toString('hex');
            await this.prisma.client.cloudSecret.update({
                where: {
                    userId
                },
                data: {
                    api_secret: `sk_${secretKey}`
                }
            })

            return successResponse('Api secret updated successfully', { secretKey: `sk_${secretKey}` })
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error
            }
            throw new InternalServerErrorException('Failed to update api secret')
        }
    }
}