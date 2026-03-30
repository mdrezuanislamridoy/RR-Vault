/*
  Warnings:

  - Added the required column `fileSize` to the `CloudData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileType` to the `CloudData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CloudData" ADD COLUMN     "fileSize" INTEGER NOT NULL,
ADD COLUMN     "fileType" TEXT NOT NULL;
