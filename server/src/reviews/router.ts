import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { ReviewRequestStatus } from "@prisma/client";

const router = Router();
router.use(requireAuth);

// ── shared select shapes ──────────────────────────────────────────────────────

const reviewSelect = {
  id: true,
  feedback: true,
  scoreDepth: true,
  scoreClarity: true,
  scoreEvidence: true,
  scoreOverall: true,
  createdAt: true,
  updatedAt: true,
} as const;

const requestSelect = {
  id: true,
  status: true,
  message: true,
  createdAt: true,
  updatedAt: true,
  requester: { select: { id: true, name: true, email: true } },
  reviewer:  { select: { id: true, name: true, email: true } },
  claim: {
    select: {
      id: true,
      level: true,
      status: true,
      summary: true,
      skill: { select: { id: true, name: true, category: true } },
    },
  },
  review: { select: reviewSelect },
} as const;

// ── helpers ───────────────────────────────────────────────────────────────────

function isValidScore(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5;
}

// ── GET /api/reviews ──────────────────────────────────────────────────────────
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const requests = await prisma.reviewRequest.findMany({
    where: {
      OR: [{ requesterId: req.userId }, { reviewerId: req.userId }],
    },
    select: requestSelect,
    orderBy: { createdAt: "desc" },
  });
  res.json({ requests });
});

// ── POST /api/reviews ─────────────────────────────────────────────────────────
router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const { claimId, reviewerId, message } = req.body;

  if (!claimId || typeof claimId !== "string") {
    res.status(400).json({ error: "claimId is required" });
    return;
  }
  if (!reviewerId || typeof reviewerId !== "string") {
    res.status(400).json({ error: "reviewerId is required" });
    return;
  }
  if (reviewerId === req.userId) {
    res.status(400).json({ error: "You cannot review your own claim" });
    return;
  }

  const claim = await prisma.skillClaim.findUnique({
    where: { id: claimId },
    select: { userId: true },
  });
  if (!claim) {
    res.status(404).json({ error: "Claim not found" });
    return;
  }
  if (claim.userId !== req.userId) {
    res.status(403).json({ error: "You can only request reviews for your own claims" });
    return;
  }

  const reviewer = await prisma.user.findUnique({
    where: { id: reviewerId },
    select: { id: true },
  });
  if (!reviewer) {
    res.status(404).json({ error: "Reviewer not found" });
    return;
  }

  const reviewRequest = await prisma.reviewRequest.create({
    data: {
      requesterId: req.userId as string,
      reviewerId,
      claimId,
      message: message?.trim() ?? null,
    },
    select: requestSelect,
  });

  res.status(201).json({ request: reviewRequest });
});

// ── GET /api/reviews/:id ──────────────────────────────────────────────────────
router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const reviewRequest = await prisma.reviewRequest.findUnique({
    where: { id: req.params.id },
    select: requestSelect,
  });
  if (!reviewRequest) {
    res.status(404).json({ error: "Review request not found" });
    return;
  }
  if (
    reviewRequest.requester.id !== req.userId &&
    reviewRequest.reviewer.id !== req.userId
  ) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json({ request: reviewRequest });
});

// ── PATCH /api/reviews/:id — reviewer accepts or declines ────────────────────
router.patch("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const reviewRequest = await prisma.reviewRequest.findUnique({
    where: { id: req.params.id },
    select: { reviewerId: true, status: true },
  });
  if (!reviewRequest) {
    res.status(404).json({ error: "Review request not found" });
    return;
  }
  if (reviewRequest.reviewerId !== req.userId) {
    res.status(403).json({ error: "Only the designated reviewer can respond to this request" });
    return;
  }
  if (reviewRequest.status !== ReviewRequestStatus.PENDING) {
    res.status(409).json({ error: `Request is already ${reviewRequest.status.toLowerCase()}` });
    return;
  }

  const { status } = req.body;
  if (
    status !== ReviewRequestStatus.ACCEPTED &&
    status !== ReviewRequestStatus.DECLINED
  ) {
    res.status(400).json({ error: "status must be ACCEPTED or DECLINED" });
    return;
  }

  const updated = await prisma.reviewRequest.update({
    where: { id: req.params.id },
    data: { status },
    select: requestSelect,
  });
  res.json({ request: updated });
});

// ── POST /api/reviews/:id/review — submit a review ───────────────────────────
router.post("/:id/review", async (req: AuthRequest, res: Response): Promise<void> => {
  const reviewRequest = await prisma.reviewRequest.findUnique({
    where: { id: req.params.id },
    select: {
      reviewerId: true,
      status: true,
      claimId: true,
      review: { select: { id: true } },
    },
  });
  if (!reviewRequest) {
    res.status(404).json({ error: "Review request not found" });
    return;
  }
  if (reviewRequest.reviewerId !== req.userId) {
    res.status(403).json({ error: "Only the designated reviewer can submit a review" });
    return;
  }
  if (reviewRequest.status !== ReviewRequestStatus.ACCEPTED) {
    res.status(409).json({ error: "Request must be ACCEPTED before submitting a review" });
    return;
  }
  if (reviewRequest.review) {
    res.status(409).json({ error: "A review has already been submitted for this request" });
    return;
  }

  const { feedback, scoreDepth, scoreClarity, scoreEvidence, scoreOverall } = req.body;

  if (!feedback || typeof feedback !== "string" || !feedback.trim()) {
    res.status(400).json({ error: "feedback is required" });
    return;
  }
  if (!isValidScore(scoreDepth))    { res.status(400).json({ error: "scoreDepth must be an integer 1–5" });    return; }
  if (!isValidScore(scoreClarity))  { res.status(400).json({ error: "scoreClarity must be an integer 1–5" });  return; }
  if (!isValidScore(scoreEvidence)) { res.status(400).json({ error: "scoreEvidence must be an integer 1–5" }); return; }
  if (!isValidScore(scoreOverall))  { res.status(400).json({ error: "scoreOverall must be an integer 1–5" });  return; }

  await prisma.$transaction([
    prisma.review.create({
      data: {
        reviewRequestId: req.params.id,
        feedback: feedback.trim(),
        scoreDepth,
        scoreClarity,
        scoreEvidence,
        scoreOverall,
      },
    }),
    prisma.reviewRequest.update({
      where: { id: req.params.id },
      data: { status: ReviewRequestStatus.COMPLETED },
    }),
    prisma.skillClaim.update({
      where: { id: reviewRequest.claimId },
      data: { status: "APPROVED" },
    }),
  ]);

  const updated = await prisma.reviewRequest.findUnique({
    where: { id: req.params.id },
    select: requestSelect,
  });

  res.status(201).json({ request: updated });
});

export default router;
