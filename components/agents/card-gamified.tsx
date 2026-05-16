import Link from "next/link";

import {
  AgentPortrait,
  AvailabilityDot,
  Pulse,
} from "@/components/agents/primitives";
import { TIERS, fmt, price } from "@/lib/format";
import type { Agent } from "@/lib/types";

export function CardGamified({ agent }: { agent: Agent }) {
  const tier = TIERS[agent.tier];
  const xpPercent = (agent.runs % 1000) / 10;
  const nextTier = 1000 - (agent.runs % 1000);
  const level = (Math.floor(agent.runs / 100) % 99) + 1;
  return (
    <Link
      href={`/agents/${agent.handle.slice(1)}`}
      data-testid="agent-card"
      data-variant="gamified"
      data-handle={agent.handle}
      data-category={agent.category}
      className="group block overflow-hidden rounded-2xl border-2 border-border bg-card text-foreground transition-all duration-150 hover:-translate-y-[3px]"
      style={{
        fontFamily: "var(--font-body)",
      }}
    >
      <div
        className="relative overflow-hidden px-5 pb-5 pt-5 text-white"
        style={{
          background: `linear-gradient(135deg, ${agent.swatch}, ${agent.swatch}cc)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
            backgroundSize: "8px 8px",
          }}
          aria-hidden
        />
        <div className="relative flex items-start gap-3">
          <AgentPortrait agent={agent} size={48} />
          <div className="flex-1">
            <div
              className="text-lg font-bold tracking-[-0.3px]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {agent.name}
            </div>
            <div
              className="text-[10px] tracking-[0.5px] opacity-90"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {agent.handle}
            </div>
          </div>
          <div className="text-right">
            <div
              className="text-xl font-extrabold leading-none"
              style={{ fontFamily: "var(--font-display)" }}
            >
              LVL {level}
            </div>
            <div
              className="mt-0.5 text-[9px] tracking-[1px] opacity-85"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {tier.label.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="relative mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <div
            className="mt-1 flex justify-between text-[9px] tracking-[0.5px] opacity-85"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span>XP · {fmt(agent.runs)} runs</span>
            <span>next tier: {nextTier} to go</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <p className="m-0 mb-3.5 text-[13.5px] leading-snug text-foreground">
          {agent.tagline}
        </p>

        <div className="mb-3.5 grid grid-cols-3 gap-2">
          <StatBox label="⚡ Streak" value={`${agent.streak}d`} />
          <StatBox label="★ Rating" value={agent.rating} />
          <StatBox label="✓ Win%" value={agent.successRate} />
        </div>

        <div className="flex items-center justify-between gap-2.5">
          <div
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {agent.online ? (
              <Pulse color="#22c55e" size={8} />
            ) : (
              <AvailabilityDot online={false} size={8} />
            )}
            <span>
              {agent.online
                ? `queue ${agent.queue} · ${agent.etaMins}m`
                : "offline"}
            </span>
          </div>
          <div
            className="rounded-full px-3.5 py-2 text-[13px] font-bold text-white"
            style={{
              background: agent.swatch,
              boxShadow: `0 4px 0 ${agent.swatch}88`,
              fontFamily: "var(--font-display)",
            }}
          >
            Hire · from {price(agent.priceFrom)}
          </div>
        </div>
      </div>
    </Link>
  );
}

function StatBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-md border border-line-soft bg-secondary px-2.5 py-2">
      <div className="text-[9px] font-semibold uppercase tracking-[0.8px] text-muted-foreground">
        {label}
      </div>
      <div
        className="text-base font-bold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
    </div>
  );
}
