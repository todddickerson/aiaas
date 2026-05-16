import Link from "next/link";

import {
  AvailabilityDot,
  TierChip,
  Verified,
} from "@/components/agents/primitives";
import { fmt, price } from "@/lib/format";
import type { Agent } from "@/lib/types";

export function CardEditorial({ agent }: { agent: Agent }) {
  const num = String(Math.abs((agent.id.charCodeAt(0) * 7) % 99)).padStart(2, "0");
  return (
    <Link
      href={`/agents/${agent.handle.slice(1)}`}
      data-testid="agent-card"
      data-variant="editorial"
      data-handle={agent.handle}
      data-category={agent.category}
      className="group flex min-h-[300px] flex-col overflow-hidden rounded-sm border border-border bg-card p-5 text-foreground transition-colors hover:border-foreground"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="text-[9.5px] uppercase tracking-[1.3px] text-muted-foreground"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          № {num} · {agent.category}
        </div>
        <TierChip tier={agent.tier} />
      </div>

      <div className="mt-3.5 mb-1.5 flex items-start gap-2">
        <h3
          className="m-0 flex-1 text-2xl font-normal leading-[1.08] tracking-[-0.5px] md:text-3xl"
          style={{
            fontFamily: "var(--font-display)",
            textWrap: "balance",
          }}
        >
          {agent.name}
        </h3>
        {agent.verified && (
          <span className="mt-1.5 flex-shrink-0">
            <Verified color="var(--accent)" size={13} />
          </span>
        )}
      </div>
      <div
        className="mb-3 text-[13.5px] italic leading-[1.35] text-muted-foreground"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {agent.persona}
      </div>

      <p
        className="m-0 mb-3.5 text-[13px] leading-relaxed text-foreground"
        style={{ textWrap: "pretty" }}
      >
        {agent.tagline}
      </p>

      <div className="mb-3 flex gap-3.5 border-t border-line-soft pt-3 text-[11px]">
        <Stat label="Runs" value={fmt(agent.runs)} />
        <Stat label="Rating" value={`${agent.rating} /5`} />
        <Stat label="SLA" value={agent.sla} />
      </div>

      <div className="mt-auto flex items-end justify-between gap-2.5">
        <div>
          <div
            className="text-[8.5px] uppercase tracking-[0.9px] text-text-faint"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            From
          </div>
          <div
            className="text-2xl leading-[1.1]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {price(agent.priceFrom)}
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 whitespace-nowrap text-[10.5px] text-muted-foreground"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <AvailabilityDot online={agent.online} size={7} />
          {agent.online ? `${agent.queue} in queue` : "offline"}
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ fontFamily: "var(--font-mono)" }}>
      <div className="text-[8.5px] uppercase tracking-[0.9px] text-text-faint">
        {label}
      </div>
      <div className="text-[13px] text-foreground">{value}</div>
    </div>
  );
}
