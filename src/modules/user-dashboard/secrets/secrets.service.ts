import { successResponse } from '@/common/response';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class SecretsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateSecretKey(userId: string) {
    const existingSecret = await this.prisma.client.cloudSecret.findUnique({
      where: { userId },
    });

    if (existingSecret?.api_secret) {
      throw new BadRequestException('Secret key already exists');
    }

    const secretKey = `sk_${randomBytes(32).toString('hex')}`;
    const apiKey = `ak_${randomBytes(32).toString('hex')}`;
    await this.prisma.client.cloudSecret.upsert({
      where: { userId },
      update: { api_secret: secretKey },
      create: {
        userId,
        api_key: apiKey,
        api_secret: secretKey,
      },
    });

    return successResponse('Secret key generated successfully', { secretKey });
  }

  async generateAppId(userId: string, name: string) {
    const appId = `app_${randomBytes(32).toString('hex')}`;
    const apiKey = `ak_${randomBytes(32).toString('hex')}`;
    const secret = await this.prisma.client.cloudSecret.upsert({
      where: { userId },
      update: {
        app_data: {
          create: { appId, name },
        },
      },
      create: {
        userId,
        api_key: apiKey,
        app_data: {
          create: { appId, name },
        },
      },
      include: { app_data: true },
    });

    return successResponse('App id generated successfully', {
      appIds: secret.app_data,
    });
  }

  async getSecretKey(userId: string) {
    const existingSecret = await this.prisma.client.cloudSecret.findUnique({
      where: { userId },
      select: { api_secret: true },
    });

    const secretKey = existingSecret?.api_secret ?? null;

    return successResponse('Secret key fetched successfully', { secretKey });
  }

  async getAppIds(userId: string) {
    const existingSecret = await this.prisma.client.cloudSecret.findUnique({
      where: { userId },
      include: { app_data: true },
    });

    const appIds = existingSecret?.app_data ?? [];

    return successResponse('App ids fetched successfully', { appIds });
  }

  async appDetails(userId: string, appId: string) {
    const existingSecret = await this.prisma.client.cloudSecret.findUnique({
      where: { userId },
      include: { app_data: true },
    });

    if (!existingSecret?.app_data.length) {
      throw new BadRequestException('No app id found');
    }

    const appData = existingSecret.app_data.find(
      (a) => a.appId === appId || a.id === appId,
    );

    if (!appData) {
      throw new BadRequestException('App id not found');
    }

    return successResponse('App details fetched successfully', { appData });
  }

  async getApiKey(userId: string) {
    let existingSecret = await this.prisma.client.cloudSecret.findUnique({
      where: { userId },
      select: { api_key: true },
    });

    if (!existingSecret?.api_key) {
      const apiKey = `ak_${randomBytes(32).toString('hex')}`;
      existingSecret = await this.prisma.client.cloudSecret.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          api_key: apiKey,
        },
        select: { api_key: true },
      });
    }

    const apiKey = existingSecret?.api_key ?? null;

    return successResponse('Api key fetched successfully', { apiKey });
  }

  async deleteAppId(userId: string, appId: string) {
    const existingSecret = await this.prisma.client.cloudSecret.findUnique({
      where: { userId },
      include: { app_data: true },
    });

    if (!existingSecret?.app_data.length) {
      throw new BadRequestException('No app id found');
    }

    const appDataToDelete = existingSecret.app_data.find(
      (a) => a.appId === appId || a.id === appId,
    );

    if (!appDataToDelete) {
      throw new BadRequestException('App id not found');
    }

    await this.prisma.client.appData.delete({
      where: { id: appDataToDelete.id },
    });

    const updatedSecret = await this.prisma.client.cloudSecret.findUnique({
      where: { userId },
      include: { app_data: true },
    });

    const appIds = updatedSecret?.app_data ?? [];

    return successResponse('App id deleted successfully', { appIds });
  }

  async updateApiSecret(userId: string) {
    const secretKey = `sk_${randomBytes(32).toString('hex')}`;
    const apiKey = `ak_${randomBytes(32).toString('hex')}`;
    
    await this.prisma.client.cloudSecret.upsert({
      where: { userId },
      update: { api_secret: secretKey },
      create: {
        userId,
        api_key: apiKey,
        api_secret: secretKey,
      },
    });

    return successResponse('Api secret updated successfully', { secretKey });
  }
}
