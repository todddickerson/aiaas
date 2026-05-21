import { NextResponse } from "next/server";

import { fireSchedule } from "@/lib/schedules/service";

// This is the endpoint a Vercel Cron (or any external scheduler) hits to
// fire a scheduled run. The cron config lives in vercel.json; in tests +
// local dev anyone can POST it for the same effect.
export const runtime = "nodejs";
export const maxDuration = 800;
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const run = await fireSchedule(id);
    return NextResponse.json({ scheduleId: id, run }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Fire failed.";
    if (msg.startsWith("Unknown schedule")) {
      return NextResponse.json(
        { error: "not_found", message: msg },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "fire_failed", message: msg },
      { status: 400 },
    );
  }
}
