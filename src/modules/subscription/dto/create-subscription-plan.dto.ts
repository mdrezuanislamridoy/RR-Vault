import { BillingCycle } from "@prisma";

export class CreateSubscriptionPlanDto {
    name: string;
    description: string;
    isPopular: boolean;
    planIncludes: string[];
    autoRenew: boolean;
    pricings: PackagePricingDto[];
}

export class PackagePricingDto {
    id?: string;
    price: number;
    maxStorage: number;
    maxFiles: number;
    billingCycle: BillingCycle;
}