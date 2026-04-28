import { useState, useEffect, useRef } from "react";

const T = {
  bg:"#F4F6FA",surface:"#FFFFFF",border:"#E2E8F0",border2:"#CBD5E1",
  text:"#0F172A",text2:"#334155",text3:"#64748B",text4:"#94A3B8",
  amber:"#D97706",amberBg:"#FEF3C7",green:"#059669",greenBg:"#D1FAE5",
  red:"#DC2626",redBg:"#FEE2E2",purple:"#7C3AED",purpleBg:"#EDE9FE",
  teal:"#0D9488",tealBg:"#CCFBF1",
};

function ApiKeyGate({onKey}){
  const[val,setVal]=useState("");const[err,setErr]=useState("");
  function submit(){if(!val.startsWith("sk-ant-")){setErr("Key moet beginnen met sk-ant-");return;}sessionStorage.setItem("anthropic_key",val.trim());onKey(val.trim());}
  return(
    <div style={{background:T.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Mono','Courier New',monospace"}}>
      <div style={{width:440,padding:40,border:`1px solid ${T.border}`,borderRadius:12,background:T.surface,boxShadow:"0 4px 24px rgba(0,0,0,0.08)"}}>
        <div style={{fontSize:9,letterSpacing:3,color:T.text3,marginBottom:8}}>MOJO TRADING OPS</div>
        <div style={{fontSize:24,fontWeight:800,color:T.text,marginBottom:4}}>NAS100 Dashboard</div>
        <div style={{fontSize:12,color:T.text3,marginBottom:28,lineHeight:1.6}}>Voer je Anthropic API-key in om door te gaan.<br/>Key wordt alleen in de sessie bewaard.</div>
        <input type="password" value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="sk-ant-api03-..." style={{width:"100%",padding:"12px 14px",background:T.bg,border:`1.5px solid ${T.border2}`,borderRadius:6,color:T.text,fontSize:13,fontFamily:"inherit",outline:"none",marginBottom:10}}/>
        {err&&<div style={{fontSize:11,color:T.red,marginBottom:8}}>{err}</div>}
        <button onClick={submit} style={{width:"100%",padding:12,background:T.amber,color:"#fff",border:"none",borderRadius:6,fontSize:12,fontWeight:700,letterSpacing:1,cursor:"pointer",fontFamily:"inherit"}}>INLOGGEN</button>
        <div style={{fontSize:10,color:T.text4,marginTop:14,lineHeight:1.7}}>API-key: platform.anthropic.com → API Keys · ~$0.003 per briefing</div>
      </div>
    </div>
  );
}

const SESSIONS={
  asian:{label:"ASIAN",start:23,end:8,color:T.purple,bg:T.purpleBg,desc:"Tokyo / Sydney"},
  london:{label:"LONDON",start:7,end:16,color:T.amber,bg:T.amberBg,desc:"LSE Open 08:00 GMT"},
  overlap:{label:"OVERLAP",start:12,end:16,color:T.red,bg:T.redBg,desc:"London\u2013NY Power Hour"},
  ny:{label:"NEW YORK",start:13,end:21,color:T.green,bg:T.greenBg,desc:"NYSE Open 13:30 UTC"},
};
const CYCLE_CONTEXT={
  kwave:{phase:"Late Winter \u2192 Early Spring (6th K-Wave)",bias:"Structureel bull \u2014 AI carrier technology",color:T.green},
  juglar:{phase:"Mid-expansion (~2023\u20132027)",bias:"Capex cycle stijgend \u2014 tech bevoordeeld",color:T.green},
  kitchin:{phase:"Inventory restocking (2025\u20132026)",bias:"Lichte tailwind voor risicoactiva",color:T.amber},
  presidential:{phase:"Year 2 post-election (2026)",bias:"Historisch volatiel \u2014 mid-cycle reset risico",color:T.red},
};
const DAY_PATTERNS=[
  {day:0,name:"Sunday",bias:"CLOSED",note:"Futures gap risico bij open"},
  {day:1,name:"Monday",bias:"CAUTIOUS",note:"Gap fill neiging. Wacht op London richting."},
  {day:2,name:"Tuesday",bias:"ACTIVE",note:"Hoge follow-through. Sterke trend dag kans."},
  {day:3,name:"Wednesday",bias:"ACTIVE",note:"Mid-week momentum. Let op FOMC/data."},
  {day:4,name:"Thursday",bias:"ACTIVE",note:"NY sessie vaak reversal vs woensdag."},
  {day:5,name:"Friday",bias:"CAUTIOUS",note:"Positie sluiten. Fades richting close."},
  {day:6,name:"Saturday",bias:"CLOSED",note:"Geen sessie."},
];
const SEASONAL=[
  {months:[0,1],label:"Jan\u2013Feb",bias:"BULLISH",note:"January effect, nieuwe flows"},
  {months:[2,3],label:"Mar\u2013Apr",bias:"MIXED",note:"Q1 earnings \u2014 hoge volatiliteit"},
  {months:[4],label:"Mei",bias:"CAUTIOUS",note:"'Sell in May' \u2014 reduceer size"},
  {months:[5,6,7],label:"Jun\u2013Aug",bias:"BEARISH",note:"Zomer dun \u2014 valse breakouts"},
  {months:[8],label:"Sep",bias:"BEARISH",note:"Historisch slechtste maand NAS"},
  {months:[9,10],label:"Okt\u2013Nov",bias:"BULLISH",note:"Q3 earnings, year-end rally start"},
  {months:[11],label:"Dec",bias:"BULLISH",note:"Santa rally + dunne liquiditeit"},
];
const PLAYBOOKS={
  london:[
    {name:"London Open Breakout",time:"08:00\u201308:45 GMT",rule:"Markeer Asian High/Low. Wacht op 5m kaars close buiten de range. Enter op retest. SL: andere kant van range. Target 1:2 min.",bias:"TREND"},
    {name:"Asia Range Fade",time:"08:00\u201309:30 GMT",rule:"Als NAS100 opent binnen Asian range en cyclus bias neutraal \u2014 fade extremen met strak SL (10\u201315 punten).",bias:"COUNTER"},
    {name:"London Killzone Long",time:"08:00\u201310:00 GMT",rule:"HTF demand zone zoeken. Wacht op liquidity sweep + 15m BOS. Enter 1:3 min RR. Alleen bij bullish cyclus bias.",bias:"TREND"},
  ],
  ny:[
    {name:"NY Open Momentum",time:"13:30\u201314:15 UTC",rule:"Align met London trend. Enter op eerste 5m pullback na 13:30. SL: pre-market low/high. Size: 75% van normaal.",bias:"TREND"},
    {name:"London Close Reversal",time:"16:00\u201316:45 UTC",rule:"Reversal als London uitstapt. Tegengesteld aan London trend. Alleen 30m setup. Kleine size.",bias:"COUNTER"},
    {name:"NY Power Hour",time:"19:00\u201320:00 UTC",rule:"Finale push of fade richting close. Alleen bij sterke trend. Size halveren. Sluit voor NY close.",bias:"TREND"},
  ],
};
const TEAM=[
  {id:"cycle_analyst",name:"Vera Cycles",role:"Cycle Analyst",avatar:"\ud83d\udcca",color:T.teal,systemPrompt:"You are Vera Cycles, senior Cycle Analyst for NAS100. Cover Kondratieff waves, Juglar (7-11yr), Kitchin (3-5yr), Presidential cycles, seasonal patterns. Be precise, reference specific phases and historical precedents. Max 200 words. Sharp and actionable only."},
  {id:"quant",name:"Max Signal",role:"Quant Strategist",avatar:"\u2699\ufe0f",color:T.amber,systemPrompt:"You are Max Signal, quant strategist building systematic NAS100 strategies from cycle theory. Give specific indicators, thresholds, entry/exit rules. Think: what to code, what to test. Focus on cycle indicators, position sizing by phase, risk-adjusted targets. No theory, executable ideas only. Max 200 words."},
  {id:"macro",name:"Elena Macro",role:"Macro Economist",avatar:"\ud83c\udf10",color:T.purple,systemPrompt:"You are Elena Macro, macro economist covering economic forces driving NAS100 market cycles. Cover credit cycles, rate cycles, inflation, liquidity, central bank policy. Explain WHY cycles occur. Focus on current macro regime and credit expansion/contraction mapping to cycle phases. Be direct about uncertainty. Max 200 words."},
  {id:"risk",name:"Dax Risk",role:"Risk Manager",avatar:"\ud83d\udee1\ufe0f",color:T.red,systemPrompt:"You are Dax Risk, risk manager stress-testing cycle-based NAS100 strategies on Vantage Markets cash CFD. Cover drawdown analysis, cycle phase risk allocation, tail risk, stop-loss frameworks. Challenge assumptions. Point out where strategies fail. Focus on capital allocation per cycle phase and invalidation signals. Max 200 words."},
  {id:"data",name:"Kai Data",role:"Data Scientist",avatar:"\ud83d\udd2c",color:T.green,systemPrompt:"You are Kai Data, data scientist building cycle indicator infrastructure for NAS100. Cover time-series analysis, FFT, Hilbert Transform, Hurst Exponent. Be technical. Focus on data sources, reliable cycle indicators, validation methodology, avoiding look-ahead bias. Think in code and pipelines. Max 200 words."},
];
const BRIEFING_STARTERS=["Welke K-Wave fase zitten we in en wat betekent dat voor NAS100?","Hoe bouw ik een systematische entry op basis van de Presidential Cycle?","Welke macro indicatoren moet ik volgen voor cyclus transities?","Wat zijn de grootste risico's bij cycle-based NAS100 trading?","Welke data sources gebruik ik voor een cycle dashboard?"];

function getSessionNow(h){if(h>=12&&h<16)return"overlap";if(h>=7&&h<16)return"london";if(h>=13&&h<21)return"ny";return"asian";}
function getSeasonalBias(m){return SEASONAL.find(s=>s.months.includes(m))||SEASONAL[0];}
function getDayBias(d){return DAY_PATTERNS.find(p=>p.day===d)||DAY_PATTERNS[1];}
function biasColor(b){if(b==="BULLISH"||b==="ACTIVE")return T.green;if(b==="BEARISH"||b==="CAUTIOUS")return T.red;if(b==="MIXED")return T.amber;return T.text3;}
function biasBg(b){if(b==="BULLISH"||b==="ACTIVE")return T.greenBg;if(b==="BEARISH"||b==="CAUTIOUS")return T.redBg;if(b==="MIXED")return T.amberBg;return T.bg;}
const pad=n=>String(n).padStart(2,"0");
const Card=({children,style={}})=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,0.05)",...style}}>{children}</div>);
const Label=({children})=>(<div style={{fontSize:9,letterSpacing:2,color:T.text3,textTransform:"uppercase",marginBottom:10}}>{children}</div>);
const Badge=({label,bias})=>(<span style={{display:"inline-block",padding:"3px 10px",borderRadius:4,fontSize:10,fontWeight:700,letterSpacing:1,background:biasBg(bias||label),color:biasColor(bias||label)}}>{label}</span>);

export default function App(){
  const[apiKey,setApiKey]=useState("vercel");
  const[view,setView]=useState("dashboard");
  const[prices,setPrices]=useState({nas100:null,sp500:null});
  const BRIDGE="https://unwind-unrobed-requisite.ngrok-free.dev";
  useEffect(()=>{
    async function fetchPrices(){
      try{
        const[r1,r2]=await Promise.all([
          fetch(BRIDGE+"/data?tool=price&symbol=VANTAGE:NAS100",{headers:{"ngrok-skip-browser-warning":"1"}}),
          fetch(BRIDGE+"/data?tool=price&symbol=VANTAGE:SP500",{headers:{"ngrok-skip-browser-warning":"1"}})
        ]);
        const[d1,d2]=await Promise.all([r1.json(),r2.json()]);
        const parse=d=>JSON.parse(d.data.content[0].text);
        setPrices({nas100:parse(d1),sp500:parse(d2)});
      }catch(e){console.log("Bridge offline",e);}
    }
    fetchPrices();
    const t=setInterval(fetchPrices,30000);
    return()=>clearInterval(t);
  },[]);
  if(!apiKey)return <ApiKeyGate onKey={setApiKey}/>;
  return(
    <div style={{fontFamily:"'DM Mono','Courier New',monospace",background:T.bg,minHeight:"100vh",color:T.text}}>
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"10px 24px",display:"flex",gap:8,alignItems:"center",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <div style={{flex:1}}><span style={{fontSize:9,letterSpacing:2,color:T.text3}}>MOJO TRADING OPS</span><span style={{fontSize:9,color:T.border2,margin:"0 8px"}}>\u00b7</span><span style={{fontSize:9,color:T.text4}}>NAS100 \u00b7 VANTAGE MARKETS</span></div>
        {["dashboard","team"].map(v=>(<button key={v} onClick={()=>setView(v)} style={{padding:"6px 16px",fontSize:10,letterSpacing:1,background:view===v?T.amber:"transparent",border:`1.5px solid ${view===v?T.amber:T.border}`,color:view===v?"#fff":T.text3,borderRadius:6,cursor:"pointer",fontFamily:"inherit",fontWeight:600,textTransform:"uppercase"}}>{v==="dashboard"?"Session Dashboard":"Research Team"}</button>))}
        <button onClick={()=>{sessionStorage.removeItem("anthropic_key");setApiKey("");}} style={{padding:"6px 12px",fontSize:9,background:"transparent",border:`1px solid ${T.border}`,color:T.text4,borderRadius:6,cursor:"pointer",fontFamily:"inherit"}}>LOGOUT</button>
      </div>
      {prices.nas100&&(<div style={{background:"#0F172A",borderBottom:`1px solid ${T.border}`,padding:"6px 24px",display:"flex",gap:24,alignItems:"center"}}>
    <span style={{fontSize:9,color:T.text4,letterSpacing:2}}>VANTAGE LIVE</span>
    <span style={{fontSize:13,fontWeight:700,color:T.green}}>NAS100 <strong>{prices.nas100.last?.toLocaleString("nl-NL",{minimumFractionDigits:2})}</strong></span>
    <span style={{fontSize:10,color:prices.nas100.close>prices.nas100.open?T.green:T.red}}>{prices.nas100.close>prices.nas100.open?"▲":"▼"} H:{prices.nas100.high?.toLocaleString()} L:{prices.nas100.low?.toLocaleString()}</span>
    <span style={{fontSize:13,fontWeight:700,color:T.blue,marginLeft:16}}>SP500 <strong>{prices.sp500?.last?.toLocaleString("nl-NL",{minimumFractionDigits:2})}</strong></span>
    <span style={{fontSize:10,color:T.text4,marginLeft:"auto"}}>{new Date().toLocaleTimeString("nl-NL")} UTC</span>
  </div>)}
{view==="dashboard"?<SessionDashboard apiKey={apiKey}/>:<ResearchTeam apiKey={apiKey}/>}
    </div>
  );
}

function SessionDashboard({apiKey}){
  const[now,setNow]=useState(new Date());
  const[activeSession,setAS]=useState("london");
  const[briefing,setBriefing]=useState("");
  const[briefLoading,setBL]=useState(false);
  const[activePlaybook,setAP]=useState("london");
  const[tab,setTab]=useState("overview");
  useEffect(()=>{const t=setInterval(()=>{const d=new Date();setNow(d);setAS(getSessionNow(d.getUTCHours()));},1000);return()=>clearInterval(t);},[]);
  const utcH=now.getUTCHours(),utcM=now.getUTCMinutes(),utcS=now.getUTCSeconds();
  const session=SESSIONS[activeSession],seasonal=getSeasonalBias(now.getMonth()),dayBias=getDayBias(now.getDay());
  const estH=(utcH-5+24)%24;
  const sessionProgress=()=>{const s=SESSIONS[activeSession];let e=utcH-s.start,tot=s.end-s.start;if(tot<0)tot+=24;if(e<0)e+=24;return Math.min(100,Math.max(0,(e/tot)*100));};
  async function getBriefing(){
    setBL(true);setBriefing("");
    const prompt=`You are a sharp NAS100 intraday analyst for Vantage Markets cash CFD.\n\nContext:\n- Session: ${activeSession.toUpperCase()}\n- K-Wave: Late Winter to Early Spring, Structural bull, AI carrier tech\n- Juglar: Mid-expansion 2023-2027\n- Seasonal: ${seasonal.label} - ${seasonal.bias} - ${seasonal.note}\n- Day: ${dayBias.name} - ${dayBias.bias} - ${dayBias.note}\n\nGive a SHARP briefing:\n\n**MACRO BIAS**: [1 sentence]\n**SESSION BIAS**: [BULLISH/BEARISH/NEUTRAL + reason]\n**KEY RISK**: [biggest risk today]\n**SETUP TO WATCH**: [1 specific intraday setup]\n**INVALIDATION**: [what kills the bias]\n**CYCLE ALIGNMENT**: [supporting or fighting direction]\n\nMax 180 words. No fluff.`;
    try{
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();
      console.log("RAW",JSON.stringify(data));setBriefing(data.content?.find(b=>b.type==="text")?.text||data.error||JSON.stringify(data));
    }catch{setBriefing("\u26a0\ufe0f API fout.");}
    setBL(false);
  }
  const formatBriefing=text=>text.split('\n').map((line,i)=>{
    if(line.startsWith('**')&&line.includes('**:')){
      const parts=line.split('**:');const key=parts[0].replace(/\*\*/g,'');const val=parts.slice(1).join(':').replace(/^\s*/,'').replace(/\*\*/g,'');
      return(<div key={i} style={{marginBottom:12,padding:"10px 14px",background:T.bg,borderRadius:6,borderLeft:`3px solid ${session.color}`}}><div style={{fontSize:9,color:session.color,letterSpacing:1.5,marginBottom:4}}>{key}</div><div style={{fontSize:13,color:T.text,lineHeight:1.6}}>{val}</div></div>);
    }
    return line?<div key={i} style={{fontSize:12,color:T.text3,lineHeight:1.6}}>{line.replace(/\*\*/g,'')}</div>:<br key={i}/>;
  });
  return(
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 49px)"}}>
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"12px 24px"}}>
        <div style={{display:"flex",gap:10}}>
          {Object.entries(SESSIONS).map(([key,s])=>{const isActive=activeSession===key;return(
            <div key={key} onClick={()=>{setAS(key);setAP(key==="overlap"||key==="ny"?"ny":"london");}} style={{flex:1,padding:"10px 14px",border:`1.5px solid ${isActive?s.color:T.border}`,borderRadius:8,background:isActive?s.bg:T.surface,cursor:"pointer",transition:"all 0.15s"}}>
              <div style={{fontSize:10,letterSpacing:1.5,fontWeight:700,color:isActive?s.color:T.text3}}>{s.label}</div>
              <div style={{fontSize:9,color:T.text4,marginTop:2}}>{s.desc}</div>
              {isActive&&(<div style={{marginTop:8,background:T.border,borderRadius:2,height:4}}><div style={{width:`${sessionProgress()}%`,height:"100%",background:s.color,borderRadius:2,transition:"width 1s"}}/></div>)}
            </div>
          );})}
        </div>
      </div>
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"0 24px",display:"flex",alignItems:"center"}}>
        <div style={{display:"flex"}}>
          {["overview","playbooks","cycles","briefing"].map(t=>(<button key={t} onClick={()=>setTab(t)} style={{padding:"12px 18px",fontSize:10,letterSpacing:1.5,background:"transparent",border:"none",borderBottom:`2.5px solid ${tab===t?T.amber:"transparent"}`,color:tab===t?T.amber:T.text3,cursor:"pointer",fontFamily:"inherit",textTransform:"uppercase",fontWeight:tab===t?700:400}}>{t}</button>))}
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:20}}>
          <div style={{textAlign:"right"}}><div style={{fontSize:8,color:T.text4,letterSpacing:1}}>UTC / GMT</div><div style={{fontSize:14,color:T.amber,fontWeight:700}}>{pad(utcH)}:{pad(utcM)}:{pad(utcS)}</div></div>
          <div style={{textAlign:"right"}}><div style={{fontSize:8,color:T.text4,letterSpacing:1}}>EST (NY)</div><div style={{fontSize:14,color:T.green,fontWeight:700}}>{pad(estH)}:{pad(utcM)}</div></div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:24}}>
        {tab==="overview"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,maxWidth:960}}>
            <Card style={{gridColumn:"1/-1",borderLeft:`4px solid ${session.color}`,background:session.bg}}>
              <Label>Actieve sessie</Label>
              <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                <div style={{fontSize:26,fontWeight:800,color:session.color}}>{session.label}</div>
                <div style={{fontSize:12,color:T.text2}}>{session.desc}</div>
                <div style={{marginLeft:"auto",fontSize:12,color:T.text3}}>Voortgang: <strong style={{color:session.color}}>{Math.round(sessionProgress())}%</strong></div>
              </div>
            </Card>
            <Card><Label>Dag bias</Label><div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:8}}>{dayBias.name}</div><Badge label={dayBias.bias} bias={dayBias.bias}/><div style={{fontSize:12,color:T.text3,marginTop:10,lineHeight:1.6}}>{dayBias.note}</div></Card>
            <Card><Label>Seizoenspatroon</Label><div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:8}}>{seasonal.label}</div><Badge label={seasonal.bias} bias={seasonal.bias}/><div style={{fontSize:12,color:T.text3,marginTop:10,lineHeight:1.6}}>{seasonal.note}</div></Card>
            <Card style={{gridColumn:"1/-1"}}>
              <Label>Sessie tijden \u2014 vaste referentie</Label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                {[{name:"London Open",utc:"08:00",est:"03:00",color:T.amber},{name:"London\u2013NY Overlap",utc:"13:00",est:"08:00",color:T.red},{name:"NYSE Open",utc:"14:30",est:"09:30",color:T.green},{name:"London Close",utc:"16:00",est:"11:00",color:T.purple},{name:"NY Power Hour",utc:"19:00",est:"14:00",color:T.green},{name:"NY Close",utc:"21:00",est:"16:00",color:T.red},{name:"Asia Open",utc:"23:00",est:"18:00",color:T.purple},{name:"NAS100 Pre-mkt",utc:"00:00",est:"19:00",color:T.amber}].map(ev=>(<div key={ev.name} style={{padding:12,border:`1.5px solid ${ev.color}30`,borderRadius:6,background:ev.color+"0D"}}><div style={{fontSize:9,color:ev.color,fontWeight:700,marginBottom:6}}>{ev.name}</div><div style={{fontSize:14,color:T.text,fontWeight:700}}>UTC {ev.utc}</div><div style={{fontSize:11,color:T.text3}}>EST {ev.est}</div></div>))}
              </div>
            </Card>
          </div>
        )}
        {tab==="playbooks"&&(
          <div style={{maxWidth:820}}>
            <div style={{display:"flex",gap:8,marginBottom:18}}>
              {["london","ny"].map(p=>(<button key={p} onClick={()=>setAP(p)} style={{padding:"8px 18px",fontSize:10,letterSpacing:1.5,background:activePlaybook===p?(p==="london"?T.amber:T.green):T.surface,border:`1.5px solid ${activePlaybook===p?(p==="london"?T.amber:T.green):T.border}`,color:activePlaybook===p?"#fff":T.text3,borderRadius:6,cursor:"pointer",fontFamily:"inherit",textTransform:"uppercase",fontWeight:700}}>{p==="london"?"London Sessie":"New York Sessie"}</button>))}
            </div>
            {(PLAYBOOKS[activePlaybook]||[]).map((pb,i)=>(<Card key={i} style={{marginBottom:12,borderLeft:`4px solid ${activePlaybook==="london"?T.amber:T.green}`}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}><div style={{fontSize:15,fontWeight:700,color:T.text}}>{pb.name}</div><span style={{fontSize:10,padding:"3px 10px",borderRadius:4,background:T.bg,color:T.text3,border:`1px solid ${T.border}`}}>{pb.time}</span><span style={{fontSize:10,padding:"3px 10px",borderRadius:4,background:pb.bias==="TREND"?T.greenBg:T.redBg,color:pb.bias==="TREND"?T.green:T.red,fontWeight:700}}>{pb.bias}</span></div><div style={{fontSize:13,color:T.text2,lineHeight:1.7,padding:"10px 14px",background:T.bg,borderRadius:6}}>{pb.rule}</div></Card>))}
            <Card style={{borderLeft:`4px solid ${T.amber}`,background:T.amberBg}}>
              <Label>Cyclus filter \u2014 toepassen op alle setups</Label>
              {["K-Wave: Structureel bull \u2192 prefereer longs op dips","Juglar mid-expansion: Momentum favours breakouts boven fades","Presidential Year 2: Verhoogde volatiliteit \u2192 stops +25%, size -25%","Seizoen April: Mixed \u2014 gebruik alleen intraday signalen","Dag bias CAUTIOUS: geen counter-trend setups"].map((rule,i)=>(<div key={i} style={{display:"flex",gap:10,marginBottom:6,alignItems:"flex-start"}}><span style={{color:i<4?T.green:T.red,fontWeight:700,fontSize:13}}>{i<4?"\u2713":"\u2717"}</span><span style={{fontSize:12,color:T.text2,lineHeight:1.5}}>{rule}</span></div>))}
            </Card>
          </div>
        )}
        {tab==="cycles"&&(
          <div style={{maxWidth:820}}>
            <Label>Cyclus stack \u2014 NAS100</Label>
            {Object.entries(CYCLE_CONTEXT).map(([key,c])=>(<Card key={key} style={{marginBottom:10,borderLeft:`4px solid ${c.color}`}}><div style={{display:"flex",gap:20,alignItems:"center"}}><div style={{minWidth:110,fontSize:9,letterSpacing:1.5,color:c.color,fontWeight:700,textTransform:"uppercase"}}>{key.replace("presidential","4YR PRES")}</div><div><div style={{fontSize:14,color:T.text,fontWeight:700,marginBottom:4}}>{c.phase}</div><div style={{fontSize:12,color:T.text3}}>{c.bias}</div></div></div></Card>))}
            <div style={{marginTop:24}}>
              <Label>Seizoenskalender NAS100</Label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {SEASONAL.map((s,i)=>{const isCurrent=s.months.includes(now.getMonth());return(<div key={i} style={{padding:"12px 14px",border:`1.5px solid ${isCurrent?biasColor(s.bias):T.border}`,borderRadius:8,background:isCurrent?biasBg(s.bias):T.surface}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:13,fontWeight:700,color:T.text}}>{s.label}</span>{isCurrent&&<span style={{fontSize:8,color:biasColor(s.bias),fontWeight:700,letterSpacing:1}}>NU</span>}</div><Badge label={s.bias} bias={s.bias}/><div style={{fontSize:11,color:T.text3,marginTop:8,lineHeight:1.5}}>{s.note}</div></div>);})}
              </div>
            </div>
          </div>
        )}
        {tab==="briefing"&&(
          <div style={{maxWidth:700}}>
            <Card style={{marginBottom:16}}>
              <Label>AI Sessie Briefing \u2014 Cycle-informed</Label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                {[["Sessie",session.label],["Dag",dayBias.name+" \u2014 "+dayBias.bias],["Seizoen",seasonal.label+" \u2014 "+seasonal.bias],["K-Wave","Late Winter \u2192 Spring"]].map(([k,v])=>(<div key={k} style={{padding:"8px 12px",background:T.bg,borderRadius:6,border:`1px solid ${T.border}`}}><span style={{fontSize:9,color:T.text3}}>{k}: </span><span style={{fontSize:11,color:T.text,fontWeight:600}}>{v}</span></div>))}
              </div>
              <button onClick={getBriefing} disabled={briefLoading} style={{width:"100%",padding:12,background:briefLoading?T.bg:T.amber,color:briefLoading?T.text3:"#fff",border:`1.5px solid ${briefLoading?T.border:T.amber}`,borderRadius:6,fontSize:12,fontWeight:700,letterSpacing:1,cursor:briefLoading?"not-allowed":"pointer",fontFamily:"inherit"}}>{briefLoading?"BRIEFING GENEREREN...":`\u25b6 GET ${session.label} BRIEFING`}</button>
            </Card>
            {briefing&&(<Card style={{borderLeft:`4px solid ${session.color}`}}><div style={{fontSize:9,color:session.color,letterSpacing:2,marginBottom:16,fontWeight:700}}>{session.label} \u2014 {now.toUTCString().slice(0,16)}</div>{formatBriefing(briefing)}</Card>)}
            {!briefing&&!briefLoading&&(<div style={{color:T.text4,fontSize:12,textAlign:"center",padding:48}}>Klik hierboven voor je sessie briefing.</div>)}
          </div>
        )}
      </div>
      <div style={{borderTop:`1px solid ${T.border}`,padding:"8px 24px",display:"flex",justifyContent:"space-between",fontSize:9,color:T.text4,background:T.surface}}><span>MOJO TRADING OPS \u00b7 NAS100 CASH CFD \u00b7 VANTAGE MARKETS</span><span>Cyclus bias \u2260 handelssignaal \u00b7 Beheer risico zelfstandig</span></div>
    </div>
  );
}

function ResearchTeam({apiKey}){
  const[activeAgent,setAA]=useState(null);const[input,setInput]=useState("");const[conversations,setConvs]=useState({});const[loading,setLoading]=useState(false);const[briefMode,setBM]=useState(false);const[briefQ,setBQ]=useState("");const[briefResults,setBR]=useState({});const[briefLoading,setBL]=useState(false);const chatEndRef=useRef(null);
  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[conversations,activeAgent]);
  const agent=TEAM.find(a=>a.id===activeAgent);const curConvo=activeAgent?(conversations[activeAgent]||[]):[];
  async function sendMessage(){if(!input.trim()||!activeAgent||loading)return;const userMsg={role:"user",content:input.trim()};const updated=[...curConvo,userMsg];setConvs(c=>({...c,[activeAgent]:updated}));setInput("");setLoading(true);try{const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:agent.systemPrompt+(prices&&prices.nas100?`\n\nLIVE MARKET DATA (Vantage Markets, refreshed 30s):\nNAS100: ${prices.nas100.last} | High: ${prices.nas100.high} | Low: ${prices.nas100.low} | Open: ${prices.nas100.open}\nSP500: ${prices.sp500?.last||"N/A"}\nTimestamp: ${new Date().toUTCString()}`:""),messages:updated})});const data=await res.json();const txt=(data.content&&data.content.find(b=>b.type==="text")&&data.content.find(b=>b.type==="text").text)||JSON.stringify(data);setConvs(c=>({...c,[activeAgent]:[...updated,{role:"assistant",content:txt}]}));}catch{setConvs(c=>({...c,[activeAgent]:[...updated,{role:"assistant",content:"\u26a0\ufe0f API fout."}]}));}setLoading(false);}
  async function runBriefing(){if(!briefQ.trim())return;setBL(true);setBR({});const results={};await Promise.all(TEAM.map(async a=>{try{const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:a.systemPrompt,messages:[{role:"user",content:briefQ}]})});const data=await res.json();results[a.id]=data.content?.find(b=>b.type==="text")?.text||"No response.";}catch{results[a.id]="\u26a0\ufe0f API fout.";}}));setBR(results);setBL(false);}
  return(
    <div style={{display:"flex",height:"calc(100vh - 49px)"}}>
      <div style={{width:210,borderRight:`1px solid ${T.border}`,overflowY:"auto",flexShrink:0,background:T.surface}}>
        <div style={{padding:"14px 16px 6px",fontSize:9,letterSpacing:2,color:T.text4}}>ANALISTEN</div>
        {TEAM.map(a=>(<div key={a.id} onClick={()=>{setAA(a.id);setBM(false);}} style={{padding:"10px 16px",cursor:"pointer",borderLeft:`3px solid ${activeAgent===a.id?a.color:"transparent"}`,background:activeAgent===a.id?a.color+"10":"transparent",transition:"all 0.15s"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}><span style={{fontSize:14}}>{a.avatar}</span><span style={{fontSize:12,fontWeight:700,color:activeAgent===a.id?a.color:T.text}}>{a.name}</span></div><div style={{fontSize:9,color:T.text4}}>{a.role.toUpperCase()}</div></div>))}
        <div style={{borderTop:`1px solid ${T.border}`,margin:"8px 0"}}/>
        <div onClick={()=>{setBM(true);setAA(null);}} style={{padding:"10px 16px",cursor:"pointer",borderLeft:`3px solid ${briefMode?T.amber:"transparent"}`,background:briefMode?T.amberBg:"transparent"}}><div style={{fontSize:12,fontWeight:700,color:briefMode?T.amber:T.text}}>\ud83d\udccb Full Briefing</div><div style={{fontSize:9,color:T.text4}}>ALLE 5 TEGELIJK</div></div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:T.bg}}>
        {!activeAgent&&!briefMode&&(<div style={{padding:32,overflowY:"auto",flex:1}}><div style={{fontSize:11,color:T.text3,marginBottom:20}}>Selecteer een analist links of gebruik Full Briefing.</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,maxWidth:720}}>{TEAM.map(a=>(<div key={a.id} onClick={()=>setAA(a.id)} style={{border:`1.5px solid ${T.border}`,borderRadius:8,padding:18,cursor:"pointer",background:T.surface,transition:"border-color 0.15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=a.color} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><div style={{width:36,height:36,background:a.color+"15",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{a.avatar}</div><div><div style={{fontSize:13,fontWeight:700,color:a.color}}>{a.name}</div><div style={{fontSize:9,color:T.text4}}>{a.role.toUpperCase()}</div></div></div><div style={{fontSize:11,color:T.text3,lineHeight:1.5}}>{a.systemPrompt.split('.')[0]}.</div></div>))}</div></div>)}
        {briefMode&&(<div style={{padding:24,overflowY:"auto",flex:1}}><div style={{fontSize:9,letterSpacing:2,color:T.text3,marginBottom:16}}>FULL TEAM BRIEFING</div><div style={{display:"flex",gap:8,marginBottom:12}}><input value={briefQ} onChange={e=>setBQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&runBriefing()} placeholder="Stel het hele team een vraag..." style={{flex:1,padding:"10px 14px",background:T.surface,border:`1.5px solid ${T.border2}`,borderRadius:6,color:T.text,fontSize:13,fontFamily:"inherit",outline:"none"}}/><button onClick={runBriefing} disabled={briefLoading||!briefQ.trim()} style={{padding:"10px 18px",background:briefLoading?T.bg:T.amber,color:briefLoading?T.text3:"#fff",border:`1.5px solid ${briefLoading?T.border:T.amber}`,borderRadius:6,fontSize:11,fontWeight:700,cursor:briefLoading?"not-allowed":"pointer",fontFamily:"inherit"}}>{briefLoading?"BEZIG...":"BRIEF ALLEN"}</button></div><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:20}}>{BRIEFING_STARTERS.map(q=>(<button key={q} onClick={()=>setBQ(q)} style={{padding:"5px 12px",fontSize:10,background:T.surface,border:`1px solid ${T.border}`,borderRadius:4,color:T.text3,cursor:"pointer",fontFamily:"inherit"}}>{q.slice(0,50)}\u2026</button>))}</div>{briefLoading&&<div style={{color:T.text3,fontSize:12}}>Alle analisten analyseren...</div>}{Object.keys(briefResults).length>0&&TEAM.map(a=>briefResults[a.id]&&(<Card key={a.id} style={{marginBottom:12,borderLeft:`4px solid ${a.color}`}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><span style={{fontSize:16}}>{a.avatar}</span><span style={{fontSize:13,fontWeight:700,color:a.color}}>{a.name}</span><span style={{fontSize:9,color:T.text4}}>\u2014 {a.role.toUpperCase()}</span><button onClick={()=>{setAA(a.id);setBM(false);}} style={{marginLeft:"auto",padding:"4px 10px",fontSize:9,background:a.color+"15",border:`1px solid ${a.color}40`,borderRadius:4,color:a.color,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>VERDER \u2192</button></div><div style={{fontSize:12,color:T.text2,lineHeight:1.7,whiteSpace:"pre-wrap",padding:"12px 14px",background:T.bg,borderRadius:6}}>{briefResults[a.id]}</div></Card>))}</div>)}
        {activeAgent&&agent&&(
          <>
            <div style={{padding:"12px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12,background:T.surface}}>
              <div style={{width:36,height:36,background:agent.color+"15",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{agent.avatar}</div>
              <div><div style={{fontSize:14,fontWeight:700,color:agent.color}}>{agent.name}</div><div style={{fontSize:9,color:T.text4}}>{agent.role}</div></div>
              <button onClick={()=>setConvs(c=>({...c,[activeAgent]:[]}))} style={{marginLeft:"auto",padding:"5px 12px",fontSize:9,background:T.bg,border:`1px solid ${T.border}`,borderRadius:4,color:T.text3,cursor:"pointer",fontFamily:"inherit"}}>WISSEN</button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:20}}>
              {curConvo.length===0&&(<div style={{marginBottom:20}}><div style={{fontSize:11,color:T.text3,marginBottom:10}}>Suggesties:</div>{BRIEFING_STARTERS.map(q=>(<button key={q} onClick={()=>setInput(q)} style={{display:"block",width:"100%",padding:"10px 14px",marginBottom:6,fontSize:12,background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,color:T.text2,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>{q}</button>))}</div>)}
              {curConvo.map((msg,i)=>(<div key={i} style={{marginBottom:14,display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start"}}><div style={{maxWidth:"80%",padding:"12px 16px",borderRadius:8,fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap",background:msg.role==="user"?T.text:T.surface,border:msg.role==="assistant"?`1.5px solid ${agent.color}30`:"none",borderLeft:msg.role==="assistant"?`4px solid ${agent.color}`:"none",color:msg.role==="user"?"#fff":T.text,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>{msg.content}</div></div>))}
              {loading&&<div style={{fontSize:12,color:agent.color,fontStyle:"italic"}}>{agent.name} analyseert...</div>}
              <div ref={chatEndRef}/>
            </div>
            <div style={{padding:"14px 20px",borderTop:`1px solid ${T.border}`,display:"flex",gap:8,background:T.surface}}>
              <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage()} placeholder={`Vraag aan ${agent.name}...`} style={{flex:1,padding:"10px 14px",background:T.bg,border:`1.5px solid ${T.border2}`,borderRadius:6,color:T.text,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
              <button onClick={sendMessage} disabled={loading||!input.trim()} style={{padding:"10px 20px",background:loading?T.bg:agent.color,color:loading?T.text3:"#fff",border:`1.5px solid ${loading?T.border:agent.color}`,borderRadius:6,fontSize:11,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit"}}>STUUR</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
