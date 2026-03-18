import { describe, expect, test } from "vitest";
import { PRODUCT_API_CAPABILITIES } from "../src/content/vision-coverage";
import { NOW_CAPABILITY_HEALTH_CHECKS } from "../src/content/now-capability-endpoints";
import { getMainlineApiUrl } from "../src/lib/config/mainline";

/**
 * P0-E: API health snapshot for "Now" capabilities.
 * Each track marked Now must bind to a reachable mainline endpoint.
 * Rule: capability endpoint = health check path (single source: now-capability-endpoints.ts).
 * Set RELEASE_GATE_SKIP_API_HEALTH=1 to skip when mainline is not running (e.g. CI without server).
 */

function isSkipApiHealth(): boolean {
  return process.env.RELEASE_GATE_SKIP_API_HEALTH === "1";
}

const API_HEALTH_MAX_NETWORK_RETRIES = 2;
const API_HEALTH_RETRY_DELAY_MS = 1000;

function isNetworkClassFetchFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err.name === "AbortError") return true;
  const m = err.message.toLowerCase();
  return (
    m.includes("fetch failed") ||
    m.includes("econnrefused") ||
    m.includes("etimedout") ||
    m.includes("econnreset") ||
    m.includes("socket hang up") ||
    m.includes("network request failed")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithNetworkRetry(url: string, init: RequestInit): Promise<Response> {
  let lastErr: unknown;
  const total = API_HEALTH_MAX_NETWORK_RETRIES + 1;
  for (let attempt = 0; attempt < total; attempt++) {
    try {
      return await fetch(url, init);
    } catch (err) {
      lastErr = err;
      if (!isNetworkClassFetchFailure(err) || attempt >= API_HEALTH_MAX_NETWORK_RETRIES) {
        throw err;
      }
      await sleep(API_HEALTH_RETRY_DELAY_MS);
    }
  }
  throw lastErr;
}

describe("website API health gate (Now capabilities)", () => {
  test("capability endpoint equals health check path (single source)", () => {
    for (const { capabilityKey, path } of NOW_CAPABILITY_HEALTH_CHECKS) {
      const cap = PRODUCT_API_CAPABILITIES[capabilityKey];
      expect(cap, `Capability "${capabilityKey}" must exist`).toBeDefined();
      expect(
        cap!.endpoint,
        `Capability "${capabilityKey}" endpoint must equal health check path (same source)`,
      ).toBe(path);
    }
  });

  test("all Now capability endpoints are defined in health snapshot", () => {
    const nowCapabilities = Object.entries(PRODUCT_API_CAPABILITIES).filter(
      ([_, cap]) => cap.status === "Now",
    );
    const snapshotKeys = new Set(NOW_CAPABILITY_HEALTH_CHECKS.map((c) => c.capabilityKey));
    for (const [key] of nowCapabilities) {
      expect(snapshotKeys.has(key), `Now capability "${key}" must be in API health snapshot`).toBe(true);
    }
  });

  test("when mainline is reachable, each Now endpoint responds with expected status", async () => {
    if (isSkipApiHealth()) {
      return;
    }
    const base = getMainlineApiUrl();
    for (const check of NOW_CAPABILITY_HEALTH_CHECKS) {
      const cap = PRODUCT_API_CAPABILITIES[check.capabilityKey];
      expect(cap?.status).toBe("Now");
      const url = `${base}${check.path}`;
      let res: Response;
      try {
        res = await fetchWithNetworkRetry(url, { method: check.method });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(
          `Now capability "${check.capabilityKey}" (${url}): request failed after network retries - ${msg}. ` +
            "Ensure mainline is running or set RELEASE_GATE_SKIP_API_HEALTH=1 to skip.",
        );
      }
      expect(
        check.acceptStatuses.includes(res.status),
        `Now capability "${check.capabilityKey}" (${url}): expected one of [${check.acceptStatuses.join(", ")}], got ${res.status}`,
      ).toBe(true);
    }
  }, 120_000);
});
