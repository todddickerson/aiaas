/**
 * Weekly Lighthouse drift gate — page catalog + pure comparison logic.
 *
 * BUILD-PLAN §"Drift detection in production": "Weekly automated Lighthouse
 * run, fails the build if any metric drops >10% week-over-week." Day 11 also
 * set the floor: "Lighthouse ≥90 on all public pages."
 *
 * This module is framework-free so it can be unit-tested in Vitest and driven
 * from `scripts/lighthouse-weekly.mjs` in CI. The script owns the
 * process/child_process side (invoking `lighthouse`), this file owns the
 * decisions.
 *
 * Verdict rules (per page × category):
 *   • FAIL  — score dropped more than `dropThresholdPct` (default 10%,
 *             relative to last week's score) versus the baseline.
 *   • WARN  — score below `floor` (default 90) but no week-over-week
 *             regression. The floor is a warning, not a failure, because a
 *             cold Fluid Compute start can knock Performance below 90 without
 *             anything having changed in the app.
 *   • PASS  — otherwise. A page with no baseline (first run, or newly added
 *             page) can only PASS or WARN — there is nothing to regress from.
 */

export const CATEGORIES = [
  "performance",
  "accessibility",
  "best-practices",
  "seo",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type PageDefinition = {
  /** Human label used in summaries and as the baseline key. */
  name: string;
  /** Path relative to the base URL. */
  path: string;
};

/** Score per category, 0–100 (Lighthouse's 0–1 × 100, rounded). */
export type Scores = Record<Category, number>;

/** Baseline file shape — persisted between weekly runs as a CI artifact. */
export type Baseline = {
  version: 1;
  baseUrl: string;
  capturedAt: string;
  pages: Record<string, Scores>;
};

export type CategoryVerdict = {
  category: Category;
  score: number;
  baseline: number | null;
  /** Relative change vs baseline in percent (negative = regression). */
  deltaPct: number | null;
  outcome: "pass" | "warn" | "fail";
  reason?: string;
};

export type PageVerdict = {
  name: string;
  path: string;
  outcome: "pass" | "warn" | "fail";
  categories: CategoryVerdict[];
  /** Set when Lighthouse itself failed to audit the page. */
  error?: string;
};

export type CompareOptions = {
  /** Max tolerated relative drop, in percent. Default 10. */
  dropThresholdPct?: number;
  /** Minimum acceptable score before a WARN. Default 90. */
  floor?: number;
};

/**
 * Public pages the plan calls out for Lighthouse: marketing + agent + manager
 * SEO surfaces. `/status` is included because it is the page external
 * monitors and Todd look at. Keep this list short — each entry is a full
 * Lighthouse run (~30–60s in CI).
 */
export const PAGES: PageDefinition[] = [
  { name: "home", path: "/" },
  { name: "how-it-works", path: "/how-it-works" },
  { name: "manifesto", path: "/manifesto" },
  { name: "developers", path: "/developers" },
  { name: "agent · funnelsmith", path: "/agents/funnelsmith" },
  { name: "manager · todd", path: "/managers/todd" },
  { name: "portfolio", path: "/portfolio" },
  { name: "trust", path: "/trust" },
  { name: "status", path: "/status" },
];

/** Minimal slice of a Lighthouse LHR we depend on. */
export type LighthouseReportLike = {
  categories?: Partial<Record<string, { score: number | null } | undefined>>;
  runtimeError?: { code?: string; message?: string } | null;
};

/**
 * Pull the four category scores out of a Lighthouse JSON report. Throws if
 * the report carries a runtime error or a category is missing — the caller
 * turns that into a page-level `error` verdict.
 */
export function extractScores(report: LighthouseReportLike): Scores {
  if (report.runtimeError?.code && report.runtimeError.code !== "NO_ERROR") {
    throw new Error(
      `lighthouse runtime error ${report.runtimeError.code}: ${
        report.runtimeError.message ?? "(no message)"
      }`,
    );
  }
  const out = {} as Scores;
  for (const category of CATEGORIES) {
    const raw = report.categories?.[category]?.score;
    if (typeof raw !== "number" || Number.isNaN(raw)) {
      throw new Error(`lighthouse report is missing category "${category}"`);
    }
    out[category] = Math.round(raw * 100);
  }
  return out;
}

export function compareCategory(
  category: Category,
  score: number,
  baseline: number | null | undefined,
  options: CompareOptions = {},
): CategoryVerdict {
  const dropThresholdPct = options.dropThresholdPct ?? 10;
  const floor = options.floor ?? 90;

  const hasBaseline = typeof baseline === "number" && baseline > 0;
  const deltaPct = hasBaseline
    ? Math.round(((score - baseline) / baseline) * 1000) / 10
    : null;

  if (deltaPct !== null && deltaPct < -dropThresholdPct) {
    return {
      category,
      score,
      baseline: baseline as number,
      deltaPct,
      outcome: "fail",
      reason: `dropped ${Math.abs(deltaPct)}% week-over-week (${baseline} → ${score})`,
    };
  }
  if (score < floor) {
    return {
      category,
      score,
      baseline: hasBaseline ? (baseline as number) : null,
      deltaPct,
      outcome: "warn",
      reason: `below ${floor} floor`,
    };
  }
  return {
    category,
    score,
    baseline: hasBaseline ? (baseline as number) : null,
    deltaPct,
    outcome: "pass",
  };
}

export function comparePage(
  page: PageDefinition,
  scores: Scores,
  baseline: Scores | undefined,
  options: CompareOptions = {},
): PageVerdict {
  const categories = CATEGORIES.map((category) =>
    compareCategory(category, scores[category], baseline?.[category], options),
  );
  return {
    name: page.name,
    path: page.path,
    outcome: worstOutcome(categories.map((c) => c.outcome)),
    categories,
  };
}

export function errorPage(page: PageDefinition, error: string): PageVerdict {
  return {
    name: page.name,
    path: page.path,
    outcome: "fail",
    categories: [],
    error,
  };
}

export function worstOutcome(
  outcomes: Array<"pass" | "warn" | "fail">,
): "pass" | "warn" | "fail" {
  if (outcomes.includes("fail")) return "fail";
  if (outcomes.includes("warn")) return "warn";
  return "pass";
}

export function summarize(verdicts: PageVerdict[]) {
  const failed = verdicts.filter((v) => v.outcome === "fail");
  const warned = verdicts.filter((v) => v.outcome === "warn");
  return { ok: failed.length === 0, failed, warned };
}

/**
 * Build next week's baseline from this week's scores. Pages that errored keep
 * last week's numbers (if any) so a transient audit failure doesn't reset the
 * regression reference.
 */
export function buildBaseline(
  baseUrl: string,
  verdicts: PageVerdict[],
  previous: Baseline | null,
  now: Date = new Date(),
): Baseline {
  const pages: Record<string, Scores> = {};
  for (const v of verdicts) {
    if (v.error || v.categories.length === 0) {
      const prior = previous?.pages[v.name];
      if (prior) pages[v.name] = prior;
      continue;
    }
    pages[v.name] = Object.fromEntries(
      v.categories.map((c) => [c.category, c.score]),
    ) as Scores;
  }
  return { version: 1, baseUrl, capturedAt: now.toISOString(), pages };
}

/** Validate an untrusted JSON blob as a Baseline; returns null if unusable. */
export function parseBaseline(raw: unknown): Baseline | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (obj.version !== 1 || typeof obj.pages !== "object" || !obj.pages) {
    return null;
  }
  const pages: Record<string, Scores> = {};
  for (const [name, scores] of Object.entries(
    obj.pages as Record<string, unknown>,
  )) {
    if (!scores || typeof scores !== "object") continue;
    const s = scores as Record<string, unknown>;
    if (CATEGORIES.every((c) => typeof s[c] === "number")) {
      pages[name] = Object.fromEntries(
        CATEGORIES.map((c) => [c, s[c] as number]),
      ) as Scores;
    }
  }
  return {
    version: 1,
    baseUrl: typeof obj.baseUrl === "string" ? obj.baseUrl : "",
    capturedAt: typeof obj.capturedAt === "string" ? obj.capturedAt : "",
    pages,
  };
}

const GLYPH = { pass: "✅", warn: "⚠️", fail: "❌" } as const;

function fmtDelta(deltaPct: number | null): string {
  if (deltaPct === null) return "—";
  if (deltaPct === 0) return "±0%";
  return `${deltaPct > 0 ? "+" : ""}${deltaPct}%`;
}

/**
 * Markdown summary table — one row per page, four score columns each rendered
 * as `score (Δ)`. Used for $GITHUB_STEP_SUMMARY and the alert issue body.
 */
export function renderMarkdown(
  baseUrl: string,
  verdicts: PageVerdict[],
  baseline: Baseline | null,
  options: CompareOptions = {},
): string {
  const dropThresholdPct = options.dropThresholdPct ?? 10;
  const floor = options.floor ?? 90;
  const { ok, failed, warned } = summarize(verdicts);

  const lines: string[] = [];
  lines.push(`## Lighthouse weekly — ${baseUrl}`);
  lines.push("");
  lines.push(
    baseline?.capturedAt
      ? `Baseline: ${baseline.capturedAt} · fail on >${dropThresholdPct}% drop · warn under ${floor}`
      : `No prior baseline — this run seeds next week's reference · warn under ${floor}`,
  );
  lines.push("");
  lines.push("| | Page | Perf | A11y | Best practices | SEO |");
  lines.push("|---|---|---|---|---|---|");
  for (const v of verdicts) {
    if (v.error || v.categories.length === 0) {
      lines.push(
        `| ${GLYPH.fail} | \`${v.path}\` | audit failed: ${v.error ?? "no scores"} | | | |`,
      );
      continue;
    }
    const cells = CATEGORIES.map((category) => {
      const c = v.categories.find((x) => x.category === category)!;
      const mark = c.outcome === "pass" ? "" : ` ${GLYPH[c.outcome]}`;
      return `${c.score} (${fmtDelta(c.deltaPct)})${mark}`;
    });
    lines.push(`| ${GLYPH[v.outcome]} | \`${v.path}\` | ${cells.join(" | ")} |`);
  }
  lines.push("");
  if (ok) {
    lines.push(
      `**${verdicts.length} pages within budget**${warned.length ? ` (${warned.length} under the ${floor} floor)` : ""}`,
    );
  } else {
    lines.push(`**${failed.length} of ${verdicts.length} pages regressed**`);
    for (const v of failed) {
      const reasons = v.error
        ? [v.error]
        : v.categories
            .filter((c) => c.outcome === "fail")
            .map((c) => `${c.category}: ${c.reason}`);
      lines.push(`- \`${v.path}\` — ${reasons.join("; ")}`);
    }
  }
  return lines.join("\n");
}
