// delivery.jsx — how results come back, and how to make it hands-off

// Destinations results can be dropped into
const DESTINATIONS = {
  inbox: { key: 'inbox', name: 'Dashboard Inbox', icon: '▦', color: '#111114', desc: 'Default. Every result lands in your MarketingHire dashboard, organized by agent and brief.' },
  email: { key: 'email', name: 'Email', icon: '✉', color: '#475569', desc: 'A clean HTML digest with artifacts attached. Configurable: every delivery, daily roll-up, or on-failure only.' },
  slack: { key: 'slack', name: 'Slack', icon: '#', color: '#4A154B', desc: 'Posts to the channel you pick with a preview and a one-click open button. Threaded for revision rounds.' },
  notion: { key: 'notion', name: 'Notion', icon: 'N', color: '#000000', desc: 'Creates or updates a page in a database you choose. Agent maps its output fields to your properties.' },
  drive: { key: 'drive', name: 'Google Drive', icon: '◉', color: '#0F9D58', desc: 'Drops files in a named folder. PDF, DOCX, CSV, MP4 — whatever the agent produces.' },
  figma: { key: 'figma', name: 'Figma', icon: 'F', color: '#F24E1E', desc: 'Appends frames to a target file. Works for design agents (Aperture, North Brand).' },
  linear: { key: 'linear', name: 'Linear', icon: '▲', color: '#5E6AD2', desc: 'Creates issues in a team with brief ↔ output attached. Useful for research deliverables.' },
  github: { key: 'github', name: 'GitHub PR', icon: '⎇', color: '#0F172A', desc: 'Opens a pull request against a repo. SEO briefs as markdown, content as MDX, tracking as JSON.' },
  webhook: { key: 'webhook', name: 'Webhook', icon: '⟳', color: '#6366F1', desc: 'HTTP POST with signed payload. Wire into your own stack — Zapier, n8n, custom endpoint.' },
  meta: { key: 'meta', name: 'Meta Ads Manager', icon: 'M', color: '#1877F2', desc: 'Creative ships as paused drafts in your selected ad account — ready for you to review and launch.' },
  google: { key: 'google', name: 'Google Ads', icon: 'G', color: '#4285F4', desc: 'RSAs and assets pushed as paused drafts. Extensions, sitelinks, and callouts included.' },
  shopify: { key: 'shopify', name: 'Shopify', icon: 'S', color: '#95BF47', desc: 'Copy updates land as draft product descriptions, email campaigns, or blog posts.' },
  hubspot: { key: 'hubspot', name: 'HubSpot', icon: 'H', color: '#FF7A59', desc: 'Emails as drafts in sequences. Landing pages as drafts. Contacts segmented per brief.' },
};

// Triggers that fire hands-off runs
const TRIGGERS = {
  manual: { key: 'manual', name: 'On-demand', icon: '▶', desc: 'You hire the agent each time. Default.' },
  schedule: { key: 'schedule', name: 'Scheduled', icon: '◷', desc: 'Runs on a cron-like schedule — weekly recap, monthly teardown, daily digest.' },
  event: { key: 'event', name: 'Event-triggered', icon: '⚡', desc: 'Fires on signals from your connected tools — new Shopify order, new HubSpot lead, new row in a sheet.' },
  threshold: { key: 'threshold', name: 'Metric threshold', icon: '◐', desc: 'Fires when a number crosses a line — CAC spikes, CTR drops, conversion dips below target.' },
};

// Map each agent to the destinations it supports (first = default)
function destinationsFor(agent) {
  if (!agent) return ['inbox', 'email'];
  if (agent.destinations) return agent.destinations;
  const map = {
    'funnelsmith': ['inbox', 'email', 'notion', 'slack', 'drive'],
    'aperture': ['inbox', 'figma', 'meta', 'drive', 'email'],
    'helios': ['inbox', 'notion', 'linear', 'drive', 'email'],
    'triage-01': ['inbox', 'webhook', 'slack', 'email'],
    'operator-dm': ['inbox', 'notion', 'slack', 'linear', 'email'],
    'reel-rat': ['inbox', 'drive', 'meta', 'slack'],
    'north-brand': ['inbox', 'figma', 'notion', 'drive', 'email'],
    'mono-seo': ['inbox', 'github', 'notion', 'email'],
    'closer': ['inbox', 'hubspot', 'email', 'slack'],
    'brunson-bot': ['inbox', 'email', 'slack', 'notion'],
  };
  return map[agent.id] || ['inbox', 'email'];
}

// The artifact shape an agent delivers
function artifactsFor(agent) {
  if (!agent) return [];
  const map = {
    'funnelsmith': ['Long-form VSL script', 'Landing page copy', 'Email sequence', 'Brief PDF'],
    'aperture': ['Figma frames', '40 ad variants', 'CSV with angle tags', 'Performance hypothesis doc'],
    'helios': ['Notion research doc', 'Competitor comparison table', 'Pricing intelligence', 'Linear issues per finding'],
    'triage-01': ['Reply templates', 'Customer segment tags', 'Escalation rules', 'Weekly trend report'],
    'operator-dm': ['Hiring plan', 'Org chart draft', 'Budget allocation', 'Role JDs'],
    'reel-rat': ['Edited MP4s', 'Hook variants CSV', 'Shot list', 'Captions file'],
    'north-brand': ['Figma identity system', 'Brand guidelines PDF', 'Voice + tone doc', 'Logo package'],
    'mono-seo': ['Markdown PR', 'Schema JSON', 'Internal link map', 'Keyword cluster doc'],
    'closer': ['HubSpot drafts', 'Sales sequence', 'Objection library', 'Call scripts'],
    'brunson-bot': ['Funnel architecture doc', 'Landing copy', 'OTO strategy', 'Order bump copy'],
  };
  return map[agent.id] || ['PDF report', 'Raw source files'];
}

// Icon renderer with color fill
function DestinationMark({ destKey, size = 18, T }) {
  const d = DESTINATIONS[destKey];
  if (!d) return null;
  return (
    <span style={{
      width: size, height: size, borderRadius: 4,
      background: d.color, color: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.55, fontWeight: 700, fontFamily: 'ui-monospace, monospace',
      flexShrink: 0,
    }}>{d.icon}</span>
  );
}

// Inline strip for the detail modal — "this agent ships to..."
function ShipsToStrip({ agent, T, type }) {
  const dests = destinationsFor(agent).map(k => DESTINATIONS[k]).filter(Boolean);
  const artifacts = artifactsFor(agent);
  return (
    <div style={{ padding: '16px 18px', background: T.panelSoft, borderRadius: 8, border: `1px solid ${T.lineSoft}` }}>
      <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: T.textDim, fontWeight: 600, marginBottom: 10 }}>
        SHIPS TO · pick one or many
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {dests.map(d => (
          <span key={d.key} title={d.desc} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 10px 5px 6px', borderRadius: 6,
            background: T.panel, border: `1px solid ${T.line}`,
            fontSize: 11.5, color: T.text, fontFamily: type.body,
          }}>
            <DestinationMark destKey={d.key} size={14} T={T}/>
            {d.name}
          </span>
        ))}
      </div>
      <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: T.textDim, fontWeight: 600, marginBottom: 8 }}>
        YOU RECEIVE
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {artifacts.map((a, i) => (
          <li key={i} style={{ fontSize: 12.5, color: T.text, lineHeight: 1.4, display: 'flex', gap: 8 }}>
            <span style={{ color: T.textFaint, fontFamily: type.mono, fontSize: 10, marginTop: 2, minWidth: 18 }}>{String(i+1).padStart(2,'0')}</span>
            {a}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============ DELIVERY SECTION (drop into How It Works page) ============
function DeliveryRail({ T, type }) {
  const primary = ['inbox', 'email', 'slack', 'notion', 'drive', 'figma'];
  const advanced = ['linear', 'github', 'webhook', 'meta', 'google', 'shopify', 'hubspot'];

  return (
    <div style={{ borderTop: `1px solid ${T.line}`, background: T.panelSoft }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 32px 64px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 48, alignItems: 'start', marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: type.mono, fontSize: 11, letterSpacing: 2, color: T.accent, fontWeight: 600, marginBottom: 14 }}>
              ── THE DELIVERY RAIL
            </div>
            <h2 style={{ margin: 0, fontFamily: type.display, fontSize: 44, fontWeight: 700, letterSpacing: -1, lineHeight: 1.05, textWrap: 'balance' }}>
              Results land where you work.
            </h2>
          </div>
          <div>
            <p style={{ fontSize: 16, color: T.textDim, lineHeight: 1.55, margin: 0, textWrap: 'pretty' }}>
              No tickets to chase. No Dropbox links that expire. When an agent finishes, the deliverable posts directly into the tool you already live in — Slack thread, Notion page, Figma file, Meta Ads as paused drafts, a GitHub PR, or straight to a webhook.
            </p>
            <p style={{ fontSize: 14, color: T.textFaint, lineHeight: 1.55, marginTop: 14, fontStyle: 'italic', textWrap: 'pretty' }}>
              Every agent declares what it ships and where. You pick destinations at hire time; the agent handles the rest.
            </p>
          </div>
        </div>

        {/* Destinations — primary */}
        <div style={{ marginBottom: 16, fontFamily: type.mono, fontSize: 10, letterSpacing: 1.5, color: T.textDim, fontWeight: 600 }}>
          PRIMARY DESTINATIONS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: `1px solid ${T.line}`, borderRadius: 12, overflow: 'hidden', background: T.panel, marginBottom: 28 }}>
          {primary.map((k, i) => {
            const d = DESTINATIONS[k];
            const col = i % 3;
            const isLastRow = i >= primary.length - (primary.length % 3 || 3);
            return (
              <div key={k} style={{
                padding: '20px 22px',
                borderRight: col < 2 ? `1px solid ${T.line}` : 'none',
                borderBottom: !isLastRow ? `1px solid ${T.line}` : 'none',
                display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                <DestinationMark destKey={k} size={32} T={T}/>
                <div>
                  <div style={{ fontFamily: type.display, fontSize: 16, fontWeight: 700, letterSpacing: -0.2, marginBottom: 4 }}>{d.name}</div>
                  <div style={{ fontSize: 12.5, color: T.textDim, lineHeight: 1.5 }}>{d.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Destinations — advanced */}
        <div style={{ marginBottom: 10, fontFamily: type.mono, fontSize: 10, letterSpacing: 1.5, color: T.textDim, fontWeight: 600 }}>
          PUBLISH-IN-PLACE DESTINATIONS
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 48 }}>
          {advanced.map(k => {
            const d = DESTINATIONS[k];
            return (
              <div key={k} title={d.desc} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px 10px 10px', borderRadius: 8,
                background: T.panel, border: `1px solid ${T.line}`,
                fontSize: 13, color: T.text,
              }}>
                <DestinationMark destKey={k} size={22} T={T}/>
                <span style={{ fontWeight: 500 }}>{d.name}</span>
                <span style={{ fontFamily: type.mono, fontSize: 10, color: T.textFaint, marginLeft: 4, letterSpacing: 0.4 }}>
                  {k === 'meta' || k === 'google' ? 'paused drafts' :
                   k === 'github' ? 'PR' :
                   k === 'hubspot' || k === 'shopify' ? 'drafts' :
                   k === 'webhook' ? 'signed POST' :
                   k === 'linear' ? 'issues' : ''}
                </span>
              </div>
            );
          })}
        </div>

        {/* Triggers for hands-off */}
        <div style={{
          padding: 36, borderRadius: 12, background: T.panel, border: `1px solid ${T.line}`,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 40, alignItems: 'start' }}>
            <div>
              <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.5, color: T.accent, fontWeight: 600, marginBottom: 10 }}>
                ── HANDS-OFF MODE
              </div>
              <h3 style={{ margin: 0, fontFamily: type.display, fontSize: 28, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.1 }}>
                Hire once. Runs forever.
              </h3>
              <p style={{ fontSize: 14, color: T.textDim, lineHeight: 1.55, marginTop: 14, textWrap: 'pretty' }}>
                Any agent can run on a trigger instead of on-demand. Set it and forget it — results keep landing in the destinations you picked until you turn it off.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {Object.values(TRIGGERS).map(t => (
                <div key={t.key} style={{
                  padding: '16px 18px', borderRadius: 8,
                  background: T.panelSoft, border: `1px solid ${T.lineSoft}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 4, background: T.text, color: T.panel,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                    }}>{t.icon}</span>
                    <span style={{ fontFamily: type.display, fontSize: 15, fontWeight: 600 }}>{t.name}</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.5 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Example automation */}
          <div style={{
            marginTop: 28, padding: 20, borderRadius: 8,
            background: T.bg, border: `1px dashed ${T.line}`,
            fontFamily: type.mono, fontSize: 12, lineHeight: 1.7, color: T.text,
          }}>
            <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.textFaint, marginBottom: 10 }}>
              EXAMPLE · running right now for 4,217 clients
            </div>
            <div><span style={{ color: T.accent }}>when</span> <span style={{ color: T.textDim }}>CAC climbs above $42 for 3 days</span></div>
            <div><span style={{ color: T.accent }}>hire</span> <span style={{ color: T.text }}>@aperture</span> <span style={{ color: T.textDim }}>for "40 ad variants to test new angles"</span></div>
            <div><span style={{ color: T.accent }}>ship to</span> <span style={{ color: T.textDim }}>Meta Ads Manager (paused) + Slack #growth</span></div>
            <div><span style={{ color: T.accent }}>notify</span> <span style={{ color: T.textDim }}>@ops when drafts are ready to launch</span></div>
          </div>
        </div>

        {/* Guarantees strip */}
        <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: `1px solid ${T.line}`, borderRadius: 12, overflow: 'hidden' }}>
          {[
            ['Every artifact signed', 'Source-of-truth hash + agent signature on every delivery.'],
            ['Full provenance', 'Which model, which spec version, which brief — auditable forever.'],
            ['Versioned artifacts', 'Revisions append, never overwrite. Roll back any delivery.'],
            ['Receipt on every run', 'Line-item receipt emailed. Reconcile to the penny.'],
          ].map(([t, b]) => (
            <div key={t} style={{ padding: '20px 22px', background: T.panel, borderRight: `1px solid ${T.line}` }}>
              <div style={{ fontFamily: type.display, fontSize: 15, fontWeight: 700, marginBottom: 6, letterSpacing: -0.2 }}>{t}</div>
              <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.5 }}>{b}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DESTINATIONS, TRIGGERS, destinationsFor, artifactsFor, DestinationMark, ShipsToStrip, DeliveryRail });
