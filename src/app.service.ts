import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from './lib/prisma/prisma.service';

@Injectable()
export class AppService {

  constructor(private readonly prisma: PrismaService) { }

  async validate(appId: string, apiKey: string, secretKey: string) {
    try {
      const yourSecret = await this.prisma.client.cloudSecret.findFirst({
        where: {
          app_data: {
            some: {
              appId: appId
            }
          },
          api_secret: secretKey,
          api_key: apiKey,
        }
      })

      if (!yourSecret) {
        throw new BadRequestException('No secrets found')
      }

      return {
        valid: true,
        userId: yourSecret.userId
      }
    }
    catch (error) {
      throw new BadRequestException('Invalid secrets')
    }
  }
}
