-- AlterTable
ALTER TABLE "Card" ADD COLUMN "listingMarketplace" TEXT,
ADD COLUMN "listingUrl" TEXT,
ADD COLUMN "askingPriceCents" INTEGER,
ADD COLUMN "listedAt" TIMESTAMP(3),
ADD COLUMN "soldAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Card_listedAt_idx" ON "Card"("listedAt");
