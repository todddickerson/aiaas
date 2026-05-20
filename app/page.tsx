import { CategoryBar } from "@/components/marketing/category-bar";
import { FeaturedAgent } from "@/components/marketing/featured-agent";
import { Footer } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/hero";
import { Leaderboard } from "@/components/marketing/leaderboard";
import { LiveTicker } from "@/components/marketing/live-ticker";
import { MarketplaceGrid } from "@/components/marketing/marketplace-grid";
import { TopNav } from "@/components/marketing/top-nav";
import { TweaksPanel } from "@/components/marketing/tweaks-panel";

import { sortAgents } from "@/lib/seed";
import { loadAgents } from "@/lib/seed/loader";
import type { Sort } from "@/lib/types";

const VALID_SORTS = new Set<Sort>([
  "trending",
  "runs",
  "rating",
  "price",
  "online",
]);

interface HomeProps {
  searchParams: Promise<{ cat?: string; sort?: string }>;
}

export const revalidate = 60;

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const cat = params.cat ?? "all";
  const sortParam = params.sort as Sort | undefined;
  const sort: Sort = sortParam && VALID_SORTS.has(sortParam) ? sortParam : "trending";

  const all = await loadAgents();
  const inCategory = cat === "all" ? all : all.filter((a) => a.category === cat);
  const sorted = sortAgents(inCategory, sort);

  const featuredAgent = all.find((a) => a.id === "funnelsmith");
  const showFeatured = cat === "all" && sort === "trending" && featuredAgent;
  const gridAgents = showFeatured && featuredAgent
    ? sorted.filter((a) => a.id !== featuredAgent.id)
    : sorted;

  return (
    <>
      <TopNav />
      <LiveTicker />
      <Hero />
      <CategoryBar cat={cat} sort={sort} />
      {showFeatured && featuredAgent && <FeaturedAgent agent={featuredAgent} />}
      <MarketplaceGrid agents={gridAgents} />
      <Leaderboard />
      <Footer />
      {process.env.NODE_ENV !== "production" && <TweaksPanel />}
    </>
  );
}
