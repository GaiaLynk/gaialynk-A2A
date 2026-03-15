import { NextResponse } from "next/server";
import { evaluateAnalyticsAntiAbuse } from "@/lib/analytics/anti-abuse";
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
    honeytoken?: unknown;
    client_elapsed_ms?: unknown;
    timestamp?: unknown;
  };
};

function readPositiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw || "");
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RawBody | null;
  if (!body || typeof body.name !== "string" || !isAnalyticsEventName(body.name)) {
    return NextResponse.json({ ok: false, error: "Invalid event name." }, { status: 400 });
  }

  const payload = body.payload;
  const localeCandidate = typeof payload?.locale === "string" ? payload.locale : "";
  if (!payload || !isSupportedLocale(localeCandidate)) {
    return NextResponse.json({ ok: false, error: "Invalid locale." }, { status: 400 });
  }
  if (typeof payload.page !== "string" || typeof payload.referrer !== "string") {
    return NextResponse.json({ ok: false, error: "Invalid payload fields." }, { status: 400 });
  }

  const normalized = buildAnalyticsPayload({
    locale: localeCandidate,
    page: payload.page,
    referrer: payload.referrer,
    cta_id: typeof payload.cta_id === "string" ? payload.cta_id : undefined,
    source: typeof payload.source === "string" ? payload.source : undefined,
    device_type: payload.device_type === "mobile" || payload.device_type === "desktop" ? payload.device_type : undefined,
    timestamp: typeof payload.timestamp === "string" ? payload.timestamp : undefined,
  });

  const userAgent = request.headers.get("user-agent") || "unknown-ua";
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "unknown-ip";
  const softLimitPerMin = readPositiveInt(process.env.GAIALYNK_ANALYTICS_RATE_LIMIT_SOFT_PER_MIN, 60);
  const hardLimitPerMin = readPositiveInt(process.env.GAIALYNK_ANALYTICS_RATE_LIMIT_HARD_PER_MIN, 180);
  const minDwellMs = readPositiveInt(process.env.GAIALYNK_ANALYTICS_MIN_DWELL_MS, 1200);

  const antiAbuse = await evaluateAnalyticsAntiAbuse({
    ip,
    userAgent,
    path: normalized.page,
    nowMs: Date.now(),
    source: normalized.source,
    honeytoken: typeof payload.honeytoken === "string" ? payload.honeytoken : "",
    clientElapsedMs: typeof payload.client_elapsed_ms === "number" ? payload.client_elapsed_ms : undefined,
    softLimitPerMin,
    hardLimitPerMin,
    minDwellMs,
  });

  if (!antiAbuse.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "rate_limited",
        reasons: antiAbuse.reasons,
      },
      { status: 429 },
    );
  }

  await pushAnalyticsEvent(body.name, {
    ...normalized,
    is_suspected_bot: antiAbuse.isSuspectedBot,
  });
  return NextResponse.json({
    ok: true,
    is_suspected_bot: antiAbuse.isSuspectedBot,
    reasons: antiAbuse.reasons,
  });
}
