import "server-only";

import Anthropic from "@anthropic-ai/sdk";

export type SpecStatus = "ready" | "needs_revision" | "rejected";

export interface SpecCompileResult {
  status: SpecStatus;
  summary: string;
  requiredInputs: string[];
  forbiddenClaims: string[];
  questions: string[];
  model: string;
  latencyMs: number;
  stubbed: boolean;
  rejectReason?: string;
}

interface CompileOptions {
  name?: string;
  tagline?: string;
  category?: string;
  specText: string;
}

const HAIKU_MODEL = "claude-haiku-4-5-20251001";

function buildSystemPrompt(): string {
  return [
    "You are the AIaaS spec compiler. Builders write an English description",
    "of an agent they want to publish; you compile it into a structured spec",
    "the marketplace can validate buyer briefs against.",
    "",
    "Decide one of three statuses:",
    "  • ready           — the spec is sharp enough to publish.",
    "  • needs_revision  — the spec is workable but missing key pieces; ask 1-3 questions.",
    "  • rejected        — the spec is off-topic, abusive, or so vague we can't publish it.",
    "",
    "Hard rules:",
    "  • requiredInputs are short field names the buyer must always supply.",
    "  • forbiddenClaims are short outputs the agent must never produce (e.g., medical / legal advice if not in scope).",
    '  • If spec text is fewer than 12 characters, reject with reason "spec too short".',
    "  • Each question must be answerable in one short sentence.",
    "",
    "Return a single JSON object on one line:",
    `  {"status":"ready"|"needs_revision"|"rejected",`,
    `   "summary":"one-sentence pitch",`,
    `   "requiredInputs":["..."],"forbiddenClaims":["..."],`,
    `   "questions":["..."],"rejectReason":"..."}`,
    "No prose outside the JSON. No code fences.",
  ].join("\n");
}

function buildUserPrompt(opts: CompileOptions): string {
  const lines = [
    opts.name ? `Agent name: ${opts.name}` : null,
    opts.tagline ? `Tagline: ${opts.tagline}` : null,
    opts.category ? `Category: ${opts.category}` : null,
    "Spec:",
    "---",
    opts.specText,
    "---",
  ].filter(Boolean) as string[];
  return lines.join("\n");
}

interface ParsedSpec {
  status: SpecStatus;
  summary: string;
  requiredInputs: string[];
  forbiddenClaims: string[];
  questions: string[];
  rejectReason?: string;
}

function parseSpec(raw: string): ParsedSpec {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error(`Spec compiler returned non-JSON: ${raw.slice(0, 120)}`);
  }
  const parsed = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  const status = parsed.status;
  if (status !== "ready" && status !== "needs_revision" && status !== "rejected") {
    throw new Error(`Unknown status: ${String(status)}`);
  }
  const strList = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 6) : [];
  return {
    status,
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    requiredInputs: strList(parsed.requiredInputs),
    forbiddenClaims: strList(parsed.forbiddenClaims),
    questions: strList(parsed.questions),
    rejectReason: typeof parsed.rejectReason === "string" ? parsed.rejectReason : undefined,
  };
}

function stubCompile(opts: CompileOptions): SpecCompileResult {
  const trimmed = opts.specText.trim();
  if (trimmed.length < 12) {
    return {
      status: "rejected",
      summary: "",
      requiredInputs: [],
      forbiddenClaims: [],
      questions: [],
      rejectReason: "spec too short",
      model: "stub",
      latencyMs: 0,
      stubbed: true,
    };
  }
  // Heuristic: if the spec mentions a price + an audience + an output, call it ready.
  const hasPrice = /\$\d|free|tier/i.test(trimmed);
  const hasAudience = /\b(for|target|audience|buyer|operator|founder|pm|smb)\b/i.test(trimmed);
  const hasOutput = /\b(deliver|ship|return|produce|output|email|draft|funnel|ad|memo|report|video|design)\b/i.test(trimmed);
  if (hasPrice && hasAudience && hasOutput) {
    return {
      status: "ready",
      summary: opts.tagline ?? trimmed.slice(0, 120),
      requiredInputs: ["buyer brief"],
      forbiddenClaims: [],
      questions: [],
      model: "stub",
      latencyMs: 0,
      stubbed: true,
    };
  }
  return {
    status: "needs_revision",
    summary: opts.tagline ?? trimmed.slice(0, 120),
    requiredInputs: [],
    forbiddenClaims: [],
    questions: [
      !hasAudience ? "Who is the target buyer for this agent?" : null,
      !hasOutput ? "What concrete deliverable does each run ship?" : null,
      !hasPrice ? "What's the starting price or tier structure?" : null,
    ].filter(Boolean) as string[],
    model: "stub",
    latencyMs: 0,
    stubbed: true,
  };
}

export async function compileSpec(
  opts: CompileOptions,
): Promise<SpecCompileResult> {
  const stubMode =
    !process.env.ANTHROPIC_API_KEY ||
    process.env.ANTHROPIC_VALIDATOR_STUB === "true";
  if (stubMode) return stubCompile(opts);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const system = buildSystemPrompt();
  const user = buildUserPrompt(opts);
  const started = Date.now();
  const resp = await client.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 512,
    system,
    messages: [{ role: "user", content: user }],
  });
  const text = resp.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();
  const parsed = parseSpec(text);
  return {
    ...parsed,
    model: HAIKU_MODEL,
    latencyMs: Date.now() - started,
    stubbed: false,
  };
}
