import { z } from "zod";
import { gradingCompanySchema } from "./cardSchema";

export const gradingBatchSchema = z.object({
  name: z.string().min(1).max(120),
  company: gradingCompanySchema,
  serviceLevel: z.string().max(120).optional().nullable(),
  submittedAt: z.coerce.date().optional().nullable(),
  returnedAt: z.coerce.date().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const partialGradingBatchSchema = gradingBatchSchema.partial();

export const gradingCardUpdateSchema = z.object({
  gradingSubmissionBatchId: z.string().uuid().optional().nullable(),
  gradingCompany: gradingCompanySchema.optional().nullable(),
  gradingServiceLevel: z.string().max(120).optional().nullable(),
  gradingSubmittedAt: z.coerce.date().optional().nullable(),
  gradingReturnedAt: z.coerce.date().optional().nullable(),
  gradingFeeCents: z.number().int().min(0).optional().nullable(),
  gradingCertNumber: z.string().max(120).optional().nullable(),
  finalGrade: z.string().max(40).optional().nullable(),
  expectedGradedValueCents: z.number().int().min(0).optional().nullable(),
  gradingConfidence: z.number().int().min(0).max(100).optional().nullable(),
});

export const returnGradingBatchSchema = z.object({
  returnedAt: z.coerce.date().default(() => new Date()),
  cards: z.array(
    z.object({
      id: z.string().uuid(),
      finalGrade: z.string().max(40).optional().nullable(),
      gradingCertNumber: z.string().max(120).optional().nullable(),
      expectedGradedValueCents: z.number().int().min(0).optional().nullable(),
    }),
  ),
});
