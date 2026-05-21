import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  _resetChainStore,
  cancelChain,
  createChain,
  fireChainsForCompletedRun,
  listChainsBySource,
} from "@/lib/chains/service";
import {
  _resetMemoryStores as resetRunStores,
} from "@/lib/runs/service";
import {
  _resetMemoryStores as resetWalletStores,
  topUp,
} from "@/lib/wallet/service";

const ENV_SAVED: Record<string, string | undefined> = {};
const USER = "user_chain_1";

beforeEach(() => {
  ENV_SAVED.URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  ENV_SAVED.KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  ENV_SAVED.ANTHROPIC = process.env.ANTHROPIC_API_KEY;
  ENV_SAVED.MOCK_DELAY = process.env.MOCK_RUNTIME_DELAY_MS;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  process.env.MOCK_RUNTIME_DELAY_MS = "5";
  _resetChainStore();
  resetRunStores();
  resetWalletStores();
});

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = ENV_SAVED.URL ?? "";
  process.env.SUPABASE_SERVICE_ROLE_KEY = ENV_SAVED.KEY ?? "";
  process.env.ANTHROPIC_API_KEY = ENV_SAVED.ANTHROPIC ?? "";
  process.env.MOCK_RUNTIME_DELAY_MS = ENV_SAVED.MOCK_DELAY ?? "";
});

describe("chains service", () => {
  it("createChain refuses self-chains (source === target)", async () => {
    await expect(
      createChain({
        userId: USER,
        sourceAgentSlug: "funnelsmith",
        targetAgentSlug: "funnelsmith",
        targetServiceName: "x",
        targetServicePriceCents: 100,
        briefTemplate: "x",
      }),
    ).rejects.toThrow(/source and target/);
  });

  it("listChainsBySource returns active chains for a user", async () => {
    await createChain({
      userId: USER,
      sourceAgentSlug: "funnelsmith",
      targetAgentSlug: "adhook",
      targetServiceName: "5 ad creatives + 3 hooks",
      targetServicePriceCents: 4900,
      briefTemplate:
        "Take this funnel's angles and ship 5 ad creatives + 3 hooks. Audience: burned-out PMs.",
    });
    const list = await listChainsBySource("funnelsmith", USER);
    expect(list).toHaveLength(1);
    expect(list[0].targetAgentSlug).toBe("adhook");
  });

  it("fireChainsForCompletedRun creates a delivered downstream run", async () => {
    await topUp({
      userId: USER,
      amountCents: 20000,
      idempotencyKey: "topup-chain-1",
    });
    await createChain({
      userId: USER,
      sourceAgentSlug: "funnelsmith",
      targetAgentSlug: "adhook",
      targetServiceName: "5 ad creatives + 3 hooks",
      targetServicePriceCents: 4900,
      briefTemplate:
        "Build 5 ad creatives + 3 hooks aimed at burned-out PMs from a $97 funnel. Audience: founders.",
    });
    const results = await fireChainsForCompletedRun({
      sourceAgentSlug: "funnelsmith",
      userId: USER,
      sourceRunId: "run_source_test",
    });
    expect(results).toHaveLength(1);
    expect(results[0].run.status).toBe("delivered");
    expect(results[0].run.agentSlug).toBe("adhook");
  });

  it("budget cap pauses the chain when the next run would exceed it", async () => {
    await topUp({
      userId: USER,
      amountCents: 20000,
      idempotencyKey: "topup-chain-2",
    });
    const chain = await createChain({
      userId: USER,
      sourceAgentSlug: "funnelsmith",
      targetAgentSlug: "adhook",
      targetServiceName: "5 ad creatives + 3 hooks",
      targetServicePriceCents: 4900,
      briefTemplate:
        "Ship 5 ad creatives + 3 hooks for burned-out founders from a $97 funnel.",
      // cap below one run cost → first fire is already over-cap → pause.
      budgetCapCents: 100,
    });
    const results = await fireChainsForCompletedRun({
      sourceAgentSlug: "funnelsmith",
      userId: USER,
      sourceRunId: "run_source_budget",
    });
    expect(results).toHaveLength(0);
    const after = await listChainsBySource("funnelsmith", USER);
    expect(after).toHaveLength(0); // listChainsBySource filters active only
    const cancelled = await cancelChain(chain.id);
    expect(cancelled?.status).toBe("cancelled");
  });

  it("only fires chains owned by the run's buyer", async () => {
    await topUp({
      userId: USER,
      amountCents: 20000,
      idempotencyKey: "topup-chain-3",
    });
    await createChain({
      userId: "other-user",
      sourceAgentSlug: "funnelsmith",
      targetAgentSlug: "adhook",
      targetServiceName: "5 ad creatives + 3 hooks",
      targetServicePriceCents: 4900,
      briefTemplate: "x",
    });
    const results = await fireChainsForCompletedRun({
      sourceAgentSlug: "funnelsmith",
      userId: USER,
      sourceRunId: "run_isolated",
    });
    expect(results).toHaveLength(0);
  });
});
