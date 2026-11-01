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

const attachmentSelect = {
  id: true,
  externalUrl: true,
  label: true,
  project: { select: { id: true, title: true, repoUrl: true, liveUrl: true } },
  evidence: { select: { id: true, title: true, url: true } },
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
  attachments: { select: attachmentSelect, orderBy: { createdAt: "asc" as const } },
} as const;

// ── helpers ───────────────────────────────────────────────────────────────────

function isValidScore(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5;
}

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

type AttachmentInput =
  | { type: "project"; projectId: string; label?: string }
  | { type: "evidence"; evidenceId: string; label?: string }
  | { type: "url"; externalUrl: string; label?: string };

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
  const { claimId, reviewerId, message, attachments } = req.body;

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

  // Attachments validation — required, min 1
  if (!Array.isArray(attachments) || attachments.length === 0) {
    res.status(400).json({ error: "At least one attachment is required" });
    return;
  }

  // Validate each attachment shape
  for (const a of attachments as AttachmentInput[]) {
    if (!a || typeof a !== "object" || !("type" in a)) {
      res.status(400).json({ error: "Each attachment must have a type" });
      return;
    }
    if (a.type === "project") {
      if (!a.projectId || typeof a.projectId !== "string") {
        res.status(400).json({ error: "Attachment of type 'project' requires projectId" });
        return;
      }
    } else if (a.type === "evidence") {
      if (!a.evidenceId || typeof a.evidenceId !== "string") {
        res.status(400).json({ error: "Attachment of type 'evidence' requires evidenceId" });
        return;
      }
    } else if (a.type === "url") {
      if (!a.externalUrl || typeof a.externalUrl !== "string" || !isValidHttpUrl(a.externalUrl)) {
        res.status(400).json({ error: "Attachment of type 'url' requires a valid http/https URL" });
        return;
      }
    } else {
      res.status(400).json({ error: "Attachment type must be 'project', 'evidence', or 'url'" });
      return;
    }
  }

  // Duplicate detection within the request
  const projectIds = (attachments as AttachmentInput[]).filter(a => a.type === "project").map(a => (a as { type: "project"; projectId: string }).projectId);
  const evidenceIds = (attachments as AttachmentInput[]).filter(a => a.type === "evidence").map(a => (a as { type: "evidence"; evidenceId: string }).evidenceId);
  const externalUrls = (attachments as AttachmentInput[]).filter(a => a.type === "url").map(a => (a as { type: "url"; externalUrl: string }).externalUrl);

  if (new Set(projectIds).size !== projectIds.length) {
    res.status(400).json({ error: "Duplicate project attachments are not allowed" });
    return;
  }
  if (new Set(evidenceIds).size !== evidenceIds.length) {
    res.status(400).json({ error: "Duplicate evidence attachments are not allowed" });
    return;
  }
  if (new Set(externalUrls).size !== externalUrls.length) {
    res.status(400).json({ error: "Duplicate URL attachments are not allowed" });
    return;
  }

  // Verify claim ownership
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

  // Verify reviewer exists
  const reviewer = await prisma.user.findUnique({
    where: { id: reviewerId },
    select: { id: true },
  });
  if (!reviewer) {
    res.status(404).json({ error: "Reviewer not found" });
    return;
  }

  // Verify project ownership (projects must belong to the requester)
  if (projectIds.length > 0) {
    const ownedProjects = await prisma.project.findMany({
      where: { id: { in: projectIds }, ownerId: req.userId as string },
      select: { id: true },
    });
    if (ownedProjects.length !== projectIds.length) {
      res.status(403).json({ error: "One or more projects do not belong to you" });
      return;
    }
  }

  // Verify evidence ownership (evidence must belong to a project owned by the requester)
  if (evidenceIds.length > 0) {
    const ownedEvidence = await prisma.evidence.findMany({
      where: { id: { in: evidenceIds }, project: { ownerId: req.userId as string } },
      select: { id: true },
    });
    if (ownedEvidence.length !== evidenceIds.length) {
      res.status(403).json({ error: "One or more evidence items do not belong to you" });
      return;
    }
  }

  // Create request + attachments in a transaction
  const reviewRequest = await prisma.$transaction(async (tx) => {
    const created = await tx.reviewRequest.create({
      data: {
        requesterId: req.userId as string,
        reviewerId,
        claimId,
        message: message?.trim() ?? null,
        attachments: {
          create: (attachments as AttachmentInput[]).map(a => {
            if (a.type === "project") return { projectId: a.projectId, label: a.label?.trim() ?? null };
            if (a.type === "evidence") return { evidenceId: a.evidenceId, label: a.label?.trim() ?? null };
            return { externalUrl: a.externalUrl, label: a.label?.trim() ?? null };
          }),
        },
      },
      select: requestSelect,
    });
    return created;
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
