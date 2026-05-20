import { expect, test } from "@playwright/test";

test.describe("wallet balance + top-up", () => {
  test("wallet pill renders in the nav with a starting balance", async ({
    page,
  }) => {
    await page.goto("/");
    const pill = page.getByTestId("wallet-balance");
    await expect(pill).toBeVisible();
    // First-time anon visitors start at $0.00 once the balance fetch resolves.
    await expect(page.getByTestId("wallet-balance-amount")).toHaveText("$0.00", {
      timeout: 5_000,
    });
  });

  test("clicking the pill triggers a stub top-up and increments the balance", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("wallet-balance-amount")).toHaveText("$0.00", {
      timeout: 5_000,
    });
    await page.getByTestId("wallet-balance").click();
    // Stub top-up credits $50 (5000 cents).
    await expect(page.getByTestId("wallet-balance-amount")).toHaveText("$50.00", {
      timeout: 5_000,
    });
  });

  test("top-up API is idempotent on repeated keys", async ({ request }) => {
    const userId = `e2e-${Date.now()}`;
    const key = `idem-${userId}-1`;
    const first = await request.post("/api/v1/wallet/top-up", {
      data: { userId, amountCents: 2500, idempotencyKey: key },
    });
    expect(first.status()).toBe(200);
    const firstJson = await first.json();

    const second = await request.post("/api/v1/wallet/top-up", {
      data: { userId, amountCents: 2500, idempotencyKey: key },
    });
    expect(second.status()).toBe(200);
    const secondJson = await second.json();

    expect(secondJson.balanceCents).toBe(firstJson.balanceCents);
  });

  test("balance endpoint guards", async ({ request }) => {
    const missing = await request.get("/api/v1/wallet/balance");
    expect(missing.status()).toBe(400);
  });

  test("top-up endpoint validates the body", async ({ request }) => {
    const noUser = await request.post("/api/v1/wallet/top-up", {
      data: { amountCents: 100 },
    });
    expect(noUser.status()).toBe(400);

    const negative = await request.post("/api/v1/wallet/top-up", {
      data: { userId: "x", amountCents: -100 },
    });
    expect(negative.status()).toBe(400);
  });
});
