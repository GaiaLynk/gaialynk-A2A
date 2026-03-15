import { NextResponse } from "next/server";
import { validateLeadsAccess } from "@/lib/leads/auth";
import { leadsToCsv } from "@/lib/leads/csv";
import { exportLeads } from "@/lib/leads/store";

export async function GET(request: Request) {
  const auth = validateLeadsAccess(request.headers);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "csv" ? "csv" : "json";
  const type = url.searchParams.get("type");
  const from = url.searchParams.get("from") || undefined;
  const to = url.searchParams.get("to") || undefined;
  const q = url.searchParams.get("q") || undefined;
  const records = await exportLeads({
    type: type === "waitlist" || type === "demo" ? type : undefined,
    from,
    to,
    q,
  });

  if (format === "csv") {
    const csv = leadsToCsv(records);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="leads-export.csv"`,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    count: records.length,
    records,
  });
}
