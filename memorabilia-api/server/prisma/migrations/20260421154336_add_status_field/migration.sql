-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('NEW', 'LISTED', 'GRADED');

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "status" "CardStatus" NOT NULL DEFAULT 'NEW';
