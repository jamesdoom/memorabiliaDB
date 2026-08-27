import { z } from "zod";

export const sellerTransactionTypeSchema = z.enum([
  "PURCHASE",
  "SALE",
  "REFUND",
  "RETURN",
  "ADJUSTMENT",
]);

const sellerTransactionFields = {
  cardId: z.string().uuid().optional().nullable(),
  cardSlug: z.string().min(1).optional().nullable(),
  type: sellerTransactionTypeSchema,
  occurredAt: z.coerce.date(),
  quantity: z.number().int().min(1),
  amountCents: z.number().int().min(0),
  costBasisCents: z.number().int().min(0),
  lotName: z.string().max(120).optional().nullable(),
  lotCardCount: z.number().int().min(1).optional().nullable(),
  marketplace: z.string().max(100).optional().nullable(),
  orderId: z.string().max(100).optional().nullable(),
  marketplaceFees: z.number().int().min(0),
  shippingCost: z.number().int().min(0),
  gradingCost: z.number().int().min(0),
  suppliesCost: z.number().int().min(0),
  notes: z.string().max(500).optional().nullable(),
  sourceFile: z.string().max(255).optional().nullable(),
};

export const sellerTransactionSchema = z.object({
  ...sellerTransactionFields,
  quantity: sellerTransactionFields.quantity.default(1),
  marketplaceFees: sellerTransactionFields.marketplaceFees.default(0),
  costBasisCents: sellerTransactionFields.costBasisCents.default(0),
  shippingCost: sellerTransactionFields.shippingCost.default(0),
  gradingCost: sellerTransactionFields.gradingCost.default(0),
  suppliesCost: sellerTransactionFields.suppliesCost.default(0),
});

export const sellerTransactionsImportSchema = z.object({
  transactions: z.array(sellerTransactionSchema).min(1),
});

export const partialSellerTransactionSchema = z
  .object(sellerTransactionFields)
  .partial();
