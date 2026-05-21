import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { deliverArtifacts } from "@/lib/agents/destinations";
import { loadAgent } from "@/lib/seed/loader";

const ENV_SAVED: Record<string, string | undefined> = {};

beforeEach(() => {
  ENV_SAVED.COMPOSIO_KEY = process.env.COMPOSIO_API_KEY;
  ENV_SAVED.COMPOSIO_STUB = process.env.COMPOSIO_STUB;
  delete process.env.COMPOSIO_API_KEY;
  delete process.env.COMPOSIO_STUB;
});

afterEach(() => {
  process.env.COMPOSIO_API_KEY = ENV_SAVED.COMPOSIO_KEY ?? "";
  process.env.COMPOSIO_STUB = ENV_SAVED.COMPOSIO_STUB ?? "";
});

describe("deliverArtifacts (Composio dispatch over an agent's destinations)", () => {
  it("posts one Composio call per declared destination for funnelsmith", async () => {
    const agent = (await loadAgent("funnelsmith"))!;
    const attempts = await deliverArtifacts({
      agent,
      runId: "run-test-1",
      userId: "user-test-1",
      serviceName: "Hook-Story-Offer teardown",
      artifacts: [
        { label: "Hook bank", kind: "doc", preview: "20 hooks…" },
        { label: "VSL outline", kind: "doc" },
      ],
    });
    expect(attempts).toHaveLength(2);
    const tools = attempts.map((a) => a.destination.tool).sort();
    expect(tools).toEqual(["notion", "slack"]);
    expect(attempts.every((a) => a.ok)).toBe(true);
    expect(attempts.every((a) => a.stubbed)).toBe(true);
  });

  it("emits zero attempts when the agent has no destinations", async () => {
    const agent = (await loadAgent("ea-daimon"))!;
    const attempts = await deliverArtifacts({
      agent,
      runId: "run-test-2",
      userId: "user-test-2",
      serviceName: "Shortlist 5",
      artifacts: [],
    });
    expect(attempts).toEqual([]);
  });

  it("idempotency key embeds the run id and destination index", async () => {
    const agent = (await loadAgent("newsletterdraft"))!;
    const first = await deliverArtifacts({
      agent,
      runId: "run-test-3",
      userId: "user-test-3",
      serviceName: "One-off newsletter draft",
      artifacts: [{ label: "Draft", kind: "doc" }],
    });
    const second = await deliverArtifacts({
      agent,
      runId: "run-test-3",
      userId: "user-test-3",
      serviceName: "One-off newsletter draft",
      artifacts: [{ label: "Draft", kind: "doc" }],
    });
    // Gmail stub keys its id off the idempotency key. Same runId + index →
    // same id, so deliveries can be safely re-driven.
    const a = first.find((d) => d.destination.tool === "gmail");
    const b = second.find((d) => d.destination.tool === "gmail");
    expect(a?.responseId).toBeTruthy();
    expect(a?.responseId).toBe(b?.responseId);
  });

  it("payload uses the destination target keys (slack→channel, gmail→to, notion→parent)", async () => {
    const agent = (await loadAgent("funnelsmith"))!;
    const attempts = await deliverArtifacts({
      agent,
      runId: "run-test-4",
      userId: "user-test-4",
      serviceName: "Hook-Story-Offer teardown",
      artifacts: [{ label: "Hook bank", kind: "doc" }],
    });
    const slack = attempts.find((a) => a.destination.tool === "slack")!;
    const notion = attempts.find((a) => a.destination.tool === "notion")!;
    expect(slack.destination.target.channel).toBe("#aiaas-alpha");
    expect(notion.destination.target.parent).toBe("funnelsmith-deliveries");
  });
});
