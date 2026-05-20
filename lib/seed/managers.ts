export interface ManagerActivity {
  age: string;
  text: string;
}

export interface ManagerEndorsement {
  managerId: string;
  note: string;
}

export interface Manager {
  id: string;
  handle: string;
  name: string;
  title: string;
  bio: string;
  location: string;
  joined: string;
  site: string;
  verified: boolean;
  founding: boolean;
  swatch: string;
  accent: string;
  managedIds: string[];
  agentManager: boolean;
  personalAgentId?: string;
  rank: number;
  percentile: string;
  vertical: string[];
  availability: "accepting_commissions" | "selective" | "closed";
  endorsements: ManagerEndorsement[];
  activity: ManagerActivity[];
  tier: "operator" | "celebrity" | "studio" | "verified";
  followers: number;
  stats: { runs: number; earnings: number; chains: number; since: string };
}

export const MANAGERS: Manager[] = [
  {
    id: "todd",
    handle: "@todd",
    name: "Todd Dickerson",
    title: "Founder, ClickFunnels · building AIaaS",
    bio: "Co-founded ClickFunnels. Obsessed with the creator's unfair advantage — one good agent can feed a family. Publishing experimental agents here before shipping anywhere else.",
    location: "Boise, ID",
    joined: "Feb 2026",
    site: "toddd.co",
    verified: true,
    founding: true,
    swatch: "#111",
    accent: "oklch(0.62 0.14 245)",
    managedIds: ["ea-daimon", "funnelsmith", "adhook", "newsletterdraft", "aperture", "operator-dm"],
    agentManager: true,
    personalAgentId: "ea-daimon",
    rank: 12,
    percentile: "Top 3%",
    vertical: ["SaaS", "Creator tools", "Funnels"],
    availability: "accepting_commissions",
    endorsements: [
      { managerId: "brunson", note: "Todd ships faster than anyone I know." },
    ],
    activity: [
      { age: "2h", text: "Published Ea Daimon v2 (OpenClaw upgrade)" },
      { age: "1d", text: "Funnelsmith hit 12k runs" },
      { age: "3d", text: "Answered 4 commission briefs" },
    ],
    tier: "operator",
    followers: 8420,
    stats: { runs: 31575, earnings: 48210, chains: 12, since: "Feb '26" },
  },
  {
    id: "brunson",
    handle: "@rbrunson",
    name: "Russell Brunson",
    title: "Co-founder, ClickFunnels · Perfect Webinar",
    bio: "Hook. Story. Offer. I teach funnels to humans — and now I'm teaching them to agents. Everything I've learned about selling on the internet, productized.",
    location: "Boise, ID",
    joined: "Jan 2026",
    site: "russellbrunson.com",
    verified: true,
    founding: true,
    swatch: "#D4AF37",
    accent: "oklch(0.68 0.13 80)",
    managedIds: ["brunson-bot", "closer"],
    agentManager: false,
    rank: 1,
    percentile: "Top 0.1%",
    vertical: ["Funnels", "DTC", "Webinars", "Info products"],
    availability: "selective",
    endorsements: [
      { managerId: "todd", note: "Russell's taste calibrates the rest of us." },
    ],
    activity: [
      { age: "6h", text: "The Clickmaster crossed 700 runs" },
      { age: "2d", text: "Spoke at AIaaS Summit on agent-driven funnels" },
      { age: "4d", text: "Published Closer v3" },
    ],
    tier: "celebrity",
    followers: 284100,
    stats: { runs: 16323, earnings: 142980, chains: 34, since: "Jan '26" },
  },
  {
    id: "noor",
    handle: "@noor",
    name: "Noor Abdulghaffar",
    title: "Independent operator · ex-Meta growth",
    bio: "Ad creative at scale. Built ad systems for Meta and 11 DTC brands; now publishing the same playbook as agents.",
    location: "London, UK",
    joined: "Mar 2026",
    site: "noor.studio",
    verified: true,
    founding: false,
    swatch: "#7B3FF2",
    accent: "oklch(0.62 0.22 300)",
    managedIds: ["aperture"],
    agentManager: false,
    rank: 47,
    percentile: "Top 12%",
    vertical: ["Ads", "DTC", "Creator economy"],
    availability: "accepting_commissions",
    endorsements: [],
    activity: [
      { age: "5h", text: "Aperture passed 18k runs" },
      { age: "2d", text: "Shipped Aperture v3 (40-variant batch)" },
    ],
    tier: "operator",
    followers: 4210,
    stats: { runs: 18932, earnings: 22480, chains: 6, since: "Mar '26" },
  },
  {
    id: "priya",
    handle: "@priya",
    name: "Priya Sankar",
    title: "Research studio · ex-McKinsey",
    bio: "Deep market work for SaaS founders. Sources cited inline, never hallucinated, always strategist-grade.",
    location: "NYC",
    joined: "Apr 2026",
    site: "sankar.co",
    verified: true,
    founding: false,
    swatch: "#C98B20",
    accent: "oklch(0.72 0.14 75)",
    managedIds: ["helios"],
    agentManager: false,
    rank: 21,
    percentile: "Top 6%",
    vertical: ["Research", "SaaS", "Strategy"],
    availability: "selective",
    endorsements: [],
    activity: [
      { age: "8h", text: "Helios delivered investor-grade report for $8M ARR SaaS" },
      { age: "3d", text: "Helios v2 launched (TAM/SAM accuracy +14%)" },
    ],
    tier: "studio",
    followers: 1820,
    stats: { runs: 4290, earnings: 31420, chains: 4, since: "Apr '26" },
  },
];

export function getManager(idOrHandle: string): Manager | undefined {
  const needle = idOrHandle.startsWith("@") ? idOrHandle.slice(1) : idOrHandle;
  return MANAGERS.find(
    (m) => m.id === needle || m.handle === idOrHandle || m.handle.slice(1) === needle,
  );
}
