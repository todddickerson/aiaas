import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { createTopUp, openHold, releaseHold } from "@/lib/whop/client";

export interface WalletBalance {
  userId: string;
  balanceCents: number;
  currency: string;
  // True when the balance is being computed from the in-memory fallback ledger
  // (Supabase not configured). Real balances always come from the DB.
  stubbed: boolean;
}

interface TopUpInput {
  userId: string;
  amountCents: number;
  currency?: string;
  idempotencyKey: string;
}

interface OpenHoldInput {
  userId: string;
  agentSlug: string;
  briefId?: string | null;
  amountCents: number;
  currency?: string;
  idempotencyKey: string;
}

interface ReleaseHoldInput {
  userId: string;
  holdId: string;
  idempotencyKey: string;
}

// In-memory fallback ledger — used in local dev / test runs when Supabase is
// not configured. Not durable across restarts; that's fine, the real ledger
// lives in Postgres.
interface MemHold {
  id: string;
  userId: string;
  agentSlug: string;
  briefId: string | null;
  amountCents: number;
  currency: string;
  status: "open" | "released" | "refunded" | "expired";
  whopHoldId: string;
  idempotencyKey: string;
  createdAt: number;
}

interface MemTxn {
  id: string;
  userId: string;
  kind:
    | "top_up"
    | "hold_open"
    | "hold_release"
    | "hold_refund"
    | "payout"
    | "adjustment";
  amountCents: number;
  currency: string;
  balanceAfterCents: number;
  holdId: string | null;
  whopEventId: string | null;
  idempotencyKey: string;
  createdAt: number;
}

const memHolds = new Map<string, MemHold>();
const memTxns: MemTxn[] = [];
const memIdempotency = new Map<string, string>(); // key → txn id

function newMemId(): string {
  return "mem_" + Math.random().toString(16).slice(2, 12);
}

function memBalance(userId: string): number {
  return memTxns
    .filter((t) => t.userId === userId)
    .reduce((acc, t) => acc + t.amountCents, 0);
}

export async function getBalance(
  userId: string,
  currency = "USD",
): Promise<WalletBalance> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return {
      userId,
      balanceCents: memBalance(userId),
      currency,
      stubbed: true,
    };
  }
  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("balance_after_cents, currency, created_at")
    .eq("user_id", userId)
    .eq("currency", currency)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(`Wallet balance lookup failed: ${error.message}`);
  const top = data?.[0];
  return {
    userId,
    balanceCents: top ? Number(top.balance_after_cents) : 0,
    currency,
    stubbed: false,
  };
}

export async function topUp(input: TopUpInput): Promise<{
  txnId: string;
  whopEventId: string;
  balanceCents: number;
  stubbed: boolean;
}> {
  const currency = input.currency ?? "USD";
  const whop = await createTopUp({
    userId: input.userId,
    amountCents: input.amountCents,
    currency,
    idempotencyKey: input.idempotencyKey,
  });

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    const existing = memIdempotency.get(input.idempotencyKey);
    if (existing) {
      const txn = memTxns.find((t) => t.id === existing)!;
      return {
        txnId: txn.id,
        whopEventId: txn.whopEventId ?? whop.whopEventId,
        balanceCents: txn.balanceAfterCents,
        stubbed: true,
      };
    }
    const balance = memBalance(input.userId) + input.amountCents;
    const txn: MemTxn = {
      id: newMemId(),
      userId: input.userId,
      kind: "top_up",
      amountCents: input.amountCents,
      currency,
      balanceAfterCents: balance,
      holdId: null,
      whopEventId: whop.whopEventId,
      idempotencyKey: input.idempotencyKey,
      createdAt: Date.now(),
    };
    memTxns.push(txn);
    memIdempotency.set(input.idempotencyKey, txn.id);
    return {
      txnId: txn.id,
      whopEventId: whop.whopEventId,
      balanceCents: balance,
      stubbed: true,
    };
  }

  // Idempotency: if a transaction with this key already exists, return it.
  const { data: existing } = await supabase
    .from("wallet_transactions")
    .select("id, balance_after_cents, whop_event_id")
    .eq("external_idempotency_key", input.idempotencyKey)
    .maybeSingle();
  if (existing) {
    return {
      txnId: existing.id,
      whopEventId: existing.whop_event_id ?? whop.whopEventId,
      balanceCents: existing.balance_after_cents,
      stubbed: false,
    };
  }

  const current = await getBalance(input.userId, currency);
  const balanceAfter = current.balanceCents + input.amountCents;
  const { data, error } = await supabase
    .from("wallet_transactions")
    .insert({
      user_id: input.userId,
      kind: "top_up",
      amount_cents: input.amountCents,
      currency,
      balance_after_cents: balanceAfter,
      whop_event_id: whop.whopEventId,
      external_idempotency_key: input.idempotencyKey,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Wallet top-up insert failed: ${error?.message}`);
  return {
    txnId: data.id,
    whopEventId: whop.whopEventId,
    balanceCents: balanceAfter,
    stubbed: false,
  };
}

export async function openWalletHold(input: OpenHoldInput): Promise<{
  holdId: string;
  whopHoldId: string;
  balanceCents: number;
  stubbed: boolean;
}> {
  const currency = input.currency ?? "USD";
  const current = await getBalance(input.userId, currency);
  if (current.balanceCents < input.amountCents) {
    throw new Error(
      `Insufficient balance: $${(current.balanceCents / 100).toFixed(2)} < $${(input.amountCents / 100).toFixed(2)}`,
    );
  }
  const whop = await openHold({
    userId: input.userId,
    agentSlug: input.agentSlug,
    amountCents: input.amountCents,
    currency,
    idempotencyKey: input.idempotencyKey,
  });

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    const existing = memIdempotency.get(input.idempotencyKey);
    if (existing) {
      const txn = memTxns.find((t) => t.id === existing)!;
      const hold = memHolds.get(txn.holdId!)!;
      return {
        holdId: hold.id,
        whopHoldId: hold.whopHoldId,
        balanceCents: txn.balanceAfterCents,
        stubbed: true,
      };
    }
    const hold: MemHold = {
      id: newMemId(),
      userId: input.userId,
      agentSlug: input.agentSlug,
      briefId: input.briefId ?? null,
      amountCents: input.amountCents,
      currency,
      status: "open",
      whopHoldId: whop.whopHoldId,
      idempotencyKey: input.idempotencyKey,
      createdAt: Date.now(),
    };
    memHolds.set(hold.id, hold);
    const balance = memBalance(input.userId) - input.amountCents;
    const txn: MemTxn = {
      id: newMemId(),
      userId: input.userId,
      kind: "hold_open",
      amountCents: -input.amountCents,
      currency,
      balanceAfterCents: balance,
      holdId: hold.id,
      whopEventId: null,
      idempotencyKey: input.idempotencyKey,
      createdAt: Date.now(),
    };
    memTxns.push(txn);
    memIdempotency.set(input.idempotencyKey, txn.id);
    return {
      holdId: hold.id,
      whopHoldId: hold.whopHoldId,
      balanceCents: balance,
      stubbed: true,
    };
  }

  const { data: existingTxn } = await supabase
    .from("wallet_transactions")
    .select("id, hold_id, balance_after_cents")
    .eq("external_idempotency_key", input.idempotencyKey)
    .maybeSingle();
  if (existingTxn) {
    return {
      holdId: existingTxn.hold_id,
      whopHoldId: whop.whopHoldId,
      balanceCents: existingTxn.balance_after_cents,
      stubbed: false,
    };
  }

  const { data: hold, error: holdErr } = await supabase
    .from("wallet_holds")
    .insert({
      user_id: input.userId,
      agent_slug: input.agentSlug,
      brief_id: input.briefId ?? null,
      amount_cents: input.amountCents,
      currency,
      status: "open",
      whop_hold_id: whop.whopHoldId,
      external_idempotency_key: input.idempotencyKey,
    })
    .select("id")
    .single();
  if (holdErr || !hold)
    throw new Error(`Wallet hold insert failed: ${holdErr?.message}`);

  const balanceAfter = current.balanceCents - input.amountCents;
  const { error: txnErr } = await supabase.from("wallet_transactions").insert({
    user_id: input.userId,
    kind: "hold_open",
    amount_cents: -input.amountCents,
    currency,
    balance_after_cents: balanceAfter,
    hold_id: hold.id,
    external_idempotency_key: input.idempotencyKey,
  });
  if (txnErr) throw new Error(`Wallet ledger insert failed: ${txnErr.message}`);

  return {
    holdId: hold.id,
    whopHoldId: whop.whopHoldId,
    balanceCents: balanceAfter,
    stubbed: false,
  };
}

export async function releaseWalletHold(input: ReleaseHoldInput): Promise<{
  holdId: string;
  stubbed: boolean;
}> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    const hold = memHolds.get(input.holdId);
    if (!hold) throw new Error(`Unknown hold: ${input.holdId}`);
    if (hold.status !== "open") return { holdId: hold.id, stubbed: true };
    await releaseHold({
      whopHoldId: hold.whopHoldId,
      idempotencyKey: input.idempotencyKey,
    });
    hold.status = "released";
    return { holdId: hold.id, stubbed: true };
  }

  const { data: hold, error: holdErr } = await supabase
    .from("wallet_holds")
    .select("id, whop_hold_id, status")
    .eq("id", input.holdId)
    .single();
  if (holdErr || !hold)
    throw new Error(`Unknown hold: ${input.holdId}`);
  if (hold.status !== "open") return { holdId: hold.id, stubbed: false };

  await releaseHold({
    whopHoldId: hold.whop_hold_id,
    idempotencyKey: input.idempotencyKey,
  });
  const { error: updateErr } = await supabase
    .from("wallet_holds")
    .update({ status: "released", released_at: new Date().toISOString() })
    .eq("id", hold.id);
  if (updateErr)
    throw new Error(`Wallet hold release update failed: ${updateErr.message}`);
  return { holdId: hold.id, stubbed: false };
}

// Test-only: clear the in-memory ledger between unit tests.
export const _resetMemoryStores = () => {
  memHolds.clear();
  memTxns.length = 0;
  memIdempotency.clear();
};
