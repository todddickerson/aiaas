// cards.jsx — 4 agent card variants for MarketingHire.ai

// ============= VARIANT A: EDITORIAL =============
// Magazine-style. Serif display, lots of air, quiet confidence.
function CardEditorial({ agent, T, type, density, showGame, onOpen }) {
  const pad = density === 'compact' ? 16 : 22;
  return (
    <button onClick={() => onOpen?.(agent)} style={{
      all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column', width: '100%',
      background: T.panel, border: `1px solid ${T.line}`, borderRadius: 4,
      padding: pad, position: 'relative', overflow: 'hidden', boxSizing: 'border-box',
      fontFamily: type.body, color: T.text, minHeight: 300,
      transition: 'transform .15s, border-color .15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = T.text; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = T.line; }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ fontFamily: type.mono, fontSize: 9.5, letterSpacing: 1.3, color: T.textDim, textTransform: 'uppercase' }}>
          № {String(Math.abs(agent.id.charCodeAt(0)*7 % 99)).padStart(2,'0')} · {agent.category}
        </div>
        {showGame && <TierChip tier={agent.tier} T={T}/>}
      </div>

      <div style={{ marginTop: density === 'compact' ? 10 : 14, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <h3 style={{
            margin: 0, fontFamily: type.display, fontWeight: 400,
            fontSize: density === 'compact' ? 24 : 30, lineHeight: 1.08, letterSpacing: -0.5,
            flex: 1, textWrap: 'balance',
          }}>
            {agent.name}
          </h3>
          {agent.verified && <span style={{ marginTop: 6, flexShrink: 0 }}><Verified color={T.accent} size={13}/></span>}
        </div>
      </div>
      <div style={{ fontFamily: type.display, fontStyle: 'italic', fontSize: 13.5, color: T.textDim, marginBottom: 12, lineHeight: 1.35 }}>
        {agent.persona}
      </div>

      {/* Manager byline — clickable */}
      {(() => {
        const mgr = (window.MANAGERS || []).find(m => m.id === agent.managerId);
        if (!mgr) return null;
        return (
          <div
            onClick={(e) => { e.stopPropagation(); window.__MH_GOTO?.('manager', mgr.id); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '2px 8px 2px 2px', borderRadius: 999,
              background: T.panelSoft, border: `1px solid ${T.lineSoft}`,
              fontFamily: type.mono, fontSize: 10, color: T.textDim,
              cursor: 'pointer', marginBottom: 12, alignSelf: 'flex-start',
            }}
          >
            <span style={{
              width: 14, height: 14, borderRadius: '50%', background: mgr.swatch, color: '#fff',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 7, fontWeight: 700,
            }}>{mgr.name.split(' ').map(s=>s[0]).slice(0,2).join('')}</span>
            by <span style={{ color: T.text, fontWeight: 500 }}>{mgr.handle}</span>
            {mgr.verified && <span style={{ color: T.accent, fontSize: 9 }}>✓</span>}
          </div>
        );
      })()}

      <p style={{ fontSize: 13, lineHeight: 1.5, color: T.text, margin: '0 0 14px 0', textWrap: 'pretty' }}>
        {agent.tagline}
      </p>

      {/* Sample work peek */}
      {typeof PortfolioPeek !== 'undefined' && PORTFOLIO[agent.id] && (
        <div style={{ marginBottom: 14 }}>
          <PortfolioPeek agent={agent} T={T} type={type} height={96}/>
          <div style={{ fontFamily: type.mono, fontSize: 9, letterSpacing: 0.8, color: T.textFaint, marginTop: 5, textTransform: 'uppercase' }}>
            Latest sample · judged by LLM
          </div>
        </div>
      )}

      {showGame && (
        <div style={{ display: 'flex', gap: 14, paddingTop: 12, borderTop: `1px solid ${T.lineSoft}`, marginBottom: 12, fontFamily: type.mono, fontSize: 11 }}>
          <div>
            <div style={{ color: T.textFaint, fontSize: 8.5, letterSpacing: 0.9, textTransform: 'uppercase' }}>Runs</div>
            <div style={{ fontSize: 13, color: T.text }}>{fmt(agent.runs)}</div>
          </div>
          <div>
            <div style={{ color: T.textFaint, fontSize: 8.5, letterSpacing: 0.9, textTransform: 'uppercase' }}>Rating</div>
            <div style={{ fontSize: 13, color: T.text }}>{agent.rating}<span style={{ color: T.textFaint }}> /5</span></div>
          </div>
          <div>
            <div style={{ color: T.textFaint, fontSize: 8.5, letterSpacing: 0.9, textTransform: 'uppercase' }}>SLA</div>
            <div style={{ fontSize: 13, color: T.text }}>{agent.sla}</div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 'auto' }}>
        <div style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <FollowupChip agent={agent} T={T} type={type}/>
          <RuntimeBadge agent={agent} T={T} type={type}/>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 }}>
          <div>
            <div style={{ fontFamily: type.mono, fontSize: 8.5, letterSpacing: 0.9, color: T.textFaint, textTransform: 'uppercase' }}>From</div>
            <div style={{ fontFamily: type.display, fontSize: 22, lineHeight: 1.1 }}>
              {price(agent.priceFrom)}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: type.mono, fontSize: 10.5, color: T.textDim, whiteSpace: 'nowrap' }}>
            <AvailabilityDot online={agent.online} size={7}/>
            {agent.online ? `${agent.queue} in queue` : 'offline'}
          </div>
        </div>
      </div>
    </button>
  );
}

// ============= VARIANT B: GAMIFIED =============
// Pac-Man energy. XP bars, streaks, tier medallion, neon accents.
function CardGamified({ agent, T, type, density, showGame, onOpen }) {
  const pad = density === 'compact' ? 14 : 18;
  const tier = TIERS[agent.tier];
  return (
    <button onClick={() => onOpen?.(agent)} style={{
      all: 'unset', cursor: 'pointer', display: 'block', width: '100%',
      background: T.panel, borderRadius: 16,
      padding: pad, position: 'relative', overflow: 'hidden',
      fontFamily: type.body, color: T.text,
      border: `2px solid ${T.line}`,
      transition: 'transform .15s, border-color .15s, box-shadow .15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = agent.swatch; e.currentTarget.style.boxShadow = `0 8px 0 ${agent.swatch}22, 0 0 0 4px ${agent.swatch}14`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = T.line; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>

      {/* Header band */}
      <div style={{
        background: `linear-gradient(135deg, ${agent.swatch}, ${agent.swatch}cc)`,
        margin: -pad, marginBottom: 14, padding: `${pad}px ${pad}px 18px`,
        color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        {/* halftone */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.15,
          backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '8px 8px' }}/>
        <div style={{ position: 'relative', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <AgentPortrait agent={agent} size={48} T={T}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: type.display, fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>
              {agent.name}
            </div>
            <div style={{ fontFamily: type.mono, fontSize: 10, opacity: 0.9, letterSpacing: 0.5 }}>
              {agent.handle}
            </div>
          </div>
          {showGame && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: type.display, fontSize: 20, fontWeight: 800, lineHeight: 1 }}>
                LVL {Math.floor(agent.runs / 100) % 99 + 1}
              </div>
              <div style={{ fontFamily: type.mono, fontSize: 9, opacity: 0.85, letterSpacing: 1 }}>
                {tier?.label?.toUpperCase()}
              </div>
            </div>
          )}
        </div>

        {showGame && (
          <div style={{ position: 'relative', marginTop: 12 }}>
            <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
              <div style={{
                width: `${((agent.runs % 1000) / 10).toFixed(0)}%`,
                height: '100%', background: '#fff',
                boxShadow: '0 0 8px rgba(255,255,255,0.8)',
              }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: type.mono, fontSize: 9, opacity: 0.85, marginTop: 4, letterSpacing: 0.5 }}>
              <span>XP · {fmt(agent.runs)} runs</span>
              <span>next tier: {Math.floor((1000 - agent.runs % 1000))} to go</span>
            </div>
          </div>
        )}
      </div>

      <p style={{ fontSize: 13.5, lineHeight: 1.45, color: T.text, margin: '0 0 14px 0' }}>
        {agent.tagline}
      </p>

      {showGame && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          <div style={{ padding: '8px 10px', background: T.panelSoft, borderRadius: 8, border: `1px solid ${T.lineSoft}` }}>
            <div style={{ fontSize: 9, color: T.textDim, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 600 }}>⚡ Streak</div>
            <div style={{ fontSize: 16, fontFamily: type.display, fontWeight: 700 }}>{agent.streak}d</div>
          </div>
          <div style={{ padding: '8px 10px', background: T.panelSoft, borderRadius: 8, border: `1px solid ${T.lineSoft}` }}>
            <div style={{ fontSize: 9, color: T.textDim, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 600 }}>★ Rating</div>
            <div style={{ fontSize: 16, fontFamily: type.display, fontWeight: 700 }}>{agent.rating}</div>
          </div>
          <div style={{ padding: '8px 10px', background: T.panelSoft, borderRadius: 8, border: `1px solid ${T.lineSoft}` }}>
            <div style={{ fontSize: 9, color: T.textDim, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 600 }}>✓ Win%</div>
            <div style={{ fontSize: 16, fontFamily: type.display, fontWeight: 700 }}>{agent.successRate}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: type.mono, fontSize: 11 }}>
          {agent.online ? <Pulse color="#22c55e" size={8}/> : <AvailabilityDot online={false} size={8}/>}
          <span style={{ color: T.textDim }}>{agent.online ? `queue ${agent.queue} · ${agent.etaMins}m` : 'offline'}</span>
        </div>
        <div style={{
          padding: '8px 14px', borderRadius: 999,
          background: agent.swatch, color: '#fff',
          fontFamily: type.display, fontWeight: 700, fontSize: 13,
          boxShadow: `0 4px 0 ${agent.swatch}88`,
        }}>
          Hire · from {price(agent.priceFrom)}
        </div>
      </div>
    </button>
  );
}

// ============= VARIANT C: SWISS / MINIMAL =============
// Grid-based. Strict, confident, no decoration.
function CardSwiss({ agent, T, type, density, showGame, onOpen }) {
  const pad = density === 'compact' ? 16 : 22;
  return (
    <button onClick={() => onOpen?.(agent)} style={{
      all: 'unset', cursor: 'pointer', display: 'block', width: '100%',
      background: T.panel, borderRadius: 0,
      padding: pad, position: 'relative', overflow: 'hidden',
      fontFamily: type.body, color: T.text,
      border: `1px solid ${T.line}`,
      transition: 'background .15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = T.panelSoft; }}
    onMouseLeave={e => { e.currentTarget.style.background = T.panel; }}>

      {/* 12-col grid header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 10, alignItems: 'start' }}>
        <div style={{ gridColumn: 'span 8' }}>
          <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: T.textDim, marginBottom: 4 }}>
            {String(Math.abs(agent.id.charCodeAt(0) * 11 % 999)).padStart(3,'0')} / {agent.category.toUpperCase()}
          </div>
          <div style={{ fontSize: density === 'compact' ? 22 : 28, fontWeight: 600, letterSpacing: -0.5, lineHeight: 1.05 }}>
            {agent.name}
          </div>
        </div>
        <div style={{ gridColumn: 'span 4', textAlign: 'right', fontFamily: type.mono, fontSize: 10, lineHeight: 1.6, color: T.textDim }}>
          <div>{agent.handle}</div>
          {showGame && <div style={{ color: T.text, marginTop: 4 }}>★ {agent.rating} · {fmt(agent.runs)}</div>}
        </div>
      </div>

      <div style={{ height: 1, background: T.line, margin: '14px 0' }}/>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 10 }}>
        <p style={{ gridColumn: 'span 8', margin: 0, fontSize: 13.5, lineHeight: 1.5, textWrap: 'pretty' }}>
          {agent.tagline}
        </p>
        <div style={{ gridColumn: 'span 4', fontFamily: type.mono, fontSize: 10, color: T.textDim, lineHeight: 1.6, textAlign: 'right' }}>
          <div>from {price(agent.priceFrom)}</div>
          <div>to {price(agent.priceMax)}</div>
          <div style={{ marginTop: 4, color: T.text }}>SLA {agent.sla}</div>
        </div>
      </div>

      {showGame && (
        <>
          <div style={{ height: 1, background: T.lineSoft, margin: '14px 0' }}/>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, fontFamily: type.mono, fontSize: 10 }}>
            {[
              ['QUEUE', agent.queue],
              ['ETA', `${agent.etaMins}m`],
              ['WIN%', agent.successRate.toFixed(1)],
              ['TIER', TIERS[agent.tier].label.toUpperCase()],
            ].map(([k,v]) => (
              <div key={k}>
                <div style={{ color: T.textFaint, fontSize: 9, letterSpacing: 1 }}>{k}</div>
                <div style={{ fontSize: 13, color: T.text, fontFamily: type.body, fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: type.mono, fontSize: 10.5, color: T.textDim }}>
          <AvailabilityDot online={agent.online} size={7}/>
          {agent.online ? 'available' : 'resting'}
        </div>
        <div style={{ fontFamily: type.body, fontSize: 12, color: T.text, borderBottom: `1px solid ${T.text}`, paddingBottom: 2 }}>
          Hire →
        </div>
      </div>
    </button>
  );
}

// ============= VARIANT D: TERMINAL / CYBER =============
// Monospaced, terminal-style, subtle glow. Agent-native.
function CardTerminal({ agent, T, type, density, showGame, onOpen }) {
  const pad = density === 'compact' ? 14 : 18;
  const dark = T.mode === 'dark';
  return (
    <button onClick={() => onOpen?.(agent)} style={{
      all: 'unset', cursor: 'pointer', display: 'block', width: '100%',
      background: dark ? '#0E0E13' : '#F8F6EE',
      borderRadius: 2, padding: pad, position: 'relative', overflow: 'hidden',
      fontFamily: type.mono, color: T.text, fontSize: 12,
      border: `1px solid ${T.line}`,
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02)',
      transition: 'border-color .15s, box-shadow .15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = agent.swatch; e.currentTarget.style.boxShadow = `0 0 0 1px ${agent.swatch}, 0 0 24px ${agent.swatch}22`; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = T.line; e.currentTarget.style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,0.02)'; }}>

      {/* scanline */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 24,
        background: `linear-gradient(90deg, ${agent.swatch}22, transparent 60%)`,
        borderBottom: `1px solid ${agent.swatch}44`,
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6,
        fontSize: 10, letterSpacing: 1.2, color: agent.swatch, fontWeight: 600 }}>
        <span style={{ width: 6, height: 6, background: agent.swatch, borderRadius: '50%' }}/>
        agent://{agent.handle.slice(1)}
        <span style={{ marginLeft: 'auto', color: T.textDim }}>
          {agent.online ? 'STATUS: ONLINE' : 'STATUS: IDLE'}
        </span>
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ color: T.textDim, fontSize: 10, letterSpacing: 1 }}>&gt; whoami</div>
        <div style={{ fontSize: density === 'compact' ? 18 : 22, color: T.text, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.1, margin: '4px 0 2px' }}>
          {agent.name.toLowerCase().replace(/\s+/g, '-')}
        </div>
        <div style={{ color: agent.swatch, fontSize: 11 }}>// {agent.persona}</div>
      </div>

      <div style={{ margin: '12px 0', padding: '10px 12px', background: dark ? '#060609' : '#EFECDF',
        borderLeft: `2px solid ${agent.swatch}`, fontSize: 11, lineHeight: 1.5, color: T.text }}>
        {agent.tagline}
      </div>

      {showGame && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 4, columnGap: 16, fontSize: 11, lineHeight: 1.6 }}>
          <div><span style={{ color: T.textDim }}>runs</span> <span style={{ float: 'right' }}>{fmt(agent.runs)}</span></div>
          <div><span style={{ color: T.textDim }}>queue</span> <span style={{ float: 'right' }}>{agent.queue}</span></div>
          <div><span style={{ color: T.textDim }}>rating</span> <span style={{ float: 'right' }}>{agent.rating}/5</span></div>
          <div><span style={{ color: T.textDim }}>sla</span> <span style={{ float: 'right' }}>{agent.sla}</span></div>
          <div><span style={{ color: T.textDim }}>tier</span> <span style={{ float: 'right', color: TIERS[agent.tier].fg }}>{TIERS[agent.tier].label.toUpperCase()}</span></div>
          <div><span style={{ color: T.textDim }}>streak</span> <span style={{ float: 'right' }}>{agent.streak}d</span></div>
        </div>
      )}

      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${T.line}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: T.textDim }}>
          &gt; price <span style={{ color: T.text }}>{price(agent.priceFrom)}..{price(agent.priceMax)}</span>
        </div>
        <div style={{
          fontSize: 11, color: agent.swatch, fontWeight: 700,
          letterSpacing: 1, padding: '4px 10px', border: `1px solid ${agent.swatch}`,
        }}>
          ./hire <span style={{ opacity: 0.5 }}>_</span>
        </div>
      </div>
    </button>
  );
}

// ============= variant picker =============
function AgentCard({ variant, ...props }) {
  if (variant === 'editorial') return <CardEditorial {...props}/>;
  if (variant === 'gamified')  return <CardGamified {...props}/>;
  if (variant === 'swiss')     return <CardSwiss {...props}/>;
  if (variant === 'terminal')  return <CardTerminal {...props}/>;
  return <CardEditorial {...props}/>;
}

Object.assign(window, { AgentCard, CardEditorial, CardGamified, CardSwiss, CardTerminal });
