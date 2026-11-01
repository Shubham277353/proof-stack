import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const skills = [
  // ── Languages ────────────────────────────────────────────────────────────
  { name: "JavaScript",  category: "Language" },
  { name: "TypeScript",  category: "Language" },
  { name: "Python",      category: "Language" },
  { name: "Rust",        category: "Language" },
  { name: "Go",          category: "Language" },
  { name: "Java",        category: "Language" },
  { name: "C#",          category: "Language" },
  { name: "C++",         category: "Language" },
  { name: "PHP",         category: "Language" },
  { name: "Ruby",        category: "Language" },
  { name: "Swift",       category: "Language" },
  { name: "Kotlin",      category: "Language" },

  // ── Frontend ─────────────────────────────────────────────────────────────
  { name: "React",           category: "Frontend" },
  { name: "Next.js",         category: "Frontend" },
  { name: "Vue.js",          category: "Frontend" },
  { name: "Nuxt.js",         category: "Frontend" },
  { name: "Svelte",          category: "Frontend" },
  { name: "Angular",         category: "Frontend" },
  { name: "Tailwind CSS",    category: "Frontend" },
  { name: "CSS",             category: "Frontend" },
  { name: "HTML",            category: "Frontend" },
  { name: "Vite",            category: "Frontend" },
  { name: "Webpack",         category: "Frontend" },
  { name: "Web Accessibility", category: "Frontend" },

  // ── Backend ──────────────────────────────────────────────────────────────
  { name: "Node.js",      category: "Backend" },
  { name: "Express",      category: "Backend" },
  { name: "Fastify",      category: "Backend" },
  { name: "NestJS",       category: "Backend" },
  { name: "Django",       category: "Backend" },
  { name: "FastAPI",      category: "Backend" },
  { name: "Ruby on Rails", category: "Backend" },
  { name: "REST APIs",    category: "Backend" },
  { name: "GraphQL",      category: "Backend" },
  { name: "WebSockets",   category: "Backend" },
  { name: "gRPC",         category: "Backend" },

  // ── Database ─────────────────────────────────────────────────────────────
  { name: "PostgreSQL",  category: "Database" },
  { name: "MySQL",       category: "Database" },
  { name: "SQLite",      category: "Database" },
  { name: "MongoDB",     category: "Database" },
  { name: "Redis",       category: "Database" },
  { name: "Prisma",      category: "Database" },
  { name: "SQL",         category: "Database" },

  // ── DevOps & Cloud ───────────────────────────────────────────────────────
  { name: "Docker",          category: "DevOps" },
  { name: "Kubernetes",      category: "DevOps" },
  { name: "CI/CD",           category: "DevOps" },
  { name: "GitHub Actions",  category: "DevOps" },
  { name: "AWS",             category: "Cloud" },
  { name: "Google Cloud",    category: "Cloud" },
  { name: "Azure",           category: "Cloud" },
  { name: "Terraform",       category: "DevOps" },
  { name: "Linux",           category: "DevOps" },
  { name: "Nginx",           category: "DevOps" },

  // ── Mobile ───────────────────────────────────────────────────────────────
  { name: "React Native",    category: "Mobile" },
  { name: "Flutter",         category: "Mobile" },
  { name: "iOS Development", category: "Mobile" },
  { name: "Android Development", category: "Mobile" },

  // ── Data & AI ────────────────────────────────────────────────────────────
  { name: "Machine Learning",  category: "AI/ML" },
  { name: "Data Analysis",     category: "Data" },
  { name: "Pandas",            category: "Data" },
  { name: "NumPy",             category: "Data" },
  { name: "PyTorch",           category: "AI/ML" },
  { name: "TensorFlow",        category: "AI/ML" },
  { name: "SQL Analytics",     category: "Data" },

  // ── Tooling & Practices ──────────────────────────────────────────────────
  { name: "Git",               category: "Tooling" },
  { name: "Testing",           category: "Tooling" },
  { name: "System Design",     category: "Architecture" },
  { name: "API Design",        category: "Architecture" },
  { name: "Security",          category: "Architecture" },
  { name: "Performance Optimisation", category: "Architecture" },
];

async function main() {
  console.log("Seeding skills…");
  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},   // never overwrite existing rows
      create: skill,
    });
  }
  const count = await prisma.skill.count();
  console.log(`Done. ${count} skills in database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
