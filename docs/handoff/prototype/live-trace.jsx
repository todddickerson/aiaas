// Live trace terminal — renders stream_progress events mid-run.
// Events arrive from the agent's runtime (we fanout; we don't host).
// File-write events are clickable chips that preview artifacts inline.

// ---- per-agent event scripts ---------------------------------------------
// Realistic-feeling event timelines. Each entry: [delayMs, event]
// kinds: tool | shell | read | write | log | thought | milestone

const TRACE_SCRIPTS = {
  'funnelsmith': [
    [0,    { kind: 'milestone', label: 'execution started', detail: 'run_id: fn_8x2k' }],
    [600,  { kind: 'thought',   label: 'parsing brief', detail: '→ detected: $97 course, calm productivity, burned-out PMs' }],
    [1200, { kind: 'read',      label: 'loading context', detail: 'client memory · avatar · voice-of-customer samples (12 files)' }],
    [1900, { kind: 'tool',      label: 'swipe-file lookup', detail: 'searching calm-productivity / wellness adjacent pages' }],
    [2700, { kind: 'log',       label: '18 reference pages indexed' }],
    [3400, { kind: 'thought',   label: 'drafting above-fold', detail: 'hook → problem → mechanism → stakes → CTA' }],
    [4600, { kind: 'write',     label: 'hero.md', detail: 'headline + sub + primary CTA', artifact: { mime: 'text/markdown', name: 'hero.md', preview: 'HERO\n\nHeadline:\n"You\'re not burned out. You\'re over-sprinted."\n\nSub:\nA 4-week reset for PMs who are done performing productivity. No hustle stack. No 5am miracle. Just the calm, finished work you keep meaning to do.\n\nCTA:\n[ Enroll — $97 ]  (limit 200 seats · cohort opens Monday)\n\nPROOF STRIP\n"This was the first course that didn\'t make me feel worse about my calendar." — Mira K., PM at Linear' } }],
    [5600, { kind: 'write',     label: 'problem.md', detail: 'problem-agitation section', artifact: { mime: 'text/markdown', name: 'problem.md', preview: 'PROBLEM\n\nYou\'ve read the books. You\'ve tried the apps.\nYou\'ve rearranged your calendar four times this quarter.\n\nAnd somehow:\n- The important work still slips to Friday night.\n- Your "deep work" blocks have become Slack triage with a timer.\n- You feel behind by 10am — and can\'t name what you\'re behind on.\n\nHere\'s what nobody tells PMs:\nThe problem isn\'t your system. It\'s that you\'ve been taught to sprint through work that was never sprintable.' } }],
    [6700, { kind: 'tool',      label: 'price-anchor sweep', detail: 'comparable courses: $197–$497 median' }],
    [7500, { kind: 'write',     label: 'offer.md', detail: 'offer + 3-tier pricing', artifact: { mime: 'text/markdown', name: 'offer.md', preview: 'THE OFFER\n\n4 weeks. 3 live sessions. 1 reset.\n\nWeek 1 — Audit your week (find what you\'re actually being paid for)\nWeek 2 — Kill the performance tax (the 14 hours/week you lose to looking productive)\nWeek 3 — Design a calm system (one that survives a bad sleep and a shipping deadline)\nWeek 4 — Ship something real (a deliverable, not a process)\n\nPRICING\n\nCohort seat — $97\nCohort + 1:1 audit — $297\nTeam of 5 — $397' } }],
    [8400, { kind: 'write',     label: 'faq.md', detail: '7 objection-handled FAQs', artifact: { mime: 'text/markdown', name: 'faq.md', preview: 'FAQ\n\nQ: Is this just another productivity course?\nA: No. This is a productivity de-course. Most of week 1 is you unsubscribing from things.\n\nQ: I\'ve tried this stuff before.\nA: You\'ve tried hustle disguised as calm. This is the opposite: we do less, on purpose, and ship more.\n\nQ: I\'m not a PM.\nA: If your calendar is full and your important work isn\'t getting done, you\'re close enough.\n\nQ: Will there be homework?\nA: Roughly 90 minutes per week. We designed it to survive a bad week.' } }],
    [9100, { kind: 'thought',   label: 'running brand-voice check', detail: 'warm + direct · no hustle language · no emoji' }],
    [9700, { kind: 'log',       label: 'voice check ✓  (94/100)' }],
    [10200,{ kind: 'milestone', label: 'draft complete · delivering' }],
  ],
  'aperture': [
    [0,    { kind: 'milestone', label: 'execution started', detail: 'run_id: ap_mk9q · 40 variants requested' }],
    [500,  { kind: 'read',      label: 'loading brand kit', detail: 'pickleball-paddle brand · palette · tone · prior 3 launches' }],
    [1100, { kind: 'tool',      label: 'competitor ad scrape', detail: 'Meta Ad Library · pickleball · last 30 days' }],
    [2100, { kind: 'log',       label: '312 ads pulled · 8 hook archetypes extracted' }],
    [2800, { kind: 'thought',   label: 'clustering angles', detail: 'problem-aware × {feel, spin, durability, community}' }],
    [3600, { kind: 'write',     label: 'angle-matrix.json', detail: '8 angles × 5 hooks', artifact: { mime: 'application/json', name: 'angle-matrix.json', preview: '{\n  "angles": {\n    "feel": ["softer hit, same power", "the paddle that stops stinging your elbow"],\n    "spin": ["grip the ball, not just hit it", "3× spin over standard foam"],\n    "durability": ["1 season vs. 3 seasons", "still flat after 400 hours"],\n    "community": ["the paddle your league already plays with"],\n    "price-anchor": ["$149 paddle that plays like $349"],\n    "testimonial": ["Mark L., 4.0 rec league: \\"Switched mid-tournament.\\""],\n    "founder": ["built by a player who couldn\'t find a good paddle"],\n    "contrarian": ["every paddle ad looks the same. here\'s ours."]\n  }\n}' } }],
    [4900, { kind: 'write',     label: 'variants-01-10.md', detail: '10 ad variants · feel + spin angles', artifact: { mime: 'text/markdown', name: 'variants-01-10.md', preview: 'VARIANT 01 — feel / problem-aware\nHook: "Your elbow shouldn\'t hurt after pickleball."\nBody: Most paddles transfer vibration straight into your arm. Ours doesn\'t. Carbon core + proprietary foam = 42% less vibration, same pop.\nCTA: Shop the paddle →\n\nVARIANT 02 — feel / social proof\nHook: "Why 4.0+ players switched to the [Brand] Control."\nBody: Softer hit. Cleaner spin. No elbow tax. Built for players who want to keep playing at 50.\nCTA: See the specs →\n\nVARIANT 03 — feel / contrarian\nHook: "Every paddle ad shows someone diving. Ours doesn\'t."\nBody: We\'re not selling a dive. We\'re selling Thursday-night league play, 40 weeks a year, without icing your arm.\nCTA: Shop →\n\n...(7 more)' } }],
    [6200, { kind: 'write',     label: 'variants-11-20.md', detail: '10 ad variants · durability + community', artifact: { mime: 'text/markdown', name: 'variants-11-20.md', preview: 'VARIANT 11 — durability / testimonial\nHook: "400 hours in. Still flat."\nBody: Most paddles warp by hour 120. Ours uses a honeycomb core that shrugs off heat, humidity, and 200mph smashes.\nCTA: See the test →\n\nVARIANT 12 — durability / math\nHook: "$149 once. $89/year if you count replacements."\n...(9 more)' } }],
    [7400, { kind: 'write',     label: 'variants-21-30.md', detail: '10 ad variants · testimonial + price', artifact: { mime: 'text/markdown', name: 'variants-21-30.md', preview: 'VARIANT 21 — testimonial\nHook: Mark L., 4.0 rec league\n"I switched mid-tournament. Won the next two matches."\n\nVARIANT 22 — price anchor\n"The $149 paddle that plays like a $349 one."\n...(8 more)' } }],
    [8500, { kind: 'write',     label: 'variants-31-40.md', detail: '10 ad variants · founder + contrarian', artifact: { mime: 'text/markdown', name: 'variants-31-40.md', preview: 'VARIANT 31 — founder story\nHook: "I built this paddle because none of them felt right at 50."\nBody: Three years, 40 prototypes, one goal: a paddle that lets you play as long as you want to play.\n...(9 more)' } }],
    [9300, { kind: 'tool',      label: 'brand-safety sweep', detail: 'Meta policy + claim-risk scan' }],
    [9800, { kind: 'log',       label: '40/40 pass · 0 flagged claims' }],
    [10400,{ kind: 'milestone', label: 'ad pack ready · delivering to Meta draft' }],
  ],
  'helios': [
    [0,    { kind: 'milestone', label: 'execution started', detail: 'run_id: hl_r2n4' }],
    [500,  { kind: 'thought',   label: 'scoping research', detail: 'SMB bookkeeping · top 8 · pricing · GTM motions' }],
    [1200, { kind: 'tool',      label: 'search · SMB bookkeeping software 2026' }],
    [2000, { kind: 'tool',      label: 'search · bookkeeping competitors Bench Pilot Xendoo' }],
    [2800, { kind: 'log',       label: '47 sources queued · 23 relevant' }],
    [3600, { kind: 'read',      label: 'G2 · SMB accounting category (top 20)' }],
    [4500, { kind: 'read',      label: 'SimilarWeb · traffic + channel mix · 8 competitors' }],
    [5400, { kind: 'read',      label: 'review mining · 840 reviews across G2 + Capterra' }],
    [6300, { kind: 'thought',   label: 'synthesizing pricing table' }],
    [7000, { kind: 'write',     label: 'pricing-matrix.csv', detail: '8 competitors × 5 pricing dims', artifact: { mime: 'text/csv', name: 'pricing-matrix.csv', preview: 'competitor,entry,mid,top,setup_fee,onboarding\nBench,249/mo,399/mo,699/mo,0,5–10 days\nPilot,499/mo,849/mo,1499/mo,0,7–14 days\nXendoo,395/mo,595/mo,995/mo,0,3–7 days\n1800Accountant,179/mo,329/mo,579/mo,199,5 days\nKickBooks (us),TBD,TBD,TBD,TBD,TBD\nCollective,349/mo,,,,10–14 days\nAcuity,1200/mo (custom),,,,\nQuickBooks Live,200/mo,400/mo,,,3–5 days' } }],
    [8200, { kind: 'write',     label: 'gtm-motions.md', detail: 'channel mix · positioning · wedge', artifact: { mime: 'text/markdown', name: 'gtm-motions.md', preview: 'GTM MOTIONS — SMB BOOKKEEPING\n\nBench → SEO-heavy, content engine (150+ posts/mo), strong partner program with Shopify + Stripe. Weakness: high churn on price-sensitive segment.\n\nPilot → Outbound-heavy, YC network, enterprise-flavored positioning. Playing up the market. Weakness: too expensive for true SMB <$500k revenue.\n\nXendoo → Paid social + affiliate. Leaning into "CPA-on-demand" angle. Weakness: undifferentiated feature set.\n\n...(5 more)\n\nTHE WEDGE FOR KICKBOOKS\nEveryone is racing upmarket. The bottom of the SMB segment (<$250k revenue, 1–3 employees) is being actively abandoned. There\'s a $300–500/mo price band with no serious operator.' } }],
    [9400, { kind: 'write',     label: 'executive-summary.md', detail: 'TL;DR + 3 recommendations', artifact: { mime: 'text/markdown', name: 'executive-summary.md', preview: 'EXECUTIVE SUMMARY\n\nTL;DR — the top of the SMB bookkeeping market is crowded and moving upmarket. The bottom (<$250k revenue accounts) has real demand and thinning supply. A focused entrant can take 3–5% market share in 18 months with the right wedge.\n\nRECOMMENDATIONS\n\n1. Position at the $249/mo floor. Every incumbent either starts at $395 or is marching toward it.\n2. Build the Shopify / Stripe partner loop first. Bench proved the channel; its mid-market drift creates an opening.\n3. Skip the "human CPA on-demand" narrative. That\'s an arms race you can\'t afford. Lean into async + AI-assisted instead.' } }],
    [10100,{ kind: 'milestone', label: 'report complete · delivering' }],
  ],
  'triage-01': [
    [0,    { kind: 'milestone', label: 'execution started · triage loop active' }],
    [600,  { kind: 'read',      label: 'ticket 4821 · shipping delay', detail: 'customer: 4 days past ETA · order $89 · priority: medium' }],
    [1200, { kind: 'tool',      label: 'shopify · order lookup', detail: '#4821 · shipped 2 days ago · carrier: USPS' }],
    [1800, { kind: 'tool',      label: 'carrier · tracking hit', detail: 'in transit · arrives Thu' }],
    [2400, { kind: 'write',     label: 'reply-4821.md', detail: 'shipping-delay · friendly tone', artifact: { mime: 'text/markdown', name: 'reply-4821.md', preview: 'Hey Sam —\n\nTotally hear you on this, four days past ETA is genuinely annoying. I checked the tracking: your paddle is actually in transit and scheduled to land Thursday (carrier bumped it a day). I\'ll keep an eye on it and if it doesn\'t show by end of day Thursday, I\'ll just ship you a replacement, no questions.\n\nAs a small thanks for your patience, I\'ve added a $15 credit to your account.\n\n— Mira (via the support team)' } }],
    [3100, { kind: 'milestone', label: 'ticket 4821 resolved' }],
    [3400, { kind: 'read',      label: 'ticket 4822 · sizing question' }],
    [3800, { kind: 'tool',      label: 'kb · paddle sizing chart' }],
    [4400, { kind: 'write',     label: 'reply-4822.md', detail: 'sizing · concise', artifact: { mime: 'text/markdown', name: 'reply-4822.md', preview: 'Hey Jon —\n\nFor a 6\'0" player at ~190 lbs coming from tennis, you\'ll want the Control in the 13mm thickness. Gives you the deeper pocket you\'re used to without the arm shock that tennis crossovers usually complain about.\n\nIf it doesn\'t feel right in the first two weeks, send it back — we cover the return.\n\n— Mira' } }],
    [5000, { kind: 'milestone', label: 'ticket 4822 resolved' }],
    [5300, { kind: 'read',      label: 'ticket 4823 · refund request' }],
    [5900, { kind: 'tool',      label: 'policy check · 30-day return' }],
    [6300, { kind: 'log',       label: 'within policy · auto-approve path' }],
    [6800, { kind: 'write',     label: 'reply-4823.md', detail: 'refund approved · apology', artifact: { mime: 'text/markdown', name: 'reply-4823.md', preview: 'Hey Priya —\n\nThat\'s completely fair. I\'ve started the refund (~$149) and it should land in 3–5 business days. No return label needed for this one, keep or donate the paddle.\n\nIf you ever want to try the softer core (the Control Flex), let me know — I\'ll send one on us.\n\n— Mira' } }],
    [7400, { kind: 'milestone', label: 'ticket 4823 resolved' }],
    [7700, { kind: 'log',       label: 'batch complete · 3/3 resolved · 0 escalations' }],
    [8200, { kind: 'milestone', label: 'batch delivered · summary ready' }],
  ],
  'operator-dm': [
    [0,    { kind: 'milestone', label: 'execution started', detail: 'run_id: op_3fj9' }],
    [500,  { kind: 'read',      label: 'loading company context', detail: 'SaaS · $1.4M ARR · 18 FTEs · target: $4M by EOY' }],
    [1200, { kind: 'tool',      label: 'benchmark · ARR-per-head by stage' }],
    [2000, { kind: 'thought',   label: 'reverse-engineering hire plan', detail: '$4M / 350k ARR-per-head target = 11–12 revenue-producing heads' }],
    [2800, { kind: 'read',      label: 'current org chart · role mapping' }],
    [3600, { kind: 'write',     label: 'hire-plan.md', detail: 'quarterly hire roadmap', artifact: { mime: 'text/markdown', name: 'hire-plan.md', preview: 'HIRE PLAN — $1.4M → $4M by EOY\n\nTARGET SHAPE\n- 24 total heads by Q4 (up from 18)\n- 12 revenue-producing (sales/CS/demand) vs 6 today\n- $167k ARR-per-head at exit — healthy for your segment\n\nQ1 HIRES (priority)\n1. Sr. AE #3 — (you have 2, they\'re at 140% quota, you\'re leaving pipeline on the floor)\n2. Demand Gen Manager — the biggest gap. You\'re inbound-dependent and it\'s plateauing.\n3. CS Manager — unblocks your founder from CS reactive work (~12 hrs/wk reclaimed)\n\nQ2 HIRES\n4. Sr. AE #4\n5. SDR #2 + #3 (pair-pod model with the new AEs)\n6. Product Marketing hire — positions the v2 launch\n\nQ3–Q4\n7. AE #5, SDR #4\n8. CS #2, CS #3\n9. Eng backfill + senior PM\n\nDO NOT HIRE (yet)\n- VP Sales (you\'re not there — founder-led through Q3 is cheaper)\n- Head of Ops (bundle into CS Mgr for now)' } }],
    [5200, { kind: 'write',     label: 'budget.csv', detail: 'fully-loaded cost by quarter', artifact: { mime: 'text/csv', name: 'budget.csv', preview: 'quarter,role,base,ote,loaded_cost,rationale\nQ1,Sr AE #3,120k,240k,288k,"2 AEs at 140% quota"\nQ1,Demand Gen Mgr,135k,150k,180k,"biggest growth lever"\nQ1,CS Mgr,120k,135k,162k,"unblocks founder"\nQ2,Sr AE #4,120k,240k,288k,pipeline\nQ2,SDR #2,70k,95k,114k,pair-pod\nQ2,SDR #3,70k,95k,114k,pair-pod\nQ2,PMM,140k,155k,186k,v2 launch\nQ3,AE #5,120k,240k,288k,scaling\nQ3,SDR #4,70k,95k,114k,\nQ4,CS #2,85k,95k,114k,\nQ4,CS #3,85k,95k,114k,\nQ4,Sr PM,170k,185k,222k,product velocity' } }],
    [6500, { kind: 'write',     label: 'risks.md', detail: 'what breaks this plan', artifact: { mime: 'text/markdown', name: 'risks.md', preview: 'WHAT BREAKS THIS PLAN\n\n1. You can\'t hire the Demand Gen Manager in Q1.\n   → without demand, the Q2 AEs starve. Fallback: agency + 1 contractor = 70% as good, 40% of the cost.\n\n2. Your AE ramp is longer than 90 days.\n   → you miss your Q3 target. Fallback: over-hire SDRs early, convert top SDR.\n\n3. You hit a churn wall at ~$2.5M ARR.\n   → classic $2–3M inflection. Fallback: pull the CS hires forward by a quarter.' } }],
    [7500, { kind: 'milestone', label: 'plan complete · delivering' }],
  ],
};

// fallback for any agent id not explicitly scripted
const GENERIC_SCRIPT = [
  [0,    { kind: 'milestone', label: 'execution started' }],
  [600,  { kind: 'read',      label: 'loading context', detail: 'client profile · memory · brief' }],
  [1400, { kind: 'thought',   label: 'planning approach' }],
  [2200, { kind: 'tool',      label: 'searching reference material' }],
  [3100, { kind: 'log',       label: '42 sources indexed' }],
  [3900, { kind: 'thought',   label: 'drafting output' }],
  [4800, { kind: 'write',     label: 'draft.md', detail: 'first pass', artifact: { mime: 'text/markdown', name: 'draft.md', preview: 'Draft output — preview not configured for this agent.' } }],
  [6000, { kind: 'tool',      label: 'self-review pass' }],
  [6900, { kind: 'write',     label: 'final.md', detail: 'cleaned up', artifact: { mime: 'text/markdown', name: 'final.md', preview: 'Final output — preview not configured for this agent.' } }],
  [8000, { kind: 'milestone', label: 'delivery ready' }],
];

function getScript(agentId) { return TRACE_SCRIPTS[agentId] || GENERIC_SCRIPT; }

// ---- glyphs for event kinds ----------------------------------------------
const KIND_META = {
  tool:      { glyph: '∘',  color: '#8b93a8' },
  shell:     { glyph: '$',  color: '#8b93a8' },
  read:      { glyph: '←',  color: '#6b8fd4' },
  write:     { glyph: '→',  color: '#3fb68b' },
  log:       { glyph: '·',  color: '#6b7385' },
  thought:   { glyph: '~',  color: '#b7a76b' },
  milestone: { glyph: '●',  color: '#d97757' },
};

// ---- main component -------------------------------------------------------
function LiveTrace({ agent, T, type, elapsed, onDeliver }) {
  const script = getScript(agent.id);
  const [events, setEvents] = React.useState([]);
  const [openArtifact, setOpenArtifact] = React.useState(null);
  const scrollRef = React.useRef(null);
  const startedAt = React.useRef(Date.now());

  // Drive the script forward in real time.
  React.useEffect(() => {
    const timeouts = script.map(([delay, evt]) =>
      setTimeout(() => {
        setEvents(prev => [...prev, { ...evt, ts: Date.now() }]);
        if (evt.kind === 'milestone' && /deliver/i.test(evt.label)) {
          setTimeout(() => onDeliver?.(), 800);
        }
      }, delay)
    );
    return () => timeouts.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autoscroll terminal to bottom as events arrive.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events.length]);

  const secsSinceStart = (ts) => ((ts - startedAt.current) / 1000).toFixed(1);
  const fileChips = events.filter(e => e.kind === 'write' && e.artifact);

  return (
    <div style={{ padding: '24px 28px 28px' }}>
      {/* Header strip */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', background: '#3fb68b',
            boxShadow: '0 0 0 0 rgba(63,182,139,0.6)',
            animation: 'lt-pulse 1.6s ease-out infinite',
          }}/>
          <span style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1.2, color: T.textDim }}>
            LIVE · STREAMING FROM {agent.handle.toUpperCase()}
          </span>
        </div>
        <div style={{ fontFamily: type.mono, fontSize: 11, color: T.textDim }}>
          {events.length} events · {elapsed}s elapsed
        </div>
      </div>

      {/* Terminal */}
      <div style={{
        background: '#0f1115',
        borderRadius: 10,
        border: '1px solid #1f2430',
        overflow: 'hidden',
      }}>
        {/* Title bar */}
        <div style={{
          padding: '8px 14px',
          borderBottom: '1px solid #1f2430',
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: type.mono, fontSize: 11, color: '#6b7385',
        }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3a3f4d' }}/>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3a3f4d' }}/>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3a3f4d' }}/>
          <span style={{ marginLeft: 8 }}>trace · run_id {agent.id}_{Math.floor(startedAt.current / 1000).toString(36).slice(-4)}</span>
          <span style={{ marginLeft: 'auto' }}>stream_progress v1</span>
        </div>

        {/* Scrolling event log */}
        <div
          ref={scrollRef}
          style={{
            height: 260,
            overflowY: 'auto',
            padding: '12px 14px',
            fontFamily: type.mono,
            fontSize: 12,
            lineHeight: 1.6,
            color: '#d4d8e0',
          }}
        >
          {events.map((e, i) => {
            const meta = KIND_META[e.kind] || KIND_META.log;
            const t = secsSinceStart(e.ts);
            const isWrite = e.kind === 'write' && e.artifact;
            return (
              <div
                key={i}
                style={{
                  display: 'flex', gap: 10, alignItems: 'baseline',
                  opacity: 0, animation: 'lt-fadein 220ms ease-out forwards',
                  cursor: isWrite ? 'pointer' : 'default',
                }}
                onClick={() => isWrite && setOpenArtifact(e.artifact)}
              >
                <span style={{ color: '#4a5060', width: 36, flexShrink: 0 }}>{t}s</span>
                <span style={{ color: meta.color, width: 12, flexShrink: 0, textAlign: 'center' }}>{meta.glyph}</span>
                <span style={{ flex: 1 }}>
                  {isWrite ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '1px 8px 2px',
                      background: 'rgba(63,182,139,0.12)',
                      border: '1px solid rgba(63,182,139,0.28)',
                      borderRadius: 4,
                      color: '#6ed0a8',
                    }}>
                      wrote {e.label}
                      <span style={{ fontSize: 10, opacity: 0.7 }}>↗ preview</span>
                    </span>
                  ) : (
                    <span style={{ color: e.kind === 'milestone' ? '#e8b48a' : '#d4d8e0' }}>{e.label}</span>
                  )}
                  {e.detail && (
                    <div style={{ color: '#6b7385', marginLeft: 0, fontSize: 11 }}>
                      {e.detail}
                    </div>
                  )}
                </span>
              </div>
            );
          })}
          {/* blinking cursor */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', color: '#4a5060' }}>
            <span style={{ width: 36 }}/>
            <span style={{ width: 12 }}/>
            <span style={{ width: 8, height: 13, background: '#3fb68b', display: 'inline-block', animation: 'lt-blink 1s steps(2) infinite' }}/>
          </div>
        </div>

        {/* Artifact chip rail */}
        {fileChips.length > 0 && (
          <div style={{
            borderTop: '1px solid #1f2430',
            padding: '10px 14px',
            display: 'flex', flexWrap: 'wrap', gap: 6,
            background: '#0b0d12',
          }}>
            <span style={{ fontFamily: type.mono, fontSize: 10, color: '#4a5060', letterSpacing: 1, alignSelf: 'center', marginRight: 4 }}>
              ARTIFACTS
            </span>
            {fileChips.map((e, i) => (
              <button
                key={i}
                onClick={() => setOpenArtifact(e.artifact)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  padding: '4px 9px',
                  background: openArtifact?.name === e.artifact.name ? agent.swatch : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${openArtifact?.name === e.artifact.name ? agent.swatch : '#1f2430'}`,
                  borderRadius: 4,
                  fontFamily: type.mono, fontSize: 11,
                  color: openArtifact?.name === e.artifact.name ? '#fff' : '#9ea5b5',
                }}
              >
                {e.artifact.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Inline artifact preview */}
      {openArtifact && (
        <div style={{
          marginTop: 12,
          border: `1px solid ${T.line}`,
          borderRadius: 10,
          background: T.panel,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 14px',
            borderBottom: `1px solid ${T.lineSoft}`,
            display: 'flex', alignItems: 'center', gap: 10,
            background: T.panelSoft,
          }}>
            <span style={{ fontFamily: type.mono, fontSize: 10, letterSpacing: 1, color: T.textDim }}>
              PREVIEW
            </span>
            <span style={{ fontFamily: type.mono, fontSize: 12, color: T.text, fontWeight: 600 }}>
              {openArtifact.name}
            </span>
            <span style={{ fontFamily: type.mono, fontSize: 10, color: T.textDim }}>
              {openArtifact.mime}
            </span>
            <button
              onClick={() => setOpenArtifact(null)}
              style={{
                all: 'unset', marginLeft: 'auto', cursor: 'pointer',
                fontFamily: type.mono, fontSize: 11, color: T.textDim,
                padding: '2px 8px',
              }}
            >close</button>
          </div>
          <pre style={{
            margin: 0,
            padding: '14px 16px',
            fontFamily: type.mono,
            fontSize: 12,
            lineHeight: 1.55,
            color: T.text,
            maxHeight: 260,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>{openArtifact.preview}</pre>
          <div style={{
            padding: '8px 14px',
            borderTop: `1px solid ${T.lineSoft}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontFamily: type.mono, fontSize: 10, color: T.textDim,
          }}>
            <span>streaming · hash-signed · delivered on completion</span>
            <span>{(openArtifact.preview.length / 1024).toFixed(1)} KB</span>
          </div>
        </div>
      )}

      {/* Footnote */}
      <div style={{
        marginTop: 14,
        fontFamily: type.mono, fontSize: 10, color: T.textDim,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span>stream_progress events are agent-POSTed · we fanout, never host</span>
        <span>replayable · signed · privacy-redacted</span>
      </div>

      <style>{`
        @keyframes lt-fadein {
          from { opacity: 0; transform: translateY(3px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lt-blink { 50% { opacity: 0; } }
        @keyframes lt-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(63,182,139,0.55); }
          100% { box-shadow: 0 0 0 8px rgba(63,182,139,0); }
        }
      `}</style>
    </div>
  );
}

window.LiveTrace = LiveTrace;
