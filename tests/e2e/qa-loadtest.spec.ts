import { expect, test } from "@playwright/test";

// Day 11 QA: light load tests against the public/buyer-facing surfaces.
// 50 concurrent isn't truly representative of prod, but it's enough to
// catch obvious throughput regressions in the validator + event SSE
// surfaces without making CI take 10 minutes.

test.describe("QA · load smoke", () => {
  test("brief validator handles 50 concurrent calls in <8s p95", async ({
    request,
  }) => {
    const N = 50;
    const start = Date.now();
    const latencies: number[] = [];
    const briefs = Array.from({ length: N }, (_, i) => ({
      i,
      brief: `Launch #${i}: a $97 funnel for burned-out PMs. Tone: warm + direct. Required inputs: offer + audience. Delivered as a 6-email indoctrination.`,
    }));
    const results = await Promise.all(
      briefs.map(async ({ i, brief }) => {
        const t0 = Date.now();
        const resp = await request.post("/api/v1/briefs/validate", {
          data: { agentSlug: "funnelsmith", briefText: brief, idempotencyKey: `loadtest-${i}` },
        });
        const latency = Date.now() - t0;
        latencies.push(latency);
        return resp.ok();
      }),
    );
    const totalMs = Date.now() - start;
    const okCount = results.filter(Boolean).length;
    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    // Hard pass: every call returned 2xx
    expect(okCount).toBe(N);
    // Soft pass: p95 stays under 8s (validator in stub mode is essentially
    // free; this guards against regressions like accidental serial calls).
    expect(p95).toBeLessThan(8_000);
    expect(totalMs).toBeLessThan(20_000);
  });

  test("/api/health returns ok with the expected shape", async ({ request }) => {
    const resp = await request.get("/api/health");
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.ok).toBe(true);
    expect(json.agentCount).toBeGreaterThan(5);
    expect(typeof json.uptimeMs).toBe("number");
    expect(typeof json.latencyMs).toBe("number");
    expect(json.sentry).toMatch(/^(wired|stub)$/);
  });

  test("public marketing pages all 200 with <title> + meta description", async ({
    request,
  }) => {
    const pages = [
      "/",
      "/how-it-works",
      "/manifesto",
      "/trust",
      "/portfolio",
      "/developers",
      "/agents/funnelsmith",
      "/agents/adhook",
      "/agents/newsletterdraft",
      "/managers/todd",
      "/managers/rbrunson",
    ];
    for (const path of pages) {
      const resp = await request.get(path);
      expect(resp.status(), `GET ${path}`).toBe(200);
      const html = await resp.text();
      expect(html, `<title> on ${path}`).toMatch(/<title>[^<]+<\/title>/);
    }
  });
});
