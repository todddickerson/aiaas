-- Day 3: seed the 3 in-house agents (Funnelsmith, AdHook, NewsletterDraft) into the agents table.
-- These are the alpha-launch lineup per BUILD-PLAN.md §"the 12-day alpha".
-- The rest of the marketplace seed (the existing 11 from lib/seed/agents.seed.json)
-- is intentionally inserted by app-level seed scripts later, not here, so this
-- migration is the canonical "what does AIaaS itself sell" list.

insert into public.agents (
  slug, handle, name, persona, tagline, category, tier,
  rating, reviews, runs_count, sla, online, queue, eta_mins,
  success_rate, streak, verified,
  price_from_cents, price_max_cents, currency,
  services, swatch, accent_token, sample, bio,
  manager_id, self_managed, runtime, sample_deliverables, description
) values
  (
    'funnelsmith', '@funnelsmith', 'Funnelsmith', 'Russell-style funnel architect',
    'Writes hooks, stories, offers. Ships a full VSL funnel in 90 minutes.',
    'funnels', 'diamond',
    4.94, 1842, 12403, '4 min', true, 3, 12,
    98.7, 127, true,
    7900, 34900, 'USD',
    '[
      {"name":"Hook-Story-Offer teardown","price":79,"time":"8 min","runs":4210},
      {"name":"Full 6-email indoctrination","price":149,"time":"22 min","runs":3180},
      {"name":"VSL script (20 min)","price":249,"time":"35 min","runs":2890},
      {"name":"End-to-end opt-in funnel","price":349,"time":"90 min","runs":2123}
    ]'::jsonb,
    '#E8532B', 'oklch(0.68 0.18 38)',
    E'AD HOOK\n"The 3-word email that made $2M"',
    'Trained on 14k high-converting funnels. Obsessed with the reader''s next click.',
    'todd', false, 'anthropic-claude-opus',
    '[
      {"label":"Hook bank (20 angles)","kind":"doc"},
      {"label":"6-email indoctrination sequence","kind":"doc"},
      {"label":"VSL script with stack slide","kind":"doc"},
      {"label":"Opt-in page copy + 3 variants","kind":"doc"}
    ]'::jsonb,
    'Funnelsmith reads your offer, your audience, and your past wins, then ships a complete opt-in funnel: hook bank, 6-email indoctrination, VSL script, and landing copy. Delivered to your Notion or Google Doc in under 90 minutes.'
  ),
  (
    'adhook', '@adhook', 'AdHook', 'Direct-response ad creative',
    '5 ad creatives + 3 hooks for any offer. Tuned on $80M of Meta + TikTok spend.',
    'ads', 'gold',
    4.86, 412, 2840, '6 min', true, 1, 4,
    97.1, 38, true,
    4900, 14900, 'USD',
    '[
      {"name":"5 ad creatives + 3 hooks","price":49,"time":"6 min","runs":1820},
      {"name":"20 creatives + 10 hooks","price":99,"time":"18 min","runs":640},
      {"name":"Full launch kit (40 ads)","price":149,"time":"35 min","runs":380}
    ]'::jsonb,
    '#7B3FF2', 'oklch(0.62 0.22 300)',
    E'VARIANT 04/05\n"You don''t need a louder ad.\nYou need a sharper why."',
    'A creative director that never gets bored. Tested on 3M+ real impressions.',
    'todd', false, 'anthropic-claude-opus',
    '[
      {"label":"5 ad images (1:1, 9:16, 4:5)","kind":"image"},
      {"label":"3 hook variations","kind":"copy"},
      {"label":"Performance prediction (rationale per ad)","kind":"doc"}
    ]'::jsonb,
    'AdHook turns one offer brief into 5 distinct ad angles — problem-aware, solution-aware, identity, status, and a wildcard — plus 3 cold-traffic hooks. Delivered as a Figma page or a shared Google Drive folder.'
  ),
  (
    'newsletterdraft', '@newsletterdraft', 'NewsletterDraft', 'Weekly newsletter ghostwriter',
    'Weekly newsletter draft from your topic + past hits. The hands-off product anchor.',
    'funnels', 'gold',
    4.79, 264, 1840, '14 min', true, 0, 2,
    96.4, 19, true,
    2900, 9700, 'USD',
    '[
      {"name":"One-off newsletter draft","price":29,"time":"14 min","runs":1240},
      {"name":"4-pack (monthly subscription)","price":97,"time":"weekly","runs":420},
      {"name":"Annual archive + voice training","price":297,"time":"2 hr","runs":180}
    ]'::jsonb,
    '#1C8C5E', 'oklch(0.58 0.14 160)',
    E'DRAFT\nSUBJECT: I almost killed the launch yesterday\n— and the one decision that saved it',
    'Reads your last 50 newsletters, learns your voice, and ships a draft you''ll actually send.',
    'todd', false, 'anthropic-claude-opus',
    '[
      {"label":"Subject line + 3 alternates","kind":"copy"},
      {"label":"650-word draft in your voice","kind":"doc"},
      {"label":"Suggested CTA + P.S.","kind":"copy"}
    ]'::jsonb,
    'NewsletterDraft is the hands-off product anchor. Subscribe weekly and get a draft in your inbox every Friday — pre-trained on your last year of newsletters, your past hits, and your audience''s replies.'
  )
on conflict (slug) do update set
  name = excluded.name,
  tagline = excluded.tagline,
  services = excluded.services,
  sample_deliverables = excluded.sample_deliverables,
  description = excluded.description,
  updated_at = now();
