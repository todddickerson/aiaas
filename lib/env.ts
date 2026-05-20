// Tiny env exporter. Avoids a runtime dependency (zod, etc.) — we just
// read process.env and surface the values we care about with defaults.
// All access is lazy (function calls, not module-load constants) so a
// missing env var doesn't crash a build.

export function whopApiKey(): string | undefined {
  // Accept either WHOP_API_KEY (canonical) or WHOP_AIAAS_API_KEY (matches
  // the value in ~/clawd/.env so existing dev shells "just work").
  return process.env.WHOP_API_KEY || process.env.WHOP_AIAAS_API_KEY;
}

export function whopBizId(): string | undefined {
  return process.env.WHOP_BIZ_ID || process.env.WHOP_AIAAS_BIZ_ID;
}

export function whopApiBaseUrl(): string {
  return process.env.WHOP_API_BASE_URL || "https://api.whop.com/api";
}

export function whopApiVersion(): string {
  return process.env.WHOP_API_VERSION || "v1";
}

export function whopApiRoot(): string {
  return `${whopApiBaseUrl()}/${whopApiVersion()}`;
}

/**
 * True when stub mode is requested explicitly OR no real key is configured.
 * Defaults to false when a real key is set so production traffic flows to
 * Whop without flipping a flag.
 */
export function whopStubMode(): boolean {
  if (process.env.WHOP_STUB === "true") return true;
  return !whopApiKey();
}
