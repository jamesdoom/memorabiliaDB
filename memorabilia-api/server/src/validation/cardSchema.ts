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
  serialNumber: z.string().optional().nullable(),
  quantity: z.number().int().min(1).optional(),
  location: z.string().optional().nullable(),
});

export const partialCardSchema = cardSchema.partial();
