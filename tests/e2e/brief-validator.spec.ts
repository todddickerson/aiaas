import { expect, test } from "@playwright/test";

test.describe("brief validator flow", () => {
  test("happy-path: brief → validator pass → queue", async ({ page }) => {
    await page.goto("/agents/funnelsmith");
    await page.getByTestId("agent-hire-cta").click();
    await expect(page.getByTestId("hire-modal")).toBeVisible();

    const textarea = page.getByTestId("brief-textarea");
    await textarea.fill(
      "Launching a $97 course on calm productivity. Target audience: burned-out PMs. Tone: warm + direct. Ship a 6-email indoctrination sequence.",
    );
    await page.getByTestId("brief-submit").click();

    // Validator runs server-side; stub mode returns pass for complete briefs.
    await expect(page.getByTestId("validator-summary")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("validator-summary")).toContainText(/pass/i);
  });

  test("rejected: brief that's too short returns the rejected state", async ({
    page,
  }) => {
    await page.goto("/agents/funnelsmith");
    await page.getByTestId("agent-hire-cta").click();
    const textarea = page.getByTestId("brief-textarea");

    // 8+ chars to pass the client-side guard, but stub falls through to "pass"
    // for short complete-looking briefs. So we POST directly to the API to
    // exercise the <8-char guard.
    const resp = await page.request.post("/api/v1/briefs/validate", {
      data: { agentSlug: "funnelsmith", briefText: "hi" },
    });
    expect(resp.status()).toBe(200);
    const json = await resp.json();
    expect(json.verdict).toBe("rejected");
    expect(json.rejectReason).toMatch(/short/i);

    // sanity: the textarea is still usable for retry
    await expect(textarea).toBeVisible();
  });

  test("clarify: ambiguous brief routes to the clarify step", async ({
    page,
  }) => {
    await page.goto("/agents/funnelsmith");
    await page.getByTestId("agent-hire-cta").click();
    await page.getByTestId("brief-textarea").fill("Maybe a funnel? Not sure what kind.");
    await page.getByTestId("brief-submit").click();
    await expect(page.getByTestId("validator-clarify")).toBeVisible({ timeout: 15_000 });
  });

  test("API route returns 400 for missing agentSlug", async ({ request }) => {
    const resp = await request.post("/api/v1/briefs/validate", {
      data: { briefText: "this is a valid-looking brief that's long enough" },
    });
    expect(resp.status()).toBe(400);
  });

  test("API route returns 404 for unknown agent", async ({ request }) => {
    const resp = await request.post("/api/v1/briefs/validate", {
      data: { agentSlug: "not-a-real-agent", briefText: "long enough brief here please" },
    });
    expect(resp.status()).toBe(404);
  });
});
