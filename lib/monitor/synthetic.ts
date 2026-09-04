/**
 * Synthetic production monitor — probe definitions + pure evaluation logic.
 *
 * BUILD-PLAN §"Drift detection in production": a GitHub Action cron hits the
 * 5 critical endpoints + the homepage every 15 minutes and alerts on
 * regression. This module is the framework-free core so it can be unit-tested
 * in Vitest and driven from `scripts/synthetic-monitor.mjs` in CI.
 *
 * Design notes:
 *   • The alpha gate middleware REWRITES (not redirects) gated pages to
 *     /gate, so a gated homepage still returns 200. Probes therefore check
 *     status AND a body marker; the marker for gated surfaces accepts either
 *     the real page or the gate interstitial so enabling AIAAS_ALPHA_TOKEN
 *     doesn't page anyone.
 *   • /api/health is intentionally cheap (no Whop / Composio calls), so the
 *     monitor is free to run every 15 min without burning vendor quota.
 */

export type ProbeDefinition = {
  /** Human label used in summaries. */
  name: string;
  /** Path relative to the base URL. */
  path: string;
  /** Acceptable HTTP status codes. */
  expectStatus: number[];
  /**
   * At least ONE of these substrings must appear in the body. Empty array =
   * body is not inspected.
   */
  expectAnyOf: string[];
  /** Soft latency budget in ms. Exceeding it is a WARN, not a FAIL. */
  latencyBudgetMs: number;
};

export type ProbeSample = {
  status: number;
  body: string;
  latencyMs: number;
  error?: string;
};

export type ProbeResult = {
  name: string;
  path: string;
  status: number;
  latencyMs: number;
  outcome: "pass" | "warn" | "fail";
  reason?: string;
};

// The gate interstitial renders this marker; used as an alternate for any
// surface the middleware may rewrite.
export const GATE_MARKER = "Alpha access";

/**
 * Critical-path probes. Order matters only for the summary table.
 * 5 critical endpoints + the homepage = the plan's "5 + homepage".
 */
export const PROBES: ProbeDefinition[] = [
  {
    name: "homepage",
    path: "/",
    expectStatus: [200],
    expectAnyOf: ["hero-headline", GATE_MARKER],
    latencyBudgetMs: 3000,
  },
  {
    name: "health",
    path: "/api/health",
    expectStatus: [200],
    expectAnyOf: ['"ok":true'],
    latencyBudgetMs: 1500,
  },
  {
    name: "status page",
    path: "/status",
    expectStatus: [200],
    expectAnyOf: ["status-page", GATE_MARKER],
    latencyBudgetMs: 3000,
  },
  {
    name: "agent detail",
    path: "/agents/funnelsmith",
    expectStatus: [200],
    expectAnyOf: ["agent-hero", GATE_MARKER],
    latencyBudgetMs: 3000,
  },
  {
    name: "manager profile",
    path: "/managers/todd",
    expectStatus: [200],
    expectAnyOf: ["manager-cover", GATE_MARKER],
    latencyBudgetMs: 3000,
  },
  {
    name: "sitemap",
    path: "/sitemap.xml",
    expectStatus: [200],
    expectAnyOf: ["<urlset", "/agents/funnelsmith"],
    latencyBudgetMs: 2000,
  },
];

/** Pure: turn a raw sample into a pass / warn / fail verdict. */
export function evaluateProbe(
  def: ProbeDefinition,
  sample: ProbeSample,
): ProbeResult {
  const base = {
    name: def.name,
    path: def.path,
    status: sample.status,
    latencyMs: sample.latencyMs,
  };

  if (sample.error) {
    return { ...base, outcome: "fail", reason: `request error: ${sample.error}` };
  }
  if (!def.expectStatus.includes(sample.status)) {
    return {
      ...base,
      outcome: "fail",
      reason: `status ${sample.status} not in [${def.expectStatus.join(", ")}]`,
    };
  }
  if (
    def.expectAnyOf.length > 0 &&
    !def.expectAnyOf.some((marker) => sample.body.includes(marker))
  ) {
    return {
      ...base,
      outcome: "fail",
      reason: `body missing all of: ${def.expectAnyOf.map((m) => JSON.stringify(m)).join(" | ")}`,
    };
  }
  if (sample.latencyMs > def.latencyBudgetMs) {
    return {
      ...base,
      outcome: "warn",
      reason: `latency ${sample.latencyMs}ms > budget ${def.latencyBudgetMs}ms`,
    };
  }
  return { ...base, outcome: "pass" };
}

/** Pure: roll individual results up into a run verdict. */
export function summarize(results: ProbeResult[]): {
  ok: boolean;
  failed: ProbeResult[];
  warned: ProbeResult[];
} {
  const failed = results.filter((r) => r.outcome === "fail");
  const warned = results.filter((r) => r.outcome === "warn");
  return { ok: failed.length === 0, failed, warned };
}

/** Pure: GitHub-flavoured markdown table for $GITHUB_STEP_SUMMARY / issues. */
export function renderMarkdown(baseUrl: string, results: ProbeResult[]): string {
  const { ok, failed, warned } = summarize(results);
  const glyph = (o: ProbeResult["outcome"]) =>
    o === "pass" ? "✅" : o === "warn" ? "⚠️" : "❌";
  const lines = [
    `### Synthetic monitor — ${ok ? "healthy" : "REGRESSION"}`,
    "",
    `Target: \`${baseUrl}\` · ${results.length} probes · ${failed.length} failed · ${warned.length} slow`,
    "",
    "| | Probe | Path | Status | Latency | Note |",
    "|---|---|---|---|---|---|",
    ...results.map(
      (r) =>
        `| ${glyph(r.outcome)} | ${r.name} | \`${r.path}\` | ${r.status || "—"} | ${r.latencyMs}ms | ${r.reason ?? ""} |`,
    ),
  ];
  return lines.join("\n");
}

/** Join base + path without doubling slashes. */
export function probeUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}${path}`;
}

/**
 * Fetch a single probe. Isolated so the CLI and tests can inject a fetch.
 * Never throws — network errors become `sample.error`.
 */
export async function sampleProbe(
  baseUrl: string,
  def: ProbeDefinition,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 15_000,
): Promise<ProbeSample> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const t0 = Date.now();
  try {
    const res = await fetchImpl(probeUrl(baseUrl, def.path), {
      signal: controller.signal,
      headers: { "user-agent": "aiaas-synthetic-monitor/1.0" },
      redirect: "manual",
    });
    const body = await res.text();
    return { status: res.status, body, latencyMs: Date.now() - t0 };
  } catch (err) {
    return {
      status: 0,
      body: "",
      latencyMs: Date.now() - t0,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Run every probe (in parallel) and return evaluated results. */
export async function runSyntheticMonitor(
  baseUrl: string,
  opts: { probes?: ProbeDefinition[]; fetchImpl?: typeof fetch } = {},
): Promise<ProbeResult[]> {
  const probes = opts.probes ?? PROBES;
  return Promise.all(
    probes.map(async (def) =>
      evaluateProbe(def, await sampleProbe(baseUrl, def, opts.fetchImpl)),
    ),
  );
}
