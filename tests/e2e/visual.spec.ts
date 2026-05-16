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
