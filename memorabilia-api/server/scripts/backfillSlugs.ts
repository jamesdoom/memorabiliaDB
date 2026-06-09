// scripts/backfillSlugs.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function createSlug(card: {
  playerName: string;
  year: number;
  manufacturer: string;
  title: string;
  cardNumber?: string | null;
  series?: string | null;
}) {
  return `${card.playerName}-${card.year}-${card.manufacturer}-${card.title}-${card.cardNumber ?? ""}-${card.series ?? ""}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const cards = await prisma.card.findMany();

  const slugMap = new Map<string, string[]>();

  // First pass: detect duplicates
  for (const card of cards) {
    const slug = createSlug(card);

    if (!slugMap.has(slug)) {
      slugMap.set(slug, []);
    }

    slugMap.get(slug)!.push(card.id);
  }

  // Log duplicates clearly
  for (const [slug, ids] of slugMap.entries()) {
    if (ids.length > 1) {
      console.warn("DUPLICATE SLUG:", slug, ids);
    }
  }

  // Second pass: update all cards.
  for (const card of cards) {
    const slug = createSlug(card);

    await prisma.card.update({
      where: { id: card.id },
      data: { slug },
    });
  }

  console.log("Slugs backfilled");
}

main().finally(() => prisma.$disconnect());
