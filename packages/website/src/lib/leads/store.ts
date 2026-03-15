import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import type { Locale } from "@/lib/i18n/locales";
import type { LeadType, ParsedLead } from "./parse";

export type LeadRecord = {
  id: string;
  type: LeadType;
  locale: Locale;
  name: string;
  email: string;
  company: string;
  useCase: string;
  source: string;
  createdAt: string;
};

type LeadExportFilter = {
  from?: string;
  to?: string;
  type?: LeadType;
  q?: string;
};

export type LeadListQuery = LeadExportFilter & {
  page?: number;
  pageSize?: number;
  order?: "asc" | "desc";
};

export type LeadListResult = {
  total: number;
  page: number;
  pageSize: number;
  records: LeadRecord[];
};

type Driver = "memory" | "file" | "postgres";

const DEFAULT_FILE_PATH = ".data/leads.json";
const DEFAULT_TABLE = "website_leads";

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
    driver: parseDriver(process.env.GAIALYNK_LEADS_STORE || process.env.GAIALYNK_ANALYTICS_STORE),
    filePath: process.env.GAIALYNK_LEADS_FILE || DEFAULT_FILE_PATH,
    databaseUrl: process.env.DATABASE_URL || "",
    tableName: sanitizeSqlIdentifier(process.env.GAIALYNK_LEADS_PG_TABLE || DEFAULT_TABLE),
  };
}

function getSignature(): string {
  const config = getConfig();
  return `${config.driver}::${config.filePath}::${config.tableName}::${Boolean(config.databaseUrl)}`;
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function withinRange(value: string, filter: LeadExportFilter): boolean {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return false;
  }
  if (filter.from) {
    const from = new Date(filter.from).getTime();
    if (!Number.isNaN(from) && timestamp < from) {
      return false;
    }
  }
  if (filter.to) {
    const to = new Date(filter.to).getTime();
    if (!Number.isNaN(to) && timestamp > to) {
      return false;
    }
  }
  return true;
}

interface LeadRepository {
  upsert(lead: ParsedLead): Promise<{ record: LeadRecord; isDuplicate: boolean }>;
  export(filter: LeadExportFilter): Promise<LeadRecord[]>;
  list(query: LeadListQuery): Promise<LeadListResult>;
  clear(): Promise<void>;
}

function normalizeQuery(query: LeadListQuery): Required<Pick<LeadListQuery, "page" | "pageSize" | "order">> & LeadExportFilter {
  const page = Number.isFinite(query.page) && query.page && query.page > 0 ? Math.floor(query.page) : 1;
  const pageSizeRaw = Number.isFinite(query.pageSize) && query.pageSize && query.pageSize > 0 ? Math.floor(query.pageSize) : 20;
  const pageSize = Math.min(100, Math.max(1, pageSizeRaw));
  const order = query.order === "asc" ? "asc" : "desc";
  return {
    ...query,
    page,
    pageSize,
    order,
  };
}

function matchesSearch(record: LeadRecord, q?: string): boolean {
  if (!q) {
    return true;
  }
  const needle = q.toLowerCase();
  return (
    record.email.toLowerCase().includes(needle) ||
    record.name.toLowerCase().includes(needle) ||
    record.company.toLowerCase().includes(needle) ||
    record.useCase.toLowerCase().includes(needle)
  );
}

function toListResult(all: LeadRecord[], query: LeadListQuery): LeadListResult {
  const normalized = normalizeQuery(query);
  const ordered = [...all].sort((a, b) =>
    normalized.order === "asc"
      ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const filtered = ordered.filter((record) => matchesSearch(record, normalized.q));
  const start = (normalized.page - 1) * normalized.pageSize;
  return {
    total: filtered.length,
    page: normalized.page,
    pageSize: normalized.pageSize,
    records: filtered.slice(start, start + normalized.pageSize),
  };
}

class MemoryLeadRepository implements LeadRepository {
  private readonly records: LeadRecord[] = [];

  async upsert(lead: ParsedLead): Promise<{ record: LeadRecord; isDuplicate: boolean }> {
    const duplicate = this.records.find((item) => item.email === lead.email && item.useCase === lead.useCase);
    if (duplicate) {
      return { record: duplicate, isDuplicate: true };
    }
    const record: LeadRecord = {
      id: makeId(),
      type: lead.type,
      locale: lead.locale,
      name: lead.name,
      email: lead.email,
      company: lead.company,
      useCase: lead.useCase,
      source: lead.source,
      createdAt: new Date().toISOString(),
    };
    this.records.push(record);
    return { record, isDuplicate: false };
  }

  async export(filter: LeadExportFilter): Promise<LeadRecord[]> {
    return this.records.filter((record) => {
      if (filter.type && record.type !== filter.type) {
        return false;
      }
      if (!matchesSearch(record, filter.q)) {
        return false;
      }
      return withinRange(record.createdAt, filter);
    });
  }

  async list(query: LeadListQuery): Promise<LeadListResult> {
    const exported = await this.export(query);
    return toListResult(exported, query);
  }

  async clear(): Promise<void> {
    this.records.splice(0, this.records.length);
  }
}

class FileLeadRepository implements LeadRepository {
  constructor(private readonly filePath: string) {}

  async upsert(lead: ParsedLead): Promise<{ record: LeadRecord; isDuplicate: boolean }> {
    const all = this.readAll();
    const duplicate = all.find((item) => item.email === lead.email && item.useCase === lead.useCase);
    if (duplicate) {
      return { record: duplicate, isDuplicate: true };
    }
    const record: LeadRecord = {
      id: makeId(),
      type: lead.type,
      locale: lead.locale,
      name: lead.name,
      email: lead.email,
      company: lead.company,
      useCase: lead.useCase,
      source: lead.source,
      createdAt: new Date().toISOString(),
    };
    all.push(record);
    this.writeAll(all);
    return { record, isDuplicate: false };
  }

  async export(filter: LeadExportFilter): Promise<LeadRecord[]> {
    return this.readAll().filter((record) => {
      if (filter.type && record.type !== filter.type) {
        return false;
      }
      if (!matchesSearch(record, filter.q)) {
        return false;
      }
      return withinRange(record.createdAt, filter);
    });
  }

  async list(query: LeadListQuery): Promise<LeadListResult> {
    const exported = await this.export(query);
    return toListResult(exported, query);
  }

  async clear(): Promise<void> {
    if (existsSync(this.filePath)) {
      rmSync(this.filePath, { force: true });
    }
  }

  private readAll(): LeadRecord[] {
    if (!existsSync(this.filePath)) {
      return [];
    }
    try {
      const raw = readFileSync(this.filePath, "utf-8");
      const parsed = JSON.parse(raw) as LeadRecord[] | null;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeAll(all: LeadRecord[]): void {
    const dir = path.dirname(this.filePath);
    mkdirSync(dir, { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(all, null, 2), "utf-8");
  }
}

class PostgresLeadRepository implements LeadRepository {
  private readonly pool: Pool | null;

  constructor(
    private readonly tableName: string,
    private readonly databaseUrl: string,
    private readonly fallback: LeadRepository,
  ) {
    this.pool = this.databaseUrl
      ? new Pool({
          connectionString: this.databaseUrl,
          max: 4,
        })
      : null;
  }

  async upsert(lead: ParsedLead): Promise<{ record: LeadRecord; isDuplicate: boolean }> {
    if (!this.pool) {
      return this.fallback.upsert(lead);
    }
    try {
      const insert = await this.pool.query<LeadRecord>(
        `INSERT INTO ${this.tableName}
          (lead_type, locale, name, email, company, use_case, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email, use_case)
         DO NOTHING
         RETURNING
           id::text AS id,
           lead_type AS type,
           locale,
           name,
           email,
           company,
           use_case AS "useCase",
           source,
           created_at AS "createdAt"`,
        [lead.type, lead.locale, lead.name, lead.email, lead.company, lead.useCase, lead.source],
      );

      if (insert.rows[0]) {
        return { record: insert.rows[0], isDuplicate: false };
      }

      const existing = await this.pool.query<LeadRecord>(
        `SELECT
          id::text AS id,
          lead_type AS type,
          locale,
          name,
          email,
          company,
          use_case AS "useCase",
          source,
          created_at AS "createdAt"
        FROM ${this.tableName}
        WHERE email = $1 AND use_case = $2
        ORDER BY created_at DESC
        LIMIT 1`,
        [lead.email, lead.useCase],
      );

      if (existing.rows[0]) {
        return { record: existing.rows[0], isDuplicate: true };
      }
    } catch {
      return this.fallback.upsert(lead);
    }
    return this.fallback.upsert(lead);
  }

  async export(filter: LeadExportFilter): Promise<LeadRecord[]> {
    if (!this.pool) {
      return this.fallback.export(filter);
    }
    try {
      const where: string[] = [];
      const values: string[] = [];
      if (filter.type) {
        values.push(filter.type);
        where.push(`lead_type = $${values.length}`);
      }
      if (filter.q) {
        values.push(`%${filter.q}%`);
        where.push(`(email ILIKE $${values.length} OR name ILIKE $${values.length} OR company ILIKE $${values.length} OR use_case ILIKE $${values.length})`);
      }
      if (filter.from) {
        values.push(filter.from);
        where.push(`created_at >= $${values.length}::timestamptz`);
      }
      if (filter.to) {
        values.push(filter.to);
        where.push(`created_at <= $${values.length}::timestamptz`);
      }

      const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const result = await this.pool.query<LeadRecord>(
        `SELECT
          id::text AS id,
          lead_type AS type,
          locale,
          name,
          email,
          company,
          use_case AS "useCase",
          source,
          created_at AS "createdAt"
        FROM ${this.tableName}
        ${whereClause}
        ORDER BY created_at DESC`,
        values,
      );
      return result.rows;
    } catch {
      return this.fallback.export(filter);
    }
  }

  async list(query: LeadListQuery): Promise<LeadListResult> {
    if (!this.pool) {
      return this.fallback.list(query);
    }
    try {
      const normalized = normalizeQuery(query);
      const where: string[] = [];
      const values: string[] = [];
      if (normalized.type) {
        values.push(normalized.type);
        where.push(`lead_type = $${values.length}`);
      }
      if (normalized.q) {
        values.push(`%${normalized.q}%`);
        where.push(`(email ILIKE $${values.length} OR name ILIKE $${values.length} OR company ILIKE $${values.length} OR use_case ILIKE $${values.length})`);
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

      const orderSql = normalized.order === "asc" ? "ASC" : "DESC";
      const offset = (normalized.page - 1) * normalized.pageSize;
      values.push(String(normalized.pageSize));
      values.push(String(offset));

      const rows = await this.pool.query<LeadRecord>(
        `SELECT
          id::text AS id,
          lead_type AS type,
          locale,
          name,
          email,
          company,
          use_case AS "useCase",
          source,
          created_at AS "createdAt"
        FROM ${this.tableName}
        ${whereClause}
        ORDER BY created_at ${orderSql}
        LIMIT $${values.length - 1}::int
        OFFSET $${values.length}::int`,
        values,
      );

      return {
        total: Number(countResult.rows[0]?.total || "0"),
        page: normalized.page,
        pageSize: normalized.pageSize,
        records: rows.rows,
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
}

function createRepo(): LeadRepository {
  const config = getConfig();
  if (config.driver === "file") {
    return new FileLeadRepository(config.filePath);
  }
  if (config.driver === "postgres") {
    return new PostgresLeadRepository(config.tableName, config.databaseUrl, new MemoryLeadRepository());
  }
  return new MemoryLeadRepository();
}

let repo: LeadRepository = createRepo();
let signature = getSignature();

function getRepo(): LeadRepository {
  const current = getSignature();
  if (current !== signature) {
    repo = createRepo();
    signature = current;
  }
  return repo;
}

export async function upsertLead(lead: ParsedLead): Promise<{ record: LeadRecord; isDuplicate: boolean }> {
  return getRepo().upsert(lead);
}

export async function exportLeads(filter: LeadExportFilter): Promise<LeadRecord[]> {
  return getRepo().export(filter);
}

export async function listLeads(query: LeadListQuery): Promise<LeadListResult> {
  return getRepo().list(query);
}

export async function clearLeadStore(): Promise<void> {
  await getRepo().clear();
}
