import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { closePool, getPool } from "./client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = __filename.replace(/\/[^/]+$/, "");

const runMigrations = async (): Promise<void> => {
  const pool = getPool();
  if (!pool) {
    throw new Error("DATABASE_URL is required to run migrations");
  }

  const migrationDir = join(__dirname, "migrations");
  const files = (await readdir(migrationDir)).filter((name) => name.endsWith(".sql")).sort();

  for (const file of files) {
    const sql = await readFile(join(migrationDir, file), "utf8");
    await pool.query(sql);
    console.log(`applied migration: ${file}`);
  }
};

runMigrations()
  .then(async () => {
    await closePool();
  })
  .catch(async (error: unknown) => {
    console.error("migration failed", error);
    await closePool();
    process.exitCode = 1;
  });
