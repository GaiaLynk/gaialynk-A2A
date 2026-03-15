import { describe, expect, test } from "vitest";
import { evaluateAnalyticsAntiAbuse, listAntiAbuseAlerts, resetAnalyticsAntiAbuseState } from "../src/lib/analytics/anti-abuse";

describe("analytics anti-abuse", () => {
  test("flags honeypot and short dwell as suspected bot", async () => {
    await resetAnalyticsAntiAbuseState();
    const result = await evaluateAnalyticsAntiAbuse({
      ip: "127.0.0.1",
      userAgent: "test-agent",
      path: "/en",
      nowMs: Date.now(),
      honeytoken: "bot-filled",
      clientElapsedMs: 10,
      softLimitPerMin: 60,
      hardLimitPerMin: 180,
      minDwellMs: 1200,
    });

    expect(result.allowed).toBe(true);
    expect(result.isSuspectedBot).toBe(true);
    expect(result.reasons).toContain("HONEYPOT_TRIGGERED");
    expect(result.reasons).toContain("MIN_DWELL_NOT_MET");
  });

  test("hard limit blocks request", async () => {
    await resetAnalyticsAntiAbuseState();
    const now = Date.now();
    let last = null as Awaited<ReturnType<typeof evaluateAnalyticsAntiAbuse>> | null;

    for (let i = 0; i < 5; i += 1) {
      last = await evaluateAnalyticsAntiAbuse({
        ip: "127.0.0.1",
        userAgent: "test-agent",
        path: "/en",
        nowMs: now,
        softLimitPerMin: 2,
        hardLimitPerMin: 4,
        minDwellMs: 1200,
      });
    }

    expect(last?.allowed).toBe(false);
    const alerts = await listAntiAbuseAlerts({ page: 1, pageSize: 10 });
    expect(alerts.records.length).toBeGreaterThan(0);
    expect(alerts.records.some((item) => item.blocked)).toBe(true);
  });

  test("trusted source bypasses anti-abuse checks", async () => {
    await resetAnalyticsAntiAbuseState();
    process.env.GAIALYNK_ANALYTICS_TRUSTED_SOURCES = "docs_redirect,partner_campaign";
    const result = await evaluateAnalyticsAntiAbuse({
      ip: "127.0.0.1",
      userAgent: "test-agent",
      path: "/en/docs",
      nowMs: Date.now(),
      source: "docs_redirect",
      honeytoken: "filled",
      clientElapsedMs: 1,
      softLimitPerMin: 1,
      hardLimitPerMin: 1,
      minDwellMs: 1200,
    });
    delete process.env.GAIALYNK_ANALYTICS_TRUSTED_SOURCES;

    expect(result.allowed).toBe(true);
    expect(result.isSuspectedBot).toBe(false);
    expect(result.bypassedByWhitelist).toBe(true);
    const alerts = await listAntiAbuseAlerts({ page: 1, pageSize: 10 });
    expect(alerts.records.length).toBe(0);
  });

  test("supports blocked filter in persisted alerts list", async () => {
    await resetAnalyticsAntiAbuseState();
    const now = Date.now();
    for (let i = 0; i < 3; i += 1) {
      await evaluateAnalyticsAntiAbuse({
        ip: "10.0.0.1",
        userAgent: "test-agent",
        path: "/en",
        nowMs: now,
        softLimitPerMin: 1,
        hardLimitPerMin: 2,
        minDwellMs: 1200,
      });
    }

    const blockedOnly = await listAntiAbuseAlerts({ page: 1, pageSize: 10, blocked: true });
    expect(blockedOnly.records.length).toBe(1);
    expect(blockedOnly.records[0]?.severity).toBe("critical");
  });

  test("supports time window filtering for alerts", async () => {
    await resetAnalyticsAntiAbuseState();
    const now = Date.now();
    await evaluateAnalyticsAntiAbuse({
      ip: "10.0.0.2",
      userAgent: "test-agent",
      path: "/en",
      nowMs: now,
      honeytoken: "x",
      softLimitPerMin: 10,
      hardLimitPerMin: 20,
      minDwellMs: 1200,
    });
    const futureOnly = await listAntiAbuseAlerts({
      page: 1,
      pageSize: 10,
      from: new Date(now + 60_000).toISOString(),
    });
    expect(futureOnly.records.length).toBe(0);
  });
});
