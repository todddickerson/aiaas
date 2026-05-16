// trust.jsx — credibility signals + tiered compliance badges
// Used on AgentDetail modal and ManagerProfilePage.

// ============ DATA — seed credibility & compliance per agent ============
// Source tiers: 'self' (declared by agent) | 'platform' (we verified) | 'third' (external auditor)
// These are static demo values; in prod they come from manifest + audit logs + attestation records.

const _AG = window.AGENTS || [];
const byId = (id) => _AG.find(a => a.id === id);

// Per-agent credibility overlay. Missing agents fall back to sensible defaults.
const CREDIBILITY = {
  'ea-daimon': {
    p50: '18s', p95: '52s',
    hireAgain: 0.78, refundRate: 0.009,
    buyerLogos: ['ClickFunnels', 'Russell Brunson', 'flint.co', 'papershop'],
    testimonial: { body: 'Ea shortlisted 5 agents for my webinar rollout, hired the top 2, shipped. I never typed a brief myself.', author: 'Todd Dickerson', role: 'Founder, ClickFunnels', handle: '@toddd' },
  },
  funnelsmith: {
    p50: '11m', p95: '38m',
    hireAgain: 0.71, refundRate: 0.021,
    buyerLogos: ['Dentists Daily', 'brightline.io', 'northerly', 'Ceylon Books'],
    testimonial: { body: 'Cut our funnel-copy turnaround from a week to a morning. Pays for itself in the first run.', author: 'Kiana Adams', role: 'Growth lead, brightline.io', handle: '@kiana_a' },
  },
  aperture: {
    p50: '4m', p95: '14m',
    hireAgain: 0.64, refundRate: 0.032,
    buyerLogos: ['papershop', 'Vespa Moto', 'Ceylon Books'],
    testimonial: { body: 'Showed up with 12 concepts, 3 were obvious keepers. Better than a week of moodboards.', author: 'David Ng', role: 'Brand dir, papershop', handle: '@dngbrand' },
  },
  helios: {
    p50: '22m', p95: '1h 04m',
    hireAgain: 0.73, refundRate: 0.018,
    buyerLogos: ['ClickFunnels', 'Vespa Moto', 'Ceylon Books', 'Brighton & Co'],
    testimonial: { body: 'Full ad + landing set in one run. The "paused draft" handoff is the detail that sold me.', author: 'Amal Rivera', role: 'Media buyer', handle: '@amal_r' },
  },
};
const defaultCred = {
  p50: '6m', p95: '22m',
  hireAgain: 0.62, refundRate: 0.028,
  buyerLogos: ['flint.co', 'northerly'],
  testimonial: { body: 'Did exactly what it said on the tin. Invoice arrived, nothing to argue about.', author: 'Casey Lang', role: 'Solo op', handle: '@caselang' },
};
const credFor = (agent) => CREDIBILITY[agent?.id] || defaultCred;

// Compliance claims — each has a source tier + optional note
const COMPLIANCE = {
  'ea-daimon': {
    data_retention: { value: 'Zero retention', source: 'self', note: 'Artifacts purged from agent after delivery; platform holds 90-day audit log.' },
    training:       { value: 'No training on your data', source: 'platform', note: 'OpenClaw runtime flagged no-train. We verify at proxy boundary.' },
    infra:          { value: 'US / EU (auto-routed)', source: 'self', note: 'Proxy pins region based on buyer org.' },
    certifications: { value: 'SOC 2 Type I', source: 'third', note: 'Attested by Drata · certificate on file · expires 2027-02.' },
    pii_handling:   { value: 'Minimized', source: 'platform', note: 'Only handles are passed to the runtime; emails redacted upstream.' },
    subprocessors:  { value: '4 listed', source: 'self', note: 'Anthropic, OpenRouter, Composio, WHOP. Full list in manifest.' },
  },
  funnelsmith: {
    data_retention: { value: '30 days', source: 'self' },
    training:       { value: 'No training on your data', source: 'self', note: 'Claude Workbench opt-out enabled.' },
    infra:          { value: 'US only', source: 'self' },
    certifications: { value: 'Pending audit', source: 'self' },
    pii_handling:   { value: 'Standard', source: 'self' },
    subprocessors:  { value: '3 listed', source: 'self', note: 'Anthropic, Composio, WHOP.' },
  },
  aperture: {
    data_retention: { value: '14 days', source: 'platform' },
    training:       { value: 'Opt-out on', source: 'self', note: 'OpenAI org-level opt-out.' },
    infra:          { value: 'US / EU', source: 'self' },
    certifications: { value: 'SOC 2 Type II', source: 'third', note: 'Attested by Vanta · 2026-03.' },
    pii_handling:   { value: 'Minimized', source: 'platform' },
    subprocessors:  { value: '5 listed', source: 'self' },
  },
};
const defaultCompliance = {
  data_retention: { value: 'Varies', source: 'self' },
  training:       { value: 'No training', source: 'self' },
  infra:          { value: 'US', source: 'self' },
  certifications: { value: 'Not attested', source: 'self' },
  pii_handling:   { value: 'Standard', source: 'self' },
  subprocessors:  { value: 'See manifest', source: 'self' },
};
const complianceFor = (agent) => COMPLIANCE[agent?.id] || defaultCompliance;

// ============ SOURCE TIER BADGE ============
// 'self' = amber dot · 'platform' = green shield · 'third' = blue check
function SourceTier({ source, T, type, size = 10 }) {
  const map = {
    self:     { label: 'SELF',     desc: 'Self-declared by the agent in its manifest.',              fg: '#C98B20', bg: '#C98B2014', glyph: '●' },
    platform: { label: 'PLATFORM', desc: 'Verified by AIaaS at the proxy boundary or via audit log.', fg: '#2B8A5A', bg: '#2B8A5A14', glyph: '◆' },
    third:    { label: '3P-ATTESTED', desc: 'Signed off by a named third-party auditor (SOC 2, Vanta, etc.).', fg: '#2868B2', bg: '#2868B214', glyph: '✓' },
  };
  const s = map[source] || map.self;
  return (
    <span title={s.desc} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '1px 6px', borderRadius: 3,
      background: s.bg, color: s.fg,
      fontFamily: type.mono, fontSize: size, fontWeight: 700, letterSpacing: 0.5,
      border: `1px solid ${s.fg}33`,
    }}>
      <span style={{ fontSize: size }}>{s.glyph}</span>
      {s.label}
    </span>
  );
}

// ============ CREDIBILITY PANEL ============
// Compact. Goes on AgentDetail right column. Also reused on ManagerProfile sidebar.
function CredibilityPanel({ agent, manager, T, type, compact }) {
  const cred = agent ? credFor(agent) : null;
  const mgr = manager || (agent && window.MANAGERS ? window.MANAGERS.find(m => m.id === agent.managerId) : null);
  const hireAgainPct = cred ? Math.round(cred.hireAgain * 100) : null;
  const refundPct = cred ? (cred.refundRate * 100).toFixed(1) : null;

  // Compose the stat grid
  const stats = agent ? [
    { label: 'P50 SLA', value: cred.p50 },
    { label: 'P95 SLA', value: cred.p95 },
    { label: 'Hire-again', value: `${hireAgainPct}%`, good: hireAgainPct >= 65 },
    { label: 'Refund rate', value: `${refundPct}%`, good: cred.refundRate < 0.03 },
  ] : manager ? [
    { label: 'Roster size', value: manager.managedIds.length },
    { label: 'Lifetime runs', value: (window.fmt || String)(manager.stats.runs) },
    { label: 'Paid out', value: `$${(window.fmt || String)(manager.stats.earnings)}` },
    { label: 'Active chains', value: manager.stats.chains },
  ] : [];

  return (
    <div style={{
      border: `1px solid ${T.line}`, borderRadius: 10, background: T.panel, overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${T.lineSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.textDim, fontWeight: 600,
      }}>
        <span>CREDIBILITY</span>
        <span style={{ color: T.textFaint, fontSize: 9 }}>live · updated 4m ago</span>
      </div>

      {/* Stat grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0,
        borderBottom: agent ? `1px solid ${T.lineSoft}` : 'none',
      }}>
        {stats.map((s, i) => (
          <div key={s.label} style={{
            padding: '12px 14px',
            borderRight: i % 2 === 0 ? `1px solid ${T.lineSoft}` : 'none',
            borderBottom: i < 2 ? `1px solid ${T.lineSoft}` : 'none',
          }}>
            <div style={{ fontFamily: type.mono, fontSize: 9.5, letterSpacing: 0.8, color: T.textFaint, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>
              {s.label}
            </div>
            <div style={{
              fontFamily: type.display, fontSize: 18, fontWeight: 700, letterSpacing: -0.3,
              color: s.good === true ? '#2B8A5A' : s.good === false ? '#C98B20' : T.text,
            }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Manager identity strip */}
      {mgr && (
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.lineSoft}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 5, background: mgr.swatch, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: type.mono, fontSize: 9, fontWeight: 700, flexShrink: 0,
          }}>{mgr.name.split(' ').map(s=>s[0]).slice(0,2).join('')}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              {mgr.name}
              {mgr.verified && <svg width="10" height="10" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill={T.accent}/><path d="M3.5 6 L5.5 8 L8.5 4" stroke="#fff" strokeWidth="1.3" fill="none"/></svg>}
            </div>
            <div style={{ fontFamily: type.mono, fontSize: 10, color: T.textDim }}>
              {mgr.handle} · liable operator
            </div>
          </div>
          <KycBadge T={T} type={type}/>
        </div>
      )}

      {/* Attestations row */}
      {agent && (
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.lineSoft}`, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: type.mono, fontSize: 9.5, letterSpacing: 1, color: T.textFaint, marginRight: 4 }}>ATTESTED</span>
          <AttestChip label="KYC" source="platform" T={T} type={type}/>
          <AttestChip label="SOC 2" source="third" T={T} type={type}/>
          <AttestChip label="WHOP payout" source="platform" T={T} type={type}/>
          <AttestChip label="LinkedIn" source="platform" T={T} type={type}/>
        </div>
      )}

      {/* Testimonial */}
      {agent && cred.testimonial && (
        <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.lineSoft}` }}>
          <p style={{ margin: 0, fontSize: 12.5, fontStyle: 'italic', lineHeight: 1.5, color: T.text, textWrap: 'pretty' }}>
            "{cred.testimonial.body}"
          </p>
          <div style={{ fontFamily: type.mono, fontSize: 10.5, color: T.textDim, marginTop: 6 }}>
            — {cred.testimonial.author} · <span style={{ color: T.textFaint }}>{cred.testimonial.role}</span> · <span style={{ color: T.accent }}>{cred.testimonial.handle}</span>
          </div>
        </div>
      )}

      {/* Buyer logos */}
      {agent && cred.buyerLogos?.length > 0 && (
        <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: type.mono, fontSize: 9.5, letterSpacing: 1, color: T.textFaint, marginRight: 4 }}>HIRED BY</span>
          {cred.buyerLogos.map(l => (
            <span key={l} style={{
              padding: '2px 7px', borderRadius: 3, background: T.panelSoft,
              border: `1px solid ${T.lineSoft}`, fontSize: 10.5,
              fontFamily: type.mono, color: T.textDim,
            }}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ KYC BADGE ============
function KycBadge({ T, type }) {
  return (
    <span title="Manager identity verified — gov-ID + liveness check + linked social proof." style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 7px', borderRadius: 3,
      background: '#2B8A5A14', color: '#2B8A5A',
      fontFamily: type.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: 0.6,
      border: `1px solid #2B8A5A33`, flexShrink: 0,
    }}>
      <svg width="9" height="9" viewBox="0 0 12 12"><path d="M6 1 L11 3 L11 6 Q11 9 6 11 Q1 9 1 6 L1 3 Z" fill="none" stroke="currentColor" strokeWidth="1.4"/><path d="M4 6 L5.5 7.5 L8 5" stroke="currentColor" strokeWidth="1.4" fill="none"/></svg>
      KYC
    </span>
  );
}

// Attestation chip — small, with dot tier
function AttestChip({ label, source, T, type }) {
  const srcColor = source === 'third' ? '#2868B2' : source === 'platform' ? '#2B8A5A' : '#C98B20';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 7px', borderRadius: 3,
      background: T.panelSoft, color: T.text,
      fontFamily: type.mono, fontSize: 10, fontWeight: 600, letterSpacing: 0.3,
      border: `1px solid ${T.lineSoft}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: srcColor, display: 'inline-block' }}/>
      {label}
    </span>
  );
}

// ============ PRIVACY & COMPLIANCE PANEL ============
// Lists the dims with tiered source badges. Used on AgentDetail.
function CompliancePanel({ agent, T, type }) {
  const c = complianceFor(agent);
  const rows = [
    { key: 'data_retention', label: 'Data retention',      desc: 'How long the agent keeps your inputs & outputs after the run.' },
    { key: 'training',       label: 'Training on your data', desc: 'Whether the runtime uses your data to train / fine-tune.' },
    { key: 'infra',          label: 'Infra region',        desc: 'Where the runtime executes.' },
    { key: 'certifications', label: 'Certifications',      desc: 'Formal security/privacy audits on file.' },
    { key: 'pii_handling',   label: 'PII handling',        desc: 'How personal data is treated through the pipeline.' },
    { key: 'subprocessors',  label: 'Subprocessors',       desc: 'Third-party services the agent calls during a run.' },
  ];

  return (
    <div style={{
      border: `1px solid ${T.line}`, borderRadius: 10, background: T.panel, overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${T.lineSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.textDim, fontWeight: 600,
      }}>
        <span>PRIVACY &amp; COMPLIANCE</span>
        <span style={{ color: T.textFaint, fontSize: 9 }}>source-tiered</span>
      </div>

      {/* Legend */}
      <div style={{
        padding: '8px 14px', display: 'flex', gap: 10, flexWrap: 'wrap',
        background: T.panelSoft, borderBottom: `1px solid ${T.lineSoft}`,
        fontSize: 10, color: T.textDim,
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C98B20' }}/> self-declared
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2B8A5A' }}/> platform-verified
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2868B2' }}/> 3rd-party attested
        </span>
      </div>

      {rows.map((r, i) => {
        const v = c[r.key] || { value: '—', source: 'self' };
        return (
          <div key={r.key} style={{
            padding: '10px 14px',
            borderBottom: i < rows.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
            display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 10, alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: T.text }} title={r.desc}>{r.label}</div>
            </div>
            <div style={{ fontSize: 12, color: T.textDim, minWidth: 0 }}>
              {v.value}
              {v.note && (
                <div style={{ fontFamily: type.mono, fontSize: 10, color: T.textFaint, marginTop: 2, lineHeight: 1.4 }}>
                  {v.note}
                </div>
              )}
            </div>
            <SourceTier source={v.source} T={T} type={type}/>
          </div>
        );
      })}

      <div style={{
        padding: '8px 14px', background: T.panelSoft, borderTop: `1px solid ${T.lineSoft}`,
        fontFamily: type.mono, fontSize: 10, color: T.textFaint, letterSpacing: 0.3,
      }}>
        Claims a buyer disputes become platform-verified (or downgraded) after investigation · machine-readable manifest at <span style={{ color: T.accent }}>{agent?.handle || '/agent'}/compliance.json</span>
      </div>
    </div>
  );
}

// ============ CLAIM & BACKLINK VERIFICATION WIDGET ============
// Growth loop: manager pastes a link to their AIaaS profile on X / Insta / LinkedIn,
// we crawl the pages, when we see the inbound link we mark the social as "verified."
// This creates backlinks for us AND gives managers a trust boost.
function ClaimBacklinkWidget({ mgr, T, type }) {
  const snippet = `Powered by ${mgr.name.split(' ')[0]} on AIaaS → aiaas.com/${mgr.id}`;
  const links = [
    { key: 'x',        label: 'X / Twitter', verified: true,  handle: mgr.handle,            seenAt: '2h ago' },
    { key: 'linkedin', label: 'LinkedIn',    verified: true,  handle: `/in/${mgr.id}`,       seenAt: '1d ago' },
    { key: 'insta',    label: 'Instagram',   verified: false, handle: null,                  seenAt: null     },
    { key: 'site',     label: 'Personal site', verified: true, handle: mgr.site,             seenAt: '4h ago' },
  ];
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    try { navigator.clipboard.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  return (
    <div style={{
      border: `1px solid ${T.line}`, borderRadius: 10, background: T.panel, overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${T.lineSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.textDim, fontWeight: 600 }}>
          CLAIM &amp; BACKLINK
        </div>
        <span style={{ fontFamily: type.mono, fontSize: 9.5, color: T.textFaint }}>
          {links.filter(l => l.verified).length}/{links.length} verified
        </span>
      </div>

      <div style={{ padding: '12px 14px', fontSize: 12, color: T.textDim, lineHeight: 1.55, borderBottom: `1px solid ${T.lineSoft}` }}>
        Link this profile from your socials. When we detect the inbound link, the platform marks that social <b style={{ color: T.text }}>verified</b> — and you get a trust boost on every agent you publish.
      </div>

      {/* Snippet to paste */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.lineSoft}` }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', background: '#0f1115', color: '#D4D8E0',
          borderRadius: 6, fontFamily: type.mono, fontSize: 11,
        }}>
          <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {snippet}
          </span>
          <button onClick={copy} style={{
            all: 'unset', cursor: 'pointer',
            padding: '3px 8px', borderRadius: 4,
            background: copied ? '#2B8A5A' : '#2a3142',
            color: '#fff', fontSize: 10, fontFamily: type.mono, fontWeight: 600, letterSpacing: 0.6,
          }}>{copied ? 'COPIED' : 'COPY'}</button>
        </div>
      </div>

      {/* Per-network rows */}
      <div>
        {links.map((l, i) => (
          <div key={l.key} style={{
            display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 10,
            padding: '9px 14px', alignItems: 'center',
            borderBottom: i < links.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
          }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: T.text }}>{l.label}</div>
            <div style={{ fontFamily: type.mono, fontSize: 11, color: T.textDim, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {l.handle || <span style={{ color: T.textFaint, fontStyle: 'italic' }}>not linked</span>}
            </div>
            {l.verified ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 7px', borderRadius: 3, background: '#2B8A5A14', color: '#2B8A5A',
                fontFamily: type.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: 0.6,
                border: `1px solid #2B8A5A33`,
              }}>
                ✓ VERIFIED
                <span style={{ color: '#2B8A5A99', fontWeight: 500, marginLeft: 2 }}>· {l.seenAt}</span>
              </span>
            ) : (
              <button style={{
                all: 'unset', cursor: 'pointer',
                padding: '2px 8px', borderRadius: 3,
                border: `1px solid ${T.line}`, color: T.text,
                fontFamily: type.mono, fontSize: 9.5, fontWeight: 600, letterSpacing: 0.6,
              }}>+ LINK</button>
            )}
          </div>
        ))}
      </div>

      <div style={{
        padding: '8px 14px', background: T.panelSoft,
        fontFamily: type.mono, fontSize: 10, color: T.textFaint, letterSpacing: 0.3, lineHeight: 1.5,
      }}>
        We re-crawl every 24h. Removing the link flips the badge off within a day.
      </div>
    </div>
  );
}

Object.assign(window, {
  CREDIBILITY, COMPLIANCE, credFor, complianceFor,
  SourceTier, CredibilityPanel, CompliancePanel, ClaimBacklinkWidget, KycBadge, AttestChip,
});
