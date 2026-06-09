ALTER TABLE "Card" ADD COLUMN "valueSource" TEXT,
ADD COLUMN "valueSourceUrl" TEXT,
ADD COLUMN "valueConfidence" INTEGER,
ADD COLUMN "valueNotes" TEXT,
ADD COLUMN "lastValuedAt" TIMESTAMP(3);

CREATE INDEX "Card_lastValuedAt_idx" ON "Card"("lastValuedAt");
