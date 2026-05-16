// theme.jsx — theme tokens & shared primitives for MarketingHire.ai

// Four accent palettes
const ACCENTS = {
  ember:  { name: 'Ember',  hex: '#E8532B', ok: 'oklch(0.68 0.18 38)' },
  kelp:   { name: 'Kelp',   hex: '#1C8C5E', ok: 'oklch(0.58 0.14 160)' },
  cobalt: { name: 'Cobalt', hex: '#2E5CE5', ok: 'oklch(0.58 0.18 260)' },
  violet: { name: 'Violet', hex: '#7B3FF2', ok: 'oklch(0.62 0.22 300)' },
};

// Typography pairs
const TYPE_PAIRS = {
  editorial: {
    name: 'Editorial',
    display: '"Instrument Serif", "Cormorant Garamond", Georgia, serif',
    body: '"Inter Tight", ui-sans-serif, system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
    googleFonts: 'family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500',
  },
  swiss: {
    name: 'Swiss',
    display: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
    body: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
    googleFonts: 'family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500',
  },
  terminal: {
    name: 'Terminal',
    display: '"Berkeley Mono", "JetBrains Mono", ui-monospace, monospace',
    body: '"JetBrains Mono", ui-monospace, monospace',
    mono: '"JetBrains Mono", ui-monospace, monospace',
    googleFonts: 'family=JetBrains+Mono:wght@400;500;600;700',
  },
  gamified: {
    name: 'Arcade',
    display: '"Unbounded", "Space Grotesk", ui-sans-serif, sans-serif',
    body: '"Inter Tight", ui-sans-serif, system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
    googleFonts: 'family=Unbounded:wght@500;700;800&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500',
  },
};

// Light / dark tokens
function themeTokens(mode, accentKey) {
  const accent = ACCENTS[accentKey];
  if (mode === 'dark') {
    return {
      mode,
      bg: '#0B0B0D',
      bgSub: '#121216',
      panel: '#17171C',
      panelSoft: '#1C1C22',
      text: '#F2F2F0',
      textDim: '#9A9AA2',
      textFaint: '#55555C',
      line: '#26262C',
      lineSoft: '#1E1E24',
      accent: accent.hex,
      accentOk: accent.ok,
      accentText: '#fff',
      success: '#4ADE80',
      warn: '#F5B849',
      danger: '#EF4444',
    };
  }
  return {
    mode,
    bg: '#F6F5F0',
    bgSub: '#EDEBE3',
    panel: '#FFFFFF',
    panelSoft: '#FAF9F4',
    text: '#111114',
    textDim: '#575760',
    textFaint: '#9A9AA2',
    line: '#E5E2D8',
    lineSoft: '#EFEDE4',
    accent: accent.hex,
    accentOk: accent.ok,
    accentText: '#fff',
    success: '#138A5A',
    warn: '#B07A14',
    danger: '#C03434',
  };
}

// Tier system
const TIERS = {
  bronze:  { label: 'Bronze',  fg: '#8B5A2B', bg: 'rgba(139,90,43,0.12)' },
  silver:  { label: 'Silver',  fg: '#6B7280', bg: 'rgba(107,114,128,0.14)' },
  gold:    { label: 'Gold',    fg: '#B07A14', bg: 'rgba(176,122,20,0.14)' },
  diamond: { label: 'Diamond', fg: '#1F6FE0', bg: 'rgba(31,111,224,0.14)' },
};

// ------- shared primitives -------

function AvailabilityDot({ online, size = 8 }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size, borderRadius: '50%',
      background: online ? '#22c55e' : '#d4a017',
      boxShadow: online ? '0 0 0 3px rgba(34,197,94,0.18)' : '0 0 0 3px rgba(212,160,23,0.2)',
      flexShrink: 0,
    }}/>
  );
}

function Pulse({ color = '#22c55e', size = 10 }) {
  return (
    <span style={{ position: 'relative', width: size, height: size, display: 'inline-block', flexShrink: 0 }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: color, opacity: 0.35, animation: 'mh-pulse 1.8s ease-out infinite',
      }}/>
      <span style={{
        position: 'absolute', inset: 2, borderRadius: '50%', background: color,
      }}/>
    </span>
  );
}

function TierChip({ tier, T }) {
  const t = TIERS[tier] || TIERS.bronze;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 8px', borderRadius: 999,
      background: t.bg, color: t.fg,
      fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 600,
    }}>
      <svg width="8" height="8" viewBox="0 0 8 8"><polygon points="4,0 8,4 4,8 0,4" fill={t.fg}/></svg>
      {t.label}
    </span>
  );
}

function Stars({ rating, color = '#111', size = 11 }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[0,1,2,3,4].map(i => {
        const fill = i < full ? color : (i === full && half ? color : 'transparent');
        const stroke = color;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 12 12">
            <polygon points="6,1 7.5,4.5 11.5,4.8 8.3,7.3 9.3,11 6,9 2.7,11 3.7,7.3 0.5,4.8 4.5,4.5"
              fill={i === full && half ? `url(#half${i})` : fill}
              stroke={stroke} strokeWidth="0.6"/>
            {i === full && half && (
              <defs>
                <linearGradient id={`half${i}`} x1="0" x2="1">
                  <stop offset="50%" stopColor={color}/>
                  <stop offset="50%" stopColor="transparent"/>
                </linearGradient>
              </defs>
            )}
          </svg>
        );
      })}
    </span>
  );
}

function Verified({ color = '#1F6FE0', size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
      <path d="M8 1l1.8 1.4 2.3-.2.6 2.2 2 1.2-.9 2.1.9 2.1-2 1.2-.6 2.2-2.3-.2L8 15l-1.8-1.4-2.3.2-.6-2.2-2-1.2.9-2.1L1.3 6l2-1.2.6-2.2 2.3.2L8 1z" fill={color}/>
      <path d="M5.5 8l1.7 1.7 3.3-3.4" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Sparkline for agent runs/momentum
function Spark({ data = [3,5,4,7,6,9,8,11,10,14,12,17,15,20,22], color = '#111', width = 80, height = 24 }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v,i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

// Compact placeholder "sample output" card
function SampleOutput({ agent, T, mono, style = {} }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 6,
      background: `linear-gradient(135deg, ${agent.swatch}14, ${agent.swatch}06)`,
      border: `1px solid ${agent.swatch}28`,
      fontFamily: mono, fontSize: 10.5, lineHeight: 1.5,
      color: T.text, whiteSpace: 'pre-wrap', letterSpacing: 0.2,
      ...style,
    }}>
      <div style={{ fontSize: 9, letterSpacing: 1.2, color: agent.swatch, fontWeight: 600, marginBottom: 6 }}>
        SAMPLE OUTPUT · {agent.handle}
      </div>
      {agent.sample}
    </div>
  );
}

// Abstract "agent portrait" — deterministic geo shape per agent
function AgentPortrait({ agent, size = 44, T }) {
  const seed = agent.id.charCodeAt(0) + agent.id.charCodeAt(1 % agent.id.length);
  const kind = seed % 4;
  const bg = agent.swatch;
  const fg = '#ffffff';
  return (
    <div style={{
      width: size, height: size, flexShrink: 0, borderRadius: 6,
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <svg width={size} height={size} viewBox="0 0 44 44" style={{ position: 'absolute', inset: 0 }}>
        {kind === 0 && <>
          <circle cx="22" cy="22" r="14" fill="none" stroke={fg} strokeOpacity="0.5" strokeWidth="1"/>
          <circle cx="22" cy="22" r="6" fill={fg}/>
        </>}
        {kind === 1 && <>
          <rect x="8" y="8" width="28" height="28" fill="none" stroke={fg} strokeOpacity="0.35" strokeWidth="1"/>
          <rect x="14" y="14" width="16" height="16" fill={fg}/>
        </>}
        {kind === 2 && <>
          <polygon points="22,6 38,22 22,38 6,22" fill="none" stroke={fg} strokeOpacity="0.4" strokeWidth="1"/>
          <polygon points="22,14 30,22 22,30 14,22" fill={fg}/>
        </>}
        {kind === 3 && <>
          <path d="M6 22 Q22 6 38 22 Q22 38 6 22 Z" fill="none" stroke={fg} strokeOpacity="0.35" strokeWidth="1"/>
          <circle cx="22" cy="22" r="5" fill={fg}/>
        </>}
      </svg>
      <div style={{
        position: 'absolute', right: 3, bottom: 3, fontSize: Math.max(8, size * 0.18),
        fontFamily: 'ui-monospace, monospace', color: fg, opacity: 0.85, letterSpacing: 0.5,
      }}>{agent.name.slice(0,2).toUpperCase()}</div>
    </div>
  );
}

// Number formatting
function fmt(n) {
  if (n == null) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toLocaleString();
}

function price(n) {
  if (n < 1) return `$${n.toFixed(2)}`;
  if (n % 1 === 0) return `$${n}`;
  return `$${n.toFixed(2)}`;
}

Object.assign(window, {
  ACCENTS, TYPE_PAIRS, themeTokens, TIERS,
  AvailabilityDot, Pulse, TierChip, Stars, Verified, Spark,
  SampleOutput, AgentPortrait, fmt, price,
});
