import { NextResponse } from "next/server";

import { cancelSchedule, getSchedule } from "@/lib/schedules/service";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  const rec = await getSchedule(id);
  if (!rec) {
    return NextResponse.json(
      { error: "not_found", message: `No schedule ${id}.` },
      { status: 404 },
    );
  }
  return NextResponse.json(rec, { status: 200 });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  const rec = await cancelSchedule(id);
  if (!rec) {
    return NextResponse.json(
      { error: "not_found", message: `No schedule ${id}.` },
      { status: 404 },
    );
  }
  return NextResponse.json(rec, { status: 200 });
}
