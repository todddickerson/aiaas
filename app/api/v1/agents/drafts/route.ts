import { NextResponse } from "next/server";

import { createDraft } from "@/lib/drafts/service";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

interface Body {
  builderId?: string;
  name?: string;
  category?: string;
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
  if (!body.builderId) {
    return NextResponse.json(
      { error: "missing_builder", message: "builderId is required." },
      { status: 400 },
    );
  }
  const draft = await createDraft({
    builderId: body.builderId,
    name: body.name,
    category: body.category,
  });
  return NextResponse.json(draft, { status: 200 });
}
