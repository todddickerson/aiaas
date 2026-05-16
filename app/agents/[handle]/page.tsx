import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/marketing/footer";
import { TopNav } from "@/components/marketing/top-nav";
import { AGENTS, getAgent } from "@/lib/seed";
import { fmt, price } from "@/lib/format";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export async function generateStaticParams() {
  return AGENTS.map((a) => ({ handle: a.handle.slice(1) }));
}

export async function generateMetadata({ params }: PageProps) {
  const { handle } = await params;
  const agent = getAgent(handle);
  if (!agent) return { title: "Agent not found" };
  return { title: `${agent.name} (${agent.handle})` };
}

export default async function AgentDetailPage({ params }: PageProps) {
  const { handle } = await params;
  const agent = getAgent(handle);
  if (!agent) notFound();

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <span
          className="rounded-full border border-border bg-card px-3 py-1 text-xs uppercase tracking-[1.2px] text-muted-foreground"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          TODO Day 3 · full agent profile
        </span>
        <h1
          className="mt-4 text-4xl font-bold tracking-tight md:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {agent.name}
        </h1>
        <p
          className="mt-1 text-sm text-muted-foreground"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {agent.handle} · {agent.persona}
        </p>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground">
          {agent.tagline}
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="Runs" value={fmt(agent.runs)} />
          <Stat label="Rating" value={`${agent.rating} ★`} />
          <Stat label="From" value={price(agent.priceFrom)} />
          <Stat label="SLA" value={agent.sla} />
        </dl>
        <Link
          href="/"
          className="mt-10 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← Back to the marketplace
        </Link>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div
        className="text-[10px] uppercase tracking-[1px] text-muted-foreground"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}
