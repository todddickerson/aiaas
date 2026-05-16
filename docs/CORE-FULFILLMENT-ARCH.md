# AIaaS.com — Fulfillment Core Architecture
*The heart of the platform: how a hire becomes a delivered outcome. How we coordinate agents we don't host. How we never lose a run.*
*Drafted 2026-05-16.*

---

## The one-sentence model

**A `run` is the central object. Everything is either creating one, advancing one, observing one, or settling one.** All coordination is choreography around the `run` state machine, driven by a Vercel Workflow that owns the run's lifecycle, with idempotent steps backed by Vercel Queues and event observability via Supabase Realtime.

---

## The run state machine

```
                       ┌───────────────────────────────────────────────────────────┐
                       │                                                           │
   draft ──► validating ──► clarifying ──► funded ──► queued ──► dispatched ──► running ──► delivering ──► delivered
                                                                                  │
                                                                                  ▼
                                                                          awaiting_operator (notify_operator escape hatch) ──► resumes running
                       │                                                                                       │
                       │                                                                                       ├─► accepted (auto in 24h or manual)
                       │                                                                                       │
                       │                                                                                       └─► disputed ──► resolved / refunded
                       │
                       └─► rejected (validator-rejected, no charge)
                       └─► cancelled (buyer or system before dispatch)
                       └─► failed (agent timeout / error)  ──► auto_refunded
```

**Every transition is:**
- Atomic (Postgres advisory lock on `run.id` for the duration of the transition)
- Audited (`run_transitions` table append-only: from, to, reason, actor, at, payload)
- Webhook-observable (subscribers can listen for any state change)
- Idempotent (replays produce the same effect — critical because Queues are at-least-once)

**Why this matters:** the moment we lose the ability to answer "where is run X right now and what's it waiting on," we lose the product. Every UI surface, every notification, every refund decision reads from this state machine.

---

## The run actors

A run involves up to 6 parties. Knowing whose job it is at each step is the entire coordination problem.

| Actor | Role | Lives where |
|---|---|---|
| **Buyer** | Submits brief, holds funds, accepts delivery, owns context vault | aiaas.com dashboard |
| **Operator** *(human, agent owner)* | Owns the agent listing, sets pricing + SLA + spec, handles disputes, gets paid, receives `notify_operator` escalations | aiaas.com operator console |
| **Builder agent** *(non-human, the runtime)* | Actually executes the work on dispatch | Operator's own infra |
| **AIaaS platform** | Orchestrates run lifecycle, enforces SLA, brokers proxy + payment | Vercel + Supabase |
| **External tools** | Slack, Notion, Figma, GitHub, Meta Ads, etc. | Buyer's accounts, brokered via Composio |
| **Whop** | Holds + releases funds; payouts to operators | Whop |

**The operator/agent split (important).** One operator can own many agents. One agent has exactly one operator. The operator is the legal + financial + accountability party. The agent is just code listening for dispatches.

- Operator owns the Whop payee relationship (operator KYC is what gates withdrawals >$2,500, not the agent).
- Operator owns the spec, pricing, SLA, follow-up policy, scope-declarations.
- Operator is who `notify_operator(...)` routes to when a run needs human judgment (legal review, custom auth, ambiguous brief).
- Operator gets all dispute notifications and decides whether to refund / counter / escalate to AIaaS ops.
- Operator owns the `agents.owner_user_id` foreign key — that's the bill-to / pay-to / liable party.

**Operator types we support:**

| Type | Example | Notes |
|---|---|---|
| Solo indie | A dev publishing one agent | Default. ~80% of operators at launch. |
| Agency / team | A studio with 4 agents, shared admin | Multiple seats sharing one operator account. Team RBAC. |
| First-party (us) | AIaaS publishes its own in-house agents | Internal-flagged operator account. Same surface, different `operator_type='first_party'` for transparency. |
| Power user / hybrid | A buyer who also operates one or two agents | Same user record, has both `buyer_profile` and `operator_profile`. |

**Critical design rule:** AIaaS is the ONLY party with the full picture. Operators see only their agents' runs. Buyers see only runs they own. Agents see only the run they were dispatched against. External tools see only the scoped action we proxy.

---

## Anatomy of one run, end to end

Walk this with the columns "who acts," "where it runs," "what gets durably written," "what can go wrong → recovery."

### Phase 1 — DRAFT → VALIDATING → CLARIFYING/REJECTED/FUNDED

**1. Buyer hits "Hire" on agent page** (Next.js Server Action)
- Creates `runs` row, state=`draft`, brief=textarea content, spec_id=current, `operator_id=agents.owner_user_id` snapshotted at hire time.
- Logs `run_transitions: null→draft`.
- Why snapshot `operator_id`: if the agent changes hands mid-flight (operator transfers ownership), the run still pays out to the original operator. No retroactive surprises.

**2. Vercel Workflow `validateBrief` starts** (Workflows = unlimited duration orchestration)
- Step 1: LLM validator call (Function `maxDuration:60`, Claude Haiku for speed + cost).
  - Input: brief + agent's compiled validator JSON + buyer's profile/context vault.
  - Output: `{verdict: "pass"|"clarify"|"reject", clarifying_questions?:[], reasons?:[]}`
- Step 2: Transition based on verdict:
  - **reject** → state=`rejected`, store reasons, end. Buyer sees them inline. No charge ever.
  - **clarify** → state=`clarifying`, send ≤3 questions to buyer, **pause Workflow up to 24h**.
  - **pass** → proceed to funding.
- Step 3 (clarify path resumes when buyer answers): re-run validator with combined input, transition again.
- Step 4 (pass): hold funds via Whop API. If success → state=`funded`, log Whop `transaction_id`. If fail → state=`failed`, surface payment error.

**Durable writes:** `run_transitions`, `validator_calls` (every LLM call w/ tokens + cost), `clarifying_questions` (Q+A pairs), `wallets.ledger_entries` for the hold.

**Can fail at:** LLM down (retry w/ fallback model), buyer disappears mid-clarify (Workflow times out at 24h, state=`cancelled` no charge), Whop hold fails (state=`failed`).

### Phase 2 — FUNDED → QUEUED → DISPATCHED

**5. Funded run → enqueue to dispatch queue** (Vercel Queue: `runs.dispatch`)
- Message: `{run_id, agent_id, spec_id, brief, context_token}`
- Idempotency key: `run_id` (a run can be queued only once).
- `context_token` is a short-lived JWT (15 min) that authorizes the builder agent to call our proxy on this run's behalf.

**6. Queue consumer picks up message → dispatches to builder agent**
- Determines builder runtime from spec:
  - `runtime: in-house` → invoke our Vercel Function `agents/<id>/run`
  - `runtime: webhook` → POST to builder's `webhook_url` with run payload + `context_token`
  - `runtime: claude` / `openai` / `hermes` / `manus` → call their hosted-agent API with our wrapper
  - `runtime: mcp` → open MCP session over WebSocket/SSE per protocol spec
- Transition state=`dispatched`, log dispatch attempt + builder ack.
- If builder doesn't ack within agent's SLA window: requeue with exponential backoff (max 3 tries). On final fail → state=`failed`, auto-refund.

**Durable writes:** `dispatches` (attempts table — when, where, ack/no-ack, error).

**Can fail at:** Builder server down (retry → fail → auto-refund), builder rejects payload (state=`failed`, refund), network issue (retry).

### Phase 3 — DISPATCHED → RUNNING → DELIVERING

**7. Builder agent runs on its own infra** (NOT our problem to host)
- Builder POSTs events to `POST /v1/runs/:run_id/events` while working.
- Each event: `{kind, label, detail?, artifact?, ts}` — see PRD §6.
- Events go to `events` table, append-only, partitioned weekly.
- Supabase Realtime pushes to buyer's dashboard via SSE. Live trace surface renders.
- First event arriving transitions state=`running`.

**8. Builder agent uses our proxy** for any external-tool action
- POST `/v1/proxy/:tool.:method` with `context_token` (the run-scoped JWT)
- Our Vercel Function:
  - Validates token → resolves user_id + agent_id + run_id
  - Loads buyer's connection for that tool from `connections` table
  - Loads grant for `(agent_id, connection_id)` → checks scope + filter (e.g., "only #funnels channel")
  - Calls Composio with buyer's vaulted token + builder's payload
  - Logs `composio_audit` (every call: tool, method, input hash, status, latency)
  - Returns response to builder
- Token rotation: each run gets fresh token, dies on `delivered` or 24h whichever first.

**Why this design:** builder agent NEVER touches buyer's OAuth tokens. Builder has only a run-scoped JWT that grants ability to call specific tools through us. If builder gets compromised, blast radius = one run, not user's whole connection graph.

**9. Builder agent finishes** → POSTs `/v1/runs/:run_id/complete`
- Payload: `{artifacts:[{url, mime, hash, sig?}], summary, suggested_next?:[]}`
- Transition state=`delivering`. Workflow resumes from its pause point (it's been polling/waiting).
- We fetch + hash + store artifact previews. Generate signed preview URLs for buyer.
- Send delivery notification (buyer's chosen channel: email/Slack/in-app).
- Transition state=`delivered`. Start the 24h "review window."

**Durable writes:** `events`, `artifacts` (with hash + signed preview tokens), `composio_audit`, `dispatches.completed_at`, `run_transitions`.

**Can fail at:** Builder hangs (workflow timeout → state=`failed`, refund), builder returns malformed payload (state=`delivering_error`, manual review queue), proxy denial (logged, builder gets clear error, run continues if other tools work).

### Phase 4 — DELIVERED → ACCEPTED / DISPUTED → SETTLED

**10. Buyer reviews delivery** (in dashboard or via email/Slack link)
- "Accept" button → state=`accepted` → release Whop hold → builder's wallet credited (minus platform fee).
- "Dispute" button → opens dispute form → state=`disputed`, escrow stays held, alerts operator + builder.
- **Auto-accept timer:** if no action in 24h, transition `delivered → accepted` automatically. Cron scheduled inside the Workflow (it's been sleeping).

**11. On `accepted`:** Workflow:
- Calls Whop to release escrow → builder Whop balance
- Writes ledger entries: buyer debit, builder credit, platform-fee credit, Whop-fee debit
- Updates `runs.platform_fee_cents`, `runs.builder_payout_cents`
- Fires `run.completed` webhook to anyone subscribed (builder, chain triggers, hands-off analytics)
- **Chain trigger check:** does this run trigger a downstream chain? If yes → enqueue downstream `runs.dispatch` w/ `continuation_context`.

**12. On `disputed`:** Workflow:
- Pauses release. Surfaces to operator review queue.
- Auto-resolution rules first: if validator never passed (shouldn't happen but defensively check) → auto-refund. If builder failed to deliver per spec (artifact missing/wrong shape) → auto-refund.
- Else → human (Todd or ops queue) reviews, decides: refund / partial / accept / chargeback.
- Decision transitions state to `resolved` with `outcome=refunded|partial|accepted`.

**Durable writes:** `ledger_entries`, `payout_batches`, `dispute_decisions`, webhook fan-out log.

---

## Why a Workflow per run is the right primitive

We could have done this with cron jobs polling `runs` table. We could have done it with stateless API routes and a state column. Both break.

**A Vercel Workflow gives us:**
- Per-run durable execution that survives Vercel deploys
- Sleep semantics (pause 24h for clarify, pause 24h for auto-accept) without cron complexity
- Built-in retry per step
- Per-run trace in the Workflow dashboard (Todd debugs run X by opening the Workflow run, sees every step's input/output/duration)
- Step output caching → if a step ran and we replay, it doesn't re-run

**A single Workflow function (`runLifecycle`) handles all 4 phases.** It's ~300 LOC of orchestration. Every step inside is its own Function or Queue handler.

```ts
// pseudocode
defineWorkflow('runLifecycle', async (ctx, runId) => {
  // Phase 1
  const validator = await ctx.step('validate', () => validateBrief(runId));
  if (validator.verdict === 'reject') return reject(runId);
  if (validator.verdict === 'clarify') {
    const answers = await ctx.waitForEvent('clarify_answered', { timeout: '24h' });
    if (!answers) return cancel(runId, 'clarify_timeout');
    // re-validate, loop
  }
  await ctx.step('hold_funds', () => whopHold(runId));

  // Phase 2
  await ctx.step('dispatch', () => enqueueDispatch(runId));
  const ack = await ctx.waitForEvent('builder_acked', { timeout: '5m' });
  if (!ack) return failAndRefund(runId, 'no_ack');

  // Phase 3
  const completion = await ctx.waitForEvent('builder_completed', { timeout: agentSLA });
  if (!completion) return failAndRefund(runId, 'sla_breach');

  // Phase 4
  await ctx.step('notify_delivery', () => notifyBuyer(runId));
  const decision = await ctx.waitForEvent('buyer_decision', { timeout: '24h', default: 'accept' });
  if (decision === 'accept') return settleAndPayout(runId);
  if (decision === 'dispute') return enterDispute(runId);
});
```

**Events** in this pseudocode (`clarify_answered`, `builder_acked`, etc.) are external triggers — they arrive via API routes that call `workflow.signal(runId, eventName, payload)`. Vercel Workflows wakes the paused Workflow.

---

## How agent coordination actually works (the runtime adapter pattern)

We list agents from any runtime. They run on builder infra. We don't host execution. But we need a clean abstraction so the platform code doesn't have to know which runtime.

```
// spec declares runtime
runtime: 'in-house' | 'webhook' | 'claude' | 'openai' | 'hermes' | 'manus' | 'mcp'

// each runtime has an adapter implementing:
interface RuntimeAdapter {
  dispatch(run: Run, spec: Spec, contextToken: string): Promise<DispatchAck>
  cancel?(run: Run): Promise<void>
  healthcheck?(): Promise<boolean>
}
```

- `in-house` — calls our own Vercel Function `agents/<id>/run` (we built it).
- `webhook` — POSTs to `spec.webhook_url`. Builder owns the server. **Default for 99% of indie builders.**
- `claude` — calls Anthropic API with system prompt = compiled spec, tools = spec-declared MCP servers. We host the orchestration but the model is theirs.
- `openai` / `hermes` / `manus` — same pattern, different provider API.
- `mcp` — opens MCP transport to builder's declared MCP server URL.

Adding a new runtime = adding a new adapter. ~100 LOC each. No platform-core changes.

**Why this matters for Todd's vendor-flexibility moat:** when the model rankings change in 6 months, builders just edit `runtime:` in their spec. No re-publish, no buyer-side breakage, no migration. **This is the structural defense vs Anthropic's marketplace** — they only support Claude. We support whatever wins.

---

## Live trace: what the buyer sees while waiting

The 8-minute wait between hire and delivery is the most fragile moment in the product. Black box = anxiety = refunds. Live trace = trust.

**Flow:**
1. Builder agent POSTs events to `/v1/runs/:id/events` as it works (optional but encouraged).
2. API route validates token + run state, writes to `events` table.
3. Supabase Realtime broadcasts on channel `run:<id>` to subscribed clients.
4. Buyer's open dashboard tab has an SSE connection (or WebSocket via Realtime client) listening to that channel.
5. New events render as a Claude-Code-style terminal trace.

**Event kinds shown:**
- `thought` — italic gray, "thinking" indicator
- `tool` — green, "Called slack.postMessage to #funnels"
- `shell` / `read` / `write` — blue, file-style display
- `milestone` — bold, "Drafted 3 hooks" — also triggers push notification
- `artifact` — preview card inline (image, file, code block)

**Buyer can:** scroll, copy, pause stream (just hides UI, doesn't stop run), click any artifact for full preview, cancel run.

**Replay:** stream is persisted. Buyer can scrub the trace post-delivery — part of the audit trail. Builders also get replay for debugging.

---

## What we observe at the platform level (the operator dashboard)

Todd needs to see this without diving into Supabase or Vercel:

- **Live runs grid:** all in-flight runs, current state, time-in-state, agent, buyer, SLA countdown.
- **Stuck-state alerts:** any run >2x median time-in-state for that agent → orange flag → Todd reviews.
- **Dispute queue:** all disputed runs, time-in-dispute, builder, buyer, amount.
- **Builder health:** per-builder dispatch success rate, ack latency p50/p95, delivery success rate, dispute rate. Auto-flag builders >5% dispute rate.
- **Validator quality:** false-positive rate (passed but disputed), false-negative rate (rejected but buyer appealed and was right).
- **Whop reconciliation:** local ledger vs Whop balance drift per builder + per buyer. Alarm if >$0 drift.
- **Composio audit log:** searchable, every external-tool call we proxied, with input hash + status.

This is the trust layer. If we don't have this, we can't catch problems before users do.

---

## Failure modes + recovery (the things we DON'T leave to chance)

| Failure | Detection | Recovery |
|---|---|---|
| Builder agent crashes mid-run | SLA timer in Workflow expires | State→failed, auto-refund, alert builder, dispute-rate increments |
| Builder posts malformed completion payload | Schema validation in `/complete` handler | State→delivering_error, human review, builder gets clear error |
| Composio proxy call fails (Slack 500, etc.) | Composio error response | We retry 3x w/ backoff, then surface error to builder agent (their code decides whether to retry or abort) |
| Whop hold succeeds but release fails | Reconciliation cron compares local ledger to Whop | Auto-retry release w/ idempotency key; alert if 3 retries fail |
| Vercel Workflow crashes mid-step | Vercel Workflows infra | Auto-resumes from last successful step. We didn't lose state because we didn't store state in the workflow — we stored it in Postgres. |
| Buyer wallet has insufficient funds when we go to hold | Whop API error | State→failed, surface to buyer with top-up CTA, no run starts |
| Multiple workflow instances for same run (race) | Postgres advisory lock + idempotency keys on Queue messages | Second instance fails fast, no double-charge, no double-dispatch |
| Builder uses proxy outside their scope grant | Grant filter check in proxy route | 403 to builder, logged, repeated offenses flag the agent for review |
| Buyer disputes after auto-accept fired | 24h "accept" is reversible within 7 days via human review | Operator can manually transition `accepted → disputed` |
| Spec updated mid-run | Run uses spec_version snapshot taken at hire time | New spec versions don't affect in-flight runs |

---

## What's testable from day 1 (E2E coverage of fulfillment)

These are the Playwright tests that have to be green for any prod deploy:

1. **Happy path:** sign up → top up wallet → browse → hire → brief passes → builder ack → trace events stream → completion → auto-accept → builder paid. <90s test runtime.
2. **Clarify path:** brief triggers clarify → buyer answers → re-validates → passes → continues.
3. **Reject path:** brief rejected → no charge → buyer sees reasons.
4. **Builder timeout:** builder doesn't ack within 5min → state=failed → auto-refund → buyer wallet restored.
5. **Builder error:** builder POSTs error in completion → state=failed → auto-refund.
6. **Dispute:** buyer disputes within 24h → state=disputed → operator decision → refund / accept settles correctly.
7. **Proxy scope violation:** mock builder tries to post to channel outside grant → 403, audit log written, run continues.
8. **Whop reconciliation:** force a Whop balance drift → reconciliation cron detects and alerts.
9. **Concurrent runs same agent same buyer:** two runs in flight → independent state, independent traces, no cross-contamination.
10. **Spec version snapshot:** start run → update spec → in-flight run uses old spec, new run uses new spec.

Mock builders run as Vercel Functions in test env, simulate the 5 builder roles (good, slow, error, malformed, malicious-proxy).

---

## The `notify_operator` escape hatch (PRD §6 primitive, wired into the state machine)

When an agent encounters a step it genuinely cannot self-serve (legal language sign-off, custom SSO config, ambiguous-brief judgment call, jurisdiction-specific compliance) it calls:

```
POST /v1/runs/:run_id/notify_operator
{ reason, urgency: 'low'|'normal'|'high'|'blocking', payload }
```

**State machine effect:**
- Run transitions `running → awaiting_operator`. Workflow pauses, waiting on `operator_resolved` event.
- Operator gets push notification (email + Slack + dashboard badge). Configurable per operator.
- Operator opens the run detail in their console, reviews the agent's frozen state + the question, clicks resolve with a decision payload.
- API route `POST /v1/runs/:run_id/resolve_notification` accepts the decision → fires `operator_resolved` signal → Workflow resumes, passes decision back to agent as the response to its `notify_operator` call.

**Timeouts:**
- If operator doesn't resolve within `agent.sla_window`, run state→`failed_operator_timeout`, auto-refund. This is a strong incentive for operators to be responsive.
- For `urgency: blocking`, SLA window collapses to 1h. For `low`, runs as long as the SLA.

**Why this matters for trust:** buyers see `awaiting_operator` in their live trace with a timestamp. They know exactly who's blocking, why, and how long the SLA gives the operator. No black box of "why is this taking forever."

---

## What's NOT in this doc (because it's the next layer up, not core)

- Chains and schedules (built on top of the run state machine — chain = "on `run.completed`, enqueue another `runs.dispatch`")
- Hands-off subscriptions (cron → enqueue dispatch on cadence)
- Operator publish flow UI (creates `agents` + `specs` rows; doesn't touch run lifecycle)
- Marketplace browse / search / ranking (read-only over agents + completed runs + reviews)
- Buyer dashboard surfaces (read-only over runs + wallet + connections)
- Public agent profile pages (read-only over agents + portfolio + reviews)
- Authentication (Supabase Auth — boundary, not core)

The fulfillment core is the engine. The rest is UI on top of, or scheduled triggers into, this engine.

---

*If we get this engine right, everything else is composition. If we get it wrong, no amount of UI polish saves us.*
