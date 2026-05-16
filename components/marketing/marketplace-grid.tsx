"use client";

import { AgentCard } from "@/components/agents/agent-card";
import { useTheme } from "@/components/theme-provider";
import type { Agent } from "@/lib/types";

/**
 * Renders the filtered + sorted agent list, picking a card variant from the
 * theme tweaks. Defaults to "editorial" on the server / first render to match
 * the prototype's DEFAULT_TWEAKS.
 */
export function MarketplaceGrid({ agents }: { agents: Agent[] }) {
  const { variant } = useTheme();

  if (agents.length === 0) {
    return (
      <section
        className="mx-auto max-w-[1360px] px-4 py-16 text-center md:px-8"
        data-testid="marketplace-grid"
        data-empty="true"
      >
        <p className="text-muted-foreground">
          No agents in this category yet — try another filter.
        </p>
      </section>
    );
  }

  return (
    <section
      id="agents"
      className="mx-auto grid max-w-[1360px] gap-5 px-4 py-6 md:px-8 md:py-8"
      data-testid="marketplace-grid"
      data-variant={variant}
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
      }}
    >
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} variant={variant} />
      ))}
    </section>
  );
}
