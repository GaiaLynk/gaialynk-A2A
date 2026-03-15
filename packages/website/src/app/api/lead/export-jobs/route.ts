import { NextResponse } from "next/server";
import { validateLeadsAccess } from "@/lib/leads/auth";
import { createLeadExportJob, listLeadExportJobs } from "@/lib/leads/export-jobs";

type RawBody = {
  format?: unknown;
  type?: unknown;
  from?: unknown;
  to?: unknown;
  q?: unknown;
};

function readPositiveInt(raw: string | null, fallback: number): number {
  const parsed = Number(raw || "");
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

export async function GET(request: Request) {
  const auth = validateLeadsAccess(request.headers);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  const url = new URL(request.url);
  const limit = readPositiveInt(url.searchParams.get("limit"), 20);
  const page = readPositiveInt(url.searchParams.get("page"), 1);
  const pageSize = readPositiveInt(url.searchParams.get("pageSize"), limit);
  const status = url.searchParams.get("status");
  const format = url.searchParams.get("format");
  const from = url.searchParams.get("from") || undefined;
  const to = url.searchParams.get("to") || undefined;
  const list = await listLeadExportJobs({
    page,
    pageSize,
    status: status === "queued" || status === "running" || status === "completed" || status === "failed" ? status : undefined,
    format: format === "json" || format === "csv" ? format : undefined,
    from,
    to,
  });
  const jobs = list.jobs.map((job) => ({
    id: job.id,
    status: job.status,
    format: job.format,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    resultCount: job.resultCount || 0,
    error: job.error || null,
  }));
  return NextResponse.json({
    ok: true,
    total: list.total,
    page: list.page,
    pageSize: list.pageSize,
    jobs,
  });
}

export async function POST(request: Request) {
  const auth = validateLeadsAccess(request.headers);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as RawBody | null;
  const format = body?.format === "csv" ? "csv" : "json";
  const type = body?.type === "waitlist" || body?.type === "demo" ? body.type : undefined;
  const from = typeof body?.from === "string" ? body.from : undefined;
  const to = typeof body?.to === "string" ? body.to : undefined;
  const q = typeof body?.q === "string" ? body.q : undefined;

  const job = await createLeadExportJob({
    format,
    filter: {
      type,
      from,
      to,
      q,
    },
  });

  return NextResponse.json({
    ok: true,
    jobId: job.id,
    status: job.status,
    resultCount: job.resultCount || 0,
  });
}
