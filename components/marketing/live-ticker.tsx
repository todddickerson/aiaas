import { Pulse } from "@/components/agents/primitives";
import { AGENTS, LIVE_TICKER } from "@/lib/seed";

export function LiveTicker() {
  const items = [...LIVE_TICKER, ...LIVE_TICKER];
  return (
    <div
      className="overflow-hidden whitespace-nowrap border-b border-border bg-muted"
      aria-label="Recently delivered agent runs"
      data-testid="live-ticker"
    >
      <div
        className="inline-flex gap-0 py-2 motion-reduce:animate-none"
        style={{ animation: "aiaas-marquee 60s linear infinite" }}
      >
        {items.map((it, i) => {
          const agent = AGENTS.find((a) => a.id === it.agent);
          return (
            <span
              key={i}
              className="inline-flex items-center gap-2 border-r border-border px-6 text-[11px] text-muted-foreground"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <Pulse color={agent?.swatch ?? "var(--accent)"} size={6} />
              <span className="font-semibold text-foreground">{agent?.name}</span>
              <span>{it.action}</span>
              <span className="text-text-faint">· {it.user}</span>
              <span className="text-text-faint">· {it.time}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
