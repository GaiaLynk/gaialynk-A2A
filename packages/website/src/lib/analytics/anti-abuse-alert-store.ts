import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";

type Driver = "memory" | "file" | "postgres";
const DEFAULT_FILE_PATH = ".data/analytics-anti-abuse-alerts.json";
const DEFAULT_TABLE = "website_analytics_anti_abuse_alerts";

export type AntiAbuseAlertRecord = {
  time: string;
  ip: string;
  userAgent: string;
  path: string;
  reasons: string[];
  blocked: boolean;
  severity: "warn" | "critical";
};

export type AntiAbuseAlertListQuery = {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
  blocked?: boolean;
  severity?: "warn" | "critical";
};

export type AntiAbuseAlertListResult = {
  total: number;
  page: number;
  pageSize: number;
  records: AntiAbuseAlertRecord[];
};

interface AntiAbuseAlertRepository {
  push(record: AntiAbuseAlertRecord): Promise<void>;
  list(query: AntiAbuseAlertListQuery): Promise<AntiAbuseAlertListResult>;
  clear(): Promise<void>;
  purgeOlderThan(days: number): Promise<number>;
}

function sanitizeSqlIdentifier(input: string): string {
  return input.replace(/[^a-zA-Z0-9_]/g, "_");
}

function parseDriver(raw: string | undefined): Driver {
  if (raw === "file" || raw === "postgres") {
    return raw;
  }
  return "memory";
}

function getConfig() {
  return {
    driver: parseDriver(process.env.GAIALYNK_ANALYTICS_ALERTS_STORE || process.env.GAIALYNK_ANALYTICS_STORE),
    filePath: process.env.GAIALYNK_ANALYTICS_ALERTS_FILE || DEFAULT_FILE_PATH,
    databaseUrl: process.env.DATABASE_URL || "",
    tableName: sanitizeSqlIdentifier(process.env.GAIALYNK_ANALYTICS_ALERTS_PG_TABLE || DEFAULT_TABLE),
  };
}

function getSignature(): string {
  const config = getConfig();
  return `${config.driver}::${config.filePath}::${config.tableName}::${Boolean(config.databaseUrl)}`;
}

function normalizeQuery(query: AntiAbuseAlertListQuery): Required<Pick<AntiAbuseAlertListQuery, "page" | "pageSize">> &
  Omit<AntiAbuseAlertListQuery, "page" | "pageSize"> {
  const page = Number.isFinite(query.page) && query.page && query.page > 0 ? Math.floor(query.page) : 1;
  const pageSizeRaw = Number.isFinite(query.pageSize) && query.pageSize && query.pageSize > 0 ? Math.floor(query.pageSize) : 50;
  const pageSize = Math.min(200, Math.max(1, pageSizeRaw));
  return {
    ...query,
    page,
    pageSize,
  };
}

function withinRange(value: string, from?: string, to?: string): boolean {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return false;
  }
  if (from) {
    const fromMs = new Date(from).getTime();
    if (!Number.isNaN(fromMs) && timestamp < fromMs) {
      return false;
    }
  }
  if (to) {
    const toMs = new Date(to).getTime();
    if (!Number.isNaN(toMs) && timestamp > toMs) {
      return false;
    }
  }
  return true;
}

function toPagedResult(all: AntiAbuseAlertRecord[], query: AntiAbuseAlertListQuery): AntiAbuseAlertListResult {
  const normalized = normalizeQuery(query);
  const filtered = all
    .filter((item) => (typeof normalized.blocked === "boolean" ? item.blocked === normalized.blocked : true))
    .filter((item) => (normalized.severity ? item.severity === normalized.severity : true))
    .filter((item) => withinRange(item.time, normalized.from, normalized.to))
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const start = (normalized.page - 1) * normalized.pageSize;
  return {
    total: filtered.length,
    page: normalized.page,
    pageSize: normalized.pageSize,
    records: filtered.slice(start, start + normalized.pageSize),
  };
}

class MemoryAntiAbuseAlertRepository implements AntiAbuseAlertRepository {
  private readonly records: AntiAbuseAlertRecord[] = [];

  async push(record: AntiAbuseAlertRecord): Promise<void> {
    this.records.push(record);
    if (this.records.length > 5000) {
      this.records.splice(0, this.records.length - 5000);
    }
  }

  async list(query: AntiAbuseAlertListQuery): Promise<AntiAbuseAlertListResult> {
    return toPagedResult(this.records, query);
  }

  async clear(): Promise<void> {
    this.records.splice(0, this.records.length);
  }

  async purgeOlderThan(days: number): Promise<number> {
    const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
    const before = this.records.length;
    const remaining = this.records.filter((item) => new Date(item.time).getTime() >= threshold);
    this.records.splice(0, this.records.length, ...remaining);
    return before - remaining.length;
  }
}

class FileAntiAbuseAlertRepository implements AntiAbuseAlertRepository {
  constructor(private readonly filePath: string) {}

  async push(record: AntiAbuseAlertRecord): Promise<void> {
    const all = this.readAll();
    all.push(record);
    if (all.length > 5000) {
      all.splice(0, all.length - 5000);
    }
    this.writeAll(all);
  }

  async list(query: AntiAbuseAlertListQuery): Promise<AntiAbuseAlertListResult> {
    return toPagedResult(this.readAll(), query);
  }

  async clear(): Promise<void> {
    if (existsSync(this.filePath)) {
      rmSync(this.filePath, { force: true });
    }
  }

  async purgeOlderThan(days: number): Promise<number> {
    const all = this.readAll();
    const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
    const remaining = all.filter((item) => new Date(item.time).getTime() >= threshold);
    const removed = all.length - remaining.length;
    this.writeAll(remaining);
    return removed;
  }

  private readAll(): AntiAbuseAlertRecord[] {
    if (!existsSync(this.filePath)) {
      return [];
    }
    try {
      const raw = readFileSync(this.filePath, "utf-8");
      const parsed = JSON.parse(raw) as AntiAbuseAlertRecord[] | null;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeAll(all: AntiAbuseAlertRecord[]): void {
    const dir = path.dirname(this.filePath);
    mkdirSync(dir, { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(all, null, 2), "utf-8");
  }
}

class PostgresAntiAbuseAlertRepository implements AntiAbuseAlertRepository {
  private readonly pool: Pool | null;

  constructor(
    private readonly tableName: string,
    private readonly databaseUrl: string,
    private readonly fallback: AntiAbuseAlertRepository,
  ) {
    this.pool = this.databaseUrl
      ? new Pool({
          connectionString: this.databaseUrl,
          max: 4,
        })
      : null;
  }

  async push(record: AntiAbuseAlertRecord): Promise<void> {
    if (!this.pool) {
      await this.fallback.push(record);
      return;
    }
    try {
      await this.pool.query(
        `INSERT INTO ${this.tableName}
         (time, ip, user_agent, path, reasons, blocked, severity)
         VALUES ($1::timestamptz, $2, $3, $4, $5::jsonb, $6, $7)`,
        [record.time, record.ip, record.userAgent, record.path, JSON.stringify(record.reasons), record.blocked, record.severity],
      );
    } catch {
      await this.fallback.push(record);
    }
  }

  async list(query: AntiAbuseAlertListQuery): Promise<AntiAbuseAlertListResult> {
    if (!this.pool) {
      return this.fallback.list(query);
    }
    try {
      const normalized = normalizeQuery(query);
      const where: string[] = [];
      const values: Array<string | boolean> = [];
      if (typeof normalized.blocked === "boolean") {
        values.push(normalized.blocked);
        where.push(`blocked = $${values.length}`);
      }
      if (normalized.severity) {
        values.push(normalized.severity);
        where.push(`severity = $${values.length}`);
      }
      if (normalized.from) {
        values.push(normalized.from);
        where.push(`time >= $${values.length}::timestamptz`);
      }
      if (normalized.to) {
        values.push(normalized.to);
        where.push(`time <= $${values.length}::timestamptz`);
      }
      const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const countResult = await this.pool.query<{ total: string }>(
        `SELECT COUNT(*)::text AS total FROM ${this.tableName} ${whereClause}`,
        values,
      );
      const offset = (normalized.page - 1) * normalized.pageSize;
      values.push(String(normalized.pageSize));
      values.push(String(offset));
      const rows = await this.pool.query<{
        time: string;
        ip: string;
        user_agent: string;
        path: string;
        reasons: string[];
        blocked: boolean;
        severity: "warn" | "critical";
      }>(
        `SELECT time, ip, user_agent, path, reasons, blocked, severity
         FROM ${this.tableName}
         ${whereClause}
         ORDER BY time DESC
         LIMIT $${values.length - 1}::int
         OFFSET $${values.length}::int`,
        values,
      );
      return {
        total: Number(countResult.rows[0]?.total || "0"),
        page: normalized.page,
        pageSize: normalized.pageSize,
        records: rows.rows.map((row) => ({
          time: row.time,
          ip: row.ip,
          userAgent: row.user_agent,
          path: row.path,
          reasons: Array.isArray(row.reasons) ? row.reasons : [],
          blocked: row.blocked,
          severity: row.severity === "critical" ? "critical" : "warn",
        })),
      };
    } catch {
      return this.fallback.list(query);
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
            WHERE time < NOW() - ($1::text || ' days')::interval
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

function createRepo(): AntiAbuseAlertRepository {
  const config = getConfig();
  if (config.driver === "file") {
    return new FileAntiAbuseAlertRepository(config.filePath);
  }
  if (config.driver === "postgres") {
    return new PostgresAntiAbuseAlertRepository(config.tableName, config.databaseUrl, new MemoryAntiAbuseAlertRepository());
  }
  return new MemoryAntiAbuseAlertRepository();
}

let repo: AntiAbuseAlertRepository = createRepo();
let signature = getSignature();

function getRepo(): AntiAbuseAlertRepository {
  const current = getSignature();
  if (current !== signature) {
    repo = createRepo();
    signature = current;
  }
  return repo;
}

export async function appendAntiAbuseAlert(record: AntiAbuseAlertRecord): Promise<void> {
  await getRepo().push(record);
}

export async function listPersistedAntiAbuseAlerts(query: AntiAbuseAlertListQuery): Promise<AntiAbuseAlertListResult> {
  return getRepo().list(query);
}

export async function clearAntiAbuseAlertStore(): Promise<void> {
  await getRepo().clear();
}

export async function purgeAntiAbuseAlertsOlderThan(days: number): Promise<number> {
  const safeDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 30;
  return getRepo().purgeOlderThan(safeDays);
}
