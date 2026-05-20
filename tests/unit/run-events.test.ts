import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  _resetEventStores,
  appendRunEvent,
  listRunEvents,
  subscribeToRunEvents,
} from "@/lib/runs/events";

const ENV_SAVED: Record<string, string | undefined> = {};

beforeEach(() => {
  ENV_SAVED.URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  ENV_SAVED.KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  _resetEventStores();
});

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = ENV_SAVED.URL ?? "";
  process.env.SUPABASE_SERVICE_ROLE_KEY = ENV_SAVED.KEY ?? "";
});

describe("run_events (in-memory)", () => {
  it("appends and lists events in order", async () => {
    await appendRunEvent({ runId: "r1", kind: "queued" });
    await appendRunEvent({ runId: "r1", kind: "running" });
    await appendRunEvent({ runId: "r1", kind: "delivered" });
    const events = await listRunEvents("r1");
    expect(events.map((e) => e.kind)).toEqual(["queued", "running", "delivered"]);
  });

  it("scopes events per run", async () => {
    await appendRunEvent({ runId: "r1", kind: "queued" });
    await appendRunEvent({ runId: "r2", kind: "queued" });
    const r1 = await listRunEvents("r1");
    const r2 = await listRunEvents("r2");
    expect(r1).toHaveLength(1);
    expect(r2).toHaveLength(1);
  });

  it("subscribers receive events after subscription", async () => {
    const received: string[] = [];
    const unsubscribe = subscribeToRunEvents("r1", (e) => {
      received.push(e.kind);
    });
    await appendRunEvent({ runId: "r1", kind: "queued" });
    await appendRunEvent({ runId: "r1", kind: "running" });
    unsubscribe();
    await appendRunEvent({ runId: "r1", kind: "delivered" });
    expect(received).toEqual(["queued", "running"]);
  });

  it("unsubscribe stops further deliveries", async () => {
    const received: string[] = [];
    const unsubscribe = subscribeToRunEvents("r1", (e) => received.push(e.kind));
    await appendRunEvent({ runId: "r1", kind: "queued" });
    unsubscribe();
    await appendRunEvent({ runId: "r1", kind: "running" });
    expect(received).toEqual(["queued"]);
  });
});
