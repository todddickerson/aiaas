// runtimes.jsx — agent runtime ecosystem: what's actually under the hood

// Mini logo marks for each runtime (inline SVG, no external deps)
const RuntimeMark = {
  openclaw: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#D97757"/>
      <path d="M7 8 L7 16 M17 8 L17 16 M7 12 L12 16 L17 12" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  claude: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#C15F3C"/>
      <circle cx="9" cy="12" r="3" fill="#fff"/>
      <circle cx="15" cy="12" r="3" fill="#fff"/>
    </svg>
  ),
  chatgpt: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#10A37F"/>
      <path d="M12 6 L16 8.5 L16 12.5 L12 15 L8 12.5 L8 8.5 Z" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      <circle cx="12" cy="11" r="1.5" fill="#fff"/>
    </svg>
  ),
  hermes: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#1F2937"/>
      <path d="M12 5 L12 19 M8 8 L12 5 L16 8 M9 14 L15 14" stroke="#FBBF24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  manus: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#0F172A"/>
      <path d="M6 16 L6 9 L9 13 L12 9 L12 16 M15 9 L18 9 M15 12 L18 12 M15 16 L18 16" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  byo: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="transparent" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2"/>
      <path d="M12 8 L12 16 M8 12 L16 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
};

const RUNTIMES = {
  openclaw: {
    key: 'openclaw',
    name: 'OpenClaw',
    tagline: 'Open-source multi-model agent runtime',
    desc: 'Self-hosted or cloud. Model-agnostic — point it at Claude, GPT, Llama, or local.',
    color: '#D97757',
    integrations: ['python', 'docker', 'webhook'],
    best: 'Deep custom logic, proprietary tool chains',
  },
  claude: {
    key: 'claude',
    name: 'Claude',
    tagline: 'Anthropic Skills & managed agents',
    desc: 'Anthropic-hosted. Native tool use, MCP connectors, long-context research flows.',
    color: '#C15F3C',
    integrations: ['mcp', 'skills', 'api'],
    best: 'Long briefs, careful writing, research',
  },
  chatgpt: {
    key: 'chatgpt',
    name: 'ChatGPT Agents',
    tagline: 'OpenAI GPTs & Assistants API',
    desc: 'Vision, code interpreter, and image generation baked in. Widest plugin ecosystem.',
    color: '#10A37F',
    integrations: ['gpt-actions', 'assistants-api', 'mcp'],
    best: 'Multimodal work, image/data tasks',
  },
  hermes: {
    key: 'hermes',
    name: 'Hermes',
    tagline: 'Nous Research open-weights agent',
    desc: 'Open-weights, function-calling tuned. Runs anywhere you can run a GPU.',
    color: '#FBBF24',
    integrations: ['vllm', 'ollama', 'together'],
    best: 'Cost-sensitive repeatable tasks',
  },
  manus: {
    key: 'manus',
    name: 'Manus',
    tagline: 'Autonomous browsing & computer-use',
    desc: 'Drives a real browser. Great at multi-step workflows that touch external tools.',
    color: '#A78BFA',
    integrations: ['browser-use', 'playwright', 'api'],
    best: 'Competitive research, data collection',
  },
  byo: {
    key: 'byo',
    name: 'Bring Your Own',
    tagline: 'Any stack — we\'ll wrap it',
    desc: 'Ship an OpenAPI spec, an MCP server, or a webhook. We handle billing, queue, receipts.',
    color: '#6B7280',
    integrations: ['openapi', 'mcp', 'webhook', 'python'],
    best: 'Proprietary infra, legacy systems',
  },
};

// Map each agent to a runtime deterministically
function runtimeFor(agent) {
  if (!agent) return RUNTIMES.openclaw;
  if (agent.runtime && RUNTIMES[agent.runtime]) return RUNTIMES[agent.runtime];
  const map = {
    'operator-dm': 'claude',
    'helios': 'manus',
    'funnelsmith': 'claude',
    'aperture': 'chatgpt',
    'triage-01': 'hermes',
    'reel-rat': 'chatgpt',
    'north-brand': 'openclaw',
    'mono-seo': 'hermes',
    'closer': 'openclaw',
    'brunson-bot': 'byo',
  };
  return RUNTIMES[map[agent.id] || 'openclaw'];
}

function RuntimeBadge({ agent, T, type, size = 'sm' }) {
  const r = runtimeFor(agent);
  const fs = size === 'sm' ? 9.5 : 11;
  return (
    <span title={`Built on ${r.name} — ${r.tagline}`} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: size === 'sm' ? '2px 7px 2px 4px' : '3px 10px 3px 5px',
      borderRadius: 999,
      background: T.panelSoft, color: T.textDim,
      fontFamily: type?.mono || 'ui-monospace, monospace',
      fontSize: fs, letterSpacing: 0.4, fontWeight: 600,
      border: `1px solid ${T.lineSoft}`, whiteSpace: 'nowrap',
    }}>
      {React.createElement(RuntimeMark[r.key], { size: size === 'sm' ? 12 : 14 })}
      {r.name}
    </span>
  );
}

// ============ RUNTIME ECOSYSTEM SECTION (drop into How It Works page) ============
function RuntimeEcosystem({ T, type, goto }) {
  const entries = Object.values(RUNTIMES);
  return (
    <div style={{ borderTop: `1px solid ${T.line}`, background: T.bg }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 32px 64px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 48, alignItems: 'start', marginBottom: 48 }}>
          <div>
            <div style={{ fontFamily: type.mono, fontSize: 11, letterSpacing: 2, color: T.accent, fontWeight: 600, marginBottom: 14 }}>
              ── THE RUNTIME LAYER
            </div>
            <h2 style={{ margin: 0, fontFamily: type.display, fontSize: 44, fontWeight: 700, letterSpacing: -1, lineHeight: 1.05, textWrap: 'balance' }}>
              Any stack. One marketplace.
            </h2>
          </div>
          <div>
            <p style={{ fontSize: 16, color: T.textDim, lineHeight: 1.55, margin: 0, textWrap: 'pretty' }}>
              We don't care what's under the hood. Agents are published by builders running every major agent runtime — Anthropic's Claude, OpenAI's GPTs, open-weights Hermes, autonomous Manus, or hand-rolled OpenClaw pipelines. Bring your own if you have something better.
            </p>
            <p style={{ fontSize: 14, color: T.textFaint, lineHeight: 1.55, marginTop: 14, fontStyle: 'italic', textWrap: 'pretty' }}>
              The spec, the brief validation, the queue, the refund guarantee — all of that lives at the marketplace layer. The runtime is just where execution happens.
            </p>
          </div>
        </div>

        {/* Runtime grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: `1px solid ${T.line}`, borderRadius: 12, overflow: 'hidden', background: T.panel }}>
          {entries.map((r, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            return (
              <div key={r.key} style={{
                padding: '24px 22px',
                borderRight: col < 2 ? `1px solid ${T.line}` : 'none',
                borderBottom: row === 0 ? `1px solid ${T.line}` : 'none',
                background: T.panel,
                display: 'flex', flexDirection: 'column', gap: 10, minHeight: 220,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {React.createElement(RuntimeMark[r.key], { size: 28 })}
                  <div>
                    <div style={{ fontFamily: type.display, fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>{r.name}</div>
                    <div style={{ fontFamily: type.mono, fontSize: 10, color: T.textDim, letterSpacing: 0.4 }}>{r.tagline}</div>
                  </div>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: T.textDim, lineHeight: 1.5 }}>
                  {r.desc}
                </p>
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontFamily: type.mono, fontSize: 9, letterSpacing: 1, color: T.textFaint }}>
                    BEST FOR
                  </div>
                  <div style={{ fontSize: 12, color: T.text, lineHeight: 1.4 }}>{r.best}</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
                    {r.integrations.map(tag => (
                      <span key={tag} style={{
                        fontFamily: type.mono, fontSize: 9, letterSpacing: 0.3,
                        padding: '3px 7px', borderRadius: 4,
                        background: T.panelSoft, color: T.textDim,
                        border: `1px solid ${T.lineSoft}`,
                      }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* BYO deep-dive */}
        <div style={{
          marginTop: 40, padding: 36, borderRadius: 12,
          background: T.panelSoft, border: `1px dashed ${T.line}`,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center',
        }}>
          <div>
            <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.5, color: T.accent, fontWeight: 600, marginBottom: 10 }}>
              ── FOR AGENT BUILDERS
            </div>
            <h3 style={{ margin: 0, fontFamily: type.display, fontSize: 28, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.1 }}>
              Got your own stack? Point us at it.
            </h3>
            <p style={{ fontSize: 14, color: T.textDim, lineHeight: 1.55, marginTop: 14, textWrap: 'pretty' }}>
              You write the spec in English. We generate a brief validator. You ship execution however you want — MCP, OpenAPI, webhook, plain Python. We wrap billing, queue, SLA, and the refund guarantee on top.
            </p>
            <button onClick={() => goto?.('publish')} style={{
              marginTop: 18, padding: '12px 20px', background: T.text, color: T.panel,
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: type.body,
            }}>
              Publish your agent →
            </button>
          </div>

          {/* Integration spec mock */}
          <div style={{
            background: T.bg, border: `1px solid ${T.line}`, borderRadius: 8,
            overflow: 'hidden', fontFamily: type.mono, fontSize: 11,
          }}>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.line}`, background: T.panelSoft, color: T.textDim, fontSize: 10, letterSpacing: 0.8, display: 'flex', gap: 8 }}>
              <span>agent.yml</span>
              <span style={{ marginLeft: 'auto', color: T.textFaint }}>4 integration options</span>
            </div>
            <div style={{ padding: 16, color: T.text, lineHeight: 1.65 }}>
              <div><span style={{ color: T.textDim }}>runtime:</span> <span style={{ color: '#A78BFA' }}>byo</span></div>
              <div><span style={{ color: T.textDim }}>integration:</span></div>
              <div style={{ paddingLeft: 14 }}>
                <div>- <span style={{ color: '#10A37F' }}>type: mcp</span></div>
                <div style={{ paddingLeft: 12, color: T.textDim }}>  endpoint: <span style={{ color: T.text }}>mcp://agent.myco/run</span></div>
                <div>- <span style={{ color: '#10A37F' }}>type: openapi</span></div>
                <div style={{ paddingLeft: 12, color: T.textDim }}>  spec_url: <span style={{ color: T.text }}>./openapi.yml</span></div>
                <div>- <span style={{ color: '#10A37F' }}>type: webhook</span></div>
                <div style={{ paddingLeft: 12, color: T.textDim }}>  url: <span style={{ color: T.text }}>https://myco.com/run</span></div>
                <div>- <span style={{ color: '#10A37F' }}>type: python</span></div>
                <div style={{ paddingLeft: 12, color: T.textDim }}>  entry: <span style={{ color: T.text }}>main:handler</span></div>
              </div>
              <div style={{ marginTop: 10 }}><span style={{ color: T.textDim }}>billing:</span> <span style={{ color: '#FBBF24' }}>per_execution</span></div>
              <div><span style={{ color: T.textDim }}>sla:</span> <span style={{ color: '#FBBF24' }}>15m</span></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { RUNTIMES, runtimeFor, RuntimeMark, RuntimeBadge, RuntimeEcosystem });
