
const STORAGE_KEY = "piq_phase3_state_v1";

const SPORT_DATA = {
  basketball: {
    positions: ["General","PG","SG/Wing","SF/PF","C/Big"],
    skills: ["Balanced","Ball-handling","Shooting","Finishing","Defense"],
    addOns: {
      "Ball-handling": ["Handles: stationary → change-of-pace (10 min)","Handles: pressure combos (8 min)"],
      "Shooting": ["Shooting: form + catch&shoot (10 min)","Shooting: movement + game shots (15–20 min)"],
      "Finishing": ["Finishing: footwork series (8 min)","Finishing: contact takes + floaters (10–12 min)"],
      "Defense": ["Defense: closeouts + slides (10 min)","Defense: hip turns + reaction (8 min)"],
      "Balanced": ["Skill: ball-handling 10 min","Skill: shooting volume 20–30 min"]
    }
  },
  football: {
    positions: ["General","QB","RB","WR/TE","OL/DL","LB","DB"],
    skills: ["Balanced","Speed/Starts","Agility/COD","Position skills"],
    addOns: {
      "Speed/Starts": ["Starts: 6–10 reps (full rest)","Accel: 10–20 yd x 6"],
      "Agility/COD": ["COD: 5-10-5 technique (10 min)","Reactive shuffle (6–8 min)"],
      "Position skills": ["Position drill block (10–15 min)","Catching/footwork/handwork (10 min)"],
      "Balanced": ["Skill: starts + accel (10 min)","Skill: position drills (10–15 min)"]
    }
  },
  baseball: {
    positions: ["General","Pitcher","Catcher","IF","OF"],
    skills: ["Balanced","Throwing care","Hitting","Speed/Baserunning"],
    addOns: {
      "Throwing care": ["Throwing care: band/arm routine (8–10 min)","Scap + cuff circuit (8 min)"],
      "Hitting": ["Hitting: tee → front toss (15 min)","Bat speed intent swings (6–8 min)"],
      "Speed/Baserunning": ["Sprint mechanics (8 min)","Baserunning: 1st step + turns (8–10 min)"],
      "Balanced": ["Skill: throwing care (8–10 min)","Skill: sprint mechanics (10 min)"]
    }
  },
  volleyball: {
    positions: ["General","Setter","OH/OPP","Middle","Libero/DS"],
    skills: ["Balanced","Approach jump","Serve/Receive","Defense"],
    addOns: {
      "Approach jump": ["Approach jump technique (10 min)","Landing mechanics (6–8 min)"],
      "Serve/Receive": ["Serving reps (10 min)","Receive + platform control (10–12 min)"],
      "Defense": ["Defensive reads + footwork (10 min)","Dig reaction series (6–8 min)"],
      "Balanced": ["Skill: approach jumps (10 min)","Skill: serve/receive (15–20 min)"]
    }
  },
  soccer: {
    positions: ["General","GK","CB","FB/WB","CM","Winger","ST"],
    skills: ["Balanced","Acceleration","Agility/COD","Ball mastery","Finishing"],
    addOns: {
      "Acceleration": ["Accel: 10–20 m x 6 (full rest)","Curved runs (6 reps)"],
      "Agility/COD": ["COD: decel + re-accel (10 min)","Reactive cuts (6–8 min)"],
      "Ball mastery": ["Ball mastery series (10 min)","1v1 moves + exits (8 min)"],
      "Finishing": ["Finishing: 1-touch reps (10 min)","Finishing: angles + weak foot (10–12 min)"],
      "Balanced": ["Skill: ball mastery (10 min)","Skill: small-sided touches (15 min)"]
    }
  }
};

function loadState(){ try{ const raw=localStorage.getItem(STORAGE_KEY); return raw?JSON.parse(raw):null; }catch(e){ return null; } }
function saveState(s){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }catch(e){} }
function defaultState(){
  return { profile:{ sport:"basketball", level:"youth", days:4, programLevel:"standard", focus:"balanced", position:"General", skill:"Balanced", landmine:"on" }, program:null, logs:[] };
}
const state = loadState() || defaultState();

const $ = (id)=>document.getElementById(id);
function esc(s){ return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }

function setActive(tab){
  ["profile","program","log","dashboard"].forEach(t=>{
    $("nav-"+t).classList.toggle("active", t===tab);
    $("tab-"+t).style.display = (t===tab) ? "block" : "none";
  });
}
function route(){
  const h=(location.hash||"#profile").replace("#","");
  const ok=new Set(["profile","program","log","dashboard"]);
  const tab= ok.has(h) ? h : "profile";
  setActive(tab);
  if(tab==="program") renderProgram();
  if(tab==="log") renderLog();
  if(tab==="dashboard") renderDashboard();
}
function bindNav(){
  ["profile","program","log","dashboard"].forEach(t=>{
    $("nav-"+t).addEventListener("click", ()=>location.hash="#"+t);
  });
  window.addEventListener("hashchange", route);
}

function populate(sel, opts, selected){
  sel.innerHTML="";
  opts.forEach(o=>{
    const opt=document.createElement("option");
    opt.value=o; opt.textContent=o;
    if(o===selected) opt.selected=true;
    sel.appendChild(opt);
  });
}

function syncUI(){
  $("sport").value=state.profile.sport;
  $("level").value=state.profile.level;
  $("days").value=String(state.profile.days);
  $("programLevel").value=state.profile.programLevel;
  $("focus").value=state.profile.focus;
  $("landmine").value=state.profile.landmine;

  const sd=SPORT_DATA[state.profile.sport]||SPORT_DATA.basketball;
  populate($("position"), sd.positions, state.profile.position);
  populate($("skill"), sd.skills, state.profile.skill);
}
function readUI(){
  state.profile.sport=$("sport").value;
  state.profile.level=$("level").value;
  state.profile.days=Number($("days").value);
  state.profile.programLevel=$("programLevel").value;
  state.profile.focus=$("focus").value;
  state.profile.landmine=$("landmine").value;
  state.profile.position=$("position").value;
  state.profile.skill=$("skill").value;
  saveState(state);
}
function onSportChange(){
  const sd=SPORT_DATA[$("sport").value]||SPORT_DATA.basketball;
  populate($("position"), sd.positions, "General");
  populate($("skill"), sd.skills, "Balanced");
  state.profile.position="General";
  state.profile.skill="Balanced";
  readUI();
}

function estimateMinutes(level){
  const base={warmup:10,speed:12,power:10,strength:30,skill:18,conditioning:8,transitions:5};
  if(level==="easy"){ base.strength=22; base.skill=15; base.conditioning=6; }
  if(level==="advanced"){ base.strength=38; base.skill=22; base.conditioning=10; }
  const total=Object.values(base).reduce((a,b)=>a+b,0);
  return {total, calc:Object.values(base).join("+")+"="+total};
}

function strengthBlock(level, landmineOn){
  const out=[];
  if(level==="easy"){
    out.push("Squat pattern 2x6 (RPE ~6–7)","DB bench 2x8","RDL 2x8","Row/Pull 2x10");
  }else if(level==="advanced"){
    out.push("Squat pattern 4x5 (RPE ~7–8)","DB bench 4x6–8","RDL 4x6–8","Row/Pull 4x8");
  }else{
    out.push("Squat pattern 3x6 (RPE ~7)","DB bench 3x8","RDL 3x8","Row/Pull 3x8");
  }
  if(landmineOn){
    if(level==="easy") out.push("Landmine press 2x10 (controlled)");
    else if(level==="advanced") out.push("Landmine press 3x8 + Landmine row 3x8");
    else out.push("Landmine press 3x10 OR Landmine row 3x10");
  }
  return out;
}
function speedBlock(focus, level){
  const base = (level==="easy")?5:(level==="advanced")?8:6;
  if(focus==="faster") return [`Acceleration 10–20 yd x ${base+2} (full rest)`,"Decel to stick: 6 reps"];
  if(focus==="jump") return [`Acceleration 10–20 yd x ${base} (full rest)`,"Lateral quickness: 6 reps"];
  if(focus==="power") return [`Acceleration 10–20 yd x ${base} (full rest)`,"Resisted march / A-skip 2x10"];
  return [`Acceleration 10–20 yd x ${base} (full rest)`];
}
function powerBlock(focus, level){
  const js = (level==="easy")?"3x3":(level==="advanced")?"5x3":"4x3";
  const ms = (level==="easy")?"3x3":(level==="advanced")?"5x3":"4x3";
  if(focus==="jump") return [`Jumps: box or vertical ${js} (full rest)`,"Pogos 2x12"];
  if(focus==="power") return [`Med-ball throw ${ms}`,`Jumps: broad or box ${js}`];
  return [`Jumps: box or broad ${js}`,`Med-ball throw ${ms}`];
}

function buildProgram(p){
  const sd=SPORT_DATA[p.sport]||SPORT_DATA.basketball;
  const addOn=(sd.addOns[p.skill]||sd.addOns["Balanced"]||["Skill block 15–20 min"]);
  const landmineOn=(p.landmine==="on");
  const est=estimateMinutes(p.programLevel);

  const why=`Sport: ${p.sport} • Program: ${p.programLevel} • Focus: ${p.focus} • Position: ${p.position} • Skill: ${p.skill} • Landmine: ${landmineOn?"on":"off"}`;

  const blocks=[
    {label:"Warm-up", items:["5 min easy cardio","Dynamic mobility (hips/ankles/T-spine)","2x10 skips/pogos"]},
    {label:"Speed / Quickness", items:speedBlock(p.focus, p.programLevel)},
    {label:"Jump / Power", items:powerBlock(p.focus, p.programLevel)},
    {label:"Strength", items:strengthBlock(p.programLevel, landmineOn)},
    {label:"Skill block", items:addOn},
    {label:"Conditioning (optional)", items:(p.programLevel==="easy")?["Easy tempo 6 min (optional)"]:["Tempo 6–10 min (optional)"]},
    {label:"Cooldown", items:["Breathing 2 min","Light stretch (hips/calves/hamstrings) 4–6 min"]}
  ];

  const lifts=[
    {name:"Squat pattern", sets:(p.programLevel==="advanced")?4:(p.programLevel==="easy")?2:3, reps:(p.programLevel==="advanced")?"5":"6"},
    {name:"DB bench", sets:(p.programLevel==="advanced")?4:(p.programLevel==="easy")?2:3, reps:(p.programLevel==="advanced")?"6":"8"},
    {name:"RDL", sets:(p.programLevel==="advanced")?4:(p.programLevel==="easy")?2:3, reps:(p.programLevel==="advanced")?"6":"8"},
    {name:"Row/Pull", sets:(p.programLevel==="advanced")?4:(p.programLevel==="easy")?2:3, reps:"8"}
  ];
  if(landmineOn) lifts.push({name:"Landmine press/row", sets:(p.programLevel==="easy")?2:3, reps:(p.programLevel==="advanced")?"8":"10"});

  return { title:"Today’s Training", meta:{...p, estSessionMin:est.total, estCalc:est.calc}, why, blocks, notes:["Load guidance: avoid grinding reps. Leave 2–3 reps in reserve on strength."], logLifts:lifts };
}

function renderProgram(){
  const out=$("programOutput");
  if(!state.program){ out.innerHTML='<div class="small">Generate a program from Profile.</div>'; return; }
  const p=state.program, m=p.meta||{};
  const header=`<div class="wcard"><div class="whead"><div class="wtitle">${esc(p.title)}</div><div class="badge">Est: ${m.estSessionMin} min</div></div><div class="small" style="margin-top:8px">${esc(p.why)}<br>Time calc: ${esc(m.estCalc)}</div></div>`;
  const blocks=(p.blocks||[]).map(b=>{
    const items=(b.items||[]).map(x=>`<div class="witem"><input type="checkbox" aria-label="Complete item"><div class="wtext">${esc(x)}</div></div>`).join("");
    return `<div class="wcard"><div class="whead"><div class="wtitle">${esc(b.label)}</div><div class="badge">${esc(m.sport)} • ${esc(m.programLevel)}</div></div><div class="wlist">${items}</div></div>`;
  }).join("");
  const notes=`<div class="wcard"><div class="wtitle">Notes</div><div class="small" style="margin-top:8px">${(p.notes||[]).map(esc).join("<br>")}</div></div>`;
  out.innerHTML = header + `<div style="display:grid;gap:12px;margin-top:12px">${blocks}</div>` + notes;
}

function renderLog(){
  const wrap=$("logContainer");
  if(!state.program){ wrap.innerHTML='<div class="small">Generate a program first to create a lift log.</div>'; return; }
  const dateISO=new Date().toISOString().slice(0,10);
  let rows="";
  (state.program.logLifts||[]).forEach(l=>{
    for(let s=1;s<=l.sets;s++){
      rows+=`<tr><td>${esc(l.name)}</td><td>${s}</td><td>${esc(l.reps)}</td><td><input inputmode="decimal" data-lift="${esc(l.name)}" data-set="${s}" data-reps="${esc(l.reps)}" placeholder="lbs"></td></tr>`;
    }
  });
  wrap.innerHTML=`<div class="small">Date: <b>${dateISO}</b></div><table class="table" style="margin-top:10px"><thead><tr><th>Lift</th><th>Set</th><th>Target reps</th><th>Weight (lbs)</th></tr></thead><tbody>${rows}</tbody></table>`;
}
function saveTodayLog(){
  const dateISO=new Date().toISOString().slice(0,10);
  const inputs=[...document.querySelectorAll('#logContainer input[data-lift]')];
  const entries=[];
  inputs.forEach(inp=>{
    const w=(inp.value||"").trim(); if(!w) return;
    const weight=Number(w); if(!Number.isFinite(weight)) return;
    entries.push({name:inp.dataset.lift,set:Number(inp.dataset.set),reps:inp.dataset.reps,weight});
  });
  state.logs=state.logs.filter(x=>x.dateISO!==dateISO);
  state.logs.push({dateISO, entries});
  state.logs.sort((a,b)=>a.dateISO.localeCompare(b.dateISO));
  saveState(state);
}
function weeklyVolumes(){
  const byWeek=new Map();
  state.logs.forEach(day=>{
    const date=new Date(day.dateISO+"T00:00:00");
    const dow=date.getDay();
    const mondayOffset=(dow===0)?-6:(1-dow);
    const weekStart=new Date(date); weekStart.setDate(date.getDate()+mondayOffset);
    const weekISO=weekStart.toISOString().slice(0,10);
    let vol=0;
    (day.entries||[]).forEach(e=>{
      const reps=Number(String(e.reps).replace(/[^0-9]/g,""));
      if(Number.isFinite(reps)&&Number.isFinite(e.weight)) vol += e.weight*reps;
    });
    byWeek.set(weekISO,(byWeek.get(weekISO)||0)+vol);
  });
  return [...byWeek.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([weekStartISO,totalVolume])=>({weekStartISO,totalVolume}));
}
function renderDashboard(){
  const c=$("volChart"), sum=$("dashSummary");
  const ctx=c.getContext("2d");
  ctx.clearRect(0,0,c.width,c.height);
  const data=weeklyVolumes();
  const padL=50,padR=20,padT=18,padB=30;
  const w=c.width,h=c.height,plotW=w-padL-padR,plotH=h-padT-padB;
  if(data.length===0){
    ctx.fillStyle="rgba(231,238,248,.75)";
    ctx.font="14px system-ui";
    ctx.fillText("No log data yet. Save today’s log to see weekly volume.", padL, padT+30);
    sum.textContent="Weekly volume = sum(weight × reps) across logged sets (only sets you enter count).";
    return;
  }
  const max=Math.max(...data.map(d=>d.totalVolume)), yMax=max*1.15;
  ctx.strokeStyle="rgba(231,238,248,.12)"; ctx.lineWidth=1;
  for(let i=0;i<=4;i++){ const y=padT+(plotH*i/4); ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(padL+plotW,y); ctx.stroke(); }
  const n=data.length;
  const x=i=> padL + (n===1?plotW/2:plotW*(i/(n-1)));
  const y=v=> padT + plotH*(1-(v/yMax));
  ctx.strokeStyle="rgba(43,124,255,.95)"; ctx.lineWidth=3; ctx.beginPath();
  data.forEach((d,i)=>{ const xx=x(i),yy=y(d.totalVolume); if(i===0) ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy); });
  ctx.stroke();
  ctx.fillStyle="rgba(255,138,0,.95)";
  data.forEach((d,i)=>{ const xx=x(i),yy=y(d.totalVolume); ctx.beginPath(); ctx.arc(xx,yy,5,0,Math.PI*2); ctx.fill(); });
  ctx.fillStyle="rgba(231,238,248,.70)"; ctx.font="12px system-ui";
  data.forEach((d,i)=>{ const lab=d.weekStartISO.slice(5); ctx.fillText(lab, x(i)-18, padT+plotH+22); });
  ctx.fillText("0", 18, padT+plotH+4);
  ctx.fillText(String(Math.round(yMax)), 8, padT+12);
  const last=data[data.length-1];
  sum.innerHTML=`Weeks tracked: <b>${data.length}</b> • Latest week (${last.weekStartISO}): <b>${Math.round(last.totalVolume)}</b> volume<br>Volume calc: sum(weight × reps) for all logged sets.`;
}

function init(){
  syncUI();
  bindNav();
  $("sport").addEventListener("change", ()=>{ onSportChange(); syncUI(); readUI(); });
  ["level","days","programLevel","focus","landmine","position","skill"].forEach(id=>$(""+id).addEventListener("change", readUI));
  $("btnGenerate").addEventListener("click", ()=>{ readUI(); state.program=buildProgram(state.profile); saveState(state); location.hash="#program"; renderProgram(); });
  $("btnResetData").addEventListener("click", ()=>{ if(!confirm("Clear saved profile, program, and logs on this device?")) return; localStorage.removeItem(STORAGE_KEY); location.reload(); });
  $("btnSaveLog").addEventListener("click", ()=>{ saveTodayLog(); alert("Saved. Open Dashboard to see weekly volume trend."); });
  if(!location.hash) location.hash="#profile";
  route();
}
document.addEventListener("DOMContentLoaded", init);
