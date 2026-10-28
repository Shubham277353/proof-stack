import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALT_ROUNDS = 12;

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email, and password are required" });
    return;
  }
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ error: "Invalid email format" });
    return;
  }
  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  const token = signToken({ userId: user.id });
  res.status(201).json({ user, token });
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({ userId: user.id });
  res.json({
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    token,
  });
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, username: true, displayName: true, bio: true, createdAt: true, updatedAt: true },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ user });
});

const USERNAME_RE = /^[a-z0-9_-]{3,30}$/;

// PATCH /api/auth/profile — update public profile fields
router.patch("/profile", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { username, displayName, bio } = req.body;

  if (username !== undefined) {
    if (typeof username !== "string" || !USERNAME_RE.test(username)) {
      res.status(400).json({ error: "username must be 3–30 lowercase letters, numbers, hyphens, or underscores" });
      return;
    }
    const taken = await prisma.user.findUnique({ where: { username } });
    if (taken && taken.id !== req.userId) {
      res.status(409).json({ error: "Username already taken" });
      return;
    }
  }

  if (displayName !== undefined && (typeof displayName !== "string" || displayName.trim().length > 60)) {
    res.status(400).json({ error: "displayName must be 60 characters or fewer" });
    return;
  }

  if (bio !== undefined && (typeof bio !== "string" || bio.trim().length > 300)) {
    res.status(400).json({ error: "bio must be 300 characters or fewer" });
    return;
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: {
      ...(username !== undefined && { username }),
      ...(displayName !== undefined && { displayName: displayName.trim() || null }),
      ...(bio !== undefined && { bio: bio.trim() || null }),
    },
    select: { id: true, name: true, email: true, username: true, displayName: true, bio: true, createdAt: true, updatedAt: true },
  });

  res.json({ user });
});

export default router;
