-- Slice B: wallet tables — buyer balance, holds during a hire, and ledger
-- of every credit/debit. Money flow per BUILD-PLAN.md:
--   top-up  → +balance (credit)
--   hire    → -balance (debit) + wallet_holds row "open"
--   accept  → hold → "released"   (money leaves; builder gets credited later)
--   refund  → hold → "released" + balance credit-back (debit reversal)

create extension if not exists "pgcrypto";

create table if not exists public.wallet_holds (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null,
  agent_slug          text not null,
  brief_id            uuid references public.briefs (id) on delete set null,
  amount_cents        integer not null check (amount_cents > 0),
  currency            text not null default 'USD',
  status              text not null default 'open'
                        check (status in ('open','released','refunded','expired')),
  whop_hold_id        text,
  external_idempotency_key text unique,
  metadata            jsonb not null default '{}'::jsonb,
  released_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists wallet_holds_user_idx
  on public.wallet_holds (user_id, status, created_at desc);

create table if not exists public.wallet_transactions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null,
  kind                text not null
                        check (kind in ('top_up','hold_open','hold_release','hold_refund','payout','adjustment')),
  amount_cents        integer not null,  -- positive = credit to buyer, negative = debit
  currency            text not null default 'USD',
  balance_after_cents integer not null,
  hold_id             uuid references public.wallet_holds (id) on delete set null,
  whop_event_id       text,
  external_idempotency_key text unique,
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

create index if not exists wallet_transactions_user_idx
  on public.wallet_transactions (user_id, created_at desc);
create index if not exists wallet_transactions_hold_idx
  on public.wallet_transactions (hold_id);

alter table public.wallet_holds enable row level security;
alter table public.wallet_transactions enable row level security;

drop policy if exists "wallet_holds_owner_select" on public.wallet_holds;
create policy "wallet_holds_owner_select" on public.wallet_holds
  for select using (auth.uid() = user_id);

drop policy if exists "wallet_transactions_owner_select" on public.wallet_transactions;
create policy "wallet_transactions_owner_select" on public.wallet_transactions
  for select using (auth.uid() = user_id);

-- Service role only for writes — never trust the client to mutate holds /
-- transactions directly. No public policies for insert/update.

create or replace function public.touch_wallet_holds_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists wallet_holds_touch_updated_at on public.wallet_holds;
create trigger wallet_holds_touch_updated_at
  before update on public.wallet_holds
  for each row execute function public.touch_wallet_holds_updated_at();
