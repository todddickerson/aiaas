import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  _resetScheduleStore,
  cancelSchedule,
  createSchedule,
  fireSchedule,
  getSchedule,
  listSchedules,
} from "@/lib/schedules/service";
import {
  _resetMemoryStores as resetRunStores,
} from "@/lib/runs/service";
import {
  _resetMemoryStores as resetWalletStores,
  topUp,
} from "@/lib/wallet/service";

const ENV_SAVED: Record<string, string | undefined> = {};
const USER = "user_sched_1";

beforeEach(() => {
  ENV_SAVED.URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  ENV_SAVED.KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  ENV_SAVED.ANTHROPIC = process.env.ANTHROPIC_API_KEY;
  ENV_SAVED.MOCK_DELAY = process.env.MOCK_RUNTIME_DELAY_MS;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  process.env.MOCK_RUNTIME_DELAY_MS = "5";
  _resetScheduleStore();
  resetRunStores();
  resetWalletStores();
});

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = ENV_SAVED.URL ?? "";
  process.env.SUPABASE_SERVICE_ROLE_KEY = ENV_SAVED.KEY ?? "";
  process.env.ANTHROPIC_API_KEY = ENV_SAVED.ANTHROPIC ?? "";
  process.env.MOCK_RUNTIME_DELAY_MS = ENV_SAVED.MOCK_DELAY ?? "";
});

describe("schedules service", () => {
  it("createSchedule persists fields + computes nextFireAt", async () => {
    const sched = await createSchedule({
      userId: USER,
      agentSlug: "newsletterdraft",
      cadence: "weekly",
      serviceName: "One-off newsletter draft",
      servicePriceCents: 2900,
      briefTemplate:
        "Weekly digest for our calm-productivity audience. Tone: warm + direct.",
    });
    expect(sched.status).toBe("active");
    expect(sched.fireCount).toBe(0);
    expect(sched.nextFireAt).toBeGreaterThan(Date.now());
    // weekly = ~7 days out
    expect(sched.nextFireAt! - Date.now()).toBeGreaterThan(6 * 24 * 60 * 60_000);
  });

  it("listSchedules returns the user's schedules", async () => {
    await createSchedule({
      userId: USER,
      agentSlug: "newsletterdraft",
      cadence: "weekly",
      serviceName: "Weekly draft",
      servicePriceCents: 2900,
      briefTemplate: "x",
    });
    await createSchedule({
      userId: "other-user",
      agentSlug: "funnelsmith",
      cadence: "monthly",
      serviceName: "Monthly funnel",
      servicePriceCents: 7900,
      briefTemplate: "y",
    });
    const mine = await listSchedules(USER);
    expect(mine).toHaveLength(1);
    expect(mine[0].userId).toBe(USER);
  });

  it("cancelSchedule flips status to cancelled", async () => {
    const sched = await createSchedule({
      userId: USER,
      agentSlug: "newsletterdraft",
      cadence: "weekly",
      serviceName: "Weekly",
      servicePriceCents: 2900,
      briefTemplate: "x",
    });
    const out = await cancelSchedule(sched.id);
    expect(out?.status).toBe("cancelled");
    const refreshed = await getSchedule(sched.id);
    expect(refreshed?.status).toBe("cancelled");
  });

  it("fireSchedule creates a run + increments fireCount", async () => {
    await topUp({
      userId: USER,
      amountCents: 20000,
      idempotencyKey: "topup-sched",
    });
    const sched = await createSchedule({
      userId: USER,
      agentSlug: "newsletterdraft",
      cadence: "weekly",
      serviceName: "One-off newsletter draft",
      servicePriceCents: 2900,
      briefTemplate:
        "Weekly newsletter draft for our calm-productivity audience. Required inputs: topic + past hits. Tone: warm and direct.",
    });
    const run = await fireSchedule(sched.id);
    expect(run.status).toBe("delivered");
    const after = await getSchedule(sched.id);
    expect(after?.fireCount).toBe(1);
    expect(after?.lastFiredAt).toBeTruthy();
  });

  it("fireSchedule refuses non-active schedules", async () => {
    const sched = await createSchedule({
      userId: USER,
      agentSlug: "newsletterdraft",
      cadence: "weekly",
      serviceName: "Weekly",
      servicePriceCents: 2900,
      briefTemplate: "x",
    });
    await cancelSchedule(sched.id);
    await expect(fireSchedule(sched.id)).rejects.toThrow(/not active/);
  });
});
