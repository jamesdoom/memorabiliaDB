/*
  Warnings:

  - You are about to drop the column `condition` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedValue` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `gradeValue` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `graded` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `gradingCompany` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `purchasePrice` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `worthGrading` on the `Card` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Card_estimatedValue_idx";

-- DropIndex
DROP INDEX "Card_location_idx";

-- DropIndex
DROP INDEX "Card_manufacturer_year_idx";

-- DropIndex
DROP INDEX "Card_worthGrading_idx";

-- AlterTable
ALTER TABLE "Card" DROP COLUMN "condition",
DROP COLUMN "estimatedValue",
DROP COLUMN "gradeValue",
DROP COLUMN "graded",
DROP COLUMN "gradingCompany",
DROP COLUMN "purchasePrice",
DROP COLUMN "status",
DROP COLUMN "worthGrading",
ADD COLUMN     "goodConditionValue" INTEGER,
ADD COLUMN     "perfectConditionValue" INTEGER,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "Card_playerName_idx" ON "Card"("playerName");

-- CreateIndex
CREATE INDEX "Card_year_idx" ON "Card"("year");

-- CreateIndex
CREATE INDEX "Card_manufacturer_idx" ON "Card"("manufacturer");
