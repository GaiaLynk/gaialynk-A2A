import type { AnalyticsEventName, AnalyticsPayload } from "./events";

export type TrackAdapter = (name: AnalyticsEventName, payload: AnalyticsPayload) => void;

let adapter: TrackAdapter | null = null;

export function setTrackAdapter(nextAdapter: TrackAdapter): void {
  adapter = nextAdapter;
}

export function trackEvent(name: AnalyticsEventName, payload: AnalyticsPayload): void {
  if (!adapter) {
    return;
  }
  adapter(name, payload);
}
