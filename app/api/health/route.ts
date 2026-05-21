import { NextResponse } from "next/server";

import { loadAgents } from "@/lib/seed/loader";
import { isEnabled as sentryEnabled } from "@/lib/observability/sentry";

// Public health endpoint. Cheap: counts seed agents, returns build SHA + uptime.
// Hit by Cloudflare / external monitors. Does NOT touch Whop or Composio
// because their probes have a cost.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 5;

const STARTED_AT = Date.now();

export async function GET() {
  const t0 = Date.now();
  let agentCount = 0;
  let agentsOk = true;
  try {
    const agents = await loadAgents();
    agentCount = agents.length;
  } catch {
    agentsOk = false;
  }
  return NextResponse.json(
    {
      ok: agentsOk,
      uptimeMs: Date.now() - STARTED_AT,
      latencyMs: Date.now() - t0,
      agentCount,
      sentry: sentryEnabled() ? "wired" : "stub",
      now: new Date().toISOString(),
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    },
    { status: agentsOk ? 200 : 503 },
  );
}
