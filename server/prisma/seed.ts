import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const skills = [
  { name: "JavaScript", category: "Language" },
  { name: "TypeScript", category: "Language" },
  { name: "React", category: "Frontend" },
  { name: "Node.js", category: "Backend" },
  { name: "Express", category: "Backend" },
  { name: "PostgreSQL", category: "Database" },
  { name: "Git", category: "Tooling" },
  { name: "REST APIs", category: "Backend" },
];

async function main() {
  console.log("Seeding skills...");
  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
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
