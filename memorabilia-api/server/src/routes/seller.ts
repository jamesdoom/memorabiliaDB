import { Router } from "express";
import { Prisma, SellerTransactionType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  partialSellerTransactionSchema,
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
  options: { defaultUnlinkedCard?: boolean } = {},
) {
  const cardIdsBySlug = await resolveCardIdsBySlug(transactions);

  return transactions.map(({ cardSlug, ...transaction }) => {
    const data = { ...transaction };

    if ("cardId" in transaction && transaction.cardId) {
      return {
        ...data,
        cardId: transaction.cardId,
      };
    }

    if (cardSlug) {
      return {
        ...data,
        cardId: cardIdsBySlug.get(cardSlug) ?? null,
      };
    }

    if (options.defaultUnlinkedCard) {
      return {
        ...data,
        cardId: null,
      };
    }

    return data;
  });
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

router.get(
  "/transactions",
  asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
    const type =
      req.query.type === "PURCHASE" || req.query.type === "SALE"
        ? (req.query.type as SellerTransactionType)
        : undefined;
    const marketplace = req.query.marketplace
      ? String(req.query.marketplace)
      : undefined;
    const cardId = req.query.cardId ? String(req.query.cardId) : undefined;

    const where: Prisma.SellerTransactionWhereInput = {
      ...(type ? { type } : {}),
      ...(marketplace
        ? {
            marketplace: {
              contains: marketplace,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(cardId ? { cardId } : {}),
    };

    const [totalCount, transactions] = await Promise.all([
      prisma.sellerTransaction.count({ where }),
      prisma.sellerTransaction.findMany({
        where,
        include: {
          card: {
            select: {
              id: true,
              slug: true,
              playerName: true,
              title: true,
              year: true,
              manufacturer: true,
              cardNumber: true,
            },
          },
        },
        orderBy: {
          occurredAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.json({
      data: transactions,
      pagination: {
        totalCount,
        currentPage: page,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  }),
);

router.post(
  "/transactions",
  asyncHandler(async (req, res) => {
    const validatedData = sellerTransactionSchema.parse(req.body);
    const [transactionData] = await prepareTransactionData([validatedData], {
      defaultUnlinkedCard: true,
    });

    const transaction = await prisma.sellerTransaction.create({
      data: transactionData,
    });

    res.status(201).json(transaction);
  }),
);

router.patch(
  "/transactions/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const validatedData = partialSellerTransactionSchema.parse(req.body);
    const [transactionData] = await prepareTransactionData([validatedData]);

    const transaction = await prisma.sellerTransaction.update({
      where: { id },
      data: transactionData,
    });

    res.json(transaction);
  }),
);

router.delete(
  "/transactions/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);

    await prisma.sellerTransaction.delete({
      where: { id },
    });

    res.json({ message: "Transaction deleted successfully" });
  }),
);

router.post(
  "/transactions/import",
  asyncHandler(async (req, res) => {
    const { transactions } = sellerTransactionsImportSchema.parse(req.body);
    const transactionData = await prepareTransactionData(transactions, {
      defaultUnlinkedCard: true,
    });

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
