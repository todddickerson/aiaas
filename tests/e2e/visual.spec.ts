import { expect, test } from "@playwright/test";

import type { AccentKey, ModeKey } from "../../lib/theme";

const MATRIX: ReadonlyArray<{ name: string; mode: ModeKey; accent: AccentKey }> = [
  { name: "light-ember", mode: "light", accent: "ember" },
  { name: "dark-ember", mode: "dark", accent: "ember" },
  { name: "light-kelp", mode: "light", accent: "kelp" },
  { name: "dark-cobalt", mode: "dark", accent: "cobalt" },
];

// CSS injected on every visual run: kills the live-ticker marquee + any
// other animation so snapshots are pixel-stable across runs.
const FREEZE_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
`;

for (const { name, mode, accent } of MATRIX) {
  test(`homepage @ ${name}`, async ({ page }) => {
    await page.addInitScript(
      ({ mode, accent }) => {
        window.localStorage.setItem(
          "aiaas:theme",
          JSON.stringify({ mode, accent, variant: "editorial" }),
        );
      },
      { mode, accent },
    );
    await page.goto("/");
    await page.addStyleTag({ content: FREEZE_CSS });
    await page.waitForLoadState("networkidle");

    // assert the theme actually applied — guards against silent baseline drift
    await expect(page.locator("html")).toHaveAttribute("data-mode", mode);
    await expect(page.locator("html")).toHaveAttribute("data-accent", accent);

    await expect(page).toHaveScreenshot(`home-${name}.png`, {
      fullPage: true,
      // Mask the ticker entirely — its content is deterministic but the
      // marquee transform briefly transitions before the freeze CSS lands.
      mask: [page.getByTestId("live-ticker")],
    });
  });
}

// Additional public pages covered by the same harness as the homepage: same
// theme-via-localStorage seeding, same freeze CSS, same networkidle wait, and
// the same data-mode/data-accent guard against silent baseline drift. Each
// renders entirely from static seed data (lib/seed/*) with no live timestamps,
// randomness, or animated marquees, so full-page snapshots are deterministic
// and need no masking. `ready` is the page's root landmark testid we wait on
// before snapshotting.
const PAGES: ReadonlyArray<{ slug: string; path: string; ready: string }> = [
  { slug: "portfolio", path: "/portfolio", ready: "portfolio-page" },
  { slug: "trust", path: "/trust", ready: "trust-page" },
  { slug: "agent-funnelsmith", path: "/agents/funnelsmith", ready: "agent-hero" },
  { slug: "manager-todd", path: "/managers/todd", ready: "manager-profile" },
];

for (const { slug, path, ready } of PAGES) {
  for (const { name, mode, accent } of MATRIX) {
    test(`${slug} @ ${name}`, async ({ page }) => {
      await page.addInitScript(
        ({ mode, accent }) => {
          window.localStorage.setItem(
            "aiaas:theme",
            JSON.stringify({ mode, accent, variant: "editorial" }),
          );
        },
        { mode, accent },
      );
      await page.goto(path);
      await page.addStyleTag({ content: FREEZE_CSS });
      await page.waitForLoadState("networkidle");

      // wait for the page's root landmark before snapshotting
      await expect(page.getByTestId(ready)).toBeVisible();

      // assert the theme actually applied — guards against silent baseline drift
      await expect(page.locator("html")).toHaveAttribute("data-mode", mode);
      await expect(page.locator("html")).toHaveAttribute("data-accent", accent);

      await expect(page).toHaveScreenshot(`${slug}-${name}.png`, {
        fullPage: true,
      });
    });
  }
}
