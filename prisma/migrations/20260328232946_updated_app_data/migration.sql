/*
  Warnings:

  - You are about to drop the column `app_id` on the `CloudSecret` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CloudSecret" DROP COLUMN "app_id";

-- CreateTable
CREATE TABLE "AppData" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "cloudSecretId" TEXT NOT NULL,

    CONSTRAINT "AppData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppData_id_key" ON "AppData"("id");

-- AddForeignKey
ALTER TABLE "AppData" ADD CONSTRAINT "AppData_cloudSecretId_fkey" FOREIGN KEY ("cloudSecretId") REFERENCES "CloudSecret"("id") ON DELETE CASCADE ON UPDATE CASCADE;
