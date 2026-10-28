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

app.use(cors());
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
