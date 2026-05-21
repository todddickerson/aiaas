import { expect, test } from "@playwright/test";

test.describe("schedules + chains", () => {
  test("schedule a weekly run, fire it, delivers", async ({ request }) => {
    const userId = `e2e-sched-${Date.now()}`;
    // Top-up enough for the firing
    await request.post("/api/v1/wallet/top-up", {
      data: { userId, amountCents: 20000, idempotencyKey: `topup-${userId}` },
    });

    // Create schedule
    const create = await request.post("/api/v1/schedules", {
      data: {
        userId,
        agentSlug: "newsletterdraft",
        cadence: "weekly",
        serviceName: "One-off newsletter draft",
        servicePriceCents: 2900,
        briefTemplate:
          "Weekly newsletter draft for our calm-productivity audience. Required inputs: topic + past hits. Tone: warm and direct. Delivered as email.",
      },
    });
    expect(create.status()).toBe(200);
    const sched = await create.json();
    expect(sched.status).toBe("active");
    expect(sched.cadence).toBe("weekly");

    // List schedules for this user
    const list = await request.get(`/api/v1/schedules?userId=${userId}`);
    expect(list.status()).toBe(200);
    const listJson = await list.json();
    expect(listJson.schedules.length).toBe(1);

    // Fire the schedule (this is what Vercel Cron will call weekly)
    const fire = await request.post(`/api/v1/schedules/${sched.id}/fire`);
    expect(fire.status()).toBe(200);
    const fireJson = await fire.json();
    expect(fireJson.run.status).toBe("delivered");
    expect(fireJson.run.artifacts.length).toBeGreaterThan(0);

    // Schedule fire count increments
    const get = await request.get(`/api/v1/schedules/${sched.id}`);
    const got = await get.json();
    expect(got.fireCount).toBe(1);
    expect(got.lastFiredAt).toBeTruthy();
  });

  test("chain fires a downstream run when source run is accepted", async ({
    request,
  }) => {
    const userId = `e2e-chain-${Date.now()}`;
    await request.post("/api/v1/wallet/top-up", {
      data: { userId, amountCents: 30000, idempotencyKey: `topup-${userId}` },
    });

    // Create chain: when funnelsmith accepts, fire adhook
    const chain = await request.post("/api/v1/chains", {
      data: {
        userId,
        sourceAgentSlug: "funnelsmith",
        targetAgentSlug: "adhook",
        targetServiceName: "5 ad creatives + 3 hooks",
        targetServicePriceCents: 4900,
        briefTemplate:
          "Take this funnel's angles and ship 5 ad creatives + 3 hooks for burned-out PMs.",
      },
    });
    expect(chain.status()).toBe(200);
    const chainRec = await chain.json();
    expect(chainRec.status).toBe("active");

    // Hire funnelsmith → delivered → accept → chain fires adhook
    const sourceRun = await request.post("/api/v1/runs/create", {
      data: {
        userId,
        agentSlug: "funnelsmith",
        briefText:
          "Launching a $97 course on calm productivity. Target: burned-out PMs. Tone: warm + direct.",
        serviceName: "Hook-Story-Offer teardown",
        servicePriceCents: 7900,
        idempotencyKey: `source-run-${userId}`,
      },
    });
    expect(sourceRun.status()).toBe(200);
    const source = await sourceRun.json();
    expect(source.status).toBe("delivered");

    const accept = await request.post(`/api/v1/runs/${source.id}/accept`, {
      data: { idempotencyKey: `accept-${source.id}` },
    });
    expect(accept.status()).toBe(200);
    const acceptJson = await accept.json();
    expect(acceptJson.status).toBe("accepted");
    expect(acceptJson.chains).toHaveLength(1);
    expect(acceptJson.chains[0].chainId).toBe(chainRec.id);

    // The downstream chain run also delivered.
    const dsRunId = acceptJson.chains[0].run.id;
    const ds = await request.get(`/api/v1/runs/${dsRunId}`);
    const dsJson = await ds.json();
    expect(dsJson.status).toBe("delivered");
    expect(dsJson.agentSlug).toBe("adhook");
  });

  test("DELETE /schedules/:id cancels a schedule", async ({ request }) => {
    const userId = `e2e-sched-cancel-${Date.now()}`;
    const create = await request.post("/api/v1/schedules", {
      data: {
        userId,
        agentSlug: "newsletterdraft",
        cadence: "weekly",
        serviceName: "Weekly",
        servicePriceCents: 2900,
        briefTemplate: "x",
      },
    });
    const sched = await create.json();
    const del = await request.delete(`/api/v1/schedules/${sched.id}`);
    expect(del.status()).toBe(200);
    expect((await del.json()).status).toBe("cancelled");
  });

  test("POST /schedules missing fields → 400", async ({ request }) => {
    const resp = await request.post("/api/v1/schedules", {
      data: { userId: "x" },
    });
    expect(resp.status()).toBe(400);
  });

  test("POST /chains refuses self-chain", async ({ request }) => {
    const resp = await request.post("/api/v1/chains", {
      data: {
        userId: "u1",
        sourceAgentSlug: "funnelsmith",
        targetAgentSlug: "funnelsmith",
        targetServiceName: "x",
        targetServicePriceCents: 100,
        briefTemplate: "x",
      },
    });
    expect(resp.status()).toBe(400);
  });
});
