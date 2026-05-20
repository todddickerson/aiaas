import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  _resetMemoryStores,
  getBalance,
  openWalletHold,
  releaseWalletHold,
  topUp,
} from "@/lib/wallet/service";
import { _internal } from "@/lib/whop/client";

const USER = "user_test_1";

const ENV_SAVED: Record<string, string | undefined> = {};

beforeEach(() => {
  ENV_SAVED.WHOP_API_KEY = process.env.WHOP_API_KEY;
  ENV_SAVED.WHOP_STUB = process.env.WHOP_STUB;
  ENV_SAVED.URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  ENV_SAVED.KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Force stub mode + no Supabase → in-memory ledger.
  delete process.env.WHOP_API_KEY;
  delete process.env.WHOP_STUB;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  _resetMemoryStores();
});

afterEach(() => {
  process.env.WHOP_API_KEY = ENV_SAVED.WHOP_API_KEY ?? "";
  process.env.WHOP_STUB = ENV_SAVED.WHOP_STUB ?? "";
  process.env.NEXT_PUBLIC_SUPABASE_URL = ENV_SAVED.URL ?? "";
  process.env.SUPABASE_SERVICE_ROLE_KEY = ENV_SAVED.KEY ?? "";
});

describe("wallet service (in-memory fallback)", () => {
  it("starts with a zero balance for a new user", async () => {
    const b = await getBalance(USER);
    expect(b.balanceCents).toBe(0);
    expect(b.stubbed).toBe(true);
  });

  it("credits the balance on top-up", async () => {
    const r = await topUp({
      userId: USER,
      amountCents: 5000,
      idempotencyKey: "k1",
    });
    expect(r.balanceCents).toBe(5000);
    const b = await getBalance(USER);
    expect(b.balanceCents).toBe(5000);
  });

  it("is idempotent on repeated top-ups with the same key", async () => {
    const a = await topUp({ userId: USER, amountCents: 5000, idempotencyKey: "k1" });
    const b = await topUp({ userId: USER, amountCents: 5000, idempotencyKey: "k1" });
    expect(a.txnId).toBe(b.txnId);
    expect(b.balanceCents).toBe(5000);
  });

  it("debits the balance on a wallet hold", async () => {
    await topUp({ userId: USER, amountCents: 10000, idempotencyKey: "k1" });
    const hold = await openWalletHold({
      userId: USER,
      agentSlug: "funnelsmith",
      amountCents: 7900,
      idempotencyKey: "hold1",
    });
    expect(hold.balanceCents).toBe(10000 - 7900);
    expect(hold.whopHoldId).toMatch(/^stub_hold_/);
  });

  it("rejects a hold larger than the available balance", async () => {
    await topUp({ userId: USER, amountCents: 1000, idempotencyKey: "k1" });
    await expect(
      openWalletHold({
        userId: USER,
        agentSlug: "funnelsmith",
        amountCents: 5000,
        idempotencyKey: "hold-too-big",
      }),
    ).rejects.toThrow(/Insufficient balance/);
  });

  it("releases a hold (no balance change to the buyer)", async () => {
    await topUp({ userId: USER, amountCents: 10000, idempotencyKey: "k1" });
    const hold = await openWalletHold({
      userId: USER,
      agentSlug: "funnelsmith",
      amountCents: 7900,
      idempotencyKey: "hold1",
    });
    await releaseWalletHold({
      userId: USER,
      holdId: hold.holdId,
      idempotencyKey: "release-1",
    });
    // Releasing pays the builder; buyer's balance stays where it was after the hold.
    const b = await getBalance(USER);
    expect(b.balanceCents).toBe(10000 - 7900);
  });
});

describe("Whop client stub mode", () => {
  it("isStubMode is true when no key is set", () => {
    delete process.env.WHOP_API_KEY;
    delete process.env.WHOP_STUB;
    expect(_internal.isStubMode()).toBe(true);
  });

  it("isStubMode is true when WHOP_STUB=true even with a key", () => {
    process.env.WHOP_API_KEY = "wpk_test_not_real";
    process.env.WHOP_STUB = "true";
    expect(_internal.isStubMode()).toBe(true);
  });

  it("stub IDs are deterministic per idempotency key", () => {
    const a = _internal.stubId("topup", "abc");
    const b = _internal.stubId("topup", "abc");
    const c = _internal.stubId("topup", "different");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});
