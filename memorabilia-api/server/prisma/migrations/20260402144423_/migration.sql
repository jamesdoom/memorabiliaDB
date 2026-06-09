/*
  Warnings:

  - A unique constraint covering the columns `[playerName,year,manufacturer,title,cardNumber]` on the table `Card` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Card_playerName_year_manufacturer_title_key";

-- CreateIndex
CREATE UNIQUE INDEX "Card_playerName_year_manufacturer_title_cardNumber_key" ON "Card"("playerName", "year", "manufacturer", "title", "cardNumber");
