# AIaaS.com — project context for Claude Code

## What this is

AIaaS.com is a **thin marketplace + buyer-experience layer** for production AI agents. Operators publish agents (which run on their own infra); buyers hire them in plain English, money holds in a wallet, agents deliver to Slack/Notion/Figma/etc., and the wallet releases on acceptance. We don't host agent execution — we host the brief→delivery loop, the wallet, the trust layer, and the context vault that compounds across every hire.

**One-liner:** *AIaaS.com is where non-technical operators hire production AI agents from any runtime, with one bill, one wallet, one context vault, and human UX wrapped around every run.*

**Differentiation vs Anthropic/OpenAI marketplaces:** runtime-agnostic. Their marketplaces force their model. We don't care which runtime the agent uses — operators bring their own.

## Stack

- **Web + API:** Next.js 16 (App Router) + React 19 + TypeScript **strict**. App lives at the repo root (single app, no monorepo).
- **Styling:** Tailwind v4 (Next.js PostCSS plugin, NOT the Vite plugin) + shadcn/ui (new-york style, neutral base, Lucide icons). Theme tokens are the prototype's; see "Theme" below.
- **Async + jobs:** Vercel Functions (`maxDuration: 800s`) + Vercel Queues + Vercel Workflows. No Render, no Trigger.dev, no Inngest.
- **Data:** Supabase (Postgres + Auth + Realtime + Storage). RLS on everything user-scoped.
- **Payments:** Whop (new parent biz `biz_aiaas_*`).
- **Integrations:** Composio v3 (new org). Adapter pattern from commit 1 so we can swap.
- **LLM:** Anthropic API direct (Opus 4.7 for production, Haiku for compiler).
- **Tests:** Vitest (unit) + Playwright (e2e). CI green is non-negotiable.

## Key files / where to look

| Concern | File |
|---|---|
| Day-by-day plan + locked constraints | [`docs/BUILD-PLAN.md`](./docs/BUILD-PLAN.md) |
| Run state machine, run actors, idempotency model | [`docs/CORE-FULFILLMENT-ARCH.md`](./docs/CORE-FULFILLMENT-ARCH.md) |
| Full PRD (long, but essential) | [`docs/handoff/prototype/PRD.md`](./docs/handoff/prototype/PRD.md) |
| Design prototype (HTML/CSS/JS handoff) | [`docs/handoff/prototype/*.jsx`](./docs/handoff/prototype/) — `theme.jsx` is the design-tokens source, the rest are page mocks |
| Theme token map (TS) | [`lib/theme.ts`](./lib/theme.ts) |
| Theme CSS variables | [`app/globals.css`](./app/globals.css) |
| Theme runtime (provider + toggle) | [`components/theme-provider.tsx`](./components/theme-provider.tsx), [`components/theme-toggle.tsx`](./components/theme-toggle.tsx) |
| shadcn/ui config | [`components.json`](./components.json) — pre-written so future `shadcn add` commands don't hit the interactive prompt |
| Supabase client | [`lib/supabase/client.ts`](./lib/supabase/client.ts) |
| CI | [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) |

## Current focus

**Day 1 — skeleton.** Plumbing only. CI green, theme system live, no marketing UI yet. Next up is Day 2: port `shell.jsx` (nav + footer + hero) and `cards.jsx` (4 variants) into the real app. See `docs/BUILD-PLAN.md` for the rest.

## Theme

The prototype defines 4 accents × 2 modes = 8 token sets. Default is `accent=ember mode=light`.

- TypeScript source of truth: `lib/theme.ts` (used by tests and the toggle).
- CSS mirror: `app/globals.css` via `@theme inline` + `[data-accent="..."]` / `[data-mode="..."]` selectors on `<html>`.
- Drift is caught by `tests/unit/theme.test.ts` (it re-reads `globals.css` and asserts the accent hexes / mode bg hexes are wired correctly).
- shadcn variables (`--primary`, `--background`, `--card`, etc.) are aliases over the AIaaS tokens — never override them directly; change the underlying `--accent` / `--bg` / `--panel` instead.

To switch theme at runtime, click the button in the top-right (calls `useTheme().cycle()`), or set `data-mode` / `data-accent` on `<html>` directly.

## Gotchas

- **Tailwind v4** is configured via the official Next.js PostCSS plugin (`@tailwindcss/postcss`). Don't re-add `tailwindcss` as a separate PostCSS plugin — that silently breaks v4. Don't use the Vite plugin (this is Next.js, not Vite).
- **shadcn/ui** in v4-land has no `tailwind.config.ts`. The config lives in `app/globals.css` via `@theme inline`. Future `shadcn add <name>` commands work because `components.json` is committed.
- **`docs/handoff/prototype/*.jsx`** are reference design files (HTML/CSS/JS from claude.ai/design). They are NOT compiled — ESLint ignores them. Re-implement them; don't import them.
- **No emojis in system UI.** Per global rules, use Lucide icons (`lucide-react` is installed). Emojis are OK only for user-generated content.
- **Dark / light parity.** Every component must work in both modes. Use semantic Tailwind colors (`bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`) — never hardcode `bg-white` / `text-black`.
- **Whop builder onboarding is instant.** KYC fires at withdrawal > $2,500, not at signup. Don't add KYC gates on the publish path.
- **Composio is wrapped.** The proxy surface we expose to builders is OUR shape (`/v1/proxy/:tool.:method`), not Composio's. Adapter pattern from day 1 so Composio is swappable.
- **One Next.js app at the root.** No Turborepo, no monorepo. Single `package.json`, single `node_modules`.
- **`pnpm` is the package manager.** Not npm, not yarn.

## Pre-commit quality gate

Before committing, run:

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

CI runs the same plus `pnpm exec playwright test`. CI must be green before a task is considered done.
