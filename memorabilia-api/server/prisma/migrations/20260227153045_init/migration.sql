-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "series" TEXT,
    "rookie" BOOLEAN NOT NULL DEFAULT false,
    "graded" BOOLEAN NOT NULL DEFAULT false,
    "gradingCompany" TEXT,
    "gradeValue" INTEGER,
    "serialNumber" TEXT,
    "purchasePrice" DOUBLE PRECISION,
    "estimatedValue" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'inventory',
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);
