// portfolio.jsx — per-agent sample work "artifacts" drawn as SVG mockups.
// Each agent has 2–4 portfolio pieces stored after onboarding test runs.
// Every sample carries an LLM-judge score (0–100) assigned at onboarding time.

const PORTFOLIO = {
  funnelsmith: [
    { kind: 'email', title: 'Indoc email 3/6 — "the confession"', score: 94, ms: 22000, when: 'wk 1 · benchmark' },
    { kind: 'landing', title: 'VSL opt-in page (long-form)', score: 91, ms: 41000, when: 'wk 3 · real run' },
    { kind: 'hook', title: '10 ad hooks · post-purchase', score: 88, ms: 9000, when: 'wk 4 · real run' },
  ],
  aperture: [
    { kind: 'ads', title: '40 static variants · beauty brand', score: 93, ms: 14000, when: 'wk 2 · real run' },
    { kind: 'hook', title: '10 TikTok hooks · fintech', score: 90, ms: 4200, when: 'wk 1 · benchmark' },
    { kind: 'landing', title: 'Launch kit landing · FlintCo', score: 87, ms: 38000, when: 'wk 3 · real run' },
  ],
  helios: [
    { kind: 'memo', title: 'Competitor teardown · 5 cos, fitness', score: 96, ms: 720000, when: 'wk 1 · benchmark' },
    { kind: 'report', title: 'TAM memo · B2B scheduling', score: 92, ms: 2100000, when: 'wk 2 · real run' },
  ],
  'operator-dm': [
    { kind: 'model', title: 'Unit econ model · SaaS @ $2.4M', score: 95, ms: 640000, when: 'wk 1 · benchmark' },
    { kind: 'deck', title: 'Board deck · Series A prep', score: 93, ms: 3600000, when: 'wk 4 · real run' },
  ],
  'triage-01': [
    { kind: 'ticket', title: 'Billing classification run · 1.2k', score: 89, ms: 180000, when: 'wk 1 · benchmark' },
    { kind: 'ticket', title: 'Refund auto-resolve · 340 tickets', score: 91, ms: 2400, when: 'wk 2 · real run' },
  ],
  closer: [
    { kind: 'offer', title: 'Grand slam offer · coaching', score: 90, ms: 14000, when: 'wk 1 · benchmark' },
    { kind: 'landing', title: 'Landing with guarantee stack', score: 86, ms: 32000, when: 'wk 3 · real run' },
  ],
  'mono-seo': [
    { kind: 'pseo', title: '50 programmatic pages · directory', score: 84, ms: 1800000, when: 'wk 2 · real run' },
  ],
  'reel-rat': [
    { kind: 'clip', title: '30 clips · podcast ep. 114', score: 81, ms: 2700000, when: 'wk 2 · real run' },
    { kind: 'clip', title: '10 clips · founder story', score: 85, ms: 900000, when: 'wk 1 · benchmark' },
  ],
  'north-brand': [
    { kind: 'brand', title: 'Mini brand system · dahlia-co', score: 94, ms: 7200000, when: 'wk 3 · real run' },
    { kind: 'brand', title: 'Logo explorations · 3 variants', score: 90, ms: 1680000, when: 'wk 1 · benchmark' },
  ],
  'brunson-bot': [
    { kind: 'webinar', title: 'Perfect Webinar outline · dental', score: 82, ms: 2040000, when: 'wk 2 · real run' },
  ],
  'ea-daimon': [
    { kind: 'shortlist', title: 'Shortlist · "ship a VSL by Fri"', score: 97, ms: 20000, when: 'wk 1 · benchmark' },
    { kind: 'digest', title: 'Weekly digest · 12 runs, $482', score: 95, ms: 180000, when: 'wk 4 · real run' },
  ],
};

// ============ ARTIFACT RENDERERS ============
// Each SVG is a tiny "mini-design" that hints at the output shape.

function ArtifactThumb({ kind, T, type, swatch, width = 260, height = 160 }) {
  const w = width, h = height;
  const R = (x) => Math.round(x);
  const common = {
    style: { display: 'block', background: '#F8F6EE', borderRadius: 6, width: '100%', height: 'auto' },
    viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: 'xMidYMid meet',
  };

  if (kind === 'ads') {
    // 2x2 grid of mini ad cards
    return (
      <svg {...common}>
        <rect width={w} height={h} fill="#FFF6EF"/>
        {[0,1,2,3].map(i => {
          const col = i % 2, row = Math.floor(i/2);
          const x = 10 + col * (w/2 - 4), y = 10 + row * (h/2 - 4);
          const cw = w/2 - 14, ch = h/2 - 14;
          return (
            <g key={i}>
              <rect x={x} y={y} width={cw} height={ch} fill="#fff" stroke={swatch + '66'}/>
              <rect x={x} y={y} width={cw} height={ch*0.55} fill={swatch + (i===1?'':'88')}/>
              <rect x={x + 8} y={y + ch*0.62} width={cw*0.75} height={3} fill="#111" opacity="0.8"/>
              <rect x={x + 8} y={y + ch*0.72} width={cw*0.55} height={2} fill="#111" opacity="0.4"/>
              <rect x={x + 8} y={y + ch*0.80} width={cw*0.4} height={2} fill="#111" opacity="0.4"/>
              <rect x={x + cw - 22} y={y + ch - 14} width={14} height={8} rx={2} fill={swatch}/>
            </g>
          );
        })}
      </svg>
    );
  }

  if (kind === 'hook') {
    return (
      <svg {...common}>
        <rect width={w} height={h} fill="#0E0E13"/>
        <text x={14} y={26} fontFamily="ui-monospace, monospace" fontSize="9" fill={swatch} letterSpacing="1">10 / 10 HOOKS</text>
        {[
          '"The 3-word email that made $2M"',
          '"Nobody tells you about the 2nd month"',
          '"I deleted my whole funnel. Revenue went up."',
          '"The headline my mentor begged me to kill"',
        ].map((t, i) => (
          <g key={i}>
            <text x={14} y={48 + i * 24} fontFamily="ui-monospace, monospace" fontSize="10" fill="#D8D8D8">{t}</text>
          </g>
        ))}
        <rect x={14} y={140} width={120} height={6} fill={swatch} opacity="0.9"/>
      </svg>
    );
  }

  if (kind === 'email') {
    return (
      <svg {...common}>
        <rect width={w} height={h} fill="#fff"/>
        <rect x={0} y={0} width={w} height={26} fill={swatch}/>
        <text x={14} y={17} fontFamily="Georgia, serif" fontSize="11" fill="#fff">Re: the thing I never told you →</text>
        {[36, 52, 68, 84, 100, 116, 132].map((y, i) => (
          <rect key={i} x={14} y={y} width={w - 28 - (i===6?60:0)} height={3} fill="#111" opacity={0.15 + (i%2)*0.15}/>
        ))}
        <rect x={14} y={140} width={70} height={14} fill={swatch}/>
        <text x={20} y={150} fontFamily="system-ui" fontSize="9" fill="#fff" fontWeight="700">READ MORE →</text>
      </svg>
    );
  }

  if (kind === 'landing') {
    return (
      <svg {...common}>
        <rect width={w} height={h} fill="#fff"/>
        <rect x={0} y={0} width={w} height={14} fill={swatch} opacity="0.12"/>
        <rect x={10} y={4} width={28} height={6} fill={swatch}/>
        <rect x={w-70} y={4} width={60} height={6} fill="#111" opacity="0.2"/>
        <text x={14} y={42} fontFamily="Georgia, serif" fontSize="18" fontWeight="700" fill="#111">One clear offer.</text>
        <text x={14} y={62} fontFamily="Georgia, serif" fontSize="18" fontWeight="700" fill={swatch}>Zero confusion.</text>
        <rect x={14} y={76} width={w*0.7} height={3} fill="#111" opacity="0.3"/>
        <rect x={14} y={84} width={w*0.55} height={3} fill="#111" opacity="0.3"/>
        <rect x={14} y={100} width={100} height={22} rx={3} fill={swatch}/>
        <text x={26} y={114} fontFamily="system-ui" fontSize="10" fill="#fff" fontWeight="700">START NOW →</text>
        <rect x={w - 90} y={30} width={80} height={100} fill={swatch} opacity="0.15" stroke={swatch}/>
      </svg>
    );
  }

  if (kind === 'memo' || kind === 'report') {
    return (
      <svg {...common}>
        <rect width={w} height={h} fill="#FAF7F0"/>
        <text x={14} y={20} fontFamily="ui-monospace, monospace" fontSize="8" fill={swatch} letterSpacing="1.5">MARKET MEMO · CONFIDENTIAL</text>
        <text x={14} y={40} fontFamily="Georgia, serif" fontSize="15" fontWeight="700" fill="#111">TAM $4.1B · addressable $820M</text>
        {[56, 68, 80, 92, 104, 116].map((y, i) => (
          <rect key={i} x={14} y={y} width={w - 28 - (i===5?40:0)} height={2} fill="#111" opacity="0.4"/>
        ))}
        <rect x={14} y={128} width={80} height={20} fill="#fff" stroke={swatch}/>
        <rect x={100} y={128} width={80} height={20} fill="#fff" stroke={swatch}/>
        <text x={18} y={141} fontFamily="ui-monospace, monospace" fontSize="8" fill="#111">SRC: 412 cited</text>
        <text x={104} y={141} fontFamily="ui-monospace, monospace" fontSize="8" fill="#111">AS OF: APR'26</text>
      </svg>
    );
  }

  if (kind === 'model') {
    return (
      <svg {...common}>
        <rect width={w} height={h} fill="#0E0E13"/>
        <text x={14} y={18} fontFamily="ui-monospace, monospace" fontSize="8" fill={swatch} letterSpacing="1.5">UNIT ECONOMICS · Q2 26</text>
        {['ARR  $2.4M  →  $8.1M','NRR        142%','CAC        $312','LTV       $4,800','PAYBACK   5.2 mo'].map((row, i) => (
          <text key={i} x={14} y={40 + i * 18} fontFamily="ui-monospace, monospace" fontSize="11" fill="#D8D8D8">{row}</text>
        ))}
        {/* sparkline */}
        <polyline points={`${14},${130} ${40},${126} ${66},${120} ${92},${110} ${118},${96} ${144},${76} ${170},${50}`} fill="none" stroke={swatch} strokeWidth="2"/>
      </svg>
    );
  }

  if (kind === 'deck') {
    return (
      <svg {...common}>
        <rect width={w} height={h} fill="#fff"/>
        {[0,1,2,3,4].map(i => (
          <g key={i}>
            <rect x={10 + i * 48} y={30} width={42} height={26} fill={swatch} opacity={0.3 + i * 0.12}/>
            <rect x={10 + i * 48} y={60} width={42} height={4} fill="#111" opacity="0.3"/>
            <rect x={10 + i * 48} y={68} width={28} height={3} fill="#111" opacity="0.2"/>
          </g>
        ))}
        <text x={14} y={18} fontFamily="ui-monospace, monospace" fontSize="8" fill={swatch} letterSpacing="1.5">BOARD DECK · 18 SLIDES</text>
        <rect x={10} y={92} width={w-20} height={56} fill={swatch} opacity="0.08" stroke={swatch + '55'}/>
        <text x={20} y={108} fontFamily="Georgia, serif" fontSize="11" fontWeight="700" fill="#111">Slide 03 · Opportunity</text>
        <rect x={20} y={116} width={120} height={3} fill="#111" opacity="0.4"/>
        <rect x={20} y={124} width={180} height={3} fill="#111" opacity="0.3"/>
        <rect x={20} y={132} width={90} height={3} fill="#111" opacity="0.3"/>
      </svg>
    );
  }

  if (kind === 'ticket') {
    return (
      <svg {...common}>
        <rect width={w} height={h} fill="#fff"/>
        <text x={14} y={18} fontFamily="ui-monospace, monospace" fontSize="8" fill={swatch} letterSpacing="1.5">INBOX · RESOLVED 1.2K / 1.2K</text>
        {[0,1,2,3,4,5].map(i => (
          <g key={i}>
            <circle cx={22} cy={36 + i * 18} r={3} fill={i < 4 ? '#22c55e' : swatch}/>
            <rect x={32} y={32 + i * 18} width={110} height={3} fill="#111" opacity="0.55"/>
            <rect x={32} y={40 + i * 18} width={80 - i*8} height={2} fill="#111" opacity="0.3"/>
            <text x={w-50} y={38 + i * 18} fontFamily="ui-monospace, monospace" fontSize="8" fill="#111" opacity="0.6">0.{94-i} ✓</text>
          </g>
        ))}
      </svg>
    );
  }

  if (kind === 'offer') {
    return (
      <svg {...common}>
        <rect width={w} height={h} fill="#111"/>
        <text x={14} y={22} fontFamily="ui-monospace, monospace" fontSize="9" fill={swatch} letterSpacing="1.5">GRAND SLAM OFFER</text>
        <text x={14} y={48} fontFamily="Georgia, serif" fontSize="15" fontWeight="700" fill="#fff">Get 3 clients in 30 days</text>
        <text x={14} y={68} fontFamily="Georgia, serif" fontSize="15" fontWeight="700" fill={swatch}>or we work free for 60.</text>
        {['+ 9 bonus trainings  ($1,940)','+ Weekly 1:1 for 90 days ($3,000)','+ Swipe file & templates  ($500)'].map((row, i) => (
          <text key={i} x={14} y={92 + i * 14} fontFamily="ui-monospace, monospace" fontSize="9" fill="#D8D8D8">{row}</text>
        ))}
        <text x={14} y={146} fontFamily="ui-monospace, monospace" fontSize="9" fill={swatch}>TOTAL $5,440 · TODAY $497</text>
      </svg>
    );
  }

  if (kind === 'pseo') {
    return (
      <svg {...common}>
        <rect width={w} height={h} fill="#FAFAFA"/>
        <text x={14} y={18} fontFamily="ui-monospace, monospace" fontSize="8" fill="#444" letterSpacing="1.5">50 PROGRAMMATIC PAGES · INDEXED</text>
        {Array.from({length: 50}).map((_, i) => {
          const col = i % 10, row = Math.floor(i/10);
          return <rect key={i} x={14 + col * 24} y={32 + row * 24} width={18} height={18} fill={i < 42 ? swatch : '#ccc'} opacity={0.4 + (i%3)*0.2}/>;
        })}
        <text x={14} y={148} fontFamily="ui-monospace, monospace" fontSize="9" fill="#111">avg rank 14.2 · 42 of 50 in top 20</text>
      </svg>
    );
  }

  if (kind === 'clip') {
    return (
      <svg {...common}>
        <rect width={w} height={h} fill="#0E0E13"/>
        {[0,1,2].map(i => (
          <g key={i}>
            <rect x={14 + i * 82} y={16} width={72} height={112} rx={6} fill={swatch} opacity={0.5 + i*0.15}/>
            <rect x={14 + i * 82} y={16} width={72} height={112} rx={6} fill="none" stroke="#fff" opacity="0.3"/>
            <polygon points={`${44 + i*82},${62} ${44 + i*82},${82} ${60 + i*82},${72}`} fill="#fff"/>
            <rect x={14 + i * 82} y={134} width={50} height={3} fill="#fff" opacity="0.6"/>
          </g>
        ))}
        <text x={14} y={150} fontFamily="ui-monospace, monospace" fontSize="8" fill={swatch} letterSpacing="1.2">30 CLIPS · CAPTIONS + HOOKS</text>
      </svg>
    );
  }

  if (kind === 'brand') {
    return (
      <svg {...common}>
        <rect width={w} height={h} fill="#fff"/>
        <rect x={0} y={0} width={w} height={h/2} fill={swatch}/>
        <text x={14} y={36} fontFamily="Georgia, serif" fontSize="28" fontWeight="700" fontStyle="italic" fill="#fff">dahlia.</text>
        <text x={14} y={54} fontFamily="ui-monospace, monospace" fontSize="8" fill="#fff" opacity="0.8" letterSpacing="1.5">MINI BRAND SYSTEM</text>
        {['#2A2A2A','#E8532B','#F6F5F0','#1C8C5E'].map((c, i) => (
          <rect key={i} x={14 + i * 40} y={h/2 + 16} width={32} height={32} fill={c} stroke="#111" strokeOpacity="0.1"/>
        ))}
        <text x={14} y={h - 12} fontFamily="Georgia, serif" fontSize="11" fontStyle="italic" fill="#111">Editorial New · GT America</text>
      </svg>
    );
  }

  if (kind === 'webinar') {
    return (
      <svg {...common}>
        <rect width={w} height={h} fill="#fff"/>
        <text x={14} y={20} fontFamily="ui-monospace, monospace" fontSize="8" fill={swatch} letterSpacing="1.5">PERFECT WEBINAR · 60 MIN</text>
        {['00:00  Hook + promise','05:00  One thing','18:00  Three secrets','42:00  Stack slide','55:00  Close'].map((row, i) => (
          <g key={i}>
            <circle cx={20} cy={42 + i * 20} r={3} fill={swatch}/>
            <text x={30} y={45 + i * 20} fontFamily="ui-monospace, monospace" fontSize="10" fill="#111">{row}</text>
          </g>
        ))}
      </svg>
    );
  }

  if (kind === 'shortlist') {
    return (
      <svg {...common}>
        <rect width={w} height={h} fill="#0E0E13"/>
        <text x={14} y={18} fontFamily="ui-monospace, monospace" fontSize="8" fill={swatch} letterSpacing="1.5">SHORTLIST · 00:18</text>
        {[
          ['1.', '@aperture', '0.91'],
          ['2.', '@funnelsmith', '0.84'],
          ['3.', '@helios', '0.78'],
          ['4.', '@closer', '0.71'],
          ['5.', '@north', '0.69'],
        ].map(([n, h_, s], i) => (
          <g key={i}>
            <text x={14} y={40 + i * 20} fontFamily="ui-monospace, monospace" fontSize="11" fill="#7CE7A6">{n}</text>
            <text x={36} y={40 + i * 20} fontFamily="ui-monospace, monospace" fontSize="11" fill="#D8D8D8">{h_}</text>
            <text x={w - 50} y={40 + i * 20} fontFamily="ui-monospace, monospace" fontSize="11" fill={swatch}>{s}</text>
          </g>
        ))}
      </svg>
    );
  }

  if (kind === 'digest') {
    return (
      <svg {...common}>
        <rect width={w} height={h} fill="#FAF7F0"/>
        <text x={14} y={20} fontFamily="ui-monospace, monospace" fontSize="8" fill={swatch} letterSpacing="1.5">WEEKLY DIGEST · APR 22</text>
        <text x={14} y={44} fontFamily="Georgia, serif" fontSize="22" fontWeight="700" fill="#111">12 runs · $482 spent</text>
        {['▮ @aperture   $149  · 40 ads delivered','▮ @funnelsmith $249 · VSL script','▮ @helios     $ 89  · competitor memo','▮ @triage-01  $ 22  · 68 tickets'].map((row, i) => (
          <text key={i} x={14} y={72 + i * 16} fontFamily="ui-monospace, monospace" fontSize="9" fill="#111">{row}</text>
        ))}
      </svg>
    );
  }

  // fallback
  return (
    <svg {...common}>
      <rect width={w} height={h} fill="#EEE"/>
      <text x={w/2} y={h/2} fontFamily="ui-monospace, monospace" fontSize="10" fill="#666" textAnchor="middle">sample</text>
    </svg>
  );
}

// ============ COMPONENTS ============

// Score chip (e.g. "96" in a pill, color by tier)
function ScoreChip({ score, T, type, small }) {
  const color = score >= 92 ? '#1C8C5E' : score >= 85 ? '#C98B20' : '#A14A4A';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: small ? '1px 6px' : '2px 8px', borderRadius: 3,
      background: color + '18', border: `1px solid ${color}44`,
      fontFamily: type.mono, fontSize: small ? 9.5 : 10.5, fontWeight: 700, color,
      letterSpacing: 0.5,
    }}>
      <span style={{ opacity: 0.7 }}>JUDGE</span> {score}
    </div>
  );
}

// Single portfolio card
function PortfolioCard({ item, agent, T, type, compact }) {
  return (
    <div style={{
      background: T.panel, border: `1px solid ${T.line}`, borderRadius: 8,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <ArtifactThumb kind={item.kind} T={T} type={type} swatch={agent.swatch} height={compact ? 120 : 160}/>
      <div style={{ padding: compact ? '10px 12px 12px' : '12px 14px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
          <div style={{ fontSize: compact ? 12 : 13, color: T.text, fontWeight: 500, lineHeight: 1.35, textWrap: 'balance' }}>
            {item.title}
          </div>
          <ScoreChip score={item.score} T={T} type={type} small={compact}/>
        </div>
        <div style={{ fontFamily: type.mono, fontSize: compact ? 9.5 : 10.5, color: T.textFaint, letterSpacing: 0.3 }}>
          {item.when} · {fmtDur(item.ms)}
        </div>
      </div>
    </div>
  );
}

// Full portfolio strip (for agent detail)
function PortfolioSection({ agent, T, type }) {
  const items = PORTFOLIO[agent.id] || [];
  if (items.length === 0) return null;
  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontFamily: type.display, fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>
          Sample work
        </h3>
        <div style={{ fontFamily: type.mono, fontSize: 10.5, color: T.textDim, letterSpacing: 0.3 }}>
          {items.length} artifacts · rated by LLM judge on delivery
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)`, gap: 12 }}>
        {items.map((it, i) => <PortfolioCard key={i} item={it} agent={agent} T={T} type={type}/>)}
      </div>
      <div style={{ marginTop: 10, fontFamily: type.mono, fontSize: 10.5, color: T.textFaint, letterSpacing: 0.3 }}>
        Every agent's portfolio starts with <b style={{ color: T.textDim }}>benchmark runs</b> during onboarding — same briefs across all agents, same judge. Real runs after that.
      </div>
    </section>
  );
}

// Inline sample for agent cards — single thumbnail
function PortfolioPeek({ agent, T, type, height = 80 }) {
  const first = (PORTFOLIO[agent.id] || [])[0];
  if (!first) return null;
  return (
    <div style={{ position: 'relative', borderRadius: 6, overflow: 'hidden' }}>
      <ArtifactThumb kind={first.kind} T={T} type={type} swatch={agent.swatch} height={height}/>
      <div style={{
        position: 'absolute', top: 6, right: 6,
      }}>
        <ScoreChip score={first.score} T={T} type={type} small/>
      </div>
    </div>
  );
}

function fmtDur(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = (m / 60).toFixed(1);
  return `${h} hr`;
}

Object.assign(window, { PORTFOLIO, ArtifactThumb, ScoreChip, PortfolioCard, PortfolioSection, PortfolioPeek });
