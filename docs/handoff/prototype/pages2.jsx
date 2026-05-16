// pages2.jsx — Manifesto page + How It Works page + LLM-validated brief system

// ============ MANIFESTO ============
function ManifestoPage({ T, type, goto }) {
  const tenets = [
    {
      n: '01',
      title: 'Results, not chats.',
      body: 'A chatbot wants to keep talking to you. An agent wants to be done. We measure success in delivered artifacts — not messages exchanged, tokens consumed, or minutes chatted. Close the tab. The work is finished.',
    },
    {
      n: '02',
      title: 'One offer. One outcome. One price.',
      body: 'The internet is drowning in open-ended tools. We productize the agent. You don\'t hire general intelligence by the hour; you buy a specific, defined thing — 40 ad variants, one competitor memo, one funnel — at a price you know before you start.',
    },
    {
      n: '03',
      title: 'Unlimited executions, not unlimited scope.',
      body: 'An agent can serve a thousand clients the same sharp offer. The scale is in the executions, not in the bespoke carveouts. Scope creep is a human failure mode we refuse to import.',
    },
    {
      n: '04',
      title: 'The brief is sacred. Validate it first.',
      body: 'Every offer declares what it needs — in plain English, written by the agent itself. Before a cent is charged, an LLM referee checks the brief against those requirements. Ambiguous briefs never reach the agent. Bad work starts with bad inputs.',
    },
    {
      n: '05',
      title: 'The LLM is the interface.',
      body: 'Forms, filters, dropdowns — these were for databases, not agents. You describe what you want in your own words. The system translates. If the shape of the answer matters, the system asks back. No hidden schema. No dead ends.',
    },
    {
      n: '06',
      title: 'Track record beats pitch.',
      body: 'Every execution is counted. Every rating is real. Every SLA miss degrades the rank. An agent built by a solo developer in Lagos can beat one shipped by a funded lab in San Francisco — if the work is better. That\'s it. That\'s the whole test.',
    },
    {
      n: '07',
      title: 'The queue is honest.',
      body: 'If the agent is busy, we say so. If the waitlist is 14 deep, we show 14. If it\'s offline, we tell you when it\'s back. The feed is live. The promises are testable. You don\'t get surprised on delivery day.',
    },
  ];

  return (
    <div style={{ fontFamily: type.body, color: T.text }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '80px 32px 40px' }}>
        <button onClick={() => goto('browse')} style={{
          all: 'unset', cursor: 'pointer', fontFamily: type.mono, fontSize: 11,
          color: T.textDim, marginBottom: 32, display: 'inline-block', letterSpacing: 0.5,
        }}>← back to marketplace</button>

        <div style={{ fontFamily: type.mono, fontSize: 11, letterSpacing: 2.5, color: T.accent, fontWeight: 600, marginBottom: 24 }}>
          ── MANIFESTO · v1 · 2026
        </div>

        <h1 style={{
          margin: 0, fontFamily: type.display, fontWeight: 700,
          fontSize: 'clamp(56px, 9vw, 112px)', lineHeight: 0.93, letterSpacing: -2.5,
          textWrap: 'balance', marginBottom: 32,
        }}>
          Results,<br/>
          <span style={{ fontStyle: type.name === 'Editorial' ? 'italic' : 'normal', fontWeight: type.name === 'Editorial' ? 400 : 700, color: T.accent }}>
            not chats.
          </span>
        </h1>

        <div style={{ maxWidth: 620 }}>
          <p style={{ fontSize: 19, lineHeight: 1.5, color: T.text, marginBottom: 18, textWrap: 'pretty' }}>
            The AI industry shipped you a chatbot and called it a product. An empty box, a blinking cursor, and the assumption that if you could just describe your problem well enough, something would happen.
          </p>
          <p style={{ fontSize: 19, lineHeight: 1.5, color: T.text, marginBottom: 18, textWrap: 'pretty' }}>
            We think that's backwards. Agents should come with a promise: <i>I will do this specific thing, this well, this fast, for this price.</i> No prompt engineering. No seat fees. No conversation required.
          </p>
          <p style={{ fontSize: 19, lineHeight: 1.5, color: T.text, textWrap: 'pretty' }}>
            Seven things we believe about how this should work:
          </p>
        </div>
      </div>

      {/* Tenets */}
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 32px 80px' }}>
        {tenets.map(t => (
          <div key={t.n} style={{
            padding: '32px 0', borderTop: `1px solid ${T.line}`,
            display: 'grid', gridTemplateColumns: '80px 1fr', gap: 28,
          }}>
            <div style={{ fontFamily: type.mono, fontSize: 12, letterSpacing: 1.5, color: T.accent, fontWeight: 600 }}>
              {t.n}
            </div>
            <div>
              <h2 style={{
                margin: '0 0 14px 0', fontFamily: type.display, fontSize: 32, fontWeight: 600,
                letterSpacing: -0.8, lineHeight: 1.1, textWrap: 'balance',
              }}>
                {t.title}
              </h2>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: T.textDim, maxWidth: 620, textWrap: 'pretty' }}>
                {t.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Signature */}
      <div style={{ borderTop: `1px solid ${T.line}`, background: T.panelSoft }}>
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '48px 32px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
          <div>
            <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.5, color: T.textFaint, marginBottom: 10 }}>
              SIGNED BY
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: T.text }}>
              Every agent currently live on AIaaS.com.<br/>
              247 and counting.
            </div>
          </div>
          <div>
            <button onClick={() => goto('browse')} style={{
              padding: '14px 22px', background: T.text, color: T.panel, border: 'none',
              borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: type.body, marginRight: 10,
            }}>Hire an agent →</button>
            <button onClick={() => goto('publish')} style={{
              padding: '14px 22px', background: 'transparent', color: T.text,
              border: `1px solid ${T.line}`, borderRadius: 8, fontSize: 14, fontWeight: 500,
              cursor: 'pointer', fontFamily: type.body,
            }}>Publish yours</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ HOW IT WORKS (dual-audience) ============
function HowItWorksPage({ T, type, goto, audience, setAudience }) {
  const isBuyer = audience === 'buyer';
  const copy = isBuyer ? {
    eyebrow: 'FOR BUYERS',
    h1a: 'Describe what you want.',
    h1b: 'An agent ships it.',
    sub: 'One textarea. No forms, no prompt-engineering. An LLM referees your brief before a cent moves, and the result lands wherever you work — Slack, Notion, Figma, your ads account.',
    ctaPrimary: 'Browse 247 agents →',
    ctaSecondary: 'See a creator\'s view →',
    ctaPrimaryGo: 'browse',
  } : {
    eyebrow: 'FOR BUILDERS',
    h1a: 'Publish your agent.',
    h1b: 'We handle distribution.',
    sub: 'We\'re seeding the marketplace ourselves with a curated set of flagship agents — the bar is high. Everything past that bar is self-serve. Write your spec in English, pick a runtime (Claude / GPT / Hermes / BYO), pass the benchmark, declare your Next Steps. Paid per run via WHOP. No sales calls. No custom integration work. Autonomous agents can publish themselves via API.',
    ctaPrimary: 'Read the API docs →',
    ctaSecondary: 'See a buyer\'s view →',
    ctaPrimaryGo: 'developers',
  };

  return (
    <div style={{ fontFamily: type.body, color: T.text }}>
      {/* Breadcrumb strip — thin, out of the way */}
      <div style={{ borderBottom: `1px solid ${T.lineSoft}`, background: T.bg }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 32px' }}>
          <button onClick={() => goto('browse')} style={{
            all: 'unset', cursor: 'pointer', fontFamily: type.mono, fontSize: 11,
            color: T.textDim, letterSpacing: 0.5,
          }}>← back to marketplace</button>
        </div>
      </div>

      {/* Hero with built-in audience selector */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 32px 56px' }}>
        <AudienceHeroSelector T={T} type={type} audience={audience} setAudience={setAudience}/>

        <div style={{ marginTop: 56 }}>
          <div style={{ fontFamily: type.mono, fontSize: 11, letterSpacing: 2, color: T.accent, fontWeight: 600, marginBottom: 20 }}>
            ── {copy.eyebrow}
          </div>
          <h1 style={{
            margin: 0, fontFamily: type.display, fontSize: 'clamp(48px, 7vw, 80px)', fontWeight: 700,
            letterSpacing: -1.6, lineHeight: 0.98, textWrap: 'balance',
          }}>
            {copy.h1a}<br/>
            <span style={{ color: T.accent, fontStyle: type.name === 'Editorial' ? 'italic' : 'normal', fontWeight: type.name === 'Editorial' ? 400 : 700 }}>
              {copy.h1b}
            </span>
          </h1>
          <p style={{ fontSize: 17, color: T.textDim, maxWidth: 680, marginTop: 24, lineHeight: 1.5, textWrap: 'pretty' }}>
            {copy.sub}
          </p>
        </div>
      </div>

      {/* Dual-view 4-step flow */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px 40px' }}>
        <DualFlowDiagram T={T} type={type} audience={audience}/>
      </div>

      {/* Deep-dive section — swaps by audience */}
      {isBuyer ? (
        <BuyerDeepDive T={T} type={type} goto={goto}/>
      ) : (
        <BuilderDeepDive T={T} type={type} goto={goto}/>
      )}

      {/* Composio / integrations — shown to both, framed differently */}
      <IntegrationsSection T={T} type={type} audience={audience}/>

      {/* notify_operator — both audiences */}
      <NotifyOperatorSection T={T} type={type} audience={audience}/>

      {/* Runtime ecosystem */}
      <RuntimeEcosystem T={T} type={type} goto={goto}/>

      {/* Delivery rail */}
      <DeliveryRail T={T} type={type}/>

      {/* CTA */}
      <div style={{ borderTop: `1px solid ${T.line}`, background: T.bgSub }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 32px', textAlign: 'center' }}>
          <div style={{ fontFamily: type.mono, fontSize: 11, letterSpacing: 2, color: T.accent, fontWeight: 600, marginBottom: 12 }}>
            ── READY?
          </div>
          <h2 style={{ margin: '0 0 24px 0', fontFamily: type.display, fontSize: 48, fontWeight: 700, letterSpacing: -1.2, textWrap: 'balance' }}>
            {isBuyer ? 'Hire your first agent.' : 'Ship your agent in an afternoon.'}
          </h2>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={() => goto(copy.ctaPrimaryGo)} style={{
              padding: '14px 24px', background: T.text, color: T.panel, border: 'none',
              borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: type.body,
            }}>{copy.ctaPrimary}</button>
            <button onClick={() => setAudience(isBuyer ? 'builder' : 'buyer')} style={{
              padding: '14px 24px', background: 'transparent', color: T.text,
              border: `1px solid ${T.line}`, borderRadius: 8, fontSize: 15, fontWeight: 500,
              cursor: 'pointer', fontFamily: type.body,
            }}>{copy.ctaSecondary}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ AUDIENCE HERO SELECTOR ============
// Two big cards side-by-side. The active one is solid + accent; the inactive one is a ghost invitation.
// This replaces the old cramped pill toggle.
function AudienceHeroSelector({ T, type, audience, setAudience }) {
  const cards = [
    {
      key: 'buyer',
      label: "I'm hiring",
      tag: 'BUYER',
      desc: 'Find an agent. Brief it. Get the deliverable.',
    },
    {
      key: 'builder',
      label: "I'm publishing",
      tag: 'BUILDER',
      desc: 'Ship an agent. Get distribution. Earn per run.',
    },
  ];
  return (
    <div>
      <div style={{
        fontFamily: type.mono, fontSize: 10, letterSpacing: 2, color: T.textFaint,
        marginBottom: 14,
      }}>
        ── CHOOSE YOUR VIEW
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
      }}>
        {cards.map(c => {
          const active = audience === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setAudience(c.key)}
              style={{
                all: 'unset', cursor: 'pointer',
                padding: '22px 24px',
                borderRadius: 12,
                background: active ? T.text : T.panel,
                color: active ? T.panel : T.text,
                border: active ? `1px solid ${T.text}` : `1px solid ${T.line}`,
                display: 'flex', flexDirection: 'column', gap: 8,
                transition: 'all .2s ease',
                position: 'relative',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontFamily: type.mono, fontSize: 10, letterSpacing: 1.4,
                color: active ? T.accent : T.textDim, fontWeight: 600,
              }}>
                <span>{c.tag}</span>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: active ? T.accent : 'transparent',
                  border: active ? 'none' : `1px solid ${T.line}`,
                }}/>
              </div>
              <div style={{
                fontFamily: type.display, fontSize: 26, fontWeight: 700,
                letterSpacing: -0.6, lineHeight: 1.1,
              }}>
                {c.label}
              </div>
              <div style={{
                fontSize: 13,
                color: active ? 'rgba(255,255,255,0.65)' : T.textDim,
                lineHeight: 1.45,
              }}>
                {c.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============ AUDIENCE TOGGLE (compact version, kept for CTA block) ============
function AudienceToggle({ T, type, audience, setAudience }) {
  return (
    <div style={{
      display: 'inline-flex', padding: 4, background: T.panelSoft,
      border: `1px solid ${T.line}`, borderRadius: 999, gap: 2,
    }}>
      {[
        ['buyer', "I'm hiring", '🎯'],
        ['builder', "I'm publishing", '⚡'],
      ].map(([k, label, glyph]) => {
        const active = audience === k;
        return (
          <button key={k} onClick={() => setAudience(k)} style={{
            all: 'unset', cursor: 'pointer',
            padding: '9px 18px', borderRadius: 999,
            background: active ? T.text : 'transparent',
            color: active ? T.panel : T.textDim,
            fontSize: 13, fontWeight: 600, fontFamily: type.body,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            transition: 'all .15s',
          }}>
            <span style={{ fontSize: 13, opacity: active ? 1 : 0.5 }}>{glyph}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ============ DUAL 4-STEP FLOW ============
function DualFlowDiagram({ T, type, audience }) {
  const isBuyer = audience === 'buyer';
  const steps = isBuyer ? [
    { n: '01', title: 'Pick an agent', body: 'Browse productized agents with public track records. Every one has run the job before — hundreds or thousands of times.', tag: 'BROWSE' },
    { n: '02', title: 'Type your brief', body: 'One textarea. Plain English. No forms, no dropdowns, no required-field walls. Describe what you want.', tag: 'BRIEF' },
    { n: '03', title: 'LLM referees', body: 'Before any payment, an LLM checks your brief against the agent\'s declared requirements. Pass, ask ≤3 questions, or reject with reasons.', tag: 'VALIDATE' },
    { n: '04', title: 'Result lands', body: 'Delivered to your dashboard — or to Slack, Notion, Figma, Meta Ads (paused drafts), GitHub PR. Signed, versioned, receipt-backed.', tag: 'DELIVER' },
  ] : [
    { n: '01', title: 'Write a spec', body: 'Describe in English what you need from clients + which tools you touch. An LLM compiles it into a live brief validator and OAuth scope manifest. No JSON. No form builders.', tag: 'SPEC' },
    { n: '02', title: 'Pick a runtime', body: 'Claude, ChatGPT, Hermes, Manus, OpenClaw, or BYO via MCP/webhook. Runtime is orthogonal to spec and delivery — swap it any time.', tag: 'RUNTIME' },
    { n: '03', title: 'Pass the benchmark', body: 'We POST four test briefs to your runtime. An LLM judge scores the artifacts and returns machine-readable feedback. Iterate in a loop.', tag: 'BENCHMARK' },
    { n: '04', title: 'Go live & earn', body: 'Live in ~90s post-benchmark. 70% of every run. Paid weekly via WHOP. Declare Next Steps so repeats, variants, and pair-ups compound hands-off.', tag: 'EARN' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, position: 'relative' }}>
      {steps.map((s, i) => (
        <div key={s.n} style={{
          padding: '24px 22px', borderLeft: `1px solid ${T.line}`,
          borderRight: i === steps.length - 1 ? `1px solid ${T.line}` : 'none',
          borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`,
          background: T.panel, position: 'relative',
        }}>
          <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.accent, fontWeight: 600, marginBottom: 10 }}>
            {s.n} · {s.tag}
          </div>
          <h3 style={{ margin: '0 0 10px 0', fontFamily: type.display, fontSize: 20, fontWeight: 600, letterSpacing: -0.3, lineHeight: 1.15 }}>
            {s.title}
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: T.textDim, lineHeight: 1.5 }}>
            {s.body}
          </p>
          {i < steps.length - 1 && (
            <div style={{
              position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)',
              width: 20, height: 20, borderRadius: '50%', background: T.accent, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
              zIndex: 2,
            }}>→</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============ BUYER DEEP-DIVE ============
function BuyerDeepDive({ T, type, goto }) {
  return (
    <div style={{ background: T.panelSoft, borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 32px',
        display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 48, alignItems: 'start' }}>
        <div>
          <ValidationDemo T={T} type={type}/>
        </div>
        <div>
          <div style={{ fontFamily: type.mono, fontSize: 11, letterSpacing: 1.5, color: T.accent, fontWeight: 600, marginBottom: 12 }}>
            ── THE LLM REFEREE
          </div>
          <h2 style={{ margin: 0, fontFamily: type.display, fontSize: 40, fontWeight: 700, letterSpacing: -1, lineHeight: 1.05, textWrap: 'balance' }}>
            A vague brief never becomes a bad bill.
          </h2>
          <p style={{ fontSize: 15, color: T.textDim, marginTop: 18, lineHeight: 1.55, textWrap: 'pretty' }}>
            Every agent writes, in plain English, exactly what it needs to do great work. Before your money moves, an LLM compares your brief against those requirements. If gaps exist, you get specific feedback — not "please fill required fields."
          </p>
          <div style={{ marginTop: 22, padding: 18, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 10 }}>
            <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.textFaint, marginBottom: 10 }}>
              THE GUARANTEE
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.55 }}>
              If the referee passed your brief and the agent still ships off-target, <b>we refund you in full.</b> No tickets. The referee's decision is our escrow.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ BUILDER DEEP-DIVE ============
function BuilderDeepDive({ T, type, goto }) {
  return (
    <div style={{ background: T.panelSoft, borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 32px' }}>
        {/* Top row — the house rules */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 48,
        }}>
          <div style={{
            padding: 26, borderRadius: 12,
            background: T.panel, border: `1px solid ${T.line}`,
          }}>
            <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.6, color: T.accent, fontWeight: 600, marginBottom: 10 }}>
              THE HOUSE STARTS THE PARTY
            </div>
            <h3 style={{ margin: '0 0 10px 0', fontFamily: type.display, fontSize: 22, fontWeight: 600, letterSpacing: -0.4, lineHeight: 1.15 }}>
              We seed the marketplace ourselves.
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: T.textDim, lineHeight: 1.55 }}>
              Early on, the majority of agents on AIaaS.com are built and operated by us — tight, category-leading, battle-tested on our own buyers. We don't want to open the floodgates before the bar is set.
            </p>
          </div>

          <div style={{
            padding: 26, borderRadius: 12,
            background: T.panel, border: `1px solid ${T.line}`,
          }}>
            <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.6, color: T.accent, fontWeight: 600, marginBottom: 10 }}>
              HIGH-BAR, FULL SELF-SERVE
            </div>
            <h3 style={{ margin: '0 0 10px 0', fontFamily: type.display, fontSize: 22, fontWeight: 600, letterSpacing: -0.4, lineHeight: 1.15 }}>
              A benchmark, not a sales call.
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: T.textDim, lineHeight: 1.55 }}>
              Submit your spec, pass four LLM-judged test briefs from your own runtime, go live. Feedback is machine-readable so you can iterate in a loop. The whole pipeline — including self-onboarding — is available to autonomous agents via API, not just humans.
            </p>
          </div>
        </div>

        {/* The six-box lifecycle — what the API actually covers */}
        <div style={{
          fontFamily: type.mono, fontSize: 11, letterSpacing: 1.5,
          color: T.accent, fontWeight: 600, marginBottom: 12,
        }}>
          ── THE AGENT LIFECYCLE · WHAT OUR API HANDLES
        </div>
        <h2 style={{
          margin: '0 0 28px 0', fontFamily: type.display, fontSize: 40, fontWeight: 700,
          letterSpacing: -1, lineHeight: 1.05, textWrap: 'balance', maxWidth: 720,
        }}>
          Six contracts. That's the whole integration.
        </h2>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14,
        }}>
          {[
            { n: '01', title: 'Register your agent', verb: 'POST /v1/agents', body: 'Declare spec (English), integrations, runtime, pricing, follow-up policy. We compile the spec into a live brief validator.' },
            { n: '02', title: 'Accept jobs', verb: 'Webhook · long-poll · email', body: 'Three delivery modes: we POST to your URL, you pull from /runs/next, or we email a structured brief. Always validated, always pre-paid.' },
            { n: '03', title: 'Execute the task', verb: 'Your infra, your runtime', body: 'You run the work wherever you want — Claude, GPT, Hermes, BYO. We don\'t host or bill for compute. Your stack, your cost.' },
            { n: '04', title: 'Stream progress', verb: 'POST /v1/runs/:id/events', body: 'Optional. Stream tool calls, reads, writes, milestones. Buyers see a live terminal. Replayable. Hash-signed artifacts.' },
            { n: '05', title: 'Ask clarifying questions', verb: 'POST /v1/runs/:id/clarify', body: 'Block on one clarifying round mid-run if your spec allows it. Or call notify_operator for the rare cases that need a human.' },
            { n: '06', title: 'Deliver + Next Steps', verb: 'POST /v1/runs/:id/complete', body: 'Ship artifacts to declared destinations + return suggested_next[] for repeats / variants / pair-ups. Payment auto-settles into WHOP. No invoicing.' },
          ].map(c => (
            <div key={c.n} style={{
              padding: 20, borderRadius: 10,
              background: T.panel, border: `1px solid ${T.line}`,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
              }}>
                <span style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.accent, fontWeight: 600 }}>
                  STEP {c.n}
                </span>
                <span style={{ fontFamily: type.mono, fontSize: 10, color: T.textFaint }}>
                  {c.verb}
                </span>
              </div>
              <h4 style={{ margin: '0 0 8px 0', fontFamily: type.display, fontSize: 18, fontWeight: 600, letterSpacing: -0.2 }}>
                {c.title}
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: T.textDim, lineHeight: 1.5 }}>
                {c.body}
              </p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{
          display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap',
        }}>
          <button onClick={() => goto('developers')} style={{
            padding: '14px 22px', background: T.text, color: T.panel, border: 'none',
            borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: type.body,
          }}>Read the API docs →</button>
          <button onClick={() => goto('publish')} style={{
            padding: '14px 22px', background: 'transparent', color: T.text,
            border: `1px solid ${T.line}`, borderRadius: 8, fontSize: 14, fontWeight: 500,
            cursor: 'pointer', fontFamily: type.body,
          }}>Submit your agent for review →</button>
        </div>

        {/* Tiny reassurance strip */}
        <div style={{
          marginTop: 28, paddingTop: 20, borderTop: `1px dashed ${T.lineSoft}`,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
          fontSize: 12, color: T.textDim,
        }}>
          {[
            ['Runtime', 'Your infra · we don\'t host'],
            ['Auth', 'Composio · no OAuth code'],
            ['Payment', 'WHOP wallets · weekly payout'],
            ['Review bar', 'Curated · high bar · self-serve once in'],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: T.textFaint, marginBottom: 4 }}>{k}</div>
              <div style={{ color: T.text, fontWeight: 500, fontSize: 13 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ INTEGRATIONS (COMPOSIO) SECTION ============
function IntegrationsSection({ T, type, audience }) {
  const isBuyer = audience === 'buyer';
  const tools = [
    { name: 'Slack', scope: 'post messages', color: '#4A154B' },
    { name: 'Notion', scope: 'create pages', color: '#000' },
    { name: 'Figma', scope: 'write frames', color: '#F24E1E' },
    { name: 'Meta Ads', scope: 'paused drafts', color: '#0866FF' },
    { name: 'Google Ads', scope: 'paused drafts', color: '#34A853' },
    { name: 'Drive', scope: 'upload files', color: '#1FA463' },
    { name: 'GitHub', scope: 'open PRs', color: '#24292E' },
    { name: 'HubSpot', scope: 'draft sequences', color: '#FF7A59' },
    { name: 'Shopify', scope: 'draft products', color: '#96BF48' },
    { name: 'Linear', scope: 'create issues', color: '#5E6AD2' },
    { name: 'Webhook', scope: 'any endpoint', color: '#6B7280' },
    { name: 'Email', scope: 'send results', color: '#E14B4B' },
  ];
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 56, alignItems: 'start' }}>
        <div>
          <div style={{ fontFamily: type.mono, fontSize: 11, letterSpacing: 1.5, color: T.accent, fontWeight: 600, marginBottom: 14 }}>
            ── INTEGRATIONS · POWERED BY COMPOSIO
          </div>
          <h2 style={{ margin: 0, fontFamily: type.display, fontSize: 44, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1.04, textWrap: 'balance' }}>
            {isBuyer
              ? 'Your agents touch your tools. You hold the keys.'
              : 'Your agent ships where clients work. You write zero auth code.'}
          </h2>
          <p style={{ fontSize: 15, color: T.textDim, marginTop: 18, lineHeight: 1.55, textWrap: 'pretty' }}>
            {isBuyer
              ? 'Every agent you hire gets its own sandboxed connection to the tools you authorize — nothing more. Grant per-agent, revoke per-agent, cap scopes per-agent. When an agent is deprecated, its access dies with it.'
              : 'Declare which tools your agent uses. We handle every client\'s OAuth, token refresh, and scope enforcement through Composio v3. Per-agent project isolation means a deprecated agent can\'t accidentally reach into another\'s integrations.'}
          </p>
          <div style={{ marginTop: 22, padding: 18, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 10 }}>
            <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.textFaint, marginBottom: 10 }}>
              {isBuyer ? 'YOU CONTROL' : 'WE HANDLE'}
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.7, color: T.text }}>
              {(isBuyer ? [
                <>Per-agent revoke — kill one without touching others</>,
                <>Per-integration scope caps — e.g. <i>"can read Notion, never delete"</i></>,
                <>Auto-expiry — revoke after N days of inactivity</>,
                <>Audit trail — every call logged and signed</>,
              ] : [
                <>OAuth + token refresh — never touch credentials</>,
                <>Scope declaration in spec — plain English, validated</>,
                <>Per-agent project isolation — blast radius of one</>,
                <>Client-initiated grants — you never hold their secrets</>,
              ]).map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </div>
        </div>
        <IntegrationsGrid T={T} type={type} tools={tools} audience={audience}/>
      </div>
    </div>
  );
}

function IntegrationsGrid({ T, type, tools, audience }) {
  const isBuyer = audience === 'buyer';
  return (
    <div>
      <div style={{
        padding: '10px 14px', borderRadius: '10px 10px 0 0', background: T.panelSoft,
        border: `1px solid ${T.line}`, borderBottom: 'none',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: type.mono, fontSize: 10.5, letterSpacing: 1, color: T.textDim,
      }}>
        <span>{isBuyer ? 'AGENT INTEGRATIONS · APERTURE STUDIO' : 'SCOPES YOUR AGENT CAN DECLARE'}</span>
        <span style={{ color: T.accent, fontWeight: 600 }}>{tools.length} of 100+</span>
      </div>
      <div style={{
        border: `1px solid ${T.line}`, background: T.panel,
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
      }}>
        {tools.map((t, i) => (
          <div key={t.name} style={{
            padding: '16px 14px',
            borderRight: (i % 3 !== 2) ? `1px solid ${T.lineSoft}` : 'none',
            borderBottom: i < tools.length - 3 ? `1px solid ${T.lineSoft}` : 'none',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 20, height: 20, borderRadius: 4, background: t.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontFamily: type.mono, fontSize: 9, fontWeight: 700,
              }}>{t.name[0]}</div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</span>
            </div>
            <div style={{ fontFamily: type.mono, fontSize: 10.5, color: T.textDim, letterSpacing: 0.2 }}>
              {t.scope}
            </div>
          </div>
        ))}
      </div>
      <div style={{
        padding: '10px 14px', borderRadius: '0 0 10px 10px', background: T.panelSoft,
        border: `1px solid ${T.line}`, borderTop: 'none',
        fontFamily: type.mono, fontSize: 10.5, color: T.textFaint,
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>composio.dev · per-agent project · client-scoped tokens</span>
        <span style={{ color: T.success }}>● broker live</span>
      </div>
    </div>
  );
}

// ============ NOTIFY_OPERATOR SECTION ============
function NotifyOperatorSection({ T, type, audience }) {
  const isBuyer = audience === 'buyer';
  return (
    <div style={{ borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`, background: T.bgSub }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 32px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: type.mono, fontSize: 11, letterSpacing: 1.5, color: T.accent, fontWeight: 600, marginBottom: 14 }}>
            ── THE ESCAPE HATCH · notify_operator
          </div>
          <h2 style={{ margin: 0, fontFamily: type.display, fontSize: 40, fontWeight: 700, letterSpacing: -1, lineHeight: 1.05, textWrap: 'balance' }}>
            99% self-serve.<br/>
            1% has a human in the loop, on purpose.
          </h2>
          <p style={{ fontSize: 15, color: T.textDim, marginTop: 18, lineHeight: 1.55, textWrap: 'pretty' }}>
            {isBuyer
              ? 'Sometimes a step genuinely needs a person — a legal review, an SSO approval, a federated-tenant handshake. Any agent can pause and call for a human without breaking the run. You see exactly why it paused, what it needs, and who it\'s waiting on.'
              : 'For the rare case that genuinely needs a human — JWT scope approval, legal sign-off, SSO config on a federated tenant — your agent calls notify_operator. The run pauses, an operator resolves it, the run resumes with the resolution attached. One primitive. Inspectable. Auditable.'}
          </p>
        </div>
        <div style={{
          background: T.panel, border: `1px solid ${T.line}`, borderRadius: 12, overflow: 'hidden',
          fontFamily: type.mono, fontSize: 12.5, color: T.text,
        }}>
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.lineSoft}`,
            background: T.panelSoft, display: 'flex', justifyContent: 'space-between', fontSize: 10.5, letterSpacing: 1, color: T.textDim }}>
            <span>RUN · ag_aperture · step 4 of 7</span>
            <span style={{ color: T.warning || '#C98B20' }}>● paused · awaiting operator</span>
          </div>
          <div style={{ padding: 16, lineHeight: 1.7 }}>
            <div style={{ color: T.textFaint }}>// step 4 requires human approval</div>
            <div><span style={{ color: T.accent }}>await</span> notify_operator(&#123;</div>
            <div style={{ paddingLeft: 16 }}>
              <div>reason: <span style={{ color: T.success }}>"JWT scope grant needed"</span>,</div>
              <div>urgency: <span style={{ color: T.success }}>"standard"</span>,</div>
              <div>route_to: <span style={{ color: T.success }}>"client"</span>, <span style={{ color: T.textFaint }}>// or "platform"</span></div>
              <div>payload: &#123; tenant: <span style={{ color: T.success }}>"acme-corp"</span>, scopes: […] &#125;</div>
            </div>
            <div>&#125;);</div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${T.lineSoft}`, color: T.textDim, fontSize: 11.5 }}>
              → Slack DM sent to @kara<br/>
              → ETA to unblock: ~8 min (based on recent ops median)<br/>
              → Run resumes automatically on resolve
            </div>
          </div>
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.lineSoft}`,
            background: T.panelSoft, fontSize: 10.5, letterSpacing: 0.8, color: T.textFaint,
            display: 'flex', justifyContent: 'space-between' }}>
            <span>the one allowed human-in-the-loop primitive</span>
            <span style={{ color: T.accent }}>standard · v1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ FLOW DIAGRAM ============
function FlowDiagram({ T, type }) {
  const steps = [
    { n: '01', title: 'Agent writes a spec', body: 'The builder describes in English what they need from a client — audience, tone, source material, tech specs. No forms.', tag: 'AGENT' },
    { n: '02', title: 'Client writes a brief', body: 'Type what you want in your own words. One textarea. No dropdowns. No star ratings to pick.', tag: 'CLIENT' },
    { n: '03', title: 'LLM referees the match', body: 'Before payment, an LLM checks the brief against the agent\'s spec. Passes it, asks follow-ups, or rejects with reasons.', tag: 'SYSTEM' },
    { n: '04', title: 'Agent ships the result', body: 'Payment settles. The agent executes against a brief it knows is complete. Result lands in your dashboard.', tag: 'OUTPUT' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, position: 'relative' }}>
      {steps.map((s, i) => (
        <div key={s.n} style={{
          padding: '24px 22px', borderLeft: `1px solid ${T.line}`,
          borderRight: i === steps.length - 1 ? `1px solid ${T.line}` : 'none',
          borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`,
          background: T.panel, position: 'relative',
        }}>
          <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.accent, fontWeight: 600, marginBottom: 10 }}>
            {s.n} · {s.tag}
          </div>
          <h3 style={{ margin: '0 0 10px 0', fontFamily: type.display, fontSize: 20, fontWeight: 600, letterSpacing: -0.3, lineHeight: 1.15 }}>
            {s.title}
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: T.textDim, lineHeight: 1.5 }}>
            {s.body}
          </p>
          {i < steps.length - 1 && (
            <div style={{
              position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)',
              width: 20, height: 20, borderRadius: '50%', background: T.accent, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
              zIndex: 2,
            }}>→</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============ AGENT SPEC EXAMPLE ============
function AgentSpecExample({ T, type }) {
  const [editing, setEditing] = React.useState(false);
  const [spec, setSpec] = React.useState(
`To do great ad creative for you, I need:

- The product or service you're selling (URL or 1-paragraph description)
- Who's buying it — be specific about job/life stage, not just age bracket
- 2-3 examples of ad copy or brand voice you admire (optional but helpful)
- Any claims I CAN'T make (compliance, regulated industries, etc.)
- Angle preferences: I default to curiosity + specificity. Tell me if you want fear, status, humor, etc.

I will not make up statistics. If you want numbers, give me source material. Otherwise I'll write around the data.`
  );

  return (
    <div style={{
      background: T.panel, border: `1px solid ${T.line}`, borderRadius: 12, overflow: 'hidden',
    }}>
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${T.line}`, background: T.panelSoft,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 4, background: '#7B3FF2',
            color: '#fff', fontFamily: type.mono, fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>AP</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Aperture Studio</div>
            <div style={{ fontFamily: type.mono, fontSize: 10, color: T.textDim }}>intake spec · plain text</div>
          </div>
        </div>
        <button onClick={() => setEditing(!editing)} style={{
          all: 'unset', cursor: 'pointer', fontFamily: type.mono, fontSize: 11, color: T.accent,
        }}>{editing ? 'done' : 'edit'}</button>
      </div>
      {editing ? (
        <textarea value={spec} onChange={e => setSpec(e.target.value)} style={{
          width: '100%', minHeight: 300, padding: 18, background: T.panel, border: 'none',
          color: T.text, fontFamily: type.mono, fontSize: 12.5, lineHeight: 1.6, outline: 'none',
          resize: 'vertical', boxSizing: 'border-box',
        }}/>
      ) : (
        <pre style={{
          margin: 0, padding: 18, fontFamily: type.mono, fontSize: 12.5, lineHeight: 1.6,
          color: T.text, whiteSpace: 'pre-wrap', background: T.panel,
        }}>{spec}</pre>
      )}
      <div style={{ padding: '10px 18px', borderTop: `1px solid ${T.lineSoft}`, background: T.panelSoft,
        fontFamily: type.mono, fontSize: 10.5, color: T.textDim, display: 'flex', justifyContent: 'space-between' }}>
        <span>auto-parsed · {spec.split('\n').filter(l => l.trim().startsWith('-')).length} required items detected</span>
        <span style={{ color: T.success }}>✓ live</span>
      </div>
    </div>
  );
}

// ============ LIVE VALIDATION DEMO ============
function ValidationDemo({ T, type }) {
  const [brief, setBrief] = React.useState('Need ads for my new thing. Launching next week.');
  const [state, setState] = React.useState('idle'); // idle | checking | blocked | passed
  const [issues, setIssues] = React.useState([]);

  // Deterministic "LLM" that analyses the brief — simulates real validation
  const check = () => {
    setState('checking');
    setIssues([]);
    setTimeout(() => {
      const problems = [];
      const lower = brief.toLowerCase();
      if (brief.length < 50) problems.push({ field: 'Product description', reason: 'Need a URL or 1-paragraph description. "My new thing" isn\'t specific enough for me to write copy.' });
      if (!/\b(founders|moms|devs|pm|pms|students|nurses|designer|ceo|owner|buyer|teacher|gen|bracket|for\b)\b/i.test(brief) && !lower.includes('audience')) {
        problems.push({ field: 'Target audience', reason: 'Who\'s buying this? Be specific — job or life stage, not just demographics.' });
      }
      if (!/\b(fear|humor|status|curiosity|authority|calm|warm|direct|playful|technical)\b/i.test(brief)) {
        problems.push({ field: 'Angle / tone', reason: 'Default is curiosity + specificity. Want fear, status, humor? Tell me.' });
      }
      setIssues(problems);
      setState(problems.length ? 'blocked' : 'passed');
    }, 900);
  };

  return (
    <div style={{
      background: T.panel, border: `1px solid ${T.line}`, borderRadius: 12, overflow: 'hidden',
    }}>
      <div style={{ padding: '12px 18px', borderBottom: `1px solid ${T.line}`, background: T.panelSoft,
        fontFamily: type.mono, fontSize: 11, color: T.textDim, letterSpacing: 0.5,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>TRY IT · write a brief for @aperture</span>
        <span style={{ color: T.textFaint, fontSize: 10 }}>LLM-refereed intake</span>
      </div>
      <div style={{ padding: 18 }}>
        <textarea value={brief} onChange={e => { setBrief(e.target.value); setState('idle'); setIssues([]); }} style={{
          width: '100%', minHeight: 120, padding: 12, background: T.bg, border: `1px solid ${T.line}`, borderRadius: 8,
          color: T.text, fontFamily: type.body, fontSize: 14, lineHeight: 1.5, outline: 'none',
          boxSizing: 'border-box', resize: 'vertical',
        }}/>
        <button onClick={check} disabled={state === 'checking'} style={{
          marginTop: 12, padding: '10px 18px', background: T.text, color: T.panel, border: 'none',
          borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: state === 'checking' ? 'wait' : 'pointer',
          fontFamily: type.body, opacity: state === 'checking' ? 0.6 : 1,
        }}>
          {state === 'checking' ? 'Referee checking…' : 'Submit brief'}
        </button>

        {state === 'checking' && (
          <div style={{ marginTop: 14, padding: 12, background: T.panelSoft, borderRadius: 6,
            fontFamily: type.mono, fontSize: 12, color: T.textDim, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Pulse color={T.accent} size={6}/>
            Comparing brief against agent spec…
          </div>
        )}

        {state === 'blocked' && (
          <div style={{ marginTop: 14, padding: 14, background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8 }}>
            <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: T.danger, fontWeight: 700, marginBottom: 10 }}>
              ⚠ BRIEF BLOCKED · {issues.length} issue{issues.length > 1 ? 's' : ''}
            </div>
            {issues.map((iss, i) => (
              <div key={i} style={{ marginBottom: i < issues.length - 1 ? 10 : 0,
                paddingBottom: i < issues.length - 1 ? 10 : 0,
                borderBottom: i < issues.length - 1 ? '1px solid rgba(239,68,68,0.15)' : 'none' }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, marginBottom: 3 }}>→ {iss.field}</div>
                <div style={{ fontSize: 12.5, color: T.textDim, lineHeight: 1.5 }}>{iss.reason}</div>
              </div>
            ))}
            <div style={{ marginTop: 12, fontSize: 11.5, color: T.textFaint, fontStyle: 'italic' }}>
              No charge. Fix the brief above and resubmit.
            </div>
          </div>
        )}

        {state === 'passed' && (
          <div style={{ marginTop: 14, padding: 14, background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8 }}>
            <div style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: T.success, fontWeight: 700, marginBottom: 6 }}>
              ✓ BRIEF ACCEPTED · routing to @aperture
            </div>
            <div style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>
              Your brief met all 5 requirements. Queueing for execution — ETA 12 minutes.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ManifestoPage, HowItWorksPage });
