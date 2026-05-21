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

    // Submit (auto-publishes for alpha)
    const submit = await request.post(
      `/api/v1/agents/drafts/${draft.id}/submit`,
    );
    expect(submit.status()).toBe(200);
    expect((await submit.json()).publishStatus).toBe("live");
  });

  test("API: create-agent-from-scratch → hire → deliver round-trip", async ({
    request,
  }) => {
    const builderId = `e2e-publish-hire-${Date.now()}`;
    const slug = `e2epublish-${Date.now().toString(36)}`;

    // 1. Draft
    const create = await request.post("/api/v1/agents/drafts", {
      data: { builderId, name: "E2E Publish Hire", category: "ads" },
    });
    expect(create.status()).toBe(200);
    const draft = await create.json();

    // 2. Patch with a complete spec + slug + services + pricing
    const patch = await request.patch(`/api/v1/agents/drafts/${draft.id}`, {
      data: {
        slug,
        persona: "Test direct-response writer",
        tagline: "Ships 5 hooks for any offer in under 4 minutes.",
        specText:
          "Writes 5 cold-traffic ad hooks for a $79 offer aimed at burned-out founders. Inputs: offer summary + target audience description. Each run ships ad copy to Slack.",
        runtime: "mock",
        destinations: ["slack"],
        priceFromCents: 4900,
        priceMaxCents: 9900,
        services: [
          { name: "5 hooks", price: 49, time: "4 min" },
        ],
      },
    });
    expect(patch.status()).toBe(200);

    // 3. Compile
    const compile = await request.post(
      `/api/v1/agents/drafts/${draft.id}/compile`,
    );
    expect(compile.status()).toBe(200);
    expect((await compile.json()).compile.status).toBe("ready");

    // 4. Link payee
    const payee = await request.post(
      `/api/v1/agents/drafts/${draft.id}/payee`,
      { data: {} },
    );
    expect(payee.status()).toBe(200);

    // 5. Submit → live
    const submit = await request.post(
      `/api/v1/agents/drafts/${draft.id}/submit`,
    );
    expect(submit.status()).toBe(200);
    const submitJson = await submit.json();
    expect(submitJson.publishStatus).toBe("live");
    expect(submitJson.publishedAgentId).toBe(slug);

    // 6. New agent shows up on the public detail page
    const detail = await request.get(`/agents/${slug}`);
    expect(detail.status()).toBe(200);
    const html = await detail.text();
    expect(html).toContain("E2E Publish Hire");

    // 7. Top-up + hire the freshly published agent → delivered
    const userId = `e2e-publish-buyer-${Date.now()}`;
    await request.post("/api/v1/wallet/top-up", {
      data: { userId, amountCents: 20000, idempotencyKey: `topup-${userId}` },
    });
    const run = await request.post("/api/v1/runs/create", {
      data: {
        userId,
        agentSlug: slug,
        briefText:
          "Need 5 cold-traffic hooks for our $79 founder course on calm productivity. Audience: burned-out PMs.",
        serviceName: "5 hooks",
        servicePriceCents: 4900,
        idempotencyKey: `run-${userId}`,
      },
    });
    expect(run.status()).toBe(200);
    const runJson = await run.json();
    expect(runJson.status).toBe("delivered");
    expect(runJson.artifacts.length).toBeGreaterThan(0);
  });

  test("/developers page renders hero + quickstart + CTA", async ({ page }) => {
    await page.goto("/developers");
    await expect(page.getByTestId("developers-page")).toBeVisible();
    await expect(page.getByTestId("developers-hero")).toContainText(
      /six calls/i,
    );
    await expect(page.getByTestId("developers-quickstart")).toBeVisible();
    await expect(page.getByTestId("developers-cta-publish")).toHaveAttribute(
      "href",
      "/publish",
    );
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
