-- AlterTable
ALTER TABLE "AppData" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "Subscribed" ADD CONSTRAINT "Subscribed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscribed" ADD CONSTRAINT "Subscribed_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscribed" ADD CONSTRAINT "Subscribed_packagePricingId_fkey" FOREIGN KEY ("packagePricingId") REFERENCES "PackagePricing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
