import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  captureException,
  captureMessage,
  isEnabled,
} from "@/lib/observability/sentry";

const ENV_SAVED: Record<string, string | undefined> = {};

beforeEach(() => {
  ENV_SAVED.DSN = process.env.SENTRY_DSN;
  ENV_SAVED.PUB = process.env.NEXT_PUBLIC_SENTRY_DSN;
  delete process.env.SENTRY_DSN;
  delete process.env.NEXT_PUBLIC_SENTRY_DSN;
});

afterEach(() => {
  process.env.SENTRY_DSN = ENV_SAVED.DSN ?? "";
  process.env.NEXT_PUBLIC_SENTRY_DSN = ENV_SAVED.PUB ?? "";
});

describe("sentry shim", () => {
  it("isEnabled returns false when no DSN is set", () => {
    expect(isEnabled()).toBe(false);
  });

  it("isEnabled returns true when SENTRY_DSN is set", () => {
    process.env.SENTRY_DSN = "https://stub@example.com/1";
    expect(isEnabled()).toBe(true);
  });

  it("captureException without a DSN logs to console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    captureException(new Error("boom"), { tags: { x: "y" } });
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toContain("[sentry-stub]");
    spy.mockRestore();
  });

  it("captureMessage wraps a string in an Error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    captureMessage("brief validator timed out", { severity: "warning" });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
