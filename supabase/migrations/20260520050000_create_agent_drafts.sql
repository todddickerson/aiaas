-- Slice 3: agent_drafts — a builder's in-progress agent before publish.
-- Once the compiled validator passes a self-benchmark + the Whop payee
-- link is attached, the draft can be published into `agents` (status flips
-- to 'live' there). Drafts are owner-scoped; publish lives behind a
-- service-role insert into `agents`.

create table if not exists public.agent_drafts (
  id                       uuid primary key default gen_random_uuid(),
  builder_id               uuid not null,
  slug                     text,
  name                     text,
  persona                  text,
  tagline                  text,
  category                 text,
  spec_text                text,
  spec_status              text not null default 'draft'
                             check (spec_status in ('draft','compiling','ready','needs_revision','rejected')),
  spec_summary             text,
  spec_required_inputs     jsonb not null default '[]'::jsonb,
  spec_forbidden_claims    jsonb not null default '[]'::jsonb,
  spec_questions           jsonb not null default '[]'::jsonb,
  spec_model               text,
  spec_latency_ms          integer,
  runtime                  text default 'mock',
  destinations             jsonb not null default '[]'::jsonb,
  price_from_cents         integer,
  price_max_cents          integer,
  services                 jsonb not null default '[]'::jsonb,
  whop_payee_id            text,
  whop_payee_status        text not null default 'pending'
                             check (whop_payee_status in ('pending','linked','failed')),
  publish_status           text not null default 'draft'
                             check (publish_status in ('draft','submitted','live','rejected')),
  published_agent_id       uuid references public.agents (id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists agent_drafts_builder_idx
  on public.agent_drafts (builder_id, created_at desc);
create index if not exists agent_drafts_publish_status_idx
  on public.agent_drafts (publish_status, created_at desc);

alter table public.agent_drafts enable row level security;

drop policy if exists "agent_drafts_owner_select" on public.agent_drafts;
create policy "agent_drafts_owner_select" on public.agent_drafts
  for select using (auth.uid() = builder_id);

drop policy if exists "agent_drafts_owner_insert" on public.agent_drafts;
create policy "agent_drafts_owner_insert" on public.agent_drafts
  for insert with check (auth.uid() = builder_id);

drop policy if exists "agent_drafts_owner_update" on public.agent_drafts;
create policy "agent_drafts_owner_update" on public.agent_drafts
  for update using (auth.uid() = builder_id) with check (auth.uid() = builder_id);

create or replace function public.touch_agent_drafts_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists agent_drafts_touch_updated_at on public.agent_drafts;
create trigger agent_drafts_touch_updated_at
  before update on public.agent_drafts
  for each row execute function public.touch_agent_drafts_updated_at();
