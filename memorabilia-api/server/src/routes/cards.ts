// memorabilia-api/server/src/routes/cards.ts

import { Router } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import {
  cardSchema,
  cardStatusSchema,
  partialCardSchema,
  valuationSchema,
} from "../validation/cardSchema";
import { buildValuationUpdate } from "../services/valuationService";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const STALE_LISTING_DAYS = 45;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysSince(date: Date | string | null | undefined) {
  if (!date) return null;

  const timestamp = new Date(date).getTime();
  if (Number.isNaN(timestamp)) return null;

  return Math.max(0, Math.floor((Date.now() - timestamp) / MS_PER_DAY));
}

function buildPriceReduction(card: {
  status: string;
  listedAt?: Date | string | null;
  askingPriceCents?: number | null;
  goodConditionValue?: number | null;
}) {
  const listingAgeDays = daysSince(card.listedAt);

  if (card.status !== "LISTED" || listingAgeDays === null) {
    return null;
  }

  const currentPriceCents =
    card.askingPriceCents ?? (card.goodConditionValue ?? 0) * 100;

  if (listingAgeDays < STALE_LISTING_DAYS || currentPriceCents <= 0) {
    return null;
  }

  const reductionPercent =
    listingAgeDays >= 180 ? 20 : listingAgeDays >= 90 ? 15 : 10;

  return {
    listingAgeDays,
    currentPriceCents,
    reductionPercent,
    recommendedPriceCents: Math.round(
      currentPriceCents * (1 - reductionPercent / 100),
    ),
  };
}

function enrichCardForOperations<T extends {
  createdAt?: Date | string;
  listedAt?: Date | string | null;
  status: string;
  askingPriceCents?: number | null;
  goodConditionValue?: number | null;
}>(card: T) {
  return {
    ...card,
    inventoryAgeDays: daysSince(card.createdAt),
    listingAgeDays: daysSince(card.listedAt),
    priceReductionRecommendation: buildPriceReduction(card),
  };
}

function createCardSlug(card: {
  playerName: string;
  year: number;
  manufacturer: string;
  title: string;
  cardNumber?: string | null;
}) {
  return [
    card.playerName,
    card.year,
    card.manufacturer,
    card.title,
    card.cardNumber,
  ]
    .filter((part) => part !== null && part !== undefined && part !== "")
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// --------------------
// SUMMARY (still exists for now)
// --------------------
router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const [totalCards, staleListingCount] = await Promise.all([
      prisma.card.count(),
      prisma.card.count({
        where: {
          status: "LISTED",
          listedAt: {
            lte: new Date(Date.now() - STALE_LISTING_DAYS * MS_PER_DAY),
          },
        },
      }),
    ]);

    const statusCounts = await prisma.card.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    const [aggregate, valuedCount, valuationAggregate] = await Promise.all([
      prisma.card.aggregate({
        _sum: {
          goodConditionValue: true,
          perfectConditionValue: true,
        },
        _avg: {
          goodConditionValue: true,
          perfectConditionValue: true,
        },
      }),
      prisma.card.count({
        where: {
          lastValuedAt: {
            not: null,
          },
        } as any,
      }),
      prisma.card.aggregate({
        where: {
          lastValuedAt: {
            not: null,
          },
        } as any,
        _avg: {
          valueConfidence: true,
        } as any,
        _max: {
          lastValuedAt: true,
        } as any,
      } as any),
    ]);

    res.json({
      totalCards,
      totalGoodConditionValue: aggregate._sum.goodConditionValue ?? 0,
      totalPerfectConditionValue: aggregate._sum.perfectConditionValue ?? 0,
      averageGoodConditionValue: aggregate._avg.goodConditionValue ?? 0,
      averagePerfectConditionValue: aggregate._avg.perfectConditionValue ?? 0,
      valuedCards: valuedCount,
      missingValuations: totalCards - valuedCount,
      averageValueConfidence:
        (valuationAggregate._avg as any).valueConfidence ?? 0,
      latestValuedAt: (valuationAggregate._max as any).lastValuedAt ?? null,
      staleListingCount,
      statusCounts,
    });
  }),
);

// --------------------
// TOP CARDS
// --------------------
router.get(
  "/top",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 5, 20);

    const type = req.query.type === "perfect" ? "perfect" : "good";

    const sortField =
      type === "perfect" ? "perfectConditionValue" : "goodConditionValue";

    const cards = await prisma.card.findMany({
      orderBy: {
        [sortField]: "desc",
      },
      take: limit,
      where: {
        [sortField]: {
          not: null,
        },
      },
    });

    res.json(cards);
  }),
);

// --------------------
// RECOMMENDATIONS
// --------------------
router.get(
  "/recommendations",
  asyncHandler(async (req, res) => {
    const cardsToGrade = await prisma.card.findMany({
      where: {
        gradingRecommendation: {
          in: ["YES", "MAYBE"],
        },
        status: {
          in: ["NEW", "READY_TO_LIST"],
        },
      },
      orderBy: {
        gradingProfitPotential: "desc",
      },
      take: 10,
    });

    const cardsToSellRaw = await prisma.card.findMany({
      where: {
        gradingRecommendation: "NO",
        status: {
          in: ["NEW", "READY_TO_LIST"],
        },
        goodConditionValue: {
          gt: 0,
        },
      },
      orderBy: {
        goodConditionValue: "desc",
      },
      take: 20,
    });

    res.json({
      grade: cardsToGrade,
      sellRaw: cardsToSellRaw,
    });
  }),
);

// --------------------
// GET ALL (optimized)
// --------------------
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

    const allowedSortFields = [
      "year",
      "goodConditionValue",
      "perfectConditionValue",
      "lastValuedAt",
      "createdAt",
      "importOrder",
    ];

    const sortBy = allowedSortFields.includes(req.query.sortBy as string)
      ? (req.query.sortBy as string)
      : "importOrder";

    const order = req.query.order === "desc" ? "desc" : "asc";

    // --------------------
    // Filters
    // --------------------
    const manufacturer = req.query.manufacturer
      ? String(req.query.manufacturer)
      : undefined;

    const location = req.query.location
      ? String(req.query.location)
      : undefined;
    const locationType = req.query.locationType
      ? String(req.query.locationType)
      : undefined;

    const playerName = req.query.playerName
      ? String(req.query.playerName)
      : undefined;

    const yearMin = req.query.yearMin ? Number(req.query.yearMin) : undefined;
    const yearMax = req.query.yearMax ? Number(req.query.yearMax) : undefined;

    const status = req.query.status ? String(req.query.status) : undefined;
    const valuationStatus = req.query.valuationStatus
      ? String(req.query.valuationStatus)
      : undefined;
    const listingHealth = req.query.listingHealth
      ? String(req.query.listingHealth)
      : undefined;

    const where: Prisma.CardWhereInput & Record<string, unknown> = {};

    if (status) {
      where.status = status as any;
    }

    if (locationType) {
      where.locationType = locationType as any;
    }

    if (valuationStatus === "needs") {
      where.lastValuedAt = null;
    }

    if (valuationStatus === "valued") {
      where.lastValuedAt = {
        not: null,
      };
    }

    if (listingHealth === "stale") {
      where.status = "LISTED";
      where.listedAt = {
        lte: new Date(Date.now() - STALE_LISTING_DAYS * MS_PER_DAY),
      };
    }

    if (manufacturer) {
      where.manufacturer = {
        contains: manufacturer,
        mode: "insensitive",
      };
    }

    if (location) {
      where.OR = [
        {
          location: {
            contains: location,
            mode: "insensitive",
          },
        },
        {
          locationDetail: {
            contains: location,
            mode: "insensitive",
          },
        },
        {
          consignmentPartner: {
            contains: location,
            mode: "insensitive",
          },
        },
        {
          gradingSubmissionBatch: {
            contains: location,
            mode: "insensitive",
          },
        },
      ];
    }

    if (playerName) {
      where.playerName = {
        contains: playerName,
        mode: "insensitive",
      };
    }

    if (yearMin !== undefined || yearMax !== undefined) {
      where.year = {};
      if (yearMin !== undefined) where.year.gte = yearMin;
      if (yearMax !== undefined) where.year.lte = yearMax;
    }

    const [
      totalCount,
      cards,
      statusCounts,
      aggregate,
      valuedCount,
      valuationAggregate,
      staleListingCount,
    ] = await Promise.all([
      prisma.card.count({ where }),

      prisma.card.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [sortBy]: order,
        },
      }),

      prisma.card.groupBy({
        by: ["status"],
        _count: {
          status: true,
        },
      }),

      prisma.card.aggregate({
        _sum: {
          goodConditionValue: true,
          perfectConditionValue: true,
        },
        _avg: {
          goodConditionValue: true,
          perfectConditionValue: true,
        },
      }),

      prisma.card.count({
        where: {
          ...where,
          lastValuedAt: {
            not: null,
          },
        } as any,
      }),

      prisma.card.aggregate({
        where: {
          ...where,
          lastValuedAt: {
            not: null,
          },
        } as any,
        _avg: {
          valueConfidence: true,
        } as any,
        _max: {
          lastValuedAt: true,
        } as any,
      } as any),

      prisma.card.count({
        where: {
          ...where,
          status: "LISTED",
          listedAt: {
            lte: new Date(Date.now() - STALE_LISTING_DAYS * MS_PER_DAY),
          },
        } as any,
      }),
    ]);

    res.json({
      data: cards.map(enrichCardForOperations),
      pagination: {
        totalCount,
        currentPage: page,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: {
        totalCards: totalCount,
        totalGoodConditionValue: aggregate._sum.goodConditionValue ?? 0,
        totalPerfectConditionValue: aggregate._sum.perfectConditionValue ?? 0,
        averageGoodConditionValue: aggregate._avg.goodConditionValue ?? 0,
        averagePerfectConditionValue: aggregate._avg.perfectConditionValue ?? 0,
        statusCounts,
        valuedCards: valuedCount,
        missingValuations: totalCount - valuedCount,
        averageValueConfidence:
          (valuationAggregate._avg as any).valueConfidence ?? 0,
        latestValuedAt: (valuationAggregate._max as any).lastValuedAt ?? null,
        staleListingCount,
      },
    });
  }),
);

// --------------------
// UPDATE VALUATION
// --------------------
router.patch(
  "/:id/valuation",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const validatedData = valuationSchema.parse(req.body);
    const valuationUpdate = buildValuationUpdate(validatedData);

    const updatedCard = await prisma.card.update({
      where: { id },
      data: valuationUpdate,
    });

    res.json(updatedCard);
  }),
);

// --------------------
// GET ONE
// --------------------
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);

    const card = await prisma.card.findUnique({
      where: { id },
    });

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    res.json(card);
  }),
);

// --------------------
// CREATE
// --------------------
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const validatedData = cardSchema.parse(req.body);
    const slug = createCardSlug(validatedData);

    const card = await prisma.card.create({
      data: {
        ...validatedData,
        slug,
      },
    });

    res.status(201).json(card);
  }),
);

// --------------------
// UPDATE
// --------------------
router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);

    const validatedData = partialCardSchema.parse(req.body);

    const updatedCard = await prisma.card.update({
      where: { id },
      data: validatedData,
    });

    res.json(updatedCard);
  }),
);

// --------------------
// UPDATE STATUS
// --------------------
router.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const { status } = req.body;

    const parsedStatus = cardStatusSchema.safeParse(status);

    if (!parsedStatus.success) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updated = await prisma.card.update({
      where: { id },
      data: { status: parsedStatus.data },
    });

    res.json(updated);
  }),
);

// --------------------
// DELETE
// --------------------
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);

    await prisma.card.delete({
      where: { id },
    });

    res.json({ message: "Card deleted successfully" });
  }),
);

export default router;
