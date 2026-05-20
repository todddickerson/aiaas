import { expect, test } from "@playwright/test";

test.describe("agent detail page", () => {
  test("navigates from marketplace to detail and renders hero + price", async ({
    page,
  }) => {
    await page.goto("/");

    const firstCard = page.getByTestId("agent-card").first();
    await expect(firstCard).toBeVisible();
    const handle = await firstCard.getAttribute("data-handle");
    expect(handle).toBeTruthy();

    await firstCard.click();
    await expect(page).toHaveURL(new RegExp(`/agents/${handle!.slice(1)}$`));

    // Hero name + handle
    const hero = page.getByTestId("agent-hero");
    await expect(hero).toBeVisible();
    await expect(hero).toHaveAttribute("data-handle", handle!);
    await expect(page.getByTestId("agent-name")).toBeVisible();

    // Service pricing card renders at least one price chip
    const prices = page.getByTestId("agent-service-price");
    expect(await prices.count()).toBeGreaterThan(0);
    await expect(prices.first()).toContainText("$");

    // Hire CTA visible
    await expect(page.getByTestId("agent-hire-cta")).toContainText(/Hire/i);
  });

  test("Funnelsmith detail page shows the correct name + price", async ({
    page,
  }) => {
    await page.goto("/agents/funnelsmith");

    await expect(page.getByTestId("agent-name")).toHaveText("Funnelsmith");
    await expect(page.getByTestId("agent-hire-cta")).toContainText("$79");

    // Sample output renders
    await expect(page.getByTestId("sample-deliverable")).toBeVisible();

    // Trust strip + deliverables grid visible
    await expect(page.getByTestId("trust-strip")).toBeVisible();
    await expect(page.getByTestId("deliverables-grid")).toBeVisible();
  });

  test("Hire CTA opens the brief modal", async ({ page }) => {
    await page.goto("/agents/funnelsmith");
    await page.getByTestId("agent-hire-cta").click();
    await expect(page.getByTestId("hire-modal")).toBeVisible();
    await expect(page.getByTestId("brief-textarea")).toBeVisible();
  });
});
