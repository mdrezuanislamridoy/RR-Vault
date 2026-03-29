import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/lib/prisma/prisma.service";
import Stripe from "stripe";
import { CreateSubscriptionPlanDto } from "./dto/create-subscription-plan.dto";
import { successResponse } from "@/common/response";

@Injectable()
export class SubscriptionService {

    private readonly stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2026-02-25.clover',
    });

    constructor(private readonly prisma: PrismaService) { }


    async createSubscriptionPlan(dto: CreateSubscriptionPlanDto) {
        try {
            // 1. Create the product in Stripe
            const plan = await this.stripe.products.create({
                name: dto.name,
                description: dto.description,
                active: true,
                metadata: {
                    planIncludes: dto.planIncludes.join(','),
                    category: "subscription",
                }
            });

            // 2. Create prices in Stripe concurrently
            const stripePrices = await Promise.all(
                dto.pricings.map(async (pricing) => {
                    const price = await this.stripe.prices.create({
                        product: plan.id,
                        unit_amount: Math.round(pricing.price * 100), // Ensure cents are integers
                        currency: 'usd',
                        recurring: {
                            interval: pricing.billingCycle === "MONTHLY" ? "month" : "year",
                        },
                    });

                    return {
                        ...pricing,
                        stripePriceId: price.id
                    };
                })
            );

            // 3. Save the plan and associated pricings to the database
            const savedPlan = await this.prisma.client.subscriptionPlan.create({
                data: {
                    name: dto.name,
                    description: dto.description,
                    isPopular: dto.isPopular,
                    planIncludes: dto.planIncludes,
                    autoRenew: dto.autoRenew,
                    stripeProductId: plan.id,
                    pricings: {
                        create: stripePrices.map((p) => ({
                            price: p.price,
                            maxStorage: p.maxStorage,
                            maxFiles: p.maxFiles,
                            billingCycle: p.billingCycle,
                            stripePriceId: p.stripePriceId,
                        }))
                    }
                },
                include: {
                    pricings: true
                }
            });

            return successResponse('Subscription plan created successfully', savedPlan);
        }
        catch (error) {
            throw error;
        }
    }

    async getAllSubscriptionPlans() {
        try {
            const plans = await this.prisma.client.subscriptionPlan.findMany({
                include: {
                    pricings: true
                }
            });

            if (!plans) throw new NotFoundException('No subscription plans found');

            return successResponse('Subscription plans fetched successfully', plans);
        }
        catch (error) {
            throw error;
        }
    }

    async getSubscriptionPlanById(id: string) {
        try {
            const plan = await this.prisma.client.subscriptionPlan.findUnique({
                where: { id },
                include: {
                    pricings: true
                }
            });

            if (!plan) throw new NotFoundException('Subscription plan not found');

            return successResponse('Subscription plan fetched successfully', plan);
        }
        catch (error) {
            throw error;
        }
    }

    async updateSubscriptionPlan(id: string, dto: CreateSubscriptionPlanDto) {
        try {
            const plan = await this.prisma.client.subscriptionPlan.findUnique({
                where: { id },
                include: {
                    pricings: true
                }
            });

            if (!plan) throw new NotFoundException('Subscription plan not found');

            const updatedProduct = await this.stripe.products.update(plan.stripeProductId, {
                name: dto.name,
                description: dto.description,
                metadata: {
                    planIncludes: dto.planIncludes.join(','),
                    category: "subscription",
                }
            });

            const updatedPricings = await Promise.all(
                dto.pricings.map(async (pricing) => {
                    // Match with existing prices
                    const existingPricing = plan.pricings.find(p => p.id === pricing.id);

                    if (!existingPricing) {
                        // Completely new pricing tier
                        const price = await this.stripe.prices.create({
                            product: plan.stripeProductId,
                            unit_amount: Math.round(pricing.price * 100),
                            currency: 'usd',
                            recurring: {
                                interval: pricing.billingCycle === "MONTHLY" ? "month" : "year",
                            },
                        });
                        return { ...pricing, stripePriceId: price.id };
                    }

                    if (existingPricing.price !== pricing.price) {
                        // Stripe does not allow updating price amount. We must disable the old one and create a new one.
                        await this.stripe.prices.update(existingPricing.stripePriceId, { active: false });

                        const newPrice = await this.stripe.prices.create({
                            product: plan.stripeProductId,
                            unit_amount: Math.round(pricing.price * 100),
                            currency: 'usd',
                            recurring: {
                                interval: pricing.billingCycle === "MONTHLY" ? "month" : "year",
                            },
                        });
                        return { ...pricing, stripePriceId: newPrice.id };
                    }

                    // Price exists and amount hasn't changed.
                    return { ...pricing, stripePriceId: existingPricing.stripePriceId };
                })
            );

            const updatedPlan = await this.prisma.client.subscriptionPlan.update({
                where: { id },
                data: {
                    name: dto.name,
                    description: dto.description,
                    isPopular: dto.isPopular,
                    planIncludes: dto.planIncludes,
                    autoRenew: dto.autoRenew,
                    pricings: {
                        upsert: updatedPricings.map((p) => ({
                            where: { id: p.id || '00000000-0000-0000-0000-000000000000' },
                            update: {
                                price: p.price,
                                maxStorage: p.maxStorage,
                                maxFiles: p.maxFiles,
                                billingCycle: p.billingCycle,
                                stripePriceId: p.stripePriceId,
                            },
                            create: {
                                price: p.price,
                                maxStorage: p.maxStorage,
                                maxFiles: p.maxFiles,
                                billingCycle: p.billingCycle,
                                stripePriceId: p.stripePriceId,
                            }
                        }))
                    }
                },
                include: {
                    pricings: true
                }
            });

            return successResponse('Subscription plan updated successfully', updatedPlan);
        }
        catch (error) {
            throw error;
        }
    }
}