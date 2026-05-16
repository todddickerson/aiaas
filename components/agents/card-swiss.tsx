import Link from "next/link";

import { AvailabilityDot } from "@/components/agents/primitives";
import { TIERS, fmt, price } from "@/lib/format";
import type { Agent } from "@/lib/types";

export function CardSwiss({ agent }: { agent: Agent }) {
  const num = String(Math.abs((agent.id.charCodeAt(0) * 11) % 999)).padStart(
    3,
    "0",
  );
  return (
    <Link
      href={`/agents/${agent.handle.slice(1)}`}
      data-testid="agent-card"
      data-variant="swiss"
      data-handle={agent.handle}
      data-category={agent.category}
      className="block border border-border bg-card p-5 text-foreground transition-colors hover:bg-secondary"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <div className="grid grid-cols-12 items-start gap-2.5">
        <div className="col-span-8">
          <div
            className="mb-1 text-[10px] tracking-[1px] text-muted-foreground"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {num} / {agent.category.toUpperCase()}
          </div>
          <div className="text-2xl font-semibold leading-[1.05] tracking-[-0.5px] md:text-[28px]">
            {agent.name}
          </div>
        </div>
        <div
          className="col-span-4 text-right text-[10px] leading-relaxed text-muted-foreground"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <div>{agent.handle}</div>
          <div className="mt-1 text-foreground">
            ★ {agent.rating} · {fmt(agent.runs)}
          </div>
        </div>
      </div>

      <div className="my-3.5 h-px bg-border" />

      <div className="grid grid-cols-12 gap-2.5">
        <p
          className="col-span-8 m-0 text-[13.5px] leading-relaxed"
          style={{ textWrap: "pretty" }}
        >
          {agent.tagline}
        </p>
        <div
          className="col-span-4 text-right text-[10px] leading-relaxed text-muted-foreground"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <div>from {price(agent.priceFrom)}</div>
          <div>to {price(agent.priceMax)}</div>
          <div className="mt-1 text-foreground">SLA {agent.sla}</div>
        </div>
      </div>

      <div className="my-3.5 h-px bg-line-soft" />

      <div
        className="grid grid-cols-4 gap-2.5 text-[10px]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <SwissStat label="QUEUE" value={agent.queue} />
        <SwissStat label="ETA" value={`${agent.etaMins}m`} />
        <SwissStat label="WIN%" value={agent.successRate.toFixed(1)} />
        <SwissStat label="TIER" value={TIERS[agent.tier].label.toUpperCase()} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div
          className="flex items-center gap-2 text-[10.5px] text-muted-foreground"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <AvailabilityDot online={agent.online} size={7} />
          {agent.online ? "available" : "resting"}
        </div>
        <div className="border-b border-foreground pb-0.5 text-xs text-foreground">
          Hire →
        </div>
      </div>
    </Link>
  );
}

function SwissStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <div className="text-[9px] tracking-[1px] text-text-faint">{label}</div>
      <div
        className="text-[13px] font-medium text-foreground"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {value}
      </div>
    </div>
  );
}
