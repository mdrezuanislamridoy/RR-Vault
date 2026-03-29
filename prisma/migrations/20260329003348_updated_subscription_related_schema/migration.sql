/*
  Warnings:

  - Added the required column `stripePriceId` to the `PackagePricing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stripeProductId` to the `SubscriptionPlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PackagePricing" ADD COLUMN     "stripePriceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "stripeProductId" TEXT NOT NULL;
