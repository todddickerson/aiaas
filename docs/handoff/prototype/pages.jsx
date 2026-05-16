// pages.jsx — Publish Agent + Dashboard for AIaaS.com
// Publish = full self-serve walkthrough: Spec → Integrations → Runtime → Pricing → Go Live

// ============ PUBLISH YOUR AGENT ============
function PublishPage({ T, type, goto }) {
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState({
    // Identity
    name: '',
    handle: '',
    persona: '',
    tagline: '',
    category: 'ads',
    accent: '#E8532B',
    // Spec (English)
    spec: `To do great ad creative for you, I need:

- The product or service you're selling (URL or 1-paragraph description)
- Who's buying it — be specific about job/life stage, not just age bracket
- 2-3 examples of ad copy or brand voice you admire (optional but helpful)
- Any claims I CAN'T make (compliance, regulated industries, etc.)
- Angle preferences: I default to curiosity + specificity. Tell me if you want fear, status, humor, etc.

I will not make up statistics. If you want numbers, give me source material. Otherwise I'll write around the data.`,
    // Integrations (Composio)
    integrations: ['slack', 'notion'],
    // Runtime
    runtime: 'claude',
    byoKind: 'mcp',
    byoUrl: '',
    // Pricing
    tier1Name: '10 ad hooks + headlines',
    tier1Price: 49,
    tier1Time: '8 min',
    tier2Name: '40 static ad variants',
    tier2Price: 149,
    tier2Time: '30 min',
    tier3Name: 'Launch kit (ads + landing)',
    tier3Price: 299,
    tier3Time: '2 hr',
    // Policies
    followups: '2revisions',
    allowStream: true,
    allowNotifyOperator: true,
    notifyRoute: 'client',
    revShare: 70,
    sample: '',
  });
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const stepLabels = ['Identity', 'Spec', 'Integrations', 'Runtime', 'Benchmark', 'Pricing & policies', 'Next Steps', 'Go live'];

  return (
    <div style={{ fontFamily: type.body, color: T.text }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 32px 24px' }}>
        <button onClick={() => goto('browse')} style={{
          all: 'unset', cursor: 'pointer', fontFamily: type.mono, fontSize: 11,
          color: T.textDim, marginBottom: 20, display: 'inline-block', letterSpacing: 0.5,
        }}>← back to marketplace</button>

        <div style={{ fontFamily: type.mono, fontSize: 11, letterSpacing: 1.5, color: T.accent, fontWeight: 600, marginBottom: 14 }}>
          ── PUBLISH · SELF-SERVE · NO HUMAN REQUIRED
        </div>
        <h1 style={{ margin: 0, fontFamily: type.display, fontSize: 'clamp(44px, 6.5vw, 68px)', fontWeight: 700, letterSpacing: -1.3, lineHeight: 1.12, textWrap: 'balance' }}>
          Ship your agent <span style={{ fontStyle: type.name === 'Editorial' ? 'italic' : 'normal' }}>in an afternoon.</span>
        </h1>
        <p style={{ fontSize: 16, color: T.textDim, maxWidth: 680, marginTop: 28, lineHeight: 1.55, textWrap: 'pretty' }}>
          Write your spec. Declare the tools you touch. Pick a runtime. Set prices. Go live — no integration call, no sales team, no approval queue. You earn {form.revShare}% of every execution.
        </p>

        {/* stepper */}
        <div style={{ display: 'flex', gap: 0, marginTop: 36, borderBottom: `1px solid ${T.line}`, overflowX: 'auto' }}>
          {stepLabels.map((label, i) => (
            <button key={i} onClick={() => setStep(i+1)} style={{
              all: 'unset', cursor: 'pointer',
              padding: '14px 20px', fontFamily: type.mono, fontSize: 11, letterSpacing: 0.8,
              color: step === i+1 ? T.text : T.textDim,
              borderBottom: step === i+1 ? `2px solid ${T.accent}` : '2px solid transparent',
              marginBottom: -1, whiteSpace: 'nowrap',
            }}>
              <span style={{ color: T.textFaint, marginRight: 8 }}>{String(i+1).padStart(2,'0')}</span>
              {label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 80px',
        display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 40, alignItems: 'start' }}>
        <div style={{ padding: '28px 0' }}>
          {step === 1 && <StepIdentity form={form} update={update} T={T} type={type}/>}
          {step === 2 && <StepSpec form={form} update={update} T={T} type={type}/>}
          {step === 3 && <StepIntegrations form={form} update={update} T={T} type={type}/>}
          {step === 4 && <StepRuntime form={form} update={update} T={T} type={type}/>}
          {step === 5 && <StepBenchmark form={form} update={update} T={T} type={type}/>}
          {step === 6 && <StepPricing form={form} update={update} T={T} type={type}/>}
          {step === 7 && (typeof NextStepsPublishStep !== 'undefined' ? <NextStepsPublishStep T={T} type={type}/> : null)}
          {step === 8 && <StepGoLive form={form} T={T} type={type} goto={goto}/>}

          {step < 8 && (
            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
              {step > 1 ? (
                <button onClick={() => setStep(step-1)} style={{
                  all: 'unset', cursor: 'pointer', padding: '12px 20px',
                  border: `1px solid ${T.line}`, borderRadius: 8,
                  fontSize: 13, color: T.text, fontFamily: type.body,
                }}>← back</button>
              ) : <span/>}
              <button onClick={() => setStep(step+1)} style={{
                padding: '12px 22px', background: T.text, color: T.panel, border: 'none',
                borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: type.body,
              }}>Continue → {stepLabels[step]?.toLowerCase()}</button>
            </div>
          )}
        </div>

        {/* Sticky live preview */}
        <div style={{ position: 'sticky', top: 100, padding: '28px 0' }}>
          <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.textFaint, marginBottom: 10 }}>
            LIVE PREVIEW · how buyers see you
          </div>
          <PreviewCard form={form} T={T} type={type}/>
          <PublishChecklist form={form} T={T} type={type} step={step}/>
        </div>
      </div>
    </div>
  );
}

function PublishChecklist({ form, T, type, step }) {
  const checks = [
    { k: 'identity', done: !!form.name && !!form.tagline, label: 'Identity', stepN: 1 },
    { k: 'spec', done: form.spec.length > 40, label: 'Spec written', stepN: 2 },
    { k: 'integrations', done: form.integrations.length > 0, label: `${form.integrations.length} integration${form.integrations.length !== 1 ? 's' : ''} declared`, stepN: 3 },
    { k: 'runtime', done: form.runtime === 'byo' ? !!form.byoUrl : true, label: `Runtime: ${form.runtime}${form.runtime === 'byo' ? ` (${form.byoKind})` : ''}`, stepN: 4 },
    { k: 'benchmark', done: !!form.benchmarkPassed, label: form.benchmarkPassed ? `Benchmark: avg ${form.benchmarkScore || 0}/100` : 'Benchmark pending', stepN: 5 },
    { k: 'pricing', done: form.tier1Price > 0, label: `Pricing $${form.tier1Price}–$${form.tier3Price}`, stepN: 6 },
    { k: 'nextsteps', done: true, label: 'Next Steps declared', stepN: 7 },
  ];
  return (
    <div style={{ marginTop: 14, padding: 14, background: T.panelSoft, borderRadius: 8, border: `1px solid ${T.lineSoft}`, fontFamily: type.mono, fontSize: 11, color: T.textDim, lineHeight: 1.6 }}>
      <div style={{ color: T.text, fontWeight: 600, marginBottom: 8, display: 'flex', justifyContent: 'space-between', fontFamily: type.body, fontSize: 12 }}>
        <span>Pre-flight</span>
        <span style={{ fontFamily: type.mono, fontSize: 10, color: T.textFaint }}>{checks.filter(c => c.done).length} / {checks.length}</span>
      </div>
      {checks.map(c => (
        <div key={c.k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0',
          color: step === c.stepN ? T.text : T.textDim }}>
          <span style={{ color: c.done ? T.success : T.textFaint, fontFamily: type.body, fontSize: 13 }}>
            {c.done ? '✓' : '○'}
          </span>
          <span>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

function FormField({ label, hint, children, T, type }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 0.8, color: T.textDim, textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: T.textFaint, marginTop: 6, lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}

function Input({ T, type, ...p }) {
  return <input {...p} style={{
    width: '100%', boxSizing: 'border-box',
    padding: '11px 14px', background: T.panel, border: `1px solid ${T.line}`, borderRadius: 6,
    color: T.text, fontFamily: type.body, fontSize: 14, outline: 'none',
    ...p.style,
  }}/>;
}

function TextArea({ T, type, ...p }) {
  return <textarea {...p} style={{
    width: '100%', boxSizing: 'border-box',
    padding: '11px 14px', background: T.panel, border: `1px solid ${T.line}`, borderRadius: 6,
    color: T.text, fontFamily: type.body, fontSize: 14, outline: 'none', resize: 'vertical',
    minHeight: 80, lineHeight: 1.5,
    ...p.style,
  }}/>;
}

// ============ STEP 1 — IDENTITY ============
function StepIdentity({ form, update, T, type }) {
  return (
    <div>
      <h2 style={{ margin: '0 0 8px 0', fontFamily: type.display, fontSize: 28, fontWeight: 600 }}>
        Who is your agent?
      </h2>
      <p style={{ color: T.textDim, fontSize: 14, marginBottom: 28 }}>
        Give it a name, a face, and a single sentence that tells buyers what it does better than anyone.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormField label="Agent name" T={T} type={type}>
          <Input T={T} type={type} value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Aperture Studio"/>
        </FormField>
        <FormField label="Handle" T={T} type={type}>
          <Input T={T} type={type} value={form.handle} onChange={e => update('handle', e.target.value)} placeholder="@yourname"/>
        </FormField>
      </div>

      <FormField label="One-line persona" hint="Short descriptor. Shows under the name." T={T} type={type}>
        <Input T={T} type={type} value={form.persona} onChange={e => update('persona', e.target.value)} placeholder="Ad creative — copy + imagery"/>
      </FormField>

      <FormField label="Tagline" hint="Max 140 chars. What does it ship, for whom, how fast?" T={T} type={type}>
        <TextArea T={T} type={type} value={form.tagline} onChange={e => update('tagline', e.target.value.slice(0, 140))} placeholder="Meta &amp; TikTok ad variants at scale. 40 creative angles per brief."/>
        <div style={{ textAlign: 'right', fontFamily: type.mono, fontSize: 10, color: T.textFaint, marginTop: 4 }}>
          {form.tagline.length} / 140
        </div>
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <FormField label="Category" T={T} type={type}>
          <select value={form.category} onChange={e => update('category', e.target.value)} style={{
            width: '100%', padding: '11px 14px', background: T.panel, border: `1px solid ${T.line}`, borderRadius: 6,
            color: T.text, fontFamily: type.body, fontSize: 14, outline: 'none',
          }}>
            {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </FormField>
        <FormField label="Accent color" T={T} type={type}>
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            {['#E8532B', '#1C8C5E', '#2E5CE5', '#7B3FF2', '#C98B20', '#2A2A2A'].map(c => (
              <button key={c} onClick={() => update('accent', c)} style={{
                all: 'unset', cursor: 'pointer', width: 28, height: 28, borderRadius: '50%', background: c,
                boxShadow: form.accent === c ? `0 0 0 2px ${T.panel}, 0 0 0 4px ${T.text}` : 'none',
              }}/>
            ))}
          </div>
        </FormField>
      </div>
    </div>
  );
}

// ============ STEP 2 — SPEC (ENGLISH) ============
function StepSpec({ form, update, T, type }) {
  const itemCount = form.spec.split('\n').filter(l => l.trim().startsWith('-')).length;
  return (
    <div>
      <h2 style={{ margin: '0 0 8px 0', fontFamily: type.display, fontSize: 28, fontWeight: 600 }}>
        Write your spec — in English.
      </h2>
      <p style={{ color: T.textDim, fontSize: 14, marginBottom: 24, lineHeight: 1.55 }}>
        Describe what you need from a client like you'd explain it to a junior teammate. An LLM compiles this into a live brief validator — no JSON, no form builders. Use <code style={{ fontFamily: type.mono, fontSize: 12, background: T.panelSoft, padding: '1px 6px', borderRadius: 3 }}>- bullet points</code> for required items.
      </p>

      <FormField label="Agent spec" hint={`${itemCount} required items detected · updates compile live`} T={T} type={type}>
        <TextArea
          T={T} type={type}
          value={form.spec}
          onChange={e => update('spec', e.target.value)}
          style={{ fontFamily: type.mono, fontSize: 12.5, lineHeight: 1.6, minHeight: 320 }}
        />
      </FormField>

      <div style={{ padding: 14, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, fontSize: 13, lineHeight: 1.55 }}>
        <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: T.success, fontWeight: 700, marginBottom: 6 }}>
          ✓ VALIDATOR COMPILED
        </div>
        <div style={{ color: T.text }}>
          Every buyer's brief will be compared against your {itemCount} required items before payment. Vague briefs get rejected with specific reasons — not "please fill required fields."
        </div>
      </div>
    </div>
  );
}

// ============ STEP 3 — INTEGRATIONS (COMPOSIO) ============
function StepIntegrations({ form, update, T, type }) {
  const catalog = [
    { id: 'slack', name: 'Slack', scope: 'post messages', color: '#4A154B' },
    { id: 'notion', name: 'Notion', scope: 'create pages', color: '#000' },
    { id: 'figma', name: 'Figma', scope: 'write frames', color: '#F24E1E' },
    { id: 'meta', name: 'Meta Ads', scope: 'paused drafts', color: '#0866FF' },
    { id: 'google', name: 'Google Ads', scope: 'paused drafts', color: '#34A853' },
    { id: 'drive', name: 'Google Drive', scope: 'upload files', color: '#1FA463' },
    { id: 'github', name: 'GitHub', scope: 'open PRs', color: '#24292E' },
    { id: 'hubspot', name: 'HubSpot', scope: 'draft sequences', color: '#FF7A59' },
    { id: 'shopify', name: 'Shopify', scope: 'draft products', color: '#96BF48' },
    { id: 'linear', name: 'Linear', scope: 'create issues', color: '#5E6AD2' },
    { id: 'webhook', name: 'Webhook', scope: 'any endpoint', color: '#6B7280' },
    { id: 'email', name: 'Email', scope: 'send results', color: '#E14B4B' },
  ];
  const toggle = (id) => {
    const has = form.integrations.includes(id);
    update('integrations', has ? form.integrations.filter(x => x !== id) : [...form.integrations, id]);
  };
  return (
    <div>
      <h2 style={{ margin: '0 0 8px 0', fontFamily: type.display, fontSize: 28, fontWeight: 600 }}>
        Declare the tools your agent touches.
      </h2>
      <p style={{ color: T.textDim, fontSize: 14, marginBottom: 10, lineHeight: 1.55 }}>
        We broker every client's OAuth through Composio v3. You write zero auth code. Pick what your agent needs — clients grant per-agent access at hire time.
      </p>
      <div style={{ marginBottom: 22, padding: 12, background: T.panelSoft, border: `1px solid ${T.lineSoft}`, borderRadius: 8, fontFamily: type.mono, fontSize: 11.5, color: T.textDim, lineHeight: 1.55 }}>
        <b style={{ color: T.text }}>Isolation:</b> one Composio project per agent. Clients revoke yours without touching other agents. If your agent is deprecated, its access dies with it. You never hold client secrets.
      </div>

      <FormField label={`Selected · ${form.integrations.length}`} hint="Toggle to add / remove. Every scope shown to buyers before they hire." T={T} type={type}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {catalog.map(t => {
            const active = form.integrations.includes(t.id);
            return (
              <button key={t.id} onClick={() => toggle(t.id)} style={{
                all: 'unset', cursor: 'pointer', padding: '12px 14px',
                background: active ? T.panel : T.panelSoft,
                border: `1px solid ${active ? T.accent : T.lineSoft}`,
                borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10,
                transition: 'all .12s',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 5, background: t.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontFamily: type.mono, fontSize: 10, fontWeight: 700,
                }}>{t.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{t.name}</div>
                  <div style={{ fontFamily: type.mono, fontSize: 10, color: T.textDim }}>{t.scope}</div>
                </div>
                <span style={{ color: active ? T.accent : T.textFaint, fontSize: 14 }}>
                  {active ? '●' : '○'}
                </span>
              </button>
            );
          })}
        </div>
      </FormField>
    </div>
  );
}

// ============ STEP 4 — RUNTIME ============
function StepRuntime({ form, update, T, type }) {
  const runtimes = [
    { id: 'claude', name: 'Claude', sub: 'Anthropic Skills + MCP', best: 'Long-form, research, analysis' },
    { id: 'openai', name: 'ChatGPT Agents', sub: 'GPTs + Assistants API', best: 'Multimodal, broad coverage' },
    { id: 'hermes', name: 'Hermes', sub: 'Nous Research open-weights', best: 'Cost-sensitive volume' },
    { id: 'manus', name: 'Manus', sub: 'Autonomous browser', best: 'Research, data collection' },
    { id: 'openclaw', name: 'OpenClaw', sub: 'Open-source multi-model', best: 'Deep custom logic' },
    { id: 'byo', name: 'Bring your own', sub: 'MCP / OpenAPI / webhook / Python', best: 'Proprietary or legacy' },
  ];
  const byoKinds = [
    ['mcp', 'MCP server'],
    ['openapi', 'OpenAPI spec'],
    ['webhook', 'Webhook URL'],
    ['python', 'Python function'],
  ];
  return (
    <div>
      <h2 style={{ margin: '0 0 8px 0', fontFamily: type.display, fontSize: 28, fontWeight: 600 }}>
        Pick a runtime.
      </h2>
      <p style={{ color: T.textDim, fontSize: 14, marginBottom: 24, lineHeight: 1.55 }}>
        Runtime is orthogonal to your spec and your integrations. Switch any time without rewriting a thing. We manage the hosted ones; BYO for proprietary work.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {runtimes.map(r => {
          const active = form.runtime === r.id;
          return (
            <button key={r.id} onClick={() => update('runtime', r.id)} style={{
              all: 'unset', cursor: 'pointer', padding: 16,
              background: active ? T.panel : T.panelSoft,
              border: `1px solid ${active ? T.accent : T.lineSoft}`,
              borderRadius: 10, transition: 'all .12s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 600, fontFamily: type.display }}>{r.name}</div>
                <span style={{ color: active ? T.accent : T.textFaint, fontSize: 16 }}>{active ? '●' : '○'}</span>
              </div>
              <div style={{ fontFamily: type.mono, fontSize: 10.5, color: T.textDim, marginBottom: 8 }}>
                {r.sub}
              </div>
              <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.4 }}>
                <b style={{ color: T.text }}>Best for</b> · {r.best}
              </div>
            </button>
          );
        })}
      </div>

      {form.runtime === 'byo' && (
        <div style={{ padding: 18, background: T.panelSoft, border: `1px solid ${T.lineSoft}`, borderRadius: 10 }}>
          <div style={{ fontFamily: type.mono, fontSize: 10.5, letterSpacing: 1, color: T.textDim, marginBottom: 10 }}>
            BYO · CONNECT YOUR AGENT
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {byoKinds.map(([k, l]) => {
              const active = form.byoKind === k;
              return (
                <button key={k} onClick={() => update('byoKind', k)} style={{
                  all: 'unset', cursor: 'pointer',
                  padding: '6px 12px', borderRadius: 6,
                  background: active ? T.text : T.panel,
                  color: active ? T.panel : T.text,
                  border: `1px solid ${active ? T.text : T.line}`,
                  fontSize: 12, fontFamily: type.body,
                }}>{l}</button>
              );
            })}
          </div>
          <FormField label={`${form.byoKind} endpoint`} hint="We POST briefs here. Must return structured output within SLA." T={T} type={type}>
            <Input T={T} type={type} value={form.byoUrl} onChange={e => update('byoUrl', e.target.value)}
              placeholder={form.byoKind === 'mcp' ? 'https://your-agent.com/mcp' : form.byoKind === 'openapi' ? 'https://your-agent.com/openapi.json' : form.byoKind === 'webhook' ? 'https://your-agent.com/api/v1/execute' : 'github.com/you/agent/main.py'}/>
          </FormField>
        </div>
      )}
    </div>
  );
}

// ============ STEP 5 — BENCHMARK (LLM-as-judge test runs) ============
function StepBenchmark({ form, update, T, type }) {
  const [running, setRunning] = React.useState(false);
  const [done, setDone] = React.useState(!!form.benchmarkPassed);
  const [progress, setProgress] = React.useState(done ? 4 : 0);

  const BRIEFS = [
    { n: 1, label: 'Standard brief', prompt: 'E-commerce beauty brand · 10 ad hooks · $97 product · audience: post-partum moms', judge: 'Specificity + voice match + no fabricated claims', expected: '~2 min' },
    { n: 2, label: 'Edge-case brief', prompt: 'Regulated claim — supplement · must cite source or refuse', judge: 'Compliance refusal OR sourced claim. No middle ground.', expected: '~90 sec' },
    { n: 3, label: 'Ambiguous brief', prompt: '"Make me something viral." No target, no product. Must clarify.', judge: 'Clarifying questions asked, not hallucinated answers', expected: '~45 sec' },
    { n: 4, label: 'Repeat brief', prompt: 'Same as brief 1 · 24h later · different seed', judge: 'Consistency of quality + non-duplicate output', expected: '~2 min' },
  ];

  const SCORES = [
    { brief: 1, score: 93, verdict: 'passed', notes: 'Hooks specific, voice matched, zero fabricated stats.' },
    { brief: 2, score: 88, verdict: 'passed', notes: 'Agent correctly refused and asked for source material.' },
    { brief: 3, score: 91, verdict: 'passed', notes: 'Asked 3 clarifying questions before any output.' },
    { brief: 4, score: 90, verdict: 'passed', notes: 'Same quality, different angles. No repeats.' },
  ];

  const avg = Math.round(SCORES.reduce((a, b) => a + b.score, 0) / SCORES.length);

  const runBenchmark = () => {
    setRunning(true);
    setProgress(0);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setProgress(i);
      if (i >= BRIEFS.length) {
        clearInterval(iv);
        setRunning(false);
        setDone(true);
        update('benchmarkPassed', true);
        update('benchmarkScore', avg);
      }
    }, 900);
  };

  return (
    <div>
      <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.4, color: T.accent, fontWeight: 600, marginBottom: 10 }}>
        ── STEP 05 · BENCHMARK
      </div>
      <h3 style={{ margin: '0 0 10px 0', fontFamily: type.display, fontSize: 24, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.1 }}>
        Prove you can do the work.
      </h3>
      <p style={{ fontSize: 14, color: T.textDim, lineHeight: 1.55, margin: '0 0 20px', maxWidth: 620, textWrap: 'pretty' }}>
        Before you go live, we send your agent four test briefs — one standard, one edge-case, one ambiguous, one repeat. An LLM judge scores each response on the rubric for your category. Passing submissions are stored as your public portfolio. Every agent on AIaaS has gone through this.
      </p>

      {/* Status panel */}
      <div style={{
        padding: '16px 20px', background: T.panelSoft, border: `1px solid ${T.line}`, borderRadius: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
      }}>
        <div>
          <div style={{ fontFamily: type.mono, fontSize: 10.5, letterSpacing: 0.8, color: T.textDim, textTransform: 'uppercase', marginBottom: 4 }}>
            Status
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>
            {!done && !running && 'Ready to benchmark · 4 briefs queued'}
            {running && `Running brief ${progress + 1} of 4 · judge watching...`}
            {done && <>Passed · avg score <span style={{ color: T.accent }}>{avg}/100</span> · portfolio saved</>}
          </div>
        </div>
        {!done && (
          <button onClick={runBenchmark} disabled={running} style={{
            padding: '10px 18px', background: running ? T.textFaint : T.text, color: T.panel, border: 'none',
            borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: running ? 'wait' : 'pointer', fontFamily: type.body,
          }}>{running ? 'Running...' : 'Run benchmark →'}</button>
        )}
        {done && (
          <div style={{ fontFamily: type.mono, fontSize: 11, color: '#1C8C5E', letterSpacing: 0.8 }}>✓ BENCHMARK CLEARED</div>
        )}
      </div>

      {/* Briefs list */}
      <div style={{ border: `1px solid ${T.line}`, borderRadius: 10, overflow: 'hidden', background: T.panel }}>
        {BRIEFS.map((b, i) => {
          const isActive = running && progress === i;
          const isDone = i < progress || done;
          const result = SCORES[i];
          return (
            <div key={b.n} style={{
              padding: '14px 18px', borderBottom: i < BRIEFS.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
              display: 'grid', gridTemplateColumns: '40px 1fr 120px', gap: 14, alignItems: 'start',
              background: isActive ? `${T.accent}08` : 'transparent',
              transition: 'background .3s',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: isDone ? '#1C8C5E' : isActive ? T.accent : T.line,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: type.mono, fontSize: 11, fontWeight: 700,
              }}>{isDone ? '✓' : b.n}</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text, marginBottom: 3 }}>
                  Brief {b.n} · {b.label}
                </div>
                <div style={{ fontFamily: type.mono, fontSize: 11, color: T.textDim, marginBottom: 4 }}>
                  {b.prompt}
                </div>
                <div style={{ fontSize: 11.5, color: T.textFaint, lineHeight: 1.4 }}>
                  <b style={{ color: T.textDim }}>Judge rubric:</b> {b.judge}
                </div>
                {isDone && result && (
                  <div style={{ marginTop: 8, padding: '8px 10px', background: T.bgSub, borderRadius: 6, fontSize: 11.5, color: T.text, fontFamily: type.mono, lineHeight: 1.4 }}>
                    → {result.notes}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', fontFamily: type.mono, fontSize: 11 }}>
                {isDone && result ? (
                  <>
                    <div style={{ fontSize: 18, fontWeight: 700, color: result.score >= 90 ? '#1C8C5E' : '#C98B20', fontFamily: type.display }}>
                      {result.score}
                    </div>
                    <div style={{ color: T.textFaint, fontSize: 9.5, letterSpacing: 0.5, textTransform: 'uppercase' }}>judge · 100</div>
                  </>
                ) : (
                  <div style={{ color: T.textFaint, fontSize: 10, letterSpacing: 0.3 }}>{b.expected}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rules */}
      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: 12, color: T.textDim }}>
        <div style={{ padding: 12, border: `1px solid ${T.lineSoft}`, borderRadius: 8 }}>
          <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 0.8, color: T.text, fontWeight: 600, marginBottom: 4 }}>THRESHOLD</div>
          Pass = avg ≥ 80/100 with <b style={{ color: T.text }}>no brief below 70</b>.
        </div>
        <div style={{ padding: 12, border: `1px solid ${T.lineSoft}`, borderRadius: 8 }}>
          <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 0.8, color: T.text, fontWeight: 600, marginBottom: 4 }}>RETRIES</div>
          Fail? Fix spec/runtime, retry in 24h. 3 tries max.
        </div>
        <div style={{ padding: 12, border: `1px solid ${T.lineSoft}`, borderRadius: 8 }}>
          <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 0.8, color: T.text, fontWeight: 600, marginBottom: 4 }}>ONGOING</div>
          Every 30 days we re-benchmark. Sliding window keeps scores honest.
        </div>
      </div>

      {done && (
        <div style={{ marginTop: 20, padding: '14px 18px', background: `#1C8C5E14`, border: `1px solid #1C8C5E44`, borderRadius: 8 }}>
          <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: '#1C8C5E', fontWeight: 700, marginBottom: 4 }}>
            ✓ PORTFOLIO SEEDED
          </div>
          <div style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>
            Four benchmark artifacts + their judge scores are now on your public profile. Buyers see them before they hire.
          </div>
        </div>
      )}
    </div>
  );
}

// ============ STEP 6 — PRICING & POLICIES ============
function StepPricing({ form, update, T, type }) {
  const tiers = [
    ['tier1', 'Basic', 'Quickest, cheapest version'],
    ['tier2', 'Pro', 'Standard offer'],
    ['tier3', 'Enterprise', 'Deepest, most thorough'],
  ];
  const followupOptions = [
    { id: 'none', label: 'No follow-ups', sub: 'One-shot delivery' },
    { id: 'clarify', label: '1 clarifying round', sub: 'Pre-exec, ≤3 Qs' },
    { id: '2revisions', label: '2 revisions included', sub: 'Post-delivery' },
    { id: 'async', label: 'Async messaging', sub: '+35% · ongoing thread' },
  ];
  return (
    <div>
      <h2 style={{ margin: '0 0 8px 0', fontFamily: type.display, fontSize: 28, fontWeight: 600 }}>
        Set prices. Set policies.
      </h2>
      <p style={{ color: T.textDim, fontSize: 14, marginBottom: 24, lineHeight: 1.55 }}>
        Three tiers, one focused offer each. Pick a follow-up policy — affects the "revisions" badge and what the LLM referee allows mid-run.
      </p>

      {tiers.map(([k, label, hint], idx) => (
        <div key={k} style={{
          padding: 18, border: `1px solid ${T.line}`, borderRadius: 10, marginBottom: 12,
          background: T.panel,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <div>
              <span style={{ fontFamily: type.display, fontSize: 18, fontWeight: 600 }}>{label}</span>
              <span style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: T.textFaint, marginLeft: 10 }}>TIER {idx+1}</span>
            </div>
            <span style={{ fontSize: 12, color: T.textDim }}>{hint}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginTop: 12 }}>
            <FormField label="Offer name" T={T} type={type}>
              <Input T={T} type={type} value={form[k+'Name']} onChange={e => update(k+'Name', e.target.value)}/>
            </FormField>
            <FormField label="Price ($)" T={T} type={type}>
              <Input T={T} type={type} type="number" value={form[k+'Price']} onChange={e => update(k+'Price', Number(e.target.value))}/>
            </FormField>
            <FormField label="Typical SLA" T={T} type={type}>
              <Input T={T} type={type} value={form[k+'Time']} onChange={e => update(k+'Time', e.target.value)}/>
            </FormField>
          </div>
        </div>
      ))}

      <FormField label="Follow-up policy" hint="Shown as a badge on your agent card. Affects pricing auto-calc." T={T} type={type}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {followupOptions.map(o => {
            const active = form.followups === o.id;
            return (
              <button key={o.id} onClick={() => update('followups', o.id)} style={{
                all: 'unset', cursor: 'pointer', padding: '10px 14px',
                background: active ? T.panel : T.panelSoft,
                border: `1px solid ${active ? T.accent : T.lineSoft}`,
                borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ color: active ? T.accent : T.textFaint, fontSize: 14 }}>{active ? '●' : '○'}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{o.label}</div>
                  <div style={{ fontFamily: type.mono, fontSize: 10.5, color: T.textDim }}>{o.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </FormField>

      {/* stream_progress */}
      <div style={{
        marginTop: 8, marginBottom: 12, padding: 18,
        background: 'rgba(34,197,94,0.05)', border: `1px solid ${T.success || '#22c55e'}40`, borderRadius: 10,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.success || '#22c55e', fontWeight: 700, marginBottom: 4 }}>
              LIVE TRACE
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Stream progress via <code style={{ fontFamily: type.mono, fontSize: 13 }}>stream_progress()</code></div>
          </div>
          <button onClick={() => update('allowStream', !form.allowStream)} style={{
            all: 'unset', cursor: 'pointer',
            width: 44, height: 24, borderRadius: 999,
            background: form.allowStream ? (T.success || '#22c55e') : T.lineSoft,
            position: 'relative', flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', top: 2, left: form.allowStream ? 22 : 2,
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}/>
          </button>
        </div>
        <p style={{ margin: '0 0 10px 0', fontSize: 13, color: T.textDim, lineHeight: 1.55 }}>
          Stream structured events (tool calls, shell commands, reads/writes, milestones) to a terminal-style feed buyers can watch live. Turns the wait into trust — and gives you free observability. <b style={{ color: T.text }}>Optional. Per-run or per-spec.</b>
        </p>
        {form.allowStream && (
          <div style={{
            marginTop: 8, padding: 12, borderRadius: 6,
            background: '#0B0D0C', color: '#7FD48F', fontFamily: type.mono, fontSize: 11.5, lineHeight: 1.6,
          }}>
            <div style={{ color: '#7FD48F' }}>&gt; stream.ready · kind: tool | shell | read | write | log | milestone</div>
            <div style={{ color: '#4F7F5F' }}>&gt; buyers see: live terminal feed · replayable post-delivery</div>
          </div>
        )}
      </div>

      {/* notify_operator */}
      <div style={{
        marginTop: 8, padding: 18,
        background: 'rgba(233,83,43,0.05)', border: `1px solid ${T.accent}40`, borderRadius: 10,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.accent, fontWeight: 700, marginBottom: 4 }}>
              THE ESCAPE HATCH
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Allow <code style={{ fontFamily: type.mono, fontSize: 13 }}>notify_operator()</code></div>
          </div>
          <button onClick={() => update('allowNotifyOperator', !form.allowNotifyOperator)} style={{
            all: 'unset', cursor: 'pointer',
            width: 44, height: 24, borderRadius: 999,
            background: form.allowNotifyOperator ? T.accent : T.lineSoft,
            position: 'relative', flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', top: 2, left: form.allowNotifyOperator ? 22 : 2,
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}/>
          </button>
        </div>
        <p style={{ margin: '0 0 12px 0', fontSize: 13, color: T.textDim, lineHeight: 1.55 }}>
          For the rare case that needs a human — JWT scope approval, legal sign-off, federated-tenant SSO. Your agent pauses, an operator resolves, the run resumes with the resolution attached. <b style={{ color: T.text }}>The only allowed human-in-the-loop primitive.</b>
        </p>
        {form.allowNotifyOperator && (
          <div>
            <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 0.8, color: T.textDim, marginBottom: 6, textTransform: 'uppercase' }}>
              Default route
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                ['client', 'Client\'s operator', 'Buyer-side Slack / email'],
                ['platform', 'Our ops team', 'AIaaS.com staff'],
                ['self', 'You', 'Agent builder'],
              ].map(([k, l, s]) => {
                const active = form.notifyRoute === k;
                return (
                  <button key={k} onClick={() => update('notifyRoute', k)} style={{
                    all: 'unset', cursor: 'pointer', flex: 1,
                    padding: '10px 12px', borderRadius: 6,
                    background: active ? T.panel : 'transparent',
                    border: `1px solid ${active ? T.accent : T.lineSoft}`,
                    textAlign: 'left',
                  }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{l}</div>
                    <div style={{ fontFamily: type.mono, fontSize: 10, color: T.textDim, marginTop: 2 }}>{s}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <FormField label="Sample output" hint="A short, representative sample. Shown on your profile." T={T} type={type} style={{ marginTop: 20 }}>
        <TextArea T={T} type={type} value={form.sample} onChange={e => update('sample', e.target.value)}
          placeholder={'AD HOOK\n"The 3-word email that made $2M"'}
          style={{ fontFamily: type.mono, fontSize: 12 }}/>
      </FormField>
    </div>
  );
}

// ============ STEP 6 — GO LIVE ============
function StepGoLive({ form, T, type, goto }) {
  const [published, setPublished] = React.useState(false);
  const [agentId] = React.useState(() => 'ag_' + Math.random().toString(36).slice(2, 10));

  if (published) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', background: form.accent,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 36, marginBottom: 20,
        }}>✓</div>
        <h2 style={{ margin: '0 0 6px 0', fontFamily: type.display, fontSize: 32, fontWeight: 600 }}>
          {form.name || 'Your agent'} is live.
        </h2>
        <div style={{ fontSize: 14, color: T.textDim, marginBottom: 24 }}>
          Agent ID <code style={{ fontFamily: type.mono, background: T.panelSoft, padding: '2px 8px', borderRadius: 4 }}>{agentId}</code>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => goto('browse')} style={{
            padding: '12px 22px', background: T.text, color: T.panel, border: 'none',
            borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: type.body,
          }}>View in marketplace →</button>
          <button onClick={() => goto('dashboard')} style={{
            padding: '12px 22px', background: 'transparent', color: T.text,
            border: `1px solid ${T.line}`, borderRadius: 8, fontSize: 14, fontWeight: 500,
            cursor: 'pointer', fontFamily: type.body,
          }}>Builder dashboard</button>
        </div>
      </div>
    );
  }

  const summaryRow = (label, value, ok = true) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${T.lineSoft}` }}>
      <div style={{ fontFamily: type.mono, fontSize: 10.5, letterSpacing: 0.8, color: T.textDim, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, color: T.text }}>{value}</span>
        <span style={{ color: ok ? T.success : T.textFaint, fontSize: 13 }}>{ok ? '✓' : '○'}</span>
      </div>
    </div>
  );

  return (
    <div>
      <h2 style={{ margin: '0 0 8px 0', fontFamily: type.display, fontSize: 28, fontWeight: 600 }}>
        Review & go live.
      </h2>
      <p style={{ color: T.textDim, fontSize: 14, marginBottom: 24, lineHeight: 1.55 }}>
        No sales call. No approval queue. One click and you're in the marketplace in ~90 seconds.
      </p>

      <div style={{ padding: 20, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 10, marginBottom: 18 }}>
        <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: T.textFaint, marginBottom: 10 }}>SUMMARY</div>
        {summaryRow('Identity', `${form.name || '—'} · ${form.persona || '—'}`, !!form.name)}
        {summaryRow('Spec', `${form.spec.split('\n').filter(l => l.trim().startsWith('-')).length} required items`, form.spec.length > 40)}
        {summaryRow('Integrations', `${form.integrations.length} tool${form.integrations.length !== 1 ? 's' : ''} · Composio-brokered`, form.integrations.length > 0)}
        {summaryRow('Runtime', form.runtime === 'byo' ? `BYO · ${form.byoKind}` : form.runtime, form.runtime !== 'byo' || !!form.byoUrl)}
        {summaryRow('Pricing', `$${form.tier1Price} / $${form.tier2Price} / $${form.tier3Price}`, form.tier1Price > 0)}
        {summaryRow('Follow-up policy', form.followups, true)}
        {summaryRow('stream_progress', form.allowStream ? 'on · live trace visible to buyers' : 'off', true)}
        {summaryRow('notify_operator', form.allowNotifyOperator ? `on · routes to ${form.notifyRoute}` : 'off', true)}
      </div>

      <FormField label="Payout account" hint="USDC on Base/Solana, or Stripe Connect. Stripe onboarding is embedded — no call required." T={T} type={type}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{
            flex: 1, padding: '12px 16px', background: T.panel, border: `1px solid ${T.line}`,
            borderRadius: 6, fontSize: 13, fontFamily: type.body, cursor: 'pointer', color: T.text,
          }}>Connect Stripe →</button>
          <button style={{
            flex: 1, padding: '12px 16px', background: T.panel, border: `1px solid ${T.line}`,
            borderRadius: 6, fontSize: 13, fontFamily: type.body, cursor: 'pointer', color: T.text,
          }}>Use crypto wallet →</button>
        </div>
      </FormField>

      <div style={{ padding: 16, background: T.panelSoft, borderRadius: 10, border: `1px solid ${T.lineSoft}`, marginBottom: 20 }}>
        <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: T.textDim, marginBottom: 8 }}>TERMS</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6, color: T.text }}>
          <li>You keep <b>{form.revShare}%</b> of every execution.</li>
          <li>Refunds pulled from your balance if LLM-refereed brief ships off-target (historically under 4% of runs).</li>
          <li>Agent deranked if SLA missed on 3+ consecutive runs.</li>
          <li>Update spec, integrations, runtime, or pricing any time — no re-review.</li>
        </ul>
      </div>

      <button onClick={() => setPublished(true)} style={{
        width: '100%', padding: 16,
        background: form.accent, color: '#fff', border: 'none',
        borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: type.body,
        boxShadow: `0 4px 0 ${form.accent}99`,
      }}>
        Publish {form.name || 'agent'} to AIaaS.com →
      </button>
    </div>
  );
}

// ============ PREVIEW CARD ============
function PreviewCard({ form, T, type }) {
  return (
    <div style={{
      background: T.panel, border: `1px solid ${T.line}`, borderRadius: 4, padding: 22,
      fontFamily: type.body, color: T.text,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ fontFamily: type.mono, fontSize: 9.5, letterSpacing: 1.3, color: T.textDim, textTransform: 'uppercase' }}>
          № NEW · {form.category}
        </div>
        <span style={{ padding: '3px 8px', borderRadius: 999, background: 'rgba(139,90,43,0.14)', color: '#8B5A2B',
          fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 600 }}>
          BRONZE
        </span>
      </div>
      <h3 style={{
        margin: '14px 0 6px', fontFamily: type.display, fontWeight: 400,
        fontSize: 30, lineHeight: 1.08, letterSpacing: -0.5,
      }}>
        {form.name || 'Agent name'}
      </h3>
      <div style={{ fontFamily: type.display, fontStyle: 'italic', fontSize: 13.5, color: T.textDim, marginBottom: 12 }}>
        {form.persona || 'one-line persona'}
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.5, color: T.text, margin: '0 0 14px 0' }}>
        {form.tagline || 'your tagline will appear here — a single sentence selling the outcome.'}
      </p>
      {form.integrations.length > 0 && (
        <div style={{ marginBottom: 14, padding: '8px 10px', background: T.panelSoft, borderRadius: 6, fontFamily: type.mono, fontSize: 10.5, color: T.textDim, letterSpacing: 0.3 }}>
          ships to · {form.integrations.slice(0, 4).join(' · ')}{form.integrations.length > 4 ? ` +${form.integrations.length - 4}` : ''}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: type.mono, fontSize: 8.5, letterSpacing: 0.9, color: T.textFaint, textTransform: 'uppercase' }}>From</div>
          <div style={{ fontFamily: type.display, fontSize: 22 }}>${form.tier1Price}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: type.mono, fontSize: 10.5, color: T.textDim }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }}/>
          new · 0 in queue
        </div>
      </div>
    </div>
  );
}

// ============ DASHBOARD ============
function DashboardPage({ T, type, goto, hiredIds }) {
  const seededRuns = [
    { agent: 'aperture', service: '40 static ad variants', price: 149, at: '4m ago', status: 'delivered', out: '40 / 40 variants' },
    { agent: 'helios', service: 'Competitor teardown (5 cos)', price: 89, at: '2h ago', status: 'delivered', out: 'memo.pdf · 14pg' },
    { agent: 'funnelsmith', service: 'Hook-Story-Offer teardown', price: 79, at: 'yesterday', status: 'delivered', out: 'doc + audio' },
    { agent: 'triage-01', service: 'Classify + draft reply', price: 0.08, at: '3d ago', status: 'delivered', out: '412 tickets' },
    { agent: 'aperture', service: '10 ad hooks + headlines', price: 49, at: 'now', status: 'running', out: null, progress: 0.62 },
  ];

  const spent = seededRuns.reduce((s, r) => s + r.price, 0);

  return (
    <div style={{ fontFamily: type.body, color: T.text }}>
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '36px 32px 24px' }}>
        <button onClick={() => goto('browse')} style={{
          all: 'unset', cursor: 'pointer', fontFamily: type.mono, fontSize: 11,
          color: T.textDim, marginBottom: 18, display: 'inline-block',
        }}>← back to marketplace</button>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: type.mono, fontSize: 11, letterSpacing: 1.5, color: T.accent, fontWeight: 600, marginBottom: 10 }}>
              ── YOUR EXECUTIONS
            </div>
            <h1 style={{ margin: 0, fontFamily: type.display, fontSize: 48, fontWeight: 700, letterSpacing: -1 }}>
              Dashboard
            </h1>
            <div style={{ color: T.textDim, fontSize: 14, marginTop: 6 }}>
              {seededRuns.length} executions · {seededRuns.filter(r => r.status === 'running').length} running now
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            {[
              ['Spent this month', `$${spent.toFixed(2)}`],
              ['Agents hired', new Set(seededRuns.map(r => r.agent)).size],
              ['Avg turnaround', '18 min'],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: '14px 20px', background: T.panel, border: `1px solid ${T.line}`, borderRadius: 10 }}>
                <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: T.textFaint, textTransform: 'uppercase' }}>{k}</div>
                <div style={{ fontFamily: type.display, fontSize: 22, fontWeight: 700, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '16px 32px 0' }}>
        {typeof NextStepsQueue !== 'undefined' && <NextStepsQueue T={T} type={type} goto={goto}/>}
      </div>

      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '16px 32px 60px', display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 24 }}>
        <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Recent executions</div>
            <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: T.textDim }}>REAL-TIME</div>
          </div>
          {seededRuns.map((r, i) => {
            const agent = AGENTS.find(a => a.id === r.agent);
            if (!agent) return null;
            return (
              <div key={i} style={{ padding: '14px 20px', borderBottom: i < seededRuns.length - 1 ? `1px solid ${T.lineSoft}` : 'none',
                display: 'grid', gridTemplateColumns: '40px 1.2fr 1.4fr 80px 120px', gap: 16, alignItems: 'center' }}>
                <AgentPortrait agent={agent} size={36} T={T}/>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{agent.name}</div>
                  <div style={{ fontFamily: type.mono, fontSize: 11, color: T.textDim }}>{r.service}</div>
                </div>
                <div>
                  {r.status === 'running' ? (
                    <div>
                      <div style={{ fontFamily: type.mono, fontSize: 11, color: T.accent, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Pulse color={T.accent} size={6}/> RUNNING · {Math.floor(r.progress * 100)}%
                      </div>
                      <div style={{ height: 4, background: T.lineSoft, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${r.progress * 100}%`, height: '100%', background: T.accent }}/>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 12, color: T.textDim, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: T.success }}>✓</span> {r.out}
                      </div>
                      <div style={{ fontFamily: type.mono, fontSize: 10, color: T.textFaint, marginTop: 2 }}>{r.at}</div>
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: type.display, fontSize: 16, fontWeight: 600 }}>${r.price < 1 ? r.price.toFixed(2) : r.price}</div>
                <button style={{
                  all: 'unset', cursor: 'pointer', fontSize: 12, color: T.text,
                  padding: '6px 12px', border: `1px solid ${T.line}`, borderRadius: 6, textAlign: 'center',
                }}>{r.status === 'running' ? 'Watch live →' : 'View output →'}</button>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 18, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Spending — last 7 days</div>
            <MiniChart T={T} type={type}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: type.mono, fontSize: 11, color: T.textDim }}>
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>

          <div style={{ padding: 18, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Connected agents</div>
            <div style={{ fontSize: 12, color: T.textDim, marginBottom: 12, lineHeight: 1.45 }}>
              Per-agent Composio scope. Revoke any without touching the others.
            </div>
            {['aperture', 'funnelsmith', 'helios'].map(id => {
              const a = AGENTS.find(x => x.id === id);
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: `1px solid ${T.lineSoft}` }}>
                  <AgentPortrait agent={a} size={28} T={T}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</div>
                    <div style={{ fontFamily: type.mono, fontSize: 10, color: T.textDim }}>slack · notion · meta</div>
                  </div>
                  <button style={{ all: 'unset', cursor: 'pointer', fontSize: 11, color: T.textDim, fontFamily: type.mono }}>
                    revoke
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ padding: 18, background: T.panelSoft, border: `1px solid ${T.lineSoft}`, borderRadius: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Have your own agent?</div>
            <div style={{ fontSize: 12.5, color: T.textDim, lineHeight: 1.5, marginBottom: 12 }}>
              Publish it in an afternoon. Earn 70%. No sales call.
            </div>
            <button onClick={() => goto('publish')} style={{
              padding: '8px 14px', background: T.text, color: T.panel, border: 'none',
              borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: type.body,
            }}>Publish an agent →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniChart({ T, type }) {
  const data = [24, 89, 142, 76, 298, 189, 149];
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 100 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, position: 'relative', height: '100%' }}>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: `${(v / max) * 100}%`,
            background: i === data.length - 1 ? T.accent : T.text,
            opacity: i === data.length - 1 ? 1 : 0.85,
            borderRadius: '3px 3px 0 0',
          }}/>
          <div style={{
            position: 'absolute', bottom: `${(v / max) * 100}%`,
            left: 0, right: 0, textAlign: 'center',
            fontFamily: type.mono, fontSize: 9, color: T.textDim, marginBottom: 2,
          }}>${v}</div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { PublishPage, DashboardPage });
