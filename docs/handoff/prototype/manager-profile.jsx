// manager-profile.jsx — X-style thin profile for an agent manager (creator/operator).
// A manager is a human or org who publishes + is liable for one or more agents.

function ManagerProfilePage({ T, type, goto, managerId, onOpen }) {
  const mgr = MANAGERS.find(m => m.id === managerId) || MANAGERS[0];
  const agents = AGENTS.filter(a => mgr.managedIds.includes(a.id));

  return (
    <div style={{ fontFamily: type.body, color: T.text, background: T.bg, minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <div style={{ borderBottom: `1px solid ${T.lineSoft}`, background: T.bg }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 32px',
          display: 'flex', alignItems: 'center', gap: 12, fontFamily: type.mono, fontSize: 11 }}>
          <button onClick={() => goto('browse')} style={{
            all: 'unset', cursor: 'pointer', color: T.textDim, letterSpacing: 0.5,
          }}>← marketplace</button>
          <span style={{ color: T.textFaint }}>/</span>
          <span style={{ color: T.textDim }}>managers</span>
          <span style={{ color: T.textFaint }}>/</span>
          <span style={{ color: T.text }}>{mgr.handle}</span>

          {/* switch profile for demo */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: T.textFaint, fontSize: 10, letterSpacing: 1 }}>DEMO · SWITCH</span>
            {MANAGERS.map(m => (
              <button key={m.id} onClick={() => goto('manager', m.id)} style={{
                all: 'unset', cursor: 'pointer', padding: '3px 8px', borderRadius: 4,
                background: m.id === mgr.id ? T.text : 'transparent',
                color: m.id === mgr.id ? T.panel : T.textDim,
                border: `1px solid ${m.id === mgr.id ? T.text : T.line}`,
                fontSize: 10, fontFamily: type.mono,
              }}>{m.handle}</button>
            ))}
          </div>
        </div>
      </div>

      <ManagerHeader mgr={mgr} T={T} type={type}/>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px 80px',
        display: 'grid', gridTemplateColumns: '280px 1fr', gap: 40, alignItems: 'start' }}>

        <aside style={{ paddingTop: 72, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ManagerSidebar mgr={mgr} T={T} type={type}/>
          {typeof CredibilityPanel !== 'undefined' && <CredibilityPanel manager={mgr} T={T} type={type}/>}
          {typeof ClaimBacklinkWidget !== 'undefined' && <ClaimBacklinkWidget mgr={mgr} T={T} type={type}/>}
        </aside>

        <div>
          <ManagerTabs T={T} type={type} mgr={mgr}/>
          <ManagedAgentsSection agents={agents} mgr={mgr} T={T} type={type} onOpen={onOpen}/>
          {mgr.agentManager && <PersonalAgentBanner mgr={mgr} T={T} type={type} onOpen={onOpen} goto={goto}/>}
          <ActivitySection mgr={mgr} T={T} type={type}/>
        </div>
      </div>
    </div>
  );
}

// ---- Header: cover strip + avatar + actions ----
function ManagerHeader({ mgr, T, type }) {
  const initials = mgr.name.split(' ').map(s => s[0]).slice(0,2).join('');
  return (
    <div>
      {/* cover strip — diagonal stripes in their swatch */}
      <div style={{
        height: 140, background: `linear-gradient(135deg, ${mgr.swatch}, ${mgr.swatch}cc)`,
        position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${T.line}`,
      }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
          <defs>
            <pattern id="mgrcover" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="28" stroke="#fff" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mgrcover)"/>
        </svg>
        <div style={{ position: 'absolute', top: 12, right: 20, fontFamily: type.mono, fontSize: 10, letterSpacing: 1.5, color: 'rgba(255,255,255,0.8)' }}>
          AIaaS · MANAGER PROFILE
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px', position: 'relative' }}>
        {/* Avatar — square, sits below cover */}
        <div style={{
          position: 'absolute', top: -56, left: 32,
          width: 112, height: 112, borderRadius: 12,
          background: mgr.swatch, color: '#fff',
          border: `4px solid ${T.bg}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: type.display, fontSize: 44, fontWeight: 700, letterSpacing: -1,
        }}>{initials}</div>

        {/* Action bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 0' }}>
          <button style={{
            padding: '8px 14px', background: 'transparent', color: T.text,
            border: `1px solid ${T.line}`, borderRadius: 999,
            fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: type.body,
          }}>Message</button>
          <button style={{
            padding: '8px 14px', background: 'transparent', color: T.text,
            border: `1px solid ${T.line}`, borderRadius: 999,
            fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: type.body,
          }}>Subscribe to digest</button>
          <button style={{
            padding: '8px 16px', background: T.text, color: T.panel, border: 'none',
            borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: type.body,
          }}>Follow</button>
        </div>
      </div>
    </div>
  );
}

// ---- Sidebar: identity, bio, meta, stats ----
function ManagerSidebar({ mgr, T, type }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <h1 style={{ margin: 0, fontFamily: type.display, fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
          {mgr.name}
        </h1>
        {mgr.verified && <Verified color={T.accent} size={15}/>}
      </div>
      <div style={{ fontFamily: type.mono, fontSize: 12, color: T.textDim, marginBottom: 10 }}>
        {mgr.handle}
      </div>

      {mgr.founding && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '3px 9px', borderRadius: 999,
          background: `${T.accent}14`, border: `1px solid ${T.accent}44`,
          fontFamily: type.mono, fontSize: 10, letterSpacing: 0.8, color: T.accent, fontWeight: 600,
          marginBottom: 14,
        }}>
          ★ FOUNDING 100
        </div>
      )}

      <p style={{ fontSize: 14, lineHeight: 1.55, color: T.text, margin: '6px 0 14px', textWrap: 'pretty' }}>
        {mgr.title}
      </p>
      <p style={{ fontSize: 13, lineHeight: 1.55, color: T.textDim, margin: '0 0 16px', textWrap: 'pretty' }}>
        {mgr.bio}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: type.mono, fontSize: 11.5, color: T.textDim, marginBottom: 20 }}>
        <div>📍 {mgr.location}</div>
        <div>🔗 <span style={{ color: T.accent }}>{mgr.site}</span></div>
        <div>◷ Joined {mgr.joined}</div>
      </div>

      {/* Stats */}
      <div style={{ border: `1px solid ${T.line}`, borderRadius: 10, overflow: 'hidden', background: T.panel }}>
        {[
          ['Managed agents', mgr.managedIds.length],
          ['Total runs', fmt(mgr.stats.runs)],
          ['Paid out', `$${fmt(mgr.stats.earnings)}`],
          ['Chains active', mgr.stats.chains],
        ].map(([k, v], i, arr) => (
          <div key={k} style={{
            padding: '11px 14px', display: 'flex', justifyContent: 'space-between',
            borderBottom: i < arr.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
            fontSize: 12,
          }}>
            <span style={{ color: T.textDim, fontFamily: type.mono, fontSize: 10.5, letterSpacing: 0.5, textTransform: 'uppercase' }}>{k}</span>
            <span style={{ color: T.text, fontFamily: type.display, fontWeight: 600, fontSize: 13 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Tab strip (static, visual only) ----
function ManagerTabs({ T, type, mgr }) {
  const tabs = [
    ['Agents', mgr.managedIds.length],
    ['Activity', '∞'],
    ['Chains', mgr.stats.chains],
    ['Reviews', '—'],
  ];
  return (
    <div style={{ display: 'flex', borderBottom: `1px solid ${T.line}`, paddingTop: 20, marginBottom: 4 }}>
      {tabs.map(([l, c], i) => (
        <div key={l} style={{
          padding: '14px 22px', fontSize: 13.5, fontWeight: i === 0 ? 600 : 400,
          color: i === 0 ? T.text : T.textDim, cursor: 'pointer',
          borderBottom: i === 0 ? `2px solid ${T.accent}` : '2px solid transparent',
          marginBottom: -1, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {l}
          <span style={{ fontFamily: type.mono, fontSize: 10, color: T.textFaint }}>{c}</span>
        </div>
      ))}
    </div>
  );
}

// ---- Managed agents list — X-style thin rows, dense ----
function ManagedAgentsSection({ agents, mgr, T, type, onOpen }) {
  return (
    <section style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontFamily: type.display, fontSize: 20, fontWeight: 700 }}>
          Managed agents
        </h2>
        <div style={{ fontFamily: type.mono, fontSize: 10.5, color: T.textDim, letterSpacing: 0.5 }}>
          {mgr.name.split(' ')[0]} is liable for each agent's output & payouts
        </div>
      </div>

      <div style={{ border: `1px solid ${T.line}`, borderRadius: 10, overflow: 'hidden', background: T.panel }}>
        {agents.map((a, i) => (
          <button key={a.id} onClick={() => onOpen?.(a)} style={{
            all: 'unset', cursor: 'pointer', width: '100%', boxSizing: 'border-box',
            display: 'grid', gridTemplateColumns: '44px 1.4fr 2fr 120px 120px 80px', gap: 14,
            alignItems: 'center', padding: '14px 16px',
            borderBottom: i < agents.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
            transition: 'background .1s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = T.panelSoft}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {/* avatar */}
            <div style={{
              width: 40, height: 40, borderRadius: 8, background: a.swatch,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: type.mono, fontSize: 11, fontWeight: 700,
            }}>{a.name.slice(0,2).toUpperCase()}</div>

            {/* name + handle */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{a.name}</span>
                {a.verified && <Verified color={T.accent} size={11}/>}
                {a.selfManaged && (
                  <span style={{
                    padding: '1px 6px', borderRadius: 3, background: `${T.accent}18`, color: T.accent,
                    fontFamily: type.mono, fontSize: 9, fontWeight: 600, letterSpacing: 0.5,
                  }}>SELF-MANAGING</span>
                )}
              </div>
              <div style={{ fontFamily: type.mono, fontSize: 11, color: T.textDim, marginTop: 1 }}>
                {a.handle}
              </div>
            </div>

            {/* tagline */}
            <div style={{ fontSize: 12.5, color: T.textDim, textWrap: 'balance', lineHeight: 1.4 }}>
              {a.tagline}
            </div>

            {/* runs */}
            <div style={{ fontFamily: type.mono, fontSize: 11 }}>
              <div style={{ fontSize: 15, fontFamily: type.display, fontWeight: 600, color: T.text }}>
                {fmt(a.runs)}
              </div>
              <div style={{ color: T.textFaint, fontSize: 9.5, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                runs
              </div>
            </div>

            {/* availability */}
            <div style={{ fontFamily: type.mono, fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
              {a.online ? <Pulse color="#22c55e" size={6}/> : <AvailabilityDot online={false} size={6}/>}
              <span style={{ color: T.textDim }}>
                {a.online ? `q${a.queue} · ${a.etaMins}m` : 'resting'}
              </span>
            </div>

            {/* price */}
            <div style={{ textAlign: 'right', fontFamily: type.display, fontSize: 14, fontWeight: 600 }}>
              {price(a.priceFrom)}
            </div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 12, fontFamily: type.mono, fontSize: 11, color: T.textFaint, letterSpacing: 0.3 }}>
        Managers earn <b style={{ color: T.textDim }}>85%</b> of each run across their roster · platform retains 15% for discovery, payments, and trust.
      </div>
    </section>
  );
}

// ---- Personal agentic agent callout (if manager has one) ----
function PersonalAgentBanner({ mgr, T, type, onOpen, goto }) {
  const personal = AGENTS.find(a => a.id === mgr.personalAgentId);
  if (!personal) return null;
  return (
    <section style={{ marginTop: 28 }}>
      <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.5, color: T.accent, fontWeight: 600, marginBottom: 8 }}>
        ── PERSONAL AGENTIC AGENT
      </div>
      <div style={{
        border: `1px solid ${T.line}`, borderRadius: 12, overflow: 'hidden',
        background: `linear-gradient(135deg, ${personal.swatch}08, transparent)`,
        padding: '22px 24px',
        display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'center',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: personal.swatch,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: type.mono, fontSize: 10, fontWeight: 700,
            }}>{personal.name.slice(0,2).toUpperCase()}</div>
            <div>
              <div style={{ fontFamily: type.display, fontSize: 20, fontWeight: 700, letterSpacing: -0.3 }}>
                {personal.name}
              </div>
              <div style={{ fontFamily: type.mono, fontSize: 11, color: T.textDim }}>
                {personal.handle} · works on behalf of {mgr.handle}
              </div>
            </div>
          </div>
          <p style={{ margin: '10px 0 14px', fontSize: 13.5, color: T.text, lineHeight: 1.5, maxWidth: 520, textWrap: 'pretty' }}>
            {personal.persona}. {personal.tagline}
          </p>
          <div style={{ display: 'flex', gap: 18, fontFamily: type.mono, fontSize: 11, color: T.textDim, marginBottom: 14 }}>
            <span><b style={{ color: T.text, fontFamily: type.display, fontSize: 14 }}>{fmt(personal.runs)}</b> runs</span>
            <span><b style={{ color: T.text, fontFamily: type.display, fontSize: 14 }}>{personal.successRate}%</b> success</span>
            <span><b style={{ color: T.text, fontFamily: type.display, fontSize: 14 }}>{personal.streak}d</b> streak</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onOpen?.(personal)} style={{
              padding: '9px 16px', background: T.text, color: T.panel, border: 'none',
              borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: type.body,
            }}>Hire {personal.name} →</button>
            <button onClick={() => goto('developers')} style={{
              padding: '9px 16px', background: 'transparent', color: T.text,
              border: `1px solid ${T.line}`, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: type.body,
            }}>How it self-onboards</button>
          </div>
        </div>

        {/* Terminal preview */}
        <div style={{
          background: '#0E0E13', borderRadius: 8, padding: '12px 14px',
          fontFamily: type.mono, fontSize: 10.5, color: '#7CE7A6', lineHeight: 1.7,
          border: `1px solid ${T.line}`,
        }}>
          <div style={{ color: '#5A8AB6' }}>$ {personal.handle.slice(1)} status</div>
          <div style={{ color: '#D8D8D8' }}>→ autonomous · reporting to {mgr.handle}</div>
          <div style={{ color: '#D8D8D8' }}>→ self-onboarded: POST /agents ✓</div>
          <div style={{ color: '#D8D8D8' }}>→ paid out: $482.10 (wk)</div>
          <div style={{ color: '#7CE7A6' }}>▮</div>
        </div>
      </div>
    </section>
  );
}

// ---- Activity (last 5 runs across all managed agents) ----
function ActivitySection({ mgr, T, type }) {
  const events = [
    { agent: mgr.managedIds[0], action: 'delivered', detail: 'Shortlist of 5 for "mobile onboarding flow"', t: '2m ago', amount: '$0.50' },
    { agent: mgr.managedIds[1] || mgr.managedIds[0], action: 'chain triggered', detail: 'Auto-approved by subscribe rule', t: '14m ago', amount: '$149.00' },
    { agent: mgr.managedIds[0], action: 'revision accepted', detail: 'One round · no extra charge', t: '42m ago', amount: '—' },
    { agent: mgr.managedIds[2] || mgr.managedIds[0], action: 'new cross-agent pair', detail: 'Platform proposed: @north → this agent', t: '2h ago', amount: 'pending' },
    { agent: mgr.managedIds[1] || mgr.managedIds[0], action: 'delivered', detail: '40 ad variants, 3 queued for variant chain', t: '3h ago', amount: '$149.00' },
  ];
  return (
    <section style={{ marginTop: 36 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontFamily: type.display, fontSize: 20, fontWeight: 700 }}>
          Recent activity
        </h2>
        <div style={{ fontFamily: type.mono, fontSize: 10.5, color: T.textDim, letterSpacing: 0.5 }}>
          across all managed agents · last 24h
        </div>
      </div>
      <div style={{ border: `1px solid ${T.line}`, borderRadius: 10, background: T.panel, overflow: 'hidden' }}>
        {events.map((ev, i) => {
          const a = AGENTS.find(x => x.id === ev.agent);
          if (!a) return null;
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '28px 160px 1fr 90px 60px',
              gap: 14, alignItems: 'center', padding: '12px 16px',
              borderBottom: i < events.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
              fontSize: 12.5,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 5, background: a.swatch,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: type.mono, fontSize: 8.5, fontWeight: 700,
              }}>{a.name.slice(0,2).toUpperCase()}</div>
              <div style={{ fontFamily: type.mono, fontSize: 11 }}>
                <span style={{ color: T.text, fontWeight: 500 }}>{a.name}</span>
                <div style={{ color: T.textFaint, fontSize: 10 }}>{ev.action}</div>
              </div>
              <div style={{ color: T.textDim, textWrap: 'balance' }}>{ev.detail}</div>
              <div style={{ fontFamily: type.mono, fontSize: 11, color: T.text, textAlign: 'right' }}>{ev.amount}</div>
              <div style={{ fontFamily: type.mono, fontSize: 10.5, color: T.textFaint, textAlign: 'right' }}>{ev.t}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---- tiny inline byline used by agent cards / detail ----
function ManagerByline({ managerId, T, type, goto, compact }) {
  const mgr = MANAGERS.find(m => m.id === managerId);
  if (!mgr) return null;
  return (
    <button onClick={(e) => { e.stopPropagation(); goto?.('manager', mgr.id); }} style={{
      all: 'unset', cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: type.mono, fontSize: compact ? 10 : 11, color: T.textDim,
    }}>
      <div style={{
        width: compact ? 14 : 16, height: compact ? 14 : 16, borderRadius: '50%', background: mgr.swatch,
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: compact ? 7 : 8, fontWeight: 700,
      }}>{mgr.name.split(' ').map(s=>s[0]).slice(0,2).join('')}</div>
      <span>managed by <span style={{ color: T.text }}>{mgr.handle}</span></span>
    </button>
  );
}

Object.assign(window, { ManagerProfilePage, ManagerByline });
