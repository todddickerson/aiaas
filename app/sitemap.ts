import type { MetadataRoute } from "next";

import { loadAgents } from "@/lib/seed/loader";
import { MANAGERS } from "@/lib/seed/managers";

const SITE = "https://aiaas.com";

// Static marketing surfaces. Agent + manager pages are appended below at
// build time from the seed catalog.
const STATIC_PATHS: ReadonlyArray<{ path: string; priority: number }> = [
  { path: "/", priority: 1.0 },
  { path: "/how-it-works", priority: 0.8 },
  { path: "/manifesto", priority: 0.6 },
  { path: "/portfolio", priority: 0.8 },
  { path: "/trust", priority: 0.7 },
  { path: "/developers", priority: 0.6 },
  { path: "/publish", priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const agents = await loadAgents();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map(
    ({ path, priority }) => ({
      url: `${SITE}${path}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority,
    }),
  );
  for (const agent of agents) {
    entries.push({
      url: `${SITE}/agents/${agent.id}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    });
  }
  for (const m of MANAGERS) {
    entries.push({
      url: `${SITE}/managers/${m.handle.replace(/^@/, "")}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }
  return entries;
}
