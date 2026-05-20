import { NextResponse } from "next/server";

import { compileBrief } from "@/lib/validator/compile-brief";
import { loadAgent } from "@/lib/seed/loader";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface ValidateRequestBody {
  agentSlug?: string;
  briefText?: string;
  serviceName?: string;
  servicePriceCents?: number;
  userId?: string;
}

interface ValidateResponse {
  briefId: string | null;
  verdict: "pass" | "clarify" | "rejected";
  clarifyQuestions: string[];
  rejectReason?: string;
  model: string;
  latencyMs: number;
  stubbed: boolean;
}

export async function POST(request: Request) {
  let body: ValidateRequestBody;
  try {
    body = (await request.json()) as ValidateRequestBody;
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Body must be JSON." },
      { status: 400 },
    );
  }

  const agentSlug = body.agentSlug?.trim();
  const briefText = body.briefText?.trim() ?? "";
  if (!agentSlug) {
    return NextResponse.json(
      { error: "missing_agent", message: "agentSlug is required." },
      { status: 400 },
    );
  }
  if (briefText.length < 8) {
    return NextResponse.json(
      {
        briefId: null,
        verdict: "rejected",
        clarifyQuestions: [],
        rejectReason: "brief too short",
        model: "guard",
        latencyMs: 0,
        stubbed: true,
      } satisfies ValidateResponse,
      { status: 200 },
    );
  }

  const agent = await loadAgent(agentSlug);
  if (!agent) {
    return NextResponse.json(
      { error: "unknown_agent", message: `No agent for slug ${agentSlug}` },
      { status: 404 },
    );
  }

  const result = await compileBrief({
    agent,
    briefText,
    serviceName: body.serviceName,
  });

  // Persist if Supabase is configured. Best-effort: a failure here never
  // blocks the validator response — the in-memory result is what the UI uses.
  let briefId: string | null = null;
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("briefs")
        .insert({
          agent_slug: agent.handle.slice(1),
          user_id: body.userId ?? null,
          raw_text: briefText,
          status: result.verdict === "pass" ? "pass" : result.verdict,
          clarify_questions: result.clarifyQuestions,
          reject_reason: result.rejectReason ?? null,
          validator_model: result.model,
          validator_latency_ms: result.latencyMs,
          service_name: body.serviceName ?? null,
          service_price_cents: body.servicePriceCents ?? null,
        })
        .select("id")
        .single();
      briefId = data?.id ?? null;
    } catch {
      briefId = null;
    }
  }

  const response: ValidateResponse = {
    briefId,
    verdict: result.verdict,
    clarifyQuestions: result.clarifyQuestions,
    rejectReason: result.rejectReason,
    model: result.model,
    latencyMs: result.latencyMs,
    stubbed: result.stubbed,
  };
  return NextResponse.json(response, { status: 200 });
}
