"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

interface RunEventPayload {
  label?: string;
  detail?: string;
  artifact?: {
    name: string;
    mime: string;
    preview: string;
  };
  tool?: string;
  method?: string;
  target?: Record<string, string>;
  [key: string]: unknown;
}

interface RunEvent {
  id: string;
  runId: string;
  kind: string;
  payload: RunEventPayload;
  createdAt: number;
}

type KindMeta = { glyph: string; color: string };

function destinationLabel(event: RunEvent): string | null {
  const { kind, payload } = event;
  if (!payload?.tool || !payload?.method) return null;
  if (kind === "destination_dispatched") {
    return `dispatch → ${payload.tool}.${payload.method}`;
  }
  if (kind === "destination_delivered") {
    return `delivered → ${payload.tool}.${payload.method}`;
  }
  if (kind === "destination_failed") {
    return `delivery failed → ${payload.tool}.${payload.method}`;
  }
  if (kind === "proxy_scope_denied") {
    return `scope denied → ${payload.tool}.${payload.method}`;
  }
  return null;
}

function destinationDetail(event: RunEvent): string | undefined {
  const target = event.payload?.target;
  if (!target) return undefined;
  return Object.entries(target)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}

const KIND_META: Record<string, KindMeta> = {
  agent_tool: { glyph: "∘", color: "#8b93a8" },
  agent_shell: { glyph: "$", color: "#8b93a8" },
  agent_read: { glyph: "←", color: "#6b8fd4" },
  agent_write: { glyph: "→", color: "#3fb68b" },
  agent_log: { glyph: "·", color: "#6b7385" },
  agent_thought: { glyph: "~", color: "#b7a76b" },
  agent_milestone: { glyph: "●", color: "#d97757" },
  agent_invoked: { glyph: "●", color: "#d97757" },
  agent_returned: { glyph: "●", color: "#d97757" },
  queued: { glyph: "●", color: "#6b7385" },
  validating: { glyph: "~", color: "#b7a76b" },
  validation_passed: { glyph: "✓", color: "#3fb68b" },
  validation_blocked: { glyph: "!", color: "#d97757" },
  holding: { glyph: "~", color: "#b7a76b" },
  hold_open: { glyph: "→", color: "#3fb68b" },
  running: { glyph: "●", color: "#3fb68b" },
  delivered: { glyph: "●", color: "#3fb68b" },
  accepted: { glyph: "✓", color: "#3fb68b" },
  failed: { glyph: "✗", color: "#d97757" },
  destination_dispatched: { glyph: "↗", color: "#6b8fd4" },
  destination_delivered: { glyph: "✓", color: "#3fb68b" },
  destination_failed: { glyph: "✗", color: "#d97757" },
  proxy_scope_denied: { glyph: "⌧", color: "#d97757" },
};

export interface LiveTraceProps {
  runId: string;
  agentHandle: string;
  /** Override the SSE endpoint (defaults to `/api/v1/runs/[id]/events`). */
  endpoint?: string;
}

export function LiveTrace({ runId, agentHandle, endpoint }: LiveTraceProps) {
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [done, setDone] = useState<string | null>(null);
  const [openArtifact, setOpenArtifact] = useState<
    RunEventPayload["artifact"] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const streamUrl = endpoint ?? `/api/v1/runs/${runId}/events`;

  // Anchor "0s" to the first event we see. Computed during render so React's
  // hook rules don't fire — and SSR-safe because `events` starts empty.
  const startedAt = events.length > 0 ? events[0].createdAt : 0;

  useEffect(() => {
    const source = new EventSource(streamUrl);
    source.addEventListener("run_event", (e) => {
      try {
        const event = JSON.parse((e as MessageEvent).data) as RunEvent;
        setEvents((prev) => [...prev, event]);
      } catch {
        // ignore malformed payloads
      }
    });
    source.addEventListener("done", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as { status: string };
        setDone(data.status);
      } catch {
        setDone("done");
      }
      source.close();
    });
    source.onerror = () => {
      setError("Trace connection dropped. Retrying…");
    };
    return () => {
      source.close();
    };
  }, [streamUrl]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events.length]);

  const writeEvents = useMemo(
    () => events.filter((e) => e.payload.artifact),
    [events],
  );

  const elapsedSecs = (ts: number) => {
    const base = startedAt || ts;
    return Math.max(0, (ts - base) / 1000).toFixed(1);
  };

  return (
    <div data-testid="live-trace" data-run-id={runId} className="w-full">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block size-2 rounded-full"
            style={{
              background: done ? "#6b7385" : "#3fb68b",
              boxShadow: done ? undefined : "0 0 0 0 rgba(63,182,139,0.5)",
              animation: done ? undefined : "lt-pulse 1.6s ease-out infinite",
            }}
          />
          <span
            className="text-[10px] uppercase tracking-[1.2px] text-muted-foreground"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {done
              ? `Stream ${done} · ${agentHandle.toUpperCase()}`
              : `Live · streaming from ${agentHandle.toUpperCase()}`}
          </span>
        </div>
        <div
          className="text-[11px] text-muted-foreground"
          style={{ fontFamily: "var(--font-mono)" }}
          data-testid="trace-event-count"
        >
          {events.length} events
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border" style={{ borderColor: "#1f2430", background: "#0f1115" }}>
        <div
          className="flex items-center gap-2 border-b px-3.5 py-2 text-[11px]"
          style={{ borderColor: "#1f2430", fontFamily: "var(--font-mono)", color: "#6b7385" }}
        >
          <span className="size-2.5 rounded-full" style={{ background: "#3a3f4d" }} />
          <span className="size-2.5 rounded-full" style={{ background: "#3a3f4d" }} />
          <span className="size-2.5 rounded-full" style={{ background: "#3a3f4d" }} />
          <span className="ml-2">trace · {runId}</span>
          <span className="ml-auto">stream_progress v1</span>
        </div>

        <div
          ref={scrollRef}
          data-testid="trace-events"
          className="overflow-y-auto px-3.5 py-3 text-[12px] leading-relaxed"
          style={{
            maxHeight: 280,
            color: "#d4d8e0",
            fontFamily: "var(--font-mono)",
          }}
        >
          {events.length === 0 && !error && (
            <div className="text-muted-foreground">Waiting for events…</div>
          )}
          {error && <div style={{ color: "#d97757" }}>{error}</div>}
          {events.map((event) => {
            const meta = KIND_META[event.kind] ?? KIND_META.agent_log;
            const labelOverride = destinationLabel(event);
            const label = labelOverride ?? event.payload.label ?? event.kind;
            const detail = labelOverride
              ? destinationDetail(event)
              : event.payload.detail;
            const isWrite = Boolean(event.payload.artifact);
            return (
              <div
                key={event.id}
                data-testid="trace-event"
                data-kind={event.kind}
                className="flex items-baseline gap-2.5 fade-in-up"
                onClick={() => {
                  if (event.payload.artifact) setOpenArtifact(event.payload.artifact);
                }}
                style={{ cursor: isWrite ? "pointer" : "default" }}
              >
                <span style={{ color: "#4a5060", minWidth: 38 }}>
                  {elapsedSecs(event.createdAt)}s
                </span>
                <span style={{ color: meta.color, minWidth: 12, textAlign: "center" }}>
                  {meta.glyph}
                </span>
                <span className="flex-1">
                  {isWrite ? (
                    <span
                      className="inline-flex items-center gap-1.5 rounded px-2 py-[1px]"
                      style={{
                        background: "rgba(63,182,139,0.12)",
                        border: "1px solid rgba(63,182,139,0.28)",
                        color: "#6ed0a8",
                      }}
                    >
                      wrote {String(label)}
                      <span className="text-[10px] opacity-70">↗ preview</span>
                    </span>
                  ) : (
                    <span
                      style={{
                        color: event.kind.includes("milestone") || event.kind === "delivered"
                          ? "#e8b48a"
                          : "#d4d8e0",
                      }}
                    >
                      {String(label)}
                    </span>
                  )}
                  {detail && (
                    <div className="text-[11px]" style={{ color: "#6b7385" }}>
                      {String(detail)}
                    </div>
                  )}
                </span>
              </div>
            );
          })}
          {!done && (
            <div
              aria-hidden
              className="mt-1 inline-block size-[10px]"
              style={{ background: "#3fb68b", animation: "lt-blink 1s steps(2) infinite" }}
            />
          )}
        </div>

        {writeEvents.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-1.5 border-t px-3.5 py-2.5"
            style={{ borderColor: "#1f2430", background: "#0b0d12" }}
            data-testid="artifact-chips"
          >
            <span
              className="mr-1 text-[10px] tracking-[1px]"
              style={{ color: "#4a5060", fontFamily: "var(--font-mono)" }}
            >
              ARTIFACTS
            </span>
            {writeEvents.map((event) => {
              const artifact = event.payload.artifact!;
              const active = openArtifact?.name === artifact.name;
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setOpenArtifact(artifact)}
                  data-testid="artifact-chip"
                  className="rounded px-2 py-1 text-[11px] transition-colors"
                  style={{
                    background: active ? "var(--accent)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${active ? "var(--accent)" : "#1f2430"}`,
                    color: active ? "#fff" : "#9ea5b5",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {artifact.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {openArtifact && (
        <div
          className="mt-3 overflow-hidden rounded-lg border border-border bg-card"
          data-testid="artifact-preview"
        >
          <div className="flex items-center gap-2.5 border-b border-border bg-secondary px-3.5 py-2">
            <span
              className="text-[10px] uppercase tracking-[1px] text-muted-foreground"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Preview
            </span>
            <span
              className="text-[12px] font-semibold text-foreground"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {openArtifact.name}
            </span>
            <span
              className="text-[10px] text-muted-foreground"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {openArtifact.mime}
            </span>
            <button
              type="button"
              onClick={() => setOpenArtifact(null)}
              className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              aria-label="Close preview"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
          <pre
            className="m-0 max-h-64 overflow-auto whitespace-pre-wrap break-words px-4 py-3.5 text-[12px] leading-relaxed text-foreground"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {openArtifact.preview}
          </pre>
        </div>
      )}

      <style>{`
        @keyframes lt-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(63,182,139,0.5); }
          100% { box-shadow: 0 0 0 8px rgba(63,182,139,0); }
        }
        @keyframes lt-blink { 50% { opacity: 0; } }
        @keyframes lt-fade-in {
          from { opacity: 0; transform: translateY(3px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: lt-fade-in 220ms ease-out forwards; }
      `}</style>
    </div>
  );
}
