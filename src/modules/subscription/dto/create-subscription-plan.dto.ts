import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BillingCycle } from "@prisma";
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class PackagePricingDto {
    @ApiPropertyOptional({ description: 'Pricing ID if updating an existing price', example: 'price_12345' })
    @IsOptional()
    @IsString()
    id?: string;

    @ApiProperty({ description: 'Price amount in USD', example: 9.99 })
    @IsNumber()
    price: number;

    @ApiProperty({ description: 'Maximum storage allowed in GB', example: 50 })
    @IsNumber()
    maxStorage: number;

    @ApiProperty({ description: 'Maximum files allowed', example: 1000 })
    @IsNumber()
    maxFiles: number;

    @ApiProperty({ description: 'Billing cycle', enum: BillingCycle, example: BillingCycle.MONTHLY })
    @IsEnum(BillingCycle)
    billingCycle: BillingCycle;
}

export class CreateSubscriptionPlanDto {
    @ApiProperty({ description: 'Name of the subscription plan', example: 'Pro Tier' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Description of the plan', example: 'Perfect for professionals' })
    @IsString()
    description: string;

    @ApiProperty({ description: 'Is this a popular plan', example: true })
    @IsBoolean()
    isPopular: boolean;

    @ApiProperty({ description: 'List of features included', type: [String], example: ['50GB Storage', 'Priority Support'] })
    @IsArray()
    @IsString({ each: true })
    planIncludes: string[];

    @ApiProperty({ description: 'Should this plan auto-renew', example: true })
    @IsBoolean()
    autoRenew: boolean;

    @ApiProperty({ description: 'Pricing tiers for different billing cycles', type: [PackagePricingDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PackagePricingDto)
    pricings: PackagePricingDto[];
}