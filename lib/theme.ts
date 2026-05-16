// Ported from docs/handoff/prototype/theme.jsx
// Source of truth for the theme token data — the CSS variables in app/globals.css
// must mirror this map. tests/unit/theme.test.ts verifies they don't drift.

export const ACCENT_KEYS = ["ember", "kelp", "cobalt", "violet"] as const;
export type AccentKey = (typeof ACCENT_KEYS)[number];

export const MODE_KEYS = ["light", "dark"] as const;
export type ModeKey = (typeof MODE_KEYS)[number];

export const VARIANT_KEYS = [
  "editorial",
  "gamified",
  "swiss",
  "terminal",
] as const;
export type VariantKey = (typeof VARIANT_KEYS)[number];

export const ACCENTS: Record<
  AccentKey,
  { name: string; hex: string; ok: string }
> = {
  ember: { name: "Ember", hex: "#E8532B", ok: "oklch(0.68 0.18 38)" },
  kelp: { name: "Kelp", hex: "#1C8C5E", ok: "oklch(0.58 0.14 160)" },
  cobalt: { name: "Cobalt", hex: "#2E5CE5", ok: "oklch(0.58 0.18 260)" },
  violet: { name: "Violet", hex: "#7B3FF2", ok: "oklch(0.62 0.22 300)" },
};

export interface ModeTokens {
  bg: string;
  bgSub: string;
  panel: string;
  panelSoft: string;
  text: string;
  textDim: string;
  textFaint: string;
  line: string;
  lineSoft: string;
  success: string;
  warn: string;
  danger: string;
}

export const MODES: Record<ModeKey, ModeTokens> = {
  light: {
    bg: "#F6F5F0",
    bgSub: "#EDEBE3",
    panel: "#FFFFFF",
    panelSoft: "#FAF9F4",
    text: "#111114",
    textDim: "#575760",
    textFaint: "#9A9AA2",
    line: "#E5E2D8",
    lineSoft: "#EFEDE4",
    success: "#138A5A",
    warn: "#B07A14",
    danger: "#C03434",
  },
  dark: {
    bg: "#0B0B0D",
    bgSub: "#121216",
    panel: "#17171C",
    panelSoft: "#1C1C22",
    text: "#F2F2F0",
    textDim: "#9A9AA2",
    textFaint: "#55555C",
    line: "#26262C",
    lineSoft: "#1E1E24",
    success: "#4ADE80",
    warn: "#F5B849",
    danger: "#EF4444",
  },
};

export interface VariantTokens {
  name: string;
  display: "serif" | "sans" | "mono";
  body: "sans" | "mono";
}

export const VARIANTS: Record<VariantKey, VariantTokens> = {
  editorial: { name: "Editorial", display: "serif", body: "sans" },
  gamified: { name: "Arcade", display: "sans", body: "sans" },
  swiss: { name: "Swiss", display: "sans", body: "sans" },
  terminal: { name: "Terminal", display: "mono", body: "mono" },
};

export const DEFAULT_ACCENT: AccentKey = "ember";
export const DEFAULT_MODE: ModeKey = "light";
export const DEFAULT_VARIANT: VariantKey = "editorial";

export function tokens(mode: ModeKey, accent: AccentKey) {
  return {
    mode,
    accent: ACCENTS[accent].hex,
    accentOk: ACCENTS[accent].ok,
    accentText: "#ffffff",
    ...MODES[mode],
  };
}

export function nextAccent(current: AccentKey): AccentKey {
  const i = ACCENT_KEYS.indexOf(current);
  return ACCENT_KEYS[(i + 1) % ACCENT_KEYS.length];
}

export function nextMode(current: ModeKey): ModeKey {
  return current === "light" ? "dark" : "light";
}

export function nextVariant(current: VariantKey): VariantKey {
  const i = VARIANT_KEYS.indexOf(current);
  return VARIANT_KEYS[(i + 1) % VARIANT_KEYS.length];
}
