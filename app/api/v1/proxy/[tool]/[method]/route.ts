import { NextResponse } from "next/server";

import { invokeComposio } from "@/lib/composio/client";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ tool: string; method: string }>;
}

interface Body {
  payload?: Record<string, unknown>;
  entityId?: string;
  agentSlug?: string;
  userId?: string;
  runId?: string;
  idempotencyKey?: string;
}

const TOOL_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/i;

export async function POST(request: Request, context: RouteContext) {
  const { tool, method } = await context.params;
  if (!TOOL_PATTERN.test(tool) || !TOOL_PATTERN.test(method)) {
    return NextResponse.json(
      { error: "invalid_route", message: "tool/method must be alphanumeric." },
      { status: 400 },
    );
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    // empty body is OK — some tools (e.g., "list channels") take no payload.
  }
  if (!body.agentSlug) {
    return NextResponse.json(
      { error: "missing_agent", message: "agentSlug is required." },
      { status: 400 },
    );
  }

  const idempotencyKey =
    body.idempotencyKey ||
    request.headers.get("idempotency-key") ||
    `${tool}.${method}:${body.runId ?? body.agentSlug}:${Date.now()}`;

  const result = await invokeComposio({
    tool,
    method,
    payload: body.payload ?? {},
    entityId: body.entityId,
    idempotencyKey,
  });

  // Best-effort audit row. Doesn't block the response on insert failure.
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    try {
      await supabase.from("composio_audit").insert({
        run_id: body.runId ?? null,
        agent_slug: body.agentSlug,
        user_id: body.userId ?? null,
        tool,
        method,
        request_payload: body.payload ?? {},
        response_payload: result.data,
        status_code: result.statusCode,
        duration_ms: result.durationMs,
        error: result.error ?? null,
        external_idempotency_key: idempotencyKey,
        stubbed: result.stubbed,
      });
    } catch {
      // ignore audit failures
    }
  }

  return NextResponse.json(
    {
      ok: result.ok,
      tool,
      method,
      data: result.data,
      durationMs: result.durationMs,
      stubbed: result.stubbed,
      error: result.error,
    },
    { status: result.ok ? 200 : 502 },
  );
}
