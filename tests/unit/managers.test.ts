import { describe, expect, it } from "vitest";

import { AGENTS } from "@/lib/seed";
import { MANAGERS, getManager } from "@/lib/seed/managers";

describe("manager seed integrity", () => {
  it("has unique ids and handles", () => {
    const ids = new Set<string>();
    const handles = new Set<string>();
    for (const m of MANAGERS) {
      expect(ids.has(m.id), `duplicate manager id ${m.id}`).toBe(false);
      expect(handles.has(m.handle), `duplicate handle ${m.handle}`).toBe(false);
      ids.add(m.id);
      handles.add(m.handle);
    }
    expect(MANAGERS.length).toBeGreaterThanOrEqual(2);
  });

  it("every managedId resolves to an agent in the seed", () => {
    const agentIds = new Set(AGENTS.map((a) => a.id));
    for (const m of MANAGERS) {
      for (const id of m.managedIds) {
        expect(agentIds.has(id), `manager ${m.id} → unknown agent ${id}`).toBe(true);
      }
    }
  });

  it("personalAgentId (when set) is also in managedIds", () => {
    for (const m of MANAGERS) {
      if (m.personalAgentId) {
        expect(m.managedIds.includes(m.personalAgentId)).toBe(true);
      }
    }
  });

  it("getManager accepts id, @handle, or bare handle", () => {
    expect(getManager("todd")?.id).toBe("todd");
    expect(getManager("@todd")?.id).toBe("todd");
    expect(getManager("nope")).toBeUndefined();
  });

  it("endorsement.managerId points at a real manager", () => {
    const ids = new Set(MANAGERS.map((m) => m.id));
    for (const m of MANAGERS) {
      for (const e of m.endorsements) {
        expect(ids.has(e.managerId)).toBe(true);
      }
    }
  });
});
