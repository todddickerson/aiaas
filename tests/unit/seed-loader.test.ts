import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import { AGENTS } from "@/lib/seed";

const ENV_SAVED: Record<string, string | undefined> = {};

beforeEach(() => {
  ENV_SAVED.URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  ENV_SAVED.KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  vi.resetModules();
});

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = ENV_SAVED.URL ?? "";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ENV_SAVED.KEY ?? "";
});

describe("loadAgents fallback", () => {
  it("returns the bundled JSON catalog when Supabase env vars are missing", async () => {
    const { loadAgents } = await import("@/lib/seed/loader");
    const list = await loadAgents();
    expect(list.length).toBe(AGENTS.length);
    expect(list.map((a) => a.id).sort()).toEqual(
      [...AGENTS].map((a) => a.id).sort(),
    );
  });

  it("loadAgent('funnelsmith') resolves to the Funnelsmith seed entry", async () => {
    const { loadAgent } = await import("@/lib/seed/loader");
    const agent = await loadAgent("funnelsmith");
    expect(agent?.id).toBe("funnelsmith");
    expect(agent?.handle).toBe("@funnelsmith");
    expect(agent?.priceFrom).toBe(79);
  });

  it("loadAgent accepts '@handle' and bare slug", async () => {
    const { loadAgent } = await import("@/lib/seed/loader");
    const byHandle = await loadAgent("@adhook");
    const bySlug = await loadAgent("adhook");
    expect(byHandle?.id).toBe("adhook");
    expect(bySlug?.id).toBe("adhook");
  });

  it("returns undefined for an unknown slug", async () => {
    const { loadAgent } = await import("@/lib/seed/loader");
    expect(await loadAgent("does-not-exist")).toBeUndefined();
  });
});
