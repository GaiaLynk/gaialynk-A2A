const targetBaseUrl = process.env.MAINLINE_BASE_URL?.trim();

const timeoutMs = Number(process.env.MAINLINE_REACHABILITY_TIMEOUT_MS ?? 20_000);
const maxRetries = Number(process.env.MAINLINE_REACHABILITY_RETRIES ?? 1);
const retryDelayMs = Number(process.env.MAINLINE_REACHABILITY_RETRY_DELAY_MS ?? 1000);

const print = (message: string): void => {
  console.log(`[target-check] ${message}`);
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isSemanticReachabilityError(message: string): boolean {
  return (
    message.includes("target reachable check failed with HTTP") ||
    message.includes("missing api_version")
  );
}

function isRetryableNetworkError(err: unknown): boolean {
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

async function fetchMetaOnce(): Promise<void> {
  if (!targetBaseUrl) {
    throw new Error("MAINLINE_BASE_URL is required for preflight target reachability check");
  }
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${targetBaseUrl}/api/v1/meta`, {
      method: "GET",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`target reachable check failed with HTTP ${response.status}`);
    }
    const body = (await response.json().catch(() => ({}))) as { data?: { api_version?: string } };
    if (!body.data?.api_version) {
      throw new Error("target reachable check failed: missing api_version");
    }
    print(`ok: ${targetBaseUrl} (api_version=${body.data.api_version})`);
  } finally {
    clearTimeout(t);
  }
}

async function run(): Promise<void> {
  if (!targetBaseUrl) {
    throw new Error("MAINLINE_BASE_URL is required for preflight target reachability check");
  }
  const totalAttempts = maxRetries + 1;
  let lastErr: unknown;
  for (let attempt = 0; attempt < totalAttempts; attempt++) {
    try {
      await fetchMetaOnce();
      return;
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (isSemanticReachabilityError(msg)) {
        throw err;
      }
      if (!isRetryableNetworkError(err)) {
        throw err;
      }
      if (attempt < totalAttempts - 1) {
        print(
          `network retry ${attempt + 1}/${maxRetries} after: ${err instanceof Error ? err.name + ": " + err.message : msg} (delay ${retryDelayMs}ms)`,
        );
        await sleep(retryDelayMs);
      }
    }
  }
  throw lastErr;
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
