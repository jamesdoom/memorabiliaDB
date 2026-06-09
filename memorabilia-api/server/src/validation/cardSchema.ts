// memorabilia-api/server/src/validation/cardSchema.ts

import { z } from "zod";

export const cardSchema = z.object({
  playerName: z.string().min(1, "Player name is required"),
  sport: z.string().min(1),
  title: z.string().min(1),
  year: z.number().int().min(1800),
  manufacturer: z.string().min(1),
  cardNumber: z.string().optional().nullable(),
  series: z.string().optional().nullable(),
  imageFrontUrl: z.string().url().optional().nullable(),
  imageBackUrl: z.string().url().optional().nullable(),
  rookie: z.boolean(),
  goodConditionValue: z.number().int().optional().nullable(),
  perfectConditionValue: z.number().int().optional().nullable(),
  valueSource: z.string().optional().nullable(),
  valueSourceUrl: z.string().url().optional().nullable(),
  valueConfidence: z.number().int().min(0).max(100).optional().nullable(),
  valueNotes: z.string().optional().nullable(),
  lastValuedAt: z.coerce.date().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  quantity: z.number().int().min(1).optional(),
  location: z.string().optional().nullable(),
});

export const partialCardSchema = cardSchema.partial();

export const valuationSchema = z
  .object({
    provider: z.literal("manual").default("manual"),
    goodConditionValue: z.number().int().min(0).optional().nullable(),
    perfectConditionValue: z.number().int().min(0).optional().nullable(),
    valueSource: z.string().min(1).optional().nullable(),
    valueSourceUrl: z.string().url().optional().nullable(),
    valueConfidence: z.number().int().min(0).max(100).optional().nullable(),
    valueNotes: z.string().max(500).optional().nullable(),
  })
  .refine(
    (data) =>
      data.goodConditionValue !== undefined ||
      data.perfectConditionValue !== undefined ||
      data.valueSource !== undefined ||
      data.valueSourceUrl !== undefined ||
      data.valueConfidence !== undefined ||
      data.valueNotes !== undefined,
    {
      message: "At least one valuation field is required",
    },
  );
