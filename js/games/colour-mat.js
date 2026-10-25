/* ---------- jump on the colour (floor tiles) ---------- */
const COLORS4=[{n:'красный',c:'#E5484D'},{n:'жёлтый',c:'#FFC53D'},{n:'синий',c:'#3E63DD'},{n:'зелёный',c:'#30A46C'}];
const JUMP_LEVELS=[
  {icon:'🟥',title:'Один цвет',ex:'«Встань на красный!»'},
  {icon:'🟥 🟦',title:'Два цвета подряд',ex:'«Сначала красный, потом синий!»'},
  {icon:'👣 👣',title:'Две ножки',ex:'«Одна ножка на жёлтый, другая на зелёный!»'},
  {icon:'👣 ✋',title:'Ножка и ручка',ex:'«Ножку на синий, ручку на красный!»'}
];
let jp=null;
function jumpMenuHTML(){
  return `<section class="home">
    <header class="bar"><button class="back" data-act="home">← Назад</button><div class="title">Цветной коврик</div></header>
    <div class="lvls">${JUMP_LEVELS.map((l,i)=>`<button class="lvl ${lv('jump')===i+1?'on':''}" data-jl="${i+1}" aria-pressed="${lv('jump')===i+1}"><span class="li">${l.icon.split(' ').map(em).join(' ')}</span><b>${i+1}. ${l.title}</b><small>${l.ex}</small></button>`).join('')}</div>
    <div class="grown">
      ${seg('Подсказка','jumpHint',[['show','цвет на экране'],['voice','только голос']])}
      ${seg('Плитки на полу лежат','jumpLayout',[['grid','квадратом'],['row','в ряд']])}
      <p class="tip">«Только голос» — следующий шаг на любом уровне: на экране все цвета одинаковые, и ребёнок ориентируется только на слово. После «Верно» нужные плитки подсвечиваются.</p>
      <p class="tip">Показывать на телевизоре: на iPad откройте Пункт управления → «Повтор экрана». Разложите плитки на полу так же, как на экране. Когда ребёнок всё сделал правильно, нажимайте «Верно» (или пробел на клавиатуре).</p>
    </div>
    <button class="pbtn ok play" data-act="jumpstart">▶ Играть</button>
  </section>`;
}
function startJump(){state.mode='jump';state.stars=0;jp={last:-1,targets:[],busy:false,revealed:false,timer:null};newJump();}
function newJump(){
  clearTimeout(jp.timer);
  const pick=excl=>{let i;do{i=Math.floor(Math.random()*4);}while(excl.includes(i));return i;};
  const a=pick([jp.last]),b=pick([a]),L=lv('jump');
  if(L===1)jp.targets=[{t:a,part:'foot'}];
  else if(L===2)jp.targets=[{t:a,k:1},{t:b,k:2}];
  else if(L===3)jp.targets=[{t:a,part:'foot'},{t:b,part:'foot'}];
  else jp.targets=Math.random()<0.5?[{t:a,part:'foot'},{t:b,part:'hand'}]:[{t:a,part:'hand'},{t:b,part:'foot'}];
  jp.last=a;jp.busy=false;jp.revealed=false;
  render();jp.timer=setTimeout(sayJump,400);
}
function jumpText(){
  const T=jp.targets,n=i=>COLORS4[T[i].t].n,L=lv('jump');
  if(L===1)return `Встань на ${n(0)}!`;
  if(L===2)return `Сначала ${n(0)}, потом ${n(1)}!`;
  if(L===3)return `Одна ножка на ${n(0)}, другая на ${n(1)}!`;
  const w=i=>T[i].part==='hand'?'ручку':'ножку';
  return cap(`${w(0)} на ${n(0)}, ${w(1)} на ${n(1)}!`);
}
function sayJump(){if(state.mode==='jump')say(jumpText());}
function tilesHTML(){
  const show=jp.revealed||state.jumpHint==='show';
  return COLORS4.map((c,i)=>{
    const tg=jp.targets.find(x=>x.t===i),lit=show&&!!tg,dim=show&&!tg;
    let inner='';
    if(lit&&tg.k)inner=`<span class="tbadge">${tg.k}</span>`;
    else if(lit&&tg.part&&lv('jump')>1)inner=`<span class="tbadge part">${em(tg.part==='hand'?'✋':'👣')}</span>`;
    return `<div class="tile ${lit?'lit':''} ${dim?'dim':''}" data-t="${i}" style="--c:${c.c}" aria-label="${c.n}">${inner}</div>`;
  }).join('');
}
function jumpHTML(){
  const q=state.jumpHint==='show'||jp.revealed?jumpText():'Слушай и прыгай!';
  return `<header class="bar">${holdBack()}<div class="stars" id="stars">${starsHTML()}</div><button class="ctl" data-act="jumprepeat" aria-label="Повторить">${em('🔊')}</button></header>
  <div class="q" id="jq">${esc(q)}</div>
  <main class="stage" id="stage"><div class="tiles" id="tiles">${tilesHTML()}</div></main>
  <div class="pbar"><button class="pbtn ok" data-act="jumpok">✓ Верно</button><button class="pbtn" data-act="jumpnext">⏭ Другое задание</button></div>`;
}
function fitTiles(){
  const st=document.getElementById('stage'),g=document.getElementById('tiles');if(!st||!g)return;
  const cols=state.jumpLayout==='row'?4:2,rows=4/cols,W=st.clientWidth,H=st.clientHeight,gap=Math.round(Math.min(W,H)*0.05);
  const sz=Math.floor(0.86*Math.min((W-gap*(cols-1))/cols,(H-gap*(rows-1))/rows));
  g.style.gridTemplateColumns=`repeat(${cols},${sz}px)`;g.style.gap=gap+'px';g.style.setProperty('--s',sz+'px');
}
addEventListener('resize',()=>{if(state.mode==='jump')fitTiles();});
function jumpOk(){
  if(state.mode!=='jump'||!jp||jp.busy)return;
  jp.busy=true;jp.revealed=true;
  document.getElementById('tiles').innerHTML=tilesHTML();
  document.getElementById('jq').textContent=jumpText();
  jp.targets.forEach(x=>{const el=document.querySelector(`.tile[data-t="${x.t}"]`);if(el)anim(el,'yay');});
  say(lv('jump')===1?`Молодец! ${cap(COLORS4[jp.targets[0].t].n)}!`:'Молодец!');lvResult('jump',true);
  state.stars++;document.getElementById('stars').innerHTML=starsHTML();
  jp.timer=setTimeout(()=>{
    if(state.mode!=='jump')return;
    if(state.stars>=5)party(()=>{if(state.mode==='jump'){state.stars=0;newJump();}});
    else newJump();
  },2400);
}
document.addEventListener('keydown',e=>{
  if(state.mode!=='jump')return;
  if(e.key===' '||e.key==='Enter'){e.preventDefault();jumpOk();}
  else if(e.key==='ArrowRight'){e.preventDefault();if(!jp.busy){lvResult('jump',false);newJump();}}
  else if(e.key==='r'||e.key==='к'){sayJump();}
});

/* victory fanfare: "ta-ta-ta-taaa" on brass, final chord, bells and a cymbal */
function fanfare(){
  const c=AC();if(!c)return;
  const out=c.createGain();out.gain.value=0.85;out.connect(c.destination);
  const t=c.currentTime+0.05;
  const brass=(f,st,d,v=0.14)=>{
    [['square',0,1.5],['sawtooth',-7,2],['sawtooth',7,2]].forEach(([type,det,div])=>{
      const o=c.createOscillator();o.type=type;o.frequency.value=f;o.detune.value=det;
      const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.setValueAtTime(700,st);fl.frequency.linearRampToValueAtTime(3200,st+0.06);fl.frequency.linearRampToValueAtTime(1600,st+d);
      const g=c.createGain(),pk=v/div;g.gain.setValueAtTime(0.0001,st);g.gain.exponentialRampToValueAtTime(pk,st+0.03);g.gain.setValueAtTime(pk,st+Math.max(0.04,d-0.05));g.gain.exponentialRampToValueAtTime(0.0001,st+d+0.15);
      o.connect(fl);fl.connect(g);g.connect(out);o.start(st);o.stop(st+d+0.25);
    });
  };
  const G4=392,C5=523.25,E5=659.25,G5=783.99,C6=1046.5;
  brass(G4,t,0.12);brass(G4,t+0.15,0.12);brass(G4,t+0.3,0.12);brass(C5,t+0.45,0.36);
  brass(E5,t+0.86,0.12);brass(C5,t+1.01,0.12);
  [C5,E5,G5,C6].forEach(f=>brass(f,t+1.17,0.8,0.09));
  [1568,2093,2637,3136].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain(),st=t+1.2+i*0.09;o.type='sine';o.frequency.value=f;
    g.gain.setValueAtTime(0.06,st);g.gain.exponentialRampToValueAtTime(0.0001,st+0.7);o.connect(g);g.connect(out);o.start(st);o.stop(st+0.8);});
  const n=noise(out,t+1.17,1,'highpass',5500,0.5);n.g.gain.setValueAtTime(0.13,t+1.17);n.g.gain.exponentialRampToValueAtTime(0.001,t+2.1);
}

function softChime(){
  const c=AC();if(!c)return;const out=c.createGain();out.gain.value=.5;out.connect(c.destination);const t=c.currentTime+.05;
  [523.25,659.25,783.99,1046.5].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain(),st=t+i*.22;o.type='sine';o.frequency.value=f;
    g.gain.setValueAtTime(.0001,st);g.gain.exponentialRampToValueAtTime(.12,st+.04);g.gain.exponentialRampToValueAtTime(.0001,st+1.2);o.connect(g);g.connect(out);o.start(st);o.stop(st+1.3);});
}
function party(next,text='Молодец!'){
  const p=document.createElement('div');p.className='party';
  stopAudio();if(synth)synth.cancel();
  if(state.calm){
    p.innerHTML=`<div class="big">${em('⭐')}</div><div>${text}</div>`;
    document.body.appendChild(p);softChime();
    const sayT=setTimeout(()=>say(text),900);
    setTimeout(()=>{clearTimeout(sayT);p.remove();next&&next();},3200);
    return;
  }
  p.innerHTML=`<div class="big">${em('🎉')}</div><div>${text}</div>`;
  const CF=['🎈','⭐','✨','🎉','🌟','🎊'];
  for(let i=0;i<22;i++){const c=document.createElement('span');c.className='conf';c.innerHTML=em(CF[i%CF.length]);c.style.left=(Math.random()*96)+'%';c.style.animationDuration=(2.2+Math.random()*1.4)+'s';c.style.animationDelay=(Math.random()*.6)+'s';c.style.setProperty('--r',(Math.random()*540-270)+'deg');p.appendChild(c);}
  document.body.appendChild(p);fanfare();
  const sayT=setTimeout(()=>say('Ура! '+text),2100);
  setTimeout(()=>{clearTimeout(sayT);p.remove();next&&next();},4300);
}
