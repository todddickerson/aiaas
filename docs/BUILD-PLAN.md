# AIaaS.com — Build Plan v2
*Updated 2026-05-16 after Vercel research + war-game v1 + Todd's constraints.*
*Supersedes v1.*

---

## Locked constraints (from Todd, 2026-05-16)

- **Team:** Todd + Ea only. Sanzone joins later for polish.
- **Org:** New LLC, owned by Todd personally (NOT a CF product, no Russell partnership). Repo, Whop parent biz, Composio org, Vercel project, domain — all under the new LLC.
- **Domain:** aiaas.com (owned).
- **Timeline:** Days, not weeks. Working target: alpha live in ~12 days.
- **Marketplace from day 1.** Not a closed catalog. The marketplace IS the product. (War-game's "ship catalog only" recommendation = rejected.)
- **Stack:** Vercel-native. No Render, no Trigger.dev. Vercel Functions + Queues + Workflows handle every async path under 800s.
- **Composio:** Acceptable single-vendor dependency. First-party fallback for the top 3–5 most-used integrations can come later.
- **Whop:** New parent biz under the platform partnership umbrella. Onboarding is instant until builder withdrawal exceeds $2,500 — that's the KYC trigger, not signup.
- **Differentiation vs Anthropic/OpenAI marketplaces:** vendor-flexibility. AIaaS = "your agents from any runtime, your context vault, you don't get locked into one model maker." Anthropic's marketplace forces Claude; ours doesn't care.
- **Testing:** E2E from commit #1. Drift / regression detection automated.

---

## Stack (final)

| Layer | Choice | Why |
|---|---|---|
| Web + API | **Next.js 16 App Router + React 19 + TypeScript** | Prototype is React; SSR for public agent pages |
| Styling | **Tailwind v4 + shadcn/ui + Tailwind Plus templates** | Theme tokens map from `theme.jsx` 1:1 |
| DB + Auth + Realtime + Storage | **Supabase** | RLS, Realtime channels, Google/Apple/GitHub/magic-link |
| Sync API routes | **Vercel Functions** (Fluid Compute, `maxDuration: 800s`) | Everything from validators to hands-off agent runs fits |
| Durable jobs | **Vercel Queues** (public beta Feb 2026) | 3-AZ replicated, at-least-once, idempotency keys, retries |
| Long-running orchestration | **Vercel Workflows** | Unlimited duration, can sleep months; per-step bounded by Functions |
| Live-trace fanout | **Supabase Realtime + SSE** | No external WS service needed for v1 |
| Payments / MoR | **Whop** (new parent `biz_aiaas_*`) | Per Overskill pattern |
| Integrations | **Composio v3** (new org) | `team__${accountId}` entity pattern |
| LLM calls | **Anthropic API direct** (Opus 4.7 / Haiku for compiler) | Prompt caching, OpenRouter not used here |
| Email | **Resend** (transactional) + **AgentMail** (per-agent inboxes) | Both already provisioned |
| Errors | **Sentry** (new project `aiaas-web`) | |
| CDN / DDoS | **Cloudflare** in front of vercel deployment | |
| Tests | **Playwright + Vitest + GitHub Actions** (see §6) | E2E from day 1 |

**Single vendor count: Vercel + Supabase + Whop + Composio + Anthropic + Resend + Sentry + Cloudflare = 8.** Cuts ~2 vendors vs v1 (no Render, no Trigger.dev, no Inngest).

---

## What we cut vs v1

- ❌ Render proxy gateway service → moved to Next.js API routes (Fluid Compute, 800s ceiling, no cold-start latency issue with Vercel's new defaults)
- ❌ Render event-ingest service → moved to Next.js API route writing to Supabase, Realtime fans out to SSE
- ❌ Trigger.dev → replaced by Vercel Queues + Workflows
- ❌ "12-week MVP" framing → days-not-weeks alpha, with public roadmap of v1/v2/v3 capabilities

---

## Day-by-day plan (the 12-day alpha)

**Goal of the alpha:** marketplace shell live at aiaas.com, 3 in-house agents listed + hireable (Funnelsmith, AdHook, NewsletterDraft), live trace working on at least one, Whop wallet wired, Composio integrations for Slack/email/Notion working, public agent profile pages indexed, full E2E test coverage on the critical paths.

| Day | Surface | Outcome |
|---|---|---|
| **0** | Org + ops | Form LLC (skip if already filed — confirm w/ Todd), buy company Stripe ↔ bank, create new Whop parent biz `biz_aiaas_*`, new Composio org/project, new Vercel team scope, repo at `~/src/Github/aiaas`, GitHub Actions wired |
| **1** | Repo skeleton | Next.js 16 + Supabase + Tailwind v4 + shadcn/ui + Playwright + Vitest + CI green on first commit. Theme tokens from `theme.jsx` ported. Auth (Google + magic-link) working. |
| **2** | Marketing shell | Hero + nav + footer from `shell.jsx`. Marketplace grid skeleton with mock data. /how-it-works (dual-audience toggle) and /manifesto from `pages.jsx`. **Lighthouse pass on / and /how-it-works.** |
| **3** | Agent cards + detail | Port `cards.jsx` (all 4 variants) + `agent-detail.jsx` (profile → brief). Marketplace browse fully interactive against Supabase `agents` table. Seed 3 in-house agents. |
| **4** | Brief validator | English brief → Claude-compiled validator → pass / clarify / reject. Vercel Function `maxDuration: 60`. UI surfaces clarify modal from `agent-detail.jsx`. **First Playwright E2E:** "happy-path hire → validation → queue." |
| **5** | Whop wallet + payment | Top-up flow (Whop checkout), balance display, hold on hire, release on delivery. Webhook handlers. Manual delivery for now. **E2E:** "buyer hires → $ holds → manual mark-delivered → $ releases." |
| **6** | Agent runtime + Composio | Vercel Workflow orchestrates: brief validated → call agent (our in-house worker function or external builder webhook) → Composio proxy posts to Slack/email/Notion. Per-agent scope grants enforced. **E2E:** "real run end-to-end, delivers to test Slack." |
| **7** | Live trace | `POST /v1/runs/:id/events` → Supabase Realtime → SSE → browser. Port `live-trace.jsx`. Replay from `events` table. **E2E:** "trace events arrive within 500ms p95." |
| **8** | Public publish flow (builder) | Port `developers.jsx`. Builder onboards, writes English spec, picks runtime + destinations, Whop payee link, spec compiles to validator, agent goes live. **E2E:** "create-agent-from-scratch in 10 min, hire it, deliver." |
| **9** | Next-steps + hands-off | Port `next-steps.jsx` + `handsoff.jsx`. Chains (cap = 2 agents in v1), schedules (cron), hands-off proposal generation via Workflow. **E2E:** "schedule a weekly run, fires on cron, delivers." |
| **10** | Manager profile + portfolio + trust | Port `manager-profile.jsx`, `portfolio.jsx`, `trust.jsx`. Public SEO pages. Sitemap + structured data. **Visual regression suite enabled** on all marketing + agent pages. |
| **11** | QA day | Run full Playwright suite, fix everything red. Sentry sources mapped. Lighthouse ≥90 on all public pages. Load test brief validator + live trace at 50 RPS. Backup + restore drill. |
| **12** | Alpha launch | DNS cutover, Cloudflare in front, status page live (Vercel native + a public health endpoint). Soft-launch to a private list of 20–50. Watch Sentry + logs for 48h. |

**Buffer assumption:** any day can become 1.5–2 days at the AI-coding-loop level. Honest expectation is 12–18 days to alpha, not 12. We're being aggressive intentionally to find the real bottleneck.

---

## E2E + drift detection — built in from commit #1

This is the non-negotiable. The whole reason Todd is letting an AI build this is that the AI can catch its own bugs.

**Three layers of safety:**

### 1. Unit + integration (Vitest)
- Every reducer, every validator, every Composio adapter → unit test alongside the code.
- Every API route → integration test with Supabase test DB.
- CI requires green on every PR.

### 2. End-to-end (Playwright)
- Headless Chromium, runs on every PR, runs nightly against staging, runs on every prod deploy.
- Critical paths from day 1: signup, hire flow, brief validation, payment hold, delivery, refund, public agent page render.
- Each new feature ships with at least one happy-path E2E **and** one error-path E2E (e.g., brief validator rejects bad input).
- Auth fixture: test-user pre-confirmed via Supabase admin API on test setup, à la the Overskill staging QA pattern (`claude-test-staging@overskill.app`).

### 3. Visual regression (Playwright `toMatchSnapshot`)
- Marketing pages + agent profile pages + dashboard surfaces.
- Snapshots stored in git. Diffs fail the PR. PR description shows the diff inline.
- Theme matrix: all 4 accents × dark/light × at least 2 type pairs = 16 snapshots per page. Sounds heavy; it's cheap on Vercel preview deployments.

**Drift detection in production:**
- Synthetic monitor (GitHub Action cron, every 15 min) hits 5 critical endpoints + the homepage. Sentry alerts on regression.
- Vercel Speed Insights + Analytics on by default.
- Weekly automated Lighthouse run, fails the build if any metric drops >10% week-over-week.

**Build-agent guardrails:**
- Every coding-agent session works in a git worktree, opens a PR. PRs cannot self-merge unless: CI green AND Playwright green AND visual snapshots either match or are explicitly approved by Todd.
- Failed PRs auto-comment what broke and which test caught it. Self-correcting loop.

---

## Data model (final, MVP shape)

Same as v1 with two changes:
- No separate `vercel_proxy_audit` table — combined into `composio_audit` writing from API route directly.
- Live-trace `events` partitioned weekly, retained 30 days (configurable per spec).

```
users / profiles
agents / specs
connections / grants
runs / events / artifacts
chains / schedules / next_steps_suggestions
wallets / ledger_entries
builder_payouts
composio_audit
```

RLS on everything user-scoped. Service-role-only writes to `grants`, `connections`, `composio_audit`.

---

## Differentiation answer (the moat question, sharpened)

**Why won't Anthropic eat this?** Because their marketplace forces Claude. Ours doesn't. The CF/IM operator who hires a funnel agent doesn't care if it's Claude or Hermes or BYO — they care that it ships on time, integrates with their stack, and doesn't lock them in.

Three concrete moat layers:

1. **Runtime-agnostic** — agents from any model maker list here. Tomorrow's best agent isn't necessarily Claude; we don't lose the buyer when the model rankings shift.
2. **Context vault** — buyer's brand voice, avatar, past hires, integration tokens compound across agents. Every hire gets cheaper input → output ratio because we carry context forward. Switching cost grows with usage.
3. **Operator UX, not developer UX** — Anthropic's marketplace is built for developers who already know MCP, scopes, claude-code. Ours is built for a non-technical CF buyer who types a brief in English and gets a deliverable in Slack. Different ICP, different surface.

**Stated as a one-liner:** *AIaaS.com is where non-technical operators hire production AI agents from any runtime, with one bill, one wallet, one context vault, and human UX wrapped around every run.*

---

## Whop builder onboarding (corrected per Todd)

War-game v1 was wrong on this. Whop builder signup is instant. KYC is only triggered when a builder requests a withdrawal >$2,500. So the publish-to-paid loop is:

1. Builder writes English spec → spec compiled → agent live (10 min, no friction)
2. Buyer hires, money holds in Whop wallet
3. Delivery → money releases to builder's Whop balance
4. Builder withdraws when ready: <$2,500 cumulative → instant ACH; >$2,500 → quick KYC

Publish flow stays self-serve and instant. KYC is a withdrawal-time gate, not a publish-time gate. Update PRD §8 to reflect this — current PRD is more pessimistic than reality.

---

## Risk register (post-war-game, sharpened)

| Risk | Mitigation in plan |
|---|---|
| Anthropic / OpenAI bundle a competing marketplace | Runtime-agnostic = the structural defense. Plus operator-UX wedge. We don't try to win the developer marketplace; we win the buyer marketplace. |
| Composio v3 breakage or acquisition | API surface area we expose to builders is OUR shape (`/v1/proxy/:tool.:method`), not Composio's. Composio is the implementation behind that surface; swappable adapter pattern from commit 1. |
| Whop hold / freeze blast radius | New parent biz keeps blast radius contained. Builder withdrawals batched, idempotent, observable. |
| LLM validator false positives → refund variance | Cap refunds at 5% of monthly GMV via internal alert. Above that, validator gets retrained / prompt-tightened. |
| Vercel maxDuration insufficient for some agent run | 800s = 13 min, more than enough for our 3 in-house agents. Builders with longer runs use webhook-back pattern (their agent runs on their infra, posts events to us). |
| Solo build burns Todd's bandwidth | E2E + visual regression + coding-agent loops mean Todd reviews PRs and sets direction, doesn't write code. If review load >2h/day, slow down — but the plan keeps reviews bounded. |
| First 20 agents don't materialize | We seed with 3 in-house. CF/MS.ai/Overskill IP gives us material for 5+ more. We can publish 8 ourselves; partners come in month 2-3. |

---

## What I need from Todd before I cut code

(All small, fast answers.)

1. **LLC name + state.** Need this for Whop biz signup, Vercel team name, repo namespace.
2. **Brand wordmark / logo direction.** Sanzone-style polished, or quick-and-clean to ship and iterate? My read: quick-and-clean now, polish in week 2 when Sanzone joins.
3. **Repo location.** `~/src/Github/aiaas` under your personal GitHub, or new GitHub org for the LLC?
4. **First 3 in-house agents.** Funnelsmith / AdHook / NewsletterDraft from the seed data, or different list? My pick:
   - **Funnelsmith** — full opt-in funnel + indoctrination sequence, $79–$349
   - **AdHook** — 5 ad creatives + 3 hooks for a given offer, $49
   - **NewsletterDraft** — weekly newsletter draft from a topic + your past hits, $29 (or $97/mo recurring — anchors the hands-off product)
5. **Confirm I should write PRD v2 / hard-spec the alpha cut before coding,** or jump straight to day-0 ops + day-1 repo skeleton and let the plan be the spec.

Once I have those, day 0 starts immediately. Day 1 commit goes in tomorrow.

---

## Progress log

- **Day 3 (2026-05-20)** — Agent detail page ported from `agent-detail.jsx` (hero, services + wallet-hold panel, sample output, deliverables grid, trust strip, run history, brief→clarify→queue→done modal). `agents` table migration + RLS landed in `supabase/migrations/`; in-house Funnelsmith / AdHook / NewsletterDraft seeded. Sync `AGENTS` now sources from `lib/seed/agents.seed.json`; new `loadAgents()` / `loadAgent()` fetch from Supabase with JSON fallback. Home + detail pages call the async loader. (PR #3)
- **Slice A (2026-05-20)** — Brief validator wired end-to-end. `POST /api/v1/briefs/validate` (Anthropic SDK, Haiku → Opus escalation, `maxDuration: 60`, stub mode for local dev / CI). `briefs` table + RLS migration. Hire-flow modal now calls the validator and routes to pass / clarify / rejected states. Vitest covers the stub verdicts; Playwright covers the happy-path + rejected + clarify + API 400/404. (PR #4)
- **Slice B (2026-05-20)** — Whop wallet skeleton with stub mode. `wallet_holds` + `wallet_transactions` migrations (RLS owner-select, service-role writes only). `lib/whop/client.ts` covers top-up / open hold / release hold against `api.whop.com/v1`; `WHOP_STUB=true` (or missing key) returns deterministic stub IDs so the rest of the stack can run before the real `biz_aiaas_*` parent biz is provisioned. `POST /api/v1/wallet/top-up` + `GET /api/v1/wallet/balance` endpoints. Wallet pill in the top nav reads balance + stub-tops-up $50 on click. Idempotency-key plumbed through ledger writes. (PR #5)
- **Slice C (2026-05-20)** — Runs orchestration skeleton. `runs` + `run_events` migration with owner-select RLS. `lib/runs/service.ts` runs the lifecycle (validating → holding → running → delivered → accepted), stamping a `run_events` row at every transition; idempotency keys flow through `runs` and the nested wallet hold. Mock runtime adapter (`lib/agents/runtime.ts`, `MOCK_RUNTIME_DELAY_MS` env-tunable) echoes the brief back as deliverables. Endpoints: `POST /api/v1/runs/create` (maxDuration 800), `GET /api/v1/runs/[id]`, `POST /api/v1/runs/[id]/accept`. Tests: Vitest covers happy-path + validator-block + insufficient-balance + idempotency + accept; Playwright covers the full top-up → create → poll → accept round-trip. (PR #6)
- **Slice 1 / live trace (2026-05-20)** — `lib/runs/events.ts` adds an append + pub/sub bus for `run_events`, with Supabase Realtime subscription when configured. `POST /api/v1/runs/[id]/events` for external runtimes; `GET /api/v1/runs/[id]/events` returns an SSE stream (backlog replay → live fanout → `done` frame on terminal state, with 15s keepalives). Mock runtime now emits 6 intermediate trace events (thought / read / tool / write artifact / log / milestone). `<LiveTrace />` client component (port of `live-trace.jsx`) connects via `EventSource`, renders the terminal-style timeline, and previews write-artifact chips. Hire-flow modal now creates a real run after a passing brief and mounts the trace inline. (PR #7)
- **Slice 2 / Composio adapter (2026-05-20)** — `POST /api/v1/proxy/[tool]/[method]` exposes our integration surface (`/v1/proxy/:tool/:method`); `lib/composio/client.ts` wraps Composio v3 (`/actions/execute`) underneath. Stub mode (default when `COMPOSIO_API_KEY` unset or `COMPOSIO_STUB=true`) returns plausible payloads for Slack / Gmail / Notion and echo-only for everything else. Every call writes a `composio_audit` row (RLS owner-select). Tests: 5 Vitest cases on the stub branching + 5 Playwright cases on the proxy route guards + happy paths. (PR #8)
- **Slice 3 / Builder publish flow (2026-05-20)** — `agent_drafts` migration (RLS owner-select/insert/update). `lib/validator/compile-spec.ts` is the Anthropic-driven spec compiler (Haiku, stub heuristics in CI). `lib/drafts/service.ts` owns the draft lifecycle: `createDraft` → `updateDraft` → `compileDraftSpec` (spec_status flips draft → compiling → ready / needs_revision / rejected) → `linkWhopPayee` (stub payee id until Slice 5) → `submitDraft` (publish_status: draft → submitted; gated on ready spec + linked payee). API routes: `POST /api/v1/agents/drafts`, `GET/PATCH /api/v1/agents/drafts/[id]`, `POST .../compile`, `POST .../payee`, `POST .../submit`. Five-step wizard at `/publish` (Identity → Spec → Runtime+destinations → Payee → Review/submit). Tests: 7 Vitest cases on the draft lifecycle + 5 Playwright cases on the wizard + API round-trips. (PR #9)
- **Slice 4 / Public profile pages (2026-05-20)** — Manager seed at `lib/seed/managers.ts` (4 managers, managed-agent maps, endorsements, activity, verticals). Three new SEO routes: `/managers/[handle]` (cover + sidebar + managed-agent grid + endorsements + activity, prerendered for all four), `/portfolio` (28-item delivery gallery aggregated from agents' `sampleDeliverables`, with cross-links into agent detail), `/trust` (4-pillar overview + 4 metrics + 3 policies + dispute CTA). Footer now links Trust & Portfolio. Tests: 5 Vitest cases on manager seed integrity + 5 Playwright cases on the three new pages + footer routing. (PR #10)
- **Slice 5 / real Whop biz wire-up (2026-05-20)** — `lib/env.ts` exposes the Whop env (accepts `WHOP_API_KEY` / `WHOP_BIZ_ID` and the `WHOP_AIAAS_*` aliases that live in `~/clawd/.env`). `lib/whop/client.ts` rewritten as a thin REST v1 wrapper modeled on Overskill's `Whop::Client`: Bearer auth, `Idempotency-Key` header, no-throw-on-4xx (callers handle), and four real endpoints — `getCompany`, `listPayments`, `createCheckoutConfiguration`, `createAffiliate`. Stub mode defaults off when a key is set. `lib/whop/biz-info.ts` caches the `getCompany` result for 60s; the agent-detail wallet panel surfaces `Escrow · Whop AIaaS · biz_9fbStuuVdEBhN9` from that. Vitest integration covers `getCompany(biz_9fbStuuVdEBhN9).title === "AIaaS"` (verified locally against the live key; auto-skips when env unset, so CI stays green without secrets). (PR #11)
- **Day 6 / runtime + Composio orchestration (2026-05-21)** — Per-agent destinations + scope grants. Migration adds `agents.destinations` jsonb (allow-list of `{tool, method, target}`); the three in-house agents seed with Slack (`#aiaas-alpha`), Notion (`funnelsmith-deliveries` / `newsletter-archive`), and Gmail (`operator+newsletter@aiaas.com`) targets. `lib/agents/grants.ts` exposes `checkScope` (matches a proposed call against the agent's destinations); the `/api/v1/proxy/:tool/:method` route now calls it before invoking Composio — out-of-scope tools or off-channel targets return `403 scope_violation`, write a denial row to `composio_audit`, and emit a `proxy_scope_denied` event when a `runId` is set. `lib/agents/destinations.ts` is the run-time delivery dispatcher: after the runtime returns artifacts, the orchestrator iterates the agent's destinations and POSTs a per-tool payload (slack→channel+text, gmail→to+subject+body, notion→parent+properties) via the Composio client, stamping `destination_dispatched` + `destination_delivered` events on each step so the live trace surfaces every delivery. Six new tests: 6 Vitest cases on `checkScope` allow/deny, 4 Vitest cases on `deliverArtifacts` (count, no-destinations no-op, idempotency, target keys), 4 new Playwright cases on the proxy (in-scope happy paths, 403 off-channel, 403 undeclared tool, no-destinations passthrough), plus a new E2E that verifies a delivered run emits the destination events with the right targets. (PR #12)
- **Day 7 / live trace polish + replay (2026-05-21)** — `/runs/[id]` is now a real replay page: server-renders the agent header + status + event count, then mounts the same `<LiveTrace />` the hire-flow modal uses. Terminal runs (accepted / failed / cancelled / expired) show a "replayed from the events table" footer; in-flight runs see the SSE live fanout. The in-memory run + event stores moved to `globalThis` so the API route handlers and the server-component page share state (Next 16 sometimes bundles them into separate JS module instances). LiveTrace's `KIND_META` now recognises Day-6 destination events (`destination_dispatched`, `destination_delivered`, `destination_failed`, `proxy_scope_denied`) with proper glyphs + labels (`dispatch → slack.send_message` / `delivered → notion.create_page` / etc.) and a detail line that surfaces the target keys. Two new Playwright cases: (1) POST event → backlog round-trip p95 latency < 500ms across 20 samples, (2) replay page renders the trace + terminal note + LiveTrace for an accepted run. (PR #13)
- **Day 8 / publish goes live (2026-05-21)** — Drafts submitted via the wizard or the API auto-publish in alpha: `submitDraft` builds an `Agent` shape from the draft and registers it in a new globalThis-backed published-agents store, then flips `publishStatus` straight to `live`. The marketplace home/loader merges published agents in ahead of the seed catalog so a newly published slug shows up immediately at `/agents/[slug]`. `/developers` is no longer a stub — it ports the relevant `developers.jsx` sections into a focused hero + quickstart code block + 6-step lifecycle strip + CTA, all wired into the existing publish wizard. The Day-8 acceptance E2E walks the API: create draft → patch full spec → compile → link payee → submit (→ publish_status `live`) → assert `/agents/<slug>` 200s → top-up wallet → create run for the new agent → assert `status: delivered` with artifacts. (PR #14)
- **Day 9 / chains + schedules (2026-05-21)** — Migration adds `schedules` (cron-style recurring hires with `cadence` ∈ daily/weekly/monthly and a `brief_template`) and `chains` (v1 cap of 1 downstream agent, optional `budget_cap_cents`). `lib/schedules/service.ts` owns the CRUD + `fireSchedule(id)` which builds a deterministic idempotency key (`schedule:<id>:fire:<n>`) and creates a real run through the existing orchestrator. `lib/chains/service.ts` owns the same shape for source-agent → target-agent pairings plus `fireChainsForCompletedRun()` which the run-accept route now calls — when a buyer accepts a run on agent A, every active chain `A → B` enqueues a downstream run with the chain's brief template (honoring the budget cap; over-budget chains auto-pause). Six new API routes: `GET/POST /api/v1/schedules`, `GET/DELETE /api/v1/schedules/[id]`, `POST /api/v1/schedules/[id]/fire` (this is the cron target), `GET/POST /api/v1/chains`, `GET/DELETE /api/v1/chains/[id]`. Tests: 10 Vitest cases (5 schedules + 5 chains incl. budget-cap pause and cross-user isolation) plus 5 Playwright cases covering the Day-9 acceptance criterion ("schedule a weekly run, fires on cron, delivers"), chain-on-accept, schedule cancel, and the two 400 guards. (PR #15)
- **Day 10 / SEO surfaces (2026-05-21)** — `app/sitemap.ts` emits `/sitemap.xml` (static marketing routes + every agent + every manager) and `app/robots.ts` emits `/robots.txt` (allow root, disallow `/dashboard`, `/publish`, `/runs`, `/api`, plus the sitemap pointer). JSON-LD structured data lands on four SEO surfaces: agent detail (`Product` with `AggregateOffer` + `AggregateRating`), manager profile (`Person` with `makesOffer` mapping to managed agents), portfolio (`CollectionPage` with `hasPart` per delivery), trust (`WebPage`). Six new Playwright cases verify the sitemap contains the expected URLs, robots.txt has the right disallow + sitemap line, and every JSON-LD script parses as JSON with the expected `@type` + key fields. (Day-10's visual-regression-on-all-pages line gets picked up in Day 11 QA — the linux baseline snapshots can't be generated from this darwin worktree.) (PR #16)

