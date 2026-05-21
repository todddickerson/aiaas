-- Day 6: per-agent delivery destinations + scope grants.
--
-- A `destination` is an (allowed) external tool target the agent may deliver
-- artifacts to during a run. The orchestrator iterates an agent's
-- destinations after the runtime returns and POSTs artifact previews via
-- the Composio proxy. The same list doubles as a scope allow-list: the proxy
-- refuses any (tool, method, target) outside this set when a run_id is
-- supplied.
--
-- Shape of each entry (jsonb):
--   {
--     "tool":   "slack" | "gmail" | "notion" | ...,
--     "method": "send_message" | "send" | "create_page" | ...,
--     "label":  "Funnels Slack channel",
--     "target": {                -- the per-call payload contract
--       "channel": "#funnels"    -- e.g. Slack
--       "to":      "ops@x.com"   -- e.g. email
--       "parent":  "page_id_..." -- e.g. Notion
--     }
--   }

alter table public.agents
  add column if not exists destinations jsonb not null default '[]'::jsonb;

create index if not exists agents_destinations_idx
  on public.agents using gin (destinations);

-- Backfill: the 3 in-house agents.
update public.agents
   set destinations = '[
     {"tool":"slack","method":"send_message","label":"AIaaS alpha Slack",
      "target":{"channel":"#aiaas-alpha"}},
     {"tool":"notion","method":"create_page","label":"Funnelsmith deliveries Notion",
      "target":{"parent":"funnelsmith-deliveries"}}
   ]'::jsonb
 where slug = 'funnelsmith' and destinations = '[]'::jsonb;

update public.agents
   set destinations = '[
     {"tool":"slack","method":"send_message","label":"AIaaS alpha Slack",
      "target":{"channel":"#aiaas-alpha"}}
   ]'::jsonb
 where slug = 'adhook' and destinations = '[]'::jsonb;

update public.agents
   set destinations = '[
     {"tool":"gmail","method":"send","label":"Operator inbox",
      "target":{"to":"operator+newsletter@aiaas.com"}},
     {"tool":"notion","method":"create_page","label":"Newsletter archive",
      "target":{"parent":"newsletter-archive"}}
   ]'::jsonb
 where slug = 'newsletterdraft' and destinations = '[]'::jsonb;
