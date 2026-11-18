import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

if (process.env.RENDER !== "true") process.exit(0);

if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
  console.error("Render builds need DATABASE_URL and DIRECT_URL to apply PostgreSQL migrations.");
  process.exit(1);
}

const prismaCli = resolve(process.cwd(), "node_modules", "prisma", "build", "index.js");
if (!existsSync(prismaCli)) {
  console.error("Prisma CLI was not installed, so the database migration could not run.");
  process.exit(1);
}

const migration = spawnSync(process.execPath, [prismaCli, "migrate", "deploy"], { stdio: "inherit" });
if (migration.error) {
  console.error("Could not start the PostgreSQL migration.");
  process.exit(1);
}
if (migration.status !== 0) process.exit(migration.status ?? 1);

const mcqSeed = resolve(process.cwd(), "prisma", "seed.mjs");
const seed = spawnSync(process.execPath, [mcqSeed, "--mcq-only"], { stdio: "inherit" });
if (seed.error) {
  console.error("Could not update the sample MCQ practice bank.");
  process.exit(1);
}
process.exit(seed.status ?? 1);
