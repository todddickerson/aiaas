import Link from "next/link";

import { fmt, price } from "@/lib/format";
import type { Agent } from "@/lib/types";

export function FeaturedAgent({ agent }: { agent: Agent }) {
  return (
    <section
      data-testid="featured-agent"
      data-handle={agent.handle}
      className="mx-auto max-w-[1360px] px-4 pt-3 md:px-8"
    >
      <div
        className="relative grid min-h-[240px] overflow-hidden rounded-xl text-white md:grid-cols-[1.3fr_1fr]"
        style={{
          background: `linear-gradient(135deg, ${agent.swatch}, ${agent.swatch}aa)`,
        }}
      >
        <div className="relative p-7 md:p-8">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
            aria-hidden
          />
          <div className="relative">
            <div
              className="mb-2.5 text-[10px] font-semibold tracking-[1.5px] opacity-90"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              ★ EDITOR&apos;S PICK · AGENT OF THE WEEK
            </div>
            <h2
              className="m-0 text-4xl font-bold leading-none tracking-[-1px] md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {agent.name}
            </h2>
            <div
              className="mt-1 text-sm opacity-90"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {agent.handle} · {agent.persona}
            </div>
            <p
              className="mb-5 mt-4 max-w-[480px] text-[15px] leading-relaxed"
              style={{ textWrap: "pretty" }}
            >
              {agent.tagline}
            </p>
            <dl
              className="mb-5 flex flex-wrap gap-x-5 gap-y-3 text-[11px]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <FeatStat label="runs" value={fmt(agent.runs)} />
              <FeatStat
                label={`★ (${fmt(agent.reviews)})`}
                value={agent.rating}
              />
              <FeatStat label="SLA" value={agent.sla} />
              <FeatStat label="streak" value={`${agent.streak}d`} />
            </dl>
            <Link
              href={`/agents/${agent.handle.slice(1)}`}
              className="inline-flex rounded-md bg-white px-5 py-3 text-sm font-bold transition-transform hover:scale-[1.02]"
              style={{
                color: agent.swatch,
                fontFamily: "var(--font-body)",
              }}
            >
              Hire {agent.name} · from {price(agent.priceFrom)} →
            </Link>
          </div>
        </div>
        <div className="relative hidden items-center justify-center p-6 md:flex">
          <div className="max-w-[340px] rounded-lg border border-white/20 bg-black/20 p-5">
            <div
              className="mb-2.5 text-[10px] tracking-[1.2px] opacity-90"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              LATEST EXECUTION · 3s AGO
            </div>
            <div
              className="whitespace-pre-wrap text-[13px] leading-relaxed"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {agent.sample}
            </div>
            <div
              className="mt-3 text-[10px] opacity-70"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              delivered to @flint
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatStat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <span
        className="text-lg font-bold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </span>{" "}
      <span className="opacity-90">{label}</span>
    </div>
  );
}
