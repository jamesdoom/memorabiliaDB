-- CreateEnum
CREATE TYPE "SellerTransactionType" AS ENUM ('PURCHASE', 'SALE');

-- CreateTable
CREATE TABLE "SellerTransaction" (
    "id" TEXT NOT NULL,
    "cardId" TEXT,
    "type" "SellerTransactionType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "amountCents" INTEGER NOT NULL,
    "marketplace" TEXT,
    "orderId" TEXT,
    "marketplaceFees" INTEGER NOT NULL DEFAULT 0,
    "shippingCost" INTEGER NOT NULL DEFAULT 0,
    "gradingCost" INTEGER NOT NULL DEFAULT 0,
    "suppliesCost" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "sourceFile" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SellerTransaction_cardId_idx" ON "SellerTransaction"("cardId");

-- CreateIndex
CREATE INDEX "SellerTransaction_type_idx" ON "SellerTransaction"("type");

-- CreateIndex
CREATE INDEX "SellerTransaction_occurredAt_idx" ON "SellerTransaction"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "SellerTransaction_type_orderId_occurredAt_amountCents_key" ON "SellerTransaction"("type", "orderId", "occurredAt", "amountCents");

-- AddForeignKey
ALTER TABLE "SellerTransaction" ADD CONSTRAINT "SellerTransaction_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;
