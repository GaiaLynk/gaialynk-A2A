import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlDir = path.join(__dirname, "../sql");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required for analytics migration.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 2,
});

try {
  const files = readdirSync(sqlDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const sqlPath = path.join(sqlDir, file);
    const sql = readFileSync(sqlPath, "utf-8");
    await pool.query(sql);
    console.log("Analytics migration applied:", sqlPath);
  }
} catch (error) {
  console.error("Failed to apply analytics migration.");
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
