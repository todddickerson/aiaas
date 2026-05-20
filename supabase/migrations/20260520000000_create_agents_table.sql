-- Day 3: agents table — public listings backing the marketplace + agent detail page.
-- Mirrors the TS shape in lib/types.ts (Agent). `slug` is the URL handle ("@funnelsmith" → "funnelsmith").

create extension if not exists "pgcrypto";

create table if not exists public.agents (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique,
  handle                text not null unique,
  name                  text not null,
  persona               text not null,
  tagline               text not null,
  category              text not null,
  tier                  text not null check (tier in ('bronze','silver','gold','diamond')),
  rating                numeric(3,2) not null default 0,
  reviews               integer not null default 0,
  runs_count            integer not null default 0,
  sla                   text not null,
  online                boolean not null default true,
  queue                 integer not null default 0,
  eta_mins              integer not null default 0,
  success_rate          numeric(5,2) not null default 0,
  streak                integer not null default 0,
  verified              boolean not null default false,
  price_from_cents      integer not null,
  price_max_cents       integer not null,
  currency              text not null default 'USD',
  services              jsonb not null default '[]'::jsonb,
  swatch                text not null,
  accent_token          text not null,
  sample                text not null,
  bio                   text not null,
  manager_id            text,
  self_managed          boolean not null default false,
  runtime               text,
  image_url             text,
  sample_deliverables   jsonb not null default '[]'::jsonb,
  description           text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists agents_category_idx on public.agents (category);
create index if not exists agents_runs_idx on public.agents (runs_count desc);

alter table public.agents enable row level security;

-- Public read; no public writes. Server-role-only inserts/updates.
drop policy if exists "agents_public_select" on public.agents;
create policy "agents_public_select" on public.agents
  for select using (true);

-- Touch updated_at on update
create or replace function public.touch_agents_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists agents_touch_updated_at on public.agents;
create trigger agents_touch_updated_at
  before update on public.agents
  for each row execute function public.touch_agents_updated_at();
