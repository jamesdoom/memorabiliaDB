-- AlterEnum
ALTER TYPE "CardStatus" ADD VALUE 'READY_TO_LIST';
ALTER TYPE "CardStatus" ADD VALUE 'SOLD';
ALTER TYPE "CardStatus" ADD VALUE 'SHIPPED';
ALTER TYPE "CardStatus" ADD VALUE 'ARCHIVED';

-- CreateEnum
CREATE TYPE "InventoryLocationType" AS ENUM ('BOX', 'SHELF', 'BINDER', 'CONSIGNMENT', 'GRADING_SUBMISSION', 'OTHER');

-- AlterTable
ALTER TABLE "Card" ADD COLUMN "locationType" "InventoryLocationType",
ADD COLUMN "locationDetail" TEXT,
ADD COLUMN "consignmentPartner" TEXT,
ADD COLUMN "gradingSubmissionBatch" TEXT;

-- CreateIndex
CREATE INDEX "Card_locationType_idx" ON "Card"("locationType");

-- CreateIndex
CREATE INDEX "Card_listedAt_status_idx" ON "Card"("listedAt", "status");
