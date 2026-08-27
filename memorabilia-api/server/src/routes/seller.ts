import { Router } from "express";
import { prisma } from "../lib/prisma";
import {
  sellerTransactionSchema,
  sellerTransactionsImportSchema,
} from "../validation/sellerTransactionSchema";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

function toMonthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function buildSummary(
  transactions: Array<{
    type: "PURCHASE" | "SALE";
    occurredAt: Date;
    amountCents: number;
    marketplaceFees: number;
    shippingCost: number;
    gradingCost: number;
    suppliesCost: number;
  }>,
) {
  const monthly = new Map<
    string,
    {
      month: string;
      revenueCents: number;
      purchaseCostCents: number;
      marketplaceFeesCents: number;
      shippingCostCents: number;
      gradingCostCents: number;
      suppliesCostCents: number;
      netProfitCents: number;
    }
  >();

  const totals = {
    revenueCents: 0,
    purchaseCostCents: 0,
    marketplaceFeesCents: 0,
    shippingCostCents: 0,
    gradingCostCents: 0,
    suppliesCostCents: 0,
    netProfitCents: 0,
  };

  for (const transaction of transactions) {
    const month = toMonthKey(transaction.occurredAt);
    const monthlyTotals =
      monthly.get(month) ??
      {
        month,
        revenueCents: 0,
        purchaseCostCents: 0,
        marketplaceFeesCents: 0,
        shippingCostCents: 0,
        gradingCostCents: 0,
        suppliesCostCents: 0,
        netProfitCents: 0,
      };

    if (transaction.type === "SALE") {
      totals.revenueCents += transaction.amountCents;
      monthlyTotals.revenueCents += transaction.amountCents;
    } else {
      totals.purchaseCostCents += transaction.amountCents;
      monthlyTotals.purchaseCostCents += transaction.amountCents;
    }

    totals.marketplaceFeesCents += transaction.marketplaceFees;
    totals.shippingCostCents += transaction.shippingCost;
    totals.gradingCostCents += transaction.gradingCost;
    totals.suppliesCostCents += transaction.suppliesCost;

    monthlyTotals.marketplaceFeesCents += transaction.marketplaceFees;
    monthlyTotals.shippingCostCents += transaction.shippingCost;
    monthlyTotals.gradingCostCents += transaction.gradingCost;
    monthlyTotals.suppliesCostCents += transaction.suppliesCost;

    monthly.set(month, monthlyTotals);
  }

  totals.netProfitCents =
    totals.revenueCents -
    totals.purchaseCostCents -
    totals.marketplaceFeesCents -
    totals.shippingCostCents -
    totals.gradingCostCents -
    totals.suppliesCostCents;

  for (const month of monthly.values()) {
    month.netProfitCents =
      month.revenueCents -
      month.purchaseCostCents -
      month.marketplaceFeesCents -
      month.shippingCostCents -
      month.gradingCostCents -
      month.suppliesCostCents;
  }

  return {
    totals,
    monthly: Array.from(monthly.values()).sort((a, b) =>
      b.month.localeCompare(a.month),
    ),
  };
}

async function resolveCardIdsBySlug(
  transactions: Array<{ cardSlug?: string | null }>,
) {
  const slugs = Array.from(
    new Set(
      transactions
        .map((transaction) => transaction.cardSlug)
        .filter((slug): slug is string => Boolean(slug)),
    ),
  );

  if (slugs.length === 0) return new Map<string, string>();

  const cards = await prisma.card.findMany({
    where: {
      slug: {
        in: slugs,
      },
    },
    select: {
      id: true,
      slug: true,
    },
  });

  return new Map(cards.map((card) => [card.slug, card.id]));
}

async function prepareTransactionData<T extends { cardSlug?: string | null }>(
  transactions: T[],
) {
  const cardIdsBySlug = await resolveCardIdsBySlug(transactions);

  return transactions.map(({ cardSlug, ...transaction }) => ({
    ...transaction,
    cardId:
      "cardId" in transaction && transaction.cardId
        ? transaction.cardId
        : cardSlug
          ? cardIdsBySlug.get(cardSlug) ?? null
          : null,
  }));
}

router.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    const transactions = await prisma.sellerTransaction.findMany({
      orderBy: {
        occurredAt: "desc",
      },
    });

    res.json({
      transactionCount: transactions.length,
      ...buildSummary(transactions),
    });
  }),
);

router.post(
  "/transactions",
  asyncHandler(async (req, res) => {
    const validatedData = sellerTransactionSchema.parse(req.body);
    const [transactionData] = await prepareTransactionData([validatedData]);

    const transaction = await prisma.sellerTransaction.create({
      data: transactionData,
    });

    res.status(201).json(transaction);
  }),
);

router.post(
  "/transactions/import",
  asyncHandler(async (req, res) => {
    const { transactions } = sellerTransactionsImportSchema.parse(req.body);
    const transactionData = await prepareTransactionData(transactions);

    const result = await prisma.sellerTransaction.createMany({
      data: transactionData,
      skipDuplicates: true,
    });

    res.status(201).json({
      imported: result.count,
    });
  }),
);

export default router;
