import "server-only";

import { compileBrief } from "@/lib/validator/compile-brief";
import { deliverArtifacts } from "@/lib/agents/destinations";
import { getRuntime, type RuntimeDeliverable } from "@/lib/agents/runtime";
import { appendRunEvent } from "@/lib/runs/events";
import { loadAgent } from "@/lib/seed/loader";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import {
  getBalance,
  openWalletHold,
  releaseWalletHold,
} from "@/lib/wallet/service";

export type RunStatus =
  | "queued"
  | "validating"
  | "holding"
  | "running"
  | "delivered"
  | "accepted"
  | "rejected_by_buyer"
  | "failed"
  | "cancelled"
  | "expired";

export interface RunRecord {
  id: string;
  agentSlug: string;
  briefId: string | null;
  userId: string;
  holdId: string | null;
  serviceName: string;
  servicePriceCents: number;
  status: RunStatus;
  runtime: string;
  artifacts: RuntimeDeliverable[];
  error?: string;
  startedAt?: number;
  deliveredAt?: number;
  acceptedAt?: number;
  createdAt: number;
}

export interface CreateRunInput {
  agentSlug: string;
  briefText: string;
  serviceName: string;
  servicePriceCents: number;
  userId: string;
  idempotencyKey: string;
}

// In-memory fallback so the orchestrator works in tests + local dev without
// Supabase. Real durable state lives in Postgres.
//
// Stored on globalThis because Next.js sometimes bundles server-component
// modules and route-handler modules into separate JS instances — without a
// shared global, an API POST that writes to one Map can't be read by a
// server-component page that holds its own copy of the Map.
type RunStores = {
  memRuns: Map<string, RunRecord>;
  memIdempotency: Map<string, string>;
};
const RUN_STORE_KEY = "__aiaas_run_stores__";
interface RunStoresHolder {
  [RUN_STORE_KEY]?: RunStores;
}
const runHolder = globalThis as unknown as RunStoresHolder;
const runStores: RunStores =
  runHolder[RUN_STORE_KEY] ??
  (runHolder[RUN_STORE_KEY] = {
    memRuns: new Map(),
    memIdempotency: new Map(),
  });
const memRuns = runStores.memRuns;
const memIdempotency = runStores.memIdempotency;

function newId(): string {
  return "run_" + Math.random().toString(16).slice(2, 14);
}

interface RunEvent {
  kind: string;
  payload?: Record<string, unknown>;
}

async function appendEvent(runId: string, event: RunEvent): Promise<void> {
  // Always go through appendRunEvent so the pub/sub bus + in-memory store
  // see the same writes the SSE stream needs.
  await appendRunEvent({
    runId,
    kind: event.kind,
    payload: event.payload,
  });
}

async function updateRun(
  runId: string,
  patch: Partial<RunRecord>,
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const dbPatch: Record<string, unknown> = {};
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.holdId !== undefined) dbPatch.hold_id = patch.holdId;
    if (patch.artifacts !== undefined) dbPatch.artifacts = patch.artifacts;
    if (patch.error !== undefined) dbPatch.error = patch.error;
    if (patch.startedAt !== undefined)
      dbPatch.started_at = new Date(patch.startedAt).toISOString();
    if (patch.deliveredAt !== undefined)
      dbPatch.delivered_at = new Date(patch.deliveredAt).toISOString();
    if (patch.acceptedAt !== undefined)
      dbPatch.accepted_at = new Date(patch.acceptedAt).toISOString();
    await supabase.from("runs").update(dbPatch).eq("id", runId);
  }
  const existing = memRuns.get(runId);
  if (existing) memRuns.set(runId, { ...existing, ...patch });
}

async function loadRun(runId: string): Promise<RunRecord | undefined> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const { data } = await supabase
      .from("runs")
      .select("*")
      .eq("id", runId)
      .maybeSingle();
    if (!data) return undefined;
    return rowToRecord(data);
  }
  return memRuns.get(runId);
}

interface DbRunRow {
  id: string;
  agent_slug: string;
  brief_id: string | null;
  user_id: string;
  hold_id: string | null;
  service_name: string | null;
  service_price_cents: number;
  status: RunStatus;
  runtime: string;
  artifacts: RuntimeDeliverable[] | null;
  error: string | null;
  started_at: string | null;
  delivered_at: string | null;
  accepted_at: string | null;
  created_at: string;
}

function rowToRecord(row: DbRunRow): RunRecord {
  return {
    id: row.id,
    agentSlug: row.agent_slug,
    briefId: row.brief_id,
    userId: row.user_id,
    holdId: row.hold_id,
    serviceName: row.service_name ?? "",
    servicePriceCents: row.service_price_cents,
    status: row.status,
    runtime: row.runtime,
    artifacts: row.artifacts ?? [],
    error: row.error ?? undefined,
    startedAt: row.started_at ? new Date(row.started_at).getTime() : undefined,
    deliveredAt: row.delivered_at
      ? new Date(row.delivered_at).getTime()
      : undefined,
    acceptedAt: row.accepted_at
      ? new Date(row.accepted_at).getTime()
      : undefined,
    createdAt: new Date(row.created_at).getTime(),
  };
}

/**
 * Create + orchestrate a run end-to-end.
 *
 * Lifecycle (each transition stamps a run_events row):
 *   queued → validating → holding → running → delivered
 *
 * On any failure: rolls back to status=failed, releases the hold if open,
 * records the error.
 *
 * In a Vercel deployment this is invoked from `app/api/v1/runs/create` and
 * the agent step would be a Workflow Sleep / wait-for-webhook. Here we run
 * it inline (still durable in the DB via run_events) so we can test the
 * full sequence in CI without a queue runtime.
 */
export async function createAndOrchestrateRun(
  input: CreateRunInput,
): Promise<RunRecord> {
  const existingId = memIdempotency.get(input.idempotencyKey);
  if (existingId) {
    const existing = await loadRun(existingId);
    if (existing) return existing;
  }
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const { data: existing } = await supabase
      .from("runs")
      .select("id")
      .eq("external_idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (existing) {
      const found = await loadRun(existing.id);
      if (found) return found;
    }
  }

  const agent = await loadAgent(input.agentSlug);
  if (!agent) {
    throw new Error(`Unknown agent: ${input.agentSlug}`);
  }

  // 1) Persist the run in "queued" state.
  const runId = await insertRun(input, agent.runtime ?? "mock");
  await appendEvent(runId, { kind: "queued" });

  try {
    // 2) Validate the brief.
    await updateRun(runId, { status: "validating" });
    await appendEvent(runId, { kind: "validating" });
    const verdict = await compileBrief({
      agent,
      briefText: input.briefText,
      serviceName: input.serviceName,
    });
    if (verdict.verdict !== "pass") {
      await updateRun(runId, {
        status: "failed",
        error:
          verdict.verdict === "clarify"
            ? "Brief needs clarification before queueing."
            : verdict.rejectReason ?? "Brief rejected by validator.",
      });
      await appendEvent(runId, {
        kind: "validation_blocked",
        payload: { verdict: verdict.verdict },
      });
      return (await loadRun(runId))!;
    }
    await appendEvent(runId, {
      kind: "validation_passed",
      payload: { model: verdict.model, latencyMs: verdict.latencyMs },
    });

    // 3) Open a wallet hold.
    await updateRun(runId, { status: "holding" });
    const balance = await getBalance(input.userId);
    if (balance.balanceCents < input.servicePriceCents) {
      await updateRun(runId, {
        status: "failed",
        error: `Insufficient balance: $${(balance.balanceCents / 100).toFixed(2)} < $${(input.servicePriceCents / 100).toFixed(2)}.`,
      });
      await appendEvent(runId, { kind: "hold_failed_insufficient_balance" });
      return (await loadRun(runId))!;
    }
    const hold = await openWalletHold({
      userId: input.userId,
      agentSlug: input.agentSlug,
      amountCents: input.servicePriceCents,
      idempotencyKey: `hold:${input.idempotencyKey}`,
    });
    await updateRun(runId, { holdId: hold.holdId });
    await appendEvent(runId, {
      kind: "hold_open",
      payload: { holdId: hold.holdId, whopHoldId: hold.whopHoldId },
    });

    // 4) Invoke the runtime adapter.
    await updateRun(runId, { status: "running", startedAt: Date.now() });
    await appendEvent(runId, { kind: "agent_invoked" });
    const runtime = getRuntime(agent.runtime);
    const result = await runtime.invoke({
      agent,
      briefText: input.briefText,
      serviceName: input.serviceName,
      servicePriceCents: input.servicePriceCents,
      runId,
      onEvent: async (evt) => {
        await appendEvent(runId, {
          kind: evt.kind,
          payload: {
            label: evt.label,
            detail: evt.detail,
            artifact: evt.artifact,
          },
        });
      },
    });
    await appendEvent(runId, {
      kind: "agent_returned",
      payload: { durationMs: result.durationMs, runtime: result.runtime },
    });

    // 5) Ship artifacts to the agent's declared destinations via Composio.
    //    Each destination call writes a `composio_audit` row keyed to this
    //    run; the events here are what the SSE live trace surfaces.
    const destinations = agent.destinations ?? [];
    if (destinations.length > 0) {
      for (const dest of destinations) {
        await appendEvent(runId, {
          kind: "destination_dispatched",
          payload: {
            tool: dest.tool,
            method: dest.method,
            label: dest.label,
            target: dest.target,
          },
        });
      }
      const attempts = await deliverArtifacts({
        agent,
        runId,
        userId: input.userId,
        serviceName: input.serviceName,
        artifacts: result.artifacts,
      });
      for (const att of attempts) {
        await appendEvent(runId, {
          kind: att.ok ? "destination_delivered" : "destination_failed",
          payload: {
            tool: att.destination.tool,
            method: att.destination.method,
            label: att.destination.label,
            target: att.destination.target,
            statusCode: att.statusCode,
            durationMs: att.durationMs,
            stubbed: att.stubbed,
            responseId: att.responseId,
            error: att.error,
          },
        });
      }
    }

    // 6) Mark delivered. Buyer accept (which releases the hold) happens via
    //    a separate endpoint — we don't auto-release here.
    await updateRun(runId, {
      status: "delivered",
      artifacts: result.artifacts,
      deliveredAt: Date.now(),
    });
    await appendEvent(runId, {
      kind: "delivered",
      payload: { artifactCount: result.artifacts.length },
    });
    return (await loadRun(runId))!;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    await updateRun(runId, { status: "failed", error: message });
    await appendEvent(runId, { kind: "failed", payload: { message } });
    return (await loadRun(runId))!;
  }
}

async function insertRun(
  input: CreateRunInput,
  runtimeKey: string,
): Promise<string> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("runs")
      .insert({
        agent_slug: input.agentSlug,
        user_id: input.userId,
        service_name: input.serviceName,
        service_price_cents: input.servicePriceCents,
        runtime: runtimeKey,
        external_idempotency_key: input.idempotencyKey,
        status: "queued",
      })
      .select("id")
      .single();
    if (error || !data) {
      throw new Error(`runs insert failed: ${error?.message}`);
    }
    return data.id;
  }

  const id = newId();
  const rec: RunRecord = {
    id,
    agentSlug: input.agentSlug,
    briefId: null,
    userId: input.userId,
    holdId: null,
    serviceName: input.serviceName,
    servicePriceCents: input.servicePriceCents,
    status: "queued",
    runtime: runtimeKey,
    artifacts: [],
    createdAt: Date.now(),
  };
  memRuns.set(id, rec);
  memIdempotency.set(input.idempotencyKey, id);
  return id;
}

export async function getRun(runId: string): Promise<RunRecord | undefined> {
  return loadRun(runId);
}

export async function acceptRun(
  runId: string,
  idempotencyKey: string,
): Promise<RunRecord> {
  const run = await loadRun(runId);
  if (!run) throw new Error(`Unknown run: ${runId}`);
  if (run.status !== "delivered") {
    return run; // idempotent — only accept-once.
  }
  if (run.holdId) {
    await releaseWalletHold({
      userId: run.userId,
      holdId: run.holdId,
      idempotencyKey,
    });
  }
  await updateRun(runId, { status: "accepted", acceptedAt: Date.now() });
  await appendEvent(runId, { kind: "accepted" });
  return (await loadRun(runId))!;
}

export const _resetMemoryStores = () => {
  memRuns.clear();
  memIdempotency.clear();
};
