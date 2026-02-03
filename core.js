const STORAGE_KEY = "piq_phase2_state_v1";

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch(e){ return null; }
}
function saveState(state){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
}
function defaultState(){
  return {
    profile:{ sport:"basketball", level:"youth", days:4, focus:"balanced", position:"" },
    program:null,
    logs:[]
  };
}

const state = loadState() || defaultState();
function $(id){ return document.getElementById(id); }
function setActiveTab(tab){
  ["profile","program","log","dashboard"].forEach(t=>{
    const btn=$("nav-"+t);
    const panel=$("tab-"+t);
    if(btn) btn.classList.toggle("active", t===tab);
    if(panel) panel.style.display = (t===tab) ? "block" : "none";
  });
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}
function bindNav(){
  ["profile","program","log","dashboard"].forEach(t=>{
    const btn=$("nav-"+t);
    if(btn) btn.addEventListener("click", ()=> location.hash="#"+t);
  });
  window.addEventListener("hashchange", route);
}
function route(){
  const h=(location.hash||"#profile").replace("#","");
  const ok=new Set(["profile","program","log","dashboard"]);
  const tab = ok.has(h)?h:"profile";
  setActiveTab(tab);
  if(tab==="program") renderProgram();
  if(tab==="log") renderLog();
  if(tab==="dashboard") renderDashboard();
}
function syncProfileToUI(){
  $("sport").value = state.profile.sport;
  $("level").value = state.profile.level;
  $("days").value = String(state.profile.days);
  $("focus").value = state.profile.focus;
  $("position").value = state.profile.position || "";
}
function readProfileFromUI(){
  state.profile.sport = $("sport").value;
  state.profile.level = $("level").value;
  state.profile.days = Number($("days").value);
  state.profile.focus = $("focus").value;
  state.profile.position = ($("position").value || "").trim();
  saveState(state);
}

function programTemplate(profile){
  const sport=profile.sport;
  const focus=profile.focus;

  const addOn={
    basketball:["Skill: ball-handling 10 min","Skill: shooting volume 20–30 min"],
    football:["Skill: starts + accel 10 min","Skill: position drills 10–15 min"],
    volleyball:["Skill: approach jumps 10 min","Skill: serve/receive 15–20 min"],
    baseball:["Skill: throwing care 8–10 min","Skill: sprint mechanics 10 min"]
  }[sport] || ["Skill: sport fundamentals 15–20 min"];

  const focusNote={
    balanced:"Balanced week: conservative loading, steady progress.",
    faster:"Speed emphasis: more quality sprints, less conditioning.",
    jump:"Jump emphasis: extra jumps; keep strength crisp.",
    power:"Power emphasis: extra throws/jumps; avoid grinding reps."
  }[focus] || "Balanced week.";

  const est={warmup:10,power:10,strength:30,speed:12,conditioning:8,transitions:5};
  const estSessionMin=Object.values(est).reduce((a,b)=>a+b,0); // 75
  const estCalc=Object.values(est).join("+")+"="+estSessionMin;

  return {
    title:"Today’s Training",
    meta:{sport,level:profile.level,focus,position:profile.position||"",estSessionMin,estCalc},
    blocks:[
      {label:"Warm-up",items:["5 min easy cardio","Dynamic mobility (hips/ankles/T-spine)","2x10 pogos / skips"]},
      {label:"Power",items:["Box jump 4x3 (full rest)","Med-ball throw 4x3"]},
      {label:"Strength",items:["Squat pattern 3x6 (RPE ~7)","DB bench 3x8","RDL 3x8","Row or pull 3x8"]},
      {label:"Speed",items:["10–20 yd accelerations x 6 (full rest)"]},
      {label:"Conditioning",items:["6–10 min easy tempo (optional)"]},
      {label:"Sport add-on",items:addOn}
    ],
    notes:[focusNote],
    logLifts:[
      {name:"Squat pattern",sets:3,reps:"6"},
      {name:"DB bench",sets:3,reps:"8"},
      {name:"RDL",sets:3,reps:"8"},
      {name:"Row/Pull",sets:3,reps:"8"}
    ]
  };
}

function renderProgram(){
  const out=$("programOutput");
  if(!out) return;
  const p=state.program;
  if(!p){
    out.innerHTML='<div class="small">Generate a program from the Profile tab.</div>';
    return;
  }
  const m=p.meta||{};
  const header=`
    <div class="wcard">
      <div class="whead">
        <div class="wtitle">${escapeHtml(p.title)}</div>
        <div class="badge">Est: ${m.estSessionMin} min</div>
      </div>
      <div class="small" style="margin-top:8px">
        Sport: <b>${escapeHtml(m.sport)}</b>
        ${m.position?` • Position: <b>${escapeHtml(m.position)}</b>`:""}
        • Focus: <b>${escapeHtml(m.focus)}</b><br>
        Time calc: ${escapeHtml(m.estCalc)}
      </div>
    </div>`;
  const blocks=(p.blocks||[]).map(b=>{
    const items=(b.items||[]).map(x=>`
      <div class="witem">
        <input type="checkbox" aria-label="Complete item">
        <div class="wtext">${escapeHtml(x)}</div>
      </div>`).join("");
    return `<div class="wcard"><div class="whead"><div class="wtitle">${escapeHtml(b.label)}</div><div class="badge">${escapeHtml(m.sport)}</div></div><div class="wlist">${items}</div></div>`;
  }).join("");
  const notes=(p.notes||[]).length?`<div class="wcard"><div class="wtitle">Notes</div><div class="small" style="margin-top:8px">${p.notes.map(escapeHtml).join("<br>")}</div></div>`:"";
  out.innerHTML = header + `<div class="output" style="display:grid;gap:12px">${blocks}</div>` + notes;
}

function renderLog(){
  const wrap=$("logContainer");
  if(!wrap) return;
  const p=state.program;
  if(!p){
    wrap.innerHTML='<div class="small">Generate a program first to create a lift log.</div>';
    return;
  }
  const dateISO=new Date().toISOString().slice(0,10);
  let rows="";
  (p.logLifts||[]).forEach(l=>{
    for(let s=1;s<=l.sets;s++){
      rows+=`<tr>
        <td>${escapeHtml(l.name)}</td>
        <td>${s}</td>
        <td>${escapeHtml(l.reps)}</td>
        <td><input inputmode="decimal" data-lift="${escapeHtml(l.name)}" data-set="${s}" data-reps="${escapeHtml(l.reps)}" placeholder="lbs"></td>
      </tr>`;
    }
  });
  wrap.innerHTML = `<div class="small">Date: <b>${dateISO}</b></div>
  <table class="table" style="margin-top:10px">
    <thead><tr><th>Lift</th><th>Set</th><th>Target reps</th><th>Weight (lbs)</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function saveTodayLog(){
  const p=state.program; if(!p) return;
  const dateISO=new Date().toISOString().slice(0,10);
  const inputs=Array.from(document.querySelectorAll('#logContainer input[data-lift]'));
  const entries=[];
  inputs.forEach(inp=>{
    const w=(inp.value||"").trim();
    if(!w) return;
    const weight=Number(w);
    if(!Number.isFinite(weight)) return;
    entries.push({name:inp.dataset.lift,set:Number(inp.dataset.set),reps:inp.dataset.reps,weight});
  });
  state.logs = state.logs.filter(x=>x.dateISO!==dateISO);
  state.logs.push({dateISO, entries});
  state.logs.sort((a,b)=>a.dateISO.localeCompare(b.dateISO));
  saveState(state);
}

function computeWeeklyVolumes(){
  const byWeek=new Map();
  state.logs.forEach(day=>{
    const date=new Date(day.dateISO+"T00:00:00");
    const dow=date.getDay(); // 0 Sun
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
  return Array.from(byWeek.entries()).sort((a,b)=>a[0].localeCompare(b[0]))
    .map(([weekStartISO,totalVolume])=>({weekStartISO,totalVolume}));
}

function renderDashboard(){
  const c=$("volChart"); const sum=$("dashSummary");
  if(!c||!sum) return;
  const ctx=c.getContext("2d");
  ctx.clearRect(0,0,c.width,c.height);

  const data=computeWeeklyVolumes();
  const padL=50,padR=20,padT=18,padB=30;
  const w=c.width,h=c.height,plotW=w-padL-padR,plotH=h-padT-padB;

  if(data.length===0){
    ctx.fillStyle="rgba(231,238,248,.75)";
    ctx.font="14px system-ui";
    ctx.fillText("No log data yet. Save today’s log to see weekly volume.", padL, padT+30);
    sum.textContent="Weekly volume = sum(weight × reps) across logged sets (only sets you enter count).";
    return;
  }
  const max=Math.max(...data.map(d=>d.totalVolume));
  const yMax=max*1.15;

  ctx.strokeStyle="rgba(231,238,248,.12)";
  ctx.lineWidth=1;
  for(let i=0;i<=4;i++){
    const y=padT + (plotH*i/4);
    ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(padL+plotW,y); ctx.stroke();
  }

  const n=data.length;
  const x=i=> padL + (n===1?plotW/2:plotW*(i/(n-1)));
  const y=v=> padT + plotH*(1-(v/yMax));

  ctx.strokeStyle="rgba(43,124,255,.95)";
  ctx.lineWidth=3;
  ctx.beginPath();
  data.forEach((d,i)=>{
    const xx=x(i),yy=y(d.totalVolume);
    if(i===0) ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy);
  });
  ctx.stroke();

  ctx.fillStyle="rgba(255,138,0,.95)";
  data.forEach((d,i)=>{
    const xx=x(i),yy=y(d.totalVolume);
    ctx.beginPath(); ctx.arc(xx,yy,5,0,Math.PI*2); ctx.fill();
  });

  ctx.fillStyle="rgba(231,238,248,.70)";
  ctx.font="12px system-ui";
  data.forEach((d,i)=>{
    const lab=d.weekStartISO.slice(5);
    ctx.fillText(lab, x(i)-18, padT+plotH+22);
  });
  ctx.fillText("0", 18, padT+plotH+4);
  ctx.fillText(String(Math.round(yMax)), 8, padT+12);

  const last=data[data.length-1];
  sum.innerHTML=`Weeks tracked: <b>${data.length}</b> • Latest week (${last.weekStartISO}): <b>${Math.round(last.totalVolume)}</b> volume<br>
  Volume calc: sum(weight × reps) for all logged sets.`;
}

function init(){
  syncProfileToUI();
  bindNav();
  ["sport","level","days","focus","position"].forEach(id=>{
    const el=$(id); if(!el) return;
    el.addEventListener("change", readProfileFromUI);
    el.addEventListener("input", readProfileFromUI);
  });
  $("btnGenerate").addEventListener("click", ()=>{
    readProfileFromUI();
    state.program=programTemplate(state.profile);
    saveState(state);
    location.hash="#program";
    renderProgram();
  });
  $("btnResetData").addEventListener("click", ()=>{
    if(!confirm("Clear saved profile, program, and logs on this device?")) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });
  $("btnSaveLog").addEventListener("click", ()=>{
    saveTodayLog();
    alert("Saved. Open Dashboard to see weekly volume trend.");
  });

  if(!location.hash) location.hash="#profile";
  route();
  renderProgram();
}
document.addEventListener("DOMContentLoaded", init);