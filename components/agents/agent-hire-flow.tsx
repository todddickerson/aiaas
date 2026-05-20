"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  HelpCircle,
  Loader2,
  Lock,
  X,
} from "lucide-react";

import { LiveTrace } from "@/components/runs/live-trace";
import { Button } from "@/components/ui/button";
import { price } from "@/lib/format";
import type { Agent, AgentService } from "@/lib/types";

type Step =
  | "profile"
  | "brief"
  | "validating"
  | "clarify"
  | "rejected"
  | "queue"
  | "running"
  | "done";

const WALLET_USER_KEY = "aiaas:wallet:user-id";
const ANON_PREFIX = "anon-";

function readOrCreateAnonId(): string {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(WALLET_USER_KEY);
  if (existing) return existing;
  const id =
    ANON_PREFIX +
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(16).slice(2, 14));
  window.localStorage.setItem(WALLET_USER_KEY, id);
  return id;
}

interface AgentHireFlowProps {
  agent: Agent;
}

interface ValidateResponse {
  briefId: string | null;
  verdict: "pass" | "clarify" | "rejected";
  clarifyQuestions: string[];
  rejectReason?: string;
  model: string;
  latencyMs: number;
  stubbed: boolean;
}

const BRIEF_PLACEHOLDERS: Record<string, string> = {
  funnelsmith:
    "e.g. Launching a $97 course on calm productivity. Target: burned-out PMs. Tone: warm + direct.",
  adhook:
    "e.g. 5 ad creatives for a $39 sleep supplement. Audience: tired parents. Angle: identity, not features.",
  newsletterdraft:
    "e.g. Topic: why most SaaS founders quit at $300k MRR. Voice: punchy, plain-spoken, 600 words.",
  aperture:
    "e.g. Pickleball paddle brand. 40 ad variants, problem-aware audience, testimonial angles.",
  helios:
    "e.g. Research the SMB bookkeeping space. Top 8 competitors, pricing, GTM motions.",
  "triage-01":
    "e.g. Shopify store. Refund requests, shipping questions, sizing. Brand voice: friendly + concise.",
  "operator-dm":
    "e.g. SaaS at $1.4M ARR, 18 heads. Need a hire plan to hit $4M by EOY.",
};

export function AgentHireFlow({ agent }: AgentHireFlowProps) {
  const [step, setStep] = useState<Step>("profile");
  const [picked, setPicked] = useState<AgentService>(agent.services[0]);
  const [brief, setBrief] = useState("");
  const [clarifyQs, setClarifyQs] = useState<string[]>([]);
  const [clarifyAnswers, setClarifyAnswers] = useState<string[] | null>(null);
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [validatorInfo, setValidatorInfo] = useState<{ model: string; latencyMs: number } | null>(null);
  const [validatorError, setValidatorError] = useState<string | null>(null);
  const [queuePos] = useState(agent.queue + 1);
  const [runId, setRunId] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const placeholder =
    BRIEF_PLACEHOLDERS[agent.id] ??
    `Describe what you need. ${agent.name} will ask clarifying questions if it needs them.`;

  const close = () => {
    setStep("profile");
    setRejectReason(null);
    setValidatorError(null);
    setClarifyAnswers(null);
    setRunId(null);
    setRunError(null);
  };

  async function startRun() {
    setRunError(null);
    setStep("running");
    try {
      const userId = readOrCreateAnonId();
      const amountCents = Math.round(picked.price * 100);

      // Best-effort top-up so the wallet has enough to cover the hold. The
      // stub Whop client makes this instant and idempotent.
      await fetch("/api/v1/wallet/top-up", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId,
          amountCents,
          idempotencyKey: `auto-topup:${userId}:${agent.id}:${picked.name}`,
        }),
      }).catch(() => {
        // Non-fatal — the run will fail with insufficient balance if needed.
      });

      const res = await fetch("/api/v1/runs/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId,
          agentSlug: agent.id,
          briefText: brief,
          serviceName: picked.name,
          servicePriceCents: amountCents,
          idempotencyKey: `run:${userId}:${agent.id}:${Date.now()}`,
        }),
      });
      if (!res.ok) {
        throw new Error(`Run create returned ${res.status}`);
      }
      const data = (await res.json()) as { id: string; status: string; error?: string };
      setRunId(data.id);
      if (data.status === "failed" && data.error) {
        setRunError(data.error);
      }
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Could not start the run.");
    }
  }

  // When the run reaches "delivered" we flip to the done step. We poll the
  // run record (the LiveTrace stream pushes its own "done" SSE — but flipping
  // the modal needs an external trigger).
  useEffect(() => {
    if (step !== "running" || !runId) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/runs/${runId}`);
        if (!res.ok) return;
        const data = (await res.json()) as { status: string; error?: string };
        if (cancelled) return;
        if (data.status === "delivered" || data.status === "accepted") {
          setStep("done");
          clearInterval(interval);
        } else if (data.status === "failed") {
          setRunError(data.error ?? "Run failed.");
          clearInterval(interval);
        }
      } catch {
        // ignore transient errors
      }
    }, 1_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [step, runId]);

  async function submitBrief() {
    setStep("validating");
    setValidatorError(null);
    try {
      const res = await fetch("/api/v1/briefs/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentSlug: agent.id,
          briefText: brief,
          serviceName: picked.name,
          servicePriceCents: Math.round(picked.price * 100),
        }),
      });
      if (!res.ok) {
        throw new Error(`Validator returned ${res.status}`);
      }
      const data = (await res.json()) as ValidateResponse;
      setValidatorInfo({ model: data.model, latencyMs: data.latencyMs });
      if (data.verdict === "pass") {
        await startRun();
        return;
      }
      if (data.verdict === "clarify") {
        setClarifyQs(data.clarifyQuestions);
        setClarifyAnswers(Array.from({ length: data.clarifyQuestions.length }, () => ""));
        setStep("clarify");
        return;
      }
      setRejectReason(data.rejectReason ?? "The validator couldn't accept this brief.");
      setStep("rejected");
    } catch (err) {
      setValidatorError(err instanceof Error ? err.message : "Validator unreachable.");
      setStep("brief");
    }
  }

  return (
    <>
      {/* Sticky hire CTA — visible on profile step only */}
      {step === "profile" && (
        <div
          data-testid="agent-sticky-cta"
          className="sticky bottom-0 z-30 -mx-4 mt-10 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden"
        >
          <Button
            size="lg"
            className="w-full"
            style={{ background: "var(--accent)" }}
            onClick={() => setStep("brief")}
          >
            Hire {agent.name} · {price(picked.price)}
          </Button>
        </div>
      )}

      <aside
        className="flex flex-col gap-3"
        data-testid="agent-hire-panel"
      >
        <div
          className="rounded-lg border border-border bg-card p-5"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <div
            className="mb-3 text-[10px] uppercase tracking-[1.2px] text-muted-foreground"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Services · productized · hire unlimited times
          </div>
          <div className="flex flex-col gap-2">
            {agent.services.map((s) => {
              const active = s.name === picked.name;
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setPicked(s)}
                  data-active={active}
                  data-testid={`agent-service-${s.name}`}
                  className="group w-full cursor-pointer rounded-md border bg-secondary p-3.5 text-left transition-colors hover:border-foreground data-[active=true]:border-[color:var(--accent)] data-[active=true]:bg-[color-mix(in_oklab,var(--accent)_8%,var(--panel))]"
                  style={{
                    borderColor: active ? "var(--accent)" : "var(--line)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[14px] font-semibold text-foreground">
                        {s.name}
                      </div>
                      <div
                        className="mt-1 text-[11px] text-muted-foreground"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        typical {s.time} · {s.runs.toLocaleString()} runs
                      </div>
                    </div>
                    <div
                      className="text-xl font-semibold tabular-nums"
                      style={{ fontFamily: "var(--font-display)" }}
                      data-testid="agent-service-price"
                    >
                      {price(s.price)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <Button
            data-testid="agent-hire-cta"
            size="lg"
            className="mt-4 w-full text-white"
            style={{
              background: "var(--accent)",
              fontFamily: "var(--font-display)",
            }}
            onClick={() => setStep("brief")}
          >
            Hire · {price(picked.price)}
          </Button>
          <p
            className="mt-2 text-center text-[10.5px] text-muted-foreground"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {agent.online
              ? `You'll be #${agent.queue + 1} in queue · ETA ${agent.etaMins + 4} min`
              : "Wakes at 9am PT"}
          </p>
        </div>

        {/* Wallet hold preview */}
        <div
          className="rounded-lg border border-border bg-secondary p-4 text-[12.5px] leading-relaxed text-muted-foreground"
          data-testid="wallet-hold"
        >
          <div className="mb-1.5 flex items-center gap-1.5 text-foreground">
            <Lock className="size-3.5" aria-hidden />
            <span
              className="text-[10.5px] font-semibold uppercase tracking-[1.1px]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Wallet hold preview
            </span>
          </div>
          <div className="flex items-center justify-between text-foreground">
            <span>Hold from your wallet</span>
            <span className="tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
              {price(picked.price)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span>Releases on your acceptance</span>
            <span className="tabular-nums">{price(picked.price)}</span>
          </div>
          <div className="mt-2 text-[11px]">
            No card charge until accepted. Refund anytime in the 24 hours after delivery.
          </div>
        </div>
      </aside>

      {/* Modal — opens on Hire click for brief → validate → clarify → queue → done */}
      {step !== "profile" && (
        <div
          data-testid="hire-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6"
          onClick={close}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-[760px] overflow-auto rounded-xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" aria-hidden />
            </button>

            {step === "brief" && (
              <div className="p-7 md:p-9">
                <div
                  className="mb-1.5 text-[10px] uppercase tracking-[1.2px] text-muted-foreground"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Step 1 of 2 · Brief
                </div>
                <h3
                  className="m-0 text-2xl font-semibold tracking-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Tell {agent.name} what you need
                </h3>
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder={placeholder}
                  data-testid="brief-textarea"
                  rows={6}
                  className="mt-4 w-full resize-y rounded-md border border-border bg-secondary p-3.5 text-[14px] leading-relaxed text-foreground outline-none focus:border-[color:var(--accent)]"
                />
                {validatorError && (
                  <div
                    data-testid="validator-error"
                    className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-[13px] text-destructive"
                  >
                    <AlertTriangle className="mr-1 inline size-3.5" aria-hidden />
                    {validatorError}
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={close}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="size-3.5" aria-hidden />
                    Back
                  </button>
                  <Button
                    type="button"
                    size="lg"
                    disabled={brief.trim().length < 8}
                    onClick={submitBrief}
                    style={{ background: "var(--accent)" }}
                    data-testid="brief-submit"
                  >
                    Pay {price(picked.price)} &amp; queue
                    <ArrowRight className="ml-1 size-4" aria-hidden />
                  </Button>
                </div>
              </div>
            )}

            {step === "validating" && (
              <div className="p-9 text-center md:p-12" data-testid="validator-running">
                <div className="inline-flex items-center gap-2 text-muted-foreground">
                  <Loader2
                    className="size-5 animate-spin"
                    style={{ color: "var(--accent)" }}
                    aria-hidden
                  />
                  <span>Compiling your brief…</span>
                </div>
                <p
                  className="mt-3 text-xs text-muted-foreground"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Validator checks completeness before any money holds.
                </p>
              </div>
            )}

            {step === "clarify" && (
              <div className="p-7 md:p-9" data-testid="validator-clarify">
                <div
                  className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[1.2px] text-muted-foreground"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <HelpCircle className="size-3" aria-hidden />
                  Step 1B · Clarify
                </div>
                <h3
                  className="m-0 text-2xl font-semibold tracking-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Quick questions before {agent.name} starts
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Answer in 30 seconds. Sharper brief → fewer revisions.
                </p>
                <div className="mt-4 flex flex-col gap-3">
                  {clarifyQs.map((q, i) => (
                    <ClarifyRow
                      key={i}
                      index={i}
                      question={q}
                      onChange={(answers) => setClarifyAnswers(answers)}
                      existing={clarifyAnswers}
                      total={clarifyQs.length}
                    />
                  ))}
                </div>
                {validatorInfo && (
                  <p
                    className="mt-3 text-[10.5px] text-text-faint"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    validator · {validatorInfo.model} · {validatorInfo.latencyMs}ms
                  </p>
                )}
                <div className="mt-5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep("brief")}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="size-3.5" aria-hidden />
                    Back to brief
                  </button>
                  <Button
                    type="button"
                    size="lg"
                    disabled={
                      !clarifyAnswers ||
                      clarifyAnswers.length < clarifyQs.length ||
                      clarifyAnswers.some((a) => a.trim().length < 2)
                    }
                    onClick={() => {
                      void startRun();
                    }}
                    style={{ background: "var(--accent)" }}
                    data-testid="clarify-submit"
                  >
                    Thanks — queue me up
                    <ArrowRight className="ml-1 size-4" aria-hidden />
                  </Button>
                </div>
              </div>
            )}

            {step === "rejected" && (
              <div className="p-9 text-center md:p-12" data-testid="validator-rejected">
                <div
                  className="mx-auto inline-flex size-14 items-center justify-center rounded-full"
                  style={{ background: "var(--danger)", color: "white" }}
                >
                  <AlertTriangle className="size-7" aria-hidden />
                </div>
                <h3
                  className="mt-5 text-2xl font-semibold tracking-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Brief rejected
                </h3>
                <p className="mx-auto mt-2 max-w-[420px] text-sm text-muted-foreground">
                  {rejectReason}
                </p>
                <Button
                  type="button"
                  size="lg"
                  variant="secondary"
                  onClick={() => setStep("brief")}
                  className="mt-6"
                >
                  Edit brief
                </Button>
              </div>
            )}

            {step === "queue" && (
              <div className="p-7 md:p-9">
                <div
                  className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-[1.2px] text-muted-foreground"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <span>Step 2 of 2 · In queue</span>
                  <span>
                    #{queuePos} · ETA {Math.max(1, queuePos * 2)}m
                  </span>
                </div>
                <div className="py-8 text-center">
                  <div className="inline-flex items-center gap-2 text-muted-foreground">
                    <Loader2
                      className="size-5 animate-spin"
                      style={{ color: "var(--accent)" }}
                      aria-hidden
                    />
                    <span>Queueing your run…</span>
                  </div>
                </div>
              </div>
            )}

            {step === "running" && (
              <div className="p-6 md:p-8" data-testid="run-running">
                <div
                  className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[1.2px] text-muted-foreground"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <span>Step 2 of 2 · Live trace</span>
                  {validatorInfo && (
                    <span data-testid="validator-summary">
                      validator · pass · {validatorInfo.model} · {validatorInfo.latencyMs}ms
                    </span>
                  )}
                </div>
                {runError && (
                  <div
                    data-testid="run-error"
                    className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-[13px] text-destructive"
                  >
                    <AlertTriangle className="mr-1 inline size-3.5" aria-hidden />
                    {runError}
                  </div>
                )}
                {runId ? (
                  <LiveTrace runId={runId} agentHandle={agent.handle} />
                ) : (
                  <div className="py-6 text-center text-muted-foreground">
                    <Loader2 className="mx-auto mb-2 size-5 animate-spin" aria-hidden />
                    <p className="text-sm">Starting your run…</p>
                  </div>
                )}
              </div>
            )}

            {step === "done" && (
              <div className="p-9 text-center md:p-12">
                <div
                  className="mx-auto inline-flex size-16 items-center justify-center rounded-full text-white"
                  style={{ background: "var(--accent)" }}
                >
                  <Check className="size-8" aria-hidden />
                </div>
                <h3
                  className="mt-5 text-2xl font-semibold tracking-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Execution delivered
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {agent.name} shipped your {picked.name.toLowerCase()}. Receipt
                  emailed. Wallet released {price(picked.price)} to the builder.
                </p>
                <div className="mx-auto mt-5 max-w-[460px] rounded-md border border-border bg-secondary p-4 text-left">
                  <div
                    className="mb-2 text-[10px] uppercase tracking-[1.2px] text-muted-foreground"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    Sample output
                  </div>
                  <pre
                    className="m-0 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {agent.sample}
                  </pre>
                </div>
                <Button
                  type="button"
                  size="lg"
                  variant="secondary"
                  className="mt-6"
                  onClick={close}
                >
                  Back to {agent.name}&apos;s profile
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ClarifyRow({
  index,
  question,
  total,
  existing,
  onChange,
}: {
  index: number;
  question: string;
  total: number;
  existing: string[] | null;
  onChange: (next: string[]) => void;
}) {
  const value = existing?.[index] ?? "";
  return (
    <div className="rounded-md border border-border bg-secondary p-3.5">
      <div
        className="mb-1.5 text-[10px] uppercase tracking-[1.1px] text-muted-foreground"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Q{index + 1}/{total}
      </div>
      <div className="text-sm text-foreground">{question}</div>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const next = Array.from({ length: total }, (_, i) =>
            i === index ? e.target.value : existing?.[i] ?? "",
          );
          onChange(next);
        }}
        placeholder="Type your answer"
        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[color:var(--accent)]"
      />
    </div>
  );
}
