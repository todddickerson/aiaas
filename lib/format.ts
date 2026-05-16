// Formatting helpers shared by all marketing surfaces.

export function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toLocaleString();
}

export function price(n: number): string {
  if (n < 1) return `$${n.toFixed(2)}`;
  if (n % 1 === 0) return `$${n}`;
  return `$${n.toFixed(2)}`;
}

export const TIERS = {
  bronze: { label: "Bronze", fg: "#8B5A2B", bg: "rgba(139,90,43,0.12)" },
  silver: { label: "Silver", fg: "#6B7280", bg: "rgba(107,114,128,0.14)" },
  gold: { label: "Gold", fg: "#B07A14", bg: "rgba(176,122,20,0.14)" },
  diamond: { label: "Diamond", fg: "#1F6FE0", bg: "rgba(31,111,224,0.14)" },
} as const;

export type TierInfo = (typeof TIERS)[keyof typeof TIERS];
