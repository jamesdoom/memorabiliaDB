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

function startOfYear(year: number) {
  return new Date(Date.UTC(year, 0, 1));
}

function startOfNextYear(year: number) {
  return new Date(Date.UTC(year + 1, 0, 1));
}

function startOfMonth(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthIndex - 1, 1));
}

function startOfNextMonth(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthIndex, 1));
}

function buildReportWhere(query: { year?: unknown; month?: unknown }) {
  const year = Number(query.year) || new Date().getUTCFullYear();
  const month = typeof query.month === "string" ? query.month : undefined;
  const dateFilter = month
    ? {
        gte: startOfMonth(month),
        lt: startOfNextMonth(month),
      }
    : {
        gte: startOfYear(year),
        lt: startOfNextYear(year),
      };

  return {
    label: month ?? String(year),
    year,
    month,
    where: {
      occurredAt: dateFilter,
    } satisfies Prisma.SellerTransactionWhereInput,
  };
}

function escapeCsv(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function buildSummary(
  transactions: Array<{
    type: "PURCHASE" | "SALE" | "REFUND" | "RETURN" | "ADJUSTMENT";
    occurredAt: Date;
    amountCents: number;
    costBasisCents: number;
    marketplace: string | null;
    marketplaceFees: number;
    shippingCost: number;
    gradingCost: number;
    suppliesCost: number;
    card: {
      id: string;
      playerName: string;
      title: string;
      year: number;
      manufacturer: string;
    } | null;
  }>,
) {
  type ProfitBucket = {
    revenueCents: number;
    refundCents: number;
    adjustmentCents: number;
    purchaseSpendCents: number;
    realizedCostBasisCents: number;
    marketplaceFeesCents: number;
    shippingCostCents: number;
    gradingCostCents: number;
    suppliesCostCents: number;
    netProfitCents: number;
  };

  function emptyBucket(): ProfitBucket {
    return {
      revenueCents: 0,
      refundCents: 0,
      adjustmentCents: 0,
      purchaseSpendCents: 0,
      realizedCostBasisCents: 0,
      marketplaceFeesCents: 0,
      shippingCostCents: 0,
      gradingCostCents: 0,
      suppliesCostCents: 0,
      netProfitCents: 0,
    };
  }

  function applyTransaction(bucket: ProfitBucket, transaction: (typeof transactions)[number]) {
    if (transaction.type === "SALE") {
      bucket.revenueCents += transaction.amountCents;
      bucket.realizedCostBasisCents += transaction.costBasisCents;
    }

    if (transaction.type === "PURCHASE") {
      bucket.purchaseSpendCents += transaction.amountCents;
    }

    if (transaction.type === "REFUND" || transaction.type === "RETURN") {
      bucket.refundCents += transaction.amountCents;
      bucket.realizedCostBasisCents -= transaction.costBasisCents;
    }

    if (transaction.type === "ADJUSTMENT") {
      bucket.adjustmentCents += transaction.amountCents;
    }

    bucket.marketplaceFeesCents += transaction.marketplaceFees;
    bucket.shippingCostCents += transaction.shippingCost;
    bucket.gradingCostCents += transaction.gradingCost;
    bucket.suppliesCostCents += transaction.suppliesCost;
  }

  function finalizeBucket(bucket: ProfitBucket) {
    bucket.netProfitCents =
      bucket.revenueCents -
      bucket.refundCents +
      bucket.adjustmentCents -
      bucket.realizedCostBasisCents -
      bucket.marketplaceFeesCents -
      bucket.shippingCostCents -
      bucket.gradingCostCents -
      bucket.suppliesCostCents;
  }

  const monthly = new Map<
    string,
    ProfitBucket & {
      month: string;
    }
  >();

  const byMarketplace = new Map<string, ProfitBucket & { marketplace: string }>();
  const byCard = new Map<
    string,
    ProfitBucket & {
      cardId: string;
      playerName: string;
      title: string;
      year: number;
      manufacturer: string;
    }
  >();

  const totals = emptyBucket();

  for (const transaction of transactions) {
    const month = toMonthKey(transaction.occurredAt);
    const monthlyTotals =
      monthly.get(month) ??
      {
        month,
        ...emptyBucket(),
      };
    const marketplaceName = transaction.marketplace ?? "Unassigned";
    const marketplaceTotals =
      byMarketplace.get(marketplaceName) ??
      {
        marketplace: marketplaceName,
        ...emptyBucket(),
      };

    applyTransaction(totals, transaction);
    applyTransaction(monthlyTotals, transaction);
    applyTransaction(marketplaceTotals, transaction);

    monthly.set(month, monthlyTotals);
    byMarketplace.set(marketplaceName, marketplaceTotals);

    if (transaction.card) {
      const cardTotals =
        byCard.get(transaction.card.id) ??
        {
          cardId: transaction.card.id,
          playerName: transaction.card.playerName,
          title: transaction.card.title,
          year: transaction.card.year,
          manufacturer: transaction.card.manufacturer,
          ...emptyBucket(),
        };

      applyTransaction(cardTotals, transaction);
      byCard.set(transaction.card.id, cardTotals);
    }
  }

  finalizeBucket(totals);

  for (const month of monthly.values()) {
    finalizeBucket(month);
  }

  for (const marketplace of byMarketplace.values()) {
    finalizeBucket(marketplace);
  }

  for (const card of byCard.values()) {
    finalizeBucket(card);
  }

  return {
    totals,
    monthly: Array.from(monthly.values()).sort((a, b) =>
      b.month.localeCompare(a.month),
    ),
    byMarketplace: Array.from(byMarketplace.values()).sort(
      (a, b) => b.netProfitCents - a.netProfitCents,
    ),
    byCard: Array.from(byCard.values()).sort(
      (a, b) => b.netProfitCents - a.netProfitCents,
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
      include: {
        card: {
          select: {
            id: true,
            playerName: true,
            title: true,
            year: true,
            manufacturer: true,
          },
        },
      },
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
  "/reports",
  asyncHandler(async (req, res) => {
    const report = buildReportWhere(req.query);
    const transactions = await prisma.sellerTransaction.findMany({
      where: report.where,
      include: {
        card: {
          select: {
            id: true,
            playerName: true,
            title: true,
            year: true,
            manufacturer: true,
          },
        },
      },
      orderBy: {
        occurredAt: "desc",
      },
    });

    res.json({
      label: report.label,
      year: report.year,
      month: report.month,
      transactionCount: transactions.length,
      ...buildSummary(transactions),
    });
  }),
);

router.get(
  "/reports/export.csv",
  asyncHandler(async (req, res) => {
    const report = buildReportWhere(req.query);
    const transactions = await prisma.sellerTransaction.findMany({
      where: report.where,
      include: {
        card: {
          select: {
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
        occurredAt: "asc",
      },
    });

    const rows = [
      [
        "date",
        "type",
        "marketplace",
        "orderId",
        "cardSlug",
        "card",
        "quantity",
        "lotName",
        "lotCardCount",
        "revenue",
        "refund",
        "adjustment",
        "costOfGoodsSold",
        "marketplaceFees",
        "shipping",
        "supplies",
        "grading",
        "net",
        "notes",
      ],
      ...transactions.map((transaction) => {
        const isSale = transaction.type === "SALE";
        const isRefund =
          transaction.type === "REFUND" || transaction.type === "RETURN";
        const isAdjustment = transaction.type === "ADJUSTMENT";
        const revenue = isSale ? transaction.amountCents : 0;
        const refund = isRefund ? transaction.amountCents : 0;
        const adjustment = isAdjustment ? transaction.amountCents : 0;
        const costOfGoodsSold = isSale
          ? transaction.costBasisCents
          : isRefund
            ? -transaction.costBasisCents
            : 0;
        const net =
          revenue -
          refund +
          adjustment -
          costOfGoodsSold -
          transaction.marketplaceFees -
          transaction.shippingCost -
          transaction.suppliesCost -
          transaction.gradingCost;
        const card = transaction.card
          ? `${transaction.card.playerName} ${transaction.card.year} ${transaction.card.title}`
          : "";

        return [
          transaction.occurredAt.toISOString().slice(0, 10),
          transaction.type,
          transaction.marketplace,
          transaction.orderId,
          transaction.card?.slug,
          card,
          transaction.quantity,
          transaction.lotName,
          transaction.lotCardCount,
          (revenue / 100).toFixed(2),
          (refund / 100).toFixed(2),
          (adjustment / 100).toFixed(2),
          (costOfGoodsSold / 100).toFixed(2),
          (transaction.marketplaceFees / 100).toFixed(2),
          (transaction.shippingCost / 100).toFixed(2),
          (transaction.suppliesCost / 100).toFixed(2),
          (transaction.gradingCost / 100).toFixed(2),
          (net / 100).toFixed(2),
          transaction.notes,
        ];
      }),
    ];

    const csv = rows
      .map((row) => row.map((value) => escapeCsv(value)).join(","))
      .join("\n");

    res.header("Content-Type", "text/csv; charset=utf-8");
    res.header(
      "Content-Disposition",
      `attachment; filename="seller-report-${report.label}.csv"`,
    );
    res.send(csv);
  }),
);

router.get(
  "/transactions",
  asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
    const type =
      req.query.type === "PURCHASE" ||
      req.query.type === "SALE" ||
      req.query.type === "REFUND" ||
      req.query.type === "RETURN" ||
      req.query.type === "ADJUSTMENT"
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
