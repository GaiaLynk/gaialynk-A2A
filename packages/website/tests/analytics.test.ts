import { describe, expect, test, vi } from "vitest";
import { buildAnalyticsPayload, inferDeviceType } from "../src/lib/analytics/events";
import { setTrackAdapter, trackEvent } from "../src/lib/analytics/track";

describe("analytics helpers", () => {
  test("auto-fills timestamp when missing", () => {
    const payload = buildAnalyticsPayload({
      locale: "en",
      page: "home",
      referrer: "direct",
      cta_id: "start_building",
      device_type: "desktop",
    });

    expect(payload.timestamp).toBeTruthy();
    expect(payload.page).toBe("home");
  });

  test("calls adapter when tracker is installed", () => {
    const adapter = vi.fn();
    setTrackAdapter(adapter);

    trackEvent("cta_click", {
      locale: "en",
      page: "home",
      referrer: "direct",
      timestamp: new Date().toISOString(),
      cta_id: "start_building",
    });

    expect(adapter).toHaveBeenCalledTimes(1);
  });

  test("infers device type by width threshold", () => {
    expect(inferDeviceType(375)).toBe("mobile");
    expect(inferDeviceType(1280)).toBe("desktop");
  });
});
