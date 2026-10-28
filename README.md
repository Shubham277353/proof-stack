# Proofstack

Full-stack web application — React + TypeScript + Vite (client) / Node.js + Express + TypeScript (server) / PostgreSQL + Prisma.

## Prerequisites

- Node.js >= 18
- PostgreSQL installed and running locally

## Setup

```bash
# 1. Clone and enter the project
cd proofstack

# 2. Install root dependencies
npm install

# 3. Install client dependencies
npm install --prefix client

# 4. Install server dependencies
npm install --prefix server

# 5. Copy and fill in environment files
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env` — set `DATABASE_URL` to your PostgreSQL connection string:

```
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/proofstack"
```

## Database Setup

```bash
# Create the database (first time only)
createdb proofstack

# Apply all migrations
npm run db:migrate --prefix server

# Seed the skill catalogue
npm run db:seed --prefix server
```

## Database Scripts (run from server/)

| Command | Description |
|---|---|
| `npm run db:migrate` | Create and apply new migrations |
| `npm run db:generate` | Regenerate Prisma Client after schema changes |
| `npm run db:seed` | Seed the fixed skill catalogue |

## Running in Development

```bash
# Run both client and server concurrently
npm run dev
```

| App    | URL                   |
|--------|-----------------------|
| Client | http://localhost:5173 |
| Server | http://localhost:4000 |

## Health Check

```bash
curl http://localhost:4000/api/health
# {"status":"ok"}
```

## Project Structure

```
proofstack/
├── client/                  # React + Vite + TypeScript + Tailwind
├── server/
│   ├── prisma/
│   │   ├── schema.prisma    # All models and enums
│   │   ├── seed.ts          # Skill catalogue seed
│   │   └── migrations/      # Applied migration history
│   ├── src/
│   │   └── index.ts         # Express entry point
│   ├── .env.example
│   └── package.json
├── package.json             # Root — concurrently scripts
└── .gitignore
```
