import { NextResponse } from "next/server";
import { buildFunnelSnapshot } from "@/lib/analytics/funnel";
import { isSupportedLocale } from "@/lib/i18n/locales";
import { readAnalyticsEvents } from "@/lib/analytics/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const localeQuery = url.searchParams.get("locale");
  const locale = localeQuery === "all" || !localeQuery ? "all" : localeQuery;

  if (locale !== "all" && !isSupportedLocale(locale)) {
    return NextResponse.json({ ok: false, error: "Invalid locale query." }, { status: 400 });
  }

  const events = await readAnalyticsEvents();
  const snapshot = buildFunnelSnapshot(events, locale);

  return NextResponse.json({
    ok: true,
    snapshot,
    generatedAt: new Date().toISOString(),
  });
}
