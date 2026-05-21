import { NextResponse } from "next/server";

import { fireChainsForCompletedRun } from "@/lib/chains/service";
import { acceptRun } from "@/lib/runs/service";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface Body {
  idempotencyKey?: string;
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    // empty body is fine; accept POST without a JSON payload.
  }
  const idempotencyKey =
    body.idempotencyKey ||
    request.headers.get("idempotency-key") ||
    `accept:${id}:${Date.now()}`;
  try {
    const run = await acceptRun(id, idempotencyKey);
    // Fire any chains rooted at this agent. v1 cap: chains don't recurse
    // (the downstream run won't fire its own chains from this code path —
    // only buyer-accepted runs do).
    let chainResults: Array<{ chainId: string; run: { id: string } }> = [];
    if (run.status === "accepted") {
      try {
        const fired = await fireChainsForCompletedRun({
          sourceAgentSlug: run.agentSlug,
          userId: run.userId,
          sourceRunId: run.id,
        });
        chainResults = fired.map(({ chainId, run }) => ({
          chainId,
          run: { id: run.id },
        }));
      } catch {
        // Chain firing failure must not break the buyer's accept response.
      }
    }
    return NextResponse.json({ ...run, chains: chainResults }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Accept failed.";
    return NextResponse.json(
      { error: "accept_failed", message: msg },
      { status: 500 },
    );
  }
}
