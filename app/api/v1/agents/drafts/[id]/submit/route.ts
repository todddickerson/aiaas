import { NextResponse } from "next/server";

import { submitDraft } from "@/lib/drafts/service";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const draft = await submitDraft(id);
    if (!draft) {
      return NextResponse.json(
        { error: "not_found", message: `No draft with id ${id}.` },
        { status: 404 },
      );
    }
    return NextResponse.json(draft, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "submit failed.";
    return NextResponse.json(
      { error: "submit_failed", message: msg },
      { status: 400 },
    );
  }
}
