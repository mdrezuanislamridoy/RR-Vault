import { Injectable } from "@nestjs/common";
import Stripe from "stripe";
import { PrismaService } from "src/lib/prisma/prisma.service";

@Injectable()
export class StripeService {
    public stripe: Stripe;
    constructor(private readonly prisma: PrismaService) {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2026-02-25.clover',
        });
    }

    async createStripeCustomer(email: string, name: string) {
        try {
            const customer = await this.stripe.customers.create({
                email,
                name,
            });
            return customer;
        } catch (error) {
            throw error;
        }
    }
}