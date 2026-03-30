-- AlterTable
ALTER TABLE "CloudData" ADD COLUMN     "folder" TEXT;

-- AlterTable
ALTER TABLE "Subscribed" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "SubscriptionPaymentPlanHistory" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
