import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './lib/prisma/prisma.module';
import { CloudModule } from './modules/cloud/cloud.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './common/guards/auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { SecretsModule } from './modules/user-dashboard/secrets/secrets.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { AppsModule } from './modules/user-dashboard/apps/app.module';
import { AssetsModule } from './modules/user-dashboard/assets/assets.module';
import { OverviewModule } from './modules/user-dashboard/overview/overview.module';
import { FoldersModule } from './modules/user-dashboard/folders/folders.module';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({ global: true }),
    AuthModule,
    PrismaModule,
    SubscriptionModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    SecretsModule,
    CloudModule,
    AppsModule,
    AssetsModule,
    OverviewModule,
    FoldersModule,
    AdminDashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
