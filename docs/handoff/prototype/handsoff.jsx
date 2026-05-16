// handsoff.jsx — post-delivery hands-off recurring-revenue upsell
// The moment of conversion: LLM deep-researches the client's business and proposes tailored recurring setups.

function HandsOffUpsell({ agent, T, type, onActivate, onSkip }) {
  const [phase, setPhase] = React.useState('research'); // research | proposals | activated
  const [progress, setProgress] = React.useState(0);
  const [selectedIdx, setSelectedIdx] = React.useState(0);

  // simulated research ticks
  React.useEffect(() => {
    if (phase !== 'research') return;
    const steps = RESEARCH_STEPS.length;
    let i = 0;
    const id = setInterval(() => {
      i++; setProgress(i);
      if (i >= steps) { clearInterval(id); setTimeout(() => setPhase('proposals'), 500); }
    }, 480);
    return () => clearInterval(id);
  }, [phase]);

  const proposals = proposalsFor(agent);

  return (
    <div style={{
      marginTop: 28, padding: 0, borderRadius: 12, overflow: 'hidden',
      background: T.panel, border: `2px solid ${agent.swatch}`,
      fontFamily: type.body, color: T.text,
      boxShadow: `0 12px 40px ${agent.swatch}22`,
      animation: 'mh-rise .4s cubic-bezier(.2,.7,.2,1)',
    }}>
      {/* Header bar */}
      <div style={{
        padding: '14px 22px', background: `linear-gradient(90deg, ${agent.swatch}, ${agent.swatch}dd)`,
        color: '#fff', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{
          width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.25)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: type.mono, fontWeight: 700, fontSize: 13,
        }}>∞</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.5, opacity: 0.85, fontWeight: 600 }}>
            HANDS-OFF MODE · TAILORED FOR YOU
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 1 }}>
            Want this to keep running without you?
          </div>
        </div>
      </div>

      {phase === 'research' && <ResearchPhase progress={progress} T={T} type={type} agent={agent}/>}
      {phase === 'proposals' && (
        <ProposalPhase
          proposals={proposals} selectedIdx={selectedIdx} setSelectedIdx={setSelectedIdx}
          agent={agent} T={T} type={type}
          onActivate={() => { setPhase('activated'); onActivate?.(proposals[selectedIdx]); }}
          onSkip={onSkip}
        />
      )}
      {phase === 'activated' && <ActivatedPhase proposal={proposals[selectedIdx]} agent={agent} T={T} type={type} onClose={onSkip}/>}
    </div>
  );
}

const RESEARCH_STEPS = [
  { source: 'acme.com', detail: 'reading homepage, pricing, about' },
  { source: 'linkedin.com/company/acme', detail: 'employee count, funding, recent posts' },
  { source: 'g2.com/products/acme', detail: 'reviews, competitor comparisons' },
  { source: 'similarweb.com', detail: 'traffic sources, audience signals' },
  { source: 'your brief', detail: 'product category, tone, audience' },
  { source: 'shipped deliverable', detail: 'output signals, gaps, opportunities' },
];

function ResearchPhase({ progress, T, type, agent }) {
  return (
    <div style={{ padding: '22px 24px 24px' }}>
      <div style={{ fontSize: 13, color: T.textDim, marginBottom: 14, lineHeight: 1.5 }}>
        Before we propose anything, {agent.name.split(' ')[0]} is reading up on your business so the hands-off setup fits you specifically — not a generic template.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: type.mono, fontSize: 11 }}>
        {RESEARCH_STEPS.map((s, i) => {
          const done = i < progress;
          const active = i === progress;
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '18px 1fr auto', gap: 10, alignItems: 'center',
              padding: '8px 12px', borderRadius: 6,
              background: active ? `${agent.swatch}0E` : 'transparent',
              opacity: done || active ? 1 : 0.35,
              transition: 'opacity .2s, background .2s',
            }}>
              <span style={{
                width: 14, height: 14, borderRadius: '50%',
                background: done ? agent.swatch : active ? 'transparent' : T.line,
                border: active ? `2px solid ${agent.swatch}` : 'none',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 9,
              }}>{done && '✓'}</span>
              <span style={{ color: T.text }}>
                <span style={{ color: T.textDim }}>reading</span> {s.source}
                <span style={{ color: T.textFaint, marginLeft: 8 }}>— {s.detail}</span>
              </span>
              {active && <Spinner color={agent.swatch}/>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Spinner({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: 'mh-spin 0.8s linear infinite' }}>
      <style>{`@keyframes mh-spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="7" cy="7" r="5" fill="none" stroke={color} strokeWidth="1.6" strokeDasharray="10 20"/>
    </svg>
  );
}

function ProposalPhase({ proposals, selectedIdx, setSelectedIdx, agent, T, type, onActivate, onSkip }) {
  return (
    <div style={{ padding: '22px 24px 22px' }}>
      {/* Research summary */}
      <div style={{
        padding: '14px 16px', background: T.panelSoft, borderRadius: 8,
        border: `1px solid ${T.lineSoft}`, marginBottom: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontFamily: type.mono, fontSize: 9, letterSpacing: 1, color: T.textDim, fontWeight: 600 }}>
            ✓ RESEARCH SUMMARY
          </span>
          <span style={{ fontFamily: type.mono, fontSize: 9, color: T.textFaint }}>
            · synthesized from 6 sources · 2.1s
          </span>
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.55, color: T.text }}>
          You look like a <b>mid-stage SaaS</b> (~$1.4M ARR) with a <b>product-led funnel</b>, cold ads on Meta, and a <b>founder-led brand voice</b>. Your main constraint looks like <b>ad fatigue</b> — you rotate creative every 11 days on average. Pricing sits above category median.
        </div>
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {['acme.com', 'linkedin.com', 'g2.com', 'similarweb.com', 'your meta ad account', 'shipped brief'].map(s => (
            <span key={s} style={{
              fontFamily: type.mono, fontSize: 9, letterSpacing: 0.3,
              padding: '2px 7px', borderRadius: 4,
              background: T.panel, color: T.textDim,
              border: `1px solid ${T.lineSoft}`,
            }}>{s}</span>
          ))}
        </div>
      </div>

      <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.5, color: T.textDim, fontWeight: 600, marginBottom: 10 }}>
        3 HANDS-OFF SETUPS WE'D RECOMMEND FOR YOU
      </div>

      {/* Proposals */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
        {proposals.map((p, i) => {
          const active = i === selectedIdx;
          return (
            <button key={i} onClick={() => setSelectedIdx(i)} style={{
              all: 'unset', cursor: 'pointer', display: 'block',
              padding: '14px 16px', borderRadius: 8,
              border: `1.5px solid ${active ? agent.swatch : T.line}`,
              background: active ? `${agent.swatch}0E` : T.panel,
              transition: 'all .12s',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: `1.5px solid ${active ? agent.swatch : T.line}`,
                  background: active ? agent.swatch : 'transparent',
                  flexShrink: 0, marginTop: 2,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 10,
                }}>{active && '✓'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                    <div style={{ fontFamily: type.display, fontSize: 16, fontWeight: 600, letterSpacing: -0.2 }}>
                      {p.title}
                    </div>
                    <div style={{ fontFamily: type.mono, fontSize: 11, color: T.text, whiteSpace: 'nowrap' }}>
                      {p.price} <span style={{ color: T.textDim }}>/ {p.cadence}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.55, color: T.textDim, marginBottom: 8 }}>
                    {p.why}
                  </div>
                  {/* Config chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontFamily: type.mono, fontSize: 10 }}>
                    <span style={{ padding: '3px 7px', borderRadius: 4, background: T.panelSoft, color: T.textDim, border: `1px solid ${T.lineSoft}` }}>
                      ⚡ {p.trigger}
                    </span>
                    <span style={{ padding: '3px 7px', borderRadius: 4, background: T.panelSoft, color: T.textDim, border: `1px solid ${T.lineSoft}` }}>
                      → {p.destination}
                    </span>
                    {p.socialProof && (
                      <span style={{ padding: '3px 7px', borderRadius: 4, background: `${agent.swatch}14`, color: agent.swatch, border: `1px solid ${agent.swatch}33`, fontWeight: 600 }}>
                        ✓ {p.socialProof}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <button onClick={onSkip} style={{
          all: 'unset', cursor: 'pointer', fontSize: 13, color: T.textDim, fontFamily: type.body,
        }}>Maybe later</button>
        <button onClick={onActivate} style={{
          padding: '12px 22px', background: agent.swatch, color: '#fff', border: 'none',
          borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: type.body,
          boxShadow: `0 4px 0 ${agent.swatch}99`,
        }}>
          Activate → first run on us
        </button>
      </div>
      <div style={{ fontFamily: type.mono, fontSize: 10, color: T.textFaint, marginTop: 8, textAlign: 'right' }}>
        cancel any time · no contract · pause with one click
      </div>
    </div>
  );
}

function ActivatedPhase({ proposal, agent, T, type, onClose }) {
  return (
    <div style={{ padding: '28px 24px 26px', textAlign: 'center' }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%', background: agent.swatch,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 24, marginBottom: 14,
      }}>∞</div>
      <h3 style={{ margin: '0 0 6px 0', fontFamily: type.display, fontSize: 22, fontWeight: 700 }}>
        Hands-off mode active
      </h3>
      <div style={{ fontSize: 14, color: T.textDim, marginBottom: 18, maxWidth: 480, margin: '0 auto 18px' }}>
        <b style={{ color: T.text }}>{proposal.title}</b> is now running on your account.
        <br/>Next run: <b style={{ color: T.text }}>{proposal.nextRun}</b>. First run is on us — you won't be charged until then.
      </div>
      <button onClick={onClose} style={{
        padding: '10px 20px', background: T.text, color: T.panel, border: 'none',
        borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: type.body,
      }}>
        Back to marketplace
      </button>
    </div>
  );
}

// Per-agent hand-tuned proposals — feel tailored
function proposalsFor(agent) {
  const byAgent = {
    'aperture': [
      { title: 'Refresh creative when CTR dips',
        why: 'Your Meta CTR averages 1.7%. When it drops below 1.3% for 3 days, ship 15 new ad variants to your ad account as paused drafts.',
        trigger: 'Meta CTR < 1.3% for 3d', destination: 'Meta Ads (paused) + Slack #growth',
        price: '$280', cadence: 'per trigger', nextRun: 'when threshold hits', socialProof: '412 similar SaaS run this' },
      { title: 'Weekly angle test — Tuesdays 9am',
        why: 'Mid-stage SaaS typically cycle creative every 11 days. Weekly angle tests keep you ahead of fatigue without waiting for metrics to slip.',
        trigger: 'every Tuesday 9am', destination: 'Figma + Meta (paused)',
        price: '$180', cadence: 'weekly', nextRun: 'Tuesday, 9:00 AM PT' },
      { title: 'Reactive: new competitor on G2',
        why: 'When a new competitor appears in your G2 category, draft 5 comparison-angle ads within 4 hours.',
        trigger: 'new G2 competitor detected', destination: 'Slack #growth + Figma',
        price: '$220', cadence: 'per trigger', nextRun: 'when detected', socialProof: 'avg 2.3 runs/mo' },
    ],
    'funnelsmith': [
      { title: 'Launch-funnel audit, every 6 weeks',
        why: 'You ship new pricing tests roughly every 5–7 weeks. A biweekly audit before each test surfaces copy gaps and funnel leaks early.',
        trigger: 'every 6 weeks', destination: 'Notion + email digest',
        price: '$340', cadence: 'per run', nextRun: 'in 6 weeks', socialProof: '89 founders subscribed' },
      { title: 'Reactive: traffic dip below baseline',
        why: 'When your organic traffic drops > 12% week-over-week, run a funnel diagnostic and ship fixes as Notion tasks.',
        trigger: 'traffic dip > 12% WoW', destination: 'Notion + Linear',
        price: '$400', cadence: 'per trigger', nextRun: 'when detected' },
      { title: 'Monthly VSL rewrite for top funnel',
        why: 'VSLs decay fastest. Monthly rewrites against your best-performing angle keep ad fatigue off your top funnel.',
        trigger: '1st of month', destination: 'Notion + Drive',
        price: '$280', cadence: 'monthly', nextRun: 'Oct 1' },
    ],
    'helios': [
      { title: 'Weekly competitor pulse',
        why: 'Your category is moving fast — 3 new SaaS entered G2 in the last quarter. A weekly pulse catches pricing shifts and positioning changes.',
        trigger: 'every Monday 7am', destination: 'Notion DB + Slack #intel',
        price: '$220', cadence: 'weekly', nextRun: 'Monday, 7:00 AM PT', socialProof: '1,240 subscribers' },
      { title: 'On demand: before every board meeting',
        why: 'You mentioned quarterly board meetings. Auto-run a competitive teardown 48h before each one.',
        trigger: 'before calendar event "Board Meeting"', destination: 'Notion + email',
        price: '$480', cadence: 'quarterly', nextRun: 'Dec 12' },
      { title: 'Reactive: pricing change alert',
        why: 'When any tracked competitor changes pricing or launches a plan tier, run a full repricing analysis within 4h.',
        trigger: 'competitor pricing change', destination: 'Slack + Linear issues',
        price: '$260', cadence: 'per trigger', nextRun: 'when detected' },
    ],
    'triage-01': [
      { title: 'Daily customer trend report',
        why: 'You have ~340 support tickets/mo. A daily trend report surfaces emerging product issues before they become patterns.',
        trigger: 'every day 6pm', destination: 'Slack #support + email',
        price: '$120', cadence: 'daily', nextRun: 'tonight 6 PM', socialProof: '2,811 stores run this' },
      { title: 'On every refund request',
        why: 'Draft a refund-handler reply within 90 seconds of the ticket arriving, in your brand voice.',
        trigger: 'new refund request', destination: 'webhook → Help Scout draft',
        price: '$0.40', cadence: 'per ticket', nextRun: 'on next refund' },
      { title: 'Weekly voice-of-customer digest',
        why: 'Synthesize every ticket into 5 themes, routed to the right teams.',
        trigger: 'every Friday 5pm', destination: 'Notion + Linear',
        price: '$140', cadence: 'weekly', nextRun: 'Friday, 5:00 PM PT' },
    ],
    'operator-dm': [
      { title: 'Monthly hiring plan recalc',
        why: 'Your ARR is growing ~11% MoM. Monthly recalcs keep your hiring plan aligned as runway and targets shift.',
        trigger: '1st of month', destination: 'Notion + Slack #leadership',
        price: '$380', cadence: 'monthly', nextRun: 'Oct 1', socialProof: '94 operators subscribed' },
      { title: 'Reactive: post-fundraise replan',
        why: 'When your valuation or funding changes materially, auto-generate an updated 18-month operating plan.',
        trigger: 'funding event detected', destination: 'Notion + email',
        price: '$620', cadence: 'per trigger', nextRun: 'when detected' },
      { title: 'Quarterly OKR draft',
        why: 'Draft next-quarter OKRs 10 days before quarter-end using actuals from your last 90 days.',
        trigger: '10d before quarter-end', destination: 'Linear + Notion',
        price: '$420', cadence: 'quarterly', nextRun: 'Dec 21' },
    ],
  };
  return byAgent[agent.id] || byAgent['funnelsmith'];
}

Object.assign(window, { HandsOffUpsell, proposalsFor });
