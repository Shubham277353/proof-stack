import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { ProjectStatus } from "@prisma/client";

const router = Router();

// All project routes require authentication
router.use(requireAuth);

const VALID_STATUSES = Object.values(ProjectStatus);

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// ── SELECT shape returned to clients (never leaks ownerId internals) ──────────
const projectSelect = {
  id: true,
  title: true,
  description: true,
  repoUrl: true,
  liveUrl: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

// GET /api/projects — list authenticated user's projects
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const projects = await prisma.project.findMany({
    where: { ownerId: req.userId },
    select: projectSelect,
    orderBy: { createdAt: "desc" },
  });
  res.json({ projects });
});

// POST /api/projects — create a project
router.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, description, repoUrl, liveUrl, status } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  if (title.trim().length > 120) {
    res.status(400).json({ error: "title must be 120 characters or fewer" });
    return;
  }
  if (repoUrl && !isValidUrl(repoUrl)) {
    res.status(400).json({ error: "repoUrl must be a valid URL" });
    return;
  }
  if (liveUrl && !isValidUrl(liveUrl)) {
    res.status(400).json({ error: "liveUrl must be a valid URL" });
    return;
  }
  if (status && !VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    return;
  }

  const project = await prisma.project.create({
    data: {
      title: title.trim(),
      description: description?.trim() ?? null,
      repoUrl: repoUrl ?? null,
      liveUrl: liveUrl ?? null,
      status: status ?? ProjectStatus.DRAFT,
      ownerId: req.userId as string,
    },
    select: projectSelect,
  });

  res.status(201).json({ project });
});

// GET /api/projects/:id — get one owned project
router.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    select: { ...projectSelect, ownerId: true },
  });

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (project.ownerId !== req.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { ownerId: _o, ...safe } = project;
  res.json({ project: safe });
});

// PATCH /api/projects/:id — update an owned project
router.patch("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.project.findUnique({
    where: { id: req.params.id },
    select: { ownerId: true },
  });

  if (!existing) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (existing.ownerId !== req.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { title, description, repoUrl, liveUrl, status } = req.body;

  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      res.status(400).json({ error: "title cannot be empty" });
      return;
    }
    if (title.trim().length > 120) {
      res.status(400).json({ error: "title must be 120 characters or fewer" });
      return;
    }
  }
  if (repoUrl !== undefined && repoUrl !== null && !isValidUrl(repoUrl)) {
    res.status(400).json({ error: "repoUrl must be a valid URL" });
    return;
  }
  if (liveUrl !== undefined && liveUrl !== null && !isValidUrl(liveUrl)) {
    res.status(400).json({ error: "liveUrl must be a valid URL" });
    return;
  }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    return;
  }

  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() ?? null }),
      ...(repoUrl !== undefined && { repoUrl: repoUrl ?? null }),
      ...(liveUrl !== undefined && { liveUrl: liveUrl ?? null }),
      ...(status !== undefined && { status }),
    },
    select: projectSelect,
  });

  res.json({ project });
});

// DELETE /api/projects/:id — delete an owned project
router.delete("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.project.findUnique({
    where: { id: req.params.id },
    select: { ownerId: true },
  });

  if (!existing) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (existing.ownerId !== req.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await prisma.project.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
