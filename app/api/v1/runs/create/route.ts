import { NextResponse } from "next/server";

import { createAndOrchestrateRun } from "@/lib/runs/service";

export const runtime = "nodejs";
export const maxDuration = 800;
export const dynamic = "force-dynamic";

interface Body {
  agentSlug?: string;
  briefText?: string;
  serviceName?: string;
  servicePriceCents?: number;
  userId?: string;
  idempotencyKey?: string;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Body must be JSON." },
      { status: 400 },
    );
  }

  const missing = [
    !body.agentSlug && "agentSlug",
    !body.briefText && "briefText",
    !body.serviceName && "serviceName",
    !body.servicePriceCents && "servicePriceCents",
    !body.userId && "userId",
  ].filter(Boolean);
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: "missing_fields",
        message: `Missing required fields: ${missing.join(", ")}.`,
      },
      { status: 400 },
    );
  }

  const idempotencyKey =
    body.idempotencyKey ||
    request.headers.get("idempotency-key") ||
    `run:${body.userId}:${Date.now()}`;

  try {
    const run = await createAndOrchestrateRun({
      agentSlug: body.agentSlug!,
      briefText: body.briefText!,
      serviceName: body.serviceName!,
      servicePriceCents: body.servicePriceCents!,
      userId: body.userId!,
      idempotencyKey,
    });
    return NextResponse.json(run, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Run failed.";
    return NextResponse.json(
      { error: "run_failed", message: msg },
      { status: 500 },
    );
  }
}
