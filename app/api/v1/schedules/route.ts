import { NextResponse } from "next/server";

import {
  createSchedule,
  listSchedules,
  type Cadence,
} from "@/lib/schedules/service";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

interface CreateBody {
  userId?: string;
  agentSlug?: string;
  cadence?: Cadence;
  serviceName?: string;
  servicePriceCents?: number;
  briefTemplate?: string;
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
  const rows = await listSchedules(userId);
  return NextResponse.json({ schedules: rows }, { status: 200 });
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
    !body.agentSlug && "agentSlug",
    !body.cadence && "cadence",
    !body.serviceName && "serviceName",
    !body.servicePriceCents && "servicePriceCents",
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
  if (!["daily", "weekly", "monthly"].includes(body.cadence!)) {
    return NextResponse.json(
      {
        error: "invalid_cadence",
        message: "cadence must be daily, weekly, or monthly.",
      },
      { status: 400 },
    );
  }
  const rec = await createSchedule({
    userId: body.userId!,
    agentSlug: body.agentSlug!,
    cadence: body.cadence!,
    serviceName: body.serviceName!,
    servicePriceCents: body.servicePriceCents!,
    briefTemplate: body.briefTemplate!,
  });
  return NextResponse.json(rec, { status: 200 });
}
