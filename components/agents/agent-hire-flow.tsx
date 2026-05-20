"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  HelpCircle,
  Loader2,
  Lock,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { price } from "@/lib/format";
import type { Agent, AgentService } from "@/lib/types";

type Step = "profile" | "brief" | "clarify" | "queue" | "done";

interface AgentHireFlowProps {
  agent: Agent;
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

const CLARIFY_QUESTIONS: Record<string, string[]> = {
  funnelsmith: [
    "What's the headline outcome the buyer gets in week 1?",
    "Do you have an existing list to test the funnel against?",
    "What price point are you anchoring the offer at?",
  ],
  adhook: [
    "What platform should the ads run on (Meta, TikTok, both)?",
    "Are you allowed to use customer testimonials?",
    "What's the biggest objection you keep hearing on sales calls?",
  ],
  newsletterdraft: [
    "Paste a recent newsletter we should match the voice of?",
    "What's your CTA — reply, click, buy?",
    "Is there a topic to avoid this week?",
  ],
};

export function AgentHireFlow({ agent }: AgentHireFlowProps) {
  const [step, setStep] = useState<Step>("profile");
  const [picked, setPicked] = useState<AgentService>(agent.services[0]);
  const [brief, setBrief] = useState("");
  const [clarifyAnswers, setClarifyAnswers] = useState<string[] | null>(null);
  const [queuePos] = useState(agent.queue + 1);

  const placeholder =
    BRIEF_PLACEHOLDERS[agent.id] ??
    `Describe what you need. ${agent.name} will ask clarifying questions if it needs them.`;

  const clarifyQs = CLARIFY_QUESTIONS[agent.id];
  const needsClarify = (clarifyQs?.length ?? 0) > 0;

  const close = () => setStep("profile");

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

      {/* Services + hire panel — inline (not modal). Always rendered on the
          right column; brief/clarify/queue/done open in a modal overlay. */}
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

      {/* Modal — opens on Hire click for brief → clarify → queue → done */}
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
                    onClick={() => setStep(needsClarify ? "clarify" : "queue")}
                    style={{ background: "var(--accent)" }}
                  >
                    Pay {price(picked.price)} &amp; queue
                    <ArrowRight className="ml-1 size-4" aria-hidden />
                  </Button>
                </div>
              </div>
            )}

            {step === "clarify" && (
              <div className="p-7 md:p-9">
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
                  {(clarifyQs ?? []).map((q, i) => (
                    <ClarifyRow
                      key={i}
                      index={i}
                      question={q}
                      onChange={(answers) => setClarifyAnswers(answers)}
                      existing={clarifyAnswers}
                      total={clarifyQs!.length}
                    />
                  ))}
                </div>
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
                      clarifyAnswers.length < (clarifyQs?.length ?? 0) ||
                      clarifyAnswers.some((a) => a.trim().length < 2)
                    }
                    onClick={() => setStep("queue")}
                    style={{ background: "var(--accent)" }}
                  >
                    Thanks — queue me up
                    <ArrowRight className="ml-1 size-4" aria-hidden />
                  </Button>
                </div>
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
                  <div
                    className="mt-6 text-5xl font-bold"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    #{queuePos}
                  </div>
                  <p
                    className="mt-2 text-xs text-muted-foreground"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    Live trace opens when your run starts · receipt emailed on delivery
                  </p>
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => setStep("done")}
                    className="mt-6"
                    style={{ background: "var(--accent)" }}
                  >
                    Continue to delivery
                    <ChevronRight className="ml-1 size-4" aria-hidden />
                  </Button>
                </div>
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
