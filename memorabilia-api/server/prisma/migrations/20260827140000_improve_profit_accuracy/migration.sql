-- AlterEnum
ALTER TYPE "SellerTransactionType" ADD VALUE 'REFUND';
ALTER TYPE "SellerTransactionType" ADD VALUE 'RETURN';
ALTER TYPE "SellerTransactionType" ADD VALUE 'ADJUSTMENT';

-- AlterTable
ALTER TABLE "SellerTransaction" ADD COLUMN "costBasisCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lotName" TEXT,
ADD COLUMN "lotCardCount" INTEGER;
