import { describe, expect, it } from "vitest";

import {
  type Baseline,
  CATEGORIES,
  PAGES,
  type Scores,
  buildBaseline,
  compareCategory,
  comparePage,
  errorPage,
  extractScores,
  parseBaseline,
  renderMarkdown,
  summarize,
} from "@/lib/monitor/lighthouse";

const scores = (
  performance: number,
  accessibility = 100,
  bestPractices = 100,
  seo = 100,
): Scores => ({
  performance,
  accessibility,
  "best-practices": bestPractices,
  seo,
});

const lhr = (p: number, a: number, b: number, s: number) => ({
  categories: {
    performance: { score: p },
    accessibility: { score: a },
    "best-practices": { score: b },
    seo: { score: s },
  },
});

describe("lighthouse page catalog", () => {
  it("covers the plan's public marketing + agent + manager surfaces", () => {
    const paths = PAGES.map((p) => p.path);
    for (const required of [
      "/",
      "/how-it-works",
      "/agents/funnelsmith",
      "/managers/todd",
      "/portfolio",
      "/trust",
    ]) {
      expect(paths).toContain(required);
    }
  });

  it("never audits gated / private surfaces", () => {
    const paths = PAGES.map((p) => p.path);
    for (const priv of ["/dashboard", "/publish", "/gate"]) {
      expect(paths).not.toContain(priv);
    }
  });

  it("uses unique names (they are the baseline keys)", () => {
    const names = PAGES.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("extractScores", () => {
  it("rounds Lighthouse 0–1 scores to 0–100 integers", () => {
    expect(extractScores(lhr(0.987, 1, 0.926, 0.9))).toEqual(
      scores(99, 100, 93, 90),
    );
  });

  it("throws on a runtime error", () => {
    expect(() =>
      extractScores({
        ...lhr(0.9, 1, 1, 1),
        runtimeError: { code: "PROTOCOL_TIMEOUT", message: "boom" },
      }),
    ).toThrow(/PROTOCOL_TIMEOUT/);
  });

  it("tolerates the NO_ERROR sentinel Lighthouse emits", () => {
    expect(() =>
      extractScores({ ...lhr(1, 1, 1, 1), runtimeError: { code: "NO_ERROR" } }),
    ).not.toThrow();
  });

  it("throws when a category is missing or null", () => {
    expect(() =>
      extractScores({ categories: { performance: { score: null } } }),
    ).toThrow(/missing category/);
  });
});

describe("compareCategory", () => {
  it("fails on a drop of more than 10% week-over-week", () => {
    const v = compareCategory("performance", 80, 95);
    expect(v.outcome).toBe("fail");
    expect(v.deltaPct).toBe(-15.8);
    expect(v.reason).toMatch(/95 → 80/);
  });

  it("passes a drop of exactly 10% (threshold is strict)", () => {
    expect(compareCategory("seo", 90, 100).outcome).toBe("pass");
  });

  it("warns (not fails) under the 90 floor when there is no regression", () => {
    const v = compareCategory("performance", 85, 86);
    expect(v.outcome).toBe("warn");
    expect(v.reason).toMatch(/below 90 floor/);
  });

  it("can only pass or warn without a baseline", () => {
    expect(compareCategory("performance", 60, null).outcome).toBe("warn");
    expect(compareCategory("performance", 95, undefined).outcome).toBe("pass");
    expect(compareCategory("performance", 95, undefined).deltaPct).toBeNull();
  });

  it("honours custom threshold + floor", () => {
    expect(
      compareCategory("performance", 95, 100, { dropThresholdPct: 4 }).outcome,
    ).toBe("fail");
    expect(compareCategory("performance", 75, 75, { floor: 70 }).outcome).toBe(
      "pass",
    );
  });
});

describe("comparePage / summarize", () => {
  const page = PAGES[0];

  it("page verdict is the worst category verdict", () => {
    const v = comparePage(page, scores(70, 100, 100, 100), scores(95));
    expect(v.outcome).toBe("fail");
    expect(v.categories).toHaveLength(CATEGORIES.length);
    expect(summarize([v]).ok).toBe(false);
  });

  it("an audit error is a failing page", () => {
    const v = errorPage(page, "lighthouse exited 1");
    expect(v.outcome).toBe("fail");
    expect(summarize([v]).failed).toHaveLength(1);
  });

  it("all-green pages summarise ok with warnings counted separately", () => {
    const ok = comparePage(page, scores(98), scores(97));
    const warn = comparePage(PAGES[1], scores(85), undefined);
    const s = summarize([ok, warn]);
    expect(s.ok).toBe(true);
    expect(s.warned).toHaveLength(1);
  });
});

describe("baseline round-trip", () => {
  it("builds next week's baseline and keeps prior scores for errored pages", () => {
    const previous: Baseline = {
      version: 1,
      baseUrl: "https://x",
      capturedAt: "2026-08-24T00:00:00.000Z",
      pages: { [PAGES[1].name]: scores(91) },
    };
    const verdicts = [
      comparePage(PAGES[0], scores(96), undefined),
      errorPage(PAGES[1], "timeout"),
      errorPage(PAGES[2], "timeout"),
    ];
    const next = buildBaseline("https://x", verdicts, previous, new Date(0));
    expect(next.capturedAt).toBe("1970-01-01T00:00:00.000Z");
    expect(next.pages[PAGES[0].name]).toEqual(scores(96));
    expect(next.pages[PAGES[1].name]).toEqual(scores(91)); // carried over
    expect(next.pages[PAGES[2].name]).toBeUndefined(); // never had one
    expect(parseBaseline(JSON.parse(JSON.stringify(next)))).toEqual(next);
  });

  it("rejects garbage and drops malformed page entries", () => {
    expect(parseBaseline(null)).toBeNull();
    expect(parseBaseline({ version: 2, pages: {} })).toBeNull();
    const parsed = parseBaseline({
      version: 1,
      pages: { good: scores(90), bad: { performance: "90" } },
    });
    expect(Object.keys(parsed!.pages)).toEqual(["good"]);
  });
});

describe("renderMarkdown", () => {
  it("lists every page and calls out regressions with reasons", () => {
    const baseline: Baseline = {
      version: 1,
      baseUrl: "https://x",
      capturedAt: "2026-08-24T00:00:00.000Z",
      pages: { [PAGES[0].name]: scores(95) },
    };
    const md = renderMarkdown(
      "https://x",
      [
        comparePage(PAGES[0], scores(80), baseline.pages[PAGES[0].name]),
        comparePage(PAGES[1], scores(99), undefined),
        errorPage(PAGES[2], "exited 1"),
      ],
      baseline,
    );
    expect(md).toContain("Baseline: 2026-08-24");
    expect(md).toContain("| ❌ | `/` | 80 (-15.8%) ❌");
    expect(md).toContain("| ✅ | `/how-it-works` | 99 (—)");
    expect(md).toContain("audit failed: exited 1");
    expect(md).toContain("**2 of 3 pages regressed**");
    expect(md).toContain("performance: dropped 15.8%");
  });

  it("announces seeding when there is no baseline", () => {
    const md = renderMarkdown(
      "https://x",
      [comparePage(PAGES[0], scores(99), undefined)],
      null,
    );
    expect(md).toContain("No prior baseline");
    expect(md).toContain("**1 pages within budget**");
  });
});
