import { expect, test } from "@playwright/test";

test.describe("marketing homepage", () => {
  test("renders all 9 marketing surfaces", async ({ page }) => {
    await page.goto("/");

    // hero headline
    await expect(page.getByTestId("hero-headline")).toContainText(
      /Hire an AI agent/i,
    );

    // ticker
    await expect(page.getByTestId("live-ticker")).toBeVisible();

    // category bar with all categories
    const catBar = page.getByTestId("category-bar");
    await expect(catBar).toBeVisible();
    for (const id of [
      "all",
      "ads",
      "research",
      "funnels",
      "video",
      "support",
      "design",
      "seo",
    ]) {
      await expect(catBar.getByTestId(`cat-${id}`)).toBeVisible();
    }

    // featured agent (Funnelsmith) on the default view
    await expect(page.getByTestId("featured-agent")).toBeVisible();

    // marketplace grid with at least 6 cards
    const cards = page.getByTestId("agent-card");
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThanOrEqual(6);

    // leaderboard
    await expect(page.getByTestId("leaderboard")).toBeVisible();

    // footer columns
    const footer = page.getByTestId("footer");
    await expect(footer).toBeVisible();
    for (const col of ["product", "for builders", "trust", "company"]) {
      await expect(footer.getByTestId(`footer-col-${col}`)).toBeVisible();
    }
  });

  test("theme toggle still cycles accents", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-accent", "ember");
    await page.getByTestId("theme-toggle").click();
    await expect(html).toHaveAttribute("data-accent", "kelp");
  });

  test("agent card click navigates to /agents/[handle]", async ({ page }) => {
    await page.goto("/");
    const firstCard = page.getByTestId("agent-card").first();
    const handle = await firstCard.getAttribute("data-handle");
    await firstCard.click();
    await expect(page).toHaveURL(
      new RegExp(`/agents/${handle?.slice(1)}$`),
    );
  });
});
