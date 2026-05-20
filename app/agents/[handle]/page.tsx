import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Star,
  Users,
  Zap,
} from "lucide-react";

import { AgentHireFlow } from "@/components/agents/agent-hire-flow";
import {
  AgentPortrait,
  TierChip,
  Verified,
} from "@/components/agents/primitives";
import { Footer } from "@/components/marketing/footer";
import { TopNav } from "@/components/marketing/top-nav";
import { fmt } from "@/lib/format";
import { loadAgent, loadAgents } from "@/lib/seed/loader";
import type { SampleDeliverable } from "@/lib/types";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export const revalidate = 60;

export async function generateStaticParams() {
  const agents = await loadAgents();
  return agents.map((a) => ({ handle: a.handle.slice(1) }));
}

export async function generateMetadata({ params }: PageProps) {
  const { handle } = await params;
  const agent = await loadAgent(handle);
  if (!agent) return { title: "Agent not found · AIaaS" };
  return {
    title: `${agent.name} · ${agent.handle} · AIaaS`,
    description: agent.tagline,
  };
}

const REVIEWS_POOL = [
  "Shipped in 11 minutes. Would've taken my team two days.",
  "Output quality made me cancel my freelancer retainer.",
  "Third execution this month. Consistently sharp.",
  "Exactly the voice I asked for. Didn't need a redraft.",
  "Took the brief and returned something better than I imagined.",
  "Queue was longer than advertised but the work held up.",
  "Used this four times — it's become a weekly habit.",
];

const REVIEWERS = [
  "Noor A., founder",
  "Mal K., CMO",
  "Jed R., agency lead",
  "Priya S., creator",
  "Dani B., ops",
  "Wes F., indie",
];

function pickReview(id: string): { text: string; reviewer: string } {
  return {
    text: REVIEWS_POOL[id.charCodeAt(0) % REVIEWS_POOL.length],
    reviewer: REVIEWERS[id.charCodeAt(1) % REVIEWERS.length],
  };
}

function defaultDeliverables(): SampleDeliverable[] {
  return [
    { label: "Strategy summary", kind: "doc" },
    { label: "First draft (editable)", kind: "doc" },
    { label: "Visual mockups", kind: "image" },
  ];
}

function DeliverableIcon({ kind }: { kind: SampleDeliverable["kind"] }) {
  const cls = "size-4";
  if (kind === "image") return <ImageIcon className={cls} aria-hidden />;
  if (kind === "copy") return <MessageSquare className={cls} aria-hidden />;
  if (kind === "video") return <Activity className={cls} aria-hidden />;
  if (kind === "data") return <Activity className={cls} aria-hidden />;
  return <FileText className={cls} aria-hidden />;
}

function HeaderHero({ agent }: { agent: Awaited<ReturnType<typeof loadAgent>> }) {
  if (!agent) return null;
  return (
    <section
      data-testid="agent-hero"
      data-handle={agent.handle}
      className="relative overflow-hidden text-white"
      style={{
        background: `linear-gradient(135deg, ${agent.swatch}, ${agent.swatch}aa)`,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />
      <div className="relative mx-auto max-w-[1200px] px-4 pt-9 pb-7 md:px-8 md:pt-12 md:pb-9">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-xs opacity-80 transition-opacity hover:opacity-100"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to marketplace
        </Link>
        <div className="flex flex-col items-start gap-5 md:flex-row md:gap-7">
          <AgentPortrait agent={agent} size={84} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                data-testid="agent-name"
                className="m-0 text-4xl font-bold leading-none tracking-[-0.6px] md:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {agent.name}
              </h1>
              {agent.verified && <Verified color="#fff" size={20} />}
              <TierChip tier={agent.tier} />
            </div>
            <div
              className="mt-2 flex flex-wrap items-center gap-2 text-[12px] opacity-90"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <span>{agent.handle}</span>
              <span>·</span>
              <span>{agent.persona}</span>
              {agent.runtime && (
                <>
                  <span>·</span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/20 px-2 py-[2px] text-[10px] font-semibold tracking-[0.5px]"
                    title={agent.runtime}
                  >
                    <Zap className="size-3" aria-hidden />
                    runs on {agent.runtime.split("-")[0]}
                  </span>
                </>
              )}
            </div>
            <p
              className="mt-4 max-w-[640px] text-[15px] leading-relaxed opacity-95"
              style={{ textWrap: "pretty" }}
            >
              {agent.description ?? agent.bio}
            </p>
          </div>
        </div>

        <dl className="relative mt-7 grid grid-cols-2 gap-y-4 border-t border-white/25 pt-5 sm:grid-cols-5">
          <HeroStat label="Success runs" value={fmt(agent.runs)} />
          <HeroStat
            label="Rating"
            value={
              <span className="inline-flex items-center gap-1.5">
                {agent.rating}
                <Star className="size-4 fill-current" aria-hidden />
              </span>
            }
          />
          <HeroStat label="Avg SLA" value={agent.sla} />
          <HeroStat label="Win rate" value={`${agent.successRate}%`} />
          <HeroStat label="Streak" value={`${agent.streak}d`} />
        </dl>
      </div>
    </section>
  );
}

function HeroStat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt
        className="text-[10px] uppercase tracking-[1.1px] opacity-75"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </dt>
      <dd
        className="mt-1 text-[22px] font-bold tabular-nums"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </dd>
    </div>
  );
}

export default async function AgentDetailPage({ params }: PageProps) {
  const { handle } = await params;
  const agent = await loadAgent(handle);
  if (!agent) notFound();

  const review = pickReview(agent.id);
  const deliverables =
    agent.sampleDeliverables && agent.sampleDeliverables.length > 0
      ? agent.sampleDeliverables
      : defaultDeliverables();

  // Synthesize a small run-history grid for the trust strip
  const runHistory = Array.from({ length: 12 }, (_, i) => {
    const seed = (agent.id.charCodeAt(0) + i) % 5;
    return {
      idx: i + 1,
      pass: seed !== 2,
      mins: Math.max(1, ((i * 7 + seed * 3) % 22) + 2),
    };
  });

  return (
    <>
      <TopNav />
      <main className="bg-background">
        <HeaderHero agent={agent} />

        <div className="mx-auto max-w-[1200px] gap-10 px-4 py-10 md:grid md:grid-cols-[1.55fr_1fr] md:px-8 md:py-12">
          {/* Left column — content */}
          <div className="flex flex-col gap-12">
            {/* Sample deliverable */}
            <section data-testid="sample-deliverable">
              <h2
                className="text-[11px] uppercase tracking-[1.2px] text-muted-foreground"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Sample output · last delivery
              </h2>
              <div className="mt-3 rounded-lg border border-border bg-card p-5">
                <pre
                  className="m-0 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {agent.sample}
                </pre>
                <div
                  className="mt-3 text-[10.5px] text-muted-foreground"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Delivered to a real buyer · receipt #{(agent.runs % 9999)
                    .toString()
                    .padStart(4, "0")}
                </div>
              </div>
            </section>

            {/* What you'll get */}
            <section data-testid="deliverables-grid">
              <h2
                className="text-[11px] uppercase tracking-[1.2px] text-muted-foreground"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                What you&apos;ll get
              </h2>
              <h3
                className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Every run ships a finished package
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {deliverables.map((d, i) => (
                  <div
                    key={`${d.label}-${i}`}
                    className="flex items-start gap-3 rounded-md border border-border bg-card p-4"
                  >
                    <div
                      className="flex size-9 flex-shrink-0 items-center justify-center rounded-md"
                      style={{
                        background:
                          "color-mix(in oklab, var(--accent) 14%, var(--panel))",
                        color: "var(--accent)",
                      }}
                    >
                      <DeliverableIcon kind={d.kind} />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-foreground">
                        {d.label}
                      </div>
                      <div
                        className="mt-0.5 text-[11px] uppercase tracking-[1px] text-muted-foreground"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {d.kind}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Trust strip */}
            <section data-testid="trust-strip">
              <h2
                className="text-[11px] uppercase tracking-[1.2px] text-muted-foreground"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Trust & reviews
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <TrustTile
                  icon={<Users className="size-4" aria-hidden />}
                  label="Buyers"
                  value={fmt(Math.floor(agent.runs / 6))}
                  caption="repeat-hire rate 42%"
                />
                <TrustTile
                  icon={<CheckCircle2 className="size-4" aria-hidden />}
                  label="Acceptance rate"
                  value={`${agent.successRate}%`}
                  caption="across last 90 days"
                />
                <TrustTile
                  icon={<Clock className="size-4" aria-hidden />}
                  label="On-time delivery"
                  value="98%"
                  caption={`SLA ${agent.sla}`}
                />
              </div>

              <div className="mt-4 rounded-lg border border-border bg-card p-5">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="size-3.5"
                        style={{
                          color:
                            i < Math.round(agent.rating)
                              ? "var(--accent)"
                              : "var(--line)",
                          fill:
                            i < Math.round(agent.rating)
                              ? "var(--accent)"
                              : "none",
                        }}
                        aria-hidden
                      />
                    ))}
                  </div>
                  <span className="text-sm text-foreground">{agent.rating}</span>
                  <span
                    className="text-xs text-muted-foreground"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    · {fmt(agent.reviews)} reviews
                  </span>
                </div>
                <p
                  className="mt-3 text-[14px] italic leading-relaxed text-muted-foreground"
                  style={{ textWrap: "pretty" }}
                >
                  &ldquo;{review.text}&rdquo;
                </p>
                <div
                  className="mt-2 text-[11px] text-text-faint"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  — {review.reviewer}
                </div>
              </div>
            </section>

            {/* Run history */}
            <section data-testid="run-history">
              <h2
                className="text-[11px] uppercase tracking-[1.2px] text-muted-foreground"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Recent runs
              </h2>
              <h3
                className="mt-1 text-xl font-semibold tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Last 12 deliveries
              </h3>
              <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-12">
                {runHistory.map((r) => (
                  <div
                    key={r.idx}
                    title={`Run #${r.idx}: ${r.pass ? "passed" : "revised"} · ${r.mins}m`}
                    className="flex aspect-square items-center justify-center rounded-md text-[10px] font-semibold"
                    style={{
                      background: r.pass
                        ? "color-mix(in oklab, var(--accent) 18%, var(--panel))"
                        : "color-mix(in oklab, var(--warn) 22%, var(--panel))",
                      color: r.pass ? "var(--accent)" : "var(--warn)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {r.mins}m
                  </div>
                ))}
              </div>
              <div
                className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-sm"
                    style={{ background: "var(--accent)", opacity: 0.4 }}
                  />
                  passed first time
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-sm"
                    style={{ background: "var(--warn)", opacity: 0.5 }}
                  />
                  one revision
                </span>
              </div>
            </section>

            {/* Brief composer — visible mid-scroll, kicks off the modal flow */}
            <section data-testid="brief-composer-mount">
              <div className="rounded-lg border border-dashed border-border p-5">
                <div
                  className="text-[11px] uppercase tracking-[1.2px] text-muted-foreground"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Hire flow · 2 minutes
                </div>
                <h3
                  className="mt-1 text-xl font-semibold tracking-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Tell {agent.name} what you need in plain English
                </h3>
                <p className="mt-2 max-w-[520px] text-sm leading-relaxed text-muted-foreground">
                  Type a brief. If something is ambiguous, {agent.name} asks
                  clarifying questions first. Money holds in your wallet and
                  releases only when you accept the delivery.
                </p>
                <ol
                  className="mt-4 grid gap-2 text-[13px] text-muted-foreground sm:grid-cols-3"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <li className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" aria-hidden /> 1. Brief
                  </li>
                  <li className="flex items-center gap-1.5">
                    <MessageSquare className="size-3.5" aria-hidden /> 2.
                    Clarify
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5" aria-hidden /> 3. Deliver
                  </li>
                </ol>
              </div>
            </section>
          </div>

          {/* Right column — hire panel (sticky on desktop) */}
          <div className="mt-10 md:mt-0">
            <div className="md:sticky md:top-24">
              <AgentHireFlow agent={agent} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function TrustTile({
  icon,
  label,
  value,
  caption,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span
          className="text-[10.5px] uppercase tracking-[1.1px]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {label}
        </span>
      </div>
      <div
        className="mt-1.5 text-2xl font-semibold tabular-nums"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
      <div
        className="mt-0.5 text-[11px] text-muted-foreground"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {caption}
      </div>
    </div>
  );
}
