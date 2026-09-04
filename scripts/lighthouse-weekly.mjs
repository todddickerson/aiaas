#!/usr/bin/env node
// Weekly Lighthouse drift gate CLI.
//
// Usage:
//   node --experimental-strip-types scripts/lighthouse-weekly.mjs [baseUrl]
//
// Env:
//   LIGHTHOUSE_BASE_URL     base URL (argv[2] wins)
//   LIGHTHOUSE_BASELINE     path to last week's baseline JSON (optional)
//   LIGHTHOUSE_OUT_DIR      where to write baseline.json + per-page LHRs
//                           (default: ./lighthouse-out)
//   LIGHTHOUSE_DROP_PCT     fail threshold, relative % (default 10)
//   LIGHTHOUSE_FLOOR        warn threshold, absolute score (default 90)
//   LIGHTHOUSE_ALPHA_TOKEN  if set, sent as the alpha-gate cookie so audits
//                           measure the real page, not the /gate interstitial
//   LIGHTHOUSE_BIN          override the lighthouse invocation
//                           (default: `npx --yes lighthouse@12`)
//   LIGHTHOUSE_PAGES        comma-separated page paths to restrict the run
//                           (local smoke testing; default = full catalog)
//
// Requires Node ≥ 22.6 (type stripping) and a Chrome/Chromium the lighthouse
// CLI can find (set CHROME_PATH locally; ubuntu-latest ships Chrome).
//
// Exit codes: 0 = no regression (warnings allowed), 1 = at least one page
// FAILED (>drop% week-over-week or audit error), 2 = misconfigured.
//
// In GitHub Actions: appends the markdown table to $GITHUB_STEP_SUMMARY and
// writes `ok=<bool>`, `report=<path>`, `baseline=<path>` to $GITHUB_OUTPUT.

import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

import {
  PAGES,
  buildBaseline,
  comparePage,
  errorPage,
  extractScores,
  parseBaseline,
  renderMarkdown,
  summarize,
} from "../lib/monitor/lighthouse.ts";

const DEFAULT_BASE_URL = "https://aiaas-todddickerson.vercel.app";
const ALPHA_COOKIE = "aiaas-alpha-pass";

const baseUrl = (
  process.argv[2] ??
  process.env.LIGHTHOUSE_BASE_URL ??
  DEFAULT_BASE_URL
)
  .trim()
  .replace(/\/+$/, "");

if (!/^https?:\/\//.test(baseUrl)) {
  console.error(`lighthouse-weekly: invalid base URL "${baseUrl}"`);
  process.exit(2);
}

const outDir = resolve(
  process.cwd(),
  process.env.LIGHTHOUSE_OUT_DIR ?? "lighthouse-out",
);
mkdirSync(outDir, { recursive: true });

const options = {
  dropThresholdPct: numberEnv("LIGHTHOUSE_DROP_PCT", 10),
  floor: numberEnv("LIGHTHOUSE_FLOOR", 90),
};

const baseline = loadBaseline(process.env.LIGHTHOUSE_BASELINE);
if (baseline) {
  console.log(
    `lighthouse-weekly: baseline from ${baseline.capturedAt || "(unknown)"} with ${Object.keys(baseline.pages).length} pages`,
  );
} else {
  console.log("lighthouse-weekly: no baseline — this run seeds the reference");
}

const pageFilter = process.env.LIGHTHOUSE_PAGES?.split(",")
  .map((p) => p.trim())
  .filter(Boolean);
const pages = pageFilter?.length
  ? PAGES.filter((p) => pageFilter.includes(p.path))
  : PAGES;

const lighthouseBin = (process.env.LIGHTHOUSE_BIN ?? "npx --yes lighthouse@12")
  .split(/\s+/)
  .filter(Boolean);

const verdicts = [];
for (const page of pages) {
  const url = `${baseUrl}${page.path}`;
  const slug = page.path === "/" ? "home" : page.path.replace(/^\//, "").replace(/\//g, "__");
  const outPath = resolve(outDir, `${slug}.json`);
  process.stdout.write(`→ ${url} … `);
  const started = Date.now();
  const result = runLighthouse(url, outPath);
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  if (result.error) {
    console.log(`error (${seconds}s): ${result.error}`);
    verdicts.push(errorPage(page, result.error));
    continue;
  }
  const verdict = comparePage(page, result.scores, baseline?.pages[page.name], options);
  console.log(
    `${verdict.outcome} (${seconds}s) ${verdict.categories.map((c) => `${c.category[0]}=${c.score}`).join(" ")}`,
  );
  verdicts.push(verdict);
}

const { ok, failed, warned } = summarize(verdicts);
const markdown = renderMarkdown(baseUrl, verdicts, baseline, options);

console.log("");
console.log(markdown);
console.log("");
console.log(
  ok
    ? `✅ ${verdicts.length} pages within budget${warned.length ? ` (${warned.length} under floor)` : ""}`
    : `❌ ${failed.length} of ${verdicts.length} pages regressed`,
);

const nextBaseline = buildBaseline(baseUrl, verdicts, baseline);
const baselinePath = resolve(outDir, "baseline.json");
writeFileSync(baselinePath, `${JSON.stringify(nextBaseline, null, 2)}\n`);
const reportPath = resolve(outDir, "report.md");
writeFileSync(reportPath, `${markdown}\n`);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
}
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `ok=${ok}\nreport=${reportPath}\nbaseline=${baselinePath}\nfailed=${failed.length}\n`,
  );
}

process.exit(ok ? 0 : 1);

// ---------------------------------------------------------------------------

function numberEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function loadBaseline(path) {
  if (!path) return null;
  const abs = resolve(process.cwd(), path);
  if (!existsSync(abs)) {
    console.log(`lighthouse-weekly: baseline file ${abs} not found — ignoring`);
    return null;
  }
  try {
    const parsed = parseBaseline(JSON.parse(readFileSync(abs, "utf8")));
    if (!parsed) console.log("lighthouse-weekly: baseline file unusable — ignoring");
    return parsed;
  } catch (err) {
    console.log(`lighthouse-weekly: baseline unreadable (${err.message}) — ignoring`);
    return null;
  }
}

function runLighthouse(url, outPath) {
  const args = [
    ...lighthouseBin.slice(1),
    url,
    "--quiet",
    "--output=json",
    `--output-path=${outPath}`,
    "--only-categories=performance,accessibility,best-practices,seo",
    "--preset=desktop",
    '--chrome-flags=--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage',
  ];
  if (process.env.LIGHTHOUSE_ALPHA_TOKEN) {
    args.push(
      `--extra-headers=${JSON.stringify({
        Cookie: `${ALPHA_COOKIE}=${process.env.LIGHTHOUSE_ALPHA_TOKEN}`,
      })}`,
    );
  }
  const proc = spawnSync(lighthouseBin[0], args, {
    encoding: "utf8",
    timeout: 5 * 60 * 1000,
    env: process.env,
  });
  if (proc.error) return { error: proc.error.message };
  if (proc.status !== 0) {
    const tail = (proc.stderr || proc.stdout || "").trim().split("\n").slice(-3).join(" | ");
    return { error: `lighthouse exited ${proc.status}: ${tail || "(no output)"}` };
  }
  if (!existsSync(outPath)) return { error: "lighthouse produced no report" };
  try {
    return { scores: extractScores(JSON.parse(readFileSync(outPath, "utf8"))) };
  } catch (err) {
    return { error: err.message };
  }
}
