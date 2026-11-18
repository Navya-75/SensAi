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

const result = spawnSync(process.execPath, [prismaCli, "migrate", "deploy"], { stdio: "inherit" });
if (result.error) {
  console.error("Could not start the PostgreSQL migration.");
  process.exit(1);
}
process.exit(result.status ?? 1);
