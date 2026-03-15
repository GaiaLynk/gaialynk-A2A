import type { Locale } from "@/lib/i18n/locales";

export const ANALYTICS_EVENTS = [
  "page_view",
  "cta_click",
  "docs_click",
  "demo_click",
  "waitlist_submit",
  "demo_submit",
  "lang_switch",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export type AnalyticsPayload = {
  locale: Locale;
  page: string;
  referrer: string;
  timestamp: string;
  cta_id?: string;
  source?: string;
  device_type?: "mobile" | "desktop";
};

export function inferDeviceType(width: number): "mobile" | "desktop" {
  return width < 768 ? "mobile" : "desktop";
}

export function buildAnalyticsPayload(
  payload: Omit<AnalyticsPayload, "timestamp"> & { timestamp?: string },
): AnalyticsPayload {
  return {
    ...payload,
    device_type: payload.device_type ?? "desktop",
    timestamp: payload.timestamp ?? new Date().toISOString(),
  };
}
