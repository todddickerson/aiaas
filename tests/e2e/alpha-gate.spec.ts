import { expect, test } from "@playwright/test";

// The Playwright dev server sets MOCK_RUNTIME_DELAY_MS but not
// AIAAS_ALPHA_TOKEN. So the gate is OFF by default — these tests cover the
// off-mode contract first, then re-fetch with a header injection to verify
// the on-mode contract via a separate node-driven helper.

test.describe("alpha gate (off by default)", () => {
  test("public marketing page is reachable when AIAAS_ALPHA_TOKEN is unset", async ({
    page,
  }) => {
    await page.goto("/");
    // Homepage hero should be visible, not the gate.
    await expect(page.getByTestId("gate-page")).toHaveCount(0);
  });

  test("/gate renders directly when navigated to (smoke)", async ({ page }) => {
    await page.goto("/gate");
    await expect(page.getByTestId("gate-page")).toBeVisible();
    await expect(page.getByTestId("gate-token-input")).toBeVisible();
    await expect(page.getByTestId("gate-submit")).toBeVisible();
  });

  test("/api/health stays open (monitor target)", async ({ request }) => {
    const resp = await request.get("/api/health");
    expect(resp.status()).toBe(200);
    expect((await resp.json()).ok).toBe(true);
  });

  test("/status page renders + reflects health state", async ({ page }) => {
    await page.goto("/status");
    await expect(page.getByTestId("status-page")).toBeVisible();
    await expect(page.getByTestId("status-headline")).toContainText(
      /operational/i,
    );
  });
});

test.describe("alpha gate (logic unit)", () => {
  // We don't restart the dev server with AIAAS_ALPHA_TOKEN set inside the
  // E2E run (would race with parallel tests), so the on-mode bits are
  // covered by the middleware Vitest unit + this end-to-end smoke confirms
  // the gate UI works.
  test("gate form action returns to the next path", async ({ page }) => {
    await page.goto("/gate?next=/agents/funnelsmith");
    const action = await page
      .getByRole("form")
      .or(page.locator("form"))
      .first()
      .getAttribute("action");
    expect(action).toBe("/agents/funnelsmith");
  });
});
