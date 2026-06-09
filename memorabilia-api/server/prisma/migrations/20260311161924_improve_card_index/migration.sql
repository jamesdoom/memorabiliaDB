/*
  Warnings:

  - A unique constraint covering the columns `[playerName,year,manufacturer,title]` on the table `Card` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Card_manufacturer_idx";

-- DropIndex
DROP INDEX "Card_year_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Card_playerName_year_manufacturer_title_key" ON "Card"("playerName", "year", "manufacturer", "title");
