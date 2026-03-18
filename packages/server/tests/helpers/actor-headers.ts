/**
 * Build gateway actor headers aligned with production identity model.
 * When ACTOR_TRUST_TOKEN is set, X-Actor-Trust-Token is required for trusted resolution.
 */
export function buildActorHeaders(actorId: string, role?: string): Record<string, string> {
  const headers: Record<string, string> = { "X-Actor-Id": actorId };
  if (role !== undefined && role !== "") {
    headers["X-Actor-Role"] = role;
  }
  const token = process.env.ACTOR_TRUST_TOKEN?.trim();
  if (token) {
    headers["X-Actor-Trust-Token"] = token;
  }
  return headers;
}
