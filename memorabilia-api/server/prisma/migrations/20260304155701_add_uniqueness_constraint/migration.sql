/*
  Warnings:

  - A unique constraint covering the columns `[playerName,year,manufacturer,title,cardNumber,serialNumber]` on the table `Card` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Card_playerName_year_manufacturer_title_cardNumber_serialNu_key" ON "Card"("playerName", "year", "manufacturer", "title", "cardNumber", "serialNumber");
