import "server-only";

import { compileSpec, type SpecCompileResult } from "@/lib/validator/compile-spec";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export interface AgentDraft {
  id: string;
  builderId: string;
  slug?: string;
  name?: string;
  persona?: string;
  tagline?: string;
  category?: string;
  specText?: string;
  specStatus: "draft" | "compiling" | "ready" | "needs_revision" | "rejected";
  specSummary?: string;
  specRequiredInputs: string[];
  specForbiddenClaims: string[];
  specQuestions: string[];
  specModel?: string;
  specLatencyMs?: number;
  runtime: string;
  destinations: string[];
  priceFromCents?: number;
  priceMaxCents?: number;
  services: Array<{ name: string; price: number; time: string }>;
  whopPayeeId?: string;
  whopPayeeStatus: "pending" | "linked" | "failed";
  publishStatus: "draft" | "submitted" | "live" | "rejected";
  publishedAgentId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateDraftInput {
  builderId: string;
  name?: string;
  category?: string;
}

export interface UpdateDraftInput {
  name?: string;
  slug?: string;
  persona?: string;
  tagline?: string;
  category?: string;
  specText?: string;
  runtime?: string;
  destinations?: string[];
  priceFromCents?: number;
  priceMaxCents?: number;
  services?: Array<{ name: string; price: number; time: string }>;
}

interface DbRow {
  id: string;
  builder_id: string;
  slug: string | null;
  name: string | null;
  persona: string | null;
  tagline: string | null;
  category: string | null;
  spec_text: string | null;
  spec_status: AgentDraft["specStatus"];
  spec_summary: string | null;
  spec_required_inputs: string[] | null;
  spec_forbidden_claims: string[] | null;
  spec_questions: string[] | null;
  spec_model: string | null;
  spec_latency_ms: number | null;
  runtime: string | null;
  destinations: string[] | null;
  price_from_cents: number | null;
  price_max_cents: number | null;
  services: AgentDraft["services"] | null;
  whop_payee_id: string | null;
  whop_payee_status: AgentDraft["whopPayeeStatus"];
  publish_status: AgentDraft["publishStatus"];
  published_agent_id: string | null;
  created_at: string;
  updated_at: string;
}

const memDrafts = new Map<string, AgentDraft>();

function newId(): string {
  return "draft_" + Math.random().toString(16).slice(2, 14);
}

function rowToDraft(row: DbRow): AgentDraft {
  return {
    id: row.id,
    builderId: row.builder_id,
    slug: row.slug ?? undefined,
    name: row.name ?? undefined,
    persona: row.persona ?? undefined,
    tagline: row.tagline ?? undefined,
    category: row.category ?? undefined,
    specText: row.spec_text ?? undefined,
    specStatus: row.spec_status,
    specSummary: row.spec_summary ?? undefined,
    specRequiredInputs: row.spec_required_inputs ?? [],
    specForbiddenClaims: row.spec_forbidden_claims ?? [],
    specQuestions: row.spec_questions ?? [],
    specModel: row.spec_model ?? undefined,
    specLatencyMs: row.spec_latency_ms ?? undefined,
    runtime: row.runtime ?? "mock",
    destinations: row.destinations ?? [],
    priceFromCents: row.price_from_cents ?? undefined,
    priceMaxCents: row.price_max_cents ?? undefined,
    services: row.services ?? [],
    whopPayeeId: row.whop_payee_id ?? undefined,
    whopPayeeStatus: row.whop_payee_status,
    publishStatus: row.publish_status,
    publishedAgentId: row.published_agent_id ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export async function createDraft(
  input: CreateDraftInput,
): Promise<AgentDraft> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("agent_drafts")
      .insert({
        builder_id: input.builderId,
        name: input.name ?? null,
        category: input.category ?? null,
      })
      .select("*")
      .single();
    if (error || !data) throw new Error(`drafts insert failed: ${error?.message}`);
    return rowToDraft(data as DbRow);
  }
  const now = Date.now();
  const draft: AgentDraft = {
    id: newId(),
    builderId: input.builderId,
    name: input.name,
    category: input.category,
    specStatus: "draft",
    specRequiredInputs: [],
    specForbiddenClaims: [],
    specQuestions: [],
    runtime: "mock",
    destinations: [],
    services: [],
    whopPayeeStatus: "pending",
    publishStatus: "draft",
    createdAt: now,
    updatedAt: now,
  };
  memDrafts.set(draft.id, draft);
  return draft;
}

export async function getDraft(id: string): Promise<AgentDraft | undefined> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const { data } = await supabase
      .from("agent_drafts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data ? rowToDraft(data as DbRow) : undefined;
  }
  return memDrafts.get(id);
}

export async function updateDraft(
  id: string,
  patch: UpdateDraftInput,
): Promise<AgentDraft | undefined> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const dbPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.slug !== undefined) dbPatch.slug = patch.slug;
    if (patch.persona !== undefined) dbPatch.persona = patch.persona;
    if (patch.tagline !== undefined) dbPatch.tagline = patch.tagline;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.specText !== undefined) dbPatch.spec_text = patch.specText;
    if (patch.runtime !== undefined) dbPatch.runtime = patch.runtime;
    if (patch.destinations !== undefined) dbPatch.destinations = patch.destinations;
    if (patch.priceFromCents !== undefined) dbPatch.price_from_cents = patch.priceFromCents;
    if (patch.priceMaxCents !== undefined) dbPatch.price_max_cents = patch.priceMaxCents;
    if (patch.services !== undefined) dbPatch.services = patch.services;
    const { data } = await supabase
      .from("agent_drafts")
      .update(dbPatch)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    return data ? rowToDraft(data as DbRow) : undefined;
  }
  const draft = memDrafts.get(id);
  if (!draft) return undefined;
  const next: AgentDraft = {
    ...draft,
    ...patch,
    updatedAt: Date.now(),
  };
  memDrafts.set(id, next);
  return next;
}

async function patchDraftCore(
  id: string,
  patch: Partial<AgentDraft>,
): Promise<AgentDraft | undefined> {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const dbPatch: Record<string, unknown> = {};
    if (patch.specStatus !== undefined) dbPatch.spec_status = patch.specStatus;
    if (patch.specSummary !== undefined) dbPatch.spec_summary = patch.specSummary;
    if (patch.specRequiredInputs !== undefined)
      dbPatch.spec_required_inputs = patch.specRequiredInputs;
    if (patch.specForbiddenClaims !== undefined)
      dbPatch.spec_forbidden_claims = patch.specForbiddenClaims;
    if (patch.specQuestions !== undefined) dbPatch.spec_questions = patch.specQuestions;
    if (patch.specModel !== undefined) dbPatch.spec_model = patch.specModel;
    if (patch.specLatencyMs !== undefined) dbPatch.spec_latency_ms = patch.specLatencyMs;
    if (patch.whopPayeeId !== undefined) dbPatch.whop_payee_id = patch.whopPayeeId;
    if (patch.whopPayeeStatus !== undefined)
      dbPatch.whop_payee_status = patch.whopPayeeStatus;
    if (patch.publishStatus !== undefined) dbPatch.publish_status = patch.publishStatus;
    if (patch.publishedAgentId !== undefined)
      dbPatch.published_agent_id = patch.publishedAgentId;
    const { data } = await supabase
      .from("agent_drafts")
      .update(dbPatch)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    return data ? rowToDraft(data as DbRow) : undefined;
  }
  const draft = memDrafts.get(id);
  if (!draft) return undefined;
  const next: AgentDraft = { ...draft, ...patch, updatedAt: Date.now() };
  memDrafts.set(id, next);
  return next;
}

export async function compileDraftSpec(
  id: string,
): Promise<{ draft: AgentDraft; result: SpecCompileResult } | undefined> {
  const draft = await getDraft(id);
  if (!draft) return undefined;
  if (!draft.specText) {
    return {
      draft,
      result: {
        status: "rejected",
        summary: "",
        requiredInputs: [],
        forbiddenClaims: [],
        questions: [],
        rejectReason: "spec is empty",
        model: "guard",
        latencyMs: 0,
        stubbed: true,
      },
    };
  }
  await patchDraftCore(id, { specStatus: "compiling" });
  const result = await compileSpec({
    name: draft.name,
    tagline: draft.tagline,
    category: draft.category,
    specText: draft.specText,
  });
  const next = await patchDraftCore(id, {
    specStatus: result.status,
    specSummary: result.summary,
    specRequiredInputs: result.requiredInputs,
    specForbiddenClaims: result.forbiddenClaims,
    specQuestions: result.questions,
    specModel: result.model,
    specLatencyMs: result.latencyMs,
  });
  return { draft: next ?? draft, result };
}

export async function linkWhopPayee(
  id: string,
  whopPayeeId: string,
): Promise<AgentDraft | undefined> {
  // Stub link — when the real Whop payee endpoint lands this becomes a
  // real `payouts.createPayee` call.
  return patchDraftCore(id, {
    whopPayeeId,
    whopPayeeStatus: "linked",
  });
}

export async function submitDraft(id: string): Promise<AgentDraft | undefined> {
  const draft = await getDraft(id);
  if (!draft) return undefined;
  if (draft.specStatus !== "ready") {
    throw new Error("Spec must be compiled (status=ready) before publish.");
  }
  if (draft.whopPayeeStatus !== "linked") {
    throw new Error("Whop payee must be linked before publish.");
  }
  return patchDraftCore(id, { publishStatus: "submitted" });
}

export const _resetMemoryStores = () => {
  memDrafts.clear();
};
