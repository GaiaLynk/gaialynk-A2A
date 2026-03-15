import { NextResponse } from "next/server";
import { buildAnalyticsPayload } from "@/lib/analytics/events";
import { isSupportedLocale } from "@/lib/i18n/locales";
import { isAnalyticsEventName, pushAnalyticsEvent } from "@/lib/analytics/store";

type RawBody = {
  name?: unknown;
  payload?: {
    locale?: unknown;
    page?: unknown;
    referrer?: unknown;
    cta_id?: unknown;
    source?: unknown;
    device_type?: unknown;
    timestamp?: unknown;
  };
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RawBody | null;
  if (!body || typeof body.name !== "string" || !isAnalyticsEventName(body.name)) {
    return NextResponse.json({ ok: false, error: "Invalid event name." }, { status: 400 });
  }

  const payload = body.payload;
  if (!payload || !isSupportedLocale(String(payload.locale ?? ""))) {
    return NextResponse.json({ ok: false, error: "Invalid locale." }, { status: 400 });
  }
  if (typeof payload.page !== "string" || typeof payload.referrer !== "string") {
    return NextResponse.json({ ok: false, error: "Invalid payload fields." }, { status: 400 });
  }

  const normalized = buildAnalyticsPayload({
    locale: payload.locale,
    page: payload.page,
    referrer: payload.referrer,
    cta_id: typeof payload.cta_id === "string" ? payload.cta_id : undefined,
    source: typeof payload.source === "string" ? payload.source : undefined,
    device_type: payload.device_type === "mobile" || payload.device_type === "desktop" ? payload.device_type : undefined,
    timestamp: typeof payload.timestamp === "string" ? payload.timestamp : undefined,
  });

  pushAnalyticsEvent(body.name, normalized);
  return NextResponse.json({ ok: true });
}
