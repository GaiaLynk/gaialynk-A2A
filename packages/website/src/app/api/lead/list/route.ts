import { NextResponse } from "next/server";
import { validateLeadsAccess } from "@/lib/leads/auth";
import { listLeads } from "@/lib/leads/store";

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
  const type = url.searchParams.get("type");
  const result = await listLeads({
    type: type === "waitlist" || type === "demo" ? type : undefined,
    from: url.searchParams.get("from") || undefined,
    to: url.searchParams.get("to") || undefined,
    q: url.searchParams.get("q") || undefined,
    page: readPositiveInt(url.searchParams.get("page"), 1),
    pageSize: readPositiveInt(url.searchParams.get("pageSize"), 20),
    order: url.searchParams.get("order") === "asc" ? "asc" : "desc",
  });

  return NextResponse.json({
    ok: true,
    ...result,
  });
}
