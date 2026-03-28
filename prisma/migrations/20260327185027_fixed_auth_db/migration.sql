/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[userId]` on the table `CloudSecret` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[storedFileId]` on the table `ShortenUrl` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `storedFileId` to the `ShortenUrl` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "UserRoles" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('EMAIL', 'GOOGLE');

-- DropForeignKey
ALTER TABLE "CloudData" DROP CONSTRAINT "CloudData_userId_fkey";

-- DropForeignKey
ALTER TABLE "CloudSecret" DROP CONSTRAINT "CloudSecret_userId_fkey";

-- DropForeignKey
ALTER TABLE "ShortenUrl" DROP CONSTRAINT "ShortenUrl_originalUrlId_fkey";

-- AlterTable
ALTER TABLE "CloudSecret" ADD COLUMN     "app_id" TEXT[];

-- AlterTable
ALTER TABLE "ShortenUrl" ADD COLUMN     "storedFileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'EMAIL',
ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "resetCode" TEXT,
ADD COLUMN     "resetCodeExpiry" TIMESTAMP(3),
ADD COLUMN     "resetCodeToken" TEXT,
ADD COLUMN     "verifyCode" TEXT,
ADD COLUMN     "verifyCodeExpiry" TIMESTAMP(3),
ADD COLUMN     "verifyCodeToken" TEXT,
DROP COLUMN "role",
ADD COLUMN     "role" "UserRoles" NOT NULL DEFAULT 'USER';

-- DropEnum
DROP TYPE "Roles";

-- CreateTable
CREATE TABLE "StoredFile" (
    "id" TEXT NOT NULL,
    "folderName" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoredFile_id_key" ON "StoredFile"("id");

-- CreateIndex
CREATE UNIQUE INDEX "CloudSecret_userId_key" ON "CloudSecret"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ShortenUrl_storedFileId_key" ON "ShortenUrl"("storedFileId");

-- AddForeignKey
ALTER TABLE "CloudData" ADD CONSTRAINT "CloudData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CloudSecret" ADD CONSTRAINT "CloudSecret_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortenUrl" ADD CONSTRAINT "ShortenUrl_originalUrlId_fkey" FOREIGN KEY ("originalUrlId") REFERENCES "CloudData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortenUrl" ADD CONSTRAINT "ShortenUrl_storedFileId_fkey" FOREIGN KEY ("storedFileId") REFERENCES "StoredFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
