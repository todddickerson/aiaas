import { describe, expect, it } from "vitest";

import {
  GATE_MARKER,
  PROBES,
  evaluateProbe,
  probeUrl,
  renderMarkdown,
  runSyntheticMonitor,
  sampleProbe,
  summarize,
  type ProbeDefinition,
} from "@/lib/monitor/synthetic";

const health: ProbeDefinition = {
  name: "health",
  path: "/api/health",
  expectStatus: [200],
  expectAnyOf: ['"ok":true'],
  latencyBudgetMs: 1500,
};

function fakeFetch(
  handler: (url: string) => { status: number; body: string } | Error,
): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input.toString();
    const out = handler(url);
    if (out instanceof Error) throw out;
    return new Response(out.body, { status: out.status });
  }) as unknown as typeof fetch;
}

describe("synthetic monitor — probe catalog", () => {
  it("covers the plan's 5 critical endpoints + homepage", () => {
    expect(PROBES).toHaveLength(6);
    const paths = PROBES.map((p) => p.path);
    expect(paths).toContain("/");
    expect(paths).toContain("/api/health");
    expect(paths).toContain("/sitemap.xml");
  });

  it("every gated page accepts the gate interstitial so enabling the alpha token doesn't page", () => {
    const ungated = new Set(["/api/health", "/sitemap.xml"]);
    for (const probe of PROBES) {
      if (ungated.has(probe.path)) continue;
      expect(probe.expectAnyOf, probe.path).toContain(GATE_MARKER);
    }
  });
});

describe("evaluateProbe", () => {
  it("passes on expected status + marker within budget", () => {
    const r = evaluateProbe(health, {
      status: 200,
      body: '{"ok":true,"agentCount":13}',
      latencyMs: 120,
    });
    expect(r.outcome).toBe("pass");
    expect(r.reason).toBeUndefined();
  });

  it("fails on unexpected status", () => {
    const r = evaluateProbe(health, { status: 503, body: '{"ok":false}', latencyMs: 90 });
    expect(r.outcome).toBe("fail");
    expect(r.reason).toMatch(/status 503/);
  });

  it("fails when the body is missing every marker", () => {
    const r = evaluateProbe(health, { status: 200, body: "<html>nope</html>", latencyMs: 90 });
    expect(r.outcome).toBe("fail");
    expect(r.reason).toMatch(/body missing/);
  });

  it("fails on transport error even with a zero status", () => {
    const r = evaluateProbe(health, {
      status: 0,
      body: "",
      latencyMs: 15000,
      error: "The operation was aborted",
    });
    expect(r.outcome).toBe("fail");
    expect(r.reason).toMatch(/request error/);
  });

  it("warns (not fails) when over the latency budget", () => {
    const r = evaluateProbe(health, { status: 200, body: '"ok":true', latencyMs: 4000 });
    expect(r.outcome).toBe("warn");
    expect(r.reason).toMatch(/latency 4000ms/);
  });

  it("accepts any one of several markers (real page OR gate rewrite)", () => {
    const home = PROBES.find((p) => p.path === "/")!;
    const real = evaluateProbe(home, {
      status: 200,
      body: '<h1 data-testid="hero-headline">Hire</h1>',
      latencyMs: 100,
    });
    const gated = evaluateProbe(home, {
      status: 200,
      body: `<span>${GATE_MARKER}</span>`,
      latencyMs: 100,
    });
    expect(real.outcome).toBe("pass");
    expect(gated.outcome).toBe("pass");
  });
});

describe("summarize + renderMarkdown", () => {
  it("is ok when only warnings are present", () => {
    const results = [
      evaluateProbe(health, { status: 200, body: '"ok":true', latencyMs: 100 }),
      evaluateProbe(health, { status: 200, body: '"ok":true', latencyMs: 9000 }),
    ];
    const s = summarize(results);
    expect(s.ok).toBe(true);
    expect(s.warned).toHaveLength(1);
    expect(s.failed).toHaveLength(0);
  });

  it("renders a markdown table with the run verdict", () => {
    const results = [
      evaluateProbe(health, { status: 200, body: '"ok":true', latencyMs: 100 }),
      evaluateProbe(health, { status: 500, body: "", latencyMs: 100 }),
    ];
    const md = renderMarkdown("https://example.test/", results);
    expect(md).toContain("REGRESSION");
    expect(md).toContain("| ✅ | health | `/api/health` | 200 | 100ms |");
    expect(md).toContain("| ❌ | health | `/api/health` | 500 | 100ms | status 500");
  });
});

describe("probeUrl + sampleProbe + runSyntheticMonitor", () => {
  it("joins base and path without doubling slashes", () => {
    expect(probeUrl("https://a.test/", "/x")).toBe("https://a.test/x");
    expect(probeUrl("https://a.test", "/x")).toBe("https://a.test/x");
  });

  it("captures transport errors instead of throwing", async () => {
    const s = await sampleProbe(
      "https://a.test",
      health,
      fakeFetch(() => new Error("ECONNREFUSED")),
    );
    expect(s.status).toBe(0);
    expect(s.error).toBe("ECONNREFUSED");
  });

  it("runs every probe against the injected fetch and evaluates each", async () => {
    const seen: string[] = [];
    const results = await runSyntheticMonitor("https://a.test", {
      fetchImpl: fakeFetch((url) => {
        seen.push(url);
        if (url.endsWith("/api/health")) return { status: 200, body: '{"ok":true}' };
        if (url.endsWith("/sitemap.xml")) return { status: 200, body: "<urlset></urlset>" };
        return { status: 200, body: `<div>${GATE_MARKER}</div>` };
      }),
    });
    expect(seen).toHaveLength(PROBES.length);
    expect(summarize(results).ok).toBe(true);
  });
});
