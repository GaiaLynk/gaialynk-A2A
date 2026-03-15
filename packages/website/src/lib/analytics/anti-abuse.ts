import {
  appendAntiAbuseAlert,
  clearAntiAbuseAlertStore,
  listPersistedAntiAbuseAlerts,
  type AntiAbuseAlertListQuery,
  type AntiAbuseAlertListResult,
} from "./anti-abuse-alert-store";

type RateBucket = {
  windowStartMs: number;
  count: number;
};

const buckets = new Map<string, RateBucket>();

type RateLimitDecision = {
  allowed: boolean;
  count: number;
  isSoftLimited: boolean;
};

export type AntiAbuseInput = {
  ip: string;
  userAgent: string;
  path: string;
  nowMs: number;
  source?: string;
  honeytoken?: string;
  clientElapsedMs?: number;
  softLimitPerMin: number;
  hardLimitPerMin: number;
  minDwellMs: number;
};

export type AntiAbuseResult = {
  allowed: boolean;
  isSuspectedBot: boolean;
  reasons: string[];
  currentRateCount: number;
  bypassedByWhitelist?: boolean;
};

function normalizeIp(raw: string): string {
  return raw.split(",")[0]?.trim() || "unknown-ip";
}

function parseCsvSet(raw: string | undefined): Set<string> {
  if (!raw) {
    return new Set();
  }
  return new Set(
    raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function getBucketKey(ip: string, userAgent: string, path: string): string {
  return `${normalizeIp(ip)}::${userAgent || "unknown-ua"}::${path || "unknown-path"}`;
}

function isWhitelisted(input: AntiAbuseInput): boolean {
  const sourceSet = parseCsvSet(process.env.GAIALYNK_ANALYTICS_TRUSTED_SOURCES);
  const ipSet = parseCsvSet(process.env.GAIALYNK_ANALYTICS_TRUSTED_IPS);
  return (input.source && sourceSet.has(input.source)) || ipSet.has(normalizeIp(input.ip));
}

function applyRateLimit(input: AntiAbuseInput): RateLimitDecision {
  const key = getBucketKey(input.ip, input.userAgent, input.path);
  const existing = buckets.get(key);

  if (!existing || input.nowMs - existing.windowStartMs >= 60_000) {
    buckets.set(key, {
      windowStartMs: input.nowMs,
      count: 1,
    });
    return {
      allowed: true,
      count: 1,
      isSoftLimited: false,
    };
  }

  existing.count += 1;
  const current = existing.count;
  return {
    allowed: current <= input.hardLimitPerMin,
    count: current,
    isSoftLimited: current > input.softLimitPerMin,
  };
}

export async function evaluateAnalyticsAntiAbuse(input: AntiAbuseInput): Promise<AntiAbuseResult> {
  if (isWhitelisted(input)) {
    return {
      allowed: true,
      isSuspectedBot: false,
      reasons: [],
      currentRateCount: 0,
      bypassedByWhitelist: true,
    };
  }

  const reasons: string[] = [];
  const rate = applyRateLimit(input);

  if (rate.isSoftLimited) {
    reasons.push("RATE_LIMIT_SOFT_EXCEEDED");
  }

  if (input.honeytoken && input.honeytoken.trim().length > 0) {
    reasons.push("HONEYPOT_TRIGGERED");
  }

  if (typeof input.clientElapsedMs === "number" && input.clientElapsedMs < input.minDwellMs) {
    reasons.push("MIN_DWELL_NOT_MET");
  }

  if (reasons.length || !rate.allowed) {
    const blocked = !rate.allowed;
    await appendAntiAbuseAlert({
      time: new Date(input.nowMs).toISOString(),
      ip: normalizeIp(input.ip),
      userAgent: input.userAgent || "unknown-ua",
      path: input.path || "unknown-path",
      reasons: reasons.length ? reasons : ["HARD_RATE_LIMIT_EXCEEDED"],
      blocked,
      severity: blocked ? "critical" : "warn",
    });
  }

  return {
    allowed: rate.allowed,
    isSuspectedBot: reasons.length > 0,
    reasons,
    currentRateCount: rate.count,
  };
}

export async function resetAnalyticsAntiAbuseState(): Promise<void> {
  buckets.clear();
  await clearAntiAbuseAlertStore();
}

export async function listAntiAbuseAlerts(query: AntiAbuseAlertListQuery): Promise<AntiAbuseAlertListResult> {
  return listPersistedAntiAbuseAlerts(query);
}
