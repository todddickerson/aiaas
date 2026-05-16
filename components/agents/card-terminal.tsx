import Link from "next/link";

import { TIERS, fmt, price } from "@/lib/format";
import type { Agent } from "@/lib/types";

export function CardTerminal({ agent }: { agent: Agent }) {
  return (
    <Link
      href={`/agents/${agent.handle.slice(1)}`}
      data-testid="agent-card"
      data-variant="terminal"
      data-handle={agent.handle}
      data-category={agent.category}
      className="group relative block overflow-hidden rounded-[2px] border border-border bg-card p-4 text-foreground transition-all dark:bg-[#0E0E13]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <div
        className="absolute inset-x-0 top-0 flex items-center gap-1.5 border-b px-3 text-[10px] font-semibold uppercase tracking-[1.2px]"
        style={{
          height: 24,
          borderColor: `${agent.swatch}44`,
          color: agent.swatch,
          background: `linear-gradient(90deg, ${agent.swatch}22, transparent 60%)`,
        }}
      >
        <span
          className="size-1.5 rounded-full"
          style={{ background: agent.swatch }}
          aria-hidden
        />
        agent://{agent.handle.slice(1)}
        <span className="ml-auto text-muted-foreground">
          {agent.online ? "STATUS: ONLINE" : "STATUS: IDLE"}
        </span>
      </div>

      <div className="mt-6">
        <div className="text-[10px] tracking-[1px] text-muted-foreground">
          &gt; whoami
        </div>
        <div className="mt-1 text-lg font-bold leading-tight tracking-[-0.5px] text-foreground md:text-xl">
          {agent.name.toLowerCase().replace(/\s+/g, "-")}
        </div>
        <div className="text-[11px]" style={{ color: agent.swatch }}>
          {`// ${agent.persona}`}
        </div>
      </div>

      <div
        className="my-3 border-l-2 px-3 py-2.5 text-[11px] leading-relaxed text-foreground dark:bg-[#060609]"
        style={{
          borderColor: agent.swatch,
          background: "color-mix(in oklab, var(--panel-soft) 70%, transparent)",
        }}
      >
        {agent.tagline}
      </div>

      <div className="grid grid-cols-2 gap-x-4 text-[11px] leading-[1.6]">
        <Row k="runs" v={fmt(agent.runs)} />
        <Row k="queue" v={agent.queue} />
        <Row k="rating" v={`${agent.rating}/5`} />
        <Row k="sla" v={agent.sla} />
        <Row
          k="tier"
          v={
            <span style={{ color: TIERS[agent.tier].fg }}>
              {TIERS[agent.tier].label.toUpperCase()}
            </span>
          }
        />
        <Row k="streak" v={`${agent.streak}d`} />
      </div>

      <div className="mt-3.5 flex items-center justify-between border-t border-dashed border-border pt-3 text-[11px]">
        <div className="text-muted-foreground">
          &gt; price{" "}
          <span className="text-foreground">
            {price(agent.priceFrom)}..{price(agent.priceMax)}
          </span>
        </div>
        <div
          className="border px-2.5 py-1 text-[11px] font-bold tracking-[1px]"
          style={{ borderColor: agent.swatch, color: agent.swatch }}
        >
          ./hire <span className="opacity-50">_</span>
        </div>
      </div>
    </Link>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <span className="text-muted-foreground">{k}</span>{" "}
      <span className="float-right">{v}</span>
    </div>
  );
}
