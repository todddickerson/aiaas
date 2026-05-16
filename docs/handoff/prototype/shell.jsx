// shell.jsx — main app shell for AIaaS.com

const DEFAULT_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "ember",
  "mode": "light",
  "variant": "editorial",
  "density": "comfortable",
  "showGamification": true,
  "typePair": "editorial"
}/*EDITMODE-END*/;

function useTweaks() {
  const [tweaks, setTweaks] = React.useState(() => {
    try {
      const saved = localStorage.getItem('mh-tweaks');
      return saved ? { ...DEFAULT_TWEAKS, ...JSON.parse(saved) } : DEFAULT_TWEAKS;
    } catch { return DEFAULT_TWEAKS; }
  });
  React.useEffect(() => {
    try { localStorage.setItem('mh-tweaks', JSON.stringify(tweaks)); } catch {}
  }, [tweaks]);
  const setKey = (k, v) => {
    setTweaks(prev => {
      const next = { ...prev, [k]: v };
      try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*'); } catch {}
      return next;
    });
  };
  return [tweaks, setKey];
}

function App() {
  const [tweaks, setTweak] = useTweaks();
  const [editMode, setEditMode] = React.useState(false);
  const [selectedAgent, setSelectedAgent] = React.useState(null);
  const [cat, setCat] = React.useState('all');
  const [sort, setSort] = React.useState('trending');
  const [page, setPage] = React.useState(() => {
    try { return localStorage.getItem('mh-page') || 'browse'; } catch { return 'browse'; }
  });
  const [audience, setAudience] = React.useState(() => {
    try { return localStorage.getItem('mh-audience') || 'buyer'; } catch { return 'buyer'; }
  });
  const setAudienceP = (a) => { setAudience(a); try { localStorage.setItem('mh-audience', a); } catch {} };
  const [managerId, setManagerId] = React.useState(() => {
    try { return localStorage.getItem('mh-manager') || 'todd'; } catch { return 'todd'; }
  });
  const [categoryId, setCategoryId] = React.useState('funnels');
  const [searchOpen, setSearchOpen] = React.useState(false);
  const goto = (p, arg) => {
    setPage(p);
    try { localStorage.setItem('mh-page', p); } catch {}
    if (p === 'manager' && arg) {
      setManagerId(arg);
      try { localStorage.setItem('mh-manager', arg); } catch {}
    }
    if (p === 'category' && arg) setCategoryId(arg);
    window.scrollTo(0, 0);
  };
  // ⌘K / Ctrl+K to open unified search
  React.useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(o => !o); }
      if (e.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault(); setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  // Expose goto so deeply-nested children (modals) can navigate without prop-drilling
  React.useEffect(() => { window.__MH_GOTO = goto; }, []);
  const [hiredIds, setHiredIds] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('mh-hired') || '[]'); } catch { return []; }
  });

  // persist current slide/selection
  React.useEffect(() => {
    try { localStorage.setItem('mh-hired', JSON.stringify(hiredIds)); } catch {}
  }, [hiredIds]);

  // Edit mode hook
  React.useEffect(() => {
    const handler = (e) => {
      if (!e.data) return;
      if (e.data.type === '__activate_edit_mode') setEditMode(true);
      if (e.data.type === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', handler);
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch {}
    return () => window.removeEventListener('message', handler);
  }, []);

  const T = themeTokens(tweaks.mode, tweaks.accent);
  const type = TYPE_PAIRS[tweaks.typePair];

  const filtered = React.useMemo(() => {
    let list = AGENTS;
    if (cat !== 'all') list = list.filter(a => a.category === cat);
    if (sort === 'runs') list = [...list].sort((a, b) => b.runs - a.runs);
    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === 'price') list = [...list].sort((a, b) => a.priceFrom - b.priceFrom);
    if (sort === 'online') list = [...list].sort((a, b) => (b.online - a.online) + (a.queue - b.queue) * 0.01);
    return list;
  }, [cat, sort]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div style={{
      minHeight: '100vh', background: T.bg, color: T.text,
      fontFamily: type.body,
      transition: 'background .2s, color .2s',
    }}>
      <style>{`
        @keyframes mh-pulse { 0% { transform: scale(1); opacity: 0.4 } 80% { transform: scale(2.4); opacity: 0 } 100% { opacity: 0 } }
        @keyframes mh-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes mh-rise { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        @keyframes mh-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        body { margin: 0; }
        ::selection { background: ${T.accent}44; }
        button:focus-visible { outline: 2px solid ${T.accent}; outline-offset: 2px; }
      `}</style>

      <TopNav T={T} type={type} page={page} goto={goto} onSearch={() => setSearchOpen(true)}/>

      {page === 'how' && <HowItWorksPage T={T} type={type} goto={goto} audience={audience} setAudience={setAudienceP}/>}
      {page === 'manifesto' && <ManifestoPage T={T} type={type} goto={goto}/>}
      {page === 'publish' && <PublishPage T={T} type={type} goto={goto}/>}
      {page === 'developers' && <DevelopersPage T={T} type={type} goto={goto}/>}
      {page === 'manager' && <ManagerProfilePage T={T} type={type} goto={goto} managerId={managerId} onOpen={setSelectedAgent}/>}
      {page === 'dashboard' && <DashboardPage T={T} type={type} goto={goto} hiredIds={hiredIds}/>}
      {page === 'managers' && <ManagerDirectoryPage T={T} type={type} goto={goto}/>}
      {page === 'chains' && <ChainsPage T={T} type={type} goto={goto} onOpenAgent={setSelectedAgent}/>}
      {page === 'collections' && <CollectionsPage T={T} type={type} goto={goto} onOpenAgent={setSelectedAgent}/>}
      {page === 'trust' && <TrustSafetyPage T={T} type={type} goto={goto}/>}
      {page === 'category' && <CategoryPage T={T} type={type} goto={goto} onOpenAgent={setSelectedAgent} categoryId={categoryId}/>}

      {page === 'browse' && <>
      <LiveTicker T={T} type={type} />
      <Hero T={T} type={type} hiredIds={hiredIds} goto={goto}/>
      <CategoryBar T={T} type={type} cat={cat} setCat={setCat} sort={sort} setSort={setSort}/>

      {/* Featured row */}
      {featured && (
        <section style={{ maxWidth: 1360, margin: '0 auto', padding: '12px 32px 6px' }}>
          <FeaturedAgent agent={featured} T={T} type={type} onOpen={setSelectedAgent}/>
        </section>
      )}

      {/* Grid */}
      <section style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 32px 80px' }}>
        <div style={{ display: 'grid',
          gridTemplateColumns: tweaks.density === 'compact' ? 'repeat(auto-fill, minmax(280px, 1fr))' : 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: tweaks.density === 'compact' ? 14 : 20,
        }}>
          {rest.map(a => (
            <AgentCard
              key={a.id}
              agent={a}
              T={T}
              type={type}
              variant={tweaks.variant}
              density={tweaks.density}
              showGame={tweaks.showGamification}
              onOpen={setSelectedAgent}
            />
          ))}
        </div>
      </section>

      <Leaderboard T={T} type={type} onOpen={setSelectedAgent}/>
      </>}
      <Footer T={T} type={type} goto={goto}/>

      {selectedAgent && (
        <AgentDetail
          agent={selectedAgent}
          T={T} type={type}
          variant={tweaks.variant}
          showGame={tweaks.showGamification}
          hiredIds={hiredIds}
          onHire={(a) => setHiredIds(prev => [...prev, a.id])}
          onClose={() => setSelectedAgent(null)}
        />
      )}

      {editMode && <TweaksPanel tweaks={tweaks} setTweak={setTweak} T={T} type={type}/>}

      {typeof UnifiedSearch !== 'undefined' && (
        <UnifiedSearch T={T} type={type} open={searchOpen} onClose={() => setSearchOpen(false)} goto={goto} onOpenAgent={setSelectedAgent}/>
      )}
    </div>
  );
}

// ============ TOP NAV ============
function TopNav({ T, type, page, goto, onSearch }) {
  const [discoverOpen, setDiscoverOpen] = React.useState(false);
  const discoverItems = [
    ['browse', 'Agents', 'Browse all 247 agents'],
    ['managers', 'Managers', 'The operators behind the agents'],
    ['chains', 'Chains', 'Multi-agent playbooks'],
    ['collections', 'Collections', 'Curated editorial picks'],
  ];
  const discoverActive = ['browse','managers','chains','collections','category'].includes(page);
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: `${T.bg}ee`, backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${T.line}`,
    }}>
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '14px 24px',
        display: 'flex', alignItems: 'center', gap: 36, flexWrap: 'nowrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, paddingRight: 12, borderRight: `1px solid ${T.lineSoft}` }}>
          <LogoMark T={T} size={28}/>
          <span style={{ fontFamily: type.display, fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>
            AIaaS<span style={{ color: T.accent }}>.com</span>
          </span>
        </div>
        <nav style={{ display: 'flex', gap: 18, fontSize: 13, color: T.textDim, overflow: 'visible', flex: '0 1 auto', minWidth: 0 }}>
          <div
            onMouseEnter={() => setDiscoverOpen(true)}
            onMouseLeave={() => setDiscoverOpen(false)}
            style={{ position: 'relative' }}
          >
            <a style={{
              color: discoverActive ? T.text : T.textDim, cursor: 'pointer', textDecoration: 'none',
              fontWeight: discoverActive ? 500 : 400, whiteSpace: 'nowrap',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }} onClick={() => goto?.('browse')}>
              Discover <span style={{ fontSize: 9, opacity: 0.6 }}>▾</span>
            </a>
            {discoverOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: -8, marginTop: 6, zIndex: 60,
                width: 280, padding: 6, background: T.panel, border: `1px solid ${T.line}`,
                borderRadius: 10, boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
              }}>
                {discoverItems.map(([k, l, d]) => (
                  <button key={k} onClick={() => { setDiscoverOpen(false); goto?.(k); }} style={{
                    all: 'unset', cursor: 'pointer', display: 'block', width: '100%', boxSizing: 'border-box',
                    padding: '8px 10px', borderRadius: 6,
                    background: page === k ? T.panelSoft : 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = T.panelSoft}
                  onMouseLeave={e => e.currentTarget.style.background = page === k ? T.panelSoft : 'transparent'}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{l}</div>
                    <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>{d}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <a onClick={() => goto?.('how')} style={{ color: page === 'how' ? T.text : T.textDim, cursor: 'pointer', textDecoration: 'none', fontWeight: page === 'how' ? 500 : 400, whiteSpace: 'nowrap' }}>How it works</a>
          <a onClick={() => goto?.('manifesto')} style={{ color: page === 'manifesto' ? T.text : T.textDim, cursor: 'pointer', textDecoration: 'none', fontWeight: page === 'manifesto' ? 500 : 400, whiteSpace: 'nowrap' }}>Manifesto</a>
          <a onClick={() => goto?.('trust')} className="mh-nav-extra" style={{ color: page === 'trust' ? T.text : T.textDim, cursor: 'pointer', textDecoration: 'none', fontWeight: page === 'trust' ? 500 : 400, whiteSpace: 'nowrap' }}>Trust</a>
          <a onClick={() => goto?.('publish')} className="mh-nav-extra" style={{ color: page === 'publish' ? T.text : T.textDim, cursor: 'pointer', textDecoration: 'none', fontWeight: page === 'publish' ? 500 : 400, whiteSpace: 'nowrap' }}>Publish</a>
          <a onClick={() => goto?.('developers')} className="mh-nav-extra" style={{ color: page === 'developers' ? T.text : T.textDim, cursor: 'pointer', textDecoration: 'none', fontWeight: page === 'developers' ? 500 : 400, whiteSpace: 'nowrap' }}>Developers</a>
          <a onClick={() => goto?.('dashboard')} className="mh-nav-extra" style={{ color: page === 'dashboard' ? T.text : T.textDim, cursor: 'pointer', textDecoration: 'none', fontWeight: page === 'dashboard' ? 500 : 400, whiteSpace: 'nowrap' }}>Dashboard</a>
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button onClick={onSearch} className="mh-search-pill" style={{
            all: 'unset', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 999,
            background: T.panelSoft, border: `1px solid ${T.line}`,
            fontSize: 12, color: T.textDim, fontFamily: type.mono, whiteSpace: 'nowrap',
          }}>
            <span style={{ color: T.textFaint }}>⌘K</span> agents · operators · chains
          </button>
          <button style={{
            padding: '8px 16px', background: T.text, color: T.panel, border: 'none',
            borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: type.body, whiteSpace: 'nowrap',
          }}>Sign in</button>
        </div>
      </div>
      <style>{`@media (max-width: 1060px) { .mh-search-pill { display: none !important; } .mh-nav-extra { display: none !important; } }`}</style>
    </header>
  );
}

function LogoMark({ T, size = 28 }) {
  // "A" monogram for AIaaS — an apex + crossbar, with an accent dot
  // sitting in the counter to echo the ".com" in the wordmark.
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect width="32" height="32" rx="6" fill={T.text}/>
      {/* A-shape: two legs + crossbar */}
      <path
        d="M8 23 L15 8 L17 8 L24 23"
        stroke={T.bg}
        strokeWidth="2.4"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M11.2 17 L20.8 17"
        stroke={T.bg}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Accent dot — echoes the .com period */}
      <circle cx="25.6" cy="23" r="1.8" fill={T.accent}/>
    </svg>
  );
}

// ============ LIVE TICKER ============
function LiveTicker({ T, type }) {
  const items = [...LIVE_TICKER, ...LIVE_TICKER]; // duplicate for seamless loop
  return (
    <div style={{
      background: T.bgSub, borderBottom: `1px solid ${T.line}`,
      overflow: 'hidden', whiteSpace: 'nowrap',
    }}>
      <div style={{
        display: 'inline-flex', gap: 0, padding: '8px 0',
        animation: 'mh-marquee 40s linear infinite',
      }}>
        {items.map((it, i) => {
          const agent = AGENTS.find(a => a.id === it.agent);
          return (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '0 24px', borderRight: `1px solid ${T.line}`,
              fontFamily: type.mono, fontSize: 11, color: T.textDim,
            }}>
              <Pulse color={agent?.swatch || T.accent} size={6}/>
              <span style={{ color: T.text, fontWeight: 600 }}>{agent?.name}</span>
              <span>{it.action}</span>
              <span style={{ color: T.textFaint }}>· {it.user}</span>
              <span style={{ color: T.textFaint }}>· {it.time}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ============ HERO ============
function Hero({ T, type, hiredIds, goto }) {
  return (
    <section style={{ maxWidth: 1360, margin: '0 auto', padding: '48px 32px 32px',
      display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 48, alignItems: 'end' }}>
      <div>
        <div style={{ fontFamily: type.mono, fontSize: 11, letterSpacing: 1.5, color: T.accent, fontWeight: 600, marginBottom: 16 }}>
          ── HIRE AN AGENT · $2 TO $899 · PAID WHEN IT'S DONE
        </div>
        <h1 style={{
          margin: 0, fontFamily: type.display, fontWeight: 700,
          fontSize: 'clamp(42px, 6vw, 76px)', lineHeight: 1.12, letterSpacing: -1.5,
          textWrap: 'balance',
        }}>
          Hire the world's best AI<br/>
          to <span style={{ fontStyle: type.name === 'Editorial' ? 'italic' : 'normal', fontWeight: type.name === 'Editorial' ? 400 : 700 }}>
            do your work.
          </span>
        </h1>
        <p style={{
          marginTop: 28, marginBottom: 0, fontSize: 18, lineHeight: 1.5, maxWidth: 560, color: T.textDim,
          textWrap: 'pretty',
        }}>
          Tell an agent what you need. It ships the finished thing — ads, a funnel, a research memo, 40 clips — in minutes or hours. You see the work before you pay. Every agent has a public track record and sample work you can look at first.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
          <button style={{
            padding: '14px 22px', background: T.text, color: T.panel, border: 'none',
            borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: type.body,
          }}>Browse 247 agents →</button>
          <button onClick={() => { setAudienceP('buyer'); goto?.('how'); }} style={{
            padding: '14px 22px', background: 'transparent', color: T.text,
            border: `1px solid ${T.line}`, borderRadius: 8, fontSize: 14, fontWeight: 500,
            cursor: 'pointer', fontFamily: type.body,
          }}>See how it works →</button>
        </div>

        <div style={{ marginTop: 20, fontFamily: type.mono, fontSize: 11, color: T.textFaint, letterSpacing: 0.3 }}>
          ✓ No subscription · ✓ See sample work first · ✓ One-click redo if it's off
        </div>

        <div style={{ marginTop: 36, display: 'flex', gap: 32, fontFamily: type.mono, fontSize: 11 }}>
          {[
            ['247', 'agents live'],
            ['184,220', 'executions shipped'],
            ['$2.1M', 'paid to agents this month'],
            ['8s—8h', 'typical turnaround'],
          ].map(([n, l]) => (
            <div key={l}>
              <div style={{ fontFamily: type.display, fontSize: 22, fontWeight: 700, color: T.text }}>{n}</div>
              <div style={{ color: T.textDim, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: 10, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <HeroViz T={T} type={type}/>
    </section>
  );
}

function HeroViz({ T, type }) {
  // stacked mini-agents showing live availability — playful but ambitious
  const sample = AGENTS.slice(0, 5);
  return (
    <div style={{ position: 'relative', height: 340 }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 16,
        background: T.panelSoft, border: `1px solid ${T.line}`, overflow: 'hidden',
      }}>
        {/* grid bg */}
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
          <defs>
            <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke={T.line} strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>

        <div style={{ position: 'absolute', top: 14, left: 16, fontFamily: type.mono, fontSize: 10, letterSpacing: 1.5, color: T.textDim, fontWeight: 600 }}>
          LIVE · 5 OF 247 AGENTS
        </div>

        {/* agent nodes */}
        {sample.map((a, i) => {
          const positions = [
            { left: '14%', top: '22%' },
            { left: '58%', top: '14%' },
            { left: '32%', top: '54%' },
            { left: '72%', top: '58%' },
            { left: '18%', top: '78%' },
          ];
          return (
            <div key={a.id} style={{
              position: 'absolute', ...positions[i],
              display: 'flex', gap: 10, alignItems: 'center',
              padding: '8px 12px 8px 8px', borderRadius: 999,
              background: T.panel, border: `1px solid ${T.line}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              fontFamily: type.mono, fontSize: 11,
            }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: a.swatch,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700 }}>
                {a.name.slice(0,2).toUpperCase()}
              </div>
              <span style={{ color: T.text, fontWeight: 500, fontFamily: type.body }}>{a.name}</span>
              <span style={{ color: T.textDim }}>·</span>
              {a.online ? <Pulse color="#22c55e" size={6}/> : <AvailabilityDot online={false} size={6}/>}
              <span style={{ color: T.textDim, fontSize: 10 }}>{a.online ? `q${a.queue}` : 'idle'}</span>
            </div>
          );
        })}

        {/* connecting lines SVG */}
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <line x1="22%" y1="28%" x2="40%" y2="58%" stroke={T.accent} strokeWidth="1" strokeDasharray="3 3" opacity="0.4"/>
          <line x1="40%" y1="58%" x2="62%" y2="20%" stroke={T.accent} strokeWidth="1" strokeDasharray="3 3" opacity="0.4"/>
          <line x1="40%" y1="58%" x2="72%" y2="60%" stroke={T.accent} strokeWidth="1" strokeDasharray="3 3" opacity="0.4"/>
          <line x1="40%" y1="58%" x2="24%" y2="82%" stroke={T.accent} strokeWidth="1" strokeDasharray="3 3" opacity="0.4"/>
        </svg>

        {/* tagline */}
        <div style={{ position: 'absolute', bottom: 14, right: 16, fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.textDim, textAlign: 'right' }}>
          AGENT <span style={{ color: T.accent }}>NETWORK</span> / v2026.04
        </div>
      </div>
    </div>
  );
}

// ============ CATEGORY / SORT ============
function CategoryBar({ T, type, cat, setCat, sort, setSort }) {
  return (
    <div style={{ borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`, background: T.panel }}>
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '14px 32px',
        display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => {
            const active = cat === c.id;
            return (
              <button key={c.id} onClick={() => setCat(c.id)} style={{
                padding: '7px 12px', borderRadius: 6, border: 'none',
                background: active ? T.text : 'transparent',
                color: active ? T.panel : T.textDim,
                fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: type.body,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {c.label}
                <span style={{ fontSize: 10, opacity: 0.7, fontFamily: type.mono }}>{c.count}</span>
              </button>
            );
          })}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: T.textFaint }}>SORT</span>
          {[
            ['trending', 'Trending'],
            ['runs', 'Most runs'],
            ['rating', 'Top rated'],
            ['price', 'Price'],
            ['online', 'Available now'],
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
  );
}

// ============ FEATURED ============
function FeaturedAgent({ agent, T, type, onOpen }) {
  return (
    <div style={{
      position: 'relative', marginTop: 24, padding: 0, borderRadius: 12, overflow: 'hidden',
      background: `linear-gradient(135deg, ${agent.swatch}, ${agent.swatch}aa)`,
      color: '#fff',
      display: 'grid', gridTemplateColumns: '1.3fr 1fr', minHeight: 240,
    }}>
      <div style={{ padding: '28px 32px 32px', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.1,
          backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '16px 16px' }}/>
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.5, opacity: 0.9, fontWeight: 600, marginBottom: 10 }}>
            ★ EDITOR'S PICK · AGENT OF THE WEEK
          </div>
          <h2 style={{ margin: 0, fontFamily: type.display, fontSize: 48, fontWeight: 700, letterSpacing: -1, lineHeight: 1 }}>
            {agent.name}
          </h2>
          <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4, fontFamily: type.mono }}>
            {agent.handle} · {agent.persona}
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.5, maxWidth: 480, margin: '16px 0 20px', textWrap: 'pretty' }}>
            {agent.tagline}
          </p>
          <div style={{ display: 'flex', gap: 20, fontFamily: type.mono, fontSize: 11, marginBottom: 22 }}>
            <div><b style={{ fontSize: 18, fontFamily: type.display }}>{fmt(agent.runs)}</b> runs</div>
            <div><b style={{ fontSize: 18, fontFamily: type.display }}>{agent.rating}</b>★ ({fmt(agent.reviews)})</div>
            <div><b style={{ fontSize: 18, fontFamily: type.display }}>{agent.sla}</b> SLA</div>
            <div><b style={{ fontSize: 18, fontFamily: type.display }}>{agent.streak}d</b> streak</div>
          </div>
          <button onClick={() => onOpen?.(agent)} style={{
            padding: '12px 22px', background: '#fff', color: agent.swatch, border: 'none',
            borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: type.body,
          }}>Hire {agent.name} · from {price(agent.priceFrom)} →</button>
        </div>
      </div>
      <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: 20, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', maxWidth: 340 }}>
          <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, opacity: 0.9, marginBottom: 10 }}>
            LATEST EXECUTION · 3s AGO
          </div>
          <div style={{ fontFamily: type.mono, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {agent.sample}
          </div>
          <div style={{ fontFamily: type.mono, fontSize: 10, opacity: 0.7, marginTop: 12 }}>
            delivered to @{['flint', 'brightline', 'papershop', 'northerly'][agent.id.charCodeAt(0) % 4]}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ LEADERBOARD ============
function Leaderboard({ T, type, onOpen }) {
  return (
    <section style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 32px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontFamily: type.display, fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>
          This week's leaderboard
        </h2>
        <div style={{ fontFamily: type.mono, fontSize: 11, color: T.textDim, letterSpacing: 0.5 }}>
          ranked by executions · updated 4m ago
        </div>
      </div>
      <div style={{ border: `1px solid ${T.line}`, borderRadius: 10, overflow: 'hidden', background: T.panel }}>
        {LEADERBOARD_WEEKLY.map((row, i) => {
          const agent = AGENTS.find(a => a.id === row.id);
          if (!agent) return null;
          return (
            <button key={row.id} onClick={() => onOpen?.(agent)} style={{
              all: 'unset', cursor: 'pointer', width: '100%', boxSizing: 'border-box',
              display: 'grid', gridTemplateColumns: '60px 1fr 2fr 120px 120px 100px', gap: 16,
              alignItems: 'center', padding: '16px 20px',
              borderBottom: i < LEADERBOARD_WEEKLY.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
              transition: 'background .1s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.panelSoft}
            onMouseLeave={e => e.currentTarget.style.background = T.panel}>
              <div style={{ fontFamily: type.display, fontSize: 32, fontWeight: 700,
                color: row.rank === 1 ? T.accent : T.text, letterSpacing: -1 }}>
                #{row.rank}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <AgentPortrait agent={agent} size={36} T={T}/>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{agent.name}</div>
                  <div style={{ fontFamily: type.mono, fontSize: 11, color: T.textDim }}>{agent.handle}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: T.textDim, textWrap: 'balance' }}>
                {agent.tagline}
              </div>
              <div style={{ fontFamily: type.mono, fontSize: 12 }}>
                <div style={{ fontSize: 18, color: T.text, fontFamily: type.display, fontWeight: 600 }}>{fmt(row.runs)}</div>
                <div style={{ color: T.textDim, fontSize: 10, letterSpacing: 0.5 }}>runs this week</div>
              </div>
              <div style={{ fontFamily: type.mono, fontSize: 12, color: row.delta.startsWith('+') ? T.success : T.textDim }}>
                {row.delta}
              </div>
              <Spark color={agent.swatch} width={90} height={28}/>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ============ FOOTER ============
function Footer({ T, type }) {
  return (
    <footer style={{ borderTop: `1px solid ${T.line}`, background: T.bgSub }}>
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '36px 32px',
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <LogoMark T={T} size={24}/>
            <span style={{ fontFamily: type.display, fontSize: 15, fontWeight: 700 }}>
              AIaaS<span style={{ color: T.accent }}>.com</span>
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: T.textDim, lineHeight: 1.6, maxWidth: 360, margin: 0 }}>
            AI as a Service. The routing layer for agent-delivered work — platform-agnostic, productized, with a live queue, public track record, and a finished deliverable every time.
          </p>
        </div>
        {[
          ['Marketplace', ['Browse agents', 'Categories', 'Leaderboard', 'Agent of the week']],
          ['For agents', ['Publish agent', 'SDK & API', 'Revenue share', 'Docs']],
          ['Company', ['About', 'Changelog', 'Press', 'Terms']],
        ].map(([h, items]) => (
          <div key={h}>
            <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.textFaint, marginBottom: 10, textTransform: 'uppercase' }}>{h}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: T.textDim }}>
              {items.map(x => <a key={x} style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>{x}</a>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${T.line}`, padding: '14px 32px', fontFamily: type.mono, fontSize: 11, color: T.textFaint, display: 'flex', justifyContent: 'space-between' }}>
        <span>© 2026 AIaaS.com · the routing layer for AI agents</span>
        <span>v2026.04.23 · 247 agents online · all systems nominal</span>
      </div>
    </footer>
  );
}

// ============ TWEAKS PANEL ============
function TweaksPanel({ tweaks, setTweak, T, type }) {
  const row = (label, children) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: type.mono, fontSize: 9.5, letterSpacing: 1, color: T.textDim, marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>
      {children}
    </div>
  );

  const btn = (active, onClick, content, key) => (
    <button key={key} onClick={onClick} style={{
      all: 'unset', cursor: 'pointer',
      padding: '6px 10px', borderRadius: 6,
      border: `1px solid ${active ? T.text : T.line}`,
      background: active ? T.text : T.panel,
      color: active ? T.panel : T.text,
      fontSize: 11, fontFamily: type.body, fontWeight: 500,
      display: 'inline-flex', alignItems: 'center', gap: 6,
    }}>{content}</button>
  );

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 2000,
      width: 300, padding: 18,
      background: T.panel, color: T.text,
      border: `1px solid ${T.line}`, borderRadius: 12,
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      fontFamily: type.body,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontFamily: type.display, fontSize: 16, fontWeight: 700 }}>Tweaks</div>
        <div style={{ fontFamily: type.mono, fontSize: 10, color: T.textFaint, letterSpacing: 0.8 }}>LIVE</div>
      </div>

      {row('Accent', (
        <div style={{ display: 'flex', gap: 6 }}>
          {Object.entries(ACCENTS).map(([k, v]) => (
            <button key={k} onClick={() => setTweak('accent', k)} title={v.name} style={{
              all: 'unset', cursor: 'pointer',
              width: 24, height: 24, borderRadius: '50%', background: v.hex,
              boxShadow: tweaks.accent === k ? `0 0 0 2px ${T.panel}, 0 0 0 4px ${T.text}` : 'none',
            }}/>
          ))}
        </div>
      ))}

      {row('Mode', (
        <div style={{ display: 'flex', gap: 6 }}>
          {['light', 'dark'].map(m => btn(tweaks.mode === m, () => setTweak('mode', m), m, m))}
        </div>
      ))}

      {row('Card variant', (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            ['editorial', 'Editorial'],
            ['gamified', 'Gamified'],
            ['swiss', 'Swiss'],
            ['terminal', 'Terminal'],
          ].map(([k, l]) => btn(tweaks.variant === k, () => setTweak('variant', k), l, k))}
        </div>
      ))}

      {row('Typography', (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {Object.entries(TYPE_PAIRS).map(([k, v]) => btn(tweaks.typePair === k, () => setTweak('typePair', k), v.name, k))}
        </div>
      ))}

      {row('Density', (
        <div style={{ display: 'flex', gap: 6 }}>
          {['comfortable', 'compact'].map(d => btn(tweaks.density === d, () => setTweak('density', d), d, d))}
        </div>
      ))}

      {row('Gamification', (
        <div style={{ display: 'flex', gap: 6 }}>
          {btn(tweaks.showGamification, () => setTweak('showGamification', true), 'show', 's')}
          {btn(!tweaks.showGamification, () => setTweak('showGamification', false), 'hide', 'h')}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { App });
