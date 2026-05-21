import { describe, expect, it } from "vitest";

import { checkScope } from "@/lib/agents/grants";

describe("checkScope (per-agent destination grants)", () => {
  it("allows slack to the declared channel for funnelsmith", async () => {
    const r = await checkScope({
      agentSlug: "funnelsmith",
      tool: "slack",
      method: "send_message",
      payload: { channel: "#aiaas-alpha", text: "delivered" },
    });
    expect(r.ok).toBe(true);
    expect(r.matched?.tool).toBe("slack");
  });

  it("denies slack to a different channel", async () => {
    const r = await checkScope({
      agentSlug: "funnelsmith",
      tool: "slack",
      method: "send_message",
      payload: { channel: "#wrong", text: "x" },
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/allow-list|target/i);
  });

  it("denies a tool the agent never declared", async () => {
    const r = await checkScope({
      agentSlug: "funnelsmith",
      tool: "gmail",
      method: "send",
      payload: { to: "anyone@example.com", subject: "x", body: "x" },
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/not in this agent's declared destinations/);
  });

  it("denies notion to the wrong parent page", async () => {
    const r = await checkScope({
      agentSlug: "funnelsmith",
      tool: "notion",
      method: "create_page",
      payload: { parent: "leaked-workspace", properties: {} },
    });
    expect(r.ok).toBe(false);
  });

  it("permits all calls when an agent has no destinations declared", async () => {
    const r = await checkScope({
      agentSlug: "ea-daimon",
      tool: "weird",
      method: "do_thing",
      payload: { x: 1 },
    });
    expect(r.ok).toBe(true);
  });

  it("returns ok=false for unknown agents", async () => {
    const r = await checkScope({
      agentSlug: "ghost-agent",
      tool: "slack",
      method: "send_message",
      payload: { channel: "#x" },
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/Unknown agent/);
  });
});
