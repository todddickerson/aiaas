import { NextResponse } from "next/server";

import { getDraft, updateDraft, type UpdateDraftInput } from "@/lib/drafts/service";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const draft = await getDraft(id);
  if (!draft) {
    return NextResponse.json(
      { error: "not_found", message: `No draft with id ${id}.` },
      { status: 404 },
    );
  }
  return NextResponse.json(draft, { status: 200 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  let body: UpdateDraftInput;
  try {
    body = (await request.json()) as UpdateDraftInput;
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Body must be JSON." },
      { status: 400 },
    );
  }
  const draft = await updateDraft(id, body);
  if (!draft) {
    return NextResponse.json(
      { error: "not_found", message: `No draft with id ${id}.` },
      { status: 404 },
    );
  }
  return NextResponse.json(draft, { status: 200 });
}
