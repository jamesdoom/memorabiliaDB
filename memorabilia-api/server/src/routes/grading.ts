import { Router } from "express";
import { prisma } from "../lib/prisma";
import {
  gradingBatchSchema,
  gradingCardUpdateSchema,
  partialGradingBatchSchema,
  returnGradingBatchSchema,
} from "../validation/gradingSchema";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

function estimateGradingRoi(card: {
  goodConditionValue: number | null;
  perfectConditionValue: number | null;
  gradingFeeCents: number | null;
  expectedGradedValueCents: number | null;
  gradingConfidence: number | null;
}) {
  const rawValueCents = (card.goodConditionValue ?? 0) * 100;
  const expectedGradedValueCents =
    card.expectedGradedValueCents ?? (card.perfectConditionValue ?? 0) * 100;
  const gradingFeeCents = card.gradingFeeCents ?? 2500;
  const confidence = card.gradingConfidence ?? 50;
  const grossUpsideCents = expectedGradedValueCents - rawValueCents;
  const estimatedProfitCents = Math.round(
    grossUpsideCents * (confidence / 100) - gradingFeeCents,
  );

  return {
    rawValueCents,
    expectedGradedValueCents,
    gradingFeeCents,
    confidence,
    grossUpsideCents,
    estimatedProfitCents,
    recommendation:
      estimatedProfitCents >= 7500
        ? "STRONG"
        : estimatedProfitCents >= 2500
          ? "CONSIDER"
          : "SKIP",
  };
}

router.get(
  "/batches",
  asyncHandler(async (_req, res) => {
    const batches = await prisma.gradingSubmissionBatch.findMany({
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

    res.json(batches);
  }),
);

router.post(
  "/batches",
  asyncHandler(async (req, res) => {
    const validatedData = gradingBatchSchema.parse(req.body);

    const batch = await prisma.gradingSubmissionBatch.create({
      data: validatedData,
    });

    res.status(201).json(batch);
  }),
);

router.patch(
  "/batches/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const validatedData = partialGradingBatchSchema.parse(req.body);

    const batch = await prisma.gradingSubmissionBatch.update({
      where: { id },
      data: validatedData,
    });

    res.json(batch);
  }),
);

router.patch(
  "/cards/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const validatedData = gradingCardUpdateSchema.parse(req.body);

    const card = await prisma.card.update({
      where: { id },
      data: validatedData,
    });

    res.json(card);
  }),
);

router.get(
  "/recommendations",
  asyncHandler(async (_req, res) => {
    const cards = await prisma.card.findMany({
      where: {
        status: {
          in: ["NEW", "READY_TO_LIST", "GRADED"],
        },
        OR: [
          {
            perfectConditionValue: {
              not: null,
            },
          },
          {
            expectedGradedValueCents: {
              not: null,
            },
          },
        ],
      },
      take: 25,
      orderBy: {
        perfectConditionValue: "desc",
      },
    });

    res.json(
      cards
        .map((card) => ({
          card,
          roi: estimateGradingRoi(card),
        }))
        .sort((a, b) => b.roi.estimatedProfitCents - a.roi.estimatedProfitCents),
    );
  }),
);

router.patch(
  "/batches/:id/return",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const { returnedAt, cards } = returnGradingBatchSchema.parse(req.body);

    const batch = await prisma.gradingSubmissionBatch.update({
      where: { id },
      data: { returnedAt },
    });

    const updatedCards = await Promise.all(
      cards.map((card) =>
        prisma.card.update({
          where: { id: card.id },
          data: {
            status: "GRADED",
            gradingSubmissionBatchId: id,
            gradingReturnedAt: returnedAt,
            finalGrade: card.finalGrade ?? null,
            gradingCertNumber: card.gradingCertNumber ?? null,
            expectedGradedValueCents: card.expectedGradedValueCents ?? null,
          },
        }),
      ),
    );

    res.json({
      batch,
      cards: updatedCards,
    });
  }),
);

export default router;
