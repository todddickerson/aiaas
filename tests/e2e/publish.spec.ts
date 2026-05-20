import { expect, test } from "@playwright/test";

test.describe("builder publish wizard", () => {
  test("loads the wizard, creates a draft, and shows the stepper", async ({
    page,
  }) => {
    await page.goto("/publish");
    await expect(page.getByTestId("publish-wizard")).toBeVisible();
    await expect(page.getByTestId("stepper")).toBeVisible();
    await expect(page.getByTestId("section-identity")).toBeVisible({ timeout: 10_000 });
  });

  test("walks identity → spec → runtime → payee → review and submits", async ({
    page,
  }) => {
    await page.goto("/publish");
    await page.getByTestId("section-identity").waitFor();

    // Step 1: Identity
    await page.getByTestId("field-name").fill("Funnelsmith Test");
    await page.getByTestId("field-tagline").fill("Ships a complete VSL funnel in 90 minutes.");
    await page.getByTestId("step-next").click();
    await expect(page.getByTestId("section-spec")).toBeVisible();

    // Step 2: Spec — compile
    await page
      .getByTestId("field-spec")
      .fill(
        "Funnelsmith ships a $79 funnel teardown for non-technical founders. Audience: founders. Delivers a hook bank + 6-email indoctrination sequence.",
      );
    await page.getByTestId("compile-spec").click();
    await expect(page.getByTestId("spec-status")).toHaveAttribute("data-status", "ready", {
      timeout: 15_000,
    });
    await page.getByTestId("step-next").click();
    await expect(page.getByTestId("section-runtime")).toBeVisible();

    // Step 3: Runtime + destinations + price
    await page.getByTestId("dest-slack").click();
    await page.getByTestId("field-price-from").fill("79");
    await page.getByTestId("field-price-max").fill("349");
    await page.getByTestId("step-next").click();
    await expect(page.getByTestId("section-payee")).toBeVisible();

    // Step 4: Whop payee
    await page.getByTestId("link-payee").click();
    await expect(page.getByTestId("payee-status")).toContainText(/linked/, {
      timeout: 10_000,
    });
    await page.getByTestId("step-next").click();
    await expect(page.getByTestId("section-review")).toBeVisible();

    // Step 5: Submit
    await page.getByTestId("submit-draft").click();
    await expect(page.getByTestId("publish-success")).toBeVisible({ timeout: 10_000 });
  });

  test("API: missing builderId → 400", async ({ request }) => {
    const resp = await request.post("/api/v1/agents/drafts", { data: {} });
    expect(resp.status()).toBe(400);
  });

  test("API: compile + submit on a fresh draft round-trip", async ({
    request,
  }) => {
    const builderId = `e2e-builder-${Date.now()}`;
    const create = await request.post("/api/v1/agents/drafts", {
      data: { builderId, name: "Test Agent" },
    });
    expect(create.status()).toBe(200);
    const draft = await create.json();

    // Add a spec
    const patch = await request.patch(`/api/v1/agents/drafts/${draft.id}`, {
      data: {
        specText:
          "Helps non-technical founders ship a $79 funnel. Audience: founders. Delivers a hook bank.",
      },
    });
    expect(patch.status()).toBe(200);

    // Compile
    const compile = await request.post(
      `/api/v1/agents/drafts/${draft.id}/compile`,
    );
    expect(compile.status()).toBe(200);
    const compileJson = await compile.json();
    expect(compileJson.compile.status).toBe("ready");

    // Link payee
    const payee = await request.post(
      `/api/v1/agents/drafts/${draft.id}/payee`,
      { data: {} },
    );
    expect(payee.status()).toBe(200);

    // Submit
    const submit = await request.post(
      `/api/v1/agents/drafts/${draft.id}/submit`,
    );
    expect(submit.status()).toBe(200);
    expect((await submit.json()).publishStatus).toBe("submitted");
  });

  test("API: submit blocked when spec isn't ready", async ({ request }) => {
    const builderId = `e2e-builder-${Date.now()}-bad`;
    const create = await request.post("/api/v1/agents/drafts", {
      data: { builderId },
    });
    const draft = await create.json();
    const submit = await request.post(
      `/api/v1/agents/drafts/${draft.id}/submit`,
    );
    expect(submit.status()).toBe(400);
  });
});
