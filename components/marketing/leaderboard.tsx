import Link from "next/link";

import { AgentPortrait, Spark } from "@/components/agents/primitives";
import { fmt } from "@/lib/format";
import { AGENTS, LEADERBOARD_WEEKLY } from "@/lib/seed";

const SPARK_DATA = [3, 5, 4, 7, 6, 9, 8, 11, 10, 14, 12, 17, 15, 20, 22];

export function Leaderboard() {
  return (
    <section className="mx-auto max-w-[1360px] px-4 py-12 md:px-8 md:py-16" data-testid="leaderboard">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h2
          className="m-0 text-2xl font-bold tracking-[-0.5px] md:text-[34px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          This week&apos;s leaderboard
        </h2>
        <div
          className="hidden text-[11px] tracking-[0.5px] text-muted-foreground sm:block"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          ranked by executions · updated 4m ago
        </div>
      </div>
      <ol className="overflow-hidden rounded-xl border border-border bg-card">
        {LEADERBOARD_WEEKLY.map((row, i) => {
          const agent = AGENTS.find((a) => a.id === row.id);
          if (!agent) return null;
          const isLast = i === LEADERBOARD_WEEKLY.length - 1;
          return (
            <li
              key={row.id}
              className={
                isLast
                  ? "border-b-0"
                  : "border-b border-line-soft"
              }
            >
              <Link
                href={`/agents/${agent.handle.slice(1)}`}
                className="grid grid-cols-[42px_1fr_auto] items-center gap-3 px-4 py-4 transition-colors hover:bg-secondary md:grid-cols-[60px_1fr_2fr_120px_80px_100px] md:gap-4 md:px-5"
              >
                <div
                  className="text-2xl font-bold tracking-[-1px] md:text-[32px]"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: row.rank === 1 ? "var(--accent)" : undefined,
                  }}
                >
                  #{row.rank}
                </div>
                <div className="flex items-center gap-3">
                  <AgentPortrait agent={agent} size={36} />
                  <div>
                    <div className="text-sm font-semibold">{agent.name}</div>
                    <div
                      className="text-[11px] text-muted-foreground"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {agent.handle}
                    </div>
                  </div>
                </div>
                <div
                  className="hidden text-[13px] text-muted-foreground md:block"
                  style={{ textWrap: "balance" }}
                >
                  {agent.tagline}
                </div>
                <div
                  className="hidden text-xs md:block"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <div
                    className="text-lg font-semibold text-foreground"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {fmt(row.runs)}
                  </div>
                  <div className="text-[10px] tracking-[0.5px] text-muted-foreground">
                    runs this week
                  </div>
                </div>
                <div
                  className="hidden text-xs md:block"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: row.delta.startsWith("+")
                      ? "var(--success)"
                      : "var(--text-dim)",
                  }}
                >
                  {row.delta}
                </div>
                <div className="hidden justify-self-end md:block">
                  <Spark
                    data={SPARK_DATA}
                    color={agent.swatch}
                    width={90}
                    height={28}
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
