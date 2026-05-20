import { NextResponse } from "next/server";

import { compileDraftSpec } from "@/lib/drafts/service";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const out = await compileDraftSpec(id);
  if (!out) {
    return NextResponse.json(
      { error: "not_found", message: `No draft with id ${id}.` },
      { status: 404 },
    );
  }
  return NextResponse.json(
    { draft: out.draft, compile: out.result },
    { status: 200 },
  );
}
