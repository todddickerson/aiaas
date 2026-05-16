import { describe, expect, it } from "vitest";

import {
  agentsByCategory,
  AGENTS,
  CATEGORIES,
  getAgent,
  LEADERBOARD_WEEKLY,
  LIVE_TICKER,
  sortAgents,
} from "@/lib/seed";

describe("seed data integrity", () => {
  it("has unique agent ids and handles", () => {
    const ids = new Set<string>();
    const handles = new Set<string>();
    for (const a of AGENTS) {
      expect(ids.has(a.id), `duplicate agent id: ${a.id}`).toBe(false);
      expect(
        handles.has(a.handle),
        `duplicate agent handle: ${a.handle}`,
      ).toBe(false);
      ids.add(a.id);
      handles.add(a.handle);
    }
    expect(AGENTS.length).toBeGreaterThanOrEqual(10);
  });

  it("every agent's category exists in CATEGORIES", () => {
    const validIds = new Set(CATEGORIES.map((c) => c.id));
    for (const a of AGENTS) {
      expect(validIds.has(a.category), `unknown category: ${a.category} on ${a.id}`).toBe(true);
    }
  });

  it("CATEGORIES has unique ids and starts with 'all'", () => {
    expect(CATEGORIES[0].id).toBe("all");
    const ids = new Set(CATEGORIES.map((c) => c.id));
    expect(ids.size).toBe(CATEGORIES.length);
  });

  it("every agent has a non-empty handle starting with '@'", () => {
    for (const a of AGENTS) {
      expect(a.handle.startsWith("@")).toBe(true);
      expect(a.handle.length).toBeGreaterThan(1);
    }
  });

  it("priceFrom ≤ priceMax for every agent", () => {
    for (const a of AGENTS) {
      expect(a.priceFrom).toBeLessThanOrEqual(a.priceMax);
    }
  });

  it("Funnelsmith exists (Day 2 featured agent)", () => {
    const f = getAgent("funnelsmith");
    expect(f).toBeDefined();
    expect(f?.handle).toBe("@funnelsmith");
  });

  it("LIVE_TICKER references valid agent ids", () => {
    const ids = new Set(AGENTS.map((a) => a.id));
    for (const t of LIVE_TICKER) {
      expect(ids.has(t.agent), `ticker references unknown agent: ${t.agent}`).toBe(true);
    }
  });

  it("LEADERBOARD_WEEKLY references valid agent ids and is sorted by rank", () => {
    const ids = new Set(AGENTS.map((a) => a.id));
    for (const row of LEADERBOARD_WEEKLY) {
      expect(ids.has(row.id)).toBe(true);
    }
    const ranks = LEADERBOARD_WEEKLY.map((r) => r.rank);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });
});

describe("seed helpers", () => {
  it("getAgent accepts id, '@handle', or bare handle", () => {
    expect(getAgent("aperture")?.id).toBe("aperture");
    expect(getAgent("@aperture")?.id).toBe("aperture");
    expect(getAgent("nope-not-real")).toBeUndefined();
  });

  it("agentsByCategory('all') returns the full list", () => {
    expect(agentsByCategory("all").length).toBe(AGENTS.length);
  });

  it("agentsByCategory('funnels') returns only funnel agents", () => {
    const funnels = agentsByCategory("funnels");
    expect(funnels.length).toBeGreaterThan(0);
    for (const a of funnels) expect(a.category).toBe("funnels");
  });

  it("sortAgents('runs') is descending by runs", () => {
    const sorted = sortAgents(AGENTS, "runs");
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].runs).toBeGreaterThanOrEqual(sorted[i].runs);
    }
  });

  it("sortAgents('price') is ascending by priceFrom", () => {
    const sorted = sortAgents(AGENTS, "price");
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].priceFrom).toBeLessThanOrEqual(sorted[i].priceFrom);
    }
  });

  it("sortAgents('trending') is a stable no-op (returns seed order)", () => {
    const sorted = sortAgents(AGENTS, "trending");
    expect(sorted.map((a) => a.id)).toEqual(AGENTS.map((a) => a.id));
  });
});
