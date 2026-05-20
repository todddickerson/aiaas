import { NextResponse } from "next/server";

import { topUp } from "@/lib/wallet/service";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

interface Body {
  userId?: string;
  amountCents?: number;
  currency?: string;
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

  if (!body.userId || typeof body.userId !== "string") {
    return NextResponse.json(
      { error: "missing_user", message: "userId is required." },
      { status: 400 },
    );
  }
  if (!body.amountCents || body.amountCents <= 0) {
    return NextResponse.json(
      { error: "invalid_amount", message: "amountCents must be > 0." },
      { status: 400 },
    );
  }
  const idempotencyKey =
    body.idempotencyKey ||
    request.headers.get("idempotency-key") ||
    `top-up:${body.userId}:${Date.now()}`;

  try {
    const result = await topUp({
      userId: body.userId,
      amountCents: body.amountCents,
      currency: body.currency,
      idempotencyKey,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Top-up failed.";
    return NextResponse.json(
      { error: "top_up_failed", message: msg },
      { status: 500 },
    );
  }
}
