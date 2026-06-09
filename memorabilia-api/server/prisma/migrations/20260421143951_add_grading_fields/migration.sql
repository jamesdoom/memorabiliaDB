-- CreateEnum
CREATE TYPE "GradingRecommendation" AS ENUM ('YES', 'NO', 'MAYBE', 'CONDITIONAL');

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "gradingProfitPotential" INTEGER,
ADD COLUMN     "gradingRecommendation" "GradingRecommendation";
