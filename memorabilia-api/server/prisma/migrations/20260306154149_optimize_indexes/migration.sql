-- DropIndex
DROP INDEX "Card_manufacturer_idx";

-- DropIndex
DROP INDEX "Card_year_idx";

-- CreateIndex
CREATE INDEX "Card_manufacturer_year_idx" ON "Card"("manufacturer", "year");
