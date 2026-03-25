/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly prisma: PrismaClient;
  private readonly connectionString: string;

  constructor(private readonly configService: ConfigService) {
    this.connectionString =
      this.configService.getOrThrow<string>('DATABASE_URL');

    const adapter = new PrismaPg({ connectionString: this.connectionString });

    this.prisma = new PrismaClient({
      adapter,
      log: [{ emit: 'event', level: 'error' }],
    });
  }

  async onModuleInit() {
    await this.prisma.$connect();
    this.logger.log(`Connected to prisma`);
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
    this.logger.log('Disconnected from database');
  }

  /** Expose Prisma models (like prisma.user, prisma.post, etc.) */
  get client() {
    return this.prisma;
  }
}
