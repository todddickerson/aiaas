import "server-only";

import type { Agent } from "@/lib/types";

export interface RuntimeRunInput {
  agent: Agent;
  briefText: string;
  serviceName: string;
  servicePriceCents: number;
  runId: string;
}

export interface RuntimeDeliverable {
  label: string;
  kind: "doc" | "image" | "copy" | "video" | "data";
  preview?: string;
}

export interface RuntimeRunResult {
  artifacts: RuntimeDeliverable[];
  summary: string;
  durationMs: number;
  runtime: string;
}

interface RuntimeAdapter {
  key: string;
  invoke(input: RuntimeRunInput): Promise<RuntimeRunResult>;
}

const MOCK_DELAY_MS_DEFAULT = 5_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * The "mock" runtime — echoes the brief back as deliverables after a short
 * pause. Used by Slice C tests and by the run orchestrator when no real
 * builder webhook is wired up yet.
 *
 * The delay is configurable via env so unit tests don't wait 5 seconds.
 */
const mockRuntime: RuntimeAdapter = {
  key: "mock",
  async invoke(input) {
    const started = Date.now();
    const delayMs = Number(process.env.MOCK_RUNTIME_DELAY_MS ?? MOCK_DELAY_MS_DEFAULT);
    await delay(delayMs);

    const previewBase = input.briefText.slice(0, 240);
    const seedDeliverables = input.agent.sampleDeliverables ?? [
      { label: "Strategy summary", kind: "doc" as const },
      { label: "First draft", kind: "doc" as const },
    ];
    const artifacts: RuntimeDeliverable[] = seedDeliverables.map((d, i) => ({
      label: d.label,
      kind: d.kind,
      preview:
        i === 0
          ? `# ${input.agent.name} draft\n\nFor service: ${input.serviceName}\n\nBased on your brief:\n> ${previewBase}`
          : undefined,
    }));

    return {
      artifacts,
      summary: `${input.agent.name} delivered ${artifacts.length} artifacts for "${input.serviceName}".`,
      durationMs: Date.now() - started,
      runtime: "mock",
    };
  },
};

const ADAPTERS: Record<string, RuntimeAdapter> = {
  mock: mockRuntime,
};

export function getRuntime(key?: string): RuntimeAdapter {
  if (!key) return mockRuntime;
  return ADAPTERS[key] ?? mockRuntime;
}
