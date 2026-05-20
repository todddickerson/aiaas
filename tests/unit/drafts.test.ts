import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  _resetMemoryStores as resetDraftStores,
  compileDraftSpec,
  createDraft,
  getDraft,
  linkWhopPayee,
  submitDraft,
  updateDraft,
} from "@/lib/drafts/service";

const ENV_SAVED: Record<string, string | undefined> = {};

beforeEach(() => {
  ENV_SAVED.URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  ENV_SAVED.KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  ENV_SAVED.ANTHROPIC = process.env.ANTHROPIC_API_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  resetDraftStores();
});

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = ENV_SAVED.URL ?? "";
  process.env.SUPABASE_SERVICE_ROLE_KEY = ENV_SAVED.KEY ?? "";
  process.env.ANTHROPIC_API_KEY = ENV_SAVED.ANTHROPIC ?? "";
});

describe("agent_drafts (in-memory)", () => {
  it("creates and reads a draft", async () => {
    const draft = await createDraft({ builderId: "u1", name: "Test" });
    expect(draft.name).toBe("Test");
    expect(draft.specStatus).toBe("draft");
    expect(draft.whopPayeeStatus).toBe("pending");
    expect(draft.publishStatus).toBe("draft");
    const fetched = await getDraft(draft.id);
    expect(fetched?.id).toBe(draft.id);
  });

  it("updateDraft persists field changes", async () => {
    const draft = await createDraft({ builderId: "u1" });
    const updated = await updateDraft(draft.id, {
      tagline: "Sharp tagline",
      runtime: "anthropic-claude-opus",
    });
    expect(updated?.tagline).toBe("Sharp tagline");
    expect(updated?.runtime).toBe("anthropic-claude-opus");
  });

  it("compileDraftSpec rejects very short specs", async () => {
    const draft = await createDraft({ builderId: "u1" });
    await updateDraft(draft.id, { specText: "tiny" });
    const out = await compileDraftSpec(draft.id);
    expect(out?.result.status).toBe("rejected");
    expect(out?.draft.specStatus).toBe("rejected");
  });

  it("compileDraftSpec marks ready when the stub heuristics match", async () => {
    const draft = await createDraft({ builderId: "u1" });
    await updateDraft(draft.id, {
      specText:
        "Funnelsmith ships a $79 funnel teardown for non-technical founders. Inputs: offer details and audience. Delivers a hook bank + 6-email indoctrination sequence.",
    });
    const out = await compileDraftSpec(draft.id);
    expect(out?.result.status).toBe("ready");
    expect(out?.draft.specStatus).toBe("ready");
    expect(out?.result.summary?.length).toBeGreaterThan(0);
  });

  it("compileDraftSpec asks for revisions when key pieces are missing", async () => {
    const draft = await createDraft({ builderId: "u1" });
    await updateDraft(draft.id, {
      specText:
        "An agent that helps with stuff. Just throw a brief at it and it does the thing.",
    });
    const out = await compileDraftSpec(draft.id);
    expect(out?.result.status).toBe("needs_revision");
    expect(out?.result.questions.length).toBeGreaterThan(0);
  });

  it("submitDraft requires a ready spec + linked payee", async () => {
    const draft = await createDraft({ builderId: "u1" });
    await updateDraft(draft.id, { specText: "too short" });
    await expect(submitDraft(draft.id)).rejects.toThrow(/spec must be compiled/i);

    // ready spec, no payee yet → still rejected
    await updateDraft(draft.id, {
      specText:
        "Ships a $79 funnel teardown for non-technical founders. Inputs: offer details and audience. Delivers a hook bank.",
    });
    await compileDraftSpec(draft.id);
    await expect(submitDraft(draft.id)).rejects.toThrow(/payee must be linked/i);

    // link the payee → submit succeeds
    await linkWhopPayee(draft.id, "payee_test_1");
    const submitted = await submitDraft(draft.id);
    expect(submitted?.publishStatus).toBe("submitted");
  });

  it("linkWhopPayee flips status to linked", async () => {
    const draft = await createDraft({ builderId: "u1" });
    const linked = await linkWhopPayee(draft.id, "payee_xyz");
    expect(linked?.whopPayeeStatus).toBe("linked");
    expect(linked?.whopPayeeId).toBe("payee_xyz");
  });
});
