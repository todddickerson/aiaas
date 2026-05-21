import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/service";

export type RunEventKind =
  | "queued"
  | "validating"
  | "validation_passed"
  | "validation_blocked"
  | "holding"
  | "hold_open"
  | "hold_failed_insufficient_balance"
  | "running"
  | "agent_invoked"
  | "agent_thought"
  | "agent_tool"
  | "agent_read"
  | "agent_write"
  | "agent_log"
  | "agent_milestone"
  | "agent_returned"
  | "delivered"
  | "accepted"
  | "failed";

export interface RunEvent {
  id: string;
  runId: string;
  kind: RunEventKind | string;
  payload: Record<string, unknown>;
  createdAt: number;
}

interface AppendInput {
  runId: string;
  kind: string;
  payload?: Record<string, unknown>;
}

// In-memory fallback for tests + when Supabase isn't configured. Pub/sub
// pattern so SSE handlers can subscribe and get push-style updates.
//
// On globalThis for the same reason as the run stores in service.ts: the
// `/runs/[id]` server-component replay page and the `/api/v1/runs/.../events`
// route may otherwise bundle to separate module instances.
type EventStores = {
  memEvents: Map<string, RunEvent[]>;
  subscribers: Map<string, Set<(event: RunEvent) => void>>;
};
const EVENT_STORE_KEY = "__aiaas_event_stores__";
interface EventStoresHolder {
  [EVENT_STORE_KEY]?: EventStores;
}
const eventHolder = globalThis as unknown as EventStoresHolder;
const eventStores: EventStores =
  eventHolder[EVENT_STORE_KEY] ??
  (eventHolder[EVENT_STORE_KEY] = {
    memEvents: new Map(),
    subscribers: new Map(),
  });
const memEvents = eventStores.memEvents;
const subscribers = eventStores.subscribers;

function newEventId(): string {
  return "evt_" + Math.random().toString(16).slice(2, 14);
}

export async function appendRunEvent(input: AppendInput): Promise<RunEvent> {
  const event: RunEvent = {
    id: newEventId(),
    runId: input.runId,
    kind: input.kind,
    payload: input.payload ?? {},
    createdAt: Date.now(),
  };

  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("run_events")
      .insert({
        run_id: input.runId,
        kind: input.kind,
        payload: input.payload ?? {},
      })
      .select("id, created_at")
      .single();
    if (error || !data) {
      throw new Error(`run_events insert failed: ${error?.message}`);
    }
    event.id = data.id;
    event.createdAt = new Date(data.created_at).getTime();
  }

  const bucket = memEvents.get(input.runId) ?? [];
  bucket.push(event);
  memEvents.set(input.runId, bucket);

  const subs = subscribers.get(input.runId);
  if (subs) {
    for (const fn of subs) {
      try {
        fn(event);
      } catch {
        // a single bad subscriber shouldn't block the publish path.
      }
    }
  }

  return event;
}

export async function listRunEvents(runId: string): Promise<RunEvent[]> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("run_events")
      .select("id, run_id, kind, payload, created_at")
      .eq("run_id", runId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(`run_events list failed: ${error.message}`);
    return (data ?? []).map((row) => ({
      id: row.id,
      runId: row.run_id,
      kind: row.kind,
      payload: row.payload ?? {},
      createdAt: new Date(row.created_at).getTime(),
    }));
  }
  return memEvents.get(runId) ?? [];
}

/**
 * Subscribe to new events for a run. Returns an unsubscribe function.
 * When Supabase is configured we also subscribe to its Realtime channel and
 * forward changes to the callback — that's how external workers (which
 * write directly to Postgres) reach the SSE stream.
 */
export function subscribeToRunEvents(
  runId: string,
  onEvent: (event: RunEvent) => void,
): () => void {
  const bucket = subscribers.get(runId) ?? new Set();
  bucket.add(onEvent);
  subscribers.set(runId, bucket);

  let realtimeCleanup: (() => void) | null = null;
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const channel = supabase
      .channel(`run_events:${runId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "run_events",
          filter: `run_id=eq.${runId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            run_id: string;
            kind: string;
            payload: Record<string, unknown> | null;
            created_at: string;
          };
          onEvent({
            id: row.id,
            runId: row.run_id,
            kind: row.kind,
            payload: row.payload ?? {},
            createdAt: new Date(row.created_at).getTime(),
          });
        },
      )
      .subscribe();
    realtimeCleanup = () => {
      void supabase.removeChannel(channel);
    };
  }

  return () => {
    bucket.delete(onEvent);
    if (bucket.size === 0) subscribers.delete(runId);
    realtimeCleanup?.();
  };
}

export const _resetEventStores = () => {
  memEvents.clear();
  subscribers.clear();
};
