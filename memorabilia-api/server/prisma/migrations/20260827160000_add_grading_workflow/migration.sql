-- CreateEnum
CREATE TYPE "GradingCompany" AS ENUM ('PSA', 'SGC', 'BECKETT', 'OTHER');

-- CreateTable
CREATE TABLE "GradingSubmissionBatch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" "GradingCompany" NOT NULL,
    "serviceLevel" TEXT,
    "submittedAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradingSubmissionBatch_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Card" ADD COLUMN "gradingSubmissionBatchId" TEXT,
ADD COLUMN "gradingCompany" "GradingCompany",
ADD COLUMN "gradingServiceLevel" TEXT,
ADD COLUMN "gradingSubmittedAt" TIMESTAMP(3),
ADD COLUMN "gradingReturnedAt" TIMESTAMP(3),
ADD COLUMN "gradingFeeCents" INTEGER,
ADD COLUMN "gradingCertNumber" TEXT,
ADD COLUMN "finalGrade" TEXT,
ADD COLUMN "expectedGradedValueCents" INTEGER,
ADD COLUMN "gradingConfidence" INTEGER;

-- CreateIndex
CREATE INDEX "GradingSubmissionBatch_company_idx" ON "GradingSubmissionBatch"("company");

-- CreateIndex
CREATE INDEX "GradingSubmissionBatch_submittedAt_idx" ON "GradingSubmissionBatch"("submittedAt");

-- CreateIndex
CREATE INDEX "GradingSubmissionBatch_returnedAt_idx" ON "GradingSubmissionBatch"("returnedAt");

-- CreateIndex
CREATE INDEX "Card_gradingSubmissionBatchId_idx" ON "Card"("gradingSubmissionBatchId");

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_gradingSubmissionBatchId_fkey" FOREIGN KEY ("gradingSubmissionBatchId") REFERENCES "GradingSubmissionBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
