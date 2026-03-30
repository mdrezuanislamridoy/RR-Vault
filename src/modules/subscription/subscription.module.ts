import { Module } from "@nestjs/common";
import { SubscriptionController } from "./subscription.controller";
import { SubscriptionService } from "./subscription.service";
import { StripeModule } from "@/config/stripe/stripe.module";
import { WebhookController } from "./webhook.controller";

@Module({
    imports: [StripeModule],
    controllers: [SubscriptionController, WebhookController],
    providers: [SubscriptionService],
    exports: [SubscriptionService],
})
export class SubscriptionModule { }