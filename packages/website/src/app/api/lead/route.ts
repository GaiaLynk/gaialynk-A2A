import { NextResponse } from "next/server";
import { parseLeadInput } from "@/lib/leads/parse";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseLeadInput(body ?? {});

  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: "Lead captured.",
    lead: {
      ...parsed.data,
      receivedAt: new Date().toISOString(),
    },
  });
}
