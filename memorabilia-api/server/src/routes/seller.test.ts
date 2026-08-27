import request from "supertest";
import type { Express } from "express";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  card: {
    findMany: vi.fn(),
  },
  sellerTransaction: {
    count: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    delete: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
}));

const cardMock = prismaMock.card as {
  findMany: ReturnType<typeof vi.fn>;
};

const transactionMock = prismaMock.sellerTransaction as {
  count: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  createMany: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
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

  describe("GET /seller/transactions", () => {
    it("returns filtered seller transactions with linked card details", async () => {
      const transactions = [
        {
          id: "transaction-1",
          type: "SALE",
          occurredAt: new Date("2026-08-20T12:00:00.000Z"),
          amountCents: 10000,
          card: {
            id: "card-1",
            playerName: "Ken Griffey Jr.",
            title: "Rookie Card",
          },
        },
      ];

      transactionMock.count.mockResolvedValue(1);
      transactionMock.findMany.mockResolvedValue(transactions);

      const response = await request(app)
        .get("/seller/transactions")
        .query({
          page: "2",
          limit: "10",
          type: "SALE",
          marketplace: "eBay",
          cardId: "card-1",
        })
        .expect(200);

      expect(response.body).toEqual({
        data: [
          {
            ...transactions[0],
            occurredAt: "2026-08-20T12:00:00.000Z",
          },
        ],
        pagination: {
          totalCount: 1,
          currentPage: 2,
          pageSize: 10,
          totalPages: 1,
        },
      });
      expect(transactionMock.count).toHaveBeenCalledWith({
        where: {
          type: "SALE",
          marketplace: {
            contains: "eBay",
            mode: "insensitive",
          },
          cardId: "card-1",
        },
      });
      expect(transactionMock.findMany).toHaveBeenCalledWith({
        where: {
          type: "SALE",
          marketplace: {
            contains: "eBay",
            mode: "insensitive",
          },
          cardId: "card-1",
        },
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
        skip: 10,
        take: 10,
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
          cardId: null,
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

  describe("PATCH /seller/transactions/:id", () => {
    it("updates a seller transaction", async () => {
      const transaction = {
        id: "transaction-1",
        amountCents: 12000,
      };

      transactionMock.update.mockResolvedValue(transaction);

      const response = await request(app)
        .patch("/seller/transactions/transaction-1")
        .send({
          amountCents: 12000,
          marketplaceFees: 1500,
        })
        .expect(200);

      expect(response.body).toEqual(transaction);
      expect(transactionMock.update).toHaveBeenCalledWith({
        where: { id: "transaction-1" },
        data: {
          amountCents: 12000,
          marketplaceFees: 1500,
        },
      });
    });
  });

  describe("DELETE /seller/transactions/:id", () => {
    it("deletes a seller transaction", async () => {
      transactionMock.delete.mockResolvedValue({ id: "transaction-1" });

      const response = await request(app)
        .delete("/seller/transactions/transaction-1")
        .expect(200);

      expect(response.body).toEqual({
        message: "Transaction deleted successfully",
      });
      expect(transactionMock.delete).toHaveBeenCalledWith({
        where: { id: "transaction-1" },
      });
    });
  });

  describe("POST /seller/transactions/import", () => {
    it("imports seller transactions in a batch", async () => {
      transactionMock.createMany.mockResolvedValue({ count: 2 });

      const response = await request(app)
        .post("/seller/transactions/import")
        .send({
          transactions: [
            {
              type: "PURCHASE",
              occurredAt: "2026-08-10",
              amountCents: 3000,
              sourceFile: "purchases.csv",
            },
            {
              type: "SALE",
              occurredAt: "2026-08-20",
              amountCents: 10000,
              marketplaceFees: 1300,
              shippingCost: 500,
              sourceFile: "sales.csv",
            },
          ],
        })
        .expect(201);

      expect(response.body).toEqual({
        imported: 2,
      });
      expect(transactionMock.createMany).toHaveBeenCalledWith({
        data: [
          {
            type: "PURCHASE",
            occurredAt: new Date("2026-08-10"),
            cardId: null,
            quantity: 1,
            amountCents: 3000,
            marketplaceFees: 0,
            shippingCost: 0,
            gradingCost: 0,
            suppliesCost: 0,
            sourceFile: "purchases.csv",
          },
          {
            type: "SALE",
            occurredAt: new Date("2026-08-20"),
            cardId: null,
            quantity: 1,
            amountCents: 10000,
            marketplaceFees: 1300,
            shippingCost: 500,
            gradingCost: 0,
            suppliesCost: 0,
            sourceFile: "sales.csv",
          },
        ],
        skipDuplicates: true,
      });
    });

    it("links imported rows by card slug when provided", async () => {
      cardMock.findMany.mockResolvedValue([
        {
          id: "card-1",
          slug: "ken-griffey-jr-1989-upper-deck-rookie-card-1",
        },
      ]);
      transactionMock.createMany.mockResolvedValue({ count: 1 });

      const response = await request(app)
        .post("/seller/transactions/import")
        .send({
          transactions: [
            {
              type: "SALE",
              occurredAt: "2026-08-20",
              amountCents: 10000,
              cardSlug: "ken-griffey-jr-1989-upper-deck-rookie-card-1",
            },
          ],
        })
        .expect(201);

      expect(response.body).toEqual({
        imported: 1,
      });
      expect(transactionMock.createMany).toHaveBeenCalledWith({
        data: [
          {
            type: "SALE",
            occurredAt: new Date("2026-08-20"),
            cardId: "card-1",
            quantity: 1,
            amountCents: 10000,
            marketplaceFees: 0,
            shippingCost: 0,
            gradingCost: 0,
            suppliesCost: 0,
          },
        ],
        skipDuplicates: true,
      });
    });
  });
});
