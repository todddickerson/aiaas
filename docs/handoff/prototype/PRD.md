# AIaaS.com — Product Requirements Doc

> Living document. Updated as the vision evolves.
> Last major update: strategic clarification — we are the **thin connection layer**, not runtime infrastructure. Moat = user context (profile, memory, Composio integrations) + ideal human UX + agent-wallet brokering. Payments processed via **WHOP partnership**. We stay flexible as runtimes come and go.

---

## 1. Brand & one-line pitch

**AIaaS.com — AI as a Service.**
*Not another freelancer board. Not another tool. A service layer. You hire it like an agency — except it's AI, it's instant, and it runs forever.*

Working headline on site:
> **Hire an agent. Unlimited executions.** Productized AI services — one clear offer, unlimited times, with a live queue, public track record, and a finished deliverable every time.

---

## 2. Positioning: thin connection layer, niche-launched

We are the **connection marketplace, not an app and not infrastructure**. Agents from any runtime (Claude, ChatGPT, Hermes, Manus, OpenClaw, BYO) get published, discovered, and hired through us — but **they run on their own infra**. We never host executions.

**What we are:**
- A **directory + discovery layer** (the App Store analogue).
- A **standard API contract** agents implement to be hire-able.
- A **human UX layer** — the ideal buyer experience (brief → clarify → queue → delivery → hands-off) wrapped around whatever the agent does.
- A **context vault** — the client's profile, memory, and integration auth, passed to every agent they hire (the real moat).
- A **payment + wallet broker** — via **WHOP partnership** (§8).

**What we are not:**
- Not a runtime. We don't execute LLM calls.
- Not a hosting provider. We don't run agent code.
- Not a billing processor. WHOP handles wallets, payouts, fund transfers.

**Why thin:** it keeps us flexible as each new generation of agents arrives. We don't care if tomorrow's best agent runs on a framework we've never heard of — as long as it implements our API contract, it lists here.

But we launch **niche** to survive year 1:

- **Beachhead:** internet marketers / the ClickFunnels–IM community (captive audience, tight quality bar, word-of-mouth loop, known ICP).
- **Year 2 expansion:** real estate, e-commerce operators, coaches, SaaS operators — each a new vertical with its own curated agent set.
- **Year 3:** horizontal marketplace. By then AIaaS.com is the App Store / connection layer for agents, with the **client's context as the moat** — not our infra.

**Why this works:** we don't have to be everything on day 1, but the architecture has to support it by day 1. The brand promises breadth; the launch hits depth.

---

## 3. The 1–2–3 year thesis (source: Todd/EaBot strategic convo)

### Year 1 (now–2027) — the "just make it work" era
Most buyers can't spell MCP. They've used ChatGPT once. They want outcomes, not configuration. **Winner = whoever removes all friction.** You describe what you need in English; a finished thing comes back. No setup, no prompts, no platforms.

### Year 2 (2027–2028) — the specialization era
Commodity AI work (generic copy, basic research) goes to zero. What survives is **specialized context** — agents that know your industry, your brand voice, your customer avatar, your funnel. The platform that stores and applies this context wins.

> **Internal note:** lean on our existing user-profile / offer / avatar / voice data (the "Homer profile" referenced in strategy convo) as the context moat. Every hire feeds it. Every hands-off run applies it.

### Year 3 (2028–2029) — the infrastructure era
Agents become infrastructure, like email or cloud. Everyone runs on them. The fight is over **routing**: who picks which agent for which task, who holds the client's history, who owns the auth/credential layer across their tool stack.

**Inevitable endpoint:** agents replace the SaaS subscription model. Instead of $99/mo for copy + $79/mo for research + $49/mo for audit = $227/mo on 3 tabs, you pay $15/run when you need outcomes. AIaaS.com is where you browse and hire those outcomes.

---

## 4. The four core loops

### Loop 1 — Agent creator publishes a spec (English, not JSON)
Creators describe what they need from clients in plain English. An LLM compiles it into a live brief validator. No form builders. Specs update in English and re-compile.

### Loop 2 — Client writes a brief (one textarea, no forms)
Clients type what they want. The LLM catches gaps pre-payment — passes, asks ≤3 follow-ups, or rejects with specific reasons.

### Loop 3 — LLM referees the match
Pre-payment, the LLM validates brief against spec. Passes → funded. Fails → actionable reasons. Never "please fill required fields."

### Loop 4 — Agent ships to where the client works
Deliverables land in Slack, Notion, Figma, Meta Ads (paused drafts), GitHub PRs, webhooks, HubSpot, Shopify. Marketplace adds signing, provenance, versioning, receipts on top.

---

## 5. The dual-audience problem (CRITICAL for How It Works page)

The site must serve **both** audiences equally well. A visitor is either:

### (A) Buyer / hirer
Wants outcomes. Doesn't care about architecture. Primary questions:
- Can I trust this?
- Will it actually deliver, or do I have to babysit?
- Where does the output land?
- Can I make it recurring?

### (B) Agent creator / builder
Wants distribution + monetization. Is probably an indie dev, agency, or in-house team with a working agent. Primary questions:
- Can I publish without a human hand-holding me?
- Who owns the customer relationship?
- What's the take rate?
- How much plumbing do I have to write (auth, billing, delivery, revisions)?
- Can my agent self-serve auth into my client's tools?

**How It Works page must have a visible toggle or dual-column structure** showing the same 4-step flow from both angles. Current version is skewed toward buyers — needs rebalance.

---

## 6. Agent self-service standard (no human integration required)

**Core principle:** an agent should be able to go from "idea" to "live and earning" **without any human on our side doing integration work**.

How:
- **Spec is English, validator is LLM-compiled.** Creator writes the spec, sees preview validator live, ships it.
- **Integrations are declared, not coded.** Creator picks destinations from our catalog; we handle auth brokering (see §7 Composio).
- **Runtime is self-declared.** YAML (or UI equivalent): `runtime: claude | openai | hermes | manus | openclaw | byo`. For BYO: `integration: mcp | openapi | webhook | python`. **Runtime runs on the creator's infra, not ours.**
- **Payments auto-configured** via **WHOP wallet onboarding** embedded. Creator links WHOP once, we broker wallet top-ups, holds, payouts (§8).
- **Revision / follow-up policy** picked from 4 presets; no custom code required.

### The "notify operator" escape hatch
Sometimes a human step is genuinely required (legal review, high-security SSO/JWT flow, custom domain, federated tenant-level auth).

We define a standard pattern: **`notify_operator`**.

- Any agent (or any platform workflow) can call `notify_operator({ reason, urgency, payload })`.
- System routes to a human operator (on the platform side OR on the agent-creator's side, configurable).
- Operator resolves (e.g., approves JWT scope, signs SSO config, confirms legal language), clicks "resume."
- The calling workflow wakes up with the resolution attached.

This is the only human-in-the-loop primitive. Everything else is self-service.

**Why this is important:** it preserves "self-serve from day 1" for 99% of cases while giving a clean, inspectable escape valve for the 1% that genuinely needs a human.

### The `stream_progress` primitive (live trace)
Second optional **protocol primitive** alongside `notify_operator`. Agents can POST structured progress events to our ingestion endpoint while executing on their own infra — every tool call, file read/write, shell command, external API hit, intermediate reasoning step. **We display, we don't host execution.**

**Why it matters:** turns the 8-minute wait from a black box into a live working-feed (Claude Code-style terminal trace). For buyers, it builds trust and lets them catch off-course runs early. For builders, it's free observability and a demo surface. For us, it's the connection-layer differentiator — same agent shown through our lens is dramatically more hire-able.

**Shape (what agents POST to us):**
```
POST /v1/runs/:run_id/events
{
  kind: 'tool' | 'shell' | 'read' | 'write' | 'log' | 'thought' | 'milestone',
  label: 'git config user.email',  // short human-readable
  detail?: '...',                   // optional expanded view
  artifact?: { url, mime, bytes },  // optional file reference (agent-hosted URL)
  ts: <epoch_ms>,
}
```

- **Optional, not required.** Agent opts in per-run or per-spec.
- **We're the fanout, not the source.** Agent streams to our endpoint → we fanout to the client's dashboard (WebSocket), any subscribed webhooks, and the replay store.
- **Artifacts stay with the agent.** URLs in events point at the agent's storage; we only cache hashes + signed preview tokens for the buyer UI.
- **Privacy controls.** Creator can redact event payloads at the SDK layer; client can mute stream for sensitive runs.
- **Replayable.** Stream is persisted with the run; client can scrub it post-delivery as part of the audit trail.
- **Buyer-visible artifact signing.** Every streamed artifact is hash-signed and can be previewed mid-run without leaving our UI.

**UX surfaces (what WE build):**
- Agent detail modal "running" state → live terminal trace instead of a plain progress bar.
- Dashboard `in-progress` row → "Watch live →" button opens the trace.
- Hands-off subscription runs → notification when a milestone event fires (`kind: 'milestone'`).

---

## 7. Composio v3 partnership (the integrations layer)

**Problem:** when an agent ships to Notion/Figma/Meta/Slack/etc on behalf of the client, *the client* must be auth'd into those tools. The naive design — each (agent, user) pair triggers its own OAuth handshake — has two fatal flaws: (1) the user reconnects the same 10 SaaS tools every time they hire a new agent, killing conversion, and (2) the connections live at the agent-builder's edge, so when an agent churns off the platform the user's auth graph goes with it.

**Solution: we own the user's connection graph. Agents get scoped proxy access.** Partner with **Composio v3** as the underlying auth broker, but we hold all tokens at the *AIaaS account* level and expose a permission-gated proxy to agents. Connect Slack once, every agent you ever hire requests a subset of that connection's capabilities from you — no re-auth, no OAuth popup churn.

### Architecture — platform-owned connections, agent-scoped proxy

```
┌──────────────────────────────────────────────────────────────┐
│  AIaaS account — Todd's workspace                            │
│                                                              │
│  Connections vault (owned by us, one per user+tool)          │
│    slack://workspace=acme     scopes: channels.*, chat.*     │
│    notion://ws=todd-hq        scopes: pages.*, db.*          │
│    meta-ads://account=acme    scopes: ads.manage, insights.* │
│                                                              │
│  Per-agent grants (user-issued, revocable)                   │
│    @funnelsmith  → notion (pages.read, pages.write on DB X)  │
│                  → slack  (post to #funnels only)            │
│    @aperture    → meta-ads (insights.read only)              │
│    @closer      → slack  (DMs only, no channels)             │
└──────────────────────────────────────────────────────────────┘
           │
           ▼  scoped proxy API  (we enforce; agent never sees token)
┌──────────────────────────────────────────────────────────────┐
│  Agent runtime (Claude / ChatGPT / OpenClaw / BYO)           │
│   POST /v1/proxy/slack.postMessage                           │
│   Authorization: Bearer <run-scoped JWT>                     │
│   We verify: this agent, this run, has grant for this tool+scope
└──────────────────────────────────────────────────────────────┘
```

### How it maps to Composio v3

| Composio concept | Our mapping |
|---|---|
| **Org** | **We own the Composio org** (AIaaS.com). Single billing relationship with Composio. |
| **Project** | **One Composio project per AIaaS user** (not per agent). All of Todd's connections live here. Gives us a per-user token isolation boundary. |
| **Connected account / integration** | **One per (user, tool) pair.** Todd connects Slack once; we hold the token. |
| **Auth config** | **Builders declare required capabilities in spec** (e.g. `slack.post_message`, `notion.read_db`) — NOT raw OAuth scopes. We map capabilities → Composio scopes and batch-request the union at connection time. |
| **Tool call** | Routed through **our proxy**, not Composio directly. We validate the per-agent grant, call Composio on the user's behalf, return the result. |

### User flow — one-time connect, per-agent grants

**First time a user hires an agent that needs Slack:**
1. "This agent wants to post to Slack on your behalf."
2. One-click connect → OAuth popup → done. Token vaulted under user's AIaaS account.
3. Scope picker: "Which channels can @funnelsmith post to?" → user picks `#funnels` only.

**Every subsequent agent that needs Slack:**
1. "This agent wants to post to Slack." (no OAuth popup — already connected)
2. Scope picker: "Which channels can @closer post to?" → user picks `DMs only`.
3. Hire.

The second hire is a two-click scope grant, not a full OAuth dance. This is the difference between **"sign up for each agent"** and **"install an agent the way you install an iPhone app."**

### Why this design is the real moat

- **Connections are sticky to us, not to agents.** An agent churns → user's Slack/Notion/Meta connections stay. The next agent they hire inherits the graph. Switching cost is now on the **platform relationship**, not any single agent.
- **Conversion delta on repeat hire.** First hire is a full OAuth checkout. Second hire is scope-picker-only. Over a year, the median user has 15+ pre-connected tools; every new agent becomes a 30-second install.
- **Scope control is finer than OAuth gives.** OAuth hands out coarse scopes (e.g. `chat:write`). Our proxy enforces grant-level filters: "post only to #funnels," "read only DB X," "never delete." Users feel safe granting access because we let them be surgical.
- **Revocation is one-click per agent.** Kill @funnelsmith's Slack grant without disturbing @closer's. Kill the Slack connection entirely — every grant dependent on it evaporates.
- **Builders never see user credentials.** Even the agent runtime gets a short-lived, run-scoped JWT, not a Slack token. Reduces builder liability to near-zero.
- **Audit trail is ours.** Every proxied call is logged with (user, agent, run, tool, scope, result). Feeds into §4 Live Trace naturally — "Posting to #funnels…" is a proxy event we rendered.

### Client-side controls we expose

- **Connections tab** in dashboard — master list of connected tools, per-connection scopes, revoke.
- **"What can this agent touch?" panel** at hire time — plain-English capability list with a scope picker for each capability.
- **Per-agent grants view** — every agent you've hired, what it can access right now, last call timestamp, one-click revoke per grant.
- **Auto-expiry policies** — optional, e.g. grants auto-revoke 30 days after last execution.
- **Masked delivery** — for sensitive outputs, artifacts can be delivered to a gated destination the agent can never read back.
- **Capability diffing on agent updates** — if a builder ships a spec revision that widens required capabilities, user gets re-consent prompt (narrowing is silent).

### Builder-side DX

- Builder declares capabilities in English spec: `"posts hooks to your #funnels Slack channel"` → LLM-compiler extracts `slack.post_message` as a declared capability.
- Builder **never writes OAuth code, never touches tokens, never sees user workspaces.** They call `POST /v1/proxy/slack.post_message` with the run JWT we issue. We do the rest.
- Builder's runtime logs show proxy call results — they can debug without ever handling user auth state.

### Open questions on Composio partnership
- [ ] Confirm Composio v3 supports project-level token isolation strong enough that a compromised project doesn't leak to siblings (we want per-user project as the boundary).
- [ ] Latency budget for the proxy hop. If Composio adds >200ms to hot-path calls we may need to cache or parallelize.
- [ ] Revenue / pricing: are we a reseller (markup), a rev-share partner (backend), or flat-per-connection? Our bias: backend rev-share on integration volume, surfaced as free to the buyer.
- [ ] For Claude-native MCP: do we dual-route (MCP for Claude agents direct to Composio, proxy for others) or enforce proxy uniformly? Proxy-for-everything is simpler, preserves audit uniformity, costs latency.
- [ ] Token storage: if Composio vaults, we don't carry the compliance burden. If they expose tokens to us, we own SOC 2 vault requirements. Prefer they vault.
- [ ] Composio API shape for narrow scope filters (e.g. "only channel X") — if unsupported, we enforce post-hoc in our proxy.

---

## 8. Monetization model — WHOP partnership + backend deals

**Payments infra:** we partner with **WHOP** for wallets, fund holds, payouts, and transfers. WHOP already solves the hard parts — creator payouts across geographies, wallet top-ups, refund mechanics, tax/KYC. We use their standard fee structure and expose it cleanly in our UI.

**Front-of-house (what buyers and creators see):**
- Buyer funds a WHOP-backed wallet, or pays per-run with card-on-file.
- Creator links their WHOP account at publish time; payouts land there on their cadence.
- Standard WHOP fee structure applies (passthrough; not our markup).
- We handle the agent-interaction edges: hold on brief submit, release on delivery, auto-refund on SLA miss, revision escrow.

**Back-of-house (how we actually profit):**
- **Our revenue comes from our WHOP backend partnership deal** — revenue share / preferred-partner rate / volume rebates, negotiated with WHOP directly. Not surfaced to buyer or creator.
- Clean for users (one standard fee, no confusing double-take), profitable for us (partnership economics on aggregate volume).

| Layer | How we make money |
|---|---|
| **WHOP backend partnership** | **Primary revenue.** Rev-share / rebate on aggregate processing volume. Invisible to users. |
| **Hands-off subscriptions** | Recurring wallet holds = predictable WHOP volume = amplifies backend economics. **Primary growth driver.** |
| **Context-as-a-moat (Y2+)** | Premium tier for clients — enriched profile (offer, avatar, voice, memory, historical runs) shared to every agent they hire. Direct SaaS revenue. |
| **Composio partnership** | Similar structure — backend rev-share on integration volume, surfaced as free-to-buyer. |
| **Refund-guarantee tier** | Paid tier for clients wanting auto-refund SLA on every run. |
| **Enterprise (Y2+)** | SOC 2 signing, org-policy enforcement, seat management. |

**Why this model holds:** we don't compete on take-rate (WHOP handles that transparently), we compete on **context + UX**. The user signs up for the experience and the memory-that-follows-them; the money is made silently on the partnership backend. This also means we never have to defend a take-rate number publicly.

### The hands-off conversion strategy
First execution is the hook. **Hands-off is the business** — and its quiet side effect is predictable WHOP wallet volume, which is where our partnership economics amplify. Post-delivery, the LLM does deep research on the client (their site, LinkedIn, G2, SimilarWeb, their brief, their shipped output) and proposes 2–3 tailored recurring setups with specific triggers and destinations — not generic templates. One-tap activate. Cancel any time.

Targets: 25% of first-time buyers → ≥1 hands-off within 30 days. Hands-off LTV = 8× one-off LTV.

---

## 9. Connected runtimes ("any stack" layer)

**We don't run these. We connect to them.** Each runtime is a badge on the agent card and a conformance level against our API contract — nothing more.

| Runtime | What | Best for |
|---|---|---|
| **OpenClaw** | Open-source multi-model | Deep custom logic |
| **Claude** | Anthropic Skills + MCP | Long-form, research |
| **ChatGPT Agents** | GPTs + Assistants API | Multimodal |
| **Hermes** | Nous Research open-weights | Cost-sensitive volume |
| **Manus** | Autonomous browser | Research, data collection |
| **BYO** | MCP / OpenAPI / webhook / Python | Proprietary / legacy |

Runtime is orthogonal to both spec and delivery — a creator can switch runtime without touching spec or destinations, and clients never need to know what's under the hood. **As new runtimes emerge, we add a badge and an adapter; we don't re-platform.**

---

## 10. Delivery rail

**Primary destinations:** Dashboard · Email · Slack · Notion · Drive · Figma
**Publish-in-place:** Linear · GitHub PR · Webhook · Meta Ads (paused) · Google Ads (paused) · Shopify (drafts) · HubSpot (drafts)

**Triggers** (hands-off mode): On-demand · Scheduled · Event-triggered · Metric-threshold.

All integrations broker through Composio (§7). Agent creators declare destinations in spec; clients grant per-destination access at hire time.

---

## 11. Follow-up policy

Each agent declares one of four: **No follow-ups** · **1 clarifying round** · **2 revisions included** · **Async messaging** (+35%).

Both UX affordance and pricing lever.

---

## 12. Trust & accountability

- **Spec versioning** — every delivery tagged with `spec@version`.
- **LLM validator as escrow** — if validator passed the brief and agent fails to deliver on target, full refund, no tickets.
- **Artifact signing** — every deliverable hash-signed; provenance auditable forever.
- **Versioned artifacts** — revisions append, never overwrite; roll back any delivery.
- **Public track record** — runs shipped, win rate, SLA hit rate, streak. Publicly ranked.
- **Per-agent access revoke** — one button kills an agent's integrations without touching others (via Composio per-agent project isolation).

---

## 13. Open questions

### Strategic
- [ ] Beachhead commit: is it IM/CF community, or broader SMB marketing? Name the wedge.
- [ ] How do we onboard the first 20 high-quality agents pre-launch? (Partner with agencies? Build 10 ourselves?)
- [ ] Context moat IP: what's the minimum viable profile data we need to capture in Y1 to compound into Y2?

### Product
- [ ] Is the LLM-validator visible to clients ("your brief is being validated by GPT-5") or hidden for magic?
- [ ] Default hands-off cadence? Per-agent? Per-trigger-type?
- [ ] How do we price hands-off across wildly different agents?
- [ ] Should creators set hands-off discounts ("recurring clients get 20% off per run")?
- [ ] What happens to active hands-off when an agent is deprecated mid-subscription?

### Partnership / infra
- [ ] Composio v3 per-project token isolation: confirm at auth layer, not just logical.
- [ ] Composio latency on hot-path calls during execution.
- [ ] Composio revenue model with us (backend rev-share, pass-through, or markup).
- [ ] Claude-native MCP vs. Composio: dual-route or unified?
- [ ] WHOP partnership terms: backend rev-share tier vs. volume-rebate structure.
- [ ] WHOP wallet UX: embedded iframe vs. redirect vs. fully custom-skinned via their API.
- [ ] Refund / chargeback liability split with WHOP on SLA-miss auto-refunds.
- [ ] How we expose "standard WHOP fee" in buyer UI without creating sticker shock — is it baked into price, shown as line item, or absorbed?

### Dual-audience UX
- [ ] Does How It Works get a literal toggle ("I'm hiring" vs "I'm publishing") or dual-column always-visible layout?
- [ ] Is there a separate site/subdomain for agent creators (`build.aiaas.com`) or unified?

---

## 14. Next Steps & chains (moat layer)

**The repeat-engagement primitive.** Every completed run can surface suggested follow-up runs — from the same agent, or from other agents in the marketplace. This is how we convert a one-shot transaction into a standing relationship and build the moat that keeps buyers from ever needing to leave.

### Three sources of suggestions

1. **Agent-declared** — in the spec, an agent lists common next steps ("after funnel copy, buyers usually commission ad creative and a 30-day email sequence"). Declared statically in English, compiled to structured `next_steps[]` at publish time.
2. **Same-agent repeats** — agents can declare repeat patterns ("write next week's emails", "refresh these ads monthly", "re-run this report every Friday"). Pre-fills the brief with the original context and asks only for the delta.
3. **Cross-agent suggestions** — agents can reference *other* agents by handle as recommended pairings. Curated, not self-serve: platform reviews every cross-link for quality fit. **No referral split** — cross-recommendations exist solely to deliver buyer outcomes; incentivizing them corrupts them. Builders earn by being the recommended agent, not by recommending.

### Two triggers

- **At delivery** — a "Next Steps" panel sits directly below the artifacts on the completion screen. Chips: `Run again with new inputs` · `Refresh monthly` · `Pair with [Agent X]`.
- **Delayed nudges** — platform-scheduled reminders based on agent-declared cadence or learned buyer patterns. Email + dashboard queue. Examples: 7 days post-delivery "time to refresh these ad creatives?"; Monday morning "3 agents are ready for this week's runs."

### Three auto-run modes (buyer-chosen per suggestion)

- **Approve each** (default) — every follow-up run shows up in the "Ready for Next Step" queue on the dashboard. Buyer reviews, edits brief, confirms, pays.
- **Pre-authorized chain** — "whenever Funnelsmith delivers copy, auto-hire AdCreative Factory with budget ≤$300." Chain fires automatically on successful delivery of the trigger run, within the buyer's declared budget cap. Payment auto-pulls from wallet.
- **Recurring subscription** — "run this weekly every Monday 9am." Same-agent repeat runs on a schedule, buyer reviews output, can pause or adjust anytime. Priced at a per-run discount (builder sets: default 15%).

### Why this is the moat

Agents-by-themselves are commodity. What buyers can't easily recreate is **their compounded context** on our platform: which agents they've hired, what those agents delivered, what worked, what cadences they've set, which chains they've approved, which integrations are already brokered through Composio. Every completed run makes the *next* run cheaper (less input needed), better (context carries forward), and more likely (suggestions surface it). Switching costs accrue to the connection layer, not to any individual agent.

This is why we prioritize Next Steps surface area over new agent categories in Year 1.

### Dashboard surfaces

- **Ready for Next Step** — standing queue of suggestions awaiting buyer approval.
- **Chains** — configured auto-run pre-authorizations. Edit budget caps, pause, audit fire history.
- **Schedules** — recurring subscriptions. Next-run preview, pause/adjust/cancel.
- **Pairings heatmap** — which cross-agent suggestions are converting; informs platform curation.

### API contracts (see Developer page for full shape)

- Agent spec declares `next_steps[]`: array of `{ kind: "same-agent-repeat" | "same-agent-variant" | "cross-agent", target, label, default_cadence?, pricing_delta? }`.
- Upon `/complete`, agent can optionally return a `suggested_next[]` payload with run-specific suggestions (dynamic; overrides spec defaults).
- Platform exposes `/v1/continuations`: buyer endpoints for listing, approving, scheduling, and pausing chains + subscriptions.
- `run.created` webhook includes `continuation_context` when the run was triggered by a chain or schedule (so the agent knows it's part of a sequence).

### Open questions (Next Steps)

- [ ] How aggressive should delayed nudges be? Per-agent cadence cap, or platform default throttle?
- [ ] Can chains span more than 2 agents? Year 1 cap at 2; revisit once we see usage.
- [ ] When a chain's trigger agent fails SLA, does the downstream auto-cancel or fall back to manual-approve?
- [ ] Surface cross-agent suggestions to *non-buyers* (e.g., on an agent's public page: "often paired with...") to seed demand?

---

## 15. Current design artifact

`MarketingHire.html` (to be renamed) — interactive prototype built from:

- `shell.jsx` — app routing, top nav, hero, marketplace grid
- `cards.jsx` — 4 agent-card variants (Editorial, Gamified, Terminal, Minimal)
- `agent-detail.jsx` — profile + hire flow (profile → brief → clarify → queue → done)
- `pages.jsx` / `pages2.jsx` — How It Works, Manifesto, Publish, Dashboard
- `runtimes.jsx` — runtime ecosystem + badges
- `delivery.jsx` — delivery rail + per-agent "Ships to" strip
- `followups.jsx` — follow-up policy chips + clarifying-round component
- `handsoff.jsx` — post-delivery hands-off upsell (research → proposals → activate)
- `data.jsx` — seed agents, categories, leaderboard
- `theme.jsx` — color modes, type pairs, tokens

### TODO from latest strategic convo
- [ ] **Rebrand:** MarketingHire → AIaaS.com (name, logo, favicon, all copy).
- [ ] **Dual-audience How It Works** — rebuild with buyer/creator toggle or dual column.
- [ ] **Agent creator self-serve flow** — design the publish page as a full walkthrough (spec → destinations → runtime → pricing → go live) with no "talk to sales" anywhere.
- [ ] **`notify_operator` primitive** — visually expose this pattern in the Publish flow so creators see it's available for legal/SSO edge cases.
- [ ] **Composio integrations section** — add to How It Works for both audiences (buyer: "control access per agent"; creator: "declare scopes, we broker").
- [ ] **Hands-off upsell wiring** — HandsOffUpsell is written, needs to mount on the detail-modal "done" step.
- [ ] **Context-moat teaser** — surface "your profile" as a user-side feature somewhere visible.
