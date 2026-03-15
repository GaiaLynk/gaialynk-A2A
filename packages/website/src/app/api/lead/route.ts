import { NextResponse } from "next/server";
import { parseLeadInput } from "@/lib/leads/parse";
import { upsertLead } from "@/lib/leads/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseLeadInput(body ?? {});

  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const result = await upsertLead(parsed.data);
  return NextResponse.json({
    ok: true,
    message: result.isDuplicate ? "Lead already exists." : "Lead captured.",
    is_duplicate: result.isDuplicate,
    lead: result.record,
  });
}
