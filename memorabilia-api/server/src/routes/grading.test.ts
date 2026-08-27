import request from "supertest";
import type { Express } from "express";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  card: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
  gradingSubmissionBatch: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
}));

const cardMock = prismaMock.card as {
  findMany: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

const batchMock = prismaMock.gradingSubmissionBatch as {
  create: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

let app: Express;

beforeAll(async () => {
  vi.doMock("../lib/prisma", () => ({
    prisma: {
      card: {
        aggregate: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        findMany: prismaMock.card.findMany,
        groupBy: vi.fn(),
        update: prismaMock.card.update,
      },
      gradingSubmissionBatch: prismaMock.gradingSubmissionBatch,
      sellerTransaction: {
        count: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
    },
  }));

  app = (await import("../app")).app;
});

describe("grading routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /grading/batches", () => {
    it("returns grading submission batches with cards", async () => {
      const batches = [
        {
          id: "batch-1",
          name: "PSA August",
          company: "PSA",
          cards: [{ id: "card-1", playerName: "Ken Griffey Jr." }],
        },
      ];

      batchMock.findMany.mockResolvedValue(batches);

      const response = await request(app).get("/grading/batches").expect(200);

      expect(response.body).toEqual(batches);
      expect(batchMock.findMany).toHaveBeenCalledWith({
        include: {
          cards: {
            select: {
              id: true,
              playerName: true,
              title: true,
              year: true,
              status: true,
              finalGrade: true,
              gradingCertNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });
  });

  describe("POST /grading/batches", () => {
    it("creates a grading batch", async () => {
      const batch = {
        id: "batch-1",
        name: "PSA August",
        company: "PSA",
      };

      batchMock.create.mockResolvedValue(batch);

      const response = await request(app)
        .post("/grading/batches")
        .send({
          name: "PSA August",
          company: "PSA",
          serviceLevel: "Value",
          submittedAt: "2026-08-27",
        })
        .expect(201);

      expect(response.body).toEqual(batch);
      expect(batchMock.create).toHaveBeenCalledWith({
        data: {
          name: "PSA August",
          company: "PSA",
          serviceLevel: "Value",
          submittedAt: new Date("2026-08-27"),
        },
      });
    });
  });

  describe("GET /grading/recommendations", () => {
    it("returns grading ROI recommendations", async () => {
      cardMock.findMany.mockResolvedValue([
        {
          id: "card-1",
          playerName: "Ken Griffey Jr.",
          status: "READY_TO_LIST",
          goodConditionValue: 50,
          perfectConditionValue: 250,
          gradingFeeCents: 2500,
          expectedGradedValueCents: null,
          gradingConfidence: 75,
        },
      ]);

      const response = await request(app)
        .get("/grading/recommendations")
        .expect(200);

      expect(response.body[0].roi).toEqual({
        rawValueCents: 5000,
        expectedGradedValueCents: 25000,
        gradingFeeCents: 2500,
        confidence: 75,
        grossUpsideCents: 20000,
        estimatedProfitCents: 12500,
        recommendation: "STRONG",
      });
    });
  });

  describe("PATCH /grading/batches/:id/return", () => {
    it("marks a batch returned and converts cards to graded inventory", async () => {
      const returnedAt = new Date("2026-09-20");

      batchMock.update.mockResolvedValue({
        id: "batch-1",
        returnedAt,
      });
      cardMock.update.mockResolvedValue({
        id: "card-1",
        status: "GRADED",
      });

      const response = await request(app)
        .patch("/grading/batches/batch-1/return")
        .send({
          returnedAt: "2026-09-20",
          cards: [
            {
              id: "00000000-0000-4000-8000-000000000001",
              finalGrade: "10",
              gradingCertNumber: "PSA123",
              expectedGradedValueCents: 25000,
            },
          ],
        })
        .expect(200);

      expect(response.body.cards).toEqual([{ id: "card-1", status: "GRADED" }]);
      expect(batchMock.update).toHaveBeenCalledWith({
        where: { id: "batch-1" },
        data: { returnedAt },
      });
      expect(cardMock.update).toHaveBeenCalledWith({
        where: { id: "00000000-0000-4000-8000-000000000001" },
        data: {
          status: "GRADED",
          gradingSubmissionBatchId: "batch-1",
          gradingReturnedAt: returnedAt,
          finalGrade: "10",
          gradingCertNumber: "PSA123",
          expectedGradedValueCents: 25000,
        },
      });
    });
  });
});
