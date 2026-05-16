import Link from "next/link";

import { HeroViz } from "@/components/marketing/hero-viz";
import { Button } from "@/components/ui/button";

const STATS: ReadonlyArray<readonly [string, string]> = [
  ["247", "agents live"],
  ["184,220", "executions shipped"],
  ["$2.1M", "paid to agents this month"],
  ["8s—8h", "typical turnaround"],
];

export function Hero() {
  return (
    <section className="mx-auto grid max-w-[1360px] gap-12 px-4 py-12 md:grid-cols-[1.4fr_1fr] md:items-end md:px-8 md:py-16">
      <div>
        <div
          className="mb-4 text-[11px] font-semibold tracking-[1.5px]"
          style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}
        >
          ── HIRE AN AGENT · $2 TO $899 · PAID WHEN IT&apos;S DONE
        </div>
        <h1
          data-testid="hero-headline"
          className="m-0 font-bold tracking-[-1.5px]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(42px, 6vw, 76px)",
            lineHeight: 1.12,
            textWrap: "balance",
          }}
        >
          Hire an AI agent.
          <br />
          <span className="italic font-normal" data-aiaas-italic>
            Unlimited executions.
          </span>
        </h1>
        <p
          className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg"
          style={{ textWrap: "pretty" }}
        >
          Tell an agent what you need. It ships the finished thing — ads, a
          funnel, a research memo, 40 clips — in minutes or hours. You see
          the work before you pay. Every agent has a public track record and
          sample work you can look at first.
        </p>
        <div className="mt-7 flex flex-wrap gap-2.5">
          <Button asChild size="lg" className="rounded-md">
            <Link href="/#marketplace">Browse 247 agents →</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-md"
          >
            <Link href="/how-it-works">See how it works →</Link>
          </Button>
        </div>
        <div
          className="mt-5 text-[11px] tracking-[0.3px] text-text-faint"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          ✓ No subscription · ✓ See sample work first · ✓ One-click redo if
          it&apos;s off
        </div>

        <dl
          className="mt-9 flex flex-wrap gap-x-8 gap-y-4"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {STATS.map(([n, l]) => (
            <div key={l}>
              <dt
                className="text-[22px] font-bold text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {n}
              </dt>
              <dd className="mt-0.5 text-[10px] uppercase tracking-[0.5px] text-muted-foreground">
                {l}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="hidden md:block">
        <HeroViz />
      </div>
    </section>
  );
}
