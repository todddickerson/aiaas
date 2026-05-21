import { expect, test } from "@playwright/test";

test.describe("SEO surfaces", () => {
  test("/sitemap.xml lists static + agent + manager URLs", async ({
    request,
  }) => {
    const resp = await request.get("/sitemap.xml");
    expect(resp.status()).toBe(200);
    expect(resp.headers()["content-type"]).toContain("xml");
    const body = await resp.text();
    expect(body).toContain("https://aiaas.com/");
    expect(body).toContain("https://aiaas.com/portfolio");
    expect(body).toContain("https://aiaas.com/trust");
    expect(body).toContain("https://aiaas.com/agents/funnelsmith");
    expect(body).toContain("https://aiaas.com/managers/todd");
  });

  test("/robots.txt disallows buyer-only surfaces", async ({ request }) => {
    const resp = await request.get("/robots.txt");
    expect(resp.status()).toBe(200);
    const body = await resp.text();
    expect(body).toContain("User-Agent: *");
    expect(body).toContain("Disallow: /dashboard");
    expect(body).toContain("Disallow: /publish");
    expect(body).toContain("Sitemap: https://aiaas.com/sitemap.xml");
  });

  test("agent detail emits Product JSON-LD with offers + rating", async ({
    page,
  }) => {
    await page.goto("/agents/funnelsmith");
    const raw = await page
      .getByTestId("agent-jsonld")
      .evaluate((el) => el.textContent ?? "");
    const json = JSON.parse(raw);
    expect(json["@type"]).toBe("Product");
    expect(json.name).toBe("Funnelsmith");
    expect(json.offers["@type"]).toBe("AggregateOffer");
    expect(json.offers.priceCurrency).toBe("USD");
    expect(json.aggregateRating.ratingValue).toBeGreaterThan(0);
    expect(json.url).toBe("https://aiaas.com/agents/funnelsmith");
  });

  test("manager profile emits Person JSON-LD with offers", async ({ page }) => {
    await page.goto("/managers/todd");
    const raw = await page
      .getByTestId("manager-jsonld")
      .evaluate((el) => el.textContent ?? "");
    const json = JSON.parse(raw);
    expect(json["@type"]).toBe("Person");
    expect(json.makesOffer.length).toBeGreaterThan(0);
    expect(json.url).toBe("https://aiaas.com/managers/todd");
  });

  test("portfolio emits CollectionPage JSON-LD with hasPart deliveries", async ({
    page,
  }) => {
    await page.goto("/portfolio");
    const raw = await page
      .getByTestId("portfolio-jsonld")
      .evaluate((el) => el.textContent ?? "");
    const json = JSON.parse(raw);
    expect(json["@type"]).toBe("CollectionPage");
    expect(json.hasPart.length).toBeGreaterThan(0);
  });

  test("trust page emits WebPage JSON-LD", async ({ page }) => {
    await page.goto("/trust");
    const raw = await page
      .getByTestId("trust-jsonld")
      .evaluate((el) => el.textContent ?? "");
    const json = JSON.parse(raw);
    expect(json["@type"]).toBe("WebPage");
    expect(json.url).toBe("https://aiaas.com/trust");
  });
});
