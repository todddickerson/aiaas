import { expect, test } from "@playwright/test";

test("homepage loads and shows the AIaaS brand mark", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/AIaaS/);
  await expect(page.getByTestId("brand-mark")).toHaveText("AIaaS.com");
  await expect(page.locator("html")).toHaveAttribute("data-mode", "light");
  await expect(page.locator("html")).toHaveAttribute("data-accent", "ember");
});

test("theme toggle cycles accent and persists on reload", async ({ page }) => {
  await page.goto("/");

  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-accent", "ember");

  await page.getByTestId("theme-toggle").click();
  await expect(html).toHaveAttribute("data-accent", "kelp");

  await page.reload();
  await expect(html).toHaveAttribute("data-accent", "kelp");
});
