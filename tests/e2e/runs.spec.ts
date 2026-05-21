import { expect, test } from "@playwright/test";

test.describe("runs orchestration", () => {
  test("happy-path: top-up → create run → delivered → accept", async ({
    request,
  }) => {
    const userId = `e2e-run-${Date.now()}`;

    // 1) top-up enough balance to cover the hire
    const topUp = await request.post("/api/v1/wallet/top-up", {
      data: {
        userId,
        amountCents: 20000,
        idempotencyKey: `topup-${userId}`,
      },
    });
    expect(topUp.status()).toBe(200);

    // 2) create the run — orchestrator runs inline and returns delivered
    const create = await request.post("/api/v1/runs/create", {
      data: {
        userId,
        agentSlug: "funnelsmith",
        briefText:
          "Launching a $97 course on calm productivity. Target: burned-out PMs. Tone: warm + direct.",
        serviceName: "Hook-Story-Offer teardown",
        servicePriceCents: 7900,
        idempotencyKey: `run-${userId}`,
      },
    });
    expect(create.status()).toBe(200);
    const run = await create.json();
    expect(run.status).toBe("delivered");
    expect(run.artifacts.length).toBeGreaterThan(0);
    expect(run.holdId).toBeTruthy();

    // 3) fetch the run by id
    const got = await request.get(`/api/v1/runs/${run.id}`);
    expect(got.status()).toBe(200);
    expect((await got.json()).status).toBe("delivered");

    // 4) accept the delivery → status moves to accepted
    const accept = await request.post(`/api/v1/runs/${run.id}/accept`, {
      data: { idempotencyKey: `accept-${run.id}` },
    });
    expect(accept.status()).toBe(200);
    expect((await accept.json()).status).toBe("accepted");
  });

  test("missing required fields → 400", async ({ request }) => {
    const resp = await request.post("/api/v1/runs/create", {
      data: { userId: "x" },
    });
    expect(resp.status()).toBe(400);
  });

  test("create is idempotent on repeated keys", async ({ request }) => {
    const userId = `e2e-idem-${Date.now()}`;
    await request.post("/api/v1/wallet/top-up", {
      data: { userId, amountCents: 20000, idempotencyKey: `topup-${userId}` },
    });
    const key = `run-idem-${userId}`;
    const a = await request.post("/api/v1/runs/create", {
      data: {
        userId,
        agentSlug: "funnelsmith",
        briefText:
          "Launching a complete-looking funnel for burned-out PMs. Tone: warm.",
        serviceName: "Hook-Story-Offer teardown",
        servicePriceCents: 7900,
        idempotencyKey: key,
      },
    });
    const b = await request.post("/api/v1/runs/create", {
      data: {
        userId,
        agentSlug: "funnelsmith",
        briefText:
          "Launching a complete-looking funnel for burned-out PMs. Tone: warm.",
        serviceName: "Hook-Story-Offer teardown",
        servicePriceCents: 7900,
        idempotencyKey: key,
      },
    });
    expect(a.status()).toBe(200);
    expect(b.status()).toBe(200);
    expect((await a.json()).id).toBe((await b.json()).id);
  });

  test("GET unknown run id → 404", async ({ request }) => {
    const resp = await request.get("/api/v1/runs/run_does_not_exist");
    expect(resp.status()).toBe(404);
  });

  test("delivered run dispatches to declared destinations (Composio stub)", async ({
    request,
  }) => {
    const userId = `e2e-deliver-${Date.now()}`;
    await request.post("/api/v1/wallet/top-up", {
      data: {
        userId,
        amountCents: 20000,
        idempotencyKey: `topup-${userId}`,
      },
    });
    const create = await request.post("/api/v1/runs/create", {
      data: {
        userId,
        agentSlug: "funnelsmith",
        briefText:
          "Launching a $97 course on calm productivity. Target: burned-out PMs. Tone: warm + direct.",
        serviceName: "Hook-Story-Offer teardown",
        servicePriceCents: 7900,
        idempotencyKey: `run-${userId}`,
      },
    });
    expect(create.status()).toBe(200);
    const run = await create.json();
    expect(run.status).toBe("delivered");

    // Pull the JSON backlog for the run; look for the destination events
    // emitted between agent_returned and delivered.
    const events = await request.get(
      `/api/v1/runs/${run.id}/events?backlog=only`,
    );
    expect(events.status()).toBe(200);
    const json = await events.json();
    const kinds = json.events.map((e: { kind: string }) => e.kind);
    expect(kinds).toContain("destination_dispatched");
    expect(kinds).toContain("destination_delivered");
    const slackEvt = json.events.find(
      (e: { kind: string; payload: Record<string, unknown> }) =>
        e.kind === "destination_dispatched" &&
        (e.payload?.tool as string) === "slack",
    );
    expect(slackEvt).toBeTruthy();
    const slackTarget = slackEvt.payload.target as Record<string, string>;
    expect(slackTarget.channel).toBe("#aiaas-alpha");
  });
});
