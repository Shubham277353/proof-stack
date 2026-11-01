import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { ClaimLevel, ClaimStatus } from "@prisma/client";

const router = Router();
router.use(requireAuth);

const VALID_LEVELS = Object.values(ClaimLevel);
const VALID_STATUSES = Object.values(ClaimStatus);

// Shape returned to clients
const claimSelect = {
  id: true,
  level: true,
  status: true,
  summary: true,
  createdAt: true,
  updatedAt: true,
  skill: { select: { id: true, name: true, category: true } },
  evidenceLinks: {
    select: {
      evidence: {
        select: { id: true, title: true, url: true },
      },
    },
    orderBy: { addedAt: "asc" as const },
  },
} as const;

// Verify all supplied evidence IDs exist and belong to the authenticated user
async function validateEvidenceOwnership(
  evidenceIds: string[],
  userId: string
): Promise<string | null> {
  if (evidenceIds.length === 0) return null;
  const rows = await prisma.evidence.findMany({
    where: { id: { in: evidenceIds } },
    select: { id: true, project: { select: { ownerId: true } } },
  });
  if (rows.length !== evidenceIds.length) {
    return "One or more evidence items not found";
  }
  const unowned = rows.find((r) => r.project.ownerId !== userId);
  if (unowned) return "One or more evidence items do not belong to you";
  return null;
}

// Resolve a skill by id OR by name (case-insensitive). Creates the skill if
// it doesn't exist yet. Returns the skill id, or null if input is invalid.
async function resolveSkill(
  skillId: unknown,
  skillName: unknown
): Promise<{ id: string } | null> {
  // Prefer explicit id
  if (skillId && typeof skillId === "string") {
    const s = await prisma.skill.findUnique({ where: { id: skillId }, select: { id: true } });
    return s ?? null;
  }
  if (!skillName || typeof skillName !== "string" || !skillName.trim()) return null;
  // Normalise: trim and collapse internal whitespace
  const trimmed = skillName.trim().replace(/\s+/g, " ");
  // Case-insensitive match against existing skills
  const existing = await prisma.skill.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return existing;
  // Create on the fly. Guard against concurrent requests hitting the unique
  // constraint simultaneously by catching P2002 and re-fetching.
  try {
    return await prisma.skill.create({
      data: { name: trimmed },
      select: { id: true },
    });
  } catch (e: unknown) {
    if (
      typeof e === "object" && e !== null && "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      // Another request created it first — fetch the winner
      const race = await prisma.skill.findFirst({
        where: { name: { equals: trimmed, mode: "insensitive" } },
        select: { id: true },
      });
      return race ?? null;
    }
    throw e;
  }
}

// GET /api/claims
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const claims = await prisma.skillClaim.findMany({
    where: { userId: req.userId },
    select: claimSelect,
    orderBy: { createdAt: "desc" },
  });
  res.json({ claims });
});

// POST /api/claims
router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const { skillId, skillName, level, summary, evidenceIds } = req.body;

  if (!level || !VALID_LEVELS.includes(level)) {
    res.status(400).json({ error: `level must be one of: ${VALID_LEVELS.join(", ")}` });
    return;
  }

  const skill = await resolveSkill(skillId, skillName);
  if (!skill) {
    res.status(400).json({ error: "skillId or skillName is required" });
    return;
  }

  const ids: string[] = Array.isArray(evidenceIds) ? evidenceIds : [];
  const ownershipError = await validateEvidenceOwnership(ids, req.userId!);
  if (ownershipError) {
    res.status(403).json({ error: ownershipError });
    return;
  }

  try {
    const claim = await prisma.skillClaim.create({
      data: {
        userId: req.userId as string,
        skillId: skill.id,
        level,
        summary: summary?.trim() ?? null,
        evidenceLinks: ids.length
          ? { create: ids.map((evidenceId) => ({ evidenceId })) }
          : undefined,
      },
      select: claimSelect,
    });
    res.status(201).json({ claim });
  } catch (e: unknown) {
    // Unique constraint: (userId, skillId, level)
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      res.status(409).json({ error: "You already have a claim for this skill at this level" });
      return;
    }
    throw e;
  }
});

// PATCH /api/claims/:id
router.patch("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.skillClaim.findUnique({
    where: { id: req.params.id },
    select: { userId: true },
  });
  if (!existing) {
    res.status(404).json({ error: "Claim not found" });
    return;
  }
  if (existing.userId !== req.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { level, status, summary, evidenceIds, skillName } = req.body;

  if (level !== undefined && !VALID_LEVELS.includes(level)) {
    res.status(400).json({ error: `level must be one of: ${VALID_LEVELS.join(", ")}` });
    return;
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    return;
  }

  // Resolve new skill if skillName supplied (edit is locked in UI but handle gracefully)
  let resolvedSkillId: string | undefined;
  if (skillName !== undefined) {
    const s = await resolveSkill(undefined, skillName);
    if (!s) {
      res.status(400).json({ error: "Invalid skillName" });
      return;
    }
    resolvedSkillId = s.id;
  }

  // If evidenceIds supplied, replace the full set
  if (Array.isArray(evidenceIds)) {
    const ownershipError = await validateEvidenceOwnership(evidenceIds, req.userId!);
    if (ownershipError) {
      res.status(403).json({ error: ownershipError });
      return;
    }
  }

  try {
    const claim = await prisma.$transaction(async (tx) => {
      if (Array.isArray(evidenceIds)) {
        await tx.claimEvidence.deleteMany({ where: { claimId: req.params.id } });
        if (evidenceIds.length > 0) {
          await tx.claimEvidence.createMany({
            data: evidenceIds.map((evidenceId: string) => ({
              claimId: req.params.id,
              evidenceId,
            })),
          });
        }
      }
      return tx.skillClaim.update({
        where: { id: req.params.id },
        data: {
          ...(resolvedSkillId !== undefined && { skillId: resolvedSkillId }),
          ...(level !== undefined && { level }),
          ...(status !== undefined && { status }),
          ...(summary !== undefined && { summary: summary?.trim() ?? null }),
        },
        select: claimSelect,
      });
    });
    res.json({ claim });
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      res.status(409).json({ error: "You already have a claim for this skill at this level" });
      return;
    }
    throw e;
  }
});

// DELETE /api/claims/:id
router.delete("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.skillClaim.findUnique({
    where: { id: req.params.id },
    select: { userId: true },
  });
  if (!existing) {
    res.status(404).json({ error: "Claim not found" });
    return;
  }
  if (existing.userId !== req.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await prisma.skillClaim.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
