import { expect, test } from "@playwright/test";

// iPhone 14 viewport against Chromium — we don't need WebKit-specific
// behavior for layout regressions, just a narrow mobile-sized window.
test.use({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});

test("homepage has no horizontal overflow at iPhone 14 width", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("hero-headline")).toBeVisible();
  await expect(page.getByTestId("category-bar")).toBeVisible();
  await expect(page.getByTestId("marketplace-grid")).toBeVisible();
  await expect(page.getByTestId("footer")).toBeVisible();

  const overflow = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  // 2px slack for sub-pixel rendering
  expect(overflow.scrollW).toBeLessThanOrEqual(overflow.clientW + 2);
});

test("nav and footer present on mobile", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("header").first()).toBeVisible();
  await expect(page.getByTestId("footer")).toBeVisible();
});
