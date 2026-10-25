/* ---------- rhythm: repeat after me ---------- */
let rh=null;
const RH_SEQ=[1,2,2,3,2,3,3,4];
function drum(){
  const c=AC();if(!c)return;const t=c.currentTime+0.01;
  const out=c.createGain();out.gain.value=vol();out.connect(c.destination);
  const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(170,t);o.frequency.exponentialRampToValueAtTime(55,t+0.25);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(1,t+0.005);g.gain.exponentialRampToValueAtTime(0.0001,t+0.4);
  o.connect(g);g.connect(out);o.start(t);o.stop(t+0.45);
  const n=noise(out,t,0.08,'highpass',1800,0.7);n.g.gain.setValueAtTime(0.35,t);n.g.gain.exponentialRampToValueAtTime(0.001,t+0.06);
}
function bounceDrum(){const d=document.getElementById('drum');if(d)anim2(d);}
function anim2(el){el.classList.remove('hit');void el.offsetWidth;el.classList.add('hit');}
function updRh(k){
  const q=document.getElementById('rhq'),b=document.getElementById('beats'),dr=document.getElementById('drum');if(!q||!rh)return;
  q.textContent=rh.phase==='you'?'Теперь ты!':'Послушай';
  b.innerHTML=Array.from({length:rh.n},(_,i)=>`<span class="beat ${i<k?(rh.phase==='you'?'me':'demo'):''}"></span>`).join('');
  dr.classList.toggle('wait',rh.phase!=='you');
}
function startRhythm(){state.mode='rhythm';state.stars=0;rh={round:0,n:RH_SEQ[0],taps:0,phase:'demo',timer:null};render();setTimeout(()=>demo(),400);}
function demo(prefix){
  if(state.mode!=='rhythm')return;
  clearTimeout(rh.timer);rh.phase='demo';rh.taps=0;updRh(0);
  speakSeq([prefix||'Послушай!'],()=>{
    if(state.mode!=='rhythm')return;
    let i=0;
    const beat=()=>{
      if(state.mode!=='rhythm')return;
      drum();bounceDrum();i++;updRh(i);
      if(i<rh.n)rh.timer=setTimeout(beat,550);
      else rh.timer=setTimeout(()=>{if(state.mode!=='rhythm')return;rh.phase='you';rh.taps=0;updRh(0);say('Теперь ты!');},700);
    };
    rh.timer=setTimeout(beat,250);
  });
}
function wireDrum(){
  const d=document.getElementById('drum');if(!d)return;
  d.addEventListener('pointerdown',e=>{
    e.preventDefault();if(!rh||rh.phase!=='you')return;
    drum();anim2(d);rh.taps++;updRh(Math.min(rh.taps,rh.n));
    clearTimeout(rh.timer);rh.timer=setTimeout(evalRh,rh.taps>rh.n?300:1300);
  });
}
function evalRh(){
  if(state.mode!=='rhythm'||rh.phase!=='you')return;
  rh.phase='eval';
  if(rh.taps===rh.n){
    state.stars++;document.getElementById('stars').innerHTML=starsHTML();
    say('Молодец!');rh.round++;rh.n=RH_SEQ[rh.round%RH_SEQ.length];
    rh.timer=setTimeout(()=>{
      if(state.mode!=='rhythm')return;
      if(state.stars>=5)party(()=>{if(state.mode==='rhythm'){state.stars=0;render();demo();}});
      else demo();
    },1700);
  }else{
    rh.timer=setTimeout(()=>demo('Ещё раз. Послушай!'),300);
  }
}
