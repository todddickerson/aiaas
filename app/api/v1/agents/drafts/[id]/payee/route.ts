import { NextResponse } from "next/server";

import { linkWhopPayee } from "@/lib/drafts/service";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface Body {
  whopPayeeId?: string;
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Body must be JSON." },
      { status: 400 },
    );
  }
  // In stub mode (no real Whop yet) we mint a deterministic payee id when
  // the builder doesn't supply one. The real Whop link lands in Slice 5.
  const whopPayeeId =
    body.whopPayeeId || `payee_stub_${id.slice(0, 8)}`;
  const draft = await linkWhopPayee(id, whopPayeeId);
  if (!draft) {
    return NextResponse.json(
      { error: "not_found", message: `No draft with id ${id}.` },
      { status: 404 },
    );
  }
  return NextResponse.json(draft, { status: 200 });
}
