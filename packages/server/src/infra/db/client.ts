import { Pool, type PoolClient, type QueryResultRow } from "pg";

let pool: Pool | null = null;

const getConnectionString = (): string | null => {
  return process.env.DATABASE_URL ?? null;
};

export const isPostgresEnabled = (): boolean => {
  return Boolean(getConnectionString());
};

export const getPool = (): Pool | null => {
  const connectionString = getConnectionString();
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    pool = new Pool({ connectionString });
  }

  return pool;
};

export const query = async <T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<T[]> => {
  const db = getPool();
  if (!db) {
    throw new Error("DATABASE_URL is not configured");
  }

  const result = await db.query<T>(text, values);
  return result.rows;
};

export const withTransaction = async <T>(runner: (client: PoolClient) => Promise<T>): Promise<T> => {
  const db = getPool();
  if (!db) {
    throw new Error("DATABASE_URL is not configured");
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await runner(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};
