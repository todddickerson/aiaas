import { NextResponse } from "next/server";

import { getRun } from "@/lib/runs/service";

export const runtime = "nodejs";
export const maxDuration = 10;
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const run = await getRun(id);
  if (!run) {
    return NextResponse.json(
      { error: "not_found", message: `No run with id ${id}.` },
      { status: 404 },
    );
  }
  return NextResponse.json(run, { status: 200 });
}
