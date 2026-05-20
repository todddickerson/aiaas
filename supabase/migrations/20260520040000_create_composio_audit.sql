-- Slice 2: composio_audit — every proxy call gets a row. The proxy surface
-- we expose to builders is OUR shape (`/v1/proxy/:tool.:method`), not
-- Composio's; this table is the source of truth for billing, debugging, and
-- the eventual swap to a different integration vendor.

create table if not exists public.composio_audit (
  id                  uuid primary key default gen_random_uuid(),
  run_id              uuid references public.runs (id) on delete set null,
  agent_slug          text not null,
  user_id             uuid,
  tool                text not null,
  method              text not null,
  request_payload     jsonb not null default '{}'::jsonb,
  response_payload    jsonb not null default '{}'::jsonb,
  status_code         integer not null,
  duration_ms         integer not null,
  error               text,
  external_idempotency_key text unique,
  stubbed             boolean not null default false,
  created_at          timestamptz not null default now()
);

create index if not exists composio_audit_run_idx
  on public.composio_audit (run_id, created_at desc);
create index if not exists composio_audit_tool_idx
  on public.composio_audit (tool, method, created_at desc);

alter table public.composio_audit enable row level security;

-- Buyers see the audit rows for runs they own.
drop policy if exists "composio_audit_owner_select" on public.composio_audit;
create policy "composio_audit_owner_select" on public.composio_audit
  for select using (auth.uid() = user_id);
