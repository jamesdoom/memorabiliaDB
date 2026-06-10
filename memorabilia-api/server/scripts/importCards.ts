// memorabilia-api\server\scripts\importCards.ts

import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

interface RawCardRow {
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
}

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

function parseConfidence(value?: string) {
  const parsed = parseOptionalInt(value);

  if (parsed === null) return null;
  if (parsed < 0 || parsed > 100) return null;

  return parsed;
}

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error("Please provide a CSV file path.");
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);

  const parser = fs.createReadStream(absolutePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }),
  );

  const cardsToInsert = [];
  const csvSlugs = new Set<string>();
  const seenSlugs = new Set<string>();
  const importStartedAt = new Date();
  let index = 0;

  for await (const row of parser as AsyncIterable<RawCardRow>) {
    try {
      if (!row.playerName || !row.title || !row.year || !row.manufacturer) {
        console.warn("Skipping row due to missing required fields:", row);
        continue;
      }

      const year = Number(row.year);

      if (Number.isNaN(year)) {
        console.warn("Invalid year, skipping row:", row);
        continue;
      }

      const slug = createSlug({
        playerName: row.playerName,
        year,
        manufacturer: row.manufacturer,
        title: row.title,
        cardNumber: row.cardNumber || null,
        series: row.series || null,
      });

      console.log("IMPORTING SLUG:", slug);

      if (seenSlugs.has(slug)) {
        console.warn("DUPLICATE IN CSV:", slug, row);
      }
      seenSlugs.add(slug);

      csvSlugs.add(slug);

      const goodValue = parseOptionalInt(row.goodConditionValue);
      const perfectValue = parseOptionalInt(row.perfectConditionValue);
      const hasValue = goodValue !== null || perfectValue !== null;
      const parsedConfidence = parseConfidence(row.valueConfidence);
      const parsedLastValuedAt = parseOptionalDate(row.lastValuedAt);
      const valueSource = row.valueSource || (hasValue ? "CSV import" : null);
      const valueConfidence =
        parsedConfidence !== null ? parsedConfidence : hasValue ? 50 : null;
      const lastValuedAt =
        parsedLastValuedAt ?? (hasValue ? importStartedAt : null);

      const GRADING_COST = 25;

      const gradingProfitPotential =
        goodValue !== null && perfectValue !== null
          ? perfectValue - goodValue
          : null;

      let gradingRecommendation: "YES" | "NO" | "MAYBE" | "CONDITIONAL" | null =
        null;

      if (gradingProfitPotential !== null) {
        if (gradingProfitPotential > 200) {
          gradingRecommendation = "YES";
        } else if (gradingProfitPotential > 75) {
          gradingRecommendation = "MAYBE";
        } else {
          gradingRecommendation = "NO";
        }
      }

      cardsToInsert.push({
        slug,

        playerName: row.playerName,
        sport: row.sport,
        title: row.title,
        year: year,
        manufacturer: row.manufacturer,
        cardNumber: row.cardNumber || null,
        series: row.series || null,
        rookie: row.rookie?.toLowerCase() === "true",

        goodConditionValue: goodValue,
        perfectConditionValue: perfectValue,
        valueSource,
        valueSourceUrl: row.valueSourceUrl || null,
        valueConfidence,
        valueNotes: row.valueNotes || null,
        lastValuedAt,
        gradingProfitPotential,
        gradingRecommendation,

        serialNumber: row.serialNumber || null,
        quantity: row.quantity ? Number(row.quantity) : 1,
        location: row.location || null,

        importOrder: index++,
      });
    } catch (err) {
      console.error("Error processing row:", row, err);
    }
  }

  console.log(`Parsed ${cardsToInsert.length} cards. Syncing...`);

  let created = 0;
  let updated = 0;

  for (const card of cardsToInsert) {
    const existing = await prisma.card.findUnique({
      where: { slug: card.slug },
    });

    if (existing) {
      console.warn("MATCH FOUND (UPDATE):", card.slug);

      await prisma.card.update({
        where: { slug: card.slug },
        data: {
          sport: card.sport,
          cardNumber: card.cardNumber,
          series: card.series,
          rookie: card.rookie,
          goodConditionValue: card.goodConditionValue,
          perfectConditionValue: card.perfectConditionValue,
          valueSource: card.valueSource,
          valueSourceUrl: card.valueSourceUrl,
          valueConfidence: card.valueConfidence,
          valueNotes: card.valueNotes,
          lastValuedAt: card.lastValuedAt,
          serialNumber: card.serialNumber,
          quantity: card.quantity,
          location: card.location,
          importOrder: card.importOrder,
          gradingProfitPotential: card.gradingProfitPotential,
          gradingRecommendation: card.gradingRecommendation,
        },
      });

      updated++;
    } else {
      await prisma.card.create({
        data: card,
      });

      created++;
    }
  }

  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);

  console.log("Syncing deletions...");

  const cardsToDelete = await prisma.card.findMany({
    where: {
      slug: {
        notIn: Array.from(csvSlugs),
      },
    },
    select: { id: true, slug: true },
  });

  console.log(`Found ${cardsToDelete.length} cards to delete`);

  let deleted = 0;

  for (const card of cardsToDelete) {
    console.log(`Deleting: ${card.slug}`);

    await prisma.card.delete({
      where: { id: card.id },
    });

    deleted++;
  }

  console.log(`Deleted: ${deleted}`);
  console.log("Sync complete");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Fatal error:", err);
  await prisma.$disconnect();
  process.exit(1);
});
