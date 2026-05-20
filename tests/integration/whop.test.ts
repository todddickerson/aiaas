import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Integration test against the real Whop API. SKIPPED automatically when
// neither WHOP_API_KEY/WHOP_AIAAS_API_KEY nor WHOP_BIZ_ID/WHOP_AIAAS_BIZ_ID
// is set, which is the case in CI and on fresh dev machines. To run it
// locally: copy WHOP_AIAAS_API_KEY + WHOP_AIAAS_BIZ_ID from ~/clawd/.env
// into the shell (or into .env.local).

const hasCreds = Boolean(
  (process.env.WHOP_API_KEY || process.env.WHOP_AIAAS_API_KEY) &&
    (process.env.WHOP_BIZ_ID || process.env.WHOP_AIAAS_BIZ_ID),
);

describe.skipIf(!hasCreds)("Whop REST v1 — real API", () => {
  const SAVED_STUB = process.env.WHOP_STUB;

  beforeEach(() => {
    // Force the client out of stub mode for this test even if the dev
    // shell happens to have WHOP_STUB=true.
    delete process.env.WHOP_STUB;
  });

  afterEach(() => {
    if (SAVED_STUB !== undefined) process.env.WHOP_STUB = SAVED_STUB;
  });

  it('getCompany(biz_9fbStuuVdEBhN9) returns the AIaaS biz with title "AIaaS"', async () => {
    const { getCompany } = await import("@/lib/whop/client");
    const expectedBiz =
      process.env.WHOP_BIZ_ID || process.env.WHOP_AIAAS_BIZ_ID || "";
    const company = await getCompany(expectedBiz);
    expect(company.id).toBe(expectedBiz);
    expect(company.title).toBe("AIaaS");
  });

  it("listPayments returns a shape with a data array", async () => {
    const { listPayments } = await import("@/lib/whop/client");
    const result = await listPayments({ first: 1 });
    expect(Array.isArray(result.payments)).toBe(true);
  });
});

// Always-on (non-integration) checks that the client's shape is callable
// and that NotConfigured fires when env is missing.
describe("Whop client — config guards", () => {
  const SAVED: Record<string, string | undefined> = {};

  beforeEach(() => {
    SAVED.KEY = process.env.WHOP_API_KEY;
    SAVED.AIAAS_KEY = process.env.WHOP_AIAAS_API_KEY;
    SAVED.BIZ = process.env.WHOP_BIZ_ID;
    SAVED.AIAAS_BIZ = process.env.WHOP_AIAAS_BIZ_ID;
    SAVED.STUB = process.env.WHOP_STUB;
    delete process.env.WHOP_API_KEY;
    delete process.env.WHOP_AIAAS_API_KEY;
    delete process.env.WHOP_BIZ_ID;
    delete process.env.WHOP_AIAAS_BIZ_ID;
    delete process.env.WHOP_STUB;
  });

  afterEach(() => {
    process.env.WHOP_API_KEY = SAVED.KEY ?? "";
    process.env.WHOP_AIAAS_API_KEY = SAVED.AIAAS_KEY ?? "";
    process.env.WHOP_BIZ_ID = SAVED.BIZ ?? "";
    process.env.WHOP_AIAAS_BIZ_ID = SAVED.AIAAS_BIZ ?? "";
    process.env.WHOP_STUB = SAVED.STUB ?? "";
  });

  it("getCompany throws WhopNotConfiguredError when key is missing", async () => {
    const { getCompany, WhopNotConfiguredError } = await import(
      "@/lib/whop/client"
    );
    await expect(getCompany("biz_anything")).rejects.toBeInstanceOf(
      WhopNotConfiguredError,
    );
  });

  it("listPayments throws WhopNotConfiguredError when biz is missing", async () => {
    process.env.WHOP_API_KEY = "sk_test_not_real";
    const { listPayments, WhopNotConfiguredError } = await import(
      "@/lib/whop/client"
    );
    await expect(listPayments()).rejects.toBeInstanceOf(WhopNotConfiguredError);
  });

  it("getBizInfo returns the stub fallback when stub mode is active", async () => {
    const { getBizInfo } = await import("@/lib/whop/biz-info");
    const info = await getBizInfo();
    expect(info.stubbed).toBe(true);
    expect(info.title).toBe("AIaaS");
  });
});
