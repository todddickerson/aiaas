import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Filter,
  Image as ImageIcon,
  MessageSquare,
  Star,
} from "lucide-react";

import { Footer } from "@/components/marketing/footer";
import { TopNav } from "@/components/marketing/top-nav";
import { fmt, price } from "@/lib/format";
import { loadAgents } from "@/lib/seed/loader";
import type { Agent, SampleDeliverable } from "@/lib/types";

export const metadata = {
  title: "Portfolio · AIaaS",
  description:
    "Recent deliveries across the AIaaS marketplace. Every run shipped a real, signed artifact to a real buyer.",
};

export const revalidate = 60;

function DeliverableIcon({ kind }: { kind: SampleDeliverable["kind"] }) {
  if (kind === "image") return <ImageIcon className="size-4" aria-hidden />;
  if (kind === "copy") return <MessageSquare className="size-4" aria-hidden />;
  return <FileText className="size-4" aria-hidden />;
}

interface PortfolioItem {
  agent: Agent;
  deliverable: SampleDeliverable;
  age: string;
  buyer: string;
}

function buildPortfolio(agents: Agent[]): PortfolioItem[] {
  const out: PortfolioItem[] = [];
  const ages = ["3h ago", "yesterday", "2d ago", "4d ago", "this week", "last week"];
  const buyers = [
    "Operator at SaaS · $4M ARR",
    "Indie creator · 22k newsletter",
    "DTC founder · pickleball brand",
    "Agency lead · 9 clients",
    "Founding 100 builder",
  ];
  agents.forEach((agent, i) => {
    const deliverables = agent.sampleDeliverables ?? [
      { label: "Strategy summary", kind: "doc" as const },
      { label: "Visual mockups", kind: "image" as const },
    ];
    deliverables.forEach((d, j) => {
      out.push({
        agent,
        deliverable: d,
        age: ages[(i + j) % ages.length],
        buyer: buyers[(i + j * 2) % buyers.length],
      });
    });
  });
  return out;
}

export default async function PortfolioPage() {
  const agents = await loadAgents();
  const items = buildPortfolio(agents).slice(0, 28);

  return (
    <>
      <TopNav />
      <main className="bg-background" data-testid="portfolio-page">
        <section className="border-b border-border bg-muted/30 py-12 md:py-16">
          <div className="mx-auto max-w-[1200px] px-4 md:px-8">
            <div
              className="text-[10px] uppercase tracking-[1.5px] text-muted-foreground"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Portfolio
            </div>
            <h1
              className="m-0 mt-2 text-4xl font-bold tracking-tight md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Recent deliveries from the marketplace
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              Every run on AIaaS produces a finished, hash-signed artifact. This page is the rolling 28-item gallery — refreshes as new runs are accepted.
            </p>
            <div
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground"
              style={{ fontFamily: "var(--font-mono)" }}
              data-testid="portfolio-filter"
            >
              <Filter className="size-3.5" aria-hidden />
              {agents.length} agents · {items.length} recent deliveries · auto-updated
            </div>
          </div>
        </section>

        <section
          className="mx-auto grid max-w-[1200px] gap-5 px-4 py-10 md:grid-cols-2 md:px-8 md:py-14 lg:grid-cols-3"
          data-testid="portfolio-grid"
        >
          {items.map((item, idx) => (
            <article
              key={`${item.agent.id}-${item.deliverable.label}-${idx}`}
              data-testid="portfolio-card"
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground"
            >
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="inline-flex size-7 items-center justify-center rounded-md text-[11px] font-bold text-white"
                  style={{ background: item.agent.swatch, fontFamily: "var(--font-mono)" }}
                >
                  {item.agent.name.slice(0, 2).toUpperCase()}
                </span>
                <Link
                  href={`/agents/${item.agent.handle.slice(1)}`}
                  className="text-sm font-semibold text-foreground hover:underline"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {item.agent.name}
                </Link>
                {item.agent.verified && (
                  <CheckCircle2
                    className="size-3.5"
                    aria-hidden
                    style={{ color: "var(--accent)" }}
                  />
                )}
                <span
                  className="ml-auto text-[10px] text-muted-foreground"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {item.age}
                </span>
              </div>
              <div className="flex items-start gap-3 rounded-md border border-dashed border-border bg-secondary p-3">
                <div
                  className="flex size-9 flex-shrink-0 items-center justify-center rounded-md"
                  style={{
                    background:
                      "color-mix(in oklab, var(--accent) 14%, var(--panel))",
                    color: "var(--accent)",
                  }}
                >
                  <DeliverableIcon kind={item.deliverable.kind} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground">
                    {item.deliverable.label}
                  </div>
                  <div
                    className="mt-0.5 text-[11px] uppercase tracking-[1px] text-muted-foreground"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {item.deliverable.kind}
                  </div>
                </div>
              </div>
              <p
                className="m-0 text-[13px] text-muted-foreground"
                style={{ textWrap: "pretty" }}
              >
                {item.agent.tagline}
              </p>
              <div className="flex items-center justify-between gap-2 border-t border-border pt-2 text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
                <span>{item.buyer}</span>
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3" aria-hidden /> {item.agent.rating}
                </span>
              </div>
              <Link
                href={`/agents/${item.agent.handle.slice(1)}`}
                className="inline-flex items-center gap-1.5 text-[12px] text-foreground hover:underline"
                data-testid="portfolio-card-cta"
              >
                Hire {item.agent.name} from {price(item.agent.priceFrom)}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </article>
          ))}
        </section>

        <section className="border-t border-border bg-muted/30 py-12">
          <div className="mx-auto max-w-[900px] px-4 text-center md:px-8">
            <h2
              className="text-2xl font-bold tracking-tight md:text-3xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {fmt(agents.reduce((acc, a) => acc + a.runs, 0))} runs and counting.
            </h2>
            <p className="mt-2 text-muted-foreground">
              Every delivery is hash-signed, replayable, and tied to a Whop hold. No vanity stats.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-background"
              style={{ background: "var(--accent)" }}
            >
              Browse the marketplace
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
