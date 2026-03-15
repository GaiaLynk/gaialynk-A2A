import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { leadsToCsv } from "./csv";
import { exportLeads, type LeadRecord, type LeadListQuery } from "./store";

type ExportFormat = "json" | "csv";
type JobStatus = "queued" | "running" | "completed" | "failed";
type Driver = "memory" | "file" | "postgres";

const DEFAULT_FILE_PATH = ".data/leads-export-jobs.json";
const DEFAULT_TABLE = "website_lead_export_jobs";

export type LeadExportJob = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: JobStatus;
  format: ExportFormat;
  filter: LeadListQuery;
  error?: string;
  resultCount?: number;
  csvContent?: string;
  records?: LeadRecord[];
};

export type LeadExportJobListQuery = {
  page?: number;
  pageSize?: number;
  status?: JobStatus;
  format?: ExportFormat;
  from?: string;
  to?: string;
};

export type LeadExportJobListResult = {
  total: number;
  page: number;
  pageSize: number;
  jobs: LeadExportJob[];
};

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
    driver: parseDriver(process.env.GAIALYNK_LEADS_EXPORT_JOBS_STORE || process.env.GAIALYNK_LEADS_STORE),
    filePath: process.env.GAIALYNK_LEADS_EXPORT_JOBS_FILE || DEFAULT_FILE_PATH,
    databaseUrl: process.env.DATABASE_URL || "",
    tableName: sanitizeSqlIdentifier(process.env.GAIALYNK_LEADS_EXPORT_JOBS_PG_TABLE || DEFAULT_TABLE),
  };
}

function getSignature(): string {
  const config = getConfig();
  return `${config.driver}::${config.filePath}::${config.tableName}::${Boolean(config.databaseUrl)}`;
}

function normalizeQuery(query: LeadExportJobListQuery): Required<Pick<LeadExportJobListQuery, "page" | "pageSize">> &
  Omit<LeadExportJobListQuery, "page" | "pageSize"> {
  const page = Number.isFinite(query.page) && query.page && query.page > 0 ? Math.floor(query.page) : 1;
  const pageSizeRaw = Number.isFinite(query.pageSize) && query.pageSize && query.pageSize > 0 ? Math.floor(query.pageSize) : 20;
  const pageSize = Math.min(100, Math.max(1, pageSizeRaw));
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

function toPagedList(all: LeadExportJob[], query: LeadExportJobListQuery): LeadExportJobListResult {
  const normalized = normalizeQuery(query);
  const filtered = all
    .filter((item) => (normalized.status ? item.status === normalized.status : true))
    .filter((item) => (normalized.format ? item.format === normalized.format : true))
    .filter((item) => withinRange(item.createdAt, normalized.from, normalized.to))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const start = (normalized.page - 1) * normalized.pageSize;
  return {
    total: filtered.length,
    page: normalized.page,
    pageSize: normalized.pageSize,
    jobs: filtered.slice(start, start + normalized.pageSize),
  };
}

interface LeadExportJobRepository {
  save(job: LeadExportJob): Promise<void>;
  get(id: string): Promise<LeadExportJob | null>;
  list(query: LeadExportJobListQuery): Promise<LeadExportJobListResult>;
  clear(): Promise<void>;
  purgeOlderThan(days: number): Promise<number>;
}

class MemoryLeadExportJobRepository implements LeadExportJobRepository {
  private readonly jobs = new Map<string, LeadExportJob>();

  async save(job: LeadExportJob): Promise<void> {
    this.jobs.set(job.id, job);
  }

  async get(id: string): Promise<LeadExportJob | null> {
    return this.jobs.get(id) || null;
  }

  async list(query: LeadExportJobListQuery): Promise<LeadExportJobListResult> {
    return toPagedList([...this.jobs.values()], query);
  }

  async clear(): Promise<void> {
    this.jobs.clear();
  }

  async purgeOlderThan(days: number): Promise<number> {
    const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
    const before = this.jobs.size;
    for (const [id, job] of this.jobs.entries()) {
      if (new Date(job.createdAt).getTime() < threshold) {
        this.jobs.delete(id);
      }
    }
    return before - this.jobs.size;
  }
}

class FileLeadExportJobRepository implements LeadExportJobRepository {
  constructor(private readonly filePath: string) {}

  async save(job: LeadExportJob): Promise<void> {
    const all = this.readAll();
    const next = all.filter((item) => item.id !== job.id);
    next.push(job);
    this.writeAll(next);
  }

  async get(id: string): Promise<LeadExportJob | null> {
    return this.readAll().find((item) => item.id === id) || null;
  }

  async list(query: LeadExportJobListQuery): Promise<LeadExportJobListResult> {
    return toPagedList(this.readAll(), query);
  }

  async clear(): Promise<void> {
    if (existsSync(this.filePath)) {
      rmSync(this.filePath, { force: true });
    }
  }

  async purgeOlderThan(days: number): Promise<number> {
    const all = this.readAll();
    const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
    const remaining = all.filter((item) => new Date(item.createdAt).getTime() >= threshold);
    const removed = all.length - remaining.length;
    this.writeAll(remaining);
    return removed;
  }

  private readAll(): LeadExportJob[] {
    if (!existsSync(this.filePath)) {
      return [];
    }
    try {
      const raw = readFileSync(this.filePath, "utf-8");
      const parsed = JSON.parse(raw) as LeadExportJob[] | null;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeAll(all: LeadExportJob[]): void {
    const dir = path.dirname(this.filePath);
    mkdirSync(dir, { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(all, null, 2), "utf-8");
  }
}

class PostgresLeadExportJobRepository implements LeadExportJobRepository {
  private readonly pool: Pool | null;

  constructor(
    private readonly tableName: string,
    private readonly databaseUrl: string,
    private readonly fallback: LeadExportJobRepository,
  ) {
    this.pool = this.databaseUrl
      ? new Pool({
          connectionString: this.databaseUrl,
          max: 4,
        })
      : null;
  }

  async save(job: LeadExportJob): Promise<void> {
    if (!this.pool) {
      await this.fallback.save(job);
      return;
    }
    try {
      await this.pool.query(
        `INSERT INTO ${this.tableName}
          (id, created_at, updated_at, status, format, filter, error, result_count, csv_content, records)
         VALUES ($1, $2::timestamptz, $3::timestamptz, $4, $5, $6::jsonb, $7, $8, $9, $10::jsonb)
         ON CONFLICT (id) DO UPDATE SET
           updated_at = EXCLUDED.updated_at,
           status = EXCLUDED.status,
           format = EXCLUDED.format,
           filter = EXCLUDED.filter,
           error = EXCLUDED.error,
           result_count = EXCLUDED.result_count,
           csv_content = EXCLUDED.csv_content,
           records = EXCLUDED.records`,
        [
          job.id,
          job.createdAt,
          job.updatedAt,
          job.status,
          job.format,
          JSON.stringify(job.filter || {}),
          job.error || null,
          job.resultCount || 0,
          job.csvContent || null,
          JSON.stringify(job.records || []),
        ],
      );
    } catch {
      await this.fallback.save(job);
    }
  }

  async get(id: string): Promise<LeadExportJob | null> {
    if (!this.pool) {
      return this.fallback.get(id);
    }
    try {
      const result = await this.pool.query<{
        id: string;
        created_at: string;
        updated_at: string;
        status: JobStatus;
        format: ExportFormat;
        filter: LeadListQuery;
        error: string | null;
        result_count: number;
        csv_content: string | null;
        records: LeadRecord[] | null;
      }>(
        `SELECT id, created_at, updated_at, status, format, filter, error, result_count, csv_content, records
         FROM ${this.tableName}
         WHERE id = $1
         LIMIT 1`,
        [id],
      );
      const row = result.rows[0];
      if (!row) {
        return null;
      }
      return {
        id: row.id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        status: row.status,
        format: row.format,
        filter: row.filter || {},
        error: row.error || undefined,
        resultCount: row.result_count || 0,
        csvContent: row.csv_content || undefined,
        records: Array.isArray(row.records) ? row.records : undefined,
      };
    } catch {
      return this.fallback.get(id);
    }
  }

  async list(query: LeadExportJobListQuery): Promise<LeadExportJobListResult> {
    if (!this.pool) {
      return this.fallback.list(query);
    }
    try {
      const normalized = normalizeQuery(query);
      const where: string[] = [];
      const values: string[] = [];
      if (normalized.status) {
        values.push(normalized.status);
        where.push(`status = $${values.length}`);
      }
      if (normalized.format) {
        values.push(normalized.format);
        where.push(`format = $${values.length}`);
      }
      if (normalized.from) {
        values.push(normalized.from);
        where.push(`created_at >= $${values.length}::timestamptz`);
      }
      if (normalized.to) {
        values.push(normalized.to);
        where.push(`created_at <= $${values.length}::timestamptz`);
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
        id: string;
        created_at: string;
        updated_at: string;
        status: JobStatus;
        format: ExportFormat;
        filter: LeadListQuery;
        error: string | null;
        result_count: number;
        csv_content: string | null;
        records: LeadRecord[] | null;
      }>(
        `SELECT id, created_at, updated_at, status, format, filter, error, result_count, csv_content, records
         FROM ${this.tableName}
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${values.length - 1}::int
         OFFSET $${values.length}::int`,
        values,
      );

      return {
        total: Number(countResult.rows[0]?.total || "0"),
        page: normalized.page,
        pageSize: normalized.pageSize,
        jobs: rows.rows.map((row) => ({
          id: row.id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          status: row.status,
          format: row.format,
          filter: row.filter || {},
          error: row.error || undefined,
          resultCount: row.result_count || 0,
          csvContent: row.csv_content || undefined,
          records: Array.isArray(row.records) ? row.records : undefined,
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
           WHERE created_at < NOW() - ($1::text || ' days')::interval
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

function createRepo(): LeadExportJobRepository {
  const config = getConfig();
  if (config.driver === "file") {
    return new FileLeadExportJobRepository(config.filePath);
  }
  if (config.driver === "postgres") {
    return new PostgresLeadExportJobRepository(config.tableName, config.databaseUrl, new MemoryLeadExportJobRepository());
  }
  return new MemoryLeadExportJobRepository();
}

let repo: LeadExportJobRepository = createRepo();
let signature = getSignature();

function getRepo(): LeadExportJobRepository {
  const current = getSignature();
  if (current !== signature) {
    repo = createRepo();
    signature = current;
  }
  return repo;
}

function makeId(): string {
  return `job_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

export async function createLeadExportJob(input: {
  format: ExportFormat;
  filter: LeadListQuery;
}): Promise<LeadExportJob> {
  const id = makeId();
  const now = new Date().toISOString();
  const initial: LeadExportJob = {
    id,
    createdAt: now,
    updatedAt: now,
    status: "queued",
    format: input.format,
    filter: input.filter,
  };
  await getRepo().save(initial);

  const running: LeadExportJob = {
    ...initial,
    status: "running",
    updatedAt: new Date().toISOString(),
  };
  await getRepo().save(running);

  try {
    const records = await exportLeads(input.filter);
    const completed: LeadExportJob = {
      ...running,
      status: "completed",
      updatedAt: new Date().toISOString(),
      resultCount: records.length,
      records: input.format === "json" ? records : undefined,
      csvContent: input.format === "csv" ? leadsToCsv(records) : undefined,
    };
    await getRepo().save(completed);
    return completed;
  } catch (error) {
    const failed: LeadExportJob = {
      ...running,
      status: "failed",
      updatedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "unknown_error",
    };
    await getRepo().save(failed);
    return failed;
  }
}

export async function getLeadExportJob(id: string): Promise<LeadExportJob | null> {
  return getRepo().get(id);
}

export async function listLeadExportJobs(query: LeadExportJobListQuery): Promise<LeadExportJobListResult> {
  return getRepo().list(query);
}

export async function clearLeadExportJobs(): Promise<void> {
  await getRepo().clear();
}

export async function purgeLeadExportJobsOlderThan(days: number): Promise<number> {
  const safeDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 30;
  return getRepo().purgeOlderThan(safeDays);
}
