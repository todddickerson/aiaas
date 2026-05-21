import "server-only";

import { AGENTS } from "./agents";
import { listPublishedAgents } from "@/lib/agents/published";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Agent,
  AgentDestination,
  AgentService,
  SampleDeliverable,
  Tier,
} from "@/lib/types";

interface DbAgentRow {
  id: string;
  slug: string;
  handle: string;
  name: string;
  persona: string;
  tagline: string;
  category: string;
  tier: Tier;
  rating: number | string;
  reviews: number;
  runs_count: number;
  sla: string;
  online: boolean;
  queue: number;
  eta_mins: number;
  success_rate: number | string;
  streak: number;
  verified: boolean;
  price_from_cents: number;
  price_max_cents: number;
  currency: string;
  services: AgentService[] | null;
  swatch: string;
  accent_token: string;
  sample: string;
  bio: string;
  manager_id: string | null;
  self_managed: boolean | null;
  runtime: string | null;
  sample_deliverables: SampleDeliverable[] | null;
  description: string | null;
  image_url: string | null;
  destinations: AgentDestination[] | null;
}

function fromCents(cents: number): number {
  // Match the existing TS shape: dollars as a number (allow sub-dollar like 0.08).
  return Math.round((cents / 100) * 100) / 100;
}

function rowToAgent(row: DbAgentRow): Agent {
  return {
    id: row.slug,
    handle: row.handle,
    name: row.name,
    persona: row.persona,
    tagline: row.tagline,
    category: row.category,
    tier: row.tier,
    rating: Number(row.rating),
    reviews: row.reviews,
    runs: row.runs_count,
    sla: row.sla,
    online: row.online,
    queue: row.queue,
    etaMins: row.eta_mins,
    successRate: Number(row.success_rate),
    streak: row.streak,
    verified: row.verified,
    priceFrom: fromCents(row.price_from_cents),
    priceMax: fromCents(row.price_max_cents),
    services: row.services ?? [],
    swatch: row.swatch,
    accent: row.accent_token,
    sample: row.sample,
    bio: row.bio,
    managerId: row.manager_id ?? undefined,
    selfManaged: row.self_managed ?? undefined,
    runtime: row.runtime ?? undefined,
    sampleDeliverables: row.sample_deliverables ?? undefined,
    description: row.description ?? undefined,
    destinations: row.destinations ?? undefined,
  };
}

/**
 * Returns the marketplace catalog. Tries Supabase first; falls back to the
 * bundled JSON seed when Supabase isn't reachable or returns nothing.
 *
 * Server-only. Client components should import {@link AGENTS} (the fallback
 * snapshot) directly.
 */
export async function loadAgents(): Promise<Agent[]> {
  const published = listPublishedAgents();
  const client = getSupabaseServerClient();
  if (!client) {
    // Newly published in-memory agents go first so freshly minted slugs
    // win over identical seed slugs (which shouldn't collide in practice).
    return [...published, ...AGENTS];
  }
  try {
    const { data, error } = await client
      .from("agents")
      .select("*")
      .order("runs_count", { ascending: false });
    if (error || !data || data.length === 0) return [...published, ...AGENTS];
    const fromDb = (data as DbAgentRow[]).map(rowToAgent);
    return [...published, ...fromDb];
  } catch {
    return [...published, ...AGENTS];
  }
}

export async function loadAgent(slug: string): Promise<Agent | undefined> {
  const needle = slug.startsWith("@") ? slug.slice(1) : slug;
  const agents = await loadAgents();
  return agents.find(
    (a) => a.id === needle || a.handle.slice(1) === needle || a.handle === slug,
  );
}
