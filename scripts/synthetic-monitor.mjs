#!/usr/bin/env node
// Synthetic production monitor CLI.
//
// Usage:
//   node --experimental-strip-types scripts/synthetic-monitor.mjs [baseUrl]
//   MONITOR_BASE_URL=https://... node --experimental-strip-types scripts/synthetic-monitor.mjs
//
// Requires Node ≥ 22.6 (type stripping) — the workflow pins Node 22. On
// Node ≥ 23.6 the flag is a harmless no-op. Zero dependencies by design so
// the monitor cannot be broken by an app dependency bump.
//
// Exit codes: 0 = all probes pass (warnings allowed), 1 = at least one FAIL,
// 2 = misconfigured (no base URL).
//
// When run inside GitHub Actions, appends a markdown table to
// $GITHUB_STEP_SUMMARY and writes `ok=<bool>` + `report=<path>` to
// $GITHUB_OUTPUT so the alerting step can open/comment on an issue.

import { appendFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  renderMarkdown,
  runSyntheticMonitor,
  summarize,
} from "../lib/monitor/synthetic.ts";

const DEFAULT_BASE_URL = "https://aiaas-todddickerson.vercel.app";

const baseUrl = (process.argv[2] ?? process.env.MONITOR_BASE_URL ?? DEFAULT_BASE_URL)
  .trim()
  .replace(/\/+$/, "");

if (!/^https?:\/\//.test(baseUrl)) {
  console.error(`synthetic-monitor: invalid base URL "${baseUrl}"`);
  process.exit(2);
}

const results = await runSyntheticMonitor(baseUrl);
const { ok, failed, warned } = summarize(results);
const markdown = renderMarkdown(baseUrl, results);

console.log(markdown);
console.log("");
console.log(
  ok
    ? `✅ ${results.length} probes healthy${warned.length ? ` (${warned.length} slow)` : ""}`
    : `❌ ${failed.length} of ${results.length} probes FAILED`,
);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
}
if (process.env.GITHUB_OUTPUT) {
  const reportPath = resolve(process.cwd(), "synthetic-monitor-report.md");
  writeFileSync(reportPath, `${markdown}\n`);
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `ok=${ok}\nreport=${reportPath}\nfailed=${failed.length}\n`,
  );
}

process.exit(ok ? 0 : 1);
