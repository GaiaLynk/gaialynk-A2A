import type { Locale } from "@/lib/i18n/locales";
import type { AnalyticsEventName, AnalyticsPayload } from "./events";

type RawEvent = {
  name: AnalyticsEventName;
  payload: AnalyticsPayload;
  receivedAt: string;
};

type FunnelCounts = {
  homeViews: number;
  startBuildingClicks: number;
  docsClicks: number;
  demoSubmits: number;
  waitlistSubmits: number;
};

export type FunnelSnapshot = {
  locale: Locale | "all";
  counts: FunnelCounts;
  rates: {
    startBuildingCtr: number;
    docsActivationRate: number;
    demoConversionRate: number;
    waitlistConversionRate: number;
  };
  totalEvents: number;
};

function rate(numerator: number, denominator: number): number {
  if (!denominator) {
    return 0;
  }
  return Number(((numerator / denominator) * 100).toFixed(2));
}

export function buildFunnelSnapshot(events: RawEvent[], locale: Locale | "all"): FunnelSnapshot {
  const filtered = locale === "all" ? events : events.filter((event) => event.payload.locale === locale);

  const counts: FunnelCounts = {
    homeViews: filtered.filter((event) => event.name === "page_view" && (event.payload.page === "home" || event.payload.page.endsWith(`/${event.payload.locale}`))).length,
    startBuildingClicks: filtered.filter(
      (event) => event.name === "cta_click" && event.payload.cta_id === "start_building",
    ).length,
    docsClicks: filtered.filter((event) => event.name === "docs_click").length,
    demoSubmits: filtered.filter((event) => event.name === "demo_submit").length,
    waitlistSubmits: filtered.filter((event) => event.name === "waitlist_submit").length,
  };

  return {
    locale,
    counts,
    rates: {
      startBuildingCtr: rate(counts.startBuildingClicks, counts.homeViews),
      docsActivationRate: rate(counts.docsClicks, counts.startBuildingClicks),
      demoConversionRate: rate(counts.demoSubmits, counts.homeViews),
      waitlistConversionRate: rate(counts.waitlistSubmits, counts.homeViews),
    },
    totalEvents: filtered.length,
  };
}
