/*
  Warnings:

  - You are about to drop the `AppData` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CloudData` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CloudSecret` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Folder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PackagePricing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShortenUrl` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StoredFile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Subscribed` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubscriptionPaymentPlanHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubscriptionPlan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AppData" DROP CONSTRAINT "AppData_cloudSecretId_fkey";

-- DropForeignKey
ALTER TABLE "CloudData" DROP CONSTRAINT "CloudData_folderId_fkey";

-- DropForeignKey
ALTER TABLE "CloudData" DROP CONSTRAINT "CloudData_userId_fkey";

-- DropForeignKey
ALTER TABLE "CloudSecret" DROP CONSTRAINT "CloudSecret_userId_fkey";

-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_parentFolderId_fkey";

-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_userId_fkey";

-- DropForeignKey
ALTER TABLE "PackagePricing" DROP CONSTRAINT "PackagePricing_subscriptionPlanId_fkey";

-- DropForeignKey
ALTER TABLE "ShortenUrl" DROP CONSTRAINT "ShortenUrl_originalUrlId_fkey";

-- DropForeignKey
ALTER TABLE "ShortenUrl" DROP CONSTRAINT "ShortenUrl_storedFileId_fkey";

-- DropForeignKey
ALTER TABLE "StoredFile" DROP CONSTRAINT "StoredFile_userId_fkey";

-- DropForeignKey
ALTER TABLE "Subscribed" DROP CONSTRAINT "Subscribed_packagePricingId_fkey";

-- DropForeignKey
ALTER TABLE "Subscribed" DROP CONSTRAINT "Subscribed_subscriptionPlanId_fkey";

-- DropForeignKey
ALTER TABLE "Subscribed" DROP CONSTRAINT "Subscribed_userId_fkey";

-- DropTable
DROP TABLE "AppData";

-- DropTable
DROP TABLE "CloudData";

-- DropTable
DROP TABLE "CloudSecret";

-- DropTable
DROP TABLE "Folder";

-- DropTable
DROP TABLE "PackagePricing";

-- DropTable
DROP TABLE "ShortenUrl";

-- DropTable
DROP TABLE "StoredFile";

-- DropTable
DROP TABLE "Subscribed";

-- DropTable
DROP TABLE "SubscriptionPaymentPlanHistory";

-- DropTable
DROP TABLE "SubscriptionPlan";

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "AccountType";

-- DropEnum
DROP TYPE "BillingCycle";

-- DropEnum
DROP TYPE "SubscriptionStatus";

-- DropEnum
DROP TYPE "UserRoles";
