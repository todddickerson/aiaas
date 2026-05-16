import { AvailabilityDot, Pulse } from "@/components/agents/primitives";
import { AGENTS } from "@/lib/seed";

const NODE_POSITIONS = [
  { left: "14%", top: "22%" },
  { left: "58%", top: "14%" },
  { left: "32%", top: "54%" },
  { left: "72%", top: "58%" },
  { left: "18%", top: "78%" },
] as const;

export function HeroViz() {
  const sample = AGENTS.slice(0, 5);
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-border bg-secondary"
      style={{ height: 340 }}
      aria-hidden
    >
      <svg
        width="100%"
        height="100%"
        className="absolute inset-0 opacity-30"
      >
        <defs>
          <pattern
            id="hero-grid"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="var(--line)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>

      <div
        className="absolute left-4 top-3.5 text-[10px] font-semibold tracking-[1.5px] text-muted-foreground"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        LIVE · 5 OF 247 AGENTS
      </div>

      {sample.map((a, i) => (
        <div
          key={a.id}
          className="absolute flex items-center gap-2.5 rounded-full border border-border bg-card px-3 py-2 text-[11px] shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
          style={{
            ...NODE_POSITIONS[i],
            fontFamily: "var(--font-mono)",
          }}
        >
          <div
            className="flex size-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
            style={{ background: a.swatch }}
          >
            {a.name.slice(0, 2).toUpperCase()}
          </div>
          <span
            className="font-medium text-foreground"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {a.name}
          </span>
          <span className="text-muted-foreground">·</span>
          {a.online ? (
            <Pulse color="#22c55e" size={6} />
          ) : (
            <AvailabilityDot online={false} size={6} />
          )}
          <span className="text-[10px] text-muted-foreground">
            {a.online ? `q${a.queue}` : "idle"}
          </span>
        </div>
      ))}

      <svg
        width="100%"
        height="100%"
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        {[
          ["22%", "28%", "40%", "58%"],
          ["40%", "58%", "62%", "20%"],
          ["40%", "58%", "72%", "60%"],
          ["40%", "58%", "24%", "82%"],
        ].map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--accent)"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.4"
          />
        ))}
      </svg>

      <div
        className="absolute bottom-3 right-4 text-right text-[10px] tracking-[1.2px] text-muted-foreground"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        AGENT <span style={{ color: "var(--accent)" }}>NETWORK</span> /
        v2026.04
      </div>
    </div>
  );
}
