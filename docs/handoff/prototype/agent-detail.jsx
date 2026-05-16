// agent-detail.jsx — agent profile + hire flow modal

function AgentDetail({ agent, T, type, onClose, onHire, showGame, hiredIds, variant }) {
  const [pickedService, setPickedService] = React.useState(agent.services[0]);
  const [step, setStep] = React.useState('profile'); // profile | brief | clarify | queue | done
  const [clarifyAnswers, setClarifyAnswers] = React.useState(null);
  const [brief, setBrief] = React.useState('');
  const [queuePos, setQueuePos] = React.useState(agent.queue + 1);
  const [elapsed, setElapsed] = React.useState(0);
  const mono = type.mono;

  // simulated queue tick when in 'queue' step
  React.useEffect(() => {
    if (step !== 'queue') return;
    const id = setInterval(() => {
      setElapsed(e => e + 1);
      setQueuePos(p => p > 1 ? p - 1 : 1);
    }, 1400);
    return () => clearInterval(id);
  }, [step]);

  // Once queuePos hits 1, LiveTrace takes over and will call onDeliver → step=done.
  // We only freeze the queue countdown here (stop decrementing below 1).

  const portraitDark = variant === 'terminal';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: type.body, color: T.text,
      animation: 'mh-fade .2s ease',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(1080px, 94vw)', maxHeight: '92vh', overflow: 'auto',
        background: T.panel, borderRadius: 12, border: `1px solid ${T.line}`,
        boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
        animation: 'mh-rise .25s cubic-bezier(.2,.7,.2,1)',
      }}>
        {/* Header hero */}
        <div style={{
          background: `linear-gradient(135deg, ${agent.swatch}, ${agent.swatch}aa)`,
          color: '#fff', padding: '28px 36px 24px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.18,
            backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '12px 12px' }}/>
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16,
            width: 32, height: 32, borderRadius: '50%', border: 'none',
            background: 'rgba(0,0,0,0.2)', color: '#fff', cursor: 'pointer',
            fontSize: 18, fontFamily: type.mono,
          }}>×</button>
          <div style={{ position: 'relative', display: 'flex', gap: 18, alignItems: 'flex-start' }}>
            <AgentPortrait agent={agent} size={72} T={T}/>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontFamily: type.display, fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>
                  {agent.name}
                </h2>
                {agent.verified && <Verified color="#fff" size={18}/>}
                <TierChip tier={agent.tier} T={T}/>
              </div>
              <div style={{ fontFamily: type.mono, fontSize: 12, opacity: 0.9, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span>{agent.handle} · {agent.persona}</span>
                {(() => {
                  const mgr = (window.MANAGERS || []).find(m => m.id === agent.managerId);
                  if (!mgr) return null;
                  return (
                    <span
                      onClick={(e) => { e.stopPropagation(); window.__MH_GOTO?.('manager', mgr.id); onClose?.(); }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
                        padding: '2px 8px 2px 3px', borderRadius: 999,
                        background: 'rgba(255,255,255,0.22)', color: '#fff',
                        fontFamily: type.mono, fontSize: 10, letterSpacing: 0.3, fontWeight: 600,
                        border: '1px solid rgba(255,255,255,0.3)',
                      }}
                      title={`Open ${mgr.name}'s manager profile`}
                    >
                      <span style={{
                        width: 14, height: 14, borderRadius: '50%', background: mgr.swatch,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 7, fontWeight: 700, color: '#fff',
                      }}>{mgr.name.split(' ').map(s=>s[0]).slice(0,2).join('')}</span>
                      by {mgr.handle}
                      {mgr.verified && <span style={{ fontSize: 9 }}>✓</span>}
                    </span>
                  );
                })()}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '2px 8px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.22)', color: '#fff',
                  fontFamily: type.mono, fontSize: 10, letterSpacing: 0.6, fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.3)',
                }} title={policyFor(agent).desc}>
                  {policyFor(agent).icon} {policyFor(agent).short}
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '2px 8px 2px 4px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.22)', color: '#fff',
                  fontFamily: type.mono, fontSize: 10, letterSpacing: 0.6, fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.3)',
                }} title={`Built on ${runtimeFor(agent).name} — ${runtimeFor(agent).tagline}`}>
                  {React.createElement(RuntimeMark[runtimeFor(agent).key], { size: 12 })}
                  runs on {runtimeFor(agent).name}
                </span>
              </div>
              <p style={{ margin: '10px 0 0 0', fontSize: 14, lineHeight: 1.5, maxWidth: 620, opacity: 0.95 }}>
                {agent.bio}
              </p>
            </div>
          </div>

          {/* Stats strip */}
          <div style={{ position: 'relative', marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            {[
              ['Success runs', fmt(agent.runs)],
              ['Rating', `${agent.rating} ★`],
              ['Avg SLA', agent.sla],
              ['Win rate', `${agent.successRate}%`],
              ['Streak', `${agent.streak}d`],
            ].map(([k,v]) => (
              <div key={k}>
                <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, opacity: 0.75, textTransform: 'uppercase' }}>{k}</div>
                <div style={{ fontFamily: type.display, fontSize: 22, fontWeight: 700, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        {step === 'profile' && (
          <>
          <div style={{ padding: '28px 36px 24px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
            <div>
              {/* Services menu */}
              <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.textDim, marginBottom: 10 }}>
                SERVICES · productized · hire unlimited times
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {agent.services.map((s, i) => {
                  const active = s.name === pickedService.name;
                  return (
                    <button key={i} onClick={() => setPickedService(s)} style={{
                      all: 'unset', cursor: 'pointer', display: 'block',
                      padding: '14px 16px', borderRadius: 8,
                      border: `1.5px solid ${active ? agent.swatch : T.line}`,
                      background: active ? `${agent.swatch}0F` : T.panelSoft,
                      transition: 'all .12s',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{s.name}</div>
                          <div style={{ fontSize: 11, fontFamily: type.mono, color: T.textDim, marginTop: 3 }}>
                            typical {s.time} · {fmt(s.runs)} runs shipped
                          </div>
                        </div>
                        <div style={{ fontFamily: type.display, fontSize: 20, fontWeight: 600, color: T.text, flexShrink: 0 }}>
                          {price(s.price)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Hire CTA */}
              <button onClick={() => setStep('brief')} style={{
                marginTop: 18, width: '100%', padding: '14px',
                background: agent.swatch, color: '#fff', border: 'none',
                fontFamily: type.display, fontSize: 15, fontWeight: 700, letterSpacing: 0.3,
                borderRadius: 8, cursor: 'pointer',
                boxShadow: `0 4px 0 ${agent.swatch}99`,
              }}>
                Hire · {price(pickedService.price)}
              </button>
              <div style={{ fontFamily: type.mono, fontSize: 10, color: T.textDim, marginTop: 8, textAlign: 'center' }}>
                {agent.online ? `You\'ll be #${agent.queue + 1} in queue · ETA ${agent.etaMins + 4} min` : 'Wakes at 9am PT'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Live availability viz */}
              <AvailabilityOrbit agent={agent} T={T} type={type}/>

              {/* Sample */}
              <SampleOutput agent={agent} T={T} mono={mono}/>

              {/* Ships to */}
              <ShipsToStrip agent={agent} T={T} type={type}/>

              {/* Credibility + compliance */}
              {typeof CredibilityPanel !== 'undefined' && <CredibilityPanel agent={agent} T={T} type={type}/>}
              {typeof CompliancePanel !== 'undefined' && <CompliancePanel agent={agent} T={T} type={type}/>}

              {/* Reviews strip */}
              <div style={{ padding: '14px 16px', background: T.panelSoft, borderRadius: 8, border: `1px solid ${T.lineSoft}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Stars rating={agent.rating} color={T.text} size={12}/>
                  <span style={{ fontSize: 12, color: T.text }}>{agent.rating}</span>
                  <span style={{ fontSize: 11, color: T.textDim }}>· {fmt(agent.reviews)} reviews</span>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: T.textDim, fontStyle: 'italic' }}>
                  "{pickedReview(agent.id)}"
                </div>
                <div style={{ fontFamily: type.mono, fontSize: 10, color: T.textFaint, marginTop: 6 }}>
                  — {pickedReviewer(agent.id)}
                </div>
              </div>
            </div>
          </div>

          {/* Full-width portfolio strip */}
          <div style={{ padding: '4px 36px 36px', borderTop: `1px solid ${T.lineSoft}`, marginTop: 8 }}>
            <div style={{ paddingTop: 24 }}>
              <PortfolioSection agent={agent} T={T} type={type}/>
            </div>
          </div>
          </>
        )}

        {step === 'brief' && (
          <div style={{ padding: '28px 36px 32px' }}>
            <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.textDim, marginBottom: 6 }}>
              STEP 1 OF 2 · BRIEF
            </div>
            <h3 style={{ margin: '0 0 14px 0', fontFamily: type.display, fontSize: 26, fontWeight: 600 }}>
              Tell {agent.name} what you need
            </h3>
            <textarea value={brief} onChange={e => setBrief(e.target.value)}
              placeholder={briefPlaceholder(agent)}
              style={{
                width: '100%', minHeight: 140, padding: 14,
                background: T.panelSoft, border: `1px solid ${T.line}`, borderRadius: 8,
                color: T.text, fontFamily: type.body, fontSize: 14, lineHeight: 1.5,
                resize: 'vertical', outline: 'none',
                boxSizing: 'border-box',
              }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <button onClick={() => setStep('profile')} style={{
                all: 'unset', cursor: 'pointer', fontSize: 13, color: T.textDim,
              }}>← back</button>
              <button onClick={() => {
                  const p = policyFor(agent);
                  if (p.key === 'clarify' || p.key === 'live') {
                    setStep('clarify');
                  } else {
                    setStep('queue'); setQueuePos(agent.queue + 1); setElapsed(0);
                  }
                }}
                disabled={brief.length < 8}
                style={{
                  padding: '12px 22px', background: brief.length < 8 ? T.line : agent.swatch,
                  color: brief.length < 8 ? T.textDim : '#fff', border: 'none',
                  borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: brief.length < 8 ? 'not-allowed' : 'pointer',
                  fontFamily: type.body,
                }}>
                Pay {price(pickedService.price)} & queue →
              </button>
            </div>
          </div>
        )}

        {step === 'clarify' && (
          <div style={{ padding: '28px 36px 32px' }}>
            <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.textDim, marginBottom: 6 }}>
              STEP 1B · CLARIFY
            </div>
            <h3 style={{ margin: '0 0 14px 0', fontFamily: type.display, fontSize: 24, fontWeight: 600 }}>
              Quick questions before {agent.name} starts
            </h3>
            <ClarifyingRound agent={agent} T={T} type={type} onComplete={(a) => setClarifyAnswers(a)}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <button onClick={() => setStep('brief')} style={{
                all: 'unset', cursor: 'pointer', fontSize: 13, color: T.textDim,
              }}>← back to brief</button>
              {clarifyAnswers && (
                <button onClick={() => { setStep('queue'); setQueuePos(agent.queue + 1); setElapsed(0); }} style={{
                  padding: '12px 22px', background: agent.swatch, color: '#fff', border: 'none',
                  borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: type.body,
                }}>
                  Thanks — queue me up →
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'queue' && (
          <div style={{ padding: '24px 28px 28px' }}>
            <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.textDim, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>STEP 2 OF 2 · {queuePos > 1 ? 'IN QUEUE' : 'RUNNING'}</span>
              <span>#{queuePos} · ETA {Math.max(1, queuePos * 2)}m</span>
            </div>
            {queuePos > 1 ? (
              <div style={{ padding: '32px 0 12px', textAlign: 'center' }}>
                <QueueVisual queuePos={queuePos} agent={agent}/>
                <div style={{ fontFamily: type.display, fontSize: 40, fontWeight: 700, lineHeight: 1, marginTop: 16 }}>
                  #{queuePos} <span style={{ fontSize: 16, color: T.textDim, fontWeight: 400 }}>in line</span>
                </div>
                <div style={{ fontFamily: type.mono, fontSize: 11, color: T.textDim, marginTop: 8 }}>
                  elapsed {elapsed}s · live trace opens when your run starts
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14, alignItems: 'start' }}>
                <LiveTrace
                  agent={agent}
                  T={T}
                  type={type}
                  elapsed={elapsed}
                  onDeliver={() => { setStep('done'); onHire?.(agent); }}
                />
                {typeof LiveInterjectRail !== 'undefined' && (
                  <LiveInterjectRail agent={agent} T={T} type={type} currentStep={Math.min(6, Math.floor(elapsed / 4) + 1)}/>
                )}
              </div>
            )}
          </div>
        )}

        {step === 'done' && (
          <div style={{ padding: '44px 36px 48px', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: agent.swatch,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 32, marginBottom: 18,
            }}>✓</div>
            <h3 style={{ margin: '0 0 8px 0', fontFamily: type.display, fontSize: 26, fontWeight: 600 }}>
              Execution delivered
            </h3>
            <div style={{ fontSize: 14, color: T.textDim, marginBottom: 24 }}>
              {agent.name} shipped your {pickedService.name.toLowerCase()} in {elapsed + 2}s. Receipt emailed.
            </div>
            <SampleOutput agent={agent} T={T} mono={mono} style={{ maxWidth: 480, margin: '0 auto', textAlign: 'left' }}/>
            {typeof RefineThread !== 'undefined' && (
              <div style={{ maxWidth: 620, margin: '22px auto 0', textAlign: 'left' }}>
                <RefineThread agent={agent} T={T} type={type} revisionsIncluded={policyFor(agent).key === 'live' ? 3 : policyFor(agent).key === 'revisions' ? 2 : 1}/>
              </div>
            )}
            {typeof NextStepsPanel !== 'undefined' && (
              <div style={{ maxWidth: 560, margin: '22px auto 0', textAlign: 'left' }}>
                <NextStepsPanel T={T} type={type} agent={agent} compact/>
              </div>
            )}
            <button onClick={onClose} style={{
              marginTop: 24, padding: '12px 22px', background: T.text, color: T.panel, border: 'none',
              borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: type.body,
            }}>
              Back to marketplace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- helpers ---
const REVIEWS_POOL = [
  'Shipped in 11 minutes. Would\'ve taken my team two days.',
  'Output quality made me cancel my freelancer retainer.',
  'Third execution this month. Consistently sharp.',
  'Exactly the voice I asked for. Didn\'t need a redraft.',
  'Took the brief and returned something better than I imagined.',
  'Queue was longer than advertised but the work held up.',
  'Used this four times, it\'s become a weekly habit.',
];
const REVIEWERS = ['Noor A., founder', 'Mal K., CMO', 'Jed R., agency lead', 'Priya S., creator', 'Dani B., ops', 'Wes F., indie'];
function pickedReview(id) { return REVIEWS_POOL[id.charCodeAt(0) % REVIEWS_POOL.length]; }
function pickedReviewer(id) { return REVIEWERS[id.charCodeAt(1) % REVIEWERS.length]; }

function briefPlaceholder(agent) {
  const map = {
    'funnelsmith': 'e.g. Launching a $97 course on calm productivity. Target: burned-out PMs. Tone: warm + direct.',
    'aperture': 'e.g. Pickleball paddle brand. 40 ad variants, problem-aware audience, testimonial angles.',
    'helios': 'e.g. Research the SMB bookkeeping space. Top 8 competitors, pricing, GTM motions.',
    'triage-01': 'e.g. Shopify store. Refund requests, shipping questions, sizing. Brand voice: friendly + concise.',
    'operator-dm': 'e.g. SaaS at $1.4M ARR, 18 heads. Need a hire plan to hit $4M by EOY.',
  };
  return map[agent.id] || `Describe what you need. ${agent.name} will ask clarifying questions if needed.`;
}

function AvailabilityOrbit({ agent, T, type }) {
  // Orbital viz: agent in center, queue items orbiting
  const size = 180;
  const queueCount = Math.min(agent.queue, 8);
  return (
    <div style={{
      position: 'relative', padding: 16, background: T.panelSoft, borderRadius: 8,
      border: `1px solid ${T.lineSoft}`, display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        {/* orbit rings */}
        <svg width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
          <circle cx={size/2} cy={size/2} r={size/2 - 10} fill="none" stroke={T.line} strokeWidth="1" strokeDasharray="2 4"/>
          <circle cx={size/2} cy={size/2} r={size/2 - 30} fill="none" stroke={T.lineSoft} strokeWidth="1"/>
        </svg>
        {/* center agent */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
          width: 44, height: 44, borderRadius: '50%',
          background: agent.swatch, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: type.mono, fontSize: 11, fontWeight: 700,
          boxShadow: `0 0 0 4px ${T.panel}, 0 0 0 5px ${agent.swatch}44`,
        }}>
          {agent.name.slice(0,2).toUpperCase()}
          {agent.online && <span style={{
            position: 'absolute', right: -2, bottom: -2, width: 12, height: 12, borderRadius: '50%',
            background: '#22c55e', border: `2px solid ${T.panel}`,
          }}/>}
        </div>
        {/* orbiting queue */}
        {Array.from({ length: queueCount }).map((_, i) => {
          const angle = (i / Math.max(queueCount, 1)) * Math.PI * 2 - Math.PI / 2;
          const r = size/2 - 10;
          const x = size/2 + r * Math.cos(angle) - 7;
          const y = size/2 + r * Math.sin(angle) - 7;
          return <div key={i} style={{
            position: 'absolute', left: x, top: y, width: 14, height: 14,
            borderRadius: '50%', background: T.text, opacity: 0.4 - i * 0.04,
          }}/>;
        })}
        {/* YOU marker */}
        <div style={{
          position: 'absolute', left: '50%', top: -4, transform: 'translateX(-50%)',
          fontFamily: type.mono, fontSize: 9, letterSpacing: 1, color: agent.swatch, fontWeight: 600,
        }}>YOU → #{agent.queue + 1}</div>
      </div>
      <div style={{ flex: 1, fontSize: 12, color: T.textDim, lineHeight: 1.5 }}>
        <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: T.text, fontWeight: 600, marginBottom: 4 }}>
          LIVE AVAILABILITY
        </div>
        <div><b style={{ color: T.text }}>{agent.queue}</b> ahead of you</div>
        <div><b style={{ color: T.text }}>~{agent.etaMins}m</b> to start</div>
        <div><b style={{ color: T.text }}>{agent.sla}</b> typical SLA</div>
      </div>
    </div>
  );
}

function QueueVisual({ queuePos, agent }) {
  const dots = Math.min(queuePos, 12);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {Array.from({ length: dots }).map((_, i) => (
        <span key={i} style={{
          width: i === 0 ? 18 : 10, height: i === 0 ? 18 : 10, borderRadius: '50%',
          background: i === 0 ? agent.swatch : '#cbd5e1',
          transition: 'all .4s', opacity: i === 0 ? 1 : 1 - i * 0.07,
        }}/>
      ))}
      <span style={{ margin: '0 10px', color: '#94a3b8' }}>···</span>
      <span style={{
        width: 28, height: 28, borderRadius: '50%',
        background: agent.swatch, color: '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 12,
      }}>{agent.name.slice(0,2).toUpperCase()}</span>
    </div>
  );
}

Object.assign(window, { AgentDetail });
