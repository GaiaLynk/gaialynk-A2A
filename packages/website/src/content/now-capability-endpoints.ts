/**
 * Single source of truth for "Now" capability API paths.
 * Rule: capability endpoint (vision-coverage) = health check path (api-health-gate).
 * Used by vision-coverage.ts and api-health-gate.test.ts.
 */

export const NOW_CAPABILITY_PATHS: Record<string, string> = {
  conversations: "/api/v1/conversations",
  invocations: "/api/v1/invocations",
  receipts: "/api/v1/receipts/00000000-0000-0000-0000-000000000000",
  reviewQueue: "/api/v1/review-queue",
  nodes: "/api/v1/nodes",
};

export const NOW_CAPABILITY_HEALTH_CHECKS: Array<{
  capabilityKey: string;
  path: string;
  method: "GET";
  acceptStatuses: number[];
}> = Object.entries(NOW_CAPABILITY_PATHS).map(([capabilityKey, path]) => {
  // reviewQueue requires actor context; 400 means endpoint is reachable and contract-enforced.
  const acceptStatuses = capabilityKey === "reviewQueue" ? [200, 400, 404] : [200, 404];
  return {
    capabilityKey,
    path,
    method: "GET" as const,
    acceptStatuses,
  };
});
