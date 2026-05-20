import { NextResponse } from "next/server";

import {
  appendRunEvent,
  listRunEvents,
  subscribeToRunEvents,
  type RunEvent,
} from "@/lib/runs/events";
import { getRun } from "@/lib/runs/service";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface AppendBody {
  kind?: string;
  payload?: Record<string, unknown>;
}

/**
 * GET — initial backlog + Server-Sent Events stream.
 *
 *   ?backlog=only → return the full event history as JSON (no streaming)
 *   default       → SSE: replay backlog, then live-fanout new events
 */
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const mode = url.searchParams.get("backlog");

  // Hard-check that the run exists. SSE returns 404 if not — clients won't
  // hang forever on a typo.
  const run = await getRun(id);
  if (!run) {
    return NextResponse.json(
      { error: "not_found", message: `No run with id ${id}.` },
      { status: 404 },
    );
  }

  const backlog = await listRunEvents(id);
  if (mode === "only") {
    return NextResponse.json({ runId: id, events: backlog }, { status: 200 });
  }

  // Terminal states never produce new events — send the backlog as one SSE
  // payload, then close.
  const terminalStates = new Set([
    "accepted",
    "rejected_by_buyer",
    "failed",
    "cancelled",
    "expired",
  ]);
  const isTerminal = terminalStates.has(run.status);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (event: RunEvent) => {
        const payload = `event: run_event\ndata: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      // Initial backlog.
      controller.enqueue(
        encoder.encode(`event: backlog\ndata: ${JSON.stringify({ count: backlog.length })}\n\n`),
      );
      for (const event of backlog) send(event);

      if (isTerminal) {
        controller.enqueue(
          encoder.encode(`event: done\ndata: ${JSON.stringify({ status: run.status })}\n\n`),
        );
        controller.close();
        return;
      }

      // Live fanout. Subscribe, send a keepalive every 15s, close on abort.
      const unsubscribe = subscribeToRunEvents(id, (event) => {
        try {
          send(event);
          if (event.kind === "delivered" || event.kind === "failed" || event.kind === "accepted") {
            controller.enqueue(
              encoder.encode(`event: done\ndata: ${JSON.stringify({ status: event.kind })}\n\n`),
            );
            try {
              controller.close();
            } catch {
              // already closed
            }
            unsubscribe();
            clearInterval(keepalive);
          }
        } catch {
          // controller already closed
        }
      });

      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepalive);
        }
      }, 15_000);

      request.signal.addEventListener("abort", () => {
        clearInterval(keepalive);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
      connection: "keep-alive",
    },
  });
}

/**
 * POST — external runtimes push trace events here. Idempotent on (run_id,
 * kind, payload) only by accident; callers wanting strict idempotency should
 * dedupe upstream.
 */
export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  let body: AppendBody;
  try {
    body = (await request.json()) as AppendBody;
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Body must be JSON." },
      { status: 400 },
    );
  }
  if (!body.kind || typeof body.kind !== "string") {
    return NextResponse.json(
      { error: "missing_kind", message: "kind is required." },
      { status: 400 },
    );
  }

  const run = await getRun(id);
  if (!run) {
    return NextResponse.json(
      { error: "not_found", message: `No run with id ${id}.` },
      { status: 404 },
    );
  }

  const event = await appendRunEvent({
    runId: id,
    kind: body.kind,
    payload: body.payload,
  });
  return NextResponse.json(event, { status: 200 });
}
