import { successResponse } from '@/common/response';
import { CryptoService } from '@/common/crypto/crypto.service';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class SecretsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async generateSecretKey(userId: string) {
    const existingSecret = await this.prisma.client.cloudSecret.findUnique({
      where: { userId },
    });

    if (existingSecret?.api_secret) {
      throw new BadRequestException('Secret key already exists');
    }

    const secretKey = `sk_${randomBytes(32).toString('hex')}`;
    await this.prisma.client.cloudSecret.update({
      where: { userId },
      data: { api_secret: this.crypto.encrypt(secretKey) },
    });

    return successResponse('Secret key generated successfully', { secretKey });
  }

  async generateAppId(userId: string, name: string) {
    const appId = `app_${randomBytes(32).toString('hex')}`;
    const secret = await this.prisma.client.cloudSecret.update({
      where: { userId },
      data: {
        app_data: {
          create: { appId: this.crypto.encrypt(appId), name },
        },
      },
      include: { app_data: true },
    });

    const decryptedAppData = secret.app_data.map((a) => ({
      ...a,
      appId: this.crypto.decrypt(a.appId),
    }));

    return successResponse('App id generated successfully', {
      appIds: decryptedAppData,
    });
  }

  async getSecretKey(userId: string) {
    const existingSecret = await this.prisma.client.cloudSecret.findUnique({
      where: { userId },
      select: { api_secret: true },
    });

    const secretKey = existingSecret?.api_secret
      ? this.crypto.decrypt(existingSecret.api_secret)
      : null;

    return successResponse('Secret key fetched successfully', { secretKey });
  }

  async getAppIds(userId: string) {
    const existingSecret = await this.prisma.client.cloudSecret.findUnique({
      where: { userId },
      include: { app_data: true },
    });

    const appIds = (existingSecret?.app_data ?? []).map((a) => ({
      ...a,
      appId: this.crypto.decrypt(a.appId),
    }));

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
      (a) => this.crypto.decrypt(a.appId) === appId || a.id === appId,
    );

    if (!appData) {
      throw new BadRequestException('App id not found');
    }

    return successResponse('App details fetched successfully', {
      appData: { ...appData, appId: this.crypto.decrypt(appData.appId) },
    });
  }

  async getApiKey(userId: string) {
    const existingSecret = await this.prisma.client.cloudSecret.findUnique({
      where: { userId },
      select: { api_key: true },
    });

    if (!existingSecret?.api_key) {
      throw new BadRequestException('No api key found');
    }

    const apiKey = this.crypto.decrypt(existingSecret.api_key);

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
      (a) => this.crypto.decrypt(a.appId) === appId || a.id === appId,
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

    const appIds = (updatedSecret?.app_data ?? []).map((a) => ({
      ...a,
      appId: this.crypto.decrypt(a.appId),
    }));

    return successResponse('App id deleted successfully', { appIds });
  }

  async updateApiSecret(userId: string) {
    const existingSecret = await this.prisma.client.cloudSecret.findUnique({
      where: { userId },
    });

    if (!existingSecret) {
      throw new BadRequestException('Secret key not found');
    }

    const secretKey = `sk_${randomBytes(32).toString('hex')}`;
    await this.prisma.client.cloudSecret.update({
      where: { userId },
      data: { api_secret: this.crypto.encrypt(secretKey) },
    });

    return successResponse('Api secret updated successfully', { secretKey });
  }
}
