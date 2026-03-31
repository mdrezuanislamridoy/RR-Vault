import { Controller, Post, Req, Res, Headers, BadRequestException } from "@nestjs/common";
import { Public } from "@/common/decorators/public.decorator";
import { Request, Response } from "express";
import Stripe from "stripe";
import { PrismaService } from "@/lib/prisma/prisma.service";
import { StripeService } from "@/config/stripe/stripe.service";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags('Payment Webhook')
@Controller('payment/webhook')
@Public()
export class WebhookController {
    constructor(
        private readonly prisma: PrismaService,
        private readonly stripeService: StripeService
    ) { }

    @Post()
    @ApiOperation({ summary: "Stripe Webhook Handler", description: "Public Endpoint used by Stripe to send events" })
    async handleWebhook(
        @Req() req: Request,
        @Res() res: Response,
        @Headers('stripe-signature') signature: string
    ) {
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

        let event: Stripe.Event;

        try {
            event = this.stripeService.stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
        } catch (error) {
            return res.status(400).send(`Webhook signature verification failed: ${error.message}`);
        }

        switch (event.type) {
            case 'checkout.session.completed':
                await this.onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
                break;
            case 'invoice.payment_succeeded':
                await this.onPaymentSuccess(event.data.object as Stripe.Invoice);
                break;
            case 'invoice.payment_failed':
                await this.onPaymentFailed(event.data.object as Stripe.Invoice);
                break;
            case 'customer.subscription.deleted':
                await this.onSubscriptionCancelled(event.data.object as Stripe.Subscription);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
    }

    // ১. চেকআউট কমপ্লিট হলে সাবস্ক্রিপশন একটিভ করা
    async onCheckoutCompleted(session: Stripe.Checkout.Session) {
        try {
            const userId = session.metadata?.userId;
            const historyId = session.metadata?.historyId;
            const planId = session.metadata?.planId;
            const pricingId = session.metadata?.pricingId;

            if (!userId || !historyId || !planId || !pricingId) {
                console.error("Missing metadata in checkout session");
                return;
            }

            const sessionWithLineItems = await this.stripeService.stripe.checkout.sessions.retrieve(session.id, {
                expand: ['subscription'],
            });
            const stripeSubscriptionId = typeof sessionWithLineItems.subscription === 'string'
                ? sessionWithLineItems.subscription
                : sessionWithLineItems.subscription?.id;

            const oldSubscriptions = await this.prisma.client.subscribed.findMany({
                where: {
                    userId,
                    isActive: true,
                }
            });

            for (const oldSub of oldSubscriptions) {
                if (oldSub.stripeSubscriptionId) {
                    try {
                        await this.stripeService.stripe.subscriptions.cancel(oldSub.stripeSubscriptionId);
                    } catch (error) {
                        console.error(`Failed to cancel old Stripe subscription ${oldSub.stripeSubscriptionId}:`, error);
                    }
                }
            }

            await this.prisma.client.subscribed.updateMany({
                where: {
                    userId,
                    isActive: true,
                },
                data: { isActive: false, status: 'CANCELLED' }
            });

            const plan = await this.prisma.client.subscriptionPlan.findUnique({
                where: { id: planId },
                include: {
                    pricings: true,
                }
            });

            if (!plan) {
                throw new BadRequestException('Plan not found');
            }

            // নতুন সাবস্ক্রিপশন আপডেট করা (PENDING থেকে PAID এবং Active করা)
            await this.prisma.client.subscribed.create({
                data: {
                    userId,
                    isActive: true,
                    status: 'PAID',
                    stripeSubscriptionId: stripeSubscriptionId,
                    subscriptionPlanId: planId,
                    packagePricingId: pricingId,
                    storageLimit: plan.pricings.find((p) => p.id === pricingId)?.maxStorage,
                    fileLimit: plan.pricings.find((p) => p.id === pricingId)?.maxFiles,
                    billingCycle: plan.pricings.find((p) => p.id === pricingId)?.billingCycle,
                }
            });

            // পেমেন্ট হিস্ট্রি আপডেট করা
            await this.prisma.client.subscriptionPaymentPlanHistory.update({
                where: { id: historyId },
                data: {
                    isActive: true,
                    status: 'PAID'
                }
            });

            console.log(`Checkout Completed & Subscription Activated for: ${userId}`);
        } catch (error) {
            console.error('Failed to handle checkout session completed:', error);
        }
    }

    // ২. রিনিউয়াল পেমেন্ট সাকসেসফুল হলে
    async onPaymentSuccess(invoice: Stripe.Invoice) {
        try {
            let subscriptionId: string | undefined;
            if (invoice.parent?.type === 'subscription_details') {
                const sub = invoice.parent.subscription_details?.subscription;
                subscriptionId = typeof sub === 'string' ? sub : sub?.id;
            }

            if (!subscriptionId) return;

            const subscriptionData = await this.stripeService.stripe.subscriptions.retrieve(subscriptionId);
            const userId = subscriptionData.metadata?.userId;
            const planId = subscriptionData.metadata?.planId;
            const pricingId = subscriptionData.metadata?.pricingId;

            if (!userId || !planId || !pricingId) return;

            await this.prisma.client.subscriptionPaymentPlanHistory.create({
                data: {
                    userId,
                    subscriptionPlanId: planId,
                    packagePricingId: pricingId,
                    isActive: true,
                    status: 'PAID'
                }
            });

            const plan = await this.prisma.client.subscriptionPlan.findUnique({
                where: { id: planId },
                include: {
                    pricings: true,
                }
            });

            if (!plan) {
                throw new BadRequestException('Plan not found');
            }

            await this.prisma.client.subscribed.create({
                data: {
                    userId,
                    isActive: true,
                    status: 'PAID',
                    stripeSubscriptionId: subscriptionId,
                    subscriptionPlanId: planId,
                    packagePricingId: pricingId,
                    storageLimit: plan.pricings.find((p) => p.id === pricingId)?.maxStorage,
                    fileLimit: plan.pricings.find((p) => p.id === pricingId)?.maxFiles,
                    billingCycle: plan.pricings.find((p) => p.id === pricingId)?.billingCycle,
                }
            });
            console.log(`Invoice Payment Succeeded for user: ${userId}`);
        } catch (error) {
            console.error('Failed to handle invoice payment succeeded:', error);
        }
    }

    async onPaymentFailed(invoice: Stripe.Invoice) {
        try {
            let subscriptionId: string | undefined;
            if (invoice.parent?.type === 'subscription_details') {
                const sub = invoice.parent.subscription_details?.subscription;
                subscriptionId = typeof sub === 'string' ? sub : sub?.id;
            }

            if (!subscriptionId) return;

            const subscriptionData = await this.stripeService.stripe.subscriptions.retrieve(subscriptionId);
            const userId = subscriptionData.metadata?.userId;

            if (!userId) return;

            await this.prisma.client.subscribed.updateMany({
                where: {
                    stripeSubscriptionId: subscriptionId,
                    userId
                },
                data: { isActive: false, status: 'FAILED' }
            });

            console.log(`Invoice Payment Failed. Subscription deactivated for user: ${userId}`);
        } catch (error) {
            console.error('Failed to handle invoice payment failed:', error);
        }
    }

    async onSubscriptionCancelled(subscription: Stripe.Subscription) {
        try {
            const userId = subscription.metadata?.userId;

            if (!userId) return;

            await this.prisma.client.subscribed.updateMany({
                where: {
                    stripeSubscriptionId: subscription.id,
                    userId
                },
                data: { isActive: false, status: 'CANCELLED' }
            });

            console.log(`Subscription Cancelled for user: ${userId}`);
        } catch (error) {
            console.error('Failed to handle subscription cancelled:', error);
        }
    }

}
