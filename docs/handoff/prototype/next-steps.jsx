// next-steps.jsx — Next Steps & chains UI primitives.
// Three surfaces:
//   NextStepsPanel       — shows under delivery artifacts on completion screen
//   NextStepsQueue       — "Ready for Next Step" dashboard queue
//   NextStepsPublishStep — publish-flow config for agent builders
//
// Three suggestion sources (declared in PRD §14):
//   same-agent-repeat  — "run again with new inputs" (same spec, fresh brief)
//   same-agent-variant — "refresh/revise" variants the agent declares
//   cross-agent        — platform-curated pairings (other agents in marketplace)
//
// Three auto-run modes (buyer-chosen per suggestion):
//   approve    — land in dashboard queue, manual approval per run
//   chain      — pre-authorized auto-fire on trigger (budget cap)
//   subscribe  — recurring schedule (weekly/monthly)

// ============ MOCK DATA ============
// Example declared next-steps by agent handle (in prod, comes from agent spec)
const NEXT_STEPS_BY_AGENT = {
  funnelsmith: [
    { kind: 'same-agent-repeat',  id: 'ns-fs-1', label: 'Write next week\'s emails',           desc: 'Fresh 5-email sequence using your established voice + new angle.', price: 297, cadence: 'weekly', pricing_delta: -15 },
    { kind: 'same-agent-variant', id: 'ns-fs-2', label: 'Add 3 alternate headline directions', desc: 'Keeps the body, swaps hero + sub + primary CTA.',                   price: 97,  cadence: null },
    { kind: 'cross-agent',        id: 'ns-fs-3', label: 'Pair with Aperture',                  desc: '40 paused ad drafts in Meta, built on this funnel\'s angles.',        price: 297, target: 'aperture' },
    { kind: 'cross-agent',        id: 'ns-fs-4', label: 'Pair with Reel Rat',                  desc: '6 short-form video hooks matching the funnel\'s tone.',               price: 197, target: 'reel-rat' },
  ],
  aperture: [
    { kind: 'same-agent-repeat',  id: 'ns-ap-1', label: 'Refresh ad batch monthly',           desc: 'Fresh 40 variants on the 1st, pulls performance data from the last batch.', price: 297, cadence: 'monthly', pricing_delta: -15 },
    { kind: 'same-agent-variant', id: 'ns-ap-2', label: 'Static-only variant pass',           desc: 'Same angles, static-image-only versions for cost control.',                 price: 197, cadence: null },
    { kind: 'cross-agent',        id: 'ns-ap-3', label: 'Pair with Helios',                   desc: 'Competitor ad library teardown feeding next batch\'s angles.',               price: 397, target: 'helios' },
    { kind: 'cross-agent',        id: 'ns-ap-4', label: 'Pair with Closer',                   desc: 'High-intent leads captured from winning ads routed to sequenced outreach.', price: 297, target: 'closer' },
  ],
};

function nextStepsFor(agent) {
  if (!agent) return [];
  return NEXT_STEPS_BY_AGENT[agent.id] || [
    { kind: 'same-agent-repeat',  id: 'ns-gen-1', label: 'Run again with new inputs',  desc: 'Same agent, new brief. Context from this run carries forward.', price: agent.price || 297, cadence: 'weekly', pricing_delta: -15 },
    { kind: 'same-agent-variant', id: 'ns-gen-2', label: 'Revise with feedback',       desc: 'Pass notes, agent iterates on this run\'s deliverables.',       price: Math.round((agent.price || 297) * 0.4) },
  ];
}

// Mock queue items for dashboard surface
const MOCK_QUEUE = [
  { id: 'q1', agent: 'Funnelsmith', fromAgent: 'Aperture', kind: 'cross-agent', title: 'Funnel copy for top-performing ad angle', triggered_at: '2h ago', est_price: 297, reason: 'Aperture ad AD-117 hit 3.2% CTR — Funnelsmith suggested to match the landing page.' },
  { id: 'q2', agent: 'Aperture',    fromAgent: null,      kind: 'schedule',    title: 'Monthly ad refresh — May batch',           triggered_at: 'tomorrow 9am', est_price: 252, reason: 'Recurring subscription · -15% ($297→$252) · next fire on May 1.' },
  { id: 'q3', agent: 'Reel Rat',    fromAgent: 'Funnelsmith', kind: 'cross-agent', title: '6 short-form video hooks matching funnel tone', triggered_at: '1d ago', est_price: 197, reason: 'Funnelsmith delivered "calm productivity" funnel — Reel Rat is the declared pair.' },
];

// Mock active chains & subscriptions
const MOCK_CHAINS = [
  { id: 'c1', from: 'Aperture',    to: 'Helios',   budget_cap: 400, mode: 'chain',     fired: 3, last_fired: '6d ago', status: 'active' },
  { id: 'c2', from: 'Funnelsmith', to: 'Reel Rat', budget_cap: 250, mode: 'chain',     fired: 1, last_fired: '14d ago', status: 'active' },
  { id: 'c3', from: 'Aperture',    to: null,       budget_cap: null, mode: 'subscribe', cadence: 'monthly', fired: 4, last_fired: '2d ago', status: 'active' },
];

// ============ NEXT STEPS PANEL (delivery screen) ============
function NextStepsPanel({ T, type, agent, onApprove, onChain, onSubscribe, compact }) {
  const suggestions = nextStepsFor(agent);
  if (!suggestions.length) return null;

  return (
    <div style={{
      padding: compact ? 16 : 20, borderRadius: 10,
      background: T.panelSoft, border: `1px solid ${T.line}`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.4, color: T.accent, fontWeight: 600 }}>
          ── NEXT STEPS · suggested by {agent?.name || 'this agent'}
        </div>
        <div style={{ fontFamily: type.mono, fontSize: 10, color: T.textFaint }}>
          {suggestions.length} options · curated
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {suggestions.map(s => (
          <NextStepRow key={s.id} T={T} type={type} suggestion={s}
            onApprove={() => onApprove?.(s)}
            onChain={() => onChain?.(s)}
            onSubscribe={() => onSubscribe?.(s)}/>
        ))}
      </div>

      <div style={{
        marginTop: 12, paddingTop: 10, borderTop: `1px dashed ${T.lineSoft}`,
        fontSize: 11, color: T.textFaint, fontFamily: type.mono, lineHeight: 1.5,
      }}>
        Next Steps compound your context. Every accepted suggestion carries this run's brief forward — less typing, better outputs.
      </div>
    </div>
  );
}

function NextStepRow({ T, type, suggestion, onApprove, onChain, onSubscribe }) {
  const s = suggestion;
  const canSchedule = !!s.cadence;
  const canChain = s.kind === 'cross-agent';
  const kindLabel = s.kind === 'cross-agent' ? 'PAIR' :
                    s.kind === 'same-agent-repeat' ? 'REPEAT' :
                    'VARIANT';
  const kindColor = s.kind === 'cross-agent' ? T.accent :
                    s.kind === 'same-agent-repeat' ? '#3FB68B' :
                    '#7a819a';

  return (
    <div style={{
      padding: 14, borderRadius: 8,
      background: T.panel, border: `1px solid ${T.lineSoft}`,
      display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'center',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: type.mono, fontSize: 9, letterSpacing: 1.3, fontWeight: 700,
            padding: '2px 6px', borderRadius: 3,
            background: kindColor, color: '#fff',
          }}>{kindLabel}</span>
          <span style={{ fontFamily: type.display, fontSize: 15, fontWeight: 600, letterSpacing: -0.2 }}>
            {s.label}
          </span>
          {s.pricing_delta && (
            <span style={{ fontFamily: type.mono, fontSize: 10, color: '#3FB68B', fontWeight: 600 }}>
              {s.pricing_delta}% on repeats
            </span>
          )}
        </div>
        <div style={{ fontSize: 12.5, color: T.textDim, lineHeight: 1.45 }}>
          {s.desc}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <div style={{ fontFamily: type.mono, fontSize: 13, fontWeight: 600, color: T.text }}>
          ${s.price}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={onApprove} title="Land in queue, approve per run" style={{
            all: 'unset', cursor: 'pointer',
            padding: '5px 10px', borderRadius: 5,
            background: T.text, color: T.panel,
            fontSize: 11, fontWeight: 600, fontFamily: type.body,
          }}>Approve each</button>
          {canChain && (
            <button onClick={onChain} title="Auto-fire when this run's agent delivers again" style={{
              all: 'unset', cursor: 'pointer',
              padding: '5px 10px', borderRadius: 5,
              background: 'transparent', color: T.text,
              border: `1px solid ${T.line}`,
              fontSize: 11, fontWeight: 500, fontFamily: type.body,
            }}>Chain</button>
          )}
          {canSchedule && (
            <button onClick={onSubscribe} title={`Run ${s.cadence} on a schedule`} style={{
              all: 'unset', cursor: 'pointer',
              padding: '5px 10px', borderRadius: 5,
              background: 'transparent', color: T.text,
              border: `1px solid ${T.line}`,
              fontSize: 11, fontWeight: 500, fontFamily: type.body,
            }}>Subscribe</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ NEXT STEPS QUEUE (dashboard) ============
function NextStepsQueue({ T, type, goto }) {
  return (
    <div style={{
      padding: 20, borderRadius: 12,
      background: T.panel, border: `1px solid ${T.line}`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <div>
          <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.4, color: T.accent, fontWeight: 600, marginBottom: 4 }}>
            ── READY FOR NEXT STEP
          </div>
          <h3 style={{ margin: 0, fontFamily: type.display, fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>
            {MOCK_QUEUE.length} suggestions waiting on you
          </h3>
        </div>
        <button style={{
          all: 'unset', cursor: 'pointer',
          padding: '8px 14px', borderRadius: 6,
          background: 'transparent', color: T.textDim,
          border: `1px solid ${T.line}`,
          fontSize: 12, fontFamily: type.body,
        }}>View all →</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {MOCK_QUEUE.map(q => (
          <QueueRow key={q.id} T={T} type={type} item={q}/>
        ))}
      </div>

      <div style={{
        marginTop: 18, paddingTop: 14, borderTop: `1px solid ${T.lineSoft}`,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
      }}>
        <ChainsRoster T={T} type={type}/>
        <SchedulesRoster T={T} type={type}/>
      </div>
    </div>
  );
}

function QueueRow({ T, type, item }) {
  const kindBadge = item.kind === 'cross-agent' ? { label: 'PAIR', color: '#D4634A' } :
                    item.kind === 'schedule'    ? { label: 'SCHED', color: '#3FB68B' } :
                    { label: 'REPEAT', color: '#7a819a' };
  return (
    <div style={{
      padding: 12, borderRadius: 8,
      background: T.panelSoft, border: `1px solid ${T.lineSoft}`,
      display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'center',
    }}>
      <div style={{
        padding: '3px 7px', borderRadius: 4,
        background: kindBadge.color, color: '#fff',
        fontFamily: type.mono, fontSize: 9, letterSpacing: 1.2, fontWeight: 700,
        minWidth: 48, textAlign: 'center',
      }}>{kindBadge.label}</div>
      <div>
        <div style={{ fontFamily: type.display, fontSize: 14, fontWeight: 600, letterSpacing: -0.2, marginBottom: 3 }}>
          <span style={{ color: T.accent }}>@{item.agent.toLowerCase().replace(/\s+/g, '-')}</span>
          {' · '}
          <span style={{ color: T.text }}>{item.title}</span>
        </div>
        <div style={{ fontSize: 11.5, color: T.textDim, lineHeight: 1.4 }}>
          {item.reason}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <div style={{ fontFamily: type.mono, fontSize: 12, color: T.text, fontWeight: 600 }}>${item.est_price}</div>
        <div style={{ fontFamily: type.mono, fontSize: 10, color: T.textFaint }}>{item.triggered_at}</div>
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          <button style={{ all: 'unset', cursor: 'pointer', padding: '4px 9px', borderRadius: 4, background: T.text, color: T.panel, fontSize: 10.5, fontWeight: 600, fontFamily: type.body }}>Approve</button>
          <button style={{ all: 'unset', cursor: 'pointer', padding: '4px 9px', borderRadius: 4, background: 'transparent', color: T.textDim, border: `1px solid ${T.line}`, fontSize: 10.5, fontFamily: type.body }}>Edit</button>
          <button style={{ all: 'unset', cursor: 'pointer', padding: '4px 9px', borderRadius: 4, background: 'transparent', color: T.textDim, border: `1px solid ${T.line}`, fontSize: 10.5, fontFamily: type.body }}>Skip</button>
        </div>
      </div>
    </div>
  );
}

function ChainsRoster({ T, type }) {
  const chains = MOCK_CHAINS.filter(c => c.mode === 'chain');
  return (
    <div>
      <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.textFaint, fontWeight: 600, marginBottom: 8 }}>
        ACTIVE CHAINS · {chains.length}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {chains.map(c => (
          <div key={c.id} style={{
            padding: '8px 10px', borderRadius: 6,
            background: T.panelSoft, border: `1px solid ${T.lineSoft}`,
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3FB68B' }}/>
            <span style={{ color: T.accent }}>@{c.from.toLowerCase()}</span>
            <span style={{ color: T.textFaint }}>→</span>
            <span style={{ color: T.accent }}>@{c.to.toLowerCase().replace(/\s+/g, '-')}</span>
            <span style={{ marginLeft: 'auto', fontFamily: type.mono, color: T.textDim, fontSize: 10 }}>
              cap ${c.budget_cap} · fired {c.fired}×
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SchedulesRoster({ T, type }) {
  const subs = MOCK_CHAINS.filter(c => c.mode === 'subscribe');
  return (
    <div>
      <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.textFaint, fontWeight: 600, marginBottom: 8 }}>
        SCHEDULES · {subs.length}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {subs.map(c => (
          <div key={c.id} style={{
            padding: '8px 10px', borderRadius: 6,
            background: T.panelSoft, border: `1px solid ${T.lineSoft}`,
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3FB68B' }}/>
            <span style={{ color: T.accent }}>@{c.from.toLowerCase()}</span>
            <span style={{ color: T.textDim, fontFamily: type.mono, fontSize: 10 }}>·</span>
            <span style={{ color: T.text, fontFamily: type.mono, fontSize: 10, letterSpacing: 1 }}>{c.cadence?.toUpperCase()}</span>
            <span style={{ marginLeft: 'auto', fontFamily: type.mono, color: T.textDim, fontSize: 10 }}>
              last fire {c.last_fired}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ PUBLISH-FLOW STEP (for agent builders) ============
// Slots into the Publish flow as one of its steps. Agent declares next_steps[].
function NextStepsPublishStep({ T, type, value, onChange }) {
  const draft = value || {
    repeats: [{ id: 'r1', label: 'Run again with new inputs', cadence: 'weekly', pricing_delta: -15 }],
    variants: [{ id: 'v1', label: 'Revise with feedback', price_ratio: 0.4 }],
    pairings: [{ id: 'p1', target: 'aperture', label: 'Pair with Aperture', note: 'Funnel copy → ad creative' }],
  };
  return (
    <div style={{
      padding: 24, borderRadius: 12,
      background: T.panel, border: `1px solid ${T.line}`,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 32, alignItems: 'start' }}>
        <div>
          <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.4, color: T.accent, fontWeight: 600, marginBottom: 10 }}>
            ── STEP 06 · NEXT STEPS
          </div>
          <h3 style={{ margin: '0 0 10px 0', fontFamily: type.display, fontSize: 24, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.1 }}>
            What should buyers do next?
          </h3>
          <p style={{ margin: 0, fontSize: 13.5, color: T.textDim, lineHeight: 1.55 }}>
            Declare what usually happens after your agent delivers. Same-agent repeats get +15% discount by default. Cross-agent pairings are curated by the platform — submit candidates here, we review for fit.
          </p>
          <div style={{
            marginTop: 16, padding: 12, background: T.panelSoft, borderRadius: 6,
            fontSize: 12, color: T.textFaint, lineHeight: 1.5, fontStyle: 'italic',
          }}>
            Pairings must be genuinely useful to buyers. No referral splits — quality only. Low-conviction pairings get rejected.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <PublishSubsection T={T} type={type} title="REPEATS" subtitle="Same agent, new brief. Schedulable.">
            {draft.repeats.map(r => (
              <SubRow key={r.id} T={T} type={type}>
                <span style={{ flex: 1, color: T.text, fontSize: 13 }}>{r.label}</span>
                <span style={{ fontFamily: type.mono, fontSize: 11, color: T.textDim }}>{r.cadence}</span>
                <span style={{ fontFamily: type.mono, fontSize: 11, color: '#3FB68B', fontWeight: 600 }}>{r.pricing_delta}%</span>
              </SubRow>
            ))}
            <AddRow T={T} type={type} label="+ add a repeat pattern"/>
          </PublishSubsection>

          <PublishSubsection T={T} type={type} title="VARIANTS" subtitle="Related deliverables your agent can produce from the same context.">
            {draft.variants.map(v => (
              <SubRow key={v.id} T={T} type={type}>
                <span style={{ flex: 1, color: T.text, fontSize: 13 }}>{v.label}</span>
                <span style={{ fontFamily: type.mono, fontSize: 11, color: T.textDim }}>{Math.round(v.price_ratio * 100)}% of base price</span>
              </SubRow>
            ))}
            <AddRow T={T} type={type} label="+ add a variant"/>
          </PublishSubsection>

          <PublishSubsection T={T} type={type} title="CROSS-AGENT PAIRINGS" subtitle="Curated by platform. Submit candidates for review." badge="PLATFORM REVIEW">
            {draft.pairings.map(p => (
              <SubRow key={p.id} T={T} type={type}>
                <span style={{ color: T.accent, fontFamily: type.mono, fontSize: 12 }}>@{p.target}</span>
                <span style={{ flex: 1, color: T.text, fontSize: 13 }}>{p.label}</span>
                <span style={{
                  fontFamily: type.mono, fontSize: 9, letterSpacing: 1, color: '#D4A33C',
                  padding: '2px 6px', borderRadius: 3, background: 'rgba(212,163,60,0.12)',
                }}>PENDING</span>
              </SubRow>
            ))}
            <AddRow T={T} type={type} label="+ propose a pairing"/>
          </PublishSubsection>
        </div>
      </div>
    </div>
  );
}

function PublishSubsection({ T, type, title, subtitle, badge, children }) {
  return (
    <div style={{ padding: 14, background: T.panelSoft, borderRadius: 8, border: `1px solid ${T.lineSoft}` }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4,
      }}>
        <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.3, color: T.text, fontWeight: 700 }}>
          {title}
        </div>
        {badge && (
          <span style={{
            fontFamily: type.mono, fontSize: 9, letterSpacing: 1.1, color: T.accent, fontWeight: 600,
          }}>{badge}</span>
        )}
      </div>
      {subtitle && (
        <div style={{ fontSize: 11.5, color: T.textDim, marginBottom: 10, lineHeight: 1.45 }}>
          {subtitle}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {children}
      </div>
    </div>
  );
}

function SubRow({ T, type, children }) {
  return (
    <div style={{
      padding: '8px 12px', borderRadius: 5,
      background: T.panel, border: `1px solid ${T.lineSoft}`,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {children}
    </div>
  );
}

function AddRow({ T, type, label }) {
  return (
    <button style={{
      all: 'unset', cursor: 'pointer',
      padding: '8px 12px', borderRadius: 5,
      border: `1px dashed ${T.line}`,
      fontSize: 12, color: T.textDim, fontFamily: type.body,
      textAlign: 'center',
    }}>
      {label}
    </button>
  );
}

Object.assign(window, {
  NEXT_STEPS_BY_AGENT, nextStepsFor,
  NextStepsPanel, NextStepsQueue, NextStepsPublishStep,
});
