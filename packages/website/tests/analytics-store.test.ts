import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { clearAnalyticsStore, pushAnalyticsEvent, readAnalyticsEvents } from "../src/lib/analytics/store";

const previousDriver = process.env.GAIALYNK_ANALYTICS_STORE;
const previousFile = process.env.GAIALYNK_ANALYTICS_FILE;
const previousDatabaseUrl = process.env.DATABASE_URL;

let tempDir: string | null = null;

afterEach(async () => {
  process.env.GAIALYNK_ANALYTICS_STORE = previousDriver;
  process.env.GAIALYNK_ANALYTICS_FILE = previousFile;
  process.env.DATABASE_URL = previousDatabaseUrl;
  await clearAnalyticsStore();
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

describe("analytics store", () => {
  test("persists events to file when file driver is enabled", async () => {
    tempDir = mkdtempSync(path.join(tmpdir(), "gaialynk-analytics-"));
    const filePath = path.join(tempDir, "events.json");
    process.env.GAIALYNK_ANALYTICS_STORE = "file";
    process.env.GAIALYNK_ANALYTICS_FILE = filePath;
    await clearAnalyticsStore();

    await pushAnalyticsEvent("page_view", {
      locale: "en",
      page: "/en",
      referrer: "direct",
      timestamp: "2026-03-15T00:00:00.000Z",
      device_type: "desktop",
    });

    const all = await readAnalyticsEvents();
    expect(all).toHaveLength(1);
    expect(all[0]?.name).toBe("page_view");
  });

  test("falls back to in-memory behavior for postgres driver scaffold", async () => {
    process.env.GAIALYNK_ANALYTICS_STORE = "postgres";
    delete process.env.DATABASE_URL;
    await clearAnalyticsStore();

    await pushAnalyticsEvent("cta_click", {
      locale: "en",
      page: "home",
      referrer: "internal",
      timestamp: "2026-03-15T00:00:01.000Z",
      cta_id: "start_building",
      device_type: "desktop",
    });

    const all = await readAnalyticsEvents();
    expect(all).toHaveLength(1);
    expect(all[0]?.payload.cta_id).toBe("start_building");
  });
});
