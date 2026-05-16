// Small visual primitives reused by AgentCard variants + the marketing shell.
// Ported from docs/handoff/prototype/theme.jsx (AvailabilityDot, Pulse, TierChip,
// Stars, Verified, Spark, AgentPortrait).

import { TIERS, type TierInfo } from "@/lib/format";
import type { Agent, Tier } from "@/lib/types";

export function AvailabilityDot({
  online,
  size = 8,
}: {
  online: boolean;
  size?: number;
}) {
  const color = online ? "#22c55e" : "#d4a017";
  const shadow = online ? "rgba(34,197,94,0.18)" : "rgba(212,160,23,0.2)";
  return (
    <span
      aria-hidden
      className="inline-block flex-shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: `0 0 0 3px ${shadow}`,
      }}
    />
  );
}

export function Pulse({
  color = "#22c55e",
  size = 10,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      className="relative inline-block flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: color,
          opacity: 0.35,
          animation: "aiaas-pulse 1.8s ease-out infinite",
        }}
      />
      <span
        className="absolute rounded-full"
        style={{ inset: 2, background: color }}
      />
    </span>
  );
}

export function TierChip({ tier }: { tier: Tier }) {
  const t: TierInfo = TIERS[tier];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.8px]"
      style={{ background: t.bg, color: t.fg }}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
        <polygon points="4,0 8,4 4,8 0,4" fill={t.fg} />
      </svg>
      {t.label}
    </span>
  );
}

export function Verified({
  color = "var(--accent)",
  size = 12,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ flexShrink: 0 }}
      aria-hidden
    >
      <path
        d="M8 1l1.8 1.4 2.3-.2.6 2.2 2 1.2-.9 2.1.9 2.1-2 1.2-.6 2.2-2.3-.2L8 15l-1.8-1.4-2.3.2-.6-2.2-2-1.2.9-2.1L1.3 6l2-1.2.6-2.2 2.3.2L8 1z"
        fill={color}
      />
      <path
        d="M5.5 8l1.7 1.7 3.3-3.4"
        stroke="#fff"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Spark({
  data,
  color = "currentColor",
  width = 80,
  height = 24,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width={width}
      height={height}
      style={{ display: "block" }}
      aria-hidden
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AgentPortrait({
  agent,
  size = 44,
}: {
  agent: Agent;
  size?: number;
}) {
  const seed =
    agent.id.charCodeAt(0) +
    agent.id.charCodeAt(Math.min(1, agent.id.length - 1));
  const kind = seed % 4;
  const fg = "#ffffff";
  return (
    <div
      className="relative flex flex-shrink-0 items-center justify-center overflow-hidden rounded-md"
      style={{ width: size, height: size, background: agent.swatch }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 44 44"
        className="absolute inset-0"
        aria-hidden
      >
        {kind === 0 && (
          <>
            <circle
              cx="22"
              cy="22"
              r="14"
              fill="none"
              stroke={fg}
              strokeOpacity="0.5"
              strokeWidth="1"
            />
            <circle cx="22" cy="22" r="6" fill={fg} />
          </>
        )}
        {kind === 1 && (
          <>
            <rect
              x="8"
              y="8"
              width="28"
              height="28"
              fill="none"
              stroke={fg}
              strokeOpacity="0.35"
              strokeWidth="1"
            />
            <rect x="14" y="14" width="16" height="16" fill={fg} />
          </>
        )}
        {kind === 2 && (
          <>
            <polygon
              points="22,6 38,22 22,38 6,22"
              fill="none"
              stroke={fg}
              strokeOpacity="0.4"
              strokeWidth="1"
            />
            <polygon points="22,14 30,22 22,30 14,22" fill={fg} />
          </>
        )}
        {kind === 3 && (
          <>
            <path
              d="M6 22 Q22 6 38 22 Q22 38 6 22 Z"
              fill="none"
              stroke={fg}
              strokeOpacity="0.35"
              strokeWidth="1"
            />
            <circle cx="22" cy="22" r="5" fill={fg} />
          </>
        )}
      </svg>
      <span
        className="absolute font-mono opacity-90"
        style={{
          right: 3,
          bottom: 3,
          fontSize: Math.max(8, size * 0.18),
          color: fg,
          letterSpacing: 0.5,
        }}
      >
        {agent.name.slice(0, 2).toUpperCase()}
      </span>
    </div>
  );
}
