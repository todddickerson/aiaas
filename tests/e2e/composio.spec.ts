import { expect, test } from "@playwright/test";

test.describe("composio proxy", () => {
  test("slack send_message stub returns the channel + message (in scope)", async ({
    request,
  }) => {
    const resp = await request.post("/api/v1/proxy/slack/send_message", {
      data: {
        agentSlug: "funnelsmith",
        // funnelsmith's slack destination is #aiaas-alpha (Day 6 grant).
        payload: { channel: "#aiaas-alpha", text: "delivered" },
        idempotencyKey: "e2e-slack-1",
      },
    });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.ok).toBe(true);
    expect(json.stubbed).toBe(true);
    expect(json.tool).toBe("slack");
    expect(json.method).toBe("send_message");
    expect(json.data.channel).toBe("#aiaas-alpha");
  });

  test("notion create_page stub returns a page-shaped payload (in scope)", async ({
    request,
  }) => {
    const resp = await request.post("/api/v1/proxy/notion/create_page", {
      data: {
        agentSlug: "funnelsmith",
        payload: {
          parent: "funnelsmith-deliveries",
          properties: { Title: "Brief 1" },
        },
        idempotencyKey: "e2e-notion-1",
      },
    });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.data.object).toBe("page");
    expect(typeof json.data.id).toBe("string");
  });

  test("scope grant: off-channel slack is denied (403)", async ({ request }) => {
    const resp = await request.post("/api/v1/proxy/slack/send_message", {
      data: {
        agentSlug: "funnelsmith",
        payload: { channel: "#other-team", text: "should be blocked" },
        idempotencyKey: "e2e-scope-deny-1",
      },
    });
    expect(resp.status()).toBe(403);
    const json = await resp.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBe("scope_violation");
  });

  test("scope grant: undeclared tool is denied (403)", async ({ request }) => {
    const resp = await request.post("/api/v1/proxy/weird/do_thing", {
      data: {
        agentSlug: "funnelsmith",
        payload: { x: 1 },
        idempotencyKey: "e2e-scope-deny-2",
      },
    });
    expect(resp.status()).toBe(403);
    const json = await resp.json();
    expect(json.error).toBe("scope_violation");
  });

  test("agent with no destinations declared falls through (echo stub)", async ({
    request,
  }) => {
    const resp = await request.post("/api/v1/proxy/weird/do_thing", {
      data: {
        // ea-daimon has no destinations → no scope → proxy passes through.
        agentSlug: "ea-daimon",
        payload: { x: 1 },
        idempotencyKey: "e2e-weird-1",
      },
    });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.data.echo).toEqual({ x: 1 });
  });

  test("missing agentSlug → 400", async ({ request }) => {
    const resp = await request.post("/api/v1/proxy/slack/send_message", {
      data: { payload: { channel: "#x" } },
    });
    expect(resp.status()).toBe(400);
  });

  test("malformed tool/method → 400", async ({ request }) => {
    const resp = await request.post("/api/v1/proxy/has%20space/method", {
      data: { agentSlug: "funnelsmith", payload: {} },
    });
    // URL decoding gives us "has space" which fails TOOL_PATTERN.
    expect(resp.status()).toBe(400);
  });
});
