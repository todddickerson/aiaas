// chat-rail.jsx — buyer-agent chat UX
// Two surfaces:
//   LiveInterjectRail : during a run, buyer can nudge the agent mid-execution
//   RefineThread      : after delivery, buyer asks for revisions / follow-ups

// ============ LIVE INTERJECT (during run) ============
// Compact side rail. Shows buyer + agent short messages + system "acknowledged at step N" pings.
// Throttled to 1 interject per 30s at the spec level — UI reinforces this with a cooldown.
function LiveInterjectRail({ agent, T, type, currentStep = 2, onInterject }) {
  const [msg, setMsg] = React.useState('');
  const [history, setHistory] = React.useState([
    { kind: 'system', body: `Chat opened · ${agent.name} is running · you can nudge mid-flight`, t: '00:00' },
    { kind: 'sys-step', body: `Step 2/6: drafting first pass`, t: '00:14' },
  ]);
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // simulate an ack after each send
  const send = () => {
    if (!msg.trim() || cooldown > 0) return;
    const body = msg.trim();
    const ts = fmtTs();
    setHistory(h => [...h, { kind: 'buyer', body, t: ts }]);
    setMsg('');
    setCooldown(30);
    onInterject?.(body);
    setTimeout(() => {
      setHistory(h => [...h, { kind: 'agent', body: pickAck(body, agent), t: fmtTs() }]);
    }, 800);
    setTimeout(() => {
      setHistory(h => [...h, { kind: 'sys-ack', body: `Ack at step ${currentStep} · will fold into current pass`, t: fmtTs() }]);
    }, 1600);
  };

  return (
    <div style={{
      border: `1px solid ${T.line}`, borderRadius: 10, background: T.panel, overflow: 'hidden',
      display: 'flex', flexDirection: 'column', minHeight: 320,
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${T.lineSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.textDim, fontWeight: 600,
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Pulse color="#22c55e" size={6}/>
          INTERJECT · LIVE
        </span>
        <span style={{ color: T.textFaint }}>spec-throttled · 1 per 30s</span>
      </div>

      {/* Body scroll */}
      <div style={{
        flex: 1, padding: '12px 14px', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 8,
        maxHeight: 280,
      }}>
        {history.map((m, i) => <InterjectBubble key={i} m={m} agent={agent} T={T} type={type}/>)}
      </div>

      {/* Input */}
      <div style={{ padding: 10, borderTop: `1px solid ${T.lineSoft}`, background: T.panelSoft }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <textarea
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={cooldown > 0 ? `Cooldown ${cooldown}s — give the agent a moment` : 'Nudge the agent… "keep it dry, no exclamation marks"'}
            disabled={cooldown > 0}
            rows={2}
            style={{
              flex: 1, resize: 'none', padding: '8px 10px',
              fontFamily: type.body, fontSize: 12.5, color: T.text,
              background: T.panel, border: `1px solid ${T.line}`, borderRadius: 6,
              outline: 'none', lineHeight: 1.45,
            }}
          />
          <button onClick={send} disabled={cooldown > 0 || !msg.trim()} style={{
            padding: '0 14px', background: cooldown > 0 || !msg.trim() ? T.panel : T.text,
            color: cooldown > 0 || !msg.trim() ? T.textFaint : T.panel,
            border: `1px solid ${T.line}`, borderRadius: 6,
            fontFamily: type.body, fontSize: 12, fontWeight: 600, cursor: cooldown > 0 || !msg.trim() ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}>
            {cooldown > 0 ? `${cooldown}s` : 'Send'}
          </button>
        </div>
        <div style={{ marginTop: 6, fontFamily: type.mono, fontSize: 9.5, color: T.textFaint, letterSpacing: 0.3 }}>
          ⏎ send · ⇧⏎ newline · agent picks up at next step boundary · no data races
        </div>
      </div>
    </div>
  );
}

// Single bubble
function InterjectBubble({ m, agent, T, type }) {
  if (m.kind === 'system' || m.kind === 'sys-step' || m.kind === 'sys-ack') {
    const color = m.kind === 'sys-ack' ? '#2B8A5A' : m.kind === 'sys-step' ? T.accent : T.textDim;
    return (
      <div style={{
        alignSelf: 'center', padding: '2px 10px', borderRadius: 999,
        fontFamily: type.mono, fontSize: 10, color, letterSpacing: 0.4,
        background: `${color}0E`, border: `1px solid ${color}22`,
      }}>{m.body} · {m.t}</div>
    );
  }
  const isBuyer = m.kind === 'buyer';
  return (
    <div style={{
      alignSelf: isBuyer ? 'flex-end' : 'flex-start',
      maxWidth: '82%',
      display: 'flex', flexDirection: 'column', gap: 2,
      alignItems: isBuyer ? 'flex-end' : 'flex-start',
    }}>
      <div style={{
        padding: '7px 11px', borderRadius: isBuyer ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
        background: isBuyer ? T.text : T.panelSoft,
        color: isBuyer ? T.panel : T.text,
        fontSize: 12.5, lineHeight: 1.5, textWrap: 'pretty',
        border: isBuyer ? 'none' : `1px solid ${T.lineSoft}`,
      }}>{m.body}</div>
      <div style={{ fontFamily: type.mono, fontSize: 9.5, color: T.textFaint, letterSpacing: 0.3 }}>
        {isBuyer ? 'you' : agent.name.toLowerCase()} · {m.t}
      </div>
    </div>
  );
}

// ============ REFINE THREAD (post-delivery) ============
// After delivery — buyer asks for revisions. Spec-bound revision count shown as a meter.
function RefineThread({ agent, T, type, revisionsIncluded = 1, revisionsUsed = 0, onRefine }) {
  const [thread, setThread] = React.useState([
    { kind: 'delivered', body: 'First draft delivered — 40 ad variants, 3 tagline families, creative brief.', t: '12:04', meta: 'artifact · bundle_v1.zip' },
  ]);
  const [draft, setDraft] = React.useState('');
  const [usedLocal, setUsedLocal] = React.useState(revisionsUsed);
  const remaining = Math.max(0, revisionsIncluded - usedLocal);
  const overageCost = pickedServicePrice(agent) * 0.4;

  const ask = () => {
    if (!draft.trim()) return;
    const body = draft.trim();
    setThread(t => [...t, { kind: 'buyer', body, t: fmtTs() }]);
    setDraft('');
    setUsedLocal(u => u + 1);
    onRefine?.(body);
    setTimeout(() => {
      setThread(t => [...t, { kind: 'agent', body: pickRevisionAck(body), t: fmtTs() }]);
    }, 600);
    setTimeout(() => {
      setThread(t => [...t, { kind: 'delivered', body: 'Revised bundle ready — diff shown inline.', t: fmtTs(), meta: 'artifact · bundle_v2.zip · diff' }]);
    }, 2400);
  };

  return (
    <div style={{
      border: `1px solid ${T.line}`, borderRadius: 10, background: T.panel, overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${T.lineSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.textDim, fontWeight: 600,
      }}>
        <span>REFINE · POST-DELIVERY</span>
        <span style={{ color: T.textFaint }}>
          {remaining}/{revisionsIncluded} included rounds left
        </span>
      </div>

      {/* Revision meter */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.lineSoft}`, background: T.panelSoft, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: revisionsIncluded + 2 }).map((_, i) => {
            const used = i < usedLocal;
            const included = i < revisionsIncluded;
            return (
              <div key={i} style={{
                width: 28, height: 5, borderRadius: 2,
                background: used ? (included ? T.text : '#C98B20') : included ? `${T.text}22` : `${T.line}`,
              }}/>
            );
          })}
        </div>
        <div style={{ fontFamily: type.mono, fontSize: 10.5, color: T.textDim, letterSpacing: 0.3 }}>
          {remaining > 0
            ? `Next round included in your fee`
            : `Over cap · next round $${overageCost.toFixed(2)} · agent's posted overage rate`}
        </div>
      </div>

      {/* Thread */}
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 340, overflowY: 'auto' }}>
        {thread.map((m, i) => <RefineBubble key={i} m={m} agent={agent} T={T} type={type}/>)}
      </div>

      {/* Composer */}
      <div style={{ padding: 12, borderTop: `1px solid ${T.lineSoft}`, background: T.panelSoft }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder='Ask for a revision… "punchier taglines, no questions, cut the emojis"'
            rows={2}
            style={{
              flex: 1, resize: 'none', padding: '9px 11px',
              fontFamily: type.body, fontSize: 12.5, color: T.text,
              background: T.panel, border: `1px solid ${T.line}`, borderRadius: 6,
              outline: 'none', lineHeight: 1.45,
            }}
          />
          <button onClick={ask} disabled={!draft.trim()} style={{
            padding: '0 16px', background: draft.trim() ? agent.swatch : T.panel,
            color: draft.trim() ? '#fff' : T.textFaint,
            border: draft.trim() ? 'none' : `1px solid ${T.line}`,
            borderRadius: 6, fontFamily: type.body, fontSize: 12, fontWeight: 600,
            cursor: draft.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap',
          }}>
            Ask for revision →
          </button>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Shorter', 'More edge', 'Different angle', 'Fix one thing', 'Redo'].map(t => (
            <button key={t} onClick={() => setDraft(d => d ? `${d} · ${t.toLowerCase()}` : t)} style={{
              all: 'unset', cursor: 'pointer',
              padding: '3px 10px', borderRadius: 999,
              fontFamily: type.mono, fontSize: 10.5, letterSpacing: 0.4,
              color: T.textDim, border: `1px solid ${T.line}`, background: T.panel,
            }}>{t}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RefineBubble({ m, agent, T, type }) {
  if (m.kind === 'delivered') {
    return (
      <div style={{
        padding: '10px 12px', borderRadius: 8,
        border: `1px solid ${agent.swatch}33`, background: `${agent.swatch}09`,
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6, background: agent.swatch,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontFamily: type.mono,
        }}>◈</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, color: T.text, fontWeight: 500 }}>{m.body}</div>
          {m.meta && (
            <div style={{ fontFamily: type.mono, fontSize: 10, color: T.textDim, marginTop: 2 }}>{m.meta} · {m.t}</div>
          )}
        </div>
        <button style={{
          all: 'unset', cursor: 'pointer',
          padding: '4px 10px', borderRadius: 4,
          background: T.text, color: T.panel,
          fontFamily: type.body, fontSize: 11, fontWeight: 600,
        }}>Open →</button>
      </div>
    );
  }
  const isBuyer = m.kind === 'buyer';
  return (
    <div style={{
      alignSelf: isBuyer ? 'flex-end' : 'flex-start',
      maxWidth: '82%',
      display: 'flex', flexDirection: 'column', gap: 2,
      alignItems: isBuyer ? 'flex-end' : 'flex-start',
    }}>
      <div style={{
        padding: '8px 12px', borderRadius: isBuyer ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
        background: isBuyer ? T.text : T.panelSoft,
        color: isBuyer ? T.panel : T.text,
        fontSize: 12.5, lineHeight: 1.5, textWrap: 'pretty',
        border: isBuyer ? 'none' : `1px solid ${T.lineSoft}`,
      }}>{m.body}</div>
      <div style={{ fontFamily: type.mono, fontSize: 9.5, color: T.textFaint, letterSpacing: 0.3 }}>
        {isBuyer ? 'you' : agent.name.toLowerCase()} · {m.t}
      </div>
    </div>
  );
}

// ============ helpers ============
function fmtTs() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
function pickAck(body, agent) {
  const l = body.toLowerCase();
  if (l.includes('short') || l.includes('brief')) return 'Got it — tightening. Will strip everything under threshold at next pass.';
  if (l.includes('tone') || l.includes('voice')) return 'Tone noted. Re-sampling examples from your brand voice.';
  if (l.includes('stop') || l.includes('abort') || l.includes('cancel')) return 'Stopping at step boundary — no charge. Clean exit in ~12s.';
  if (l.includes('emoji')) return 'Killing emoji. Will keep plain text through the rest of the run.';
  if (l.includes('fast')) return 'Reducing depth setting. Will land ~40% sooner, fewer variants.';
  return `Noted. Folding into current pass — ${agent.sla} remaining.`;
}
function pickRevisionAck(body) {
  const l = body.toLowerCase();
  if (l.includes('short')) return 'On it — will cut 30% and keep the strongest openers.';
  if (l.includes('edge')) return 'Sharpening. Taking two passes with the spicier prompts.';
  if (l.includes('redo')) return 'Full redo · different angle this time. ~2 min.';
  return 'Working on it. Back in about 90 seconds.';
}
function pickedServicePrice(agent) {
  return (agent && agent.services && agent.services[0] && agent.services[0].price) || 4;
}

Object.assign(window, { LiveInterjectRail, RefineThread });
