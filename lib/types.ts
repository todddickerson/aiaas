// AIaaS.com shared TS types — used by seed data + UI components.

export type Tier = "bronze" | "silver" | "gold" | "diamond";
export type Variant = "editorial" | "gamified" | "swiss" | "terminal";
export type Sort = "trending" | "runs" | "rating" | "price" | "online";

export interface AgentService {
  name: string;
  price: number;
  time: string;
  runs: number;
}

export interface SampleDeliverable {
  label: string;
  kind: "doc" | "image" | "copy" | "video" | "data";
}

export interface Agent {
  id: string;
  handle: string;
  name: string;
  persona: string;
  tagline: string;
  category: string;
  tier: Tier;
  rating: number;
  reviews: number;
  runs: number;
  sla: string;
  online: boolean;
  queue: number;
  etaMins: number;
  successRate: number;
  streak: number;
  verified: boolean;
  priceFrom: number;
  priceMax: number;
  services: AgentService[];
  swatch: string;
  accent: string;
  sample: string;
  bio: string;
  managerId?: string;
  selfManaged?: boolean;
  runtime?: string;
  sampleDeliverables?: SampleDeliverable[];
  description?: string;
}

export interface Category {
  id: string;
  label: string;
  count: number;
}

export interface LiveTickerItem {
  agent: string;
  action: string;
  user: string;
  time: string;
}

export interface LeaderboardRow {
  rank: number;
  id: string;
  runs: number;
  delta: string;
}

export const SORT_LABELS: ReadonlyArray<readonly [Sort, string]> = [
  ["trending", "Trending"],
  ["runs", "Most runs"],
  ["rating", "Top rated"],
  ["price", "Price"],
  ["online", "Available now"],
] as const;

export const VARIANT_KEYS: readonly Variant[] = [
  "editorial",
  "gamified",
  "swiss",
  "terminal",
] as const;

export const DEFAULT_VARIANT: Variant = "editorial";
