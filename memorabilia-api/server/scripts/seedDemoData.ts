import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import {
  CardStatus,
  GradingCompany,
  GradingRecommendation,
  InventoryLocationType,
  PrismaClient,
  SellerTransactionType,
} from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const demoSourceFile = "demo-transactions.csv";

type DemoCardRow = {
  playerName: string;
  sport: string;
  title: string;
  year: string;
  manufacturer: string;
  cardNumber?: string;
  series?: string;
  rookie?: string;
  goodConditionValue?: string;
  perfectConditionValue?: string;
  valueSource?: string;
  valueSourceUrl?: string;
  valueConfidence?: string;
  valueNotes?: string;
  lastValuedAt?: string;
  serialNumber?: string;
  quantity?: string;
  location?: string;
  locationType?: string;
  locationDetail?: string;
  consignmentPartner?: string;
  gradingSubmissionBatch?: string;
  status?: string;
  listingMarketplace?: string;
  listingUrl?: string;
  askingPriceCents?: string;
  listedAt?: string;
  soldAt?: string;
  gradingCompany?: string;
  gradingServiceLevel?: string;
  gradingFeeCents?: string;
  expectedGradedValueCents?: string;
  gradingConfidence?: string;
  finalGrade?: string;
  gradingCertNumber?: string;
  gradingSubmittedAt?: string;
  gradingReturnedAt?: string;
};

type DemoTransactionRow = {
  type: string;
  occurredAt: string;
  amount?: string;
  costBasis?: string;
  cardSlug?: string;
  quantity?: string;
  lotName?: string;
  lotCardCount?: string;
  marketplace?: string;
  orderId?: string;
  marketplaceFees?: string;
  shippingCost?: string;
  gradingCost?: string;
  suppliesCost?: string;
  notes?: string;
};

function createSlug(row: {
  playerName: string;
  year: number;
  manufacturer: string;
  title: string;
  cardNumber?: string | null;
  series?: string | null;
}) {
  return `${row.playerName}-${row.year}-${row.manufacturer}-${row.title}-${row.cardNumber ?? ""}-${row.series ?? ""}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseMoneyToCents(value?: string) {
  if (!value) return 0;
  const parsed = Number(value.replace(/[$,]/g, "").trim());
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function parseOptionalInt(value?: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseOptionalDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function readCsv<T>(filePath: string) {
  const rows: T[] = [];
  const parser = fs.createReadStream(filePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }),
  );

  for await (const row of parser as AsyncIterable<T>) {
    rows.push(row);
  }

  return rows;
}

function enumValue<T extends Record<string, string>>(
  values: T,
  value?: string,
) {
  if (!value) return null;
  const normalized = value.toUpperCase();
  return Object.values(values).includes(normalized) ? normalized : null;
}

async function seedCards(cardsPath: string) {
  const rows = await readCsv<DemoCardRow>(cardsPath);
  const cardIdsBySlug = new Map<string, string>();

  for (const row of rows) {
    const year = Number(row.year);
    const goodConditionValue = parseOptionalInt(row.goodConditionValue);
    const perfectConditionValue = parseOptionalInt(row.perfectConditionValue);
    const gradingProfitPotential =
      goodConditionValue !== null && perfectConditionValue !== null
        ? perfectConditionValue - goodConditionValue
        : null;
    const slug = createSlug({
      playerName: row.playerName,
      year,
      manufacturer: row.manufacturer,
      title: row.title,
      cardNumber: row.cardNumber || null,
      series: row.series || null,
    });

    const card = await prisma.card.upsert({
      where: { slug },
      create: {
        slug,
        playerName: row.playerName,
        sport: row.sport,
        title: row.title,
        year,
        manufacturer: row.manufacturer,
        cardNumber: row.cardNumber || null,
        series: row.series || null,
        rookie: row.rookie?.toLowerCase() === "true",
        goodConditionValue,
        perfectConditionValue,
        valueSource: row.valueSource || "Demo seed",
        valueSourceUrl: row.valueSourceUrl || null,
        valueConfidence: parseOptionalInt(row.valueConfidence),
        valueNotes: row.valueNotes || null,
        lastValuedAt: parseOptionalDate(row.lastValuedAt),
        gradingProfitPotential,
        gradingRecommendation:
          gradingProfitPotential !== null && gradingProfitPotential > 200
            ? GradingRecommendation.YES
            : gradingProfitPotential !== null && gradingProfitPotential > 75
              ? GradingRecommendation.MAYBE
              : gradingProfitPotential !== null
                ? GradingRecommendation.NO
                : null,
        serialNumber: row.serialNumber || null,
        quantity: Number(row.quantity) || 1,
        location: row.location || null,
        locationType: enumValue(InventoryLocationType, row.locationType) as
          | InventoryLocationType
          | null,
        locationDetail: row.locationDetail || null,
        consignmentPartner: row.consignmentPartner || null,
        gradingSubmissionBatch: row.gradingSubmissionBatch || null,
        status:
          (enumValue(CardStatus, row.status) as CardStatus | null) ??
          CardStatus.NEW,
        listingMarketplace: row.listingMarketplace || null,
        listingUrl: row.listingUrl || null,
        askingPriceCents: parseOptionalInt(row.askingPriceCents),
        listedAt: parseOptionalDate(row.listedAt),
        soldAt: parseOptionalDate(row.soldAt),
        gradingCompany: enumValue(GradingCompany, row.gradingCompany) as
          | GradingCompany
          | null,
        gradingServiceLevel: row.gradingServiceLevel || null,
        gradingFeeCents: parseOptionalInt(row.gradingFeeCents),
        expectedGradedValueCents: parseOptionalInt(
          row.expectedGradedValueCents,
        ),
        gradingConfidence: parseOptionalInt(row.gradingConfidence),
        finalGrade: row.finalGrade || null,
        gradingCertNumber: row.gradingCertNumber || null,
        gradingSubmittedAt: parseOptionalDate(row.gradingSubmittedAt),
        gradingReturnedAt: parseOptionalDate(row.gradingReturnedAt),
      },
      update: {
        sport: row.sport,
        title: row.title,
        manufacturer: row.manufacturer,
        goodConditionValue,
        perfectConditionValue,
        valueSource: row.valueSource || "Demo seed",
        valueConfidence: parseOptionalInt(row.valueConfidence),
        valueNotes: row.valueNotes || null,
        lastValuedAt: parseOptionalDate(row.lastValuedAt),
        gradingProfitPotential,
        quantity: Number(row.quantity) || 1,
        location: row.location || null,
        locationType: enumValue(InventoryLocationType, row.locationType) as
          | InventoryLocationType
          | null,
        locationDetail: row.locationDetail || null,
        consignmentPartner: row.consignmentPartner || null,
        status:
          (enumValue(CardStatus, row.status) as CardStatus | null) ??
          CardStatus.NEW,
        listingMarketplace: row.listingMarketplace || null,
        listingUrl: row.listingUrl || null,
        askingPriceCents: parseOptionalInt(row.askingPriceCents),
        listedAt: parseOptionalDate(row.listedAt),
        soldAt: parseOptionalDate(row.soldAt),
        gradingCompany: enumValue(GradingCompany, row.gradingCompany) as
          | GradingCompany
          | null,
        gradingServiceLevel: row.gradingServiceLevel || null,
        gradingFeeCents: parseOptionalInt(row.gradingFeeCents),
        expectedGradedValueCents: parseOptionalInt(
          row.expectedGradedValueCents,
        ),
        gradingConfidence: parseOptionalInt(row.gradingConfidence),
        finalGrade: row.finalGrade || null,
        gradingCertNumber: row.gradingCertNumber || null,
        gradingSubmittedAt: parseOptionalDate(row.gradingSubmittedAt),
        gradingReturnedAt: parseOptionalDate(row.gradingReturnedAt),
      },
      select: {
        id: true,
        slug: true,
      },
    });

    cardIdsBySlug.set(card.slug, card.id);
  }

  return cardIdsBySlug;
}

async function seedTransactions(
  transactionsPath: string,
  cardIdsBySlug: Map<string, string>,
) {
  const rows = await readCsv<DemoTransactionRow>(transactionsPath);

  await prisma.sellerTransaction.deleteMany({
    where: {
      sourceFile: demoSourceFile,
    },
  });

  for (const row of rows) {
    await prisma.sellerTransaction.create({
      data: {
        type: row.type.toUpperCase() as SellerTransactionType,
        occurredAt: new Date(row.occurredAt),
        amountCents: parseMoneyToCents(row.amount),
        costBasisCents: parseMoneyToCents(row.costBasis),
        cardId: row.cardSlug ? cardIdsBySlug.get(row.cardSlug) ?? null : null,
        quantity: Number(row.quantity) || 1,
        lotName: row.lotName || null,
        lotCardCount: parseOptionalInt(row.lotCardCount),
        marketplace: row.marketplace || null,
        orderId: row.orderId || null,
        marketplaceFees: parseMoneyToCents(row.marketplaceFees),
        shippingCost: parseMoneyToCents(row.shippingCost),
        gradingCost: parseMoneyToCents(row.gradingCost),
        suppliesCost: parseMoneyToCents(row.suppliesCost),
        notes: row.notes || null,
        sourceFile: demoSourceFile,
      },
    });
  }

  return rows.length;
}

function resolveDemoDir() {
  const sourceDemoDir = path.resolve(__dirname, "../demo-data");
  const compiledDemoDir = path.resolve(__dirname, "../../demo-data");

  if (fs.existsSync(sourceDemoDir)) {
    return sourceDemoDir;
  }

  return compiledDemoDir;
}

export async function seedDemoData() {
  const demoDir = resolveDemoDir();
  const cardIdsBySlug = await seedCards(path.join(demoDir, "demo-cards.csv"));
  const transactionCount = await seedTransactions(
    path.join(demoDir, demoSourceFile),
    cardIdsBySlug,
  );

  console.log(`Seeded demo cards: ${cardIdsBySlug.size}`);
  console.log(`Seeded demo transactions: ${transactionCount}`);
}

export async function disconnectDemoSeed() {
  await prisma.$disconnect();
}

async function main() {
  await seedDemoData();
  await disconnectDemoSeed();
}

if (require.main === module) {
  main().catch(async (error) => {
    console.error("Failed to seed demo data:", error);
    await disconnectDemoSeed();
    process.exit(1);
  });
}
