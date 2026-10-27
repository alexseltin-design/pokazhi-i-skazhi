/* ---------- who is it? (listening) ---------- */
let hr=null;
const HOME_SOUNDS=[['☎️','Телефон','phone'],['🔔','Звонок','doorbell'],['⏰','Часы','clock'],['🌧️','Дождь','rain'],['🥁','Барабан','drumfx'],['🚲','Велосипед','bell']]
  .map(([e,w,fx],i)=>({e,w,s:null,fx,c:COLORS[(i*2+1)%COLORS.length],key:'home:'+w}));
function hearPool(){const L=lv('hear');if(L===4)return HOME_SOUNDS;if(L===3)return [...CATS.animals.items,...CATS.cars.items];return state.cat==='cars'?CATS.cars.items:CATS.animals.items;}
/* household sounds, made in the browser */
Object.assign(FX,{
  phone(){const o=newOut();if(!o)return;const t=ac.currentTime+.02;
    [0,1.1].forEach(d=>{for(let k=0;k<14;k++){osc(o,'sine',k%2?480:440,t+d+k*.05,.05,.08);}});},
  doorbell(){bell(659.25,1.1);setTimeout(()=>bell(523.25,1.1),550);},
  clock(){const o=newOut();if(!o)return;const t=ac.currentTime+.02;
    for(let k=0;k<8;k++){const n=noise(o,t+k*.45,.05,'bandpass',k%2?1600:2300,6);n.g.gain.setValueAtTime(.9,t+k*.45);n.g.gain.exponentialRampToValueAtTime(.001,t+k*.45+.04);}},
  rain(){const o=newOut();if(!o)return;const t=ac.currentTime+.02;
    const n=noise(o,t,3,'lowpass',2600,.4);n.g.gain.setValueAtTime(.001,t);n.g.gain.exponentialRampToValueAtTime(.18,t+.6);n.g.gain.setValueAtTime(.18,t+2.3);n.g.gain.exponentialRampToValueAtTime(.001,t+3);
    for(let k=0;k<26;k++){const st=t+Math.random()*2.8;osc(o,'sine',1200+Math.random()*1800,st,.03,.04);}},
  drumfx(){drum();setTimeout(drum,280);setTimeout(drum,560);setTimeout(drum,1000);}
});
function startHear(){state.mode='hear';state.stars=0;hr={last:null,timer:null,busy:false};newHear();}
function newHear(){
  clearTimeout(hr.timer);const items=hearPool();
  const t=items[bagNext('hear'+lv('hear')+state.cat,items.length)];hr.last=t;hr.t=t;
  hr.opts=shuffle([t,...shuffle(items.filter(i=>i!==t)).slice(0,(lv('hear')===1?2:3)-1)]);hr.busy=false;hr.miss=false;
  render();hr.timer=setTimeout(()=>hearSound(['Послушай! Кто это?']),400);
}
function hearSound(pre){
  const t=hr.t,parts=(pre||[]).slice();
  if(t.s){parts.push(t.s);speakSeq(parts);}else speakSeq(parts,()=>FX[t.fx]());
}
function hearHTML(){
  return `<header class="bar">${holdBack()}<div class="stars" id="stars">${starsHTML()}</div><button class="ctl" data-act="hearagain" aria-label="Послушать ещё раз">${em('🔊')}</button></header>
  <div class="q">${em('👂')} Кто это?</div>
  <main class="stage" id="stage"><div class="grid" id="grid">${hr.opts.map(cardHTML).join('')}</div></main>`;
}
function hearTap(el,it){
  if(hr.busy)return;
  if(it===hr.t){
    hr.busy=true;anim(el,'yay');sparkle(el);
    if(lv('hear')===4||it.key.startsWith('home:'))speakSeq(['Да!',it.w+'!'],()=>FX[it.fx]());else sayItem(it,'Да!');
    if(!hr.miss)lvResult('hear',true);
    state.stars++;document.getElementById('stars').innerHTML=starsHTML();
    hr.timer=afterSpeech(()=>{if(state.mode!=='hear')return;if(state.stars>=5)party(()=>{if(state.mode==='hear'){state.stars=0;newHear();}});else newHear();},1800);
  }else{anim(el,'nope');if(!hr.miss){hr.miss=true;lvResult('hear',false);}hearSound([`Это ${nm(it)}.`,'Послушай ещё раз.']);}
}

/* ---------- do as I do (imitation) ---------- */
const ACTIONS=[['clap','Хлопай в ладоши!'],['up','Ручки вверх!'],['nose','Потрогай носик!'],['ears','Покажи ушки!'],['stomp','Топай ножками!'],['mouth','Открой ротик!'],['yes','Кивни головой: да!'],['no','Покачай головой: нет!'],['jump','Прыгай!'],['squat','Присядь!']];
function kidSVG(act){
  const girl=state.hero!=='boy',OL='#6B4A3A',SK='#FFD9BE',SKD='#F4B696',HA=girl?'#8A5432':'#6E4630',SH='#4A3B5C';
  const C=girl?{c1:'#FFA3C2',c2:'#F27AA3'}:{c1:'#7FB4FF',c2:'#4E86E6'};
  const L=act==='up'?92:50;
  const arm=(x,cls,side)=>`<g class="${cls}">
      <path d="M${x} 130L${x} ${120+L}" stroke="${OL}" stroke-width="15" stroke-linecap="round"/>
      <path d="M${x} 130L${x} ${120+L}" stroke="${SK}" stroke-width="10.5" stroke-linecap="round"/>
      <circle cx="${x+side*6}" cy="${118+L}" r="4.2" fill="${SK}" stroke="${OL}" stroke-width="2"/>
      <circle cx="${x}" cy="${125+L}" r="9.5" fill="${SK}" stroke="${OL}" stroke-width="2.4"/>
      <rect x="${x-10}" y="113" width="20" height="24" rx="10" fill="url(#kC)" stroke="${OL}" stroke-width="2.4"/>
    </g>`;
  const leg=(x,fx,cls)=>`<g class="${cls}">
      <path d="M${x} 180V232" stroke="${OL}" stroke-width="17" stroke-linecap="round"/>
      <path d="M${x} 180V232" stroke="${SK}" stroke-width="12.5" stroke-linecap="round"/>
      <rect x="${x-6.5}" y="221" width="13" height="11" rx="3" fill="#fff" stroke="${OL}" stroke-width="2"/>
      <ellipse cx="${fx}" cy="240" rx="13.5" ry="7.5" fill="${SH}" stroke="${OL}" stroke-width="2"/>
      <ellipse cx="${fx-4}" cy="237.5" rx="4" ry="1.8" fill="#fff" opacity=".35"/>
    </g>`;
  const body=girl
    ?`<path d="M78 110Q100 101 122 110L141 187Q100 198 59 187Z" fill="url(#kC)" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M86 108Q93 120 100 112Q107 120 114 108" fill="#fff" stroke="${OL}" stroke-width="2"/>
      <path d="M100 150c-4-6-12-2-8 4l8 8 8-8c4-6-4-10-8-4z" fill="#fff" opacity=".85"/>
      <path d="M62 180Q100 190 138 180" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/>`
    :`<path d="M76 110Q100 101 124 110L129 166H71Z" fill="url(#kC)" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M92 108Q100 116 108 108" fill="none" stroke="${OL}" stroke-width="2"/>
      <path d="M100 128l3.5 7.5 8 1-6 5.5 1.6 8-7.1-4-7.1 4 1.6-8-6-5.5 8-1z" fill="#FFE07A" stroke="${OL}" stroke-width="1.4"/>
      <path d="M71 163H129L127 189H105L100 177L95 189H73Z" fill="#3F5BA9" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>`;
  const hairBack=girl?`<circle cx="50" cy="62" r="17" fill="${HA}" stroke="${OL}" stroke-width="2.4"/><circle cx="150" cy="62" r="17" fill="${HA}" stroke="${OL}" stroke-width="2.4"/>
      <path d="M52 44l-10-6v13zM52 44l10-6v13z" fill="#FF7BA6" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="52" cy="44" r="3" fill="#FF7BA6" stroke="${OL}" stroke-width="1.8"/>
      <path d="M148 44l-10-6v13zM148 44l10-6v13z" fill="#FF7BA6" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="148" cy="44" r="3" fill="#FF7BA6" stroke="${OL}" stroke-width="1.8"/>`:'';
  const hairTop=girl?`<path d="M56 68Q52 20 100 19Q148 20 144 68Q136 44 120 41Q113 53 100 50Q87 53 80 41Q64 44 56 68Z" fill="${HA}" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M78 32Q92 24 108 26" fill="none" stroke="#B07850" stroke-width="3" stroke-linecap="round" opacity=".7"/>`
    :`<path d="M58 64Q56 22 100 21Q144 22 142 64Q134 40 118 42Q109 32 98 40Q86 32 76 44Q63 46 58 64Z" fill="${HA}" stroke="${OL}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M96 22Q100 8 110 16" fill="none" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/>`;
  const lash=girl?`<path d="M77 64l-4-3M91 64l4-3M109 64l-4-3M123 64l4-3" stroke="${OL}" stroke-width="1.8" stroke-linecap="round"/>`:'';
  const fx=`<g class="fx fx-nose"><circle cx="100" cy="80" r="11" fill="none" stroke="#FFC93C" stroke-width="3"/></g>
    <g class="fx fx-ears"><circle cx="56" cy="74" r="13" fill="none" stroke="#FFC93C" stroke-width="3"/><circle cx="144" cy="74" r="13" fill="none" stroke="#FFC93C" stroke-width="3"/></g>
    <g class="fx fx-mouth"><circle cx="100" cy="95" r="13" fill="none" stroke="#FFC93C" stroke-width="3"/></g>
    <g class="fx fx-clap" style="transform-origin:100px 150px">${[0,45,90,135,180,225,270,315].map(a=>`<line x1="100" y1="132" x2="100" y2="124" transform="rotate(${a} 100 150)" stroke="#FFC93C" stroke-width="3" stroke-linecap="round"/>`).join('')}</g>
    <g class="fx fx-up"><path d="M36 50l8-12 8 12M44 38v22" fill="none" stroke="#FFC93C" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M148 50l8-12 8 12M156 38v22" fill="none" stroke="#FFC93C" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></g>
    <g class="fx fx-stomp"><g class="puffL"><circle cx="72" cy="246" r="5" fill="#E6DCCF"/><circle cx="64" cy="243" r="3.5" fill="#E6DCCF"/></g><g class="puffR"><circle cx="128" cy="246" r="5" fill="#E6DCCF"/><circle cx="136" cy="243" r="3.5" fill="#E6DCCF"/></g></g>
    <g class="fx fx-yes"><path d="M164 50v40M156 58l8-10 8 10M156 82l8 10 8-10" fill="none" stroke="#FFC93C" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></g>
    <g class="fx fx-no"><path d="M72 12h56M80 4l-10 8 10 8M120 4l10 8-10 8" fill="none" stroke="#FFC93C" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></g>
    <g class="fx fx-jump"><path d="M80 252v8M100 254v8M120 252v8" stroke="#C9D6EA" stroke-width="3" stroke-linecap="round"/></g>
    <g class="fx fx-squat"><path d="M164 120v44M156 154l8 10 8-10" fill="none" stroke="#FFC93C" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  return `<svg class="kid act-${act}" viewBox="0 0 200 265" aria-hidden="true">
  <defs><linearGradient id="kC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.c1}"/><stop offset="1" stop-color="${C.c2}"/></linearGradient>
    <radialGradient id="kF" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#FFE6D3"/><stop offset="1" stop-color="${SK}"/></radialGradient></defs>
  <ellipse class="shadow" cx="100" cy="250" rx="50" ry="7" fill="rgba(0,0,0,.12)"/>
  <g class="whole">
    <g class="legs">${leg(86,83,'legL')}${leg(114,117,'legR')}</g>
    <g class="upper">
      ${body}
      <g class="head">
        <rect x="92" y="96" width="16" height="18" rx="7" fill="${SKD}" stroke="${OL}" stroke-width="2"/>
        ${hairBack}
        <circle cx="56" cy="74" r="9.5" fill="${SK}" stroke="${OL}" stroke-width="2.4"/><path d="M53 70q4 4 0 8" fill="none" stroke="${SKD}" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="144" cy="74" r="9.5" fill="${SK}" stroke="${OL}" stroke-width="2.4"/><path d="M147 70q-4 4 0 8" fill="none" stroke="${SKD}" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="100" cy="68" r="44" fill="url(#kF)" stroke="${OL}" stroke-width="2.6"/>
        ${hairTop}
        <path d="M76 58q8-5 15 0M109 58q7-5 15 0" fill="none" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/>
        ${lash}
        <ellipse cx="84" cy="71" rx="6.5" ry="8" fill="#2B2440"/><ellipse cx="116" cy="71" rx="6.5" ry="8" fill="#2B2440"/>
        <circle cx="86.5" cy="67.5" r="2.6" fill="#fff"/><circle cx="118.5" cy="67.5" r="2.6" fill="#fff"/><circle cx="82" cy="74.5" r="1.2" fill="#fff"/><circle cx="114" cy="74.5" r="1.2" fill="#fff"/>
        <ellipse cx="71" cy="85" rx="8.5" ry="5" fill="#FF97AE" opacity=".55"/><ellipse cx="129" cy="85" rx="8.5" ry="5" fill="#FF97AE" opacity=".55"/>
        <ellipse cx="100" cy="81" rx="3.4" ry="2.5" fill="${SKD}"/>
        <path class="smile" d="M89 92Q100 101 111 92" fill="none" stroke="#B5485E" stroke-width="3" stroke-linecap="round"/>
        <g class="openm"><ellipse cx="100" cy="95" rx="8.5" ry="7.5" fill="#9E3550" stroke="${OL}" stroke-width="1.6"/><ellipse cx="100" cy="99" rx="5" ry="2.8" fill="#FF8FA3"/></g>
      </g>
      ${arm(74,'armL',1)}${arm(126,'armR',-1)}
    </g>
  </g>
  ${fx}
  </svg>`;
}
let cp=null;
function startCopy(){state.mode='copy';state.stars=0;cp={last:-1,i:0,j:-1,busy:false,timer:null,swap:null,shown:false};newCopy();}
function newCopy(){
  clearTimeout(cp.timer);clearInterval(cp.swap);cp.lvl=lv('copy');
  let i;i=bagNext('copy',ACTIONS.length);
  let j=-1;if(cp.lvl===3){do{j=Math.floor(Math.random()*ACTIONS.length);}while(j===i);}
  cp.last=i;cp.i=i;cp.j=j;cp.busy=false;cp.shown=cp.lvl!==2;render();startCopyAnim();cp.timer=setTimeout(sayCopy,400);
}
function copyText(){const a=ACTIONS[cp.i][1];if(cp.j<0)return a;return `${a.replace('!','')}, потом ${low(ACTIONS[cp.j][1])}`;}
function sayCopy(){if(state.mode==='copy')speakSeq(cp.lvl===2?[copyText()]:['Сделай как я!',copyText()]);}
/* two actions: the character shows them one after another */
function startCopyAnim(){
  clearInterval(cp.swap);const svg=document.querySelector('#actcard svg');if(!svg)return;
  if(!cp.shown){svg.setAttribute('class','kid');return;}
  let k=0;const set=()=>svg.setAttribute('class','kid act-'+ACTIONS[cp.j>=0&&k%2?cp.j:cp.i][0]);set();
  if(cp.j>=0)cp.swap=setInterval(()=>{k++;set();},2600*(state.calm?1.35:1));
}
function copyHTML(){
  const hint=cp.lvl===2?(state.hero==='boy'?'Мальчик':'Девочка')+' не показывает: ребёнок должен понять просьбу на слух. «Показать» — если нужна помощь.':cp.lvl===3?'Два действия подряд: сначала одно, потом другое.':'';
  return `<header class="bar">${holdBack()}<div class="stars" id="stars">${starsHTML()}</div><button class="ctl" data-act="copyagain" aria-label="Повторить">${em('🔊')}</button></header>
  <div class="q">${cp.lvl===2?'Послушай и сделай!':'Сделай как я!'}</div>
  <main class="stage" id="stage"><div class="kidwrap" id="actcard">${kidSVG(ACTIONS[cp.i][0])}</div></main>
  <div class="actline small">${copyText()}</div>${hint?`<p class="hintline">${hint}</p>`:''}
  <div class="pbar"><button class="pbtn ok" data-act="copyok">✓ Получилось</button>${cp.lvl===2?'<button class="pbtn" data-act="copyshow">👀 Показать</button>':''}<button class="pbtn" data-act="copynext">⏭ Другое</button></div>`;
}
function copyOk(){
  if(!cp||cp.busy)return;cp.busy=true;
  const c=document.getElementById('actcard');if(c)anim(c,'pop');say('Молодец!');
  if(!cp.shown){cp.shown=true;startCopyAnim();}
  if(!cp.helped)lvResult('copy',true);cp.helped=false;
  state.stars++;document.getElementById('stars').innerHTML=starsHTML();
  cp.timer=afterSpeech(()=>{if(state.mode!=='copy')return;if(state.stars>=5)party(()=>{if(state.mode==='copy'){state.stars=0;newCopy();}});else newCopy();},1500);
}

/* ---------- breathe with the balloon ---------- */
let br=null;
function startBreathe(){state.mode='breathe';br={n:0,timers:[]};render();br.timers.push(setTimeout(breatheCycle,700));}
function breatheHTML(){
  return `<header class="bar">${holdBack()}<div class="title">Подыши с шариком</div></header>
  <div class="q" id="bq">Смотри на шарик</div>
  <main class="stage" id="stage"><div class="balloon" id="balloon">${em('🎈')}</div></main>`;
}
function breathTone(up,dur){
  const c=AC();if(!c)return;const t=c.currentTime+.02,o=c.createOscillator(),g=c.createGain();
  o.type='sine';o.frequency.setValueAtTime(up?196:262,t);o.frequency.linearRampToValueAtTime(up?262:196,t+dur);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.05*vol(),t+.8);g.gain.setValueAtTime(.05*vol(),t+dur-.8);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+.1);
}
function breatheCycle(){
  if(state.mode!=='breathe')return;
  const b=document.getElementById('balloon'),q=document.getElementById('bq');if(!b)return;
  b.style.transition='transform 4s ease-in-out';b.style.transform='scale(1.1)';q.textContent='Вдох…';
  if(br.n<3)say('Вдох');breathTone(true,4);
  br.timers.push(setTimeout(()=>{if(state.mode!=='breathe')return;
    b.style.transition='transform 5s ease-in-out';b.style.transform='scale(.6)';q.textContent='Выдох…';
    if(br.n<3)say('Выдох');breathTone(false,5);},4300));
  br.timers.push(setTimeout(()=>{if(state.mode!=='breathe')return;br.n++;if(br.n===5)say('Молодец!');breatheCycle();},9900));
}
