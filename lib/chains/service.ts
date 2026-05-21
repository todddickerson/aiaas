import "server-only";

import { createAndOrchestrateRun, type RunRecord } from "@/lib/runs/service";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export type ChainStatus = "active" | "paused" | "cancelled";

export interface ChainRecord {
  id: string;
  userId: string;
  sourceAgentSlug: string;
  targetAgentSlug: string;
  targetServiceName: string;
  targetServicePriceCents: number;
  briefTemplate: string;
  budgetCapCents?: number;
  status: ChainStatus;
  fireCount: number;
  spentCents: number;
  lastFiredAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface CreateChainInput {
  userId: string;
  sourceAgentSlug: string;
  targetAgentSlug: string;
  targetServiceName: string;
  targetServicePriceCents: number;
  briefTemplate: string;
  budgetCapCents?: number;
}

interface DbRow {
  id: string;
  user_id: string;
  source_agent_slug: string;
  target_agent_slug: string;
  target_service_name: string;
  target_service_price_cents: number;
  brief_template: string;
  budget_cap_cents: number | null;
  status: ChainStatus;
  fire_count: number;
  spent_cents: number;
  last_fired_at: string | null;
  created_at: string;
  updated_at: string;
}

type Store = { chains: Map<string, ChainRecord> };
const STORE_KEY = "__aiaas_chains__";
interface Holder {
  [STORE_KEY]?: Store;
}
const holder = globalThis as unknown as Holder;
const store: Store =
  holder[STORE_KEY] ?? (holder[STORE_KEY] = { chains: new Map() });

function rowToRecord(row: DbRow): ChainRecord {
  return {
    id: row.id,
    userId: row.user_id,
    sourceAgentSlug: row.source_agent_slug,
    targetAgentSlug: row.target_agent_slug,
    targetServiceName: row.target_service_name,
    targetServicePriceCents: row.target_service_price_cents,
    briefTemplate: row.brief_template,
    budgetCapCents: row.budget_cap_cents ?? undefined,
    status: row.status,
    fireCount: row.fire_count,
    spentCents: row.spent_cents,
    lastFiredAt: row.last_fired_at ? new Date(row.last_fired_at).getTime() : undefined,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

function newId(): string {
  return "chn_" + Math.random().toString(16).slice(2, 14);
}

export async function createChain(
  input: CreateChainInput,
): Promise<ChainRecord> {
  if (input.sourceAgentSlug === input.targetAgentSlug) {
    throw new Error("Chain source and target cannot be the same agent.");
  }
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("chains")
      .insert({
        user_id: input.userId,
        source_agent_slug: input.sourceAgentSlug,
        target_agent_slug: input.targetAgentSlug,
        target_service_name: input.targetServiceName,
        target_service_price_cents: input.targetServicePriceCents,
        brief_template: input.briefTemplate,
        budget_cap_cents: input.budgetCapCents ?? null,
        status: "active",
      })
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(`chain insert failed: ${error?.message}`);
    }
    return rowToRecord(data as DbRow);
  }
  const id = newId();
  const now = Date.now();
  const rec: ChainRecord = {
    id,
    userId: input.userId,
    sourceAgentSlug: input.sourceAgentSlug,
    targetAgentSlug: input.targetAgentSlug,
    targetServiceName: input.targetServiceName,
    targetServicePriceCents: input.targetServicePriceCents,
    briefTemplate: input.briefTemplate,
    budgetCapCents: input.budgetCapCents,
    status: "active",
    fireCount: 0,
    spentCents: 0,
    createdAt: now,
    updatedAt: now,
  };
  store.chains.set(id, rec);
  return rec;
}

export async function getChain(id: string): Promise<ChainRecord | undefined> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const { data } = await supabase
      .from("chains")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data ? rowToRecord(data as DbRow) : undefined;
  }
  return store.chains.get(id);
}

export async function listChainsBySource(
  sourceAgentSlug: string,
  userId?: string,
): Promise<ChainRecord[]> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    let q = supabase
      .from("chains")
      .select("*")
      .eq("source_agent_slug", sourceAgentSlug)
      .eq("status", "active");
    if (userId) q = q.eq("user_id", userId);
    const { data } = await q;
    return (data ?? []).map((row) => rowToRecord(row as DbRow));
  }
  return Array.from(store.chains.values()).filter(
    (c) =>
      c.sourceAgentSlug === sourceAgentSlug &&
      c.status === "active" &&
      (!userId || c.userId === userId),
  );
}

export async function listChainsForUser(userId: string): Promise<ChainRecord[]> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const { data } = await supabase
      .from("chains")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (data ?? []).map((row) => rowToRecord(row as DbRow));
  }
  return Array.from(store.chains.values())
    .filter((c) => c.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function cancelChain(
  id: string,
): Promise<ChainRecord | undefined> {
  return patchChain(id, { status: "cancelled" });
}

async function patchChain(
  id: string,
  patch: Partial<ChainRecord>,
): Promise<ChainRecord | undefined> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const dbPatch: Record<string, unknown> = {};
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.fireCount !== undefined) dbPatch.fire_count = patch.fireCount;
    if (patch.spentCents !== undefined) dbPatch.spent_cents = patch.spentCents;
    if (patch.lastFiredAt !== undefined)
      dbPatch.last_fired_at = new Date(patch.lastFiredAt).toISOString();
    const { data } = await supabase
      .from("chains")
      .update(dbPatch)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    return data ? rowToRecord(data as DbRow) : undefined;
  }
  const existing = store.chains.get(id);
  if (!existing) return undefined;
  const next: ChainRecord = { ...existing, ...patch, updatedAt: Date.now() };
  store.chains.set(id, next);
  return next;
}

/**
 * Fire all active chains that listen to a source agent. Each one creates a
 * downstream run on the target agent. Honors per-chain budget caps and the
 * v1 hard cap of 1 downstream (i.e., chains do not auto-recurse — a chain
 * created on the target agent will not fire from its own runs).
 *
 * Returns the list of runs created (one per fired chain).
 */
export async function fireChainsForCompletedRun(input: {
  sourceAgentSlug: string;
  userId: string;
  sourceRunId: string;
}): Promise<Array<{ chainId: string; run: RunRecord }>> {
  const chains = await listChainsBySource(input.sourceAgentSlug, input.userId);
  const results: Array<{ chainId: string; run: RunRecord }> = [];
  for (const chain of chains) {
    if (chain.status !== "active") continue;
    if (
      chain.budgetCapCents !== undefined &&
      chain.spentCents + chain.targetServicePriceCents > chain.budgetCapCents
    ) {
      // Budget cap exceeded — skip and pause the chain so the buyer notices.
      await patchChain(chain.id, { status: "paused" });
      continue;
    }
    const fireCount = chain.fireCount + 1;
    const idempotencyKey = `chain:${chain.id}:from:${input.sourceRunId}`;
    const run = await createAndOrchestrateRun({
      agentSlug: chain.targetAgentSlug,
      briefText: chain.briefTemplate,
      serviceName: chain.targetServiceName,
      servicePriceCents: chain.targetServicePriceCents,
      userId: chain.userId,
      idempotencyKey,
    });
    await patchChain(chain.id, {
      fireCount,
      spentCents: chain.spentCents + chain.targetServicePriceCents,
      lastFiredAt: Date.now(),
    });
    results.push({ chainId: chain.id, run });
  }
  return results;
}

export const _resetChainStore = () => {
  store.chains.clear();
};
