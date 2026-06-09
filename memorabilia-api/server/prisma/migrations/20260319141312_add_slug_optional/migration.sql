/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Card` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Card_slug_key" ON "Card"("slug");
