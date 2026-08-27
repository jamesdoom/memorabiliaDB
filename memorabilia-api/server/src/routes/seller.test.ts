import request from "supertest";
import type { Express } from "express";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  sellerTransaction: {
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
  },
}));

const transactionMock = prismaMock.sellerTransaction as {
  create: ReturnType<typeof vi.fn>;
  createMany: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
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
        findMany: vi.fn(),
        groupBy: vi.fn(),
        update: vi.fn(),
      },
      sellerTransaction: prismaMock.sellerTransaction,
    },
  }));

  app = (await import("../app")).app;
});

describe("seller routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /seller/summary", () => {
    it("calculates seller revenue, costs, net profit, and monthly totals", async () => {
      transactionMock.findMany.mockResolvedValue([
        {
          type: "SALE",
          occurredAt: new Date("2026-08-20T12:00:00.000Z"),
          amountCents: 10000,
          marketplaceFees: 1300,
          shippingCost: 500,
          gradingCost: 0,
          suppliesCost: 200,
        },
        {
          type: "PURCHASE",
          occurredAt: new Date("2026-08-10T12:00:00.000Z"),
          amountCents: 3000,
          marketplaceFees: 0,
          shippingCost: 0,
          gradingCost: 2500,
          suppliesCost: 0,
        },
        {
          type: "SALE",
          occurredAt: new Date("2026-07-14T12:00:00.000Z"),
          amountCents: 4500,
          marketplaceFees: 550,
          shippingCost: 400,
          gradingCost: 0,
          suppliesCost: 100,
        },
      ]);

      const response = await request(app).get("/seller/summary").expect(200);

      expect(response.body).toEqual({
        transactionCount: 3,
        totals: {
          revenueCents: 14500,
          purchaseCostCents: 3000,
          marketplaceFeesCents: 1850,
          shippingCostCents: 900,
          gradingCostCents: 2500,
          suppliesCostCents: 300,
          netProfitCents: 5950,
        },
        monthly: [
          {
            month: "2026-08",
            revenueCents: 10000,
            purchaseCostCents: 3000,
            marketplaceFeesCents: 1300,
            shippingCostCents: 500,
            gradingCostCents: 2500,
            suppliesCostCents: 200,
            netProfitCents: 2500,
          },
          {
            month: "2026-07",
            revenueCents: 4500,
            purchaseCostCents: 0,
            marketplaceFeesCents: 550,
            shippingCostCents: 400,
            gradingCostCents: 0,
            suppliesCostCents: 100,
            netProfitCents: 3450,
          },
        ],
      });

      expect(transactionMock.findMany).toHaveBeenCalledWith({
        orderBy: {
          occurredAt: "desc",
        },
      });
    });
  });

  describe("POST /seller/transactions", () => {
    it("creates a seller transaction", async () => {
      const transaction = {
        id: "transaction-1",
        type: "SALE",
        amountCents: 10000,
      };

      transactionMock.create.mockResolvedValue(transaction);

      const response = await request(app)
        .post("/seller/transactions")
        .send({
          type: "SALE",
          occurredAt: "2026-08-20",
          amountCents: 10000,
          marketplaceFees: 1300,
          shippingCost: 500,
        })
        .expect(201);

      expect(response.body).toEqual(transaction);
      expect(transactionMock.create).toHaveBeenCalledWith({
        data: {
          type: "SALE",
          occurredAt: new Date("2026-08-20"),
          quantity: 1,
          amountCents: 10000,
          marketplaceFees: 1300,
          shippingCost: 500,
          gradingCost: 0,
          suppliesCost: 0,
        },
      });
    });

    it("rejects invalid transaction types", async () => {
      await request(app)
        .post("/seller/transactions")
        .send({
          type: "REFUND",
          occurredAt: "2026-08-20",
          amountCents: 10000,
        })
        .expect(400);

      expect(transactionMock.create).not.toHaveBeenCalled();
    });
  });
});
