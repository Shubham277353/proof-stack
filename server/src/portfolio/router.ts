import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

const USERNAME_RE = /^[a-z0-9_-]{3,30}$/;

// GET /api/portfolio/:username — public, no auth required
router.get("/:username", async (req: Request, res: Response): Promise<void> => {
  const { username } = req.params;

  if (!USERNAME_RE.test(username)) {
    res.status(404).json({ error: "Portfolio not found" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      displayName: true,
      username: true,
      bio: true,
      createdAt: true,
      projects: {
        where: { status: "PUBLISHED" },
        select: {
          id: true,
          title: true,
          description: true,
          repoUrl: true,
          liveUrl: true,
          status: true,
          createdAt: true,
          evidence: {
            select: {
              id: true,
              title: true,
              description: true,
              url: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      skillClaims: {
        where: { status: { in: ["SUBMITTED", "UNDER_REVIEW", "APPROVED"] } },
        select: {
          id: true,
          level: true,
          status: true,
          summary: true,
          skill: { select: { id: true, name: true, category: true } },
          evidenceLinks: {
            select: {
              evidence: { select: { id: true, title: true, url: true } },
            },
          },
          reviewRequests: {
            where: { status: "COMPLETED" },
            select: {
              id: true,
              review: {
                select: {
                  scoreDepth: true,
                  scoreClarity: true,
                  scoreEvidence: true,
                  scoreOverall: true,
                  feedback: true,
                  createdAt: true,
                  reviewRequest: {
                    select: {
                      reviewer: { select: { name: true, displayName: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    res.status(404).json({ error: "Portfolio not found" });
    return;
  }

  res.json({ portfolio: user });
});

export default router;
