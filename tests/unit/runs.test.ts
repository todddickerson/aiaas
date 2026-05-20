import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  _resetMemoryStores as resetRunStores,
  createAndOrchestrateRun,
  acceptRun,
  getRun,
} from "@/lib/runs/service";
import {
  _resetMemoryStores as resetWalletStores,
  getBalance,
  topUp,
} from "@/lib/wallet/service";

const ENV_SAVED: Record<string, string | undefined> = {};
const USER = "user_runs_1";

beforeEach(() => {
  ENV_SAVED.URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  ENV_SAVED.KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  ENV_SAVED.ANTHROPIC = process.env.ANTHROPIC_API_KEY;
  ENV_SAVED.WHOP = process.env.WHOP_API_KEY;
  ENV_SAVED.MOCK_DELAY = process.env.MOCK_RUNTIME_DELAY_MS;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.WHOP_API_KEY;
  // Speed up the mock runtime for unit tests.
  process.env.MOCK_RUNTIME_DELAY_MS = "5";
  resetRunStores();
  resetWalletStores();
});

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = ENV_SAVED.URL ?? "";
  process.env.SUPABASE_SERVICE_ROLE_KEY = ENV_SAVED.KEY ?? "";
  process.env.ANTHROPIC_API_KEY = ENV_SAVED.ANTHROPIC ?? "";
  process.env.WHOP_API_KEY = ENV_SAVED.WHOP ?? "";
  process.env.MOCK_RUNTIME_DELAY_MS = ENV_SAVED.MOCK_DELAY ?? "";
});

describe("run orchestrator (in-memory)", () => {
  it("happy-path: validates → holds → runs → delivers", async () => {
    await topUp({
      userId: USER,
      amountCents: 20000,
      idempotencyKey: "topup-1",
    });
    const run = await createAndOrchestrateRun({
      agentSlug: "funnelsmith",
      briefText:
        "Launching a $97 course on calm productivity. Target: burned-out PMs. Tone: warm + direct.",
      serviceName: "Hook-Story-Offer teardown",
      servicePriceCents: 7900,
      userId: USER,
      idempotencyKey: "run-1",
    });
    expect(run.status).toBe("delivered");
    expect(run.artifacts.length).toBeGreaterThan(0);
    expect(run.holdId).toBeTruthy();
    const balance = await getBalance(USER);
    expect(balance.balanceCents).toBe(20000 - 7900);
  });

  it("blocks delivery when the validator rejects the brief", async () => {
    await topUp({
      userId: USER,
      amountCents: 20000,
      idempotencyKey: "topup-1",
    });
    const run = await createAndOrchestrateRun({
      agentSlug: "funnelsmith",
      briefText: "hi",
      serviceName: "Hook-Story-Offer teardown",
      servicePriceCents: 7900,
      userId: USER,
      idempotencyKey: "run-1",
    });
    expect(run.status).toBe("failed");
    expect(run.error).toMatch(/short|rejected|clarif/i);
    // No hold was opened.
    expect(run.holdId).toBeNull();
    // Balance untouched.
    const balance = await getBalance(USER);
    expect(balance.balanceCents).toBe(20000);
  });

  it("fails fast when the buyer doesn't have enough balance", async () => {
    await topUp({ userId: USER, amountCents: 100, idempotencyKey: "topup-1" });
    const run = await createAndOrchestrateRun({
      agentSlug: "funnelsmith",
      briefText:
        "Launching a $97 course on calm productivity. Target: burned-out PMs.",
      serviceName: "Hook-Story-Offer teardown",
      servicePriceCents: 7900,
      userId: USER,
      idempotencyKey: "run-1",
    });
    expect(run.status).toBe("failed");
    expect(run.error).toMatch(/Insufficient balance/);
    expect(run.holdId).toBeNull();
  });

  it("idempotent: identical idempotency keys return the same run", async () => {
    await topUp({
      userId: USER,
      amountCents: 20000,
      idempotencyKey: "topup-1",
    });
    const a = await createAndOrchestrateRun({
      agentSlug: "funnelsmith",
      briefText: "Launching a complete-looking funnel for burned-out PMs.",
      serviceName: "Hook-Story-Offer teardown",
      servicePriceCents: 7900,
      userId: USER,
      idempotencyKey: "run-1",
    });
    const b = await createAndOrchestrateRun({
      agentSlug: "funnelsmith",
      briefText: "Launching a complete-looking funnel for burned-out PMs.",
      serviceName: "Hook-Story-Offer teardown",
      servicePriceCents: 7900,
      userId: USER,
      idempotencyKey: "run-1",
    });
    expect(a.id).toBe(b.id);
  });

  it("accept transitions delivered → accepted and releases the hold", async () => {
    await topUp({
      userId: USER,
      amountCents: 20000,
      idempotencyKey: "topup-1",
    });
    const run = await createAndOrchestrateRun({
      agentSlug: "funnelsmith",
      briefText: "Launching a complete-looking funnel for burned-out PMs.",
      serviceName: "Hook-Story-Offer teardown",
      servicePriceCents: 7900,
      userId: USER,
      idempotencyKey: "run-1",
    });
    expect(run.status).toBe("delivered");
    const accepted = await acceptRun(run.id, "accept-1");
    expect(accepted.status).toBe("accepted");
    expect(accepted.acceptedAt).toBeTypeOf("number");
    // Accept doesn't credit the buyer back — funds flow to the builder.
    const balance = await getBalance(USER);
    expect(balance.balanceCents).toBe(20000 - 7900);
  });

  it("accept is a no-op for non-delivered runs", async () => {
    await topUp({
      userId: USER,
      amountCents: 20000,
      idempotencyKey: "topup-1",
    });
    const run = await createAndOrchestrateRun({
      agentSlug: "funnelsmith",
      briefText: "hi",
      serviceName: "Hook-Story-Offer teardown",
      servicePriceCents: 7900,
      userId: USER,
      idempotencyKey: "run-1",
    });
    expect(run.status).toBe("failed");
    const after = await acceptRun(run.id, "accept-1");
    expect(after.status).toBe("failed"); // unchanged
  });

  it("getRun returns the persisted shape", async () => {
    await topUp({
      userId: USER,
      amountCents: 20000,
      idempotencyKey: "topup-1",
    });
    const created = await createAndOrchestrateRun({
      agentSlug: "funnelsmith",
      briefText: "Launching a complete-looking funnel for burned-out PMs.",
      serviceName: "Hook-Story-Offer teardown",
      servicePriceCents: 7900,
      userId: USER,
      idempotencyKey: "run-1",
    });
    const fetched = await getRun(created.id);
    expect(fetched?.id).toBe(created.id);
    expect(fetched?.status).toBe("delivered");
  });
});
