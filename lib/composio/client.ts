import "server-only";

// Composio v3 adapter. The surface we expose to builders is OUR shape
// (`/api/v1/proxy/:tool/:method`), so this client is intentionally minimal —
// it just maps tool+method+payload to a Composio v3 call. Swapping in a
// different integration vendor later means replacing this file, nothing else.

export interface ComposioInvokeInput {
  tool: string;
  method: string;
  payload: Record<string, unknown>;
  entityId?: string;
  idempotencyKey?: string;
}

export interface ComposioInvokeResult {
  ok: boolean;
  statusCode: number;
  data: Record<string, unknown>;
  durationMs: number;
  stubbed: boolean;
  error?: string;
}

const API_BASE = "https://backend.composio.dev/api/v3";

function isStubMode(): boolean {
  return !process.env.COMPOSIO_API_KEY || process.env.COMPOSIO_STUB === "true";
}

interface StubHandler {
  match: (tool: string, method: string) => boolean;
  invoke: (input: ComposioInvokeInput) => Record<string, unknown>;
}

const STUB_HANDLERS: StubHandler[] = [
  {
    // slack.send_message — return a deterministic stub message id.
    match: (tool, method) => tool === "slack" && /send|post|message/.test(method),
    invoke: (input) => {
      const channel = String(input.payload.channel ?? "#unknown");
      const text = String(input.payload.text ?? "");
      return {
        ok: true,
        channel,
        ts: `${Date.now() / 1000}`,
        message: { text, channel, type: "message" },
        stub_note: "AIaaS Composio stub — no real Slack call made.",
      };
    },
  },
  {
    match: (tool) => tool === "gmail" || tool === "email",
    invoke: (input) => ({
      ok: true,
      id: `stub-msg-${stableId(input)}`,
      to: input.payload.to,
      subject: input.payload.subject,
      labels: ["SENT", "AIAAS_STUB"],
    }),
  },
  {
    match: (tool) => tool === "notion",
    invoke: (input) => ({
      ok: true,
      object: "page",
      id: `stub-page-${stableId(input)}`,
      url: "https://notion.so/stub",
      properties: input.payload.properties ?? {},
    }),
  },
];

function stableId(input: ComposioInvokeInput): string {
  const key = input.idempotencyKey ?? `${input.tool}:${input.method}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function fallbackStub(input: ComposioInvokeInput): Record<string, unknown> {
  return {
    ok: true,
    echo: input.payload,
    stub_note: `AIaaS Composio stub — no real call made for ${input.tool}.${input.method}.`,
  };
}

export async function invokeComposio(
  input: ComposioInvokeInput,
): Promise<ComposioInvokeResult> {
  const started = Date.now();

  if (isStubMode()) {
    const handler = STUB_HANDLERS.find((h) => h.match(input.tool, input.method));
    const data = handler ? handler.invoke(input) : fallbackStub(input);
    return {
      ok: true,
      statusCode: 200,
      data,
      durationMs: Date.now() - started,
      stubbed: true,
    };
  }

  // Real Composio call. v3 uses POST to /actions/execute with a tool slug like
  // "slack:send_message". We pre-compose that here so the public surface still
  // looks like `/proxy/slack/send_message`.
  const headers: Record<string, string> = {
    Authorization: `Bearer ${process.env.COMPOSIO_API_KEY}`,
    "Content-Type": "application/json",
  };
  if (input.idempotencyKey) {
    headers["Idempotency-Key"] = input.idempotencyKey;
  }

  try {
    const res = await fetch(`${API_BASE}/actions/execute`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: `${input.tool}:${input.method}`,
        entity_id: input.entityId,
        parameters: input.payload,
      }),
    });
    const text = await res.text();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      parsed = { raw: text };
    }
    return {
      ok: res.ok,
      statusCode: res.status,
      data: parsed,
      durationMs: Date.now() - started,
      stubbed: false,
      error: res.ok ? undefined : `Composio ${input.tool}.${input.method} → ${res.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      statusCode: 502,
      data: {},
      durationMs: Date.now() - started,
      stubbed: false,
      error: err instanceof Error ? err.message : "Composio call threw.",
    };
  }
}

export const _internal = { isStubMode, stableId };
