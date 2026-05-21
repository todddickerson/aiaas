import "server-only";

import { invokeComposio } from "@/lib/composio/client";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import type {
  Agent,
  AgentDestination,
  SampleDeliverable,
} from "@/lib/types";

export interface DeliveryInput {
  agent: Agent;
  runId: string;
  userId: string;
  serviceName: string;
  artifacts: Array<SampleDeliverable & { preview?: string }>;
}

export interface DeliveryAttempt {
  destination: AgentDestination;
  ok: boolean;
  statusCode: number;
  durationMs: number;
  stubbed: boolean;
  responseId?: string;
  error?: string;
}

/**
 * For each declared destination, ship the artifact summary via Composio.
 * Each call writes a `composio_audit` row keyed to the run so the audit
 * trail is end-to-end queryable: "what did agent X actually call on run Y?".
 *
 * Failure on one destination doesn't abort the others — we return one
 * `DeliveryAttempt` per destination and let the caller decide whether a
 * partial delivery still counts as `delivered` (right now it does; the
 * audit row is the source of truth).
 */
export async function deliverArtifacts(
  input: DeliveryInput,
): Promise<DeliveryAttempt[]> {
  const dests = input.agent.destinations ?? [];
  if (dests.length === 0) return [];

  const attempts: DeliveryAttempt[] = [];
  for (let i = 0; i < dests.length; i++) {
    const dest = dests[i];
    const payload = buildPayload(dest, input);
    const idempotencyKey = `deliver:${input.runId}:${dest.tool}:${dest.method}:${i}`;
    const result = await invokeComposio({
      tool: dest.tool,
      method: dest.method,
      payload,
      idempotencyKey,
    });

    // Always audit. The proxy route also audits, but delivery dispatch goes
    // through the client directly so we record the row ourselves.
    await auditCall({
      runId: input.runId,
      agentSlug: input.agent.id,
      userId: input.userId,
      tool: dest.tool,
      method: dest.method,
      requestPayload: payload,
      responsePayload: result.data,
      statusCode: result.statusCode,
      durationMs: result.durationMs,
      error: result.error,
      idempotencyKey,
      stubbed: result.stubbed,
    });

    attempts.push({
      destination: dest,
      ok: result.ok,
      statusCode: result.statusCode,
      durationMs: result.durationMs,
      stubbed: result.stubbed,
      responseId: extractId(result.data),
      error: result.error,
    });
  }

  return attempts;
}

function buildPayload(
  dest: AgentDestination,
  input: DeliveryInput,
): Record<string, unknown> {
  const summary = formatSummary(input);
  const base: Record<string, unknown> = { ...dest.target };
  if (dest.tool === "slack") {
    base.text = summary;
  } else if (dest.tool === "gmail" || dest.tool === "email") {
    base.subject = `${input.agent.name} · ${input.serviceName}`;
    base.body = summary;
  } else if (dest.tool === "notion") {
    base.properties = {
      Title: `${input.agent.name} delivery · ${input.serviceName}`,
      Summary: summary,
    };
  } else {
    base.summary = summary;
  }
  base.run_id = input.runId;
  return base;
}

function formatSummary(input: DeliveryInput): string {
  const lines = [
    `${input.agent.name} just delivered ${input.serviceName}.`,
    "",
    "Artifacts:",
    ...input.artifacts.map((a) => `  • ${a.label} (${a.kind})`),
  ];
  return lines.join("\n");
}

function extractId(data: Record<string, unknown>): string | undefined {
  const id = (data?.id ?? data?.ts) as unknown;
  return typeof id === "string" ? id : undefined;
}

interface AuditInput {
  runId: string;
  agentSlug: string;
  userId: string;
  tool: string;
  method: string;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
  statusCode: number;
  durationMs: number;
  error?: string;
  idempotencyKey: string;
  stubbed: boolean;
}

async function auditCall(input: AuditInput): Promise<void> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return;
  try {
    await supabase.from("composio_audit").insert({
      run_id: input.runId,
      agent_slug: input.agentSlug,
      user_id: input.userId,
      tool: input.tool,
      method: input.method,
      request_payload: input.requestPayload,
      response_payload: input.responsePayload,
      status_code: input.statusCode,
      duration_ms: input.durationMs,
      error: input.error ?? null,
      external_idempotency_key: input.idempotencyKey,
      stubbed: input.stubbed,
    });
  } catch {
    // audit failure must not break delivery
  }
}
