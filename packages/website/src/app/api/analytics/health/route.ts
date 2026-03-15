import { NextResponse } from "next/server";
import { buildAnalyticsPayload } from "@/lib/analytics/events";
import { buildAnalyticsHealthSnapshot, extractHealthAuthToken } from "@/lib/analytics/health";
import { getAnalyticsStoreRuntimeConfig, pushAnalyticsEvent, readAnalyticsEvents } from "@/lib/analytics/store";

function getRetentionDays(): number {
  const raw = process.env.GAIALYNK_ANALYTICS_RETENTION_DAYS || "30";
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 30;
  }
  return Math.floor(parsed);
}

function readPositiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw || "");
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function parseProbeMode(raw: string | null): "none" | "dry-run" | "write" {
  if (raw === "dry-run" || raw === "write") {
    return raw;
  }
  return "none";
}

export async function GET(request: Request) {
  const expectedKey = process.env.GAIALYNK_ANALYTICS_HEALTH_KEY || "";
  if (!expectedKey) {
    return NextResponse.json({ ok: false, error: "GAIALYNK_ANALYTICS_HEALTH_KEY is not configured." }, { status: 503 });
  }

  const token = extractHealthAuthToken(request.headers);
  if (!token || token !== expectedKey) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const events = await readAnalyticsEvents();
  const config = getAnalyticsStoreRuntimeConfig();
  const retentionDays = getRetentionDays();
  const maxIdleSeconds = readPositiveInt(process.env.GAIALYNK_ANALYTICS_ALERT_MAX_IDLE_SECONDS, 900);
  const minEvents24h = readPositiveInt(process.env.GAIALYNK_ANALYTICS_ALERT_MIN_EVENTS_24H, 1);
  const url = new URL(request.url);
  const probeMode = parseProbeMode(url.searchParams.get("probe"));
  let probeWritten = false;

  if (probeMode === "write") {
    await pushAnalyticsEvent(
      "page_view",
      buildAnalyticsPayload({
        locale: "en",
        page: "__health_probe__",
        referrer: "health_endpoint",
        source: "health_write_probe",
        cta_id: "analytics_health_probe",
      }),
    );
    probeWritten = true;
  }

  return NextResponse.json({
    ok: true,
    health: buildAnalyticsHealthSnapshot({
      events,
      config,
      retentionDays,
      maxIdleSeconds,
      minEvents24h,
    }),
    probe: {
      mode: probeMode,
      wroteEvent: probeWritten,
    },
  });
}
