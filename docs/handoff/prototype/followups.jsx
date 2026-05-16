// followups.jsx — follow-up policy system (creator-defined, client-visible)

// Four policies. Ordered from strictest to loosest.
const FOLLOWUP_POLICIES = {
  none: {
    key: 'none',
    label: 'No follow-ups',
    short: 'Final on delivery',
    desc: 'Agent delivers once. No revisions, no clarifying questions. Brief must be complete.',
    icon: '■',
    color: '#111114',
    priceMult: 1.0,
  },
  clarify: {
    key: 'clarify',
    label: '1 clarifying round',
    short: '1 clarifying round',
    desc: 'Agent may ask up to 3 questions after brief is accepted but before execution starts. No mid-execution chat.',
    icon: '?',
    color: '#1F6FE0',
    priceMult: 1.0,
  },
  revisions: {
    key: 'revisions',
    label: '2 revisions included',
    short: '2 revisions',
    desc: 'Up to 2 revision requests after delivery. Must be scoped to what was already shipped — no new asks.',
    icon: '↻',
    color: '#B07A14',
    priceMult: 1.15,
  },
  live: {
    key: 'live',
    label: 'Async messaging',
    short: 'Chattable',
    desc: 'Message with the agent during execution. Rare, costs more, respect the SLA window.',
    icon: '◐',
    color: '#7B3FF2',
    priceMult: 1.35,
  },
};

// Attach a followup policy to each agent deterministically
function policyFor(agent) {
  if (!agent) return FOLLOWUP_POLICIES.none;
  // Explicit override if set on the agent
  if (agent.followup && FOLLOWUP_POLICIES[agent.followup]) return FOLLOWUP_POLICIES[agent.followup];
  // Otherwise assign by category/tier to feel real
  const map = {
    'operator-dm': 'revisions',
    'helios': 'clarify',
    'funnelsmith': 'clarify',
    'aperture': 'none',
    'triage-01': 'none',
    'reel-rat': 'revisions',
    'north-brand': 'live',
    'mono-seo': 'none',
    'closer': 'revisions',
    'brunson-bot': 'clarify',
  };
  return FOLLOWUP_POLICIES[map[agent.id] || 'none'];
}

// Small chip component — shown on cards, detail modal, etc.
function FollowupChip({ agent, T, type, size = 'sm' }) {
  const p = policyFor(agent);
  const padY = size === 'sm' ? 2 : 4;
  const padX = size === 'sm' ? 7 : 10;
  const fs = size === 'sm' ? 9.5 : 11;
  return (
    <span title={p.desc} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: `${padY}px ${padX}px`, borderRadius: 999,
      background: `${p.color}14`, color: p.color,
      fontFamily: type?.mono || 'ui-monospace, monospace',
      fontSize: fs, letterSpacing: 0.4, fontWeight: 600,
      border: `1px solid ${p.color}22`, whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: fs + 1 }}>{p.icon}</span>
      {p.short}
    </span>
  );
}

// A mini inline follow-up interaction — runs during the hire flow
// Shows agent asking 1-3 clarifying questions before committing to execution
function ClarifyingRound({ agent, onComplete, T, type }) {
  const questionsByAgent = {
    'funnelsmith': [
      { q: 'What\'s the price point? Under $100 or above?', options: ['Under $100', '$100–500', '$500+'] },
      { q: 'Cold audience or warm list?', options: ['Cold ads', 'Warm list', 'Mixed'] },
      { q: 'Any existing VSL or funnel I should match in voice?', type: 'freeform' },
    ],
    'helios': [
      { q: 'How deep should I go on each competitor?', options: ['Surface scan', 'Standard', 'Forensic'] },
      { q: 'Do you want pricing intelligence included?', options: ['Yes', 'No'] },
    ],
    'north-brand': [
      { q: 'Founder-led brand or positioned as a bigger company?', options: ['Founder-led', 'Bigger company', 'Either'] },
      { q: 'Existing assets to preserve?', type: 'freeform' },
    ],
  };
  const questions = questionsByAgent[agent.id] || questionsByAgent['funnelsmith'];
  const [idx, setIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState([]);
  const [freeform, setFreeform] = React.useState('');
  const cur = questions[idx];
  const policy = policyFor(agent);

  const answer = (val) => {
    const next = [...answers, val];
    setAnswers(next);
    setFreeform('');
    if (idx + 1 >= questions.length) onComplete?.(next);
    else setIdx(idx + 1);
  };

  return (
    <div style={{
      padding: 18, border: `1px solid ${policy.color}44`, borderRadius: 12,
      background: `${policy.color}08`, fontFamily: type.body, color: T.text,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{
          width: 28, height: 28, borderRadius: '50%', background: policy.color, color: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: type.mono, fontSize: 14, fontWeight: 700,
        }}>{policy.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{agent.name} has a quick question</div>
          <div style={{ fontFamily: type.mono, fontSize: 10.5, color: T.textDim, letterSpacing: 0.5 }}>
            clarifying round · {idx + 1} of {questions.length} · no charge yet
          </div>
        </div>
      </div>

      <div style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 14, color: T.text }}>
        {cur.q}
      </div>

      {cur.options ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {cur.options.map(o => (
            <button key={o} onClick={() => answer(o)} style={{
              all: 'unset', cursor: 'pointer',
              padding: '10px 14px', borderRadius: 8,
              border: `1px solid ${T.line}`, background: T.panel,
              fontSize: 13, color: T.text,
            }}>{o}</button>
          ))}
        </div>
      ) : (
        <div>
          <textarea value={freeform} onChange={e => setFreeform(e.target.value)}
            placeholder="type your answer…"
            style={{
              width: '100%', padding: 10, minHeight: 72, background: T.panel,
              border: `1px solid ${T.line}`, borderRadius: 6, color: T.text,
              fontFamily: type.body, fontSize: 13, lineHeight: 1.4, outline: 'none',
              boxSizing: 'border-box', resize: 'vertical',
            }}/>
          <button onClick={() => answer(freeform || '(skipped)')} style={{
            marginTop: 8, padding: '8px 14px', background: T.text, color: T.panel, border: 'none',
            borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: type.body,
          }}>Send answer →</button>
        </div>
      )}

      {answers.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.lineSoft}`, fontFamily: type.mono, fontSize: 11, color: T.textDim, lineHeight: 1.6 }}>
          {answers.map((a, i) => <div key={i}>Q{i+1} → <span style={{ color: T.text }}>{a}</span></div>)}
        </div>
      )}
    </div>
  );
}

// Revisions / live-chat flows would hang off the post-delivery step — for now just exposing the chip + clarify.

Object.assign(window, { FOLLOWUP_POLICIES, policyFor, FollowupChip, ClarifyingRound });
