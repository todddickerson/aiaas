import type { Agent, Sort } from "@/lib/types";

import { AGENTS } from "./agents";
import { CATEGORIES } from "./categories";
import { LEADERBOARD_WEEKLY } from "./leaderboard";
import { LIVE_TICKER } from "./live-ticker";

export { AGENTS, CATEGORIES, LEADERBOARD_WEEKLY, LIVE_TICKER };

export function getAgent(idOrHandle: string): Agent | undefined {
  const needle = idOrHandle.startsWith("@") ? idOrHandle.slice(1) : idOrHandle;
  return AGENTS.find(
    (a) => a.id === needle || a.handle === idOrHandle || a.handle.slice(1) === needle,
  );
}

export function agentsByCategory(catId: string): Agent[] {
  if (catId === "all") return AGENTS;
  return AGENTS.filter((a) => a.category === catId);
}

export function sortAgents(arr: Agent[], sort: Sort): Agent[] {
  if (sort === "runs") return [...arr].sort((a, b) => b.runs - a.runs);
  if (sort === "rating") return [...arr].sort((a, b) => b.rating - a.rating);
  if (sort === "price") return [...arr].sort((a, b) => a.priceFrom - b.priceFrom);
  if (sort === "online")
    return [...arr].sort(
      (a, b) =>
        Number(b.online) - Number(a.online) + (a.queue - b.queue) * 0.01,
    );
  // 'trending' = seed order (curated)
  return arr;
}

export function getCategory(catId: string) {
  return CATEGORIES.find((c) => c.id === catId);
}
