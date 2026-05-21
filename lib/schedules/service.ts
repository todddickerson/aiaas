import "server-only";

import { createAndOrchestrateRun, type RunRecord } from "@/lib/runs/service";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export type Cadence = "daily" | "weekly" | "monthly";
export type ScheduleStatus = "active" | "paused" | "cancelled";

export interface ScheduleRecord {
  id: string;
  userId: string;
  agentSlug: string;
  cadence: Cadence;
  serviceName: string;
  servicePriceCents: number;
  briefTemplate: string;
  nextFireAt?: number;
  lastFiredAt?: number;
  fireCount: number;
  status: ScheduleStatus;
  createdAt: number;
  updatedAt: number;
}

export interface CreateScheduleInput {
  userId: string;
  agentSlug: string;
  cadence: Cadence;
  serviceName: string;
  servicePriceCents: number;
  briefTemplate: string;
}

interface DbRow {
  id: string;
  user_id: string;
  agent_slug: string;
  cadence: Cadence;
  service_name: string;
  service_price_cents: number;
  brief_template: string;
  next_fire_at: string | null;
  last_fired_at: string | null;
  fire_count: number;
  status: ScheduleStatus;
  created_at: string;
  updated_at: string;
}

type Store = {
  schedules: Map<string, ScheduleRecord>;
};

const STORE_KEY = "__aiaas_schedules__";
interface Holder {
  [STORE_KEY]?: Store;
}
const holder = globalThis as unknown as Holder;
const store: Store =
  holder[STORE_KEY] ?? (holder[STORE_KEY] = { schedules: new Map() });

function rowToRecord(row: DbRow): ScheduleRecord {
  return {
    id: row.id,
    userId: row.user_id,
    agentSlug: row.agent_slug,
    cadence: row.cadence,
    serviceName: row.service_name,
    servicePriceCents: row.service_price_cents,
    briefTemplate: row.brief_template,
    nextFireAt: row.next_fire_at ? new Date(row.next_fire_at).getTime() : undefined,
    lastFiredAt: row.last_fired_at ? new Date(row.last_fired_at).getTime() : undefined,
    fireCount: row.fire_count,
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

function newId(): string {
  return "sch_" + Math.random().toString(16).slice(2, 14);
}

function computeNextFire(cadence: Cadence, from: Date = new Date()): Date {
  const next = new Date(from);
  if (cadence === "daily") next.setDate(next.getDate() + 1);
  if (cadence === "weekly") next.setDate(next.getDate() + 7);
  if (cadence === "monthly") next.setMonth(next.getMonth() + 1);
  return next;
}

export async function createSchedule(
  input: CreateScheduleInput,
): Promise<ScheduleRecord> {
  const supabase = getSupabaseServiceClient();
  const nextFireAt = computeNextFire(input.cadence);
  if (supabase) {
    const { data, error } = await supabase
      .from("schedules")
      .insert({
        user_id: input.userId,
        agent_slug: input.agentSlug,
        cadence: input.cadence,
        service_name: input.serviceName,
        service_price_cents: input.servicePriceCents,
        brief_template: input.briefTemplate,
        next_fire_at: nextFireAt.toISOString(),
        status: "active",
      })
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(`schedule insert failed: ${error?.message}`);
    }
    return rowToRecord(data as DbRow);
  }
  const id = newId();
  const now = Date.now();
  const rec: ScheduleRecord = {
    id,
    userId: input.userId,
    agentSlug: input.agentSlug,
    cadence: input.cadence,
    serviceName: input.serviceName,
    servicePriceCents: input.servicePriceCents,
    briefTemplate: input.briefTemplate,
    nextFireAt: nextFireAt.getTime(),
    fireCount: 0,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  store.schedules.set(id, rec);
  return rec;
}

export async function getSchedule(
  id: string,
): Promise<ScheduleRecord | undefined> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const { data } = await supabase
      .from("schedules")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data ? rowToRecord(data as DbRow) : undefined;
  }
  return store.schedules.get(id);
}

export async function listSchedules(userId: string): Promise<ScheduleRecord[]> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const { data } = await supabase
      .from("schedules")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (data ?? []).map((row) => rowToRecord(row as DbRow));
  }
  return Array.from(store.schedules.values())
    .filter((s) => s.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function cancelSchedule(
  id: string,
): Promise<ScheduleRecord | undefined> {
  return patchSchedule(id, { status: "cancelled" });
}

async function patchSchedule(
  id: string,
  patch: Partial<ScheduleRecord>,
): Promise<ScheduleRecord | undefined> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const dbPatch: Record<string, unknown> = {};
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.nextFireAt !== undefined)
      dbPatch.next_fire_at = new Date(patch.nextFireAt).toISOString();
    if (patch.lastFiredAt !== undefined)
      dbPatch.last_fired_at = new Date(patch.lastFiredAt).toISOString();
    if (patch.fireCount !== undefined) dbPatch.fire_count = patch.fireCount;
    const { data } = await supabase
      .from("schedules")
      .update(dbPatch)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    return data ? rowToRecord(data as DbRow) : undefined;
  }
  const existing = store.schedules.get(id);
  if (!existing) return undefined;
  const next = { ...existing, ...patch, updatedAt: Date.now() };
  store.schedules.set(id, next);
  return next;
}

/**
 * Fire a schedule once — creates a run using the schedule's brief template
 * + service. Idempotent on (scheduleId, fireCount): if the cron retries the
 * same firing, we get the same run back.
 */
export async function fireSchedule(scheduleId: string): Promise<RunRecord> {
  const sched = await getSchedule(scheduleId);
  if (!sched) throw new Error(`Unknown schedule: ${scheduleId}`);
  if (sched.status !== "active") {
    throw new Error(`Schedule ${scheduleId} is not active (${sched.status}).`);
  }
  const fireCount = sched.fireCount + 1;
  const idempotencyKey = `schedule:${sched.id}:fire:${fireCount}`;
  const run = await createAndOrchestrateRun({
    agentSlug: sched.agentSlug,
    briefText: sched.briefTemplate,
    serviceName: sched.serviceName,
    servicePriceCents: sched.servicePriceCents,
    userId: sched.userId,
    idempotencyKey,
  });
  await patchSchedule(scheduleId, {
    fireCount,
    lastFiredAt: Date.now(),
    nextFireAt: computeNextFire(sched.cadence).getTime(),
  });
  return run;
}

export const _resetScheduleStore = () => {
  store.schedules.clear();
};
