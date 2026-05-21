import "server-only";

import type { Agent } from "@/lib/types";

/**
 * In-memory store of agents that were published via the builder publish flow
 * (`/publish` wizard or the agent_drafts submit API). When Supabase is wired
 * the canonical store is the `agents` table; this fallback exists so the
 * builder→hire→deliver flow runs end-to-end in CI with no DB.
 *
 * Stored on globalThis for the same reason as the run + event stores: Next
 * 16 may bundle the loader (read by server-component pages) into a separate
 * module instance from the drafts route handlers that write here.
 */
type PublishedStore = {
  agents: Map<string, Agent>;
};

const STORE_KEY = "__aiaas_published_agents__";

interface Holder {
  [STORE_KEY]?: PublishedStore;
}
const holder = globalThis as unknown as Holder;
const store: PublishedStore =
  holder[STORE_KEY] ??
  (holder[STORE_KEY] = { agents: new Map() });

export function registerPublishedAgent(agent: Agent): void {
  store.agents.set(agent.id, agent);
}

export function listPublishedAgents(): Agent[] {
  return Array.from(store.agents.values());
}

export function getPublishedAgent(slug: string): Agent | undefined {
  const needle = slug.startsWith("@") ? slug.slice(1) : slug;
  return store.agents.get(needle);
}

export const _resetPublishedStore = () => {
  store.agents.clear();
};
