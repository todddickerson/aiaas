import "server-only";

import { loadAgent } from "@/lib/seed/loader";
import type { AgentDestination } from "@/lib/types";

/**
 * Per-agent scope grants. The proxy enforces that when a run is in flight,
 * every `(tool, method, target)` it sees is in the agent's destinations
 * allow-list. Anything else is a scope violation.
 *
 * The same list is what the run-time delivery dispatcher iterates over,
 * which means the grant cannot drift from what the agent actually says it
 * will deliver to — the published spec IS the grant.
 */

export interface ScopeCheckInput {
  agentSlug: string;
  tool: string;
  method: string;
  /**
   * The full payload the proxy is about to send. We extract just the target
   * keys (channel / to / parent / etc) and compare against the destination's
   * `target` map. Extra keys (text body, attachments, etc) are allowed.
   */
  payload: Record<string, unknown>;
}

export interface ScopeCheckResult {
  ok: boolean;
  reason?: string;
  matched?: AgentDestination;
}

/**
 * Returns `{ ok: true }` if the call matches one of the agent's declared
 * destinations. Returns `{ ok: false, reason }` if the agent has no matching
 * (tool, method) destination, or if the target keys disagree.
 *
 * When the agent has zero destinations declared, calls are allowed — that's
 * the "no scope grants" mode used by agents that don't deliver via Composio
 * (e.g. pure in-app artifacts). Tightening this to require destinations is
 * the right call once we have publish-time validation in place.
 */
export async function checkScope(
  input: ScopeCheckInput,
): Promise<ScopeCheckResult> {
  const agent = await loadAgent(input.agentSlug);
  if (!agent) {
    return { ok: false, reason: `Unknown agent: ${input.agentSlug}` };
  }
  const destinations = agent.destinations ?? [];
  if (destinations.length === 0) {
    return { ok: true };
  }
  const candidates = destinations.filter(
    (d) => d.tool === input.tool && d.method === input.method,
  );
  if (candidates.length === 0) {
    return {
      ok: false,
      reason: `${input.tool}.${input.method} is not in this agent's declared destinations.`,
    };
  }
  for (const cand of candidates) {
    if (targetMatches(cand.target, input.payload)) {
      return { ok: true, matched: cand };
    }
  }
  const allowed = candidates
    .map((c) => JSON.stringify(c.target))
    .join(" | ");
  return {
    ok: false,
    reason: `target outside allow-list. allowed targets: ${allowed}`,
  };
}

function targetMatches(
  target: Record<string, string>,
  payload: Record<string, unknown>,
): boolean {
  for (const [key, want] of Object.entries(target)) {
    const got = payload[key];
    if (typeof got !== "string") return false;
    if (got !== want) return false;
  }
  return true;
}
