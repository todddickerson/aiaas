import { NextResponse } from "next/server";

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
    return NextResponse.json(run, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Accept failed.";
    return NextResponse.json(
      { error: "accept_failed", message: msg },
      { status: 500 },
    );
  }
}
