// memorabilia-api/server/src/routes/cards.ts

import { Router } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { cardSchema, partialCardSchema } from "../validation/cardSchema";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// --------------------
// SUMMARY (still exists for now)
// --------------------
router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const totalCards = await prisma.card.count();

    const statusCounts = await prisma.card.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    const aggregate = await prisma.card.aggregate({
      _sum: {
        goodConditionValue: true,
        perfectConditionValue: true,
      },
      _avg: {
        goodConditionValue: true,
        perfectConditionValue: true,
      },
    });

    res.json({
      totalCards,
      totalGoodConditionValue: aggregate._sum.goodConditionValue ?? 0,
      totalPerfectConditionValue: aggregate._sum.perfectConditionValue ?? 0,
      averageGoodConditionValue: aggregate._avg.goodConditionValue ?? 0,
      averagePerfectConditionValue: aggregate._avg.perfectConditionValue ?? 0,
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
        status: "NEW",
      },
      orderBy: {
        gradingProfitPotential: "desc",
      },
      take: 10,
    });

    const cardsToSellRaw = await prisma.card.findMany({
      where: {
        gradingRecommendation: "NO",
        status: "NEW",
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

    const playerName = req.query.playerName
      ? String(req.query.playerName)
      : undefined;

    const yearMin = req.query.yearMin ? Number(req.query.yearMin) : undefined;
    const yearMax = req.query.yearMax ? Number(req.query.yearMax) : undefined;

    const status = req.query.status ? String(req.query.status) : undefined;

    const where: Prisma.CardWhereInput = {};

    if (status) {
      where.status = status as any;
    }

    if (manufacturer) {
      where.manufacturer = {
        contains: manufacturer,
        mode: "insensitive",
      };
    }

    if (location) {
      where.location = location;
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

    const [totalCount, cards, statusCounts, aggregate] = await Promise.all([
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
    ]);

    res.json({
      data: cards,
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
      },
    });
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

    const slug =
      `${validatedData.playerName}-${validatedData.year}-${validatedData.manufacturer}`
        .toLowerCase()
        .replace(/\s+/g, "-");

    const card = await prisma.card.create({
      data: {
        ...validatedData,
        slug,
      },
    });

    res.json(card);
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

    if (!["NEW", "LISTED", "GRADED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updated = await prisma.card.update({
      where: { id },
      data: { status },
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
