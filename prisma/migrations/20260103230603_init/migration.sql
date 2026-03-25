/*
  Warnings:

  - A unique constraint covering the columns `[shortenUrlCode]` on the table `ShortenUrl` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ShortenUrl_shortenUrlCode_key" ON "ShortenUrl"("shortenUrlCode");
