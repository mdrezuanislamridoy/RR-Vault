-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "CloudData" (
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CloudData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloudSecret" (
    "id" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "api_secret" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CloudSecret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortenUrl" (
    "id" TEXT NOT NULL,
    "shortenUrlCode" TEXT NOT NULL,
    "originalUrlId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortenUrl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "profilePic" TEXT,
    "profilePicKey" TEXT,
    "role" "Roles" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CloudData_id_key" ON "CloudData"("id");

-- CreateIndex
CREATE UNIQUE INDEX "CloudSecret_id_key" ON "CloudSecret"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ShortenUrl_id_key" ON "ShortenUrl"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ShortenUrl_originalUrlId_key" ON "ShortenUrl"("originalUrlId");

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "CloudData" ADD CONSTRAINT "CloudData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CloudSecret" ADD CONSTRAINT "CloudSecret_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortenUrl" ADD CONSTRAINT "ShortenUrl_originalUrlId_fkey" FOREIGN KEY ("originalUrlId") REFERENCES "CloudData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
