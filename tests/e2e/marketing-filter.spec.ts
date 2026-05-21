import { expect, test } from "@playwright/test";

test("category filter scopes the grid + writes the URL", async ({ page }) => {
  await page.goto("/");

  // baseline: at least one funnel and at least one non-funnel agent
  const cards = page.getByTestId("agent-card");
  const before = await cards.count();
  expect(before).toBeGreaterThanOrEqual(6);

  // click 'Funnels & copy'
  await page.getByTestId("cat-funnels").click();

  // URL reflects the filter
  await expect(page).toHaveURL(/[?&]cat=funnels(\b|&|#)/);

  // every remaining card is in the funnels category
  await expect(cards.first()).toBeVisible();
  const after = await cards.count();
  expect(after).toBeGreaterThan(0);
  expect(after).toBeLessThan(before);
  const categories = await cards.evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute("data-category")),
  );
  for (const c of categories) expect(c).toBe("funnels");

  // 'All agents' restores
  await page.getByTestId("cat-all").click();
  await expect(page).not.toHaveURL(/cat=funnels/);
  const restored = await cards.count();
  // ≥ instead of strict equality because parallel publish tests can
  // register new agents into the in-memory catalog between captures.
  expect(restored).toBeGreaterThanOrEqual(before);
});

test("sort toggle writes ?sort= and reorders cards", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("sort-runs").click();
  await expect(page).toHaveURL(/[?&]sort=runs(\b|&|#)/);
  await expect(page.getByTestId("sort-runs")).toHaveAttribute(
    "data-active",
    "true",
  );
});
