import { useState, useEffect, useRef } from "react";

// ── API Key Gate ─────────────────────────────────────────────────────
function ApiKeyGate({ onKey }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");

  function submit() {
    if (!val.startsWith("sk-ant-")) {
      setErr("Key moet beginnen met sk-ant-");
      return;
    }
    sessionStorage.setItem("anthropic_key", val.trim());
    onKey(val.trim());
  }

  return (
    <div style={{
      background: "#070B14", minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono','Courier New',monospace"
    }}>
      <div style={{ width: 420, padding: 32, border: "1px solid #1e293b", borderRadius: 8, background: "#0a0f1e" }}>
        <div style={{ fontSize: 9, letterSpacing: 3, color: "#334155", marginBottom: 8 }}>MOJO TRADING OPS</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>NAS100 Dashboard</div>
        <div style={{ fontSize: 11, color: "#475569", marginBottom: 24 }}>
          Voer je Anthropic API-key in om door te gaan.<br/>
          Key wordt alleen in de sessie bewaard — nooit opgeslagen.
        </div>
        <input
          type="password"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="sk-ant-api03-..."
          style={{
            width: "100%", padding: "10px 14px", background: "#111827",
            border: "1px solid #1e293b", borderRadius: 4, color: "#e2e8f0",
            fontSize: 12, fontFamily: "inherit", outline: "none", marginBottom: 10
          }}
        />
        {err && <div style={{ fontSize: 10, color: "#ef4444", marginBottom: 8 }}>{err}</div>}
        <button onClick={submit} style={{
          width: "100%", padding: 10, background: "#f59e0b", color: "#0a0f1e",
          border: "none", borderRadius: 4, fontSize: 11, fontWeight: 700,
          letterSpacing: 1, cursor: "pointer", fontFamily: "inherit"
        }}>INLOGGEN</button>
        <div style={{ fontSize: 10, color: "#1e293b", marginTop: 12, lineHeight: 1.6 }}>
          API-key verkrijgen: platform.anthropic.com → API Keys<br/>
          Kosten: ~$0.003 per briefing (Sonnet)
        </div>
      </div>
    </div>
  );
}

// ── Constants ────────────────────────────────────────────────────────
const SESSIONS = {
  asian:   { label: "ASIAN",    start: 23, end: 8,  color: "#6366f1", desc: "Tokyo / Sydney" },
  london:  { label: "LONDON",   start: 7,  end: 16, color: "#f59e0b", desc: "LSE Open 08:00 GMT" },
  overlap: { label: "OVERLAP",  start: 12, end: 16, color: "#ef4444", desc: "London–NY Power Hour" },
  ny:      { label: "NEW YORK", start: 13, end: 21, color: "#10b981", desc: "NYSE Open 13:30 UTC" },
};

const CYCLE_CONTEXT = {
  kwave:        { phase: "Late Winter → Early Spring (6th K-Wave)", bias: "Structural bull — AI carrier technology", color: "#10b981" },
  juglar:       { phase: "Mid-expansion (~2023–2027)", bias: "Capex cycle rising — tech favoured", color: "#10b981" },
  kitchin:      { phase: "Inventory restocking (2025–2026)", bias: "Mild tailwind for risk assets", color: "#f59e0b" },
  presidential: { phase: "Year 2 post-election (2026)", bias: "Historically volatile — mid-cycle reset risk", color: "#ef4444" },
};

const DAY_PATTERNS = [
  { day: 0, name: "Sunday",    bias: "CLOSED",   note: "Futures gap risk at open" },
  { day: 1, name: "Monday",    bias: "CAUTIOUS", note: "Gap fill tendency. Wait for London direction." },
  { day: 2, name: "Tuesday",   bias: "ACTIVE",   note: "High follow-through. Strong trend day probability." },
  { day: 3, name: "Wednesday", bias: "ACTIVE",   note: "Mid-week momentum. Watch FOMC/data." },
  { day: 4, name: "Thursday",  bias: "ACTIVE",   note: "NY session often reversal day vs Wednesday." },
  { day: 5, name: "Friday",    bias: "CAUTIOUS", note: "Position squaring. Fades into close." },
  { day: 6, name: "Saturday",  bias: "CLOSED",   note: "No session." },
];

const SEASONAL = [
  { months: [0,1],    label: "Jan–Feb",  bias: "BULLISH",  note: "January effect, new flows" },
  { months: [2,3],    label: "Mar–Apr",  bias: "MIXED",    note: "Q1 earnings — high volatility" },
  { months: [4],      label: "May",      bias: "CAUTIOUS", note: "'Sell in May' — reduce size" },
  { months: [5,6,7],  label: "Jun–Aug",  bias: "BEARISH",  note: "Summer thin — false breakouts" },
  { months: [8],      label: "Sep",      bias: "BEARISH",  note: "Historically worst month for NAS" },
  { months: [9,10],   label: "Oct–Nov",  bias: "BULLISH",  note: "Q3 earnings, year-end rally starts" },
  { months: [11],     label: "Dec",      bias: "BULLISH",  note: "Santa rally + thin liquidity" },
];

const PLAYBOOKS = {
  london: [
    { name: "London Open Breakout",  time: "08:00–08:45 GMT", rule: "Mark Asian High/Low. Wait for 5m candle close buiten de range. Enter op retest. SL: andere kant van range. Target 1:2 min.", bias: "TREND" },
    { name: "Asia Range Fade",        time: "08:00–09:30 GMT", rule: "Als NAS100 opent binnen Asian range en cyclus bias is neutraal — fade de extremen met strak SL (10–15 punten).", bias: "COUNTER" },
    { name: "London Killzone Long",   time: "08:00–10:00 GMT", rule: "Zoek HTF demand zone. Wacht op liquidity sweep + 15m BOS. Enter met 1:3 min RR. Alleen bij bullish cyclus bias.", bias: "TREND" },
  ],
  ny: [
    { name: "NY Open Momentum",       time: "13:30–14:15 UTC", rule: "Align met London trend. Enter op eerste 5m pullback na 13:30 candle. SL: pre-market low/high. Size: 75% van normaal.", bias: "TREND" },
    { name: "London Close Reversal",  time: "16:00–16:45 UTC", rule: "Watch voor reversal als London uitstapt. Tegengesteld aan London trend. Alleen 30m setup. Kleine size.", bias: "COUNTER" },
    { name: "NY Power Hour",          time: "19:00–20:00 UTC", rule: "Finale push of fade richting close. Alleen traden bij sterke trend. Size halveren. Sluit voor NY close.", bias: "TREND" },
  ],
};

const TEAM = [
  {
    id: "cycle_analyst", name: "Vera Cycles", role: "Cycle Analyst", avatar: "📊", color: "#00E5C8",
    systemPrompt: `You are Vera Cycles, a senior Cycle Analyst specializing in market cycle theory for trading research. 
Your expertise covers: Kondratieff waves (50-60yr), Juglar cycles (7-11yr), Kitchin inventory cycles (3-5yr), Presidential cycles, and seasonal patterns.
Be analytical, precise, and data-oriented. Reference specific cycle phases and historical precedents.
Keep answers sharp and actionable. Focus on identifying WHERE we are in each relevant cycle and WHAT that implies for NAS100 trading strategy.
Max 200 words per response.`,
  },
  {
    id: "quant", name: "Max Signal", role: "Quant Strategist", avatar: "⚙️", color: "#FFB800",
    systemPrompt: `You are Max Signal, a quantitative strategist who builds systematic trading strategies based on cycle theory for NAS100.
Your expertise: converting cycle phase indicators into precise entry/exit rules, backtesting frameworks, signal construction.
Be concrete. Give specific indicators, thresholds, and rules. Think in terms of: What do I code? What do I test?
Focus on: specific cycle indicators, position sizing rules by cycle phase, risk-adjusted return targets.
Avoid theory. Deliver executable ideas. Max 200 words per response.`,
  },
  {
    id: "macro", name: "Elena Macro", role: "Macro Economist", avatar: "🌐", color: "#A78BFA",
    systemPrompt: `You are Elena Macro, a macro economist specializing in the economic forces that drive market cycles affecting NAS100.
Your expertise: credit cycles, interest rate cycles, inflation cycles, liquidity cycles, central bank policy.
Connect economic fundamentals to cycle theory. Explain WHY cycles occur, not just WHEN.
Focus on: current macro regime, how credit expansion/contraction maps to cycle phases, which assets outperform in each phase.
Be direct about uncertainty. Max 200 words per response.`,
  },
  {
    id: "risk", name: "Dax Risk", role: "Risk Manager", avatar: "🛡️", color: "#F87171",
    systemPrompt: `You are Dax Risk, a risk manager who stress-tests cycle-based NAS100 trading strategies on Vantage Markets cash CFD.
Your expertise: drawdown analysis, cycle phase risk allocation, tail risk in cycle transitions, stop-loss frameworks.
Challenge assumptions. Point out where cycle strategies fail.
Focus on: % capital per cycle phase, cycle invalidation signals, managing risk during transitions.
Be the skeptic who makes the strategy robust. Max 200 words per response.`,
  },
  {
    id: "data", name: "Kai Data", role: "Data Scientist", avatar: "🔬", color: "#34D399",
    systemPrompt: `You are Kai Data, a data scientist specializing in building cycle indicator infrastructure for NAS100 trading.
Your expertise: time-series analysis, cycle detection algorithms (FFT, Hilbert Transform, Hurst Exponent), data sources.
Be technical and specific about data and methods.
Focus on: which data sources to use, how to build reliable cycle indicators, validation methodology, avoiding look-ahead bias.
Think in code and data pipelines. Max 200 words per response.`,
  },
];

const BRIEFING_STARTERS = [
  "What phase of the Kondratieff wave are we in and what does that mean for NAS100?",
  "How do I build a systematic entry rule based on the Presidential cycle for NAS100?",
  "What macro indicators should I track to identify cycle transitions?",
  "Where are the biggest risks when trading NAS100 based on cycle theory?",
  "What data sources should we use to build a cycle dashboard for daily trading?",
];

// ── Helpers ──────────────────────────────────────────────────────────
function getSessionNow(h) {
  if (h >= 12 && h < 16) return "overlap";
  if (h >= 7  && h < 16) return "london";
  if (h >= 13 && h < 21) return "ny";
  return "asian";
}
function getSeasonalBias(m) { return SEASONAL.find(s => s.months.includes(m)) || SEASONAL[0]; }
function getDayBias(d)      { return DAY_PATTERNS.find(p => p.day === d) || DAY_PATTERNS[1]; }
function biasColor(b) {
  if (b === "BULLISH" || b === "ACTIVE")   return "#10b981";
  if (b === "BEARISH" || b === "CAUTIOUS") return "#ef4444";
  if (b === "MIXED")  return "#f59e0b";
  return "#6b7280";
}
const pad = n => String(n).padStart(2, "0");

// ── Main App ─────────────────────────────────────────────────────────
export default function App() {
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem("anthropic_key") || "");
  const [view, setView]     = useState("dashboard"); // dashboard | team
  if (!apiKey) return <ApiKeyGate onKey={setApiKey} />;
  return (
    <div style={{ fontFamily: "'DM Mono','Courier New',monospace", background: "#070B14", minHeight: "100vh" }}>
      {/* Top nav */}
      <div style={{
        background: "#070B14", borderBottom: "1px solid #0f172a",
        padding: "8px 20px", display: "flex", gap: 8, alignItems: "center"
      }}>
        <span style={{ fontSize: 11, color: "#334155", flex: 1 }}>MOJO TRADING OPS · NAS100</span>
        {["dashboard","team"].map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: "5px 14px", fontSize: 10, letterSpacing: 1,
            background: view === v ? "#1e293b" : "transparent",
            border: `1px solid ${view === v ? "#334155" : "#0f172a"}`,
            color: view === v ? "#f1f5f9" : "#334155",
            borderRadius: 4, cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase"
          }}>{v === "dashboard" ? "Session Dashboard" : "Research Team"}</button>
        ))}
        <button onClick={() => { sessionStorage.removeItem("anthropic_key"); setApiKey(""); }} style={{
          padding: "5px 10px", fontSize: 9, background: "transparent",
          border: "1px solid #0f172a", color: "#1e293b", borderRadius: 4,
          cursor: "pointer", fontFamily: "inherit"
        }}>LOGOUT</button>
      </div>
      {view === "dashboard" ? <SessionDashboard apiKey={apiKey} /> : <ResearchTeam apiKey={apiKey} />}
    </div>
  );
}

// ── Session Dashboard ─────────────────────────────────────────────────
function SessionDashboard({ apiKey }) {
  const [now, setNow]             = useState(new Date());
  const [activeSession, setAS]    = useState("london");
  const [briefing, setBriefing]   = useState("");
  const [briefLoading, setBL]     = useState(false);
  const [activePlaybook, setAP]   = useState("london");
  const [tab, setTab]             = useState("overview");

  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      setNow(d);
      setAS(getSessionNow(d.getUTCHours()));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const utcH   = now.getUTCHours();
  const utcM   = now.getUTCMinutes();
  const utcS   = now.getUTCSeconds();
  const session  = SESSIONS[activeSession];
  const seasonal = getSeasonalBias(now.getMonth());
  const dayBias  = getDayBias(now.getDay());
  const estH     = (utcH - 5 + 24) % 24;

  const sessionProgress = () => {
    const s = SESSIONS[activeSession];
    let elapsed = utcH - s.start, total = s.end - s.start;
    if (total < 0) total += 24;
    if (elapsed < 0) elapsed += 24;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  async function getBriefing() {
    setBL(true); setBriefing("");
    const prompt = `You are a sharp NAS100 intraday analyst for Vantage Markets cash CFD.

Context:
- Session: ${activeSession.toUpperCase()}
- Kondratieff Wave: Late Winter → Early Spring (6th K-Wave) — Structural bull, AI carrier technology
- Juglar Cycle: Mid-expansion 2023-2027
- Seasonal: ${seasonal.label} — ${seasonal.bias} — ${seasonal.note}
- Day: ${dayBias.name} — ${dayBias.bias} — ${dayBias.note}

Provide a SHARP session briefing:

**MACRO BIAS**: [1 sentence directional lean]
**SESSION BIAS**: [BULLISH/BEARISH/NEUTRAL + 1 sentence reason]
**KEY RISK**: [biggest risk today]
**SETUP TO WATCH**: [1 specific intraday setup]
**INVALIDATION**: [what kills the bias]
**CYCLE ALIGNMENT**: [cycle theory supporting or fighting direction]

Max 180 words. No fluff.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
      });
      const data = await res.json();
      setBriefing(data.content?.find(b => b.type === "text")?.text || "No response.");
    } catch { setBriefing("⚠️ API error."); }
    setBL(false);
  }

  const formatBriefing = text => text.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.includes('**:')) {
      const parts = line.split('**:');
      const key = parts[0].replace(/\*\*/g, '');
      const val = parts.slice(1).join(':').replace(/^\s*/, '').replace(/\*\*/g, '');
      return (
        <div key={i} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: "#f59e0b", letterSpacing: "1.5px" }}>{key}</div>
          <div style={{ fontSize: 12, color: "#e2e8f0", marginTop: 2, lineHeight: 1.6 }}>{val}</div>
        </div>
      );
    }
    return line ? <div key={i} style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>{line.replace(/\*\*/g,'')}</div> : <br key={i}/>;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 41px)" }}>
      {/* Session bar */}
      <div style={{ background: "#0a0f1e", borderBottom: "1px solid #1e293b", padding: "10px 20px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {Object.entries(SESSIONS).map(([key, s]) => {
            const isActive = activeSession === key;
            return (
              <div key={key} onClick={() => { setAS(key); setAP(key==="overlap"||key==="ny"?"ny":"london"); }}
                style={{ flex:1, padding:"8px 10px", border:`1px solid ${isActive?s.color:"#1e293b"}`,
                  borderRadius:4, background:isActive?s.color+"15":"transparent", cursor:"pointer" }}>
                <div style={{ fontSize:9, letterSpacing:"1.5px", color:isActive?s.color:"#475569" }}>{s.label}</div>
                <div style={{ fontSize:9, color:"#334155", marginTop:2 }}>{s.desc}</div>
                {isActive && (
                  <div style={{ marginTop:6, background:"#1e293b", borderRadius:2, height:3 }}>
                    <div style={{ width:`${sessionProgress()}%`, height:"100%", background:s.color, borderRadius:2, transition:"width 1s" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:"#0a0f1e", borderBottom:"1px solid #1e293b", padding:"0 20px", display:"flex" }}>
        <div style={{ marginLeft:"auto", fontSize:13, color:"#f59e0b", padding:"8px 0", letterSpacing:1 }}>
          {pad(utcH)}:{pad(utcM)}:{pad(utcS)} UTC &nbsp;|&nbsp; EST {pad(estH)}:{pad(utcM)}
        </div>
        {["overview","playbooks","cycles","briefing"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:"10px 16px", fontSize:10, letterSpacing:"1.5px", background:"transparent",
            border:"none", borderBottom:`2px solid ${tab===t?"#f59e0b":"transparent"}`,
            color:tab===t?"#f59e0b":"#475569", cursor:"pointer", fontFamily:"inherit", textTransform:"uppercase"
          }}>{t}</button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:20 }}>

        {tab === "overview" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, maxWidth:900 }}>
            <div style={{ gridColumn:"1/-1", background:"#0a0f1e", border:`1px solid ${session.color}40`,
              borderLeft:`3px solid ${session.color}`, borderRadius:6, padding:"14px 18px" }}>
              <div style={{ fontSize:9, letterSpacing:2, color:"#475569", marginBottom:8 }}>ACTIEVE SESSIE</div>
              <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                <div style={{ fontSize:22, fontWeight:700, color:session.color }}>{session.label}</div>
                <div style={{ fontSize:11, color:"#94a3b8" }}>{session.desc}</div>
                <div style={{ marginLeft:"auto", fontSize:11, color:"#475569" }}>
                  Voortgang: <span style={{ color:session.color }}>{Math.round(sessionProgress())}%</span>
                </div>
              </div>
            </div>
            <div style={{ background:"#0a0f1e", border:"1px solid #1e293b", borderRadius:6, padding:16 }}>
              <div style={{ fontSize:9, letterSpacing:2, color:"#475569", marginBottom:10 }}>DAG BIAS</div>
              <div style={{ fontSize:13, color:"#f1f5f9", marginBottom:4 }}>{dayBias.name}</div>
              <div style={{ display:"inline-block", padding:"2px 10px", borderRadius:3, fontSize:10, fontWeight:700,
                background:biasColor(dayBias.bias)+"20", color:biasColor(dayBias.bias), marginBottom:8 }}>{dayBias.bias}</div>
              <div style={{ fontSize:11, color:"#64748b", lineHeight:1.5 }}>{dayBias.note}</div>
            </div>
            <div style={{ background:"#0a0f1e", border:"1px solid #1e293b", borderRadius:6, padding:16 }}>
              <div style={{ fontSize:9, letterSpacing:2, color:"#475569", marginBottom:10 }}>SEIZOENSPATROON</div>
              <div style={{ fontSize:13, color:"#f1f5f9", marginBottom:4 }}>{seasonal.label}</div>
              <div style={{ display:"inline-block", padding:"2px 10px", borderRadius:3, fontSize:10, fontWeight:700,
                background:biasColor(seasonal.bias)+"20", color:biasColor(seasonal.bias), marginBottom:8 }}>{seasonal.bias}</div>
              <div style={{ fontSize:11, color:"#64748b", lineHeight:1.5 }}>{seasonal.note}</div>
            </div>
            <div style={{ gridColumn:"1/-1", background:"#0a0f1e", border:"1px solid #1e293b", borderRadius:6, padding:16 }}>
              <div style={{ fontSize:9, letterSpacing:2, color:"#475569", marginBottom:12 }}>SESSIE TIJDEN (vaste referentie)</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                {[
                  { name:"London Open",     utc:"08:00", est:"03:00", color:"#f59e0b" },
                  { name:"London–NY Overlap",utc:"13:00",est:"08:00", color:"#ef4444" },
                  { name:"NYSE Open",        utc:"14:30", est:"09:30", color:"#10b981" },
                  { name:"London Close",     utc:"16:00", est:"11:00", color:"#6366f1" },
                  { name:"NY Power Hour",    utc:"19:00", est:"14:00", color:"#10b981" },
                  { name:"NY Close",         utc:"21:00", est:"16:00", color:"#ef4444" },
                  { name:"Asia Open",        utc:"23:00", est:"18:00", color:"#6366f1" },
                  { name:"NAS100 Pre-mkt",   utc:"00:00", est:"19:00", color:"#f59e0b" },
                ].map(ev => (
                  <div key={ev.name} style={{ padding:10, border:`1px solid ${ev.color}30`, borderRadius:4, background:ev.color+"08" }}>
                    <div style={{ fontSize:9, color:ev.color, marginBottom:4 }}>{ev.name}</div>
                    <div style={{ fontSize:12, color:"#e2e8f0" }}>UTC {ev.utc}</div>
                    <div style={{ fontSize:10, color:"#475569" }}>EST {ev.est}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "playbooks" && (
          <div style={{ maxWidth:800 }}>
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              {["london","ny"].map(p => (
                <button key={p} onClick={() => setAP(p)} style={{
                  padding:"6px 16px", fontSize:10, letterSpacing:"1.5px",
                  background:activePlaybook===p?(p==="london"?"#f59e0b20":"#10b98120"):"transparent",
                  border:`1px solid ${activePlaybook===p?(p==="london"?"#f59e0b":"#10b981"):"#1e293b"}`,
                  color:activePlaybook===p?(p==="london"?"#f59e0b":"#10b981"):"#475569",
                  borderRadius:4, cursor:"pointer", fontFamily:"inherit", textTransform:"uppercase"
                }}>{p==="london"?"London Sessie":"New York Sessie"}</button>
              ))}
            </div>
            {(PLAYBOOKS[activePlaybook]||[]).map((pb,i) => (
              <div key={i} style={{ background:"#0a0f1e", border:"1px solid #1e293b",
                borderLeft:`3px solid ${activePlaybook==="london"?"#f59e0b":"#10b981"}`,
                borderRadius:6, padding:"14px 18px", marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, flexWrap:"wrap" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#f1f5f9" }}>{pb.name}</div>
                  <div style={{ fontSize:9, padding:"2px 8px", borderRadius:3, background:"#1e293b", color:"#94a3b8" }}>{pb.time}</div>
                  <div style={{ fontSize:9, padding:"2px 8px", borderRadius:3,
                    background:pb.bias==="TREND"?"#10b98120":"#ef444420",
                    color:pb.bias==="TREND"?"#10b981":"#ef4444" }}>{pb.bias}</div>
                </div>
                <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.7 }}>{pb.rule}</div>
              </div>
            ))}
            <div style={{ background:"#0a0f1e", border:"1px solid #f59e0b30", borderRadius:6, padding:"14px 18px" }}>
              <div style={{ fontSize:9, letterSpacing:2, color:"#f59e0b", marginBottom:8 }}>CYCLUS FILTER — TOEPASSEN OP ALLE SETUPS</div>
              <div style={{ fontSize:11, color:"#64748b", lineHeight:1.8 }}>
                ✓ &nbsp;K-Wave: Structureel bull → prefereer longs op dips<br/>
                ✓ &nbsp;Juglar mid-expansion: Momentum favours breakouts boven fades<br/>
                ✓ &nbsp;Presidential Year 2: Verhoogde volatiliteit → stops +25%, size -25%<br/>
                ✓ &nbsp;Seizoen April: Mixed — gebruik alleen intraday signalen<br/>
                ✗ &nbsp;Als dag bias = CAUTIOUS: geen counter-trend setups
              </div>
            </div>
          </div>
        )}

        {tab === "cycles" && (
          <div style={{ maxWidth:800 }}>
            <div style={{ fontSize:9, letterSpacing:2, color:"#475569", marginBottom:16 }}>CYCLUS STACK — NAS100</div>
            {Object.entries(CYCLE_CONTEXT).map(([key,c]) => (
              <div key={key} style={{ background:"#0a0f1e", border:"1px solid #1e293b",
                borderLeft:`3px solid ${c.color}`, borderRadius:6, padding:"12px 18px",
                marginBottom:10, display:"flex", gap:16 }}>
                <div style={{ minWidth:90, fontSize:9, letterSpacing:1, color:c.color, textTransform:"uppercase" }}>
                  {key.replace("presidential","4YR PRES")}
                </div>
                <div>
                  <div style={{ fontSize:12, color:"#e2e8f0", fontWeight:600, marginBottom:3 }}>{c.phase}</div>
                  <div style={{ fontSize:11, color:"#64748b" }}>{c.bias}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop:20 }}>
              <div style={{ fontSize:9, letterSpacing:2, color:"#475569", marginBottom:12 }}>SEIZOENSKALENDER NAS100</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                {SEASONAL.map((s,i) => {
                  const isCurrent = s.months.includes(now.getMonth());
                  return (
                    <div key={i} style={{ padding:"10px 12px",
                      border:`1px solid ${isCurrent?biasColor(s.bias)+"60":"#1e293b"}`,
                      borderRadius:4, background:isCurrent?biasColor(s.bias)+"10":"#0a0f1e" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:11, color:isCurrent?"#f1f5f9":"#475569" }}>{s.label}</span>
                        {isCurrent && <span style={{ fontSize:8, color:biasColor(s.bias) }}>NU</span>}
                      </div>
                      <div style={{ fontSize:9, display:"inline-block", padding:"1px 6px", borderRadius:2,
                        background:biasColor(s.bias)+"20", color:biasColor(s.bias), marginBottom:4 }}>{s.bias}</div>
                      <div style={{ fontSize:10, color:"#475569", lineHeight:1.4 }}>{s.note}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === "briefing" && (
          <div style={{ maxWidth:680 }}>
            <div style={{ fontSize:9, letterSpacing:2, color:"#475569", marginBottom:16 }}>AI SESSIE BRIEFING — CYCLE-INFORMED</div>
            <div style={{ background:"#0a0f1e", border:"1px solid #1e293b", borderRadius:6, padding:16, marginBottom:16 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:12 }}>
                {[["Sessie",session.label],["Dag",dayBias.name+" — "+dayBias.bias],
                  ["Seizoen",seasonal.label+" — "+seasonal.bias],["K-Wave","Late Winter → Spring"]].map(([k,v])=>(
                  <div key={k} style={{ padding:"6px 10px", background:"#111827", borderRadius:3 }}>
                    <span style={{ fontSize:9, color:"#475569" }}>{k}: </span>
                    <span style={{ fontSize:10, color:"#94a3b8" }}>{v}</span>
                  </div>
                ))}
              </div>
              <button onClick={getBriefing} disabled={briefLoading} style={{
                width:"100%", padding:10, background:briefLoading?"#1e293b":"#f59e0b",
                color:briefLoading?"#475569":"#0a0f1e", border:"none", borderRadius:4,
                fontSize:11, fontWeight:700, letterSpacing:1, cursor:briefLoading?"not-allowed":"pointer", fontFamily:"inherit"
              }}>{briefLoading ? "BRIEFING GENEREREN..." : `▶ GET ${session.label} BRIEFING`}</button>
            </div>
            {briefing && (
              <div style={{ background:"#0a0f1e", border:`1px solid ${session.color}40`,
                borderLeft:`3px solid ${session.color}`, borderRadius:6, padding:20 }}>
                <div style={{ fontSize:9, color:session.color, letterSpacing:2, marginBottom:14 }}>
                  {session.label} — {now.toUTCString().slice(0,16)}
                </div>
                {formatBriefing(briefing)}
              </div>
            )}
            {!briefing && !briefLoading && (
              <div style={{ color:"#1e293b", fontSize:11, textAlign:"center", padding:40 }}>
                Klik hierboven voor je sessie briefing.
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ borderTop:"1px solid #0f172a", padding:"6px 20px", display:"flex",
        justifyContent:"space-between", fontSize:9, color:"#0f172a", background:"#070B14" }}>
        <span>MOJO TRADING OPS · NAS100 CASH CFD · VANTAGE MARKETS</span>
        <span>Cyclus bias ≠ handelssignaal · Beheer risico zelfstandig</span>
      </div>
    </div>
  );
}

// ── Research Team ─────────────────────────────────────────────────────
function ResearchTeam({ apiKey }) {
  const [activeAgent, setAA]      = useState(null);
  const [input, setInput]         = useState("");
  const [conversations, setConvs] = useState({});
  const [loading, setLoading]     = useState(false);
  const [briefMode, setBM]        = useState(false);
  const [briefQ, setBQ]           = useState("");
  const [briefResults, setBR]     = useState({});
  const [briefLoading, setBL]     = useState(false);
  const chatEndRef                = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [conversations, activeAgent]);

  const agent   = TEAM.find(a => a.id === activeAgent);
  const curConvo = activeAgent ? (conversations[activeAgent]||[]) : [];

  async function sendMessage() {
    if (!input.trim() || !activeAgent || loading) return;
    const userMsg = { role:"user", content:input.trim() };
    const updated = [...curConvo, userMsg];
    setConvs(c => ({...c, [activeAgent]:updated}));
    setInput(""); setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000,
          system:agent.systemPrompt, messages:updated })
      });
      const data = await res.json();
      const txt  = data.content?.find(b=>b.type==="text")?.text || "No response.";
      setConvs(c => ({...c,[activeAgent]:[...updated,{role:"assistant",content:txt}]}));
    } catch { setConvs(c => ({...c,[activeAgent]:[...updated,{role:"assistant",content:"⚠️ API error."}]})); }
    setLoading(false);
  }

  async function runBriefing() {
    if (!briefQ.trim()) return;
    setBL(true); setBR({});
    const results = {};
    await Promise.all(TEAM.map(async a => {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST",
          headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01"},
          body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000,
            system:a.systemPrompt, messages:[{role:"user",content:briefQ}] })
        });
        const data = await res.json();
        results[a.id] = data.content?.find(b=>b.type==="text")?.text || "No response.";
      } catch { results[a.id] = "⚠️ API error."; }
    }));
    setBR(results); setBL(false);
  }

  return (
    <div style={{ display:"flex", height:"calc(100vh - 41px)" }}>
      {/* Sidebar */}
      <div style={{ width:200, borderRight:"1px solid #1e293b", padding:"12px 0", overflowY:"auto", flexShrink:0, background:"#0a0f1e" }}>
        <div style={{ padding:"0 14px 8px", fontSize:9, letterSpacing:2, color:"#1e293b" }}>ANALISTEN</div>
        {TEAM.map(a => (
          <div key={a.id} onClick={() => { setAA(a.id); setBM(false); }} style={{
            padding:"10px 14px", cursor:"pointer",
            borderLeft:`2px solid ${activeAgent===a.id?a.color:"transparent"}`,
            background:activeAgent===a.id?"#111827":"transparent"
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
              <span style={{ fontSize:13 }}>{a.avatar}</span>
              <span style={{ fontSize:11, fontWeight:600, color:activeAgent===a.id?a.color:"#94a3b8" }}>{a.name}</span>
            </div>
            <div style={{ fontSize:8, color:"#334155", letterSpacing:0.5 }}>{a.role.toUpperCase()}</div>
          </div>
        ))}
        <div style={{ borderTop:"1px solid #1e293b", margin:"8px 0" }}/>
        <div onClick={() => { setBM(true); setAA(null); }} style={{
          padding:"10px 14px", cursor:"pointer",
          borderLeft:`2px solid ${briefMode?"#f59e0b":"transparent"}`,
          background:briefMode?"#111827":"transparent"
        }}>
          <div style={{ fontSize:11, fontWeight:600, color:briefMode?"#f59e0b":"#475569" }}>📋 Full Briefing</div>
          <div style={{ fontSize:8, color:"#334155" }}>ALLE 5 TEGELIJK</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {!activeAgent && !briefMode && (
          <div style={{ padding:32, overflowY:"auto", flex:1 }}>
            <div style={{ fontSize:11, color:"#334155", marginBottom:24 }}>Selecteer een analist of gebruik Full Briefing.</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, maxWidth:700 }}>
              {TEAM.map(a => (
                <div key={a.id} onClick={() => setAA(a.id)} style={{
                  border:"1px solid #1e293b", borderRadius:6, padding:16,
                  cursor:"pointer", background:"#0a0f1e",
                  transition:"border-color 0.15s"
                }} onMouseEnter={e=>e.currentTarget.style.borderColor=a.color+"60"}
                   onMouseLeave={e=>e.currentTarget.style.borderColor="#1e293b"}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <span style={{ fontSize:20 }}>{a.avatar}</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:a.color }}>{a.name}</div>
                      <div style={{ fontSize:9, color:"#334155" }}>{a.role.toUpperCase()}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:"#475569", lineHeight:1.5 }}>
                    {TEAM.find(t=>t.id===a.id).systemPrompt.split('\n')[1]?.trim().slice(0,80)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {briefMode && (
          <div style={{ padding:24, overflowY:"auto", flex:1 }}>
            <div style={{ fontSize:9, letterSpacing:2, color:"#475569", marginBottom:16 }}>FULL TEAM BRIEFING</div>
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              <input value={briefQ} onChange={e=>setBQ(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&runBriefing()}
                placeholder="Stel het hele team een vraag..."
                style={{ flex:1, padding:"10px 14px", background:"#0a0f1e", border:"1px solid #1e293b",
                  borderRadius:4, color:"#e2e8f0", fontSize:12, fontFamily:"inherit", outline:"none" }}/>
              <button onClick={runBriefing} disabled={briefLoading||!briefQ.trim()} style={{
                padding:"10px 16px", background:briefLoading?"#1e293b":"#f59e0b",
                color:briefLoading?"#475569":"#0a0f1e", border:"none", borderRadius:4,
                fontSize:11, fontWeight:700, cursor:briefLoading?"not-allowed":"pointer", fontFamily:"inherit"
              }}>{briefLoading?"BEZIG...":"BRIEF ALLEN"}</button>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:20 }}>
              {BRIEFING_STARTERS.map(q=>(
                <button key={q} onClick={()=>setBQ(q)} style={{
                  padding:"4px 10px", fontSize:10, background:"transparent",
                  border:"1px solid #1e293b", borderRadius:3, color:"#334155",
                  cursor:"pointer", fontFamily:"inherit", textAlign:"left"
                }}>{q.slice(0,50)}…</button>
              ))}
            </div>
            {briefLoading && <div style={{ color:"#334155", fontSize:12 }}>Alle analisten analyseren...</div>}
            {Object.keys(briefResults).length>0 && TEAM.map(a => briefResults[a.id] && (
              <div key={a.id} style={{ border:`1px solid ${a.color}30`, borderLeft:`3px solid ${a.color}`,
                borderRadius:4, padding:"14px 18px", marginBottom:12, background:"#0a0f1e" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <span>{a.avatar}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:a.color }}>{a.name}</span>
                  <span style={{ fontSize:9, color:"#334155" }}>— {a.role.toUpperCase()}</span>
                  <button onClick={()=>{setAA(a.id);setBM(false);}} style={{
                    marginLeft:"auto", padding:"3px 8px", fontSize:9, background:"transparent",
                    border:`1px solid ${a.color}40`, borderRadius:3, color:a.color,
                    cursor:"pointer", fontFamily:"inherit"
                  }}>VERDER →</button>
                </div>
                <div style={{ fontSize:12, color:"#c8d4e8", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{briefResults[a.id]}</div>
              </div>
            ))}
          </div>
        )}

        {activeAgent && agent && (
          <>
            <div style={{ padding:"12px 18px", borderBottom:"1px solid #1e293b",
              display:"flex", alignItems:"center", gap:10, background:"#0a0f1e" }}>
              <span style={{ fontSize:18 }}>{agent.avatar}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:agent.color }}>{agent.name}</div>
                <div style={{ fontSize:9, color:"#334155" }}>{agent.role}</div>
              </div>
              <button onClick={()=>setConvs(c=>({...c,[activeAgent]:[]}))} style={{
                marginLeft:"auto", padding:"3px 8px", fontSize:9, background:"transparent",
                border:"1px solid #1e293b", borderRadius:3, color:"#334155",
                cursor:"pointer", fontFamily:"inherit"
              }}>WISSEN</button>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:18 }}>
              {curConvo.length===0 && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:10, color:"#1e293b", marginBottom:10 }}>Suggesties:</div>
                  {BRIEFING_STARTERS.map(q=>(
                    <button key={q} onClick={()=>setInput(q)} style={{
                      display:"block", width:"100%", padding:"8px 12px", marginBottom:6,
                      fontSize:11, background:"#0a0f1e", border:"1px solid #1e293b",
                      borderRadius:3, color:"#334155", cursor:"pointer", textAlign:"left", fontFamily:"inherit"
                    }}>{q}</button>
                  ))}
                </div>
              )}
              {curConvo.map((msg,i)=>(
                <div key={i} style={{ marginBottom:14, display:"flex", justifyContent:msg.role==="user"?"flex-end":"flex-start" }}>
                  <div style={{ maxWidth:"80%", padding:"10px 14px", borderRadius:4, fontSize:12, lineHeight:1.7,
                    whiteSpace:"pre-wrap",
                    background:msg.role==="user"?"#1e293b":"#0a0f1e",
                    border:msg.role==="assistant"?`1px solid ${agent.color}30`:"none",
                    borderLeft:msg.role==="assistant"?`3px solid ${agent.color}`:"none",
                    color:msg.role==="user"?"#cbd5e1":"#d0dff0"
                  }}>{msg.content}</div>
                </div>
              ))}
              {loading && (
                <div style={{ color:agent.color, fontSize:11 }}>{agent.name} analyseert...</div>
              )}
              <div ref={chatEndRef}/>
            </div>
            <div style={{ padding:"12px 18px", borderTop:"1px solid #1e293b",
              display:"flex", gap:8, background:"#0a0f1e" }}>
              <input value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage()}
                placeholder={`Vraag aan ${agent.name}...`}
                style={{ flex:1, padding:"10px 14px", background:"#111827", border:"1px solid #1e293b",
                  borderRadius:4, color:"#e2e8f0", fontSize:12, fontFamily:"inherit", outline:"none" }}/>
              <button onClick={sendMessage} disabled={loading||!input.trim()} style={{
                padding:"10px 16px", background:loading?"#1e293b":agent.color,
                color:loading?"#475569":"#0a0f1e", border:"none", borderRadius:4,
                fontSize:11, fontWeight:700, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit"
              }}>STUUR</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
