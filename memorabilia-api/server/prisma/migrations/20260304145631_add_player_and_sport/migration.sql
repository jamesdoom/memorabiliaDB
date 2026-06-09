/*
  Warnings:

  - Added the required column `playerName` to the `Card` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "playerName" TEXT NOT NULL,
ADD COLUMN     "sport" TEXT NOT NULL DEFAULT 'Baseball';
