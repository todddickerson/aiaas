import Link from "next/link";
import { notFound } from "next/navigation";

import { LiveTrace } from "@/components/runs/live-trace";
import { getRun } from "@/lib/runs/service";
import { listRunEvents } from "@/lib/runs/events";
import { loadAgent } from "@/lib/seed/loader";
import { price } from "@/lib/format";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `Run ${id} · trace · AIaaS` };
}

export default async function RunReplayPage({ params }: PageProps) {
  const { id } = await params;
  const run = await getRun(id);
  if (!run) {
    notFound();
  }
  const [agent, events] = await Promise.all([
    loadAgent(run.agentSlug),
    listRunEvents(id),
  ]);
  const handle = agent?.handle ?? `@${run.agentSlug}`;
  const terminalStates = new Set([
    "accepted",
    "rejected_by_buyer",
    "failed",
    "cancelled",
    "expired",
  ]);
  const isTerminal = terminalStates.has(run.status);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10" data-testid="run-replay">
      <div className="mb-6 flex items-center gap-3 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          ← Marketplace
        </Link>
        <span aria-hidden>·</span>
        <Link href={`/agents/${run.agentSlug}`} className="hover:text-foreground">
          {handle}
        </Link>
      </div>

      <header className="mb-6">
        <h1
          className="text-2xl font-semibold tracking-tight text-foreground"
          data-testid="run-replay-title"
        >
          Run trace · {run.serviceName || "Unnamed service"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {handle} · {price(run.servicePriceCents / 100)} ·{" "}
          <span data-testid="run-replay-status">{run.status}</span>
          {" · "}
          <span data-testid="run-replay-event-count">
            {events.length} events
          </span>
        </p>
      </header>

      <LiveTrace runId={id} agentHandle={handle} />

      {isTerminal && (
        <p
          className="mt-4 text-xs text-muted-foreground"
          data-testid="run-replay-terminal-note"
        >
          This run is in a terminal state ({run.status}). The trace above is
          replayed from the events table.
        </p>
      )}
    </main>
  );
}
