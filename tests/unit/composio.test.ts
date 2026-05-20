import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { _internal, invokeComposio } from "@/lib/composio/client";

const ENV_SAVED: Record<string, string | undefined> = {};

beforeEach(() => {
  ENV_SAVED.KEY = process.env.COMPOSIO_API_KEY;
  ENV_SAVED.STUB = process.env.COMPOSIO_STUB;
  delete process.env.COMPOSIO_API_KEY;
  delete process.env.COMPOSIO_STUB;
});

afterEach(() => {
  process.env.COMPOSIO_API_KEY = ENV_SAVED.KEY ?? "";
  process.env.COMPOSIO_STUB = ENV_SAVED.STUB ?? "";
});

describe("Composio client stub mode", () => {
  it("isStubMode true when no key + no override", () => {
    expect(_internal.isStubMode()).toBe(true);
  });

  it("isStubMode true when COMPOSIO_STUB=true overrides a key", () => {
    process.env.COMPOSIO_API_KEY = "cs_test_not_real";
    process.env.COMPOSIO_STUB = "true";
    expect(_internal.isStubMode()).toBe(true);
  });

  it("slack stub returns a deterministic message payload", async () => {
    const r = await invokeComposio({
      tool: "slack",
      method: "send_message",
      payload: { channel: "#general", text: "hello" },
      idempotencyKey: "k1",
    });
    expect(r.ok).toBe(true);
    expect(r.stubbed).toBe(true);
    expect(r.statusCode).toBe(200);
    expect(r.data.channel).toBe("#general");
    expect(r.data.message).toMatchObject({ text: "hello" });
  });

  it("gmail stub returns a stable id derived from the idempotency key", async () => {
    const a = await invokeComposio({
      tool: "gmail",
      method: "send",
      payload: { to: "x@y.com", subject: "hi" },
      idempotencyKey: "k1",
    });
    const b = await invokeComposio({
      tool: "gmail",
      method: "send",
      payload: { to: "x@y.com", subject: "hi" },
      idempotencyKey: "k1",
    });
    expect(a.data.id).toBe(b.data.id);
  });

  it("unknown tools fall through to an echo stub", async () => {
    const r = await invokeComposio({
      tool: "weird",
      method: "do_thing",
      payload: { x: 1 },
    });
    expect(r.ok).toBe(true);
    expect(r.data.echo).toEqual({ x: 1 });
    expect(r.data.stub_note).toMatch(/stub/i);
  });

  it("notion stub returns a page-shaped payload", async () => {
    const r = await invokeComposio({
      tool: "notion",
      method: "create_page",
      payload: { properties: { Title: "Test" } },
      idempotencyKey: "n1",
    });
    expect(r.data.object).toBe("page");
    expect(r.data.url).toMatch(/notion/);
  });
});
