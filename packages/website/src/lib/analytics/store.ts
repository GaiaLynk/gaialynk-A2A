import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { ANALYTICS_EVENTS, type AnalyticsEventName, type AnalyticsPayload } from "./events";

export type StoredAnalyticsEvent = {
  name: AnalyticsEventName;
  payload: AnalyticsPayload;
  receivedAt: string;
};

const MAX_EVENTS = 5000;
const DEFAULT_FILE_PATH = ".data/analytics-events.json";
const DEFAULT_DRIVER = "memory";

function trimEvents(input: StoredAnalyticsEvent[]): StoredAnalyticsEvent[] {
  if (input.length <= MAX_EVENTS) {
    return input;
  }
  return input.slice(input.length - MAX_EVENTS);
}

function parseStoreDriver(raw: string | undefined): "memory" | "file" | "postgres" {
  if (raw === "file" || raw === "postgres") {
    return raw;
  }
  return DEFAULT_DRIVER;
}

function sanitizeSqlIdentifier(input: string): string {
  return input.replace(/[^a-zA-Z0-9_]/g, "_");
}

function getStoreDriverConfig() {
  return {
    driver: parseStoreDriver(process.env.GAIALYNK_ANALYTICS_STORE),
    filePath: process.env.GAIALYNK_ANALYTICS_FILE || DEFAULT_FILE_PATH,
    databaseUrl: process.env.DATABASE_URL || "",
    tableName: sanitizeSqlIdentifier(process.env.GAIALYNK_ANALYTICS_PG_TABLE || "website_analytics_events"),
  };
}

export type AnalyticsStoreRuntimeConfig = ReturnType<typeof getStoreDriverConfig>;

function getConfigSignature(): string {
  const config = getStoreDriverConfig();
  return `${config.driver}::${config.filePath}::${Boolean(config.databaseUrl)}`;
}

interface AnalyticsRepository {
  push(event: StoredAnalyticsEvent): Promise<void>;
  read(): Promise<StoredAnalyticsEvent[]>;
  clear(): Promise<void>;
  purgeOlderThan(days: number): Promise<number>;
}

class MemoryAnalyticsRepository implements AnalyticsRepository {
  private readonly events: StoredAnalyticsEvent[] = [];

  async push(event: StoredAnalyticsEvent): Promise<void> {
    this.events.push(event);
    if (this.events.length > MAX_EVENTS) {
      this.events.splice(0, this.events.length - MAX_EVENTS);
    }
  }

  async read(): Promise<StoredAnalyticsEvent[]> {
    return [...this.events];
  }

  async clear(): Promise<void> {
    this.events.splice(0, this.events.length);
  }

  async purgeOlderThan(days: number): Promise<number> {
    const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
    const before = this.events.length;
    const remaining = this.events.filter((event) => new Date(event.receivedAt).getTime() >= threshold);
    this.events.splice(0, this.events.length, ...remaining);
    return before - remaining.length;
  }
}

class FileAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly filePath: string) {}

  async push(event: StoredAnalyticsEvent): Promise<void> {
    const all = this.readFromFile();
    all.push(event);
    this.writeToFile(trimEvents(all));
  }

  async read(): Promise<StoredAnalyticsEvent[]> {
    return this.readFromFile();
  }

  async clear(): Promise<void> {
    if (existsSync(this.filePath)) {
      rmSync(this.filePath, { force: true });
    }
  }

  async purgeOlderThan(days: number): Promise<number> {
    const all = this.readFromFile();
    const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
    const remaining = all.filter((event) => new Date(event.receivedAt).getTime() >= threshold);
    const removed = all.length - remaining.length;
    this.writeToFile(trimEvents(remaining));
    return removed;
  }

  private readFromFile(): StoredAnalyticsEvent[] {
    if (!existsSync(this.filePath)) {
      return [];
    }
    try {
      const raw = readFileSync(this.filePath, "utf-8");
      const parsed = JSON.parse(raw) as StoredAnalyticsEvent[] | null;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeToFile(input: StoredAnalyticsEvent[]): void {
    const directory = path.dirname(this.filePath);
    mkdirSync(directory, { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(input, null, 2), "utf-8");
  }
}

class PostgresAnalyticsRepository implements AnalyticsRepository {
  private readonly pool: Pool | null;

  constructor(
    private readonly tableName: string,
    private readonly databaseUrl: string,
    private readonly fallback: AnalyticsRepository,
  ) {
    this.pool = this.databaseUrl
      ? new Pool({
          connectionString: this.databaseUrl,
          max: 5,
        })
      : null;
  }

  async push(event: StoredAnalyticsEvent): Promise<void> {
    if (!this.pool) {
      await this.fallback.push(event);
      return;
    }
    try {
      await this.pool.query(
        `INSERT INTO ${this.tableName} (name, payload, received_at) VALUES ($1, $2::jsonb, $3::timestamptz)`,
        [event.name, JSON.stringify(event.payload), event.receivedAt],
      );
    } catch {
      await this.fallback.push(event);
    }
  }

  async read(): Promise<StoredAnalyticsEvent[]> {
    if (!this.pool) {
      return this.fallback.read();
    }
    try {
      const result = await this.pool.query<{
        name: string;
        payload: AnalyticsPayload;
        received_at: string;
      }>(
        `SELECT name, payload, received_at FROM ${this.tableName} ORDER BY received_at DESC LIMIT $1`,
        [MAX_EVENTS],
      );

      const mapped = result.rows
        .map((row) => {
          if (!isAnalyticsEventName(row.name)) {
            return null;
          }
          const payload = row.payload;
          if (!payload || typeof payload.page !== "string" || typeof payload.referrer !== "string") {
            return null;
          }
          return {
            name: row.name,
            payload,
            receivedAt: row.received_at,
          } satisfies StoredAnalyticsEvent;
        })
        .filter((item): item is StoredAnalyticsEvent => Boolean(item));

      return mapped.reverse();
    } catch {
      return this.fallback.read();
    }
  }

  async clear(): Promise<void> {
    if (!this.pool) {
      await this.fallback.clear();
      return;
    }
    try {
      await this.pool.query(`TRUNCATE TABLE ${this.tableName};`);
    } catch {
      await this.fallback.clear();
    }
  }

  async purgeOlderThan(days: number): Promise<number> {
    if (!this.pool) {
      return this.fallback.purgeOlderThan(days);
    }
    try {
      const result = await this.pool.query<{ count: string }>(
        `WITH deleted AS (
            DELETE FROM ${this.tableName}
            WHERE received_at < NOW() - ($1::text || ' days')::interval
            RETURNING 1
          )
          SELECT COUNT(*)::text AS count FROM deleted;`,
        [days],
      );
      return Number(result.rows[0]?.count || "0");
    } catch {
      return this.fallback.purgeOlderThan(days);
    }
  }
}

function createRepository(): AnalyticsRepository {
  const config = getStoreDriverConfig();
  if (config.driver === "file") {
    return new FileAnalyticsRepository(config.filePath);
  }
  if (config.driver === "postgres") {
    return new PostgresAnalyticsRepository(config.tableName, config.databaseUrl, new MemoryAnalyticsRepository());
  }
  return new MemoryAnalyticsRepository();
}

let repository: AnalyticsRepository = createRepository();
let repositorySignature = getConfigSignature();

function getRepository(): AnalyticsRepository {
  const currentSignature = getConfigSignature();
  if (currentSignature !== repositorySignature) {
    repository = createRepository();
    repositorySignature = currentSignature;
  }
  return repository;
}

export function isAnalyticsEventName(value: string): value is AnalyticsEventName {
  return ANALYTICS_EVENTS.includes(value as AnalyticsEventName);
}

export async function pushAnalyticsEvent(name: AnalyticsEventName, payload: AnalyticsPayload): Promise<void> {
  const next: StoredAnalyticsEvent = {
    name,
    payload,
    receivedAt: new Date().toISOString(),
  };
  await getRepository().push(next);
}

export async function readAnalyticsEvents(): Promise<StoredAnalyticsEvent[]> {
  return getRepository().read();
}

export async function clearAnalyticsStore(): Promise<void> {
  await getRepository().clear();
}

export async function purgeAnalyticsEventsOlderThan(days: number): Promise<number> {
  const safeDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 30;
  return getRepository().purgeOlderThan(safeDays);
}

export function getAnalyticsStoreRuntimeConfig(): AnalyticsStoreRuntimeConfig {
  return getStoreDriverConfig();
}
