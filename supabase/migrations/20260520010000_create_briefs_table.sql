-- Slice A: briefs table — every English brief a buyer submits gets compiled by
-- the validator (Anthropic Haiku for happy-path, Opus for ambiguous cases) and
-- ends up in one of four states.

create table if not exists public.briefs (
  id                  uuid primary key default gen_random_uuid(),
  agent_id            uuid references public.agents (id) on delete set null,
  agent_slug          text not null,
  user_id             uuid,
  raw_text            text not null,
  status              text not null default 'validating'
                        check (status in ('validating','clarify','pass','rejected')),
  clarify_questions   jsonb not null default '[]'::jsonb,
  reject_reason       text,
  validator_model     text,
  validator_latency_ms integer,
  service_name        text,
  service_price_cents integer,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists briefs_agent_idx on public.briefs (agent_slug, created_at desc);
create index if not exists briefs_user_idx on public.briefs (user_id, created_at desc);
create index if not exists briefs_status_idx on public.briefs (status, created_at desc);

alter table public.briefs enable row level security;

-- A buyer can read their own briefs.
drop policy if exists "briefs_owner_select" on public.briefs;
create policy "briefs_owner_select" on public.briefs
  for select using (auth.uid() = user_id);

-- A buyer can create their own briefs.
drop policy if exists "briefs_owner_insert" on public.briefs;
create policy "briefs_owner_insert" on public.briefs
  for insert with check (auth.uid() = user_id);

-- Updates happen via the service role only (validator + run orchestrator);
-- explicitly no policy means no public update is allowed.

create or replace function public.touch_briefs_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists briefs_touch_updated_at on public.briefs;
create trigger briefs_touch_updated_at
  before update on public.briefs
  for each row execute function public.touch_briefs_updated_at();
