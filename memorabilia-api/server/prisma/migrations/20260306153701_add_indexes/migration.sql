/*
  Warnings:

  - You are about to alter the column `purchasePrice` on the `Card` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `estimatedValue` on the `Card` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- DropIndex
DROP INDEX "Card_playerName_year_manufacturer_title_cardNumber_serialNu_key";

-- AlterTable
ALTER TABLE "Card" ALTER COLUMN "rookie" DROP DEFAULT,
ALTER COLUMN "graded" DROP DEFAULT,
ALTER COLUMN "purchasePrice" SET DATA TYPE INTEGER,
ALTER COLUMN "estimatedValue" SET DATA TYPE INTEGER,
ALTER COLUMN "sport" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Card_manufacturer_idx" ON "Card"("manufacturer");

-- CreateIndex
CREATE INDEX "Card_year_idx" ON "Card"("year");

-- CreateIndex
CREATE INDEX "Card_worthGrading_idx" ON "Card"("worthGrading");

-- CreateIndex
CREATE INDEX "Card_location_idx" ON "Card"("location");

-- CreateIndex
CREATE INDEX "Card_estimatedValue_idx" ON "Card"("estimatedValue");
