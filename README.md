# AIaaS.com

**Hire an AI agent. Unlimited executions.**
Productized AI services — one clear offer, unlimited times, with a live queue, a public track record, and a finished deliverable every time.

AIaaS.com is the thin **connection marketplace** for production AI agents from any runtime. We don't host agent execution; we host the buyer experience, the brief→delivery loop, the wallet, and the context vault that compounds across every hire.

## Status

Day 1 skeleton. Plumbing only — no marketing UI yet. See [`docs/BUILD-PLAN.md`](./docs/BUILD-PLAN.md) for the day-by-day plan.

## Stack

| Layer | Choice |
|---|---|
| Web + API | Next.js 16 App Router + React 19 + TypeScript (strict) |
| Styling | Tailwind v4 + shadcn/ui (new-york style, neutral base) |
| Theme | 4 accents (ember / kelp / cobalt / violet) × dark/light = 8 token sets, ported from `docs/handoff/prototype/theme.jsx`. Toggle via `data-mode` + `data-accent` attributes on `<html>`. |
| Data | Supabase (auth + db + realtime) — client stubbed, project provisioned Day 1.5 |
| Tests | Vitest (unit) + Playwright (e2e), running in CI on every PR |
| CI | GitHub Actions: typecheck · lint · unit · build · e2e |

## Quickstart

```bash
pnpm install
cp .env.example .env.local   # fill in once the Supabase project exists
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Click the theme button in the top-right to cycle ember → kelp → cobalt → violet → (next mode).

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Next.js dev server with Turbopack |
| `pnpm build` | Production build |
| `pnpm start` | Run the built app |
| `pnpm typecheck` | `tsc --noEmit` against the whole repo |
| `pnpm lint` | ESLint (Next core-web-vitals + TS rules) |
| `pnpm test` | Vitest unit tests (`tests/unit/**`) |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm test:e2e` | Playwright e2e tests (`tests/e2e/**`) — boots `next start` automatically |

## Environment variables

All env vars are documented in [`.env.example`](./.env.example).

| Var | Where used | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Day 1.5: filled in after the Supabase project is provisioned |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | Public, safe to ship to the client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | **Never** import this from a client component |

Real keys live in `.env.local` on the dev machine. `.env*` is gitignored except for `.env.example`.

## Repo layout

```
app/                 Next.js App Router routes
components/          App-level React components (incl. theme provider + toggle)
components/ui/       shadcn/ui primitives
lib/                 Utilities — theme token map, Supabase client
tests/unit/          Vitest specs
tests/e2e/           Playwright specs
docs/                Long-form planning docs + the design prototype (handoff bundle)
.github/workflows/   CI
```

## Theme system

The 4 accent × 2 mode token grid is defined twice — once as TS data in [`lib/theme.ts`](./lib/theme.ts), once as CSS variables in [`app/globals.css`](./app/globals.css). A unit test (`tests/unit/theme.test.ts`) verifies they don't drift.

To set the theme at runtime, set `data-mode` and `data-accent` on `<html>`. The bundled `<ThemeProvider>` (mounted in `app/layout.tsx`) does this for you and persists the choice in `localStorage`.

```html
<html data-mode="dark" data-accent="cobalt">
```

## What's next

- **Day 2:** marketing shell — hero, nav, footer, marketplace grid skeleton. Ports of `shell.jsx`, `cards.jsx`, `pages.jsx` from the prototype.
- **Day 3:** agent cards + detail page wired to a real `agents` table.

Full plan: [`docs/BUILD-PLAN.md`](./docs/BUILD-PLAN.md).
Core architecture (the run state machine): [`docs/CORE-FULFILLMENT-ARCH.md`](./docs/CORE-FULFILLMENT-ARCH.md).
Product spec: [`docs/handoff/prototype/PRD.md`](./docs/handoff/prototype/PRD.md).
