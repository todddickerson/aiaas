import "server-only";

import type { Agent } from "@/lib/types";

export interface RuntimeRunInput {
  agent: Agent;
  briefText: string;
  serviceName: string;
  servicePriceCents: number;
  runId: string;
  /**
   * Called for each intermediate trace event the runtime wants to publish
   * (thoughts, tools, writes, etc). Wired into `run_events` by the orchestrator
   * so the SSE live trace renders them in real time.
   */
  onEvent?: (event: RuntimeTraceEvent) => Promise<void> | void;
}

export interface RuntimeTraceEvent {
  kind:
    | "agent_thought"
    | "agent_tool"
    | "agent_read"
    | "agent_write"
    | "agent_log"
    | "agent_milestone";
  label: string;
  detail?: string;
  artifact?: {
    name: string;
    mime: string;
    preview: string;
  };
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
 * The "mock" runtime — echoes the brief back as deliverables, emitting a
 * believable timeline of thought / tool / write events along the way. Each
 * event becomes a `run_events` row, which the SSE stream fans out to the
 * buyer's live trace UI.
 *
 * The total delay is configurable via MOCK_RUNTIME_DELAY_MS so unit tests
 * don't wait 5 seconds. Per-step delays scale with the total.
 */
const mockRuntime: RuntimeAdapter = {
  key: "mock",
  async invoke(input) {
    const started = Date.now();
    const total = Number(
      process.env.MOCK_RUNTIME_DELAY_MS ?? MOCK_DELAY_MS_DEFAULT,
    );
    const step = Math.max(1, Math.floor(total / 6));

    const previewBase = input.briefText.slice(0, 240);
    const seedDeliverables = input.agent.sampleDeliverables ?? [
      { label: "Strategy summary", kind: "doc" as const },
      { label: "First draft", kind: "doc" as const },
    ];

    const trace: RuntimeTraceEvent[] = [
      {
        kind: "agent_thought",
        label: "parsing brief",
        detail: previewBase.slice(0, 120),
      },
      {
        kind: "agent_read",
        label: "loading context",
        detail: `${input.agent.name} memory · brand voice · past hits`,
      },
      {
        kind: "agent_tool",
        label: `${input.agent.persona} workflow`,
        detail: `service: ${input.serviceName}`,
      },
      {
        kind: "agent_write",
        label: `${seedDeliverables[0]?.label ?? "draft"}.md`,
        detail: "first pass",
        artifact: {
          name: `${(seedDeliverables[0]?.label ?? "draft")
            .toLowerCase()
            .replace(/\W+/g, "-")}.md`,
          mime: "text/markdown",
          preview: `# ${input.agent.name} draft\n\nFor service: ${input.serviceName}\n\nBased on your brief:\n> ${previewBase}`,
        },
      },
      {
        kind: "agent_log",
        label: "self-review pass",
        detail: "tone · voice · claim safety",
      },
      {
        kind: "agent_milestone",
        label: "delivery ready",
      },
    ];

    for (const evt of trace) {
      await delay(step);
      if (input.onEvent) await input.onEvent(evt);
    }

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
