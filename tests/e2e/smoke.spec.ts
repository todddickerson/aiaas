import { expect, test } from "@playwright/test";

test("homepage loads with the AIaaS title + default theme attrs", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/AIaaS/);
  await expect(page.locator("html")).toHaveAttribute("data-mode", "light");
  await expect(page.locator("html")).toHaveAttribute("data-accent", "ember");
  await expect(page.locator("html")).toHaveAttribute("data-variant", "editorial");
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
