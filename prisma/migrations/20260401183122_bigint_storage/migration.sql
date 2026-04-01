-- AlterTable
ALTER TABLE "PackagePricing" ALTER COLUMN "maxStorage" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Subscribed" ALTER COLUMN "storageLimit" SET DATA TYPE BIGINT,
ALTER COLUMN "storageUsed" SET DATA TYPE BIGINT;
