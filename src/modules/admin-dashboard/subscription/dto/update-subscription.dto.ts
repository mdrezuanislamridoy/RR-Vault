import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { SubscriptionStatus } from '@prisma';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ description: 'Force update subscription status', enum: SubscriptionStatus, example: SubscriptionStatus.CANCELLED })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ description: 'New subscription plan ID for upgrade/downgrade', type: String, example: 'plan_uuid_xyz' })
  @IsOptional()
  @IsString()
  subscriptionPlanId?: string;

  @ApiPropertyOptional({ description: 'New package pricing ID for upgrade/downgrade', type: String, example: 'pricing_uuid_xyz' })
  @IsOptional()
  @IsString()
  packagePricingId?: string;

  @ApiPropertyOptional({ description: 'Toggle subscription active status', type: Boolean, example: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
