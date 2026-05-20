import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import type { Agent } from "@/lib/types";

export type ValidatorVerdict = "pass" | "clarify" | "rejected";

export interface ValidatorResult {
  verdict: ValidatorVerdict;
  clarifyQuestions: string[];
  rejectReason?: string;
  model: string;
  latencyMs: number;
  stubbed: boolean;
}

interface CompileOptions {
  agent: Agent;
  briefText: string;
  serviceName?: string;
  serviceMaxRetries?: number;
}

const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const OPUS_MODEL = "claude-opus-4-7";

function buildSystemPrompt(agent: Agent): string {
  return [
    `You are the brief validator for ${agent.name} (${agent.handle}) on AIaaS.com.`,
    `Agent persona: ${agent.persona}`,
    `Agent tagline: ${agent.tagline}`,
    "",
    "Your job: read a buyer's English brief and decide one of three verdicts:",
    "  • pass     — the brief is complete and the agent can start immediately.",
    "  • clarify  — the brief is plausible but missing 1-3 small details. Return those as concise clarifying questions.",
    "  • rejected — the brief is off-topic for this agent, abusive, or unfixable. Return a short reason.",
    "",
    "Hard rules:",
    "  • Never invent context the buyer didn't supply. If something is missing, ask for it; don't assume.",
    '  • Clarify questions must be short, plain, and answerable in one sentence (max 80 chars).',
    "  • At most 3 clarify questions. Prefer the smallest set that unblocks the agent.",
    '  • If the brief is fewer than 8 characters or empty, reject with reason "brief too short".',
    "",
    "Return a single JSON object on one line:",
    `  {"verdict":"pass"|"clarify"|"rejected","clarifyQuestions":["..."],"rejectReason":"..."}`,
    "No prose outside the JSON. No code fences.",
  ].join("\n");
}

function buildUserPrompt(brief: string, serviceName?: string): string {
  const lines = [
    serviceName ? `Hired service: ${serviceName}` : null,
    "Buyer's brief:",
    "---",
    brief,
    "---",
  ].filter(Boolean);
  return lines.join("\n");
}

interface ParsedVerdict {
  verdict: ValidatorVerdict;
  clarifyQuestions: string[];
  rejectReason?: string;
}

function parseVerdict(raw: string): ParsedVerdict {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error(`Validator returned non-JSON output: ${raw.slice(0, 120)}`);
  }
  const parsed = JSON.parse(raw.slice(start, end + 1)) as {
    verdict?: string;
    clarifyQuestions?: unknown;
    rejectReason?: unknown;
  };

  const verdict = parsed.verdict;
  if (verdict !== "pass" && verdict !== "clarify" && verdict !== "rejected") {
    throw new Error(`Unknown verdict: ${verdict}`);
  }

  const clarifyQuestions = Array.isArray(parsed.clarifyQuestions)
    ? parsed.clarifyQuestions.filter((q): q is string => typeof q === "string").slice(0, 3)
    : [];
  const rejectReason =
    typeof parsed.rejectReason === "string" ? parsed.rejectReason : undefined;
  return { verdict, clarifyQuestions, rejectReason };
}

function shouldEscalate(parsed: ParsedVerdict, brief: string): boolean {
  // Escalate Haiku → Opus when:
  //   • Haiku said "clarify" but actually asked 3+ questions (deep ambiguity), OR
  //   • brief is long (>400 chars) and verdict isn't a confident pass.
  if (parsed.verdict === "clarify" && parsed.clarifyQuestions.length >= 3) return true;
  if (brief.length > 400 && parsed.verdict !== "pass") return true;
  return false;
}

function stubVerdict(brief: string): ValidatorResult {
  const trimmed = brief.trim();
  if (trimmed.length < 8) {
    return {
      verdict: "rejected",
      clarifyQuestions: [],
      rejectReason: "brief too short",
      model: "stub",
      latencyMs: 0,
      stubbed: true,
    };
  }
  const askyWords = /(\?|what|which|how|when|where|maybe|unsure|not sure)/i;
  if (askyWords.test(trimmed) && trimmed.length < 80) {
    return {
      verdict: "clarify",
      clarifyQuestions: [
        "Who is the audience for this work?",
        "What's the single outcome that would make this a win?",
      ],
      model: "stub",
      latencyMs: 0,
      stubbed: true,
    };
  }
  return {
    verdict: "pass",
    clarifyQuestions: [],
    model: "stub",
    latencyMs: 0,
    stubbed: true,
  };
}

/**
 * Compile a buyer's brief against an agent. Returns the validator's verdict.
 *
 * In stub mode (no ANTHROPIC_API_KEY, or ANTHROPIC_VALIDATOR_STUB=true) we
 * synthesize a deterministic verdict. This is the default in local dev + CI
 * so we don't burn tokens on every Playwright run.
 */
export async function compileBrief({
  agent,
  briefText,
  serviceName,
}: CompileOptions): Promise<ValidatorResult> {
  const stubMode =
    !process.env.ANTHROPIC_API_KEY ||
    process.env.ANTHROPIC_VALIDATOR_STUB === "true";
  if (stubMode) return stubVerdict(briefText);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const system = buildSystemPrompt(agent);
  const user = buildUserPrompt(briefText, serviceName);
  const started = Date.now();

  async function runOnce(model: string): Promise<ParsedVerdict> {
    const resp = await client.messages.create({
      model,
      max_tokens: 256,
      system,
      messages: [{ role: "user", content: user }],
    });
    const text = resp.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();
    return parseVerdict(text);
  }

  let parsed = await runOnce(HAIKU_MODEL);
  let model = HAIKU_MODEL;
  if (shouldEscalate(parsed, briefText)) {
    parsed = await runOnce(OPUS_MODEL);
    model = OPUS_MODEL;
  }

  return {
    verdict: parsed.verdict,
    clarifyQuestions: parsed.clarifyQuestions,
    rejectReason: parsed.rejectReason,
    model,
    latencyMs: Date.now() - started,
    stubbed: false,
  };
}
