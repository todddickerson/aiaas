-- Day 9: schedules + chains.
--
-- Schedules: cron-style recurring hires of an agent with a brief template.
-- Chains: cap=1 downstream (i.e., 2 agents total in v1). When source_run on
-- `source_agent_slug` reaches `accepted`, we enqueue a run on
-- `target_agent_slug` with the chain's brief template, carrying the source
-- artifacts forward as context.

create table if not exists public.schedules (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid,
  agent_slug               text not null,
  cadence                  text not null check (cadence in ('weekly','monthly','daily')),
  service_name             text not null,
  service_price_cents      integer not null,
  brief_template           text not null,
  next_fire_at             timestamptz,
  last_fired_at            timestamptz,
  fire_count               integer not null default 0,
  status                   text not null default 'active'
                             check (status in ('active','paused','cancelled')),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists schedules_user_idx on public.schedules (user_id, created_at desc);
create index if not exists schedules_due_idx
  on public.schedules (next_fire_at)
  where status = 'active';

alter table public.schedules enable row level security;

drop policy if exists "schedules_owner_select" on public.schedules;
create policy "schedules_owner_select" on public.schedules
  for select using (auth.uid() = user_id);

drop policy if exists "schedules_owner_insert" on public.schedules;
create policy "schedules_owner_insert" on public.schedules
  for insert with check (auth.uid() = user_id);

drop policy if exists "schedules_owner_update" on public.schedules;
create policy "schedules_owner_update" on public.schedules
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Chains: a one-hop "after run X on agent A finishes, fire run Y on agent B".
-- Cap = 1 downstream per chain in v1 (per BUILD-PLAN). Two-hop chains are
-- modeled as separate chain rows; the orchestrator does not auto-recurse.

create table if not exists public.chains (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid,
  source_agent_slug        text not null,
  target_agent_slug        text not null,
  target_service_name      text not null,
  target_service_price_cents integer not null,
  brief_template           text not null,
  budget_cap_cents         integer,
  status                   text not null default 'active'
                             check (status in ('active','paused','cancelled')),
  fire_count               integer not null default 0,
  spent_cents              integer not null default 0,
  last_fired_at            timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists chains_source_idx
  on public.chains (source_agent_slug, status);
create index if not exists chains_user_idx
  on public.chains (user_id, created_at desc);

alter table public.chains enable row level security;

drop policy if exists "chains_owner_select" on public.chains;
create policy "chains_owner_select" on public.chains
  for select using (auth.uid() = user_id);

drop policy if exists "chains_owner_insert" on public.chains;
create policy "chains_owner_insert" on public.chains
  for insert with check (auth.uid() = user_id);

drop policy if exists "chains_owner_update" on public.chains;
create policy "chains_owner_update" on public.chains
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
