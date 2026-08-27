import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

interface RawTransactionRow {
  type: string;
  occurredAt: string;
  amount?: string;
  amountCents?: string;
  cardId?: string;
  cardSlug?: string;
  quantity?: string;
  marketplace?: string;
  orderId?: string;
  marketplaceFees?: string;
  shippingCost?: string;
  gradingCost?: string;
  suppliesCost?: string;
  notes?: string;
}

function parseMoneyToCents(value?: string) {
  if (!value) return 0;

  const normalized = value.replace(/[$,]/g, "").trim();
  if (!normalized) return 0;

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;

  return Math.round(parsed * 100);
}

function parseOptionalPositiveInt(value?: string) {
  if (!value) return 1;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

async function findCardId(row: RawTransactionRow) {
  if (row.cardId) return row.cardId;
  if (!row.cardSlug) return null;

  const card = await prisma.card.findUnique({
    where: {
      slug: row.cardSlug,
    },
    select: {
      id: true,
    },
  });

  return card?.id ?? null;
}

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error("Please provide a purchases or sales CSV file path.");
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  const sourceFile = path.basename(absolutePath);

  const parser = fs.createReadStream(absolutePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }),
  );

  let created = 0;
  let skipped = 0;

  for await (const row of parser as AsyncIterable<RawTransactionRow>) {
    const type = row.type?.toUpperCase();
    const occurredAt = new Date(row.occurredAt);
    const amountCents = row.amountCents
      ? Number(row.amountCents)
      : parseMoneyToCents(row.amount);

    if (
      !["PURCHASE", "SALE"].includes(type) ||
      Number.isNaN(occurredAt.getTime()) ||
      !Number.isInteger(amountCents) ||
      amountCents < 0
    ) {
      console.warn("Skipping invalid transaction row:", row);
      skipped++;
      continue;
    }

    await prisma.sellerTransaction.create({
      data: {
        type: type as "PURCHASE" | "SALE",
        occurredAt,
        amountCents,
        cardId: await findCardId(row),
        quantity: parseOptionalPositiveInt(row.quantity),
        marketplace: row.marketplace || null,
        orderId: row.orderId || null,
        marketplaceFees: parseMoneyToCents(row.marketplaceFees),
        shippingCost: parseMoneyToCents(row.shippingCost),
        gradingCost: parseMoneyToCents(row.gradingCost),
        suppliesCost: parseMoneyToCents(row.suppliesCost),
        notes: row.notes || null,
        sourceFile,
      },
    });

    created++;
  }

  console.log(`Imported transactions: ${created}`);
  console.log(`Skipped rows: ${skipped}`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Fatal error:", err);
  await prisma.$disconnect();
  process.exit(1);
});
