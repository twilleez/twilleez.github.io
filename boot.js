document.addEventListener("DOMContentLoaded",()=>{
  // Splash: always goes away after 1.5s, guaranteed.
  window.setTimeout(()=>{
    const splash=document.getElementById("splash");
    const app=document.getElementById("app");
    if(splash) splash.style.display="none";
    if(app) app.style.display="block";
  },1500);
});
