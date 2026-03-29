import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from './lib/prisma/prisma.service';

@Injectable()
export class AppService {

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Validates a set of cloud storage credentials against the database.
   * 
   * @param {string} appId - The unique identifier for the application.
   * @param {string} apiKey - The public API key associated with the cloud secret.
   * @param {string} secretKey - The private API secret associated with the cloud secret.
   * @returns {Promise<{ valid: boolean }>} An object indicating the credentials are valid.
   * @throws {BadRequestException} If the secrets are not found or are invalid.
   */
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
        valid: true
      }
    }
    catch (error) {
      throw new BadRequestException('Invalid secrets')
    }
  }
}
