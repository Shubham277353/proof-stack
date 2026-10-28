import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

// GET /api/skills — list all skills (no auth required, it's a catalogue)
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  const skills = await prisma.skill.findMany({
    select: { id: true, name: true, category: true },
    orderBy: { name: "asc" },
  });
  res.json({ skills });
});

export default router;
