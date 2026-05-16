import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ACCENTS,
  ACCENT_KEYS,
  DEFAULT_ACCENT,
  DEFAULT_MODE,
  MODES,
  MODE_KEYS,
  nextAccent,
  nextMode,
  tokens,
} from "@/lib/theme";

const HERE = dirname(fileURLToPath(import.meta.url));
const GLOBALS_CSS = readFileSync(
  resolve(HERE, "../../app/globals.css"),
  "utf8",
);

describe("theme token map", () => {
  it("exposes exactly the four prototype accents", () => {
    expect(ACCENT_KEYS).toEqual(["ember", "kelp", "cobalt", "violet"]);
    for (const key of ACCENT_KEYS) {
      expect(ACCENTS[key].hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(ACCENTS[key].ok).toMatch(/^oklch\(/);
    }
  });

  it("exposes light and dark modes with the full token shape", () => {
    expect(MODE_KEYS).toEqual(["light", "dark"]);
    const required = [
      "bg",
      "bgSub",
      "panel",
      "panelSoft",
      "text",
      "textDim",
      "textFaint",
      "line",
      "lineSoft",
      "success",
      "warn",
      "danger",
    ] as const;
    for (const mode of MODE_KEYS) {
      for (const key of required) {
        expect(MODES[mode][key]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });

  it("defaults to ember + light per the spec", () => {
    expect(DEFAULT_ACCENT).toBe("ember");
    expect(DEFAULT_MODE).toBe("light");
  });

  it("nextAccent cycles ember → kelp → cobalt → violet → ember", () => {
    expect(nextAccent("ember")).toBe("kelp");
    expect(nextAccent("kelp")).toBe("cobalt");
    expect(nextAccent("cobalt")).toBe("violet");
    expect(nextAccent("violet")).toBe("ember");
  });

  it("nextMode flips light ↔ dark", () => {
    expect(nextMode("light")).toBe("dark");
    expect(nextMode("dark")).toBe("light");
  });

  it("tokens() merges mode + accent into a single record", () => {
    const t = tokens("light", "ember");
    expect(t.bg).toBe(MODES.light.bg);
    expect(t.accent).toBe(ACCENTS.ember.hex);
    expect(t.accentText).toBe("#ffffff");
  });
});

describe("globals.css mirrors lib/theme.ts (no drift)", () => {
  it("declares every accent hex inside a matching data-accent selector", () => {
    for (const key of ACCENT_KEYS) {
      const hex = ACCENTS[key].hex.toLowerCase();
      const pattern = new RegExp(
        `\\[data-accent="${key}"\\][^{]*\\{[^}]*--accent:\\s*${hex}`,
        "i",
      );
      expect(
        GLOBALS_CSS,
        `accent ${key} (${hex}) must appear under [data-accent="${key}"] in globals.css`,
      ).toMatch(pattern);
    }
  });

  it("declares every mode background inside a matching data-mode selector", () => {
    for (const mode of MODE_KEYS) {
      const hex = MODES[mode].bg.toLowerCase();
      const pattern = new RegExp(
        `\\[data-mode="${mode}"\\][^{]*\\{[^}]*--bg:\\s*${hex}`,
        "i",
      );
      expect(
        GLOBALS_CSS,
        `mode ${mode} bg (${hex}) must appear under [data-mode="${mode}"] in globals.css`,
      ).toMatch(pattern);
    }
  });
});
