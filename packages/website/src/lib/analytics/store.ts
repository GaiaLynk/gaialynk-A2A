import { ANALYTICS_EVENTS, type AnalyticsEventName, type AnalyticsPayload } from "./events";

type StoredAnalyticsEvent = {
  name: AnalyticsEventName;
  payload: AnalyticsPayload;
  receivedAt: string;
};

const MAX_EVENTS = 5000;
const events: StoredAnalyticsEvent[] = [];

export function isAnalyticsEventName(value: string): value is AnalyticsEventName {
  return ANALYTICS_EVENTS.includes(value as AnalyticsEventName);
}

export function pushAnalyticsEvent(name: AnalyticsEventName, payload: AnalyticsPayload): void {
  events.push({
    name,
    payload,
    receivedAt: new Date().toISOString(),
  });

  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
}

export function readAnalyticsEvents(): StoredAnalyticsEvent[] {
  return [...events];
}
