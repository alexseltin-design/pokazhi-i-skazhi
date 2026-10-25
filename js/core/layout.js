/* ---------- layout ---------- */
function fitGrid(){
  const st=document.getElementById('stage'),g=document.getElementById('grid');
  if(!st||!g)return;
  const n=g.children.length,gap=16,W=st.clientWidth,H=st.clientHeight;
  let best=0,bc=1;
  for(let c=1;c<=n;c++){const r=Math.ceil(n/c);const s=Math.min((W-gap*(c-1))/c,(H-gap*(r-1))/r);if(s>best){best=s;bc=c;}}
  best=Math.floor(Math.min(best,(state.mode==='find'||state.mode==='hear')?380:320));
  g.style.gridTemplateColumns=`repeat(${bc},${best}px)`;
  g.style.setProperty('--s',best+'px');
}
addEventListener('resize',fitGrid);

function wireBack(){
  const b=document.getElementById('back');let t=null;
  const start=e=>{e.preventDefault();b.classList.add('holding');t=setTimeout(goHome,1000);};
  const stop=()=>{b.classList.remove('holding');clearTimeout(t);};
  b.addEventListener('pointerdown',start);
  ['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,stop));
  b.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')goHome();});
}
function goHome(){if(CATS[state.cat]&&CATS[state.cat].hidden)state.cat='animals';stopRec();stopAudio();stopHand();if(rh)clearTimeout(rh.timer);if(cn)clearTimeout(cn.timer);if(jp)clearTimeout(jp.timer);state.homeMsg=null;if(synth)synth.cancel();stopSwish();stopBrushTone();stopVoiceGames();if(rd)clearTimeout(rd.timer);if(sc)clearTimeout(sc.timer);if(hr)clearTimeout(hr.timer);if(cp){clearTimeout(cp.timer);clearInterval(cp.swap);}if(br){br.timers.forEach(clearTimeout);br.timers=[];}state.mode=({draw:'drawmenu',scratch:'drawmenu',paint:'drawmenu',brush:'drawmenu',stamps:'drawmenu',roads:'drawmenu',blow:'talkmenu',parrot:'talkmenu',learn:'talkmenu',dict:'talkmenu',finish:'talkmenu',choose:'talkmenu',jump:'jumpmenu'})[state.mode]||'home';state.busy=false;render();}
