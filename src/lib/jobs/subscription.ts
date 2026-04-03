import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { SubscriptionStatus } from "@prisma";

@Injectable()
export class SubscriptionJob {
    constructor(private readonly prisma: PrismaService) { }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleSubscription() {
        const subscriptions = await this.prisma.client.subscribed.findMany({
            where: {
                status: SubscriptionStatus.PAID,
                currentPeriodEnd: {
                    lt: new Date(),
                },
            },

        });

        for (const subscription of subscriptions) {
            await this.prisma.client.subscribed.update({
                where: {
                    id: subscription.id,
                },
                data: {
                    status: SubscriptionStatus.CANCELLED,
                },
            });
        }
    }
}