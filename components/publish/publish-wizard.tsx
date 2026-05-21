"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Loader2,
  Sparkles,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface DraftServices {
  name: string;
  price: number;
  time: string;
}

interface AgentDraft {
  id: string;
  builderId: string;
  name?: string;
  category?: string;
  tagline?: string;
  specText?: string;
  specStatus: "draft" | "compiling" | "ready" | "needs_revision" | "rejected";
  specSummary?: string;
  specRequiredInputs: string[];
  specForbiddenClaims: string[];
  specQuestions: string[];
  runtime: string;
  destinations: string[];
  priceFromCents?: number;
  priceMaxCents?: number;
  services: DraftServices[];
  whopPayeeId?: string;
  whopPayeeStatus: "pending" | "linked" | "failed";
  publishStatus: "draft" | "submitted" | "live" | "rejected";
}

interface CompileResult {
  status: AgentDraft["specStatus"];
  summary?: string;
  requiredInputs: string[];
  forbiddenClaims: string[];
  questions: string[];
  rejectReason?: string;
  model: string;
  latencyMs: number;
  stubbed: boolean;
}

const BUILDER_STORAGE_KEY = "aiaas:builder-id";
const ANON_PREFIX = "builder-";

function readOrCreateBuilderId(): string {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(BUILDER_STORAGE_KEY);
  if (existing) return existing;
  const id =
    ANON_PREFIX +
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(16).slice(2, 14));
  window.localStorage.setItem(BUILDER_STORAGE_KEY, id);
  return id;
}

const CATEGORIES = [
  "ads",
  "research",
  "funnels",
  "video",
  "support",
  "design",
  "seo",
];

const RUNTIMES = [
  { key: "mock", label: "Mock (for testing)" },
  { key: "anthropic-claude-opus", label: "Anthropic · Claude Opus" },
  { key: "openclaw", label: "OpenClaw runtime" },
  { key: "byo", label: "Bring your own webhook" },
];

const DESTINATIONS = ["slack", "gmail", "notion", "figma", "webhook"];

const STEP_LABELS = [
  { key: "identity", label: "Identity" },
  { key: "spec", label: "Spec" },
  { key: "runtime", label: "Runtime" },
  { key: "payee", label: "Payee" },
  { key: "review", label: "Review" },
];

export function PublishWizard() {
  const [stepIdx, setStepIdx] = useState(0);
  const [draft, setDraft] = useState<AgentDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creating = !draft && !error;

  // Local field state for the wizard. We sync to the draft on Next.
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [tagline, setTagline] = useState("");
  const [specText, setSpecText] = useState("");
  const [runtime, setRuntime] = useState("mock");
  const [destinations, setDestinations] = useState<string[]>([]);
  const [priceFromDollars, setPriceFromDollars] = useState("");
  const [priceMaxDollars, setPriceMaxDollars] = useState("");

  useEffect(() => {
    if (draft) return;
    const builderId = readOrCreateBuilderId();
    if (!builderId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/v1/agents/drafts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ builderId }),
        });
        if (!res.ok) throw new Error(`drafts/create ${res.status}`);
        const data = (await res.json()) as AgentDraft;
        if (cancelled) return;
        setDraft(data);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not start a draft.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draft]);

  async function patchDraft(patch: Record<string, unknown>) {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/agents/drafts/${draft.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`drafts/patch ${res.status}`);
      const next = (await res.json()) as AgentDraft;
      setDraft(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save draft.");
    } finally {
      setSaving(false);
    }
  }

  async function runCompile() {
    if (!draft) return;
    setCompiling(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/agents/drafts/${draft.id}/compile`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`drafts/compile ${res.status}`);
      const json = (await res.json()) as {
        draft: AgentDraft;
        compile: CompileResult;
      };
      setDraft(json.draft);
      setCompileResult(json.compile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Spec compile failed.");
    } finally {
      setCompiling(false);
    }
  }

  async function linkPayee() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/agents/drafts/${draft.id}/payee`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`drafts/payee ${res.status}`);
      const next = (await res.json()) as AgentDraft;
      setDraft(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not link Whop payee.");
    } finally {
      setSaving(false);
    }
  }

  async function submit() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/agents/drafts/${draft.id}/submit`, {
        method: "POST",
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(json.message ?? `drafts/submit ${res.status}`);
      }
      const next = (await res.json()) as AgentDraft;
      setDraft(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed.");
    } finally {
      setSaving(false);
    }
  }

  const canAdvance = (() => {
    if (!draft) return false;
    if (stepIdx === 0) return name.trim().length > 1 && tagline.trim().length > 4;
    if (stepIdx === 1) return draft.specStatus === "ready";
    if (stepIdx === 2)
      return Boolean(runtime) && destinations.length > 0 && Number(priceFromDollars) > 0;
    if (stepIdx === 3) return draft.whopPayeeStatus === "linked";
    return false;
  })();

  async function next() {
    if (!draft) return;
    if (stepIdx === 0) {
      await patchDraft({ name, category, tagline });
    } else if (stepIdx === 2) {
      await patchDraft({
        runtime,
        destinations,
        priceFromCents: Math.round(Number(priceFromDollars) * 100),
        priceMaxCents: Math.round(
          Number(priceMaxDollars || priceFromDollars) * 100,
        ),
      });
    }
    setStepIdx((s) => Math.min(STEP_LABELS.length - 1, s + 1));
  }

  return (
    <div
      className="mx-auto max-w-3xl px-4 py-12 md:px-8"
      data-testid="publish-wizard"
    >
      <div
        className="mb-3 text-[10px] uppercase tracking-[1.2px] text-muted-foreground"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Publish · agent draft
      </div>
      <h1
        className="m-0 text-3xl font-bold tracking-tight md:text-4xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Ship a new agent in five steps
      </h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Describe what you do in English. We compile it into a validator, attach a Whop payee, and your agent goes live for buyers.
      </p>

      <Stepper stepIdx={stepIdx} />

      {error && (
        <div
          data-testid="wizard-error"
          className="mt-4 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="size-4" aria-hidden />
          {error}
        </div>
      )}

      {creating && (
        <div className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Starting a draft…
        </div>
      )}

      {draft && (
        <div className="mt-6">
          {stepIdx === 0 && (
            <Section title="Step 1 · Identity" testid="section-identity">
              <Field label="Agent name">
                <input
                  data-testid="field-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Funnelsmith"
                  className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-[color:var(--accent)]"
                />
              </Field>
              <Field label="Category">
                <select
                  data-testid="field-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-[color:var(--accent)]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="One-line tagline">
                <input
                  data-testid="field-tagline"
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Writes hooks, stories, offers. Ships a full VSL funnel in 90 minutes."
                  className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-[color:var(--accent)]"
                />
              </Field>
            </Section>
          )}

          {stepIdx === 1 && (
            <Section title="Step 2 · Spec" testid="section-spec">
              <p className="text-sm text-muted-foreground">
                Describe your agent in plain English. Sharp specs ship faster — say who it&apos;s for, what it delivers, what you won&apos;t do.
              </p>
              <textarea
                data-testid="field-spec"
                value={specText}
                onChange={(e) => setSpecText(e.target.value)}
                rows={8}
                placeholder="e.g. Funnelsmith helps non-technical founders ship a 6-email indoctrination sequence for their offer. Inputs: offer details, audience, prior wins. Forbidden: making income claims. Pricing: $79 per teardown, $349 for the full funnel."
                className="mt-2 w-full resize-y rounded-md border border-border bg-secondary p-3 text-sm leading-relaxed text-foreground outline-none focus:border-[color:var(--accent)]"
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  size="sm"
                  data-testid="compile-spec"
                  onClick={async () => {
                    await patchDraft({ specText });
                    await runCompile();
                  }}
                  disabled={compiling || specText.trim().length < 12}
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  {compiling ? (
                    <>
                      <Loader2 className="mr-1 size-3.5 animate-spin" aria-hidden />
                      Compiling…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1 size-3.5" aria-hidden />
                      Compile spec
                    </>
                  )}
                </Button>
                {draft.specStatus !== "draft" && (
                  <span
                    data-testid="spec-status"
                    data-status={draft.specStatus}
                    className="rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-[1px]"
                    style={{
                      fontFamily: "var(--font-mono)",
                      borderColor:
                        draft.specStatus === "ready"
                          ? "var(--success)"
                          : draft.specStatus === "rejected"
                            ? "var(--danger)"
                            : "var(--warn)",
                      color:
                        draft.specStatus === "ready"
                          ? "var(--success)"
                          : draft.specStatus === "rejected"
                            ? "var(--danger)"
                            : "var(--warn)",
                    }}
                  >
                    {draft.specStatus.replaceAll("_", " ")}
                  </span>
                )}
              </div>

              {compileResult?.questions && compileResult.questions.length > 0 && (
                <div className="mt-4 rounded-md border border-border bg-card p-4">
                  <div
                    className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[1.1px] text-muted-foreground"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    <CircleAlert className="size-3" aria-hidden />
                    Tighten these before publishing
                  </div>
                  <ul className="ml-4 list-disc text-sm leading-relaxed">
                    {compileResult.questions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}

              {compileResult?.summary && (
                <div className="mt-4 rounded-md border border-border bg-secondary p-4">
                  <div
                    className="mb-1.5 text-[10px] uppercase tracking-[1.1px] text-muted-foreground"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    Compiled summary
                  </div>
                  <p className="m-0 text-sm text-foreground">
                    {compileResult.summary}
                  </p>
                </div>
              )}
            </Section>
          )}

          {stepIdx === 2 && (
            <Section title="Step 3 · Runtime + destinations" testid="section-runtime">
              <Field label="Runtime">
                <select
                  data-testid="field-runtime"
                  value={runtime}
                  onChange={(e) => setRuntime(e.target.value)}
                  className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                >
                  {RUNTIMES.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Destinations (Composio scopes)">
                <div className="flex flex-wrap gap-2">
                  {DESTINATIONS.map((d) => {
                    const active = destinations.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        data-testid={`dest-${d}`}
                        data-active={active}
                        onClick={() =>
                          setDestinations((prev) =>
                            active ? prev.filter((p) => p !== d) : [...prev, d],
                          )
                        }
                        className="rounded-full border px-3 py-1 text-xs"
                        style={{
                          borderColor: active ? "var(--accent)" : "var(--line)",
                          background: active ? "color-mix(in oklab, var(--accent) 14%, var(--panel))" : "transparent",
                          color: active ? "var(--accent)" : "var(--text-dim)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Starting price ($)">
                  <input
                    data-testid="field-price-from"
                    type="number"
                    inputMode="decimal"
                    value={priceFromDollars}
                    onChange={(e) => setPriceFromDollars(e.target.value)}
                    placeholder="79"
                    className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                  />
                </Field>
                <Field label="Top tier price ($)">
                  <input
                    data-testid="field-price-max"
                    type="number"
                    inputMode="decimal"
                    value={priceMaxDollars}
                    onChange={(e) => setPriceMaxDollars(e.target.value)}
                    placeholder="349"
                    className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                  />
                </Field>
              </div>
            </Section>
          )}

          {stepIdx === 3 && (
            <Section title="Step 4 · Whop payee" testid="section-payee">
              <p className="text-sm leading-relaxed text-muted-foreground">
                We hold buyer funds in escrow and release them to your Whop wallet on accept. Link a Whop payee now — KYC fires only at first withdrawal &gt; $2,500.
              </p>
              <div className="mt-4 rounded-md border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <Wallet
                    className="size-4"
                    aria-hidden
                    style={{ color: "var(--accent)" }}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">
                      Whop payee link
                    </div>
                    <div
                      className="mt-0.5 text-[11px] text-muted-foreground"
                      style={{ fontFamily: "var(--font-mono)" }}
                      data-testid="payee-status"
                    >
                      status · {draft.whopPayeeStatus}
                      {draft.whopPayeeId ? ` · ${draft.whopPayeeId}` : ""}
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    data-testid="link-payee"
                    onClick={linkPayee}
                    disabled={saving || draft.whopPayeeStatus === "linked"}
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    {draft.whopPayeeStatus === "linked" ? (
                      <>
                        <Check className="mr-1 size-3.5" aria-hidden />
                        Linked
                      </>
                    ) : (
                      "Link Whop payee"
                    )}
                  </Button>
                </div>
              </div>
            </Section>
          )}

          {stepIdx === 4 && (
            <Section title="Step 5 · Review + submit" testid="section-review">
              <ReviewRow label="Name" value={draft.name ?? name} />
              <ReviewRow label="Category" value={draft.category ?? category} />
              <ReviewRow label="Tagline" value={draft.tagline ?? tagline} />
              <ReviewRow
                label="Spec"
                value={draft.specSummary ?? `${draft.specStatus}`}
              />
              <ReviewRow label="Runtime" value={draft.runtime} />
              <ReviewRow
                label="Destinations"
                value={draft.destinations.join(" · ") || "(none)"}
              />
              <ReviewRow
                label="Pricing"
                value={`from $${((draft.priceFromCents ?? 0) / 100).toFixed(2)} → $${((draft.priceMaxCents ?? 0) / 100).toFixed(2)}`}
              />
              <ReviewRow
                label="Whop payee"
                value={`${draft.whopPayeeStatus}${draft.whopPayeeId ? ` · ${draft.whopPayeeId}` : ""}`}
              />
              {draft.publishStatus === "submitted" ||
              draft.publishStatus === "live" ? (
                <div
                  data-testid="publish-success"
                  className="mt-4 inline-flex items-center gap-2 rounded-md border border-[color:var(--success)] bg-[color-mix(in_oklab,var(--success)_12%,var(--panel))] px-3 py-2 text-sm"
                  style={{ color: "var(--success)" }}
                >
                  <Check className="size-4" aria-hidden />
                  {draft.publishStatus === "live"
                    ? "Live — your agent is in the marketplace."
                    : "Draft submitted — review in your dashboard."}
                </div>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  data-testid="submit-draft"
                  onClick={submit}
                  disabled={
                    saving ||
                    draft.specStatus !== "ready" ||
                    draft.whopPayeeStatus !== "linked"
                  }
                  className="mt-4"
                  style={{ background: "var(--accent)" }}
                >
                  Submit for review
                </Button>
              )}
            </Section>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStepIdx((s) => Math.max(0, s - 1))}
              disabled={stepIdx === 0}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Back
            </button>
            {stepIdx < STEP_LABELS.length - 1 ? (
              <Button
                type="button"
                onClick={next}
                disabled={!canAdvance || saving}
                data-testid="step-next"
                style={{ background: "var(--accent)" }}
              >
                Next
                <ArrowRight className="ml-1 size-4" aria-hidden />
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function Stepper({ stepIdx }: { stepIdx: number }) {
  return (
    <ol
      className="mt-7 flex flex-wrap items-center gap-1.5 text-[11px]"
      data-testid="stepper"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {STEP_LABELS.map((s, i) => {
        const active = i === stepIdx;
        const done = i < stepIdx;
        return (
          <li
            key={s.key}
            data-testid={`step-${s.key}`}
            data-active={active}
            className="flex items-center gap-1.5 rounded-full border px-2.5 py-1"
            style={{
              borderColor: active
                ? "var(--accent)"
                : done
                  ? "var(--success)"
                  : "var(--line)",
              color: active
                ? "var(--accent)"
                : done
                  ? "var(--success)"
                  : "var(--text-dim)",
            }}
          >
            <span>
              {i + 1}. {s.label}
            </span>
            {done && <Check className="size-3" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

function Section({
  title,
  children,
  testid,
}: {
  title: string;
  children: React.ReactNode;
  testid: string;
}) {
  return (
    <section
      data-testid={testid}
      className="rounded-lg border border-border bg-card p-5"
    >
      <h2
        className="mb-3 text-base font-semibold tracking-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span
        className="text-[10px] uppercase tracking-[1.1px] text-muted-foreground"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <span
        className="text-[10px] uppercase tracking-[1.1px] text-muted-foreground"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </span>
      <span className="text-right text-sm text-foreground">{value}</span>
    </div>
  );
}
