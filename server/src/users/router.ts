import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// GET /api/users — list all users except self (for reviewer picker)
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const users = await prisma.user.findMany({
    where: { id: { not: req.userId } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  res.json({ users });
});

export default router;
