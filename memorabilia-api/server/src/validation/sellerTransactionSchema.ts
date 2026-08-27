import { z } from "zod";

export const sellerTransactionTypeSchema = z.enum(["PURCHASE", "SALE"]);

export const sellerTransactionSchema = z.object({
  cardId: z.string().uuid().optional().nullable(),
  cardSlug: z.string().min(1).optional().nullable(),
  type: sellerTransactionTypeSchema,
  occurredAt: z.coerce.date(),
  quantity: z.number().int().min(1).default(1),
  amountCents: z.number().int().min(0),
  marketplace: z.string().max(100).optional().nullable(),
  orderId: z.string().max(100).optional().nullable(),
  marketplaceFees: z.number().int().min(0).default(0),
  shippingCost: z.number().int().min(0).default(0),
  gradingCost: z.number().int().min(0).default(0),
  suppliesCost: z.number().int().min(0).default(0),
  notes: z.string().max(500).optional().nullable(),
  sourceFile: z.string().max(255).optional().nullable(),
});

export const sellerTransactionsImportSchema = z.object({
  transactions: z.array(sellerTransactionSchema).min(1),
});
