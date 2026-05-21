import { NextResponse } from "next/server";

import { createChain, listChainsForUser } from "@/lib/chains/service";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

interface CreateBody {
  userId?: string;
  sourceAgentSlug?: string;
  targetAgentSlug?: string;
  targetServiceName?: string;
  targetServicePriceCents?: number;
  briefTemplate?: string;
  budgetCapCents?: number;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json(
      { error: "missing_userId", message: "userId is required." },
      { status: 400 },
    );
  }
  const rows = await listChainsForUser(userId);
  return NextResponse.json({ chains: rows }, { status: 200 });
}

export async function POST(request: Request) {
  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Body must be JSON." },
      { status: 400 },
    );
  }
  const missing = [
    !body.userId && "userId",
    !body.sourceAgentSlug && "sourceAgentSlug",
    !body.targetAgentSlug && "targetAgentSlug",
    !body.targetServiceName && "targetServiceName",
    !body.targetServicePriceCents && "targetServicePriceCents",
    !body.briefTemplate && "briefTemplate",
  ].filter(Boolean);
  if (missing.length) {
    return NextResponse.json(
      {
        error: "missing_fields",
        message: `Missing: ${missing.join(", ")}.`,
      },
      { status: 400 },
    );
  }
  try {
    const rec = await createChain({
      userId: body.userId!,
      sourceAgentSlug: body.sourceAgentSlug!,
      targetAgentSlug: body.targetAgentSlug!,
      targetServiceName: body.targetServiceName!,
      targetServicePriceCents: body.targetServicePriceCents!,
      briefTemplate: body.briefTemplate!,
      budgetCapCents: body.budgetCapCents,
    });
    return NextResponse.json(rec, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Chain create failed.";
    return NextResponse.json(
      { error: "chain_failed", message: msg },
      { status: 400 },
    );
  }
}
