import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

// Mounted at /api/projects/:projectId/evidence
// Express mergeParams is required so :projectId is accessible
const router = Router({ mergeParams: true });

router.use(requireAuth);

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

const evidenceSelect = {
  id: true,
  title: true,
  description: true,
  url: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** Verify the project exists and is owned by the authenticated user. */
async function assertProjectOwner(
  projectId: string,
  userId: string,
  res: Response
): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return false;
  }
  if (project.ownerId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

// GET /api/projects/:projectId/evidence
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId } = req.params;
  if (!(await assertProjectOwner(projectId, req.userId!, res))) return;

  const evidence = await prisma.evidence.findMany({
    where: { projectId },
    select: evidenceSelect,
    orderBy: { createdAt: "asc" },
  });
  res.json({ evidence });
});

// POST /api/projects/:projectId/evidence
router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId } = req.params;
  if (!(await assertProjectOwner(projectId, req.userId!, res))) return;

  const { title, description, url } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  if (title.trim().length > 200) {
    res.status(400).json({ error: "title must be 200 characters or fewer" });
    return;
  }
  if (url && !isValidUrl(url)) {
    res.status(400).json({ error: "url must be a valid URL" });
    return;
  }

  const evidence = await prisma.evidence.create({
    data: {
      title: title.trim(),
      description: description?.trim() ?? null,
      url: url ?? null,
      projectId,
    },
    select: evidenceSelect,
  });

  res.status(201).json({ evidence });
});

// PATCH /api/projects/:projectId/evidence/:evidenceId
router.patch("/:evidenceId", async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId, evidenceId } = req.params;
  if (!(await assertProjectOwner(projectId, req.userId!, res))) return;

  const existing = await prisma.evidence.findUnique({
    where: { id: evidenceId },
    select: { projectId: true },
  });
  if (!existing) {
    res.status(404).json({ error: "Evidence not found" });
    return;
  }
  if (existing.projectId !== projectId) {
    res.status(404).json({ error: "Evidence not found" });
    return;
  }

  const { title, description, url } = req.body;

  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      res.status(400).json({ error: "title cannot be empty" });
      return;
    }
    if (title.trim().length > 200) {
      res.status(400).json({ error: "title must be 200 characters or fewer" });
      return;
    }
  }
  if (url !== undefined && url !== null && !isValidUrl(url)) {
    res.status(400).json({ error: "url must be a valid URL" });
    return;
  }

  const evidence = await prisma.evidence.update({
    where: { id: evidenceId },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() ?? null }),
      ...(url !== undefined && { url: url ?? null }),
    },
    select: evidenceSelect,
  });

  res.json({ evidence });
});

// DELETE /api/projects/:projectId/evidence/:evidenceId
router.delete("/:evidenceId", async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId, evidenceId } = req.params;
  if (!(await assertProjectOwner(projectId, req.userId!, res))) return;

  const existing = await prisma.evidence.findUnique({
    where: { id: evidenceId },
    select: { projectId: true },
  });
  if (!existing || existing.projectId !== projectId) {
    res.status(404).json({ error: "Evidence not found" });
    return;
  }

  await prisma.evidence.delete({ where: { id: evidenceId } });
  res.status(204).send();
});

export default router;
