-- Slice C: runs table — lifecycle from "queued" through "delivered" / "released".
-- Mirrors docs/CORE-FULFILLMENT-ARCH.md state machine.
--
--   queued  → validating (validator already ran but stamped here for audit)
--           → holding   (wallet hold open)
--           → running   (agent webhook invoked)
--           → delivered (artifacts produced, awaiting buyer accept)
--           → accepted  (buyer accepted, hold released, builder paid)
--           → rejected_by_buyer / failed / cancelled / expired

create table if not exists public.runs (
  id                       uuid primary key default gen_random_uuid(),
  agent_id                 uuid references public.agents (id) on delete set null,
  agent_slug               text not null,
  brief_id                 uuid references public.briefs (id) on delete set null,
  user_id                  uuid,
  hold_id                  uuid references public.wallet_holds (id) on delete set null,
  service_name             text,
  service_price_cents      integer not null,
  status                   text not null default 'queued'
                             check (status in (
                               'queued','validating','holding','running',
                               'delivered','accepted','rejected_by_buyer',
                               'failed','cancelled','expired'
                             )),
  runtime                  text not null default 'mock',
  external_idempotency_key text unique,
  workflow_run_id          text,
  artifacts                jsonb not null default '[]'::jsonb,
  error                    text,
  started_at               timestamptz,
  delivered_at             timestamptz,
  accepted_at              timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists runs_user_idx on public.runs (user_id, created_at desc);
create index if not exists runs_agent_idx on public.runs (agent_slug, created_at desc);
create index if not exists runs_status_idx on public.runs (status, created_at desc);

create table if not exists public.run_events (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid not null references public.runs (id) on delete cascade,
  kind          text not null,
  payload       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists run_events_run_idx on public.run_events (run_id, created_at);

alter table public.runs enable row level security;
alter table public.run_events enable row level security;

drop policy if exists "runs_owner_select" on public.runs;
create policy "runs_owner_select" on public.runs
  for select using (auth.uid() = user_id);

drop policy if exists "run_events_owner_select" on public.run_events;
create policy "run_events_owner_select" on public.run_events
  for select using (
    auth.uid() = (select user_id from public.runs r where r.id = run_id)
  );

create or replace function public.touch_runs_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists runs_touch_updated_at on public.runs;
create trigger runs_touch_updated_at
  before update on public.runs
  for each row execute function public.touch_runs_updated_at();
