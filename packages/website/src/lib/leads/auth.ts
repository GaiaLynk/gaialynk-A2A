export function extractLeadsAccessToken(headers: Headers): string {
  const custom = headers.get("x-leads-export-key");
  if (custom) {
    return custom;
  }
  const auth = headers.get("authorization");
  if (!auth) {
    return "";
  }
  const [scheme, token] = auth.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return "";
  }
  return token;
}

export function validateLeadsAccess(headers: Headers): { ok: true } | { ok: false; status: number; error: string } {
  const expected = process.env.GAIALYNK_LEADS_EXPORT_KEY || "";
  if (!expected) {
    return { ok: false, status: 503, error: "GAIALYNK_LEADS_EXPORT_KEY is not configured." };
  }
  const token = extractLeadsAccessToken(headers);
  if (!token || token !== expected) {
    return { ok: false, status: 401, error: "Unauthorized." };
  }
  return { ok: true };
}
