// discover.jsx — new discoverability surfaces for AIaaS.com
// Pages: ManagerDirectory, ChainsPage, CollectionsPage, TrustSafetyPage, CategoryPage
// Also: UnifiedSearch (⌘K), cross-surface manager widgets

// ─────────────────────────────────────────────────────────────────────────────
// Shared atoms
// ─────────────────────────────────────────────────────────────────────────────

function PageHeader({ T, type, eyebrow, title, sub, right }) {
  return (
    <section style={{
      borderBottom: `1px solid ${T.line}`, background: T.panel,
    }}>
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '56px 32px 44px',
        display: 'grid', gridTemplateColumns: right ? '1.4fr 1fr' : '1fr', gap: 40, alignItems: 'end' }}>
        <div>
          <div style={{ fontFamily: type.mono, fontSize: 11, letterSpacing: 1.5, color: T.accent, fontWeight: 600, marginBottom: 16 }}>
            {eyebrow}
          </div>
          <h1 style={{
            margin: 0, fontFamily: type.display, fontWeight: 700,
            fontSize: 'clamp(36px, 4.8vw, 60px)', lineHeight: 1.25, letterSpacing: -1.2, textWrap: 'balance',
            paddingBottom: 12,
          }}>{title}</h1>
          <p style={{ marginTop: 24, marginBottom: 0, fontSize: 17, lineHeight: 1.5, color: T.textDim, maxWidth: 620, textWrap: 'pretty' }}>
            {sub}
          </p>
        </div>
        {right && <div>{right}</div>}
      </div>
    </section>
  );
}

function MgrAvatar({ mgr, size = 36, T }) {
  const init = mgr.name.split(' ').map(s => s[0]).slice(0, 2).join('');
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: mgr.swatch, color: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, fontFamily: 'inherit',
      flexShrink: 0,
      boxShadow: mgr.tier === 'celebrity' ? `0 0 0 2px ${T.panel}, 0 0 0 4px ${mgr.swatch}` : 'none',
    }}>{init}</div>
  );
}

function MiniBadge({ T, type, color, children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 7px', borderRadius: 999,
      background: color ? color + '22' : T.panelSoft,
      color: color || T.textDim,
      border: `1px solid ${color ? color + '55' : T.lineSoft}`,
      fontFamily: type.mono, fontSize: 9.5, letterSpacing: 0.3, fontWeight: 600, textTransform: 'uppercase',
    }}>{children}</span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIFIED SEARCH (⌘K) — Agents + Managers + Chains
// ─────────────────────────────────────────────────────────────────────────────

function UnifiedSearch({ T, type, open, onClose, goto, onOpenAgent }) {
  const [q, setQ] = React.useState('');
  const [tab, setTab] = React.useState('all');
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);
  React.useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  if (!open) return null;

  const query = q.trim().toLowerCase();
  const matches = {
    agents: (window.AGENTS || []).filter(a =>
      !query || a.name.toLowerCase().includes(query) || a.handle.toLowerCase().includes(query) ||
      a.persona.toLowerCase().includes(query) || a.tagline.toLowerCase().includes(query)
    ).slice(0, 8),
    managers: (window.MANAGERS || []).filter(m =>
      !query || m.name.toLowerCase().includes(query) || m.handle.toLowerCase().includes(query) ||
      m.title.toLowerCase().includes(query) || (m.vertical || []).some(v => v.toLowerCase().includes(query))
    ).slice(0, 8),
    chains: (window.CHAINS || []).filter(c =>
      !query || c.name.toLowerCase().includes(query) || c.tagline.toLowerCase().includes(query) ||
      c.byline.toLowerCase().includes(query)
    ).slice(0, 8),
  };

  const visible = tab === 'all'
    ? { agents: matches.agents.slice(0, 4), managers: matches.managers.slice(0, 4), chains: matches.chains.slice(0, 4) }
    : { agents: [], managers: [], chains: [], [tab]: matches[tab] };

  const totalCount = matches.agents.length + matches.managers.length + matches.chains.length;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2100, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '10vh 20px',
      animation: 'mh-fade .12s ease',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 720, background: T.panel, borderRadius: 14, border: `1px solid ${T.line}`,
        boxShadow: '0 30px 80px rgba(0,0,0,0.3)', overflow: 'hidden',
      }}>
        {/* input */}
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.lineSoft}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: T.textFaint, fontSize: 16 }}>⌕</span>
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search agents, managers, chains…"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 17, color: T.text, fontFamily: type.body,
            }}
          />
          <span style={{ fontFamily: type.mono, fontSize: 10, color: T.textFaint, letterSpacing: 0.8 }}>ESC</span>
        </div>

        {/* tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '10px 18px', borderBottom: `1px solid ${T.lineSoft}` }}>
          {[
            ['all', 'All', totalCount],
            ['agents', 'Agents', matches.agents.length],
            ['managers', 'Managers', matches.managers.length],
            ['chains', 'Chains', matches.chains.length],
          ].map(([k, l, n]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              all: 'unset', cursor: 'pointer',
              padding: '5px 11px', borderRadius: 6,
              background: tab === k ? T.text : 'transparent',
              color: tab === k ? T.panel : T.textDim,
              fontFamily: type.body, fontSize: 12, fontWeight: 500,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>{l} <span style={{ opacity: 0.7, fontSize: 10, fontFamily: type.mono }}>{n}</span></button>
          ))}
        </div>

        {/* results */}
        <div style={{ maxHeight: '52vh', overflow: 'auto' }}>
          {!query && (
            <div style={{ padding: '44px 24px', textAlign: 'center', color: T.textDim, fontSize: 13 }}>
              <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: T.textFaint, marginBottom: 16 }}>TRY</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['funnel', 'research', 'Russell', 'DTC launch', 'SOC 2', 'under $50'].map(s => (
                  <button key={s} onClick={() => setQ(s)} style={{
                    all: 'unset', cursor: 'pointer', padding: '5px 11px', borderRadius: 999,
                    background: T.panelSoft, border: `1px solid ${T.lineSoft}`,
                    fontFamily: type.mono, fontSize: 11, color: T.textDim,
                  }}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {query && totalCount === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: T.textDim, fontSize: 13 }}>
              No matches for <b style={{ color: T.text }}>"{q}"</b>
            </div>
          )}

          {visible.agents.length > 0 && (
            <SearchGroup T={T} type={type} label="AGENTS">
              {visible.agents.map(a => (
                <SearchRow key={a.id} T={T} type={type}
                  swatch={a.swatch} init={a.name.slice(0, 2).toUpperCase()}
                  title={a.name} sub={`${a.handle} · ${a.persona}`}
                  meta={`$${a.priceFrom}+`}
                  onClick={() => { onClose?.(); onOpenAgent?.(a); }}
                />
              ))}
            </SearchGroup>
          )}
          {visible.managers.length > 0 && (
            <SearchGroup T={T} type={type} label="MANAGERS">
              {visible.managers.map(m => (
                <SearchRow key={m.id} T={T} type={type}
                  swatch={m.swatch} init={m.name.split(' ').map(s=>s[0]).slice(0,2).join('')}
                  title={m.name} sub={`${m.handle} · ${m.title}`}
                  meta={`${m.managedIds.length} agent${m.managedIds.length===1?'':'s'}`}
                  verified={m.verified} tier={m.tier}
                  onClick={() => { onClose?.(); goto?.('manager', m.id); }}
                />
              ))}
            </SearchGroup>
          )}
          {visible.chains.length > 0 && (
            <SearchGroup T={T} type={type} label="CHAINS">
              {visible.chains.map(c => (
                <SearchRow key={c.id} T={T} type={type}
                  icon="↻"
                  swatch={T.accent}
                  title={c.name} sub={c.byline}
                  meta={`${c.steps.length} steps`}
                  onClick={() => { onClose?.(); goto?.('chain', c.id); }}
                />
              ))}
            </SearchGroup>
          )}
        </div>

        <div style={{ padding: '10px 18px', borderTop: `1px solid ${T.lineSoft}`, display: 'flex', justifyContent: 'space-between', fontFamily: type.mono, fontSize: 10, color: T.textFaint }}>
          <span>Agents · Managers · Chains</span>
          <span>↑↓ navigate · ↵ open · ESC close</span>
        </div>
      </div>
    </div>
  );
}

function SearchGroup({ T, type, label, children }) {
  return (
    <div>
      <div style={{ padding: '12px 18px 6px', fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.textFaint, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}
function SearchRow({ T, type, swatch, init, icon, title, sub, meta, verified, tier, onClick }) {
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: 'pointer', width: '100%', boxSizing: 'border-box',
      padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 12,
    }}
    onMouseEnter={e => e.currentTarget.style.background = T.panelSoft}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ width: 32, height: 32, borderRadius: icon ? 8 : '50%',
        background: swatch, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: icon ? 16 : 11, fontWeight: 700,
        flexShrink: 0,
      }}>{icon || init}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600, color: T.text }}>
          {title}
          {verified && <span style={{ color: T.accent, fontSize: 10 }}>✓</span>}
          {tier === 'celebrity' && <MiniBadge T={T} type={type} color="#D4AF37">★ Featured</MiniBadge>}
        </div>
        <div style={{ fontSize: 11.5, color: T.textDim, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
      </div>
      <div style={{ fontFamily: type.mono, fontSize: 11, color: T.textDim, flexShrink: 0 }}>{meta}</div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MANAGER DIRECTORY — editorial hero + filterable grid
// ─────────────────────────────────────────────────────────────────────────────

function ManagerDirectoryPage({ T, type, goto }) {
  const managers = window.MANAGERS || [];
  const [vertical, setVertical] = React.useState('all');
  const [avail, setAvail] = React.useState('all');
  const [tier, setTier] = React.useState('all');
  const [sort, setSort] = React.useState('rank');

  const allVerticals = Array.from(new Set(managers.flatMap(m => m.vertical || [])));

  const filtered = React.useMemo(() => {
    let list = [...managers];
    if (vertical !== 'all') list = list.filter(m => (m.vertical || []).includes(vertical));
    if (avail !== 'all') list = list.filter(m => m.availability === avail);
    if (tier !== 'all') list = list.filter(m => m.tier === tier);
    if (sort === 'rank') list.sort((a, b) => (a.rank || 999) - (b.rank || 999));
    if (sort === 'earnings') list.sort((a, b) => (b.stats?.earnings || 0) - (a.stats?.earnings || 0));
    if (sort === 'runs') list.sort((a, b) => (b.stats?.runs || 0) - (a.stats?.runs || 0));
    if (sort === 'new') list.sort((a, b) => new Date('01 '+b.joined) - new Date('01 '+a.joined));
    return list;
  }, [vertical, avail, tier, sort, managers]);

  const celebrity = managers.filter(m => m.tier === 'celebrity').sort((a, b) => (a.rank||999) - (b.rank||999));
  const featured = filtered[0];

  return (
    <>
      <PageHeader
        T={T} type={type}
        eyebrow="── THE HUMANS BEHIND THE AGENTS"
        title={<>The operators.<br/><span style={{ fontStyle: type.name === 'Editorial' ? 'italic' : 'normal', fontWeight: type.name === 'Editorial' ? 400 : 700, color: T.accent }}>Taste, liability, continuity.</span></>}
        sub="Every agent has a human accountable for it. Some run one carefully-tuned agent. Some run a portfolio. This is where you browse them — by vertical, by taste, by track record."
        right={<DirStatCard T={T} type={type} managers={managers}/>}
      />

      {/* Celebrity strip */}
      {celebrity.length > 0 && (
        <section style={{ background: T.bgSub, borderBottom: `1px solid ${T.line}` }}>
          <div style={{ maxWidth: 1360, margin: '0 auto', padding: '28px 32px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.5, color: '#D4AF37', fontWeight: 600, marginBottom: 4 }}>
                  ★ FEATURED · CELEBRITY OPERATORS
                </div>
                <h3 style={{ margin: 0, fontFamily: type.display, fontSize: 26, fontWeight: 700, letterSpacing: -0.4 }}>Operators with the platform named after them</h3>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${celebrity.length}, 1fr)`, gap: 16 }}>
              {celebrity.map(m => <CelebrityCard key={m.id} mgr={m} T={T} type={type} goto={goto}/>)}
            </div>
          </div>
        </section>
      )}

      {/* Filters */}
      <div style={{ borderBottom: `1px solid ${T.line}`, background: T.panel, position: 'sticky', top: 58, zIndex: 30 }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '14px 32px',
          display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <FilterGroup label="VERTICAL" value={vertical} setValue={setVertical} T={T} type={type}
            options={[{ k: 'all', l: 'All' }, ...allVerticals.map(v => ({ k: v, l: v }))]}/>
          <FilterGroup label="STATUS" value={avail} setValue={setAvail} T={T} type={type}
            options={[
              { k: 'all', l: 'All' },
              { k: 'accepting_commissions', l: 'Taking briefs' },
              { k: 'selective', l: 'Selective' },
              { k: 'closed', l: 'Closed' },
            ]}/>
          <FilterGroup label="TIER" value={tier} setValue={setTier} T={T} type={type}
            options={[
              { k: 'all', l: 'All' },
              { k: 'celebrity', l: 'Featured' },
              { k: 'operator', l: 'Operators' },
            ]}/>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: T.textFaint }}>SORT</span>
            {[
              ['rank', 'Leaderboard'],
              ['earnings', 'Earnings'],
              ['runs', 'Volume'],
              ['new', 'New'],
            ].map(([k, l]) => (
              <button key={k} onClick={() => setSort(k)} style={{
                all: 'unset', cursor: 'pointer',
                padding: '3px 0', fontSize: 12,
                color: sort === k ? T.text : T.textDim,
                borderBottom: sort === k ? `1px solid ${T.text}` : '1px solid transparent',
                fontFamily: type.body,
              }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '28px 32px 64px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 80, textAlign: 'center', color: T.textDim }}>No operators match those filters.</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}>
            {filtered.map(m => <ManagerCard key={m.id} mgr={m} T={T} type={type} goto={goto}/>)}
          </div>
        )}
      </section>

      {/* Commission CTA */}
      <section style={{ borderTop: `1px solid ${T.line}`, background: T.bgSub }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '48px 32px',
          display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 40, alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: type.mono, fontSize: 11, letterSpacing: 1.5, color: T.accent, fontWeight: 600, marginBottom: 12 }}>
              ── LOOKING FOR SOMETHING CUSTOM?
            </div>
            <h2 style={{ margin: 0, fontFamily: type.display, fontSize: 36, fontWeight: 700, letterSpacing: -0.6 }}>
              Commission an agent from any operator taking briefs.
            </h2>
            <p style={{ marginTop: 14, fontSize: 15, lineHeight: 1.55, color: T.textDim, maxWidth: 520, textWrap: 'pretty' }}>
              Post a brief, set a bounty, and verified operators can respond with a custom-built agent. You own the output, they own the IP on the agent. Backed by AIaaS escrow.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <button style={{
              padding: '14px 22px', background: T.text, color: T.panel, border: 'none',
              borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: type.body,
            }}>Post a brief →</button>
          </div>
        </div>
      </section>
    </>
  );
}

function DirStatCard({ T, type, managers }) {
  const total = managers.length;
  const verified = managers.filter(m => m.verified).length;
  const open = managers.filter(m => m.availability === 'accepting_commissions').length;
  return (
    <div style={{ padding: 20, border: `1px solid ${T.line}`, borderRadius: 12, background: T.panelSoft }}>
      <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.textFaint, marginBottom: 10 }}>DIRECTORY · {total} OPERATORS</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Stat T={T} type={type} n={verified} l="verified KYC"/>
        <Stat T={T} type={type} n={open} l="taking briefs"/>
        <Stat T={T} type={type} n="14" l="verticals"/>
        <Stat T={T} type={type} n={managers.reduce((s,m) => s + (m.stats?.runs || 0), 0).toLocaleString()} l="runs served"/>
      </div>
    </div>
  );
}
function Stat({ T, type, n, l }) {
  return (
    <div>
      <div style={{ fontFamily: type.display, fontSize: 22, fontWeight: 700, color: T.text, lineHeight: 1 }}>{n}</div>
      <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 0.5, color: T.textDim, textTransform: 'uppercase', marginTop: 4 }}>{l}</div>
    </div>
  );
}
function FilterGroup({ label, value, setValue, options, T, type }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: T.textFaint }}>{label}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {options.map(o => (
          <button key={o.k} onClick={() => setValue(o.k)} style={{
            all: 'unset', cursor: 'pointer',
            padding: '5px 10px', borderRadius: 6,
            background: value === o.k ? T.text : 'transparent',
            color: value === o.k ? T.panel : T.textDim,
            fontSize: 12, fontFamily: type.body, fontWeight: value === o.k ? 500 : 400,
          }}>{o.l}</button>
        ))}
      </div>
    </div>
  );
}

function CelebrityCard({ mgr, T, type, goto }) {
  return (
    <div onClick={() => goto?.('manager', mgr.id)} style={{
      position: 'relative', cursor: 'pointer',
      padding: 24, borderRadius: 14, overflow: 'hidden',
      background: `linear-gradient(135deg, ${mgr.swatch}, ${mgr.swatch}cc)`,
      color: '#fff', minHeight: 220,
    }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.08,
        backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '14px 14px' }}/>
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <MgrAvatar mgr={mgr} size={52} T={T}/>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: type.display, fontSize: 22, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.15 }}>{mgr.name}</div>
            <div style={{ fontFamily: type.mono, fontSize: 11, opacity: 0.9, marginTop: 4 }}>{mgr.handle} · #{mgr.rank} · {mgr.percentile}</div>
          </div>
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.45, opacity: 0.95, marginBottom: 14, textWrap: 'pretty' }}>{mgr.title}</div>
        <div style={{ display: 'flex', gap: 20, fontFamily: type.mono, fontSize: 11, marginBottom: 12 }}>
          <div><b style={{ fontSize: 15, fontFamily: type.display }}>{mgr.managedIds.length}</b> agents</div>
          <div><b style={{ fontSize: 15, fontFamily: type.display }}>{(mgr.stats?.runs || 0).toLocaleString()}</b> runs</div>
          <div><b style={{ fontSize: 15, fontFamily: type.display }}>${(mgr.stats?.earnings || 0).toLocaleString()}</b> earned</div>
        </div>
        <div style={{ padding: '6px 10px', display: 'inline-block', background: 'rgba(0,0,0,0.2)', borderRadius: 6, fontFamily: type.mono, fontSize: 10, letterSpacing: 0.5 }}>
          {(mgr.vertical || []).slice(0, 3).join(' · ')}
        </div>
      </div>
    </div>
  );
}

function ManagerCard({ mgr, T, type, goto }) {
  const availColors = {
    accepting_commissions: '#1C8C5E',
    selective: '#C98B20',
    closed: T.textFaint,
  };
  const availLabel = {
    accepting_commissions: 'Taking briefs',
    selective: 'Selective',
    closed: 'Closed',
  };
  return (
    <button onClick={() => goto?.('manager', mgr.id)} style={{
      all: 'unset', cursor: 'pointer', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column',
      padding: 18, borderRadius: 12, background: T.panel,
      border: `1px solid ${T.line}`,
      transition: 'transform .15s, border-color .15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = T.text; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = T.line; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <MgrAvatar mgr={mgr} size={44} T={T}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: 1 }}>{mgr.name}</div>
            {mgr.verified && <span style={{ color: T.accent, fontSize: 10, flexShrink: 0 }}>✓</span>}
          </div>
          <div style={{ fontFamily: type.mono, fontSize: 11, color: T.textDim, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mgr.handle} · #{mgr.rank || '—'}</div>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 7px', borderRadius: 999,
          background: availColors[mgr.availability] + '22',
          color: availColors[mgr.availability],
          fontFamily: type.mono, fontSize: 9.5, letterSpacing: 0.3, fontWeight: 600,
          whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'flex-start',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: availColors[mgr.availability] }}/>
          {availLabel[mgr.availability]}
        </span>
      </div>

      <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.45, marginBottom: 12, minHeight: 36, textWrap: 'pretty' }}>
        {mgr.title}
      </div>

      {/* Verticals */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {(mgr.vertical || []).slice(0, 3).map(v => (
          <span key={v} style={{
            padding: '2px 7px', borderRadius: 999, background: T.panelSoft,
            fontFamily: type.mono, fontSize: 10, color: T.textDim, letterSpacing: 0.2,
          }}>{v}</span>
        ))}
      </div>

      {/* Agents strip */}
      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: `1px solid ${T.lineSoft}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex' }}>
          {mgr.managedIds.slice(0, 4).map((id, i) => {
            const a = (window.AGENTS || []).find(x => x.id === id);
            if (!a) return null;
            return (
              <div key={id} style={{
                width: 22, height: 22, borderRadius: '50%', background: a.swatch, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, fontWeight: 700,
                border: `2px solid ${T.panel}`,
                marginLeft: i > 0 ? -6 : 0,
              }}>{a.name.slice(0, 2).toUpperCase()}</div>
            );
          })}
        </div>
        <div style={{ fontFamily: type.mono, fontSize: 11, color: T.textDim }}>
          {mgr.managedIds.length} agent{mgr.managedIds.length === 1 ? '' : 's'}
          {mgr.managedIds.length > 0 && <> · <b style={{ color: T.text }}>{(mgr.stats?.runs || 0).toLocaleString()}</b> runs</>}
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAINS / PLAYBOOKS
// ─────────────────────────────────────────────────────────────────────────────

function ChainsPage({ T, type, goto, onOpenAgent }) {
  const chains = window.CHAINS || [];
  const [vertical, setVertical] = React.useState('all');
  const verticals = Array.from(new Set(chains.map(c => c.vertical)));
  const filtered = vertical === 'all' ? chains : chains.filter(c => c.vertical === vertical);

  const hero = chains[0];

  return (
    <>
      <PageHeader
        T={T} type={type}
        eyebrow="── CHAINS · MULTI-AGENT PLAYBOOKS"
        title={<>One brief.<br/><span style={{ fontStyle: type.name === 'Editorial' ? 'italic' : 'normal', fontWeight: type.name === 'Editorial' ? 400 : 700, color: T.accent }}>A pipeline of agents.</span></>}
        sub="Chains compose multiple agents into a single delivery. Each step hands its output to the next — research feeds copy, copy feeds ads, ads feed video. Popular chains here were built and proven by named operators."
      />

      {hero && (
        <section style={{ maxWidth: 1360, margin: '0 auto', padding: '28px 32px 20px' }}>
          <ChainHero chain={hero} T={T} type={type} goto={goto} onOpenAgent={onOpenAgent}/>
        </section>
      )}

      <div style={{ borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`, background: T.panel }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '14px 32px', display: 'flex', gap: 18, alignItems: 'center' }}>
          <FilterGroup label="VERTICAL" value={vertical} setValue={setVertical} T={T} type={type}
            options={[{ k: 'all', l: 'All' }, ...verticals.map(v => ({ k: v, l: v }))]}/>
          <div style={{ marginLeft: 'auto', fontFamily: type.mono, fontSize: 11, color: T.textDim }}>
            {filtered.length} chain{filtered.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 32px 64px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 18 }}>
        {filtered.map(c => <ChainCard key={c.id} chain={c} T={T} type={type} goto={goto} onOpenAgent={onOpenAgent}/>)}
      </section>

      {/* Build-your-own */}
      <section style={{ borderTop: `1px solid ${T.line}`, background: T.bgSub }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '48px 32px',
          display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 40, alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: type.mono, fontSize: 11, letterSpacing: 1.5, color: T.accent, fontWeight: 600, marginBottom: 12 }}>
              ── BUILD YOUR OWN
            </div>
            <h2 style={{ margin: 0, fontFamily: type.display, fontSize: 34, fontWeight: 700, letterSpacing: -0.6 }}>
              Chain any two agents. Publish it. Earn a cut on every run.
            </h2>
            <p style={{ marginTop: 14, fontSize: 15, lineHeight: 1.55, color: T.textDim, maxWidth: 560, textWrap: 'pretty' }}>
              Chains are first-class objects. Name them, share them, sell them. When someone runs your chain, you earn 5% of the bundled fee as the curator.
            </p>
            <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
              <button onClick={() => goto?.('developers')} style={{
                padding: '12px 18px', background: T.text, color: T.panel, border: 'none',
                borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: type.body,
              }}>Chain builder docs →</button>
              <button style={{
                padding: '12px 18px', background: 'transparent', color: T.text, border: `1px solid ${T.line}`,
                borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: type.body,
              }}>Open in CLI</button>
            </div>
          </div>
          <pre style={{
            margin: 0, padding: 18, background: T.text, color: T.panel,
            borderRadius: 10, fontFamily: type.mono, fontSize: 12, lineHeight: 1.6, overflowX: 'auto',
          }}>{`$ aiaas chain new dtc-launch

  → @helios    (research)
  → @aperture  (ads)
  → @funnelsmith (funnel)
  → @reel-rat  (clips)

  bundle_price: auto
  curator_cut: 5%
  > published. earn on every run.`}</pre>
        </div>
      </section>
    </>
  );
}

function ChainHero({ chain, T, type, goto, onOpenAgent }) {
  const author = (window.MANAGERS || []).find(m => m.id === chain.author);
  return (
    <div style={{
      position: 'relative', padding: 0, borderRadius: 14, overflow: 'hidden',
      background: `linear-gradient(135deg, ${T.accent}, ${T.accent}aa)`,
      color: '#fff', display: 'grid', gridTemplateColumns: '1.3fr 1fr', minHeight: 260,
    }}>
      <div style={{ padding: '28px 32px 32px', position: 'relative' }}>
        <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.5, opacity: 0.9, fontWeight: 600, marginBottom: 10 }}>
          ★ MOST-RUN CHAIN THIS WEEK
        </div>
        <h2 style={{ margin: 0, fontFamily: type.display, fontSize: 44, fontWeight: 700, letterSpacing: -1, lineHeight: 1 }}>
          {chain.name}
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.5, maxWidth: 480, margin: '14px 0 18px', opacity: 0.95, textWrap: 'pretty' }}>
          {chain.tagline}
        </p>
        <div style={{ display: 'flex', gap: 18, fontFamily: type.mono, fontSize: 11, marginBottom: 20 }}>
          <div><b style={{ fontSize: 18, fontFamily: type.display }}>{chain.runs.toLocaleString()}</b> runs</div>
          <div><b style={{ fontSize: 18, fontFamily: type.display }}>★ {chain.stars}</b></div>
          <div><b style={{ fontSize: 18, fontFamily: type.display }}>{chain.sla}</b> total</div>
          <div><b style={{ fontSize: 18, fontFamily: type.display }}>${chain.priceFrom}</b>+</div>
        </div>
        {author && (
          <div onClick={(e) => { e.stopPropagation(); goto?.('manager', author.id); }} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            padding: '6px 10px 6px 6px', borderRadius: 999, background: 'rgba(0,0,0,0.2)',
            marginBottom: 16,
          }}>
            <MgrAvatar mgr={author} size={22} T={T}/>
            <span style={{ fontFamily: type.mono, fontSize: 11 }}>curated by <b>{author.handle}</b></span>
          </div>
        )}
        <div>
          <button style={{
            padding: '12px 22px', background: '#fff', color: T.accent, border: 'none',
            borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: type.body,
          }}>Run this chain — from ${chain.priceFrom} →</button>
        </div>
      </div>
      <div style={{ padding: 24, display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '100%', background: 'rgba(0,0,0,0.2)', padding: 18, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, opacity: 0.9, marginBottom: 12 }}>PIPELINE · {chain.steps.length} STEPS</div>
          {chain.steps.map((s, i) => {
            const a = (window.AGENTS || []).find(x => x.id === s.agent);
            if (!a) return null;
            return (
              <div key={s.agent}>
                <div onClick={(e) => { e.stopPropagation(); onOpenAgent?.(a); }} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer',
                }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: a.swatch, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700,
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}>{a.name.slice(0, 2).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{a.name}</div>
                    <div style={{ fontFamily: type.mono, fontSize: 10, opacity: 0.8 }}>{s.role}</div>
                  </div>
                  <div style={{ fontFamily: type.mono, fontSize: 10, opacity: 0.9 }}>${s.price}</div>
                </div>
                {i < chain.steps.length - 1 && (
                  <div style={{ marginLeft: 11, width: 1, height: 10, background: 'rgba(255,255,255,0.35)' }}/>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ChainCard({ chain, T, type, goto, onOpenAgent }) {
  const author = (window.MANAGERS || []).find(m => m.id === chain.author);
  return (
    <div style={{
      padding: 18, borderRadius: 12, background: T.panel, border: `1px solid ${T.line}`,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
          <div style={{ fontFamily: type.display, fontSize: 20, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.2, flex: 1 }}>{chain.name}</div>
          <span style={{
            padding: '2px 7px', borderRadius: 999, background: T.panelSoft,
            fontFamily: type.mono, fontSize: 9.5, color: T.textDim, letterSpacing: 0.3, fontWeight: 600, textTransform: 'uppercase',
            whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'flex-start', marginTop: 4,
          }}>{chain.vertical}</span>
        </div>
        <div style={{ fontFamily: type.mono, fontSize: 11, color: T.textDim }}>{chain.byline}</div>
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.45, color: T.text, textWrap: 'pretty' }}>{chain.tagline}</div>

      {/* pipeline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 12px', background: T.panelSoft, borderRadius: 8, flexWrap: 'wrap' }}>
        {chain.steps.map((s, i) => {
          const a = (window.AGENTS || []).find(x => x.id === s.agent);
          if (!a) return null;
          return (
            <React.Fragment key={s.agent}>
              <button onClick={() => onOpenAgent?.(a)} style={{
                all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 8px 3px 3px', borderRadius: 999, background: T.panel, border: `1px solid ${T.lineSoft}`,
              }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: a.swatch, color: '#fff',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 7, fontWeight: 700, flexShrink: 0 }}>{a.name.slice(0, 2).toUpperCase()}</div>
                <span style={{ fontSize: 11, color: T.text, fontWeight: 500, whiteSpace: 'nowrap' }}>{a.name}</span>
              </button>
              {i < chain.steps.length - 1 && <span style={{ color: T.textFaint, fontSize: 11 }}>→</span>}
            </React.Fragment>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: type.mono, fontSize: 11, color: T.textDim, paddingTop: 4 }}>
        <div>{chain.runs.toLocaleString()} runs · ★ {chain.stars} · {chain.sla}</div>
        <div style={{ color: T.text, fontWeight: 600 }}>from ${chain.priceFrom}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${T.lineSoft}` }}>
        {author && (
          <div onClick={() => goto?.('manager', author.id)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          }}>
            <MgrAvatar mgr={author} size={20} T={T}/>
            <span style={{ fontFamily: type.mono, fontSize: 11, color: T.textDim }}>by {author.handle}</span>
          </div>
        )}
        <button style={{
          padding: '8px 14px', background: T.text, color: T.panel, border: 'none',
          borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: type.body,
        }}>Run chain →</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTIONS
// ─────────────────────────────────────────────────────────────────────────────

function CollectionsPage({ T, type, goto, onOpenAgent }) {
  const collections = window.COLLECTIONS || [];
  const featured = collections.filter(c => c.featured);
  const rest = collections.filter(c => !c.featured);

  return (
    <>
      <PageHeader
        T={T} type={type}
        eyebrow="── COLLECTIONS · EDITORIAL PICKS"
        title={<>Curated shelves.<br/><span style={{ fontStyle: type.name === 'Editorial' ? 'italic' : 'normal', fontWeight: type.name === 'Editorial' ? 400 : 700, color: T.accent }}>Someone's taste, someone's name.</span></>}
        sub="Collections are opinionated. Staff picks, operator picks, 'what I'd hire tomorrow' lists. Every collection has a named curator — their reputation is on the line."
      />

      {featured.length > 0 && (
        <section style={{ maxWidth: 1360, margin: '0 auto', padding: '32px 32px 20px',
          display: 'grid', gridTemplateColumns: `repeat(${Math.min(featured.length, 2)}, 1fr)`, gap: 20 }}>
          {featured.map(c => <CollectionHero key={c.id} coll={c} T={T} type={type} goto={goto} onOpenAgent={onOpenAgent}/>)}
        </section>
      )}

      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 32px 64px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {rest.map(c => <CollectionCard key={c.id} coll={c} T={T} type={type} goto={goto} onOpenAgent={onOpenAgent}/>)}
      </section>

      <section style={{ borderTop: `1px solid ${T.line}`, background: T.bgSub }}>
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ fontFamily: type.mono, fontSize: 11, letterSpacing: 1.5, color: T.textDim, marginBottom: 10 }}>── BUILDING YOUR OWN SHELF</div>
          <h3 style={{ margin: 0, fontFamily: type.display, fontSize: 28, fontWeight: 700, letterSpacing: -0.4 }}>
            Verified operators can publish collections.
          </h3>
          <p style={{ marginTop: 10, fontSize: 14, color: T.textDim, maxWidth: 520, margin: '10px auto 0', textWrap: 'pretty' }}>
            Your name goes on it. Your reputation tracks with how those agents perform. Good collections get amplified; stale ones fade.
          </p>
        </div>
      </section>
    </>
  );
}

function CollectionHero({ coll, T, type, goto, onOpenAgent }) {
  const curator = coll.curatorId && (window.MANAGERS || []).find(m => m.id === coll.curatorId);
  return (
    <div style={{
      padding: 28, borderRadius: 14, overflow: 'hidden',
      background: `linear-gradient(135deg, ${coll.swatch}, ${coll.swatch}bb)`,
      color: '#fff', display: 'flex', flexDirection: 'column', gap: 18,
    }}>
      <div>
        <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.5, opacity: 0.9, fontWeight: 600, marginBottom: 10 }}>
          ★ FEATURED COLLECTION
        </div>
        <h2 style={{ margin: 0, fontFamily: type.display, fontSize: 32, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.2, paddingBottom: 6 }}>
          {coll.name}
        </h2>
        <p style={{ fontSize: 14.5, lineHeight: 1.5, margin: '12px 0 0', maxWidth: 500, opacity: 0.95, textWrap: 'pretty' }}>{coll.tagline}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
        {coll.agentIds.map(id => {
          const a = (window.AGENTS || []).find(x => x.id === id);
          if (!a) return null;
          return (
            <button key={id} onClick={() => onOpenAgent?.(a)} style={{
              all: 'unset', cursor: 'pointer', padding: 10, borderRadius: 8,
              background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: a.swatch, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, fontWeight: 700, border: '1px solid rgba(255,255,255,0.3)' }}>{a.name.slice(0, 2).toUpperCase()}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                <div style={{ fontFamily: type.mono, fontSize: 9.5, opacity: 0.85 }}>${a.priceFrom}+</div>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
        {curator ? (
          <div onClick={() => goto?.('manager', curator.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <MgrAvatar mgr={curator} size={26} T={T}/>
            <div style={{ fontFamily: type.mono, fontSize: 11 }}>curated by <b>{curator.handle}</b></div>
          </div>
        ) : (
          <div style={{ fontFamily: type.mono, fontSize: 11, opacity: 0.9 }}>curated by <b>AIaaS staff</b></div>
        )}
        <div style={{ fontFamily: type.mono, fontSize: 11, opacity: 0.9 }}>{coll.agentIds.length} agents</div>
      </div>
    </div>
  );
}

function CollectionCard({ coll, T, type, goto, onOpenAgent }) {
  const curator = coll.curatorId && (window.MANAGERS || []).find(m => m.id === coll.curatorId);
  return (
    <div style={{ padding: 18, borderRadius: 12, background: T.panel, border: `1px solid ${T.line}`,
      display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 40, background: coll.swatch, borderRadius: 2 }}/>
        <div>
          <div style={{ fontFamily: type.display, fontSize: 18, fontWeight: 700, letterSpacing: -0.2 }}>{coll.name}</div>
          <div style={{ fontFamily: type.mono, fontSize: 11, color: T.textDim }}>by {coll.curator}</div>
        </div>
      </div>
      <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.45, textWrap: 'pretty' }}>{coll.tagline}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {coll.agentIds.slice(0, 5).map(id => {
          const a = (window.AGENTS || []).find(x => x.id === id);
          if (!a) return null;
          return (
            <button key={id} onClick={() => onOpenAgent?.(a)} style={{
              all: 'unset', cursor: 'pointer', padding: '6px 0',
              display: 'flex', alignItems: 'center', gap: 10,
              borderBottom: `1px solid ${T.lineSoft}`,
            }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: a.swatch, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 7, fontWeight: 700 }}>{a.name.slice(0, 2).toUpperCase()}</div>
              <span style={{ fontSize: 13, fontWeight: 500, color: T.text, flex: 1 }}>{a.name}</span>
              <span style={{ fontFamily: type.mono, fontSize: 11, color: T.textDim }}>${a.priceFrom}+</span>
            </button>
          );
        })}
      </div>

      {curator && (
        <div onClick={() => goto?.('manager', curator.id)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          paddingTop: 8, borderTop: `1px solid ${T.lineSoft}`,
        }}>
          <MgrAvatar mgr={curator} size={18} T={T}/>
          <span style={{ fontFamily: type.mono, fontSize: 11, color: T.textDim }}>see {curator.handle}'s profile →</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRUST & SAFETY
// ─────────────────────────────────────────────────────────────────────────────

function TrustSafetyPage({ T, type, goto }) {
  const tiers = [
    {
      key: 'self', color: '#C98B20', label: 'SELF',
      title: 'Self-declared',
      tagline: 'The agent said so. We show it, we haven\'t verified it.',
      examples: [
        'Infra region (agent-declared)',
        'Training data policy',
        'Retention window',
        'Model(s) used',
      ],
      treatment: 'Amber badge · source pointer shown · never sold as "verified"',
    },
    {
      key: 'platform', color: '#1C8C5E', label: 'PLATFORM',
      title: 'Platform-verified',
      tagline: 'AIaaS checked it at our boundary. Passive or active.',
      examples: [
        'KYC identity (ID + selfie + liveness)',
        'Webhook latency (P50/P95 measured)',
        'Refund rate (from payment logs)',
        'Hire-again % (from execution logs)',
        'PII redaction (runtime proxy check)',
      ],
      treatment: 'Green badge · measured continuously · auto-downgrades if signal breaks',
    },
    {
      key: '3p', color: '#1F3A5F', label: '3P-ATTESTED',
      title: 'Third-party attested',
      tagline: 'Named auditor signed a report. We link the real document.',
      examples: [
        'SOC 2 Type I / II (Vanta / Drata / Secureframe)',
        'ISO 27001',
        'HIPAA attestation',
        'Pen-test reports',
        'Subprocessor list (CPA-audited)',
      ],
      treatment: 'Blue badge · report URL + expiry date · auto-amber if expired',
    },
  ];

  return (
    <>
      <PageHeader
        T={T} type={type}
        eyebrow="── TRUST LADDER · HOW TO READ OUR BADGES"
        title={<>Not every <span style={{ fontStyle: type.name === 'Editorial' ? 'italic' : 'normal', fontWeight: type.name === 'Editorial' ? 400 : 700, color: T.accent }}>✓</span> is the same.</>}
        sub="We use a three-tier badge system across every agent and manager. Same colors, same order, everywhere. Here's what each means — and what to actually trust."
      />

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 32px 48px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {tiers.map((t, i) => (
            <div key={t.key} style={{
              padding: 24, borderRadius: 12, background: T.panel, border: `1px solid ${T.line}`,
              display: 'grid', gridTemplateColumns: '280px 1fr', gap: 28,
            }}>
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '6px 12px', borderRadius: 999,
                  background: t.color + '22', color: t.color,
                  border: `1px solid ${t.color}55`,
                  fontFamily: type.mono, fontSize: 11, letterSpacing: 0.5, fontWeight: 700,
                  marginBottom: 14,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color }}/>
                  TIER {i + 1} · {t.label}
                </div>
                <div style={{ fontFamily: type.display, fontSize: 28, fontWeight: 700, letterSpacing: -0.5, marginBottom: 6 }}>
                  {t.title}
                </div>
                <div style={{ fontSize: 14, color: T.textDim, lineHeight: 1.5, textWrap: 'pretty' }}>{t.tagline}</div>
              </div>
              <div>
                <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.textFaint, fontWeight: 600, marginBottom: 10 }}>EXAMPLES</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {t.examples.map(e => (
                    <li key={e} style={{ fontSize: 13.5, color: T.text, paddingLeft: 14, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: t.color }}>·</span>
                      {e}
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: 16, padding: '10px 14px', background: T.panelSoft, borderRadius: 8, fontSize: 12.5, color: T.textDim, lineHeight: 1.5, borderLeft: `3px solid ${t.color}` }}>
                  <b style={{ color: T.text }}>Visual treatment:</b> {t.treatment}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32, padding: 24, borderRadius: 12, background: T.bgSub, border: `1px solid ${T.line}` }}>
          <div style={{ fontFamily: type.mono, fontSize: 11, letterSpacing: 1, color: T.textDim, marginBottom: 6 }}>WHAT HAPPENS WHEN A CLAIM FAILS</div>
          <div style={{ fontSize: 14.5, lineHeight: 1.6, color: T.text, maxWidth: 680, textWrap: 'pretty' }}>
            Badges are not permanent. A SOC 2 that expires auto-reverts to amber. A KYC we can't re-verify within 90 days drops off. A refund rate that crosses 8% changes the credibility panel from green to amber. Buyers see the downgrade — we don't hide it.
          </div>
        </div>

        <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ padding: 18, borderRadius: 10, background: T.panel, border: `1px solid ${T.line}` }}>
            <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: T.textFaint, marginBottom: 8 }}>FOR BUYERS</div>
            <div style={{ fontSize: 14, color: T.text, lineHeight: 1.55, textWrap: 'pretty' }}>Look for <b style={{ color: '#1F3A5F' }}>blue</b> when the work is load-bearing (compliance, PII, regulated industries). <b style={{ color: '#1C8C5E' }}>Green</b> is safe for most commercial work. <b style={{ color: '#C98B20' }}>Amber</b> is fine for low-stakes tasks and experiments.</div>
          </div>
          <div style={{ padding: 18, borderRadius: 10, background: T.panel, border: `1px solid ${T.line}` }}>
            <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: T.textFaint, marginBottom: 8 }}>FOR OPERATORS</div>
            <div style={{ fontSize: 14, color: T.text, lineHeight: 1.55, textWrap: 'pretty' }}>Every badge you earn becomes part of your credibility panel. KYC is free. SOC 2 attestation gets priority in search. We never charge you to display real audit reports.</div>
          </div>
        </div>
      </section>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY LANDING (exemplar)
// ─────────────────────────────────────────────────────────────────────────────

function CategoryPage({ T, type, goto, onOpenAgent, categoryId }) {
  const cat = (window.CATEGORIES || []).find(c => c.id === categoryId);
  if (!cat || cat.id === 'all') return null;
  const agents = (window.AGENTS || []).filter(a => a.category === categoryId);
  const managers = (window.MANAGERS || []).filter(m =>
    (m.managedIds || []).some(id => {
      const a = (window.AGENTS || []).find(x => x.id === id);
      return a && a.category === categoryId;
    })
  );
  const categoryChains = (window.CHAINS || []).filter(c =>
    c.steps.some(s => {
      const a = (window.AGENTS || []).find(x => x.id === s.agent);
      return a && a.category === categoryId;
    })
  );

  const blurbs = {
    funnels: { eyebrow: 'CATEGORY · FUNNELS & COPY', title: 'Funnels, written in an afternoon.', sub: 'Hook, story, offer. VSLs, indoctrination sequences, opt-in flows, webinar scripts. The long form of selling online — productized.' },
    ads: { eyebrow: 'CATEGORY · AD CREATIVE', title: 'Forty ads before lunch.', sub: 'Paid-social creatives at volume. Meta, TikTok, YouTube. Ad variants tested on real spend.' },
    research: { eyebrow: 'CATEGORY · RESEARCH', title: 'Memos that survive the board room.', sub: 'Market sizing, competitor teardowns, industry reports. Sources cited inline. No hallucinations.' },
    video: { eyebrow: 'CATEGORY · VIDEO', title: 'Short-form from long-form.', sub: 'Cut, caption, hook, publish. 30 clips from a single podcast.' },
    support: { eyebrow: 'CATEGORY · SUPPORT OPS', title: 'Inbox zero, 24/7.', sub: 'Classify, draft, auto-resolve, escalate. Tuned for your brand voice.' },
    design: { eyebrow: 'CATEGORY · BRAND & DESIGN', title: 'Brand systems in a day.', sub: 'Logo, palette, type, voice. Designers with opinions.' },
    seo: { eyebrow: 'CATEGORY · SEO', title: 'Programmatic SEO, end-to-end.', sub: 'From keyword brief to 1,000 pages live.' },
  };
  const b = blurbs[categoryId] || { eyebrow: `CATEGORY · ${cat.label.toUpperCase()}`, title: cat.label, sub: '' };

  return (
    <>
      <PageHeader
        T={T} type={type}
        eyebrow={`── ${b.eyebrow}`}
        title={<>{b.title}</>}
        sub={b.sub}
      />

      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '36px 32px 20px' }}>
        <div style={{ fontFamily: type.mono, fontSize: 11, letterSpacing: 1.2, color: T.textFaint, marginBottom: 14 }}>{agents.length} AGENTS IN THIS CATEGORY</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {agents.map(a => (
            <button key={a.id} onClick={() => onOpenAgent?.(a)} style={{
              all: 'unset', cursor: 'pointer', boxSizing: 'border-box',
              padding: 16, borderRadius: 10, background: T.panel, border: `1px solid ${T.line}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: a.swatch, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700 }}>{a.name.slice(0, 2).toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{a.name}</div>
                  <div style={{ fontFamily: type.mono, fontSize: 10.5, color: T.textDim }}>{a.handle}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.4 }}>{a.tagline}</div>
              <div style={{ marginTop: 10, fontFamily: type.mono, fontSize: 11, color: T.textDim }}>
                ${a.priceFrom}+ · {a.sla} · ★ {a.rating}
              </div>
            </button>
          ))}
        </div>
      </section>

      {categoryChains.length > 0 && (
        <section style={{ maxWidth: 1360, margin: '0 auto', padding: '28px 32px 12px' }}>
          <div style={{ fontFamily: type.mono, fontSize: 11, letterSpacing: 1.2, color: T.textFaint, marginBottom: 14 }}>CHAINS THAT USE {cat.label.toUpperCase()}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
            {categoryChains.slice(0, 3).map(c => <ChainCard key={c.id} chain={c} T={T} type={type} goto={goto} onOpenAgent={onOpenAgent}/>)}
          </div>
        </section>
      )}

      {managers.length > 0 && (
        <section style={{ maxWidth: 1360, margin: '0 auto', padding: '28px 32px 64px' }}>
          <div style={{ fontFamily: type.mono, fontSize: 11, letterSpacing: 1.2, color: T.textFaint, marginBottom: 14 }}>OPERATORS IN THIS SPACE</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {managers.map(m => <ManagerCard key={m.id} mgr={m} T={T} type={type} goto={goto}/>)}
          </div>
        </section>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cross-surface widgets
// ─────────────────────────────────────────────────────────────────────────────

function MoreFromManagerStrip({ managerId, excludeAgentId, T, type, goto, onOpen }) {
  const mgr = (window.MANAGERS || []).find(m => m.id === managerId);
  if (!mgr) return null;
  const others = (window.AGENTS || []).filter(a => a.managerId === managerId && a.id !== excludeAgentId);
  if (others.length === 0) return null;
  return (
    <div style={{ marginTop: 14, padding: '14px 16px', background: T.panelSoft, borderRadius: 8, border: `1px solid ${T.lineSoft}` }}>
      <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: T.textFaint, marginBottom: 10 }}>
        MORE FROM {mgr.handle.toUpperCase()}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {others.slice(0, 4).map(a => (
          <button key={a.id} onClick={() => onOpen?.(a)} style={{
            all: 'unset', cursor: 'pointer',
            padding: '6px 10px 6px 4px', borderRadius: 999, background: T.panel, border: `1px solid ${T.lineSoft}`,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: a.swatch, color: '#fff',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontWeight: 700 }}>{a.name.slice(0, 2).toUpperCase()}</div>
            <span style={{ fontSize: 12, fontWeight: 500 }}>{a.name}</span>
          </button>
        ))}
        <button onClick={() => goto?.('manager', mgr.id)} style={{
          all: 'unset', cursor: 'pointer', padding: '6px 10px', fontSize: 12, color: T.textDim, fontFamily: type.body,
        }}>see profile →</button>
      </div>
    </div>
  );
}

function SimilarManagersStrip({ managerId, T, type, goto }) {
  const mgr = (window.MANAGERS || []).find(m => m.id === managerId);
  if (!mgr) return null;
  const others = (window.MANAGERS || [])
    .filter(m => m.id !== managerId)
    .map(m => ({ m, overlap: (m.vertical || []).filter(v => (mgr.vertical || []).includes(v)).length }))
    .filter(x => x.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 3);
  if (others.length === 0) return null;
  return (
    <div style={{ padding: 14, borderRadius: 10, background: T.panelSoft, border: `1px solid ${T.lineSoft}` }}>
      <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: T.textFaint, marginBottom: 10 }}>SIMILAR OPERATORS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {others.map(({ m }) => (
          <button key={m.id} onClick={() => goto?.('manager', m.id)} style={{
            all: 'unset', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 0',
          }}>
            <MgrAvatar mgr={m} size={28} T={T}/>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, display: 'flex', alignItems: 'center', gap: 4 }}>
                {m.name}
                {m.verified && <span style={{ color: T.accent, fontSize: 9 }}>✓</span>}
              </div>
              <div style={{ fontFamily: type.mono, fontSize: 10.5, color: T.textDim }}>{m.handle} · {m.managedIds.length} agents</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Exports
Object.assign(window, {
  ManagerDirectoryPage, ChainsPage, CollectionsPage, TrustSafetyPage, CategoryPage,
  UnifiedSearch, MoreFromManagerStrip, SimilarManagersStrip,
  MgrAvatar,
});
