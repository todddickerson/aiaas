import { expect, test } from "@playwright/test";

test.describe("live trace SSE", () => {
  test("events endpoint round-trip: POST → backlog GET returns the event", async ({
    request,
  }) => {
    // Create a run first so the events route knows it exists.
    const userId = `e2e-trace-${Date.now()}`;
    await request.post("/api/v1/wallet/top-up", {
      data: { userId, amountCents: 20000, idempotencyKey: `topup-${userId}` },
    });
    const create = await request.post("/api/v1/runs/create", {
      data: {
        userId,
        agentSlug: "funnelsmith",
        briefText:
          "Launching a complete-looking funnel for burned-out PMs. Tone: warm + direct.",
        serviceName: "Hook-Story-Offer teardown",
        servicePriceCents: 7900,
        idempotencyKey: `run-${userId}`,
      },
    });
    expect(create.status()).toBe(200);
    const run = await create.json();

    // POST a custom event from "an external runtime".
    const post = await request.post(`/api/v1/runs/${run.id}/events`, {
      data: {
        kind: "agent_thought",
        payload: { label: "playwright-injected", detail: "synthetic event" },
      },
    });
    expect(post.status()).toBe(200);

    // Backlog GET should include both the orchestrator-stamped events AND ours.
    const backlog = await request.get(
      `/api/v1/runs/${run.id}/events?backlog=only`,
    );
    expect(backlog.status()).toBe(200);
    const json = await backlog.json();
    const kinds: string[] = json.events.map((e: { kind: string }) => e.kind);
    expect(kinds).toContain("queued");
    expect(kinds).toContain("delivered");
    expect(kinds).toContain("agent_thought");
  });

  test("SSE stream emits backlog and closes on terminal state", async ({
    request,
  }) => {
    const userId = `e2e-sse-${Date.now()}`;
    await request.post("/api/v1/wallet/top-up", {
      data: { userId, amountCents: 20000, idempotencyKey: `topup-${userId}` },
    });
    const create = await request.post("/api/v1/runs/create", {
      data: {
        userId,
        agentSlug: "funnelsmith",
        briefText:
          "Launching a complete-looking funnel for burned-out PMs. Tone: warm + direct.",
        serviceName: "Hook-Story-Offer teardown",
        servicePriceCents: 7900,
        idempotencyKey: `run-${userId}`,
      },
    });
    const run = await create.json();
    // Accept to put the run in a terminal state so SSE replays + closes.
    await request.post(`/api/v1/runs/${run.id}/accept`, {
      data: { idempotencyKey: `accept-${run.id}` },
    });

    const resp = await request.get(`/api/v1/runs/${run.id}/events`);
    expect(resp.status()).toBe(200);
    expect(resp.headers()["content-type"]).toContain("text/event-stream");
    const body = await resp.text();
    expect(body).toContain("event: backlog");
    expect(body).toContain("event: run_event");
    expect(body).toContain("event: done");
  });

  test("POST events 404 for unknown run", async ({ request }) => {
    const resp = await request.post("/api/v1/runs/run_does_not_exist/events", {
      data: { kind: "agent_log" },
    });
    expect(resp.status()).toBe(404);
  });

  test("POST events 400 when kind is missing", async ({ request }) => {
    const userId = `e2e-400-${Date.now()}`;
    await request.post("/api/v1/wallet/top-up", {
      data: { userId, amountCents: 20000, idempotencyKey: `topup-${userId}` },
    });
    const create = await request.post("/api/v1/runs/create", {
      data: {
        userId,
        agentSlug: "funnelsmith",
        briefText:
          "Launching a complete-looking funnel for burned-out PMs. Tone: warm + direct.",
        serviceName: "Hook-Story-Offer teardown",
        servicePriceCents: 7900,
        idempotencyKey: `run-${userId}`,
      },
    });
    const run = await create.json();
    const resp = await request.post(`/api/v1/runs/${run.id}/events`, {
      data: { payload: { detail: "no kind" } },
    });
    expect(resp.status()).toBe(400);
  });

  test("LiveTrace renders in the hire-flow modal after a passing brief", async ({
    page,
  }) => {
    await page.goto("/agents/funnelsmith");
    await page.getByTestId("agent-hire-cta").click();
    await page.getByTestId("brief-textarea").fill(
      "Launching a $97 course on calm productivity. Target: burned-out PMs. Tone: warm + direct.",
    );
    await page.getByTestId("brief-submit").click();
    // The hire-flow modal should mount LiveTrace once the validator passes.
    await expect(page.getByTestId("live-trace")).toBeVisible({ timeout: 15_000 });
    // Backlog should be visible quickly (queued/validating/etc. arrived before
    // the SSE connected, so they're delivered as the initial replay).
    await expect(page.getByTestId("trace-event-count")).not.toContainText("0 events", {
      timeout: 10_000,
    });
  });
});
