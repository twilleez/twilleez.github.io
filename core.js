function generate(){
  const out=document.getElementById("out");
  if(!out) return;
  out.textContent =
`Warmup
- Jog 5 min
- Mobility

Strength
- Squat 3x6
- Pushups 3x12

Speed
- Sprints 6x20yd`;
}
document.addEventListener("DOMContentLoaded",()=>{
  const btn=document.getElementById("genBtn");
  if(btn) btn.addEventListener("click", generate);
});
