import { NextResponse } from "next/server";
import { buildAnalyticsHealthSnapshot, buildAnalyticsReadySnapshot } from "@/lib/analytics/health";
import { getAnalyticsStoreRuntimeConfig, readAnalyticsEvents } from "@/lib/analytics/store";

function readPositiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw || "");
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function getRetentionDays(): number {
  return readPositiveInt(process.env.GAIALYNK_ANALYTICS_RETENTION_DAYS, 30);
}

export async function GET() {
  const events = await readAnalyticsEvents();
  const config = getAnalyticsStoreRuntimeConfig();
  const health = buildAnalyticsHealthSnapshot({
    events,
    config,
    retentionDays: getRetentionDays(),
    maxIdleSeconds: readPositiveInt(process.env.GAIALYNK_ANALYTICS_ALERT_MAX_IDLE_SECONDS, 900),
    minEvents24h: readPositiveInt(process.env.GAIALYNK_ANALYTICS_ALERT_MIN_EVENTS_24H, 1),
  });
  const ready = buildAnalyticsReadySnapshot({
    config,
    level: health.level,
  });

  return NextResponse.json(
    {
      ok: ready.ready,
      ready,
    },
    { status: ready.ready ? 200 : 503 },
  );
}
