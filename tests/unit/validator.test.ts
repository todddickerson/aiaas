import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { compileBrief } from "@/lib/validator/compile-brief";
import { AGENTS } from "@/lib/seed";

const ENV_KEY = "ANTHROPIC_API_KEY";
const ENV_STUB = "ANTHROPIC_VALIDATOR_STUB";

const FUNNELSMITH = AGENTS.find((a) => a.id === "funnelsmith")!;

describe("compileBrief (stub mode)", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    saved[ENV_KEY] = process.env[ENV_KEY];
    saved[ENV_STUB] = process.env[ENV_STUB];
    delete process.env[ENV_KEY]; // no API key → stub
    delete process.env[ENV_STUB];
  });

  afterEach(() => {
    process.env[ENV_KEY] = saved[ENV_KEY] ?? "";
    process.env[ENV_STUB] = saved[ENV_STUB] ?? "";
  });

  it("rejects briefs shorter than 8 chars", async () => {
    const r = await compileBrief({ agent: FUNNELSMITH, briefText: "no" });
    expect(r.verdict).toBe("rejected");
    expect(r.rejectReason).toMatch(/short/i);
    expect(r.stubbed).toBe(true);
  });

  it("passes a complete-looking brief", async () => {
    const r = await compileBrief({
      agent: FUNNELSMITH,
      briefText:
        "Launching a $97 course on calm productivity. Target: burned-out PMs. Tone: warm + direct.",
    });
    expect(r.verdict).toBe("pass");
    expect(r.stubbed).toBe(true);
  });

  it("asks for clarification on ambiguous short briefs", async () => {
    const r = await compileBrief({
      agent: FUNNELSMITH,
      briefText: "Maybe a funnel? Not sure what.",
    });
    expect(r.verdict).toBe("clarify");
    expect(r.clarifyQuestions.length).toBeGreaterThan(0);
    expect(r.stubbed).toBe(true);
  });

  it("uses stub mode when ANTHROPIC_VALIDATOR_STUB=true even with an API key set", async () => {
    process.env[ENV_KEY] = "sk-test-not-real";
    process.env[ENV_STUB] = "true";
    const r = await compileBrief({
      agent: FUNNELSMITH,
      briefText: "Launching a launch. Make it work.",
    });
    expect(r.stubbed).toBe(true);
  });
});
