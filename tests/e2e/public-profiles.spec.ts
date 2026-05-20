import { expect, test } from "@playwright/test";

test.describe("public profile pages", () => {
  test("manager profile page renders Todd's profile + managed agents", async ({
    page,
  }) => {
    await page.goto("/managers/todd");
    await expect(page.getByTestId("manager-profile")).toBeVisible();
    await expect(page.getByTestId("manager-name")).toHaveText("Todd Dickerson");
    await expect(page.getByTestId("manager-stats")).toBeVisible();
    const links = page.getByTestId("managed-agent-link");
    expect(await links.count()).toBeGreaterThan(0);
  });

  test("manager 404 page when handle is unknown", async ({ page }) => {
    const resp = await page.goto("/managers/does-not-exist");
    expect(resp?.status()).toBe(404);
  });

  test("portfolio page renders the gallery + filter strip", async ({ page }) => {
    await page.goto("/portfolio");
    await expect(page.getByTestId("portfolio-page")).toBeVisible();
    await expect(page.getByTestId("portfolio-filter")).toBeVisible();
    const cards = page.getByTestId("portfolio-card");
    expect(await cards.count()).toBeGreaterThan(6);
    // First card should link to an agent detail page
    const cta = page.getByTestId("portfolio-card-cta").first();
    await expect(cta).toBeVisible();
  });

  test("trust page renders pillars + metrics + policies", async ({ page }) => {
    await page.goto("/trust");
    await expect(page.getByTestId("trust-page")).toBeVisible();
    await expect(page.getByTestId("trust-pillars")).toBeVisible();
    const pillars = page.getByTestId("trust-pillar");
    expect(await pillars.count()).toBeGreaterThanOrEqual(4);
    await expect(page.getByTestId("trust-metrics")).toBeVisible();
    const policies = page.getByTestId("trust-policy");
    expect(await policies.count()).toBeGreaterThanOrEqual(3);
  });

  test("trust link in footer routes to /trust", async ({ page }) => {
    await page.goto("/");
    await page
      .getByTestId("footer")
      .getByRole("link", { name: "Trust & safety" })
      .click();
    await expect(page).toHaveURL(/\/trust$/);
    await expect(page.getByTestId("trust-page")).toBeVisible();
  });
});
