import { describe, expect, test } from "vitest";
import { buildFunnelSnapshot } from "../src/lib/analytics/funnel";

describe("funnel snapshot", () => {
  test("calculates counts and rates for locale", () => {
    const snapshot = buildFunnelSnapshot(
      [
        {
          name: "page_view",
          payload: { locale: "en", page: "/en", referrer: "direct", timestamp: "2026-01-01T00:00:00Z" },
          receivedAt: "2026-01-01T00:00:00Z",
        },
        {
          name: "cta_click",
          payload: {
            locale: "en",
            page: "home",
            referrer: "internal",
            timestamp: "2026-01-01T00:00:01Z",
            cta_id: "start_building",
          },
          receivedAt: "2026-01-01T00:00:01Z",
        },
        {
          name: "docs_click",
          payload: { locale: "en", page: "developers", referrer: "internal", timestamp: "2026-01-01T00:00:02Z" },
          receivedAt: "2026-01-01T00:00:02Z",
        },
      ],
      "en",
    );

    expect(snapshot.counts.homeViews).toBe(1);
    expect(snapshot.counts.startBuildingClicks).toBe(1);
    expect(snapshot.counts.docsClicks).toBe(1);
    expect(snapshot.rates.startBuildingCtr).toBe(100);
    expect(snapshot.rates.docsActivationRate).toBe(100);
  });
});
