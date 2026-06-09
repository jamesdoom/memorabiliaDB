import request from "supertest";
import type { Express } from "express";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  card: {
    aggregate: vi.fn(),
    count: vi.fn(),
    findMany: vi.fn(),
    groupBy: vi.fn(),
    update: vi.fn(),
  },
}));

const cardMock = prismaMock.card as {
  aggregate: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  groupBy: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

let app: Express;

beforeAll(async () => {
  vi.doMock("../lib/prisma", () => ({
    prisma: {
      card: prismaMock.card,
    },
  }));

  app = (await import("../app")).app;
});

describe("cards routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /cards", () => {
    it("returns paginated cards with filters and summary", async () => {
      const cards = [
        {
          id: "card-1",
          playerName: "Ken Griffey Jr.",
          title: "Rookie Card",
          year: 1989,
          manufacturer: "Upper Deck",
          status: "NEW",
        },
      ];

      cardMock.count.mockResolvedValue(12);
      cardMock.findMany.mockResolvedValue(cards);
      cardMock.groupBy.mockResolvedValue([
        { status: "NEW", _count: { status: 10 } },
        { status: "LISTED", _count: { status: 2 } },
      ]);
      cardMock.aggregate.mockResolvedValue({
        _sum: {
          goodConditionValue: 500,
          perfectConditionValue: 1200,
        },
        _avg: {
          goodConditionValue: 42,
          perfectConditionValue: 100,
        },
      });

      const response = await request(app)
        .get("/cards")
        .query({
          page: "2",
          limit: "5",
          manufacturer: "Upper",
          playerName: "Griffey",
          status: "NEW",
          yearMin: "1988",
          yearMax: "1990",
          sortBy: "year",
          order: "desc",
        })
        .expect(200);

      expect(response.body).toEqual({
        data: cards,
        pagination: {
          totalCount: 12,
          currentPage: 2,
          pageSize: 5,
          totalPages: 3,
        },
        summary: {
          totalCards: 12,
          totalGoodConditionValue: 500,
          totalPerfectConditionValue: 1200,
          averageGoodConditionValue: 42,
          averagePerfectConditionValue: 100,
          statusCounts: [
            { status: "NEW", _count: { status: 10 } },
            { status: "LISTED", _count: { status: 2 } },
          ],
        },
      });

      const expectedWhere = {
        manufacturer: {
          contains: "Upper",
          mode: "insensitive",
        },
        playerName: {
          contains: "Griffey",
          mode: "insensitive",
        },
        status: "NEW",
        year: {
          gte: 1988,
          lte: 1990,
        },
      };

      expect(cardMock.count).toHaveBeenCalledWith({ where: expectedWhere });
      expect(cardMock.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        skip: 5,
        take: 5,
        orderBy: {
          year: "desc",
        },
      });
    });
  });

  describe("GET /cards/recommendations", () => {
    it("returns grade and sell-raw recommendation buckets", async () => {
      const gradeCards = [{ id: "grade-1", gradingProfitPotential: 250 }];
      const sellRawCards = [{ id: "sell-1", goodConditionValue: 35 }];

      cardMock.findMany
        .mockResolvedValueOnce(gradeCards)
        .mockResolvedValueOnce(sellRawCards);

      const response = await request(app)
        .get("/cards/recommendations")
        .expect(200);

      expect(response.body).toEqual({
        grade: gradeCards,
        sellRaw: sellRawCards,
      });
      expect(cardMock.findMany).toHaveBeenNthCalledWith(1, {
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
      expect(cardMock.findMany).toHaveBeenNthCalledWith(2, {
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
    });
  });

  describe("PATCH /cards/:id/status", () => {
    it("updates a card status", async () => {
      const updatedCard = {
        id: "card-1",
        status: "LISTED",
      };

      cardMock.update.mockResolvedValue(updatedCard);

      const response = await request(app)
        .patch("/cards/card-1/status")
        .send({ status: "LISTED" })
        .expect(200);

      expect(response.body).toEqual(updatedCard);
      expect(cardMock.update).toHaveBeenCalledWith({
        where: { id: "card-1" },
        data: { status: "LISTED" },
      });
    });

    it("rejects invalid card statuses", async () => {
      const response = await request(app)
        .patch("/cards/card-1/status")
        .send({ status: "SOLD" })
        .expect(400);

      expect(response.body).toEqual({ error: "Invalid status" });
      expect(cardMock.update).not.toHaveBeenCalled();
    });
  });

  describe("PATCH /cards/:id/valuation", () => {
    it("updates card valuation metadata", async () => {
      const updatedCard = {
        id: "card-1",
        goodConditionValue: 75,
        perfectConditionValue: 225,
        valueSource: "Manual estimate",
        valueConfidence: 80,
      };

      cardMock.update.mockResolvedValue(updatedCard);

      const response = await request(app)
        .patch("/cards/card-1/valuation")
        .send({
          provider: "manual",
          goodConditionValue: 75,
          perfectConditionValue: 225,
          valueConfidence: 80,
          valueNotes: "Checked recent comps manually",
        })
        .expect(200);

      expect(response.body).toEqual(updatedCard);
      expect(cardMock.update).toHaveBeenCalledWith({
        where: { id: "card-1" },
        data: {
          goodConditionValue: 75,
          perfectConditionValue: 225,
          lastValuedAt: expect.any(Date),
          valueConfidence: 80,
          valueNotes: "Checked recent comps manually",
          valueSource: "Manual estimate",
        },
      });
    });

    it("rejects valuation confidence outside 0 to 100", async () => {
      await request(app)
        .patch("/cards/card-1/valuation")
        .send({
          valueConfidence: 101,
        })
        .expect(400);

      expect(cardMock.update).not.toHaveBeenCalled();
    });
  });
});
