import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import authRouter from "./auth/router";
import projectsRouter from "./projects/router";
import evidenceRouter from "./evidence/router";
import skillsRouter from "./skills/router";
import claimsRouter from "./claims/router";
import usersRouter from "./users/router";
import reviewsRouter from "./reviews/router";
import portfolioRouter from "./portfolio/router";

const app = express();
const PORT = process.env.PORT || 4000;

// Build allowed-origins list from CLIENT_URL (comma-separated) or fall back to
// permissive mode in development. In production CLIENT_URL must be set.
const rawClientUrl = process.env.CLIENT_URL ?? '';
const allowedOrigins = rawClientUrl
  ? rawClientUrl.split(',').map(s => s.trim()).filter(Boolean)
  : [];

app.use(
  cors(
    allowedOrigins.length > 0
      ? {
          origin: (origin, callback) => {
            // Allow server-to-server requests (no Origin header) and listed origins
            if (!origin || allowedOrigins.includes(origin)) {
              callback(null, true);
            } else {
              callback(new Error(`CORS: origin ${origin} not allowed`));
            }
          },
          credentials: true,
        }
      : undefined // no CLIENT_URL → allow all (dev only)
  )
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/projects/:projectId/evidence", evidenceRouter);
app.use("/api/skills", skillsRouter);
app.use("/api/claims", claimsRouter);
app.use("/api/users", usersRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/portfolio", portfolioRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
