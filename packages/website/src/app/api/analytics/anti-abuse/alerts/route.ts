import { NextResponse } from "next/server";
import { listAntiAbuseAlerts } from "@/lib/analytics/anti-abuse";
import { extractHealthAuthToken } from "@/lib/analytics/health";

function readPositiveInt(raw: string | null, fallback: number): number {
  const parsed = Number(raw || "");
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

export async function GET(request: Request) {
  const expected = process.env.GAIALYNK_ANALYTICS_HEALTH_KEY || "";
  if (!expected) {
    return NextResponse.json({ ok: false, error: "GAIALYNK_ANALYTICS_HEALTH_KEY is not configured." }, { status: 503 });
  }
  const token = extractHealthAuthToken(request.headers);
  if (!token || token !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = readPositiveInt(url.searchParams.get("limit"), 50);
  const page = readPositiveInt(url.searchParams.get("page"), 1);
  const pageSize = readPositiveInt(url.searchParams.get("pageSize"), limit);
  const from = url.searchParams.get("from") || undefined;
  const to = url.searchParams.get("to") || undefined;
  const blockedRaw = url.searchParams.get("blocked");
  const severityRaw = url.searchParams.get("severity");
  const list = await listAntiAbuseAlerts({
    page,
    pageSize,
    from,
    to,
    blocked: blockedRaw === "true" ? true : blockedRaw === "false" ? false : undefined,
    severity: severityRaw === "warn" || severityRaw === "critical" ? severityRaw : undefined,
  });

  return NextResponse.json({
    ok: true,
    count: list.records.length,
    total: list.total,
    page: list.page,
    pageSize: list.pageSize,
    records: list.records,
  });
}
