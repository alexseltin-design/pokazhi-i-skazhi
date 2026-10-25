/* ---------- blow! dandelion with a hidden animal, candles, boat, pinwheel, bubbles ---------- */
const HIDERS=[['🐇','Зайчик'],['🦔','Ёжик'],['🐱','Котик'],['🐞','Божья коровка'],['🐥','Цыплёнок'],['🐸','Лягушка'],['🐶','Собачка']];
const BLOW_SCENES=['dand','candle','boat','wheel','bubbles'];
const SCENE_TITLE={dand:'Одуванчик',candle:'Свечки',boat:'Кораблик',wheel:'Вертушка',bubbles:'Пузыри'};
const NO_MIC_HINT='Микрофон недоступен: можно «дуть» пальчиком, проводя по экрану.';
const lerp=(a,b,k)=>a+(b-a)*Math.min(1,k);
let dd=null;
function startDand(){
  state.mode='dandelion';
  dd={si:0,blowT:0,prevT:0,lastBlow:performance.now(),lastFrame:0,raf:0,timer:null,noMic:false,done:false,nudged:false,candles:1,hider:-1};
  newScene();
  startMic().then(ok=>{
    if(state.mode!=='dandelion')return;
    if(!ok){dd.noMic=true;const h=document.getElementById('dhint');if(h)h.textContent=NO_MIC_HINT;}
    else mic.onFrame=(m,n)=>{
      if(!dd)return;const now=performance.now();
      /* a real blow is a steady sound; taps on the glass are short knocks, so ignore sound right after a touch and very short bursts */
      if(m.voice&&now-(dd.lastTouch||0)>500){dd.run=(dd.run||0)+1;if(dd.run>=3){dd.blowT+=n/ac.sampleRate*(dd.run===3?3:1);dd.lastBlow=now;}}
      else dd.run=0;
    };
    scenePrompt();dandLoop();
  });
}
function newScene(){
  const sc=BLOW_SCENES[dd.si];
  Object.assign(dd,{done:false,nudged:false,prevT:dd.blowT,moved:0,saidPop:false,lean:0,power:0});
  if(sc==='dand'){dd.n=44;dd.left=[...Array(dd.n).keys()].sort(()=>Math.random()-.5);dd.acc=0;dd.hy=44;let h;do{h=Math.floor(Math.random()*HIDERS.length);}while(h===dd.hider);dd.hider=h;}
  if(sc==='candle'){dd.cands=Array(dd.candles).fill(1.1);dd.alive=Array(dd.candles).fill(1);}
  if(sc==='boat'){dd.p=0;dd.bx=60;dd.wakeAcc=0;}
  if(sc==='wheel'){dd.ang=0;dd.vel=0;dd.rot=0;}
  if(sc==='bubbles'){dd.popped=0;dd.spawn=0;}
  render();
}
function scenePrompt(){
  if(state.mode!=='dandelion')return;
  const sc=BLOW_SCENES[dd.si];
  say({dand:'Подуй на одуванчик!',candle:dd.candles>1?'Задуй свечки!':'Задуй свечку!',boat:'Подуй на кораблик!',wheel:'Подуй на вертушку!',bubbles:'Подуй, и будут пузыри!'}[sc]);
}
function nextScene(){if(!dd)return;clearTimeout(dd.timer);dd.si=(dd.si+1)%BLOW_SCENES.length;newScene();setTimeout(scenePrompt,500);}

/* --- shared scenery: sky, sun, drifting clouds, hills, swaying grass --- */
function skyDefs(){return `<linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD3FF"/><stop offset=".75" stop-color="#E6F4FF"/></linearGradient>
  <radialGradient id="gSun"><stop offset="0" stop-color="#FFF8CF"/><stop offset=".5" stop-color="#FFE380"/><stop offset="1" stop-color="#FFE380" stop-opacity="0"/></radialGradient>`;}
function cloud(x,y,sc,dur,delay){return `<g class="cloud" style="animation-duration:${dur}s;animation-delay:-${delay}s"><g transform="translate(${x} ${y}) scale(${sc})" fill="#fff" opacity=".92"><ellipse cx="0" cy="8" rx="22" ry="9"/><circle cx="-8" cy="2" r="9"/><circle cx="6" cy="-1" r="12"/><circle cx="17" cy="5" r="7"/></g></g>`;}
function skyBack(){
  return `<rect x="-400" y="-400" width="1120" height="900" fill="url(#gSky)"/>
  <g class="rays" opacity=".5">${Array.from({length:10},(_,k)=>`<rect x="51" y="2" width="2" height="12" rx="1" fill="#FFE380" transform="rotate(${k*36} 52 34)"/>`).join('')}</g>
  <circle cx="52" cy="34" r="30" fill="url(#gSun)"/><circle cx="52" cy="34" r="12" fill="#FFE57F"/>
  ${cloud(0,40,1,70,10)}${cloud(0,24,.7,90,55)}${cloud(0,56,.55,80,35)}`;
}
function meadow(eve){
  const C=eve?{h1:'#9CC3A8',h2:'#7DB08B',g1:'#6FA67C',g2:'#5E9469',fl:['#E8A7C0','#E9D08A','#E8A7C0','#B9AEE6','#F2F2F2','#E9D08A']}
             :{h1:'#C5EAB4',h2:'#A2DB8A',g1:'#78C460',g2:'#64B24E',fl:['#FF8FB1','#FFD25A','#FF8FB1','#B9A6FF','#FFFFFF','#FFD25A']};
  let g='';for(let i=0;i<46;i++){const x=-60+i*10+((i*37)%7),h=10+((i*13)%9);
    g+=`<path class="blade" style="transform-origin:${x}px 204px;animation-delay:-${((i*0.37)%3).toFixed(2)}s" d="M${x} 204Q${x+3} ${204-h/2} ${x+1} ${204-h}" fill="none" stroke="${i%3?C.g1:C.g2}" stroke-width="2.4" stroke-linecap="round"/>`;}
  let f='';[[30,176],[78,186],[262,180],[292,190],[118,192],[206,190]].forEach(([x,y],j)=>{const c=C.fl[j];
    f+=`<g>${[0,72,144,216,288].map(a=>`<circle cx="${(x+3*Math.sin(a*Math.PI/180)).toFixed(1)}" cy="${(y-3*Math.cos(a*Math.PI/180)).toFixed(1)}" r="2.2" fill="${c}"/>`).join('')}<circle cx="${x}" cy="${y}" r="1.6" fill="#F2B640"/></g>`;});
  return `<path d="M-400 150Q10 122 120 140T330 130T720 142V600H-400Z" fill="${C.h1}"/>
  <path d="M-400 168Q60 152 160 164T420 158T720 164V600H-400Z" fill="${C.h2}"/>${f}${g}`;
}

/* --- 1. dandelion --- */
function dandSVG(){
  let seeds='';
  for(let i=0;i<dd.n;i++){
    const a=i/dd.n*360+(i%2?4:0),len=i%3===0?29:34,ar=a*Math.PI/180;
    const tx=(150+len*Math.sin(ar)).toFixed(1),ty=(78-len*Math.cos(ar)).toFixed(1);
    let fluff='';for(let k=-3;k<=3;k++){const r=k*17*Math.PI/180;fluff+=`<line x1="150" y1="${78-len}" x2="${(150+7*Math.sin(r)).toFixed(1)}" y2="${(78-len-7*Math.cos(r)).toFixed(1)}"/>`;}
    seeds+=`<g class="sw" id="sw${i}" style="transform-origin:${tx}px ${ty}px"><g transform="rotate(${a.toFixed(1)} 150 78)"><line x1="150" y1="78" x2="150" y2="${78-len}" stroke-opacity=".85"/>${fluff}<circle cx="150" cy="${78-len}" r="1.2" fill="#B9A77A" stroke="none"/></g></g>`;
  }
  const H=HIDERS[dd.hider];
  return `<svg class="bfull" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs>${skyDefs()}<radialGradient id="gHalo"><stop offset="0" stop-color="#7F95B8" stop-opacity=".28"/><stop offset="1" stop-color="#7F95B8" stop-opacity="0"/></radialGradient>
      <linearGradient id="gStem" x1="0" x2="1"><stop offset="0" stop-color="#4E9B3A"/><stop offset="1" stop-color="#7CC860"/></linearGradient>
      <clipPath id="hclip"><rect x="190" y="110" width="80" height="78"/></clipPath></defs>
    ${skyBack()}${meadow()}
    <g clip-path="url(#hclip)"><g id="hider" transform="translate(0 44)"><g id="hiderIn">${svgImg(H[0],228,160,46)}</g></g></g>
    <ellipse cx="228" cy="186" rx="36" ry="15" fill="#86CF6C"/><ellipse cx="228" cy="181" rx="29" ry="7" fill="#98DA7D"/>
    <path d="M150 198Q144 186 132 180Q144 178 150 190Z" fill="#6CBF55"/><path d="M151 196Q160 178 174 172Q164 186 151 199Z" fill="#5DB048"/>
    <g id="dhead">
      <path d="M150 198Q157 146 150 84" fill="none" stroke="url(#gStem)" stroke-width="3.4" stroke-linecap="round"/>
      <circle cx="150" cy="78" r="40" fill="url(#gHalo)"/>
      <g stroke="#ffffff" stroke-width="1" stroke-linecap="round" fill="none">${seeds}</g>
      <circle cx="150" cy="78" r="6.5" fill="#C9B37E"/><circle cx="150" cy="78" r="3.6" fill="#AF9660"/>
    </g>
  </svg>`;
}
function flySeed(el){
  const dx=110+Math.random()*190,dy=-(40+Math.random()*120),r=Math.random()*240-120,w=6+Math.random()*10,dur=3800+Math.random()*2200;
  el.animate([
    {transform:'translate(0px,0px) rotate(0deg)',opacity:1},
    {transform:`translate(${dx*.22}px,${dy*.15-w}px) rotate(${r*.2}deg)`,opacity:1,offset:.22},
    {transform:`translate(${dx*.48}px,${dy*.45+w}px) rotate(${r*.5}deg)`,opacity:1,offset:.48},
    {transform:`translate(${dx*.75}px,${dy*.75-w}px) rotate(${r*.78}deg)`,opacity:.75,offset:.75},
    {transform:`translate(${dx}px,${dy}px) rotate(${r}deg)`,opacity:0}
  ],{duration:dur,easing:'cubic-bezier(.25,.55,.4,1)',fill:'forwards'});
}

/* --- 2. candles --- */
function candleSVG(){
  const c=dd.cands.length;let cs='';
  for(let k=0;k<c;k++){
    const x=160+(k-(c-1)/2)*26,col=[['#5B8DEF','#3E63DD'],['#4CC38A','#2E9E68'],['#FF9A4D','#F76B15']][k%3];
    cs+=`<rect x="${x-4.5}" y="58" width="9" height="26" rx="3" fill="${col[0]}"/><rect x="${x+1.5}" y="58" width="3" height="26" rx="1.5" fill="${col[1]}" opacity=".6"/>
      <path d="M${x-4.5} 66L${x+4.5} 62M${x-4.5} 75L${x+4.5} 71" stroke="#fff" stroke-width="1.8" opacity=".75"/>
      <line x1="${x}" y1="58" x2="${x}" y2="53" stroke="#3A3A44" stroke-width="1.4" stroke-linecap="round"/>
      <path class="smoke2" id="sm${k}" style="transform-origin:${x}px 50px" d="M${x} 50Q${x-6} 42 ${x} 35Q${x+6} 28 ${x} 21" fill="none" stroke="#C3C7D2" stroke-width="2.6" stroke-linecap="round"/>
      <g id="fl${k}" transform="translate(${x} 53)"><circle cx="0" cy="-10" r="15" fill="url(#gFG)"/><path d="M0 -24Q9 -9 0 0Q-9 -9 0 -24Z" fill="url(#gFlame)"/><path d="M0 -13Q4 -6 0 -1Q-4 -6 0 -13Z" fill="#FFFBE6"/></g>`;
  }
  return `<svg class="bfull" id="csvg" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs><linearGradient id="gWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3E4"/><stop offset="1" stop-color="#FFE3CC"/></linearGradient>
      <radialGradient id="gRoom" cx="50%" cy="35%" r="60%"><stop offset="0" stop-color="#FFD98A" stop-opacity=".75"/><stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></radialGradient>
      <radialGradient id="gFG"><stop offset="0" stop-color="#FFE9A8" stop-opacity=".9"/><stop offset="1" stop-color="#FFC24D" stop-opacity="0"/></radialGradient>
      <radialGradient id="gFlame" cx="50%" cy="70%" r="70%"><stop offset="0" stop-color="#FFF6C8"/><stop offset=".45" stop-color="#FFC233"/><stop offset="1" stop-color="#FF7A1A"/></radialGradient>
      <linearGradient id="gCB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F9BCD0"/><stop offset="1" stop-color="#EE8FAE"/></linearGradient>
      <linearGradient id="gCT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE8EF"/><stop offset="1" stop-color="#FFC6D8"/></linearGradient></defs>
    <rect x="-400" y="-400" width="1120" height="900" fill="url(#gWall)"/>
    ${[40,80,120,160,200,240,280].map((x,i)=>`<path d="M${x-20} ${18+(i%2)*2}Q${x} ${30+(i%2)*2} ${x+20} ${18+(i%2)*2}" fill="none" stroke="#E9C9B0" stroke-width="1"/><path d="M${x-6} ${24}L${x} ${36}L${x+6} ${24}Z" fill="${['#FF8FB1','#FFD25A','#8FC8FF','#9FE0A0'][i%4]}"/>`).join('')}
    <ellipse id="cglow" cx="160" cy="70" rx="150" ry="110" fill="url(#gRoom)"/>
    <path d="M-400 150H720V600H-400Z" fill="#E8C7A6"/><path d="M-400 140H720V156H-400Z" fill="#FFFFFF"/>
    <path d="M-400 156${Array.from({length:60},(_,i)=>`Q${-390+i*20} 164 ${-380+i*20} 156`).join('')}" fill="#8FC8FF"/>
    <ellipse cx="160" cy="152" rx="80" ry="9" fill="#fff" stroke="#E3E8F2"/>
    <rect x="98" y="108" width="124" height="44" rx="12" fill="url(#gCB)"/>
    <path d="M98 118${Array.from({length:8},(_,i)=>`Q${105+i*15.5} ${i%2?132:126} ${113.5+i*15.5} 118`).join('')}V112H98Z" fill="#fff"/>
    <rect x="116" y="82" width="88" height="30" rx="10" fill="url(#gCT)"/>
    <path d="M116 90${Array.from({length:6},(_,i)=>`Q${123+i*14.7} ${i%2?100:96} ${130.7+i*14.7} 90`).join('')}V86H116Z" fill="#fff"/>
    ${[[110,140,'#E5484D'],[136,146,'#FFC53D'],[160,138,'#3E63DD'],[186,146,'#30A46C'],[210,140,'#E5484D']].map(([x,y,c])=>`<circle cx="${x}" cy="${y}" r="3" fill="${c}"/>`).join('')}
    ${cs}
  </svg>`;
}

/* --- 3. boat --- */
function waveP(y,amp){let d=`M-400 ${y}`;for(let x=-400;x<760;x+=40)d+=`Q${x+10} ${y-amp} ${x+20} ${y}T${x+40} ${y}`;return d+'V600H-400Z';}
function boatSVG(){
  return `<svg class="bfull" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs>${skyDefs()}</defs>${skyBack()}
    ${svgImg('🏝',270,108,96)}
    <g class="wv" style="animation-duration:7s"><path d="${waveP(132,5)}" fill="#9AD8F8"/></g>
    <g id="wake"></g>
    <g id="boat" transform="translate(60 0)">${svgImg('⛵',0,114,72)}</g>
    <g class="wv" style="animation-duration:5s;animation-direction:reverse"><path d="${waveP(146,5)}" fill="#6BC0EC" opacity=".95"/></g>
    <g class="wv" style="animation-duration:4s"><path d="${waveP(162,6)}" fill="#47A3DE"/></g>
  </svg>`;
}
/* --- 4. pinwheel --- */
function wheelSVG(){
  const cols=[['#FF8A8F','#E5484D'],['#FFE08A','#F5A524'],['#8FB4FF','#3E63DD'],['#8FE0B0','#2E9E68']];
  return `<svg class="bfull" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs>${skyDefs()}${cols.map((c,k)=>`<linearGradient id="gB${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient>`).join('')}
      <linearGradient id="gStick" x1="0" x2="1"><stop offset="0" stop-color="#C98F5E"/><stop offset="1" stop-color="#9C6A3F"/></linearGradient></defs>
    ${skyBack()}${meadow()}
    <g id="wstick"><rect x="157" y="88" width="6" height="114" rx="3" fill="url(#gStick)"/>
    <circle id="wblur" cx="160" cy="88" r="47" fill="#fff" opacity="0"/>
    <g id="wheel">${cols.map((c,k)=>`<path transform="rotate(${k*90} 160 88)" d="M160 88L160 41Q190 44 200 72Z" fill="url(#gB${k})" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>`).join('')}
    <circle cx="160" cy="88" r="6" fill="#fff" stroke="#D3D8E2" stroke-width="1.6"/></g></g>
  </svg>`;
}
/* --- 5. bubbles --- */
/* evening meadow: calm lilac sky, soft moon, twinkling stars */
function bubblesSVG(){
  const stars=[[24,20],[70,12],[110,30],[190,14],[236,32],[284,18],[300,44],[150,10],[40,52],[262,58]];
  return `<svg class="bfull" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs><linearGradient id="gEve" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6F78C4"/><stop offset=".55" stop-color="#A99ADA"/><stop offset=".85" stop-color="#E9C6DA"/></linearGradient>
      <radialGradient id="gMoon"><stop offset="0" stop-color="#FFF6D6" stop-opacity=".9"/><stop offset="1" stop-color="#FFF6D6" stop-opacity="0"/></radialGradient></defs>
    <rect x="-400" y="-400" width="1120" height="900" fill="url(#gEve)"/>
    ${stars.map(([x,y],k)=>`<circle class="tw" style="animation-delay:-${(k*.7).toFixed(1)}s" cx="${x}" cy="${y}" r="${k%3?1:1.5}" fill="#FFF8E1"/>`).join('')}
    <circle cx="268" cy="34" r="26" fill="url(#gMoon)"/><circle cx="268" cy="34" r="11" fill="#FFF3C9"/><circle cx="264" cy="31" r="2" fill="#F1E3B0"/><circle cx="271" cy="38" r="1.4" fill="#F1E3B0"/>
    ${meadow(true)}
    <path d="M44 204L66 154" stroke="#E57AA0" stroke-width="6" stroke-linecap="round"/>
    <circle id="wand" cx="70" cy="144" r="12" fill="rgba(255,255,255,.3)" stroke="#E57AA0" stroke-width="4"/>
  </svg>`;
}
function dandHTML(){
  const sc=BLOW_SCENES[dd.si];
  const inner={dand:dandSVG,candle:candleSVG,boat:boatSVG,wheel:wheelSVG,bubbles:bubblesSVG}[sc]();
  return `<header class="bar">${holdBack()}<div class="title">${SCENE_TITLE[sc]}</div><button class="ctl" data-act="newdand" aria-label="Другая сценка">${em('➡️')}</button></header>
  <div class="q" id="dq">${sc==='bubbles'?'Подуй и лопай!':'Подуй!'}</div>
  <main class="stage" id="stage" style="touch-action:none"><div class="bcard" id="bscene">${inner}</div></main>
  <p class="hintline" id="dhint">${dd.noMic?NO_MIC_HINT:'Подуйте вместе: длинно, «ф-ф-ф». Пальчиком по экрану тоже можно.'}</p>
  <div class="vubar"><div class="vu" id="vu">${em('🎤')}</div></div>`;
}
function wireDand(){
  const st=document.getElementById('stage');if(!st)return;let last=null;
  st.addEventListener('pointerdown',e=>{
    dd.lastTouch=performance.now();
    const bub=e.target.closest('.bub2');if(bub){popBubble(bub);return;}
    last=[e.clientX,e.clientY];st.setPointerCapture(e.pointerId);
  });
  st.addEventListener('pointermove',e=>{if(!last)return;dd.lastTouch=performance.now();if(BLOW_SCENES[dd.si]==='bubbles'&&!dd.noMic){last=[e.clientX,e.clientY];return;}const d=Math.hypot(e.clientX-last[0],e.clientY-last[1]);dd.blowT+=d*.0016;dd.lastBlow=performance.now();last=[e.clientX,e.clientY];});
  const up=()=>{last=null;};st.addEventListener('pointerup',up);st.addEventListener('pointercancel',up);
}
/* friends that can hide inside a bubble, and how each leaves when freed */
const BFRIENDS=[['🐞','Божья коровка','fall'],['🐟','Рыбка','swim'],['🐥','Цыплёнок','fall'],['⭐','Звёздочка','up'],['🌸','Цветочек','drift'],['🐸','Лягушка','hop']];
const MELODY=[0,2,4,7,9,7,4,2,0,4,7,12,9,7,4,7];
let melodyI=0,lastFriendSay=0;
function bell(f,v){
  const c=AC();if(!c)return;const t=c.currentTime+.01,out=c.createGain();out.gain.value=v*vol();out.connect(c.destination);
  [[1,1],[2,.28],[3,.08]].forEach(([m,a])=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=f*m;
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(a*.2,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+1.4/m);o.connect(g);g.connect(out);o.start(t);o.stop(t+1.5);});
}
function spawnBubble(o){
  o=o||{};
  const box=document.getElementById('bscene'),wand=document.getElementById('wand');if(!box||!wand)return;
  if(!o.x0&&box.querySelectorAll('.bub2:not(.pop)').length>=12)return;
  const br=box.getBoundingClientRect(),W=br.width,H=br.height;
  let x0=o.x0,y0=o.y0;if(x0===undefined){const wr=wand.getBoundingClientRect();x0=wr.left+wr.width/2-br.left;y0=wr.top+wr.height/2-br.top;}
  const big=o.big!==undefined?o.big:(!o.x0&&Math.random()<1/6);
  const sz=Math.round(o.sz||W*(big?.15:.06+Math.random()*.05));
  const friend=!big&&!o.small&&Math.random()<.4?BFRIENDS[Math.floor(Math.random()*BFRIENDS.length)]:null;
  const land=!big&&!o.small&&Math.random()<.35;
  const b=document.createElement('div');b.className='bub2';b.style.width=b.style.height=sz+'px';
  b.innerHTML='<i></i>'+(friend?`<span class="bfr" style="font-size:${Math.round(sz*.48)}px">${em(friend[0])}</span>`:'');
  b._friend=friend;b._big=big;box.appendChild(b);
  let dx,dy;
  if(o.small){dx=(Math.random()-.5)*W*.4;dy=-(H*(.25+Math.random()*.3));}
  else if(land){dx=W*(.15+Math.random()*.7)-x0;dy=H*.86-y0;}
  else{dx=W*(.25+Math.random()*.45);dy=-(H*(.5+Math.random()*.35));}
  const sw=W*(big?.03:.05),pts=[];
  for(let k=0;k<=6;k++){const f=k/6;pts.push({transform:`translate(${(x0-sz/2+dx*f+(k%2?sw:-sw)*(k?1:0)).toFixed(1)}px,${(y0-sz/2+dy*f).toFixed(1)}px)${k===0?` scale(${o.small?.5:.3})`:k===1?' scale(1)':''}`,opacity:(k===6&&!land)?0:1});}
  const an=b.animate(pts,{duration:(big?11000:7000)+Math.random()*3500,easing:land?'ease-in-out':'linear',fill:'forwards'});
  b._an=an;an.onfinish=()=>{if(land&&!b.classList.contains('pop'))popBubble(b,true);else b.remove();};
  if(!dd.saidPop&&!o.small){dd.saidPop=true;setTimeout(()=>{if(state.mode==='dandelion'&&!dd.done)say('Лопай пузыри!');},1200);}
}
function releaseFriend(fr,cx,cy,box){
  const el=document.createElement('div');el.className='freed';el.style.fontSize=Math.round(box.clientWidth*.05)+'px';el.innerHTML=em(fr[0]);box.appendChild(el);
  const H=box.clientHeight,W=box.clientWidth,s0=`translate(${cx}px,${cy}px) translate(-50%,-50%)`;let kf;
  if(fr[2]==='fall')kf=[{transform:s0+' scale(.6)'},{transform:`translate(${cx+W*.03}px,${cy+(H*.85-cy)*.5}px) translate(-50%,-50%) rotate(-10deg)`,offset:.5},{transform:`translate(${cx-W*.02}px,${H*.85}px) translate(-50%,-50%) rotate(8deg)`,opacity:1,offset:.85},{transform:`translate(${cx-W*.02}px,${H*.85}px) translate(-50%,-50%)`,opacity:0}];
  else if(fr[2]==='swim')kf=[{transform:s0+' scale(.6)'},{transform:`translate(${cx-W*.15}px,${cy+H*.04}px) translate(-50%,-50%)`,offset:.4},{transform:`translate(${cx-W*.4}px,${cy-H*.03}px) translate(-50%,-50%)`,opacity:0}];
  else if(fr[2]==='up')kf=[{transform:s0+' scale(.6)'},{transform:`translate(${cx}px,${cy-H*.15}px) translate(-50%,-50%) scale(1.2) rotate(40deg)`,offset:.5},{transform:`translate(${cx}px,${cy-H*.35}px) translate(-50%,-50%) scale(.6) rotate(90deg)`,opacity:0}];
  else if(fr[2]==='hop')kf=[{transform:s0+' scale(.6)'},{transform:`translate(${cx+W*.05}px,${cy-H*.08}px) translate(-50%,-50%)`,offset:.25},{transform:`translate(${cx+W*.1}px,${H*.85}px) translate(-50%,-50%)`,offset:.55},{transform:`translate(${cx+W*.15}px,${H*.78}px) translate(-50%,-50%)`,offset:.75},{transform:`translate(${cx+W*.2}px,${H*.86}px) translate(-50%,-50%)`,opacity:0}];
  else kf=[{transform:s0+' scale(.6)'},{transform:`translate(${cx+W*.06}px,${cy+(H*.85-cy)*.5}px) translate(-50%,-50%) rotate(120deg)`,offset:.5},{transform:`translate(${cx-W*.02}px,${H*.85}px) translate(-50%,-50%) rotate(240deg)`,opacity:0}];
  el.animate(kf,{duration:2600,easing:'ease-in-out',fill:'forwards'}).onfinish=()=>el.remove();
  if(Date.now()-lastFriendSay>1500&&!(synth&&synth.speaking)){lastFriendSay=Date.now();setTimeout(()=>say(fr[1]+'!'),250);}
}
function popBubble(b,auto){
  if(b.classList.contains('pop'))return;
  try{b._an.pause();}catch(e){}
  b.classList.add('pop');
  talkUntil=Math.max(talkUntil,Date.now()+700);
  const n=MELODY[melodyI%MELODY.length];if(!auto)melodyI++;
  bell(523.25*Math.pow(2,n/12),auto?.35:1);
  const box=document.getElementById('bscene');if(!box)return;
  const br=box.getBoundingClientRect(),r=b.getBoundingClientRect(),cx=r.left+r.width/2-br.left,cy=r.top+r.height/2-br.top;
  for(let k=0;k<8;k++){const d=document.createElement('div');d.className='drop';d.style.left=cx+'px';d.style.top=cy+'px';box.appendChild(d);
    const a=k/8*Math.PI*2,R=r.width*.75;d.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${(Math.cos(a)*R).toFixed(1)}px,${(Math.sin(a)*R).toFixed(1)}px) scale(.4)`,opacity:0}],{duration:420,easing:'ease-out',fill:'forwards'}).onfinish=()=>d.remove();}
  if(b._friend)releaseFriend(b._friend,cx,cy,box);
  if(b._big)for(let k=0;k<3;k++)setTimeout(()=>spawnBubble({x0:cx,y0:cy,sz:r.width*.38,small:true,big:false}),k*60);
  setTimeout(()=>b.remove(),260);
  if(!auto){dd.popped++;if(dd.popped>=10&&!dd.done)sceneDone('bubbles');}
}
function sceneUpdate(sc,dtB,blowing,fdt,t){
  dd.lean=lerp(dd.lean,blowing?1:0,fdt*(blowing?4:2));
  if(sc==='dand'){
    const head=document.getElementById('dhead');
    if(head)head.setAttribute('transform',`rotate(${(dd.lean*7+Math.sin(t*5)*dd.lean*1.6+Math.sin(t*1.3)*.8).toFixed(2)} 150 198)`);
    if(!dd.done){
      dd.acc+=dtB*15;
      while(dd.acc>=1&&dd.left.length){dd.acc-=1;const el=document.getElementById('sw'+dd.left.pop());if(el)flySeed(el);}
    }
    dd.hy=lerp(dd.hy,44*dd.left.length/dd.n,fdt*3);
    const h=document.getElementById('hider');if(h)h.setAttribute('transform',`translate(0 ${dd.hy.toFixed(2)})`);
    if(!dd.left.length&&!dd.done)sceneDone('dand');
  }else if(sc==='candle'){
    if(!dd.done){const i=dd.cands.findIndex(v=>v>0);
      if(i>=0&&dtB>0){dd.cands[i]-=dtB;if(dd.cands[i]<=0){const sm=document.getElementById('sm'+i);if(sm)sm.classList.add('on');bloopAt(330);}}}
    let lit=0;
    dd.cands.forEach((v,k)=>{
      dd.alive[k]=lerp(dd.alive[k],v>0?1:0,fdt*6);lit+=dd.alive[k];
      const f=document.getElementById('fl'+k);if(!f)return;const x=160+(k-(dd.cands.length-1)/2)*26;
      const fl=1+.07*Math.sin(t*13+k*2)+.04*Math.sin(t*23+k),L=v>0?dd.lean:0,A=dd.alive[k];
      f.setAttribute('transform',`translate(${x} 53) skewX(${(-L*26+Math.sin(t*9+k)*L*6).toFixed(2)}) scale(${((1-L*.12)*fl*A).toFixed(3)} ${((1-L*.3)*fl*A).toFixed(3)})`);
    });
    const g=document.getElementById('cglow');if(g)g.setAttribute('opacity',(lit/dd.cands.length*(.85+.15*Math.sin(t*11))).toFixed(3));
    if(!dd.done&&dd.cands.every(v=>v<=0))sceneDone('candle');
  }else if(sc==='boat'){
    if(!dd.done)dd.p=Math.min(1,dd.p+dtB/3.5);
    const target=60+dd.p*172,prev=dd.bx;dd.bx=lerp(dd.bx,target,fdt*2.5);const speed=(dd.bx-prev)/Math.max(fdt,.001);
    const b=document.getElementById('boat');
    if(b)b.setAttribute('transform',`translate(${dd.bx.toFixed(2)} ${(Math.sin(t*2.2)*2).toFixed(2)}) rotate(${(Math.sin(t*1.7)*3-Math.min(6,speed*.25)).toFixed(2)} 0 140)`);
    dd.wakeAcc+=Math.abs(speed)*fdt;
    if(dd.wakeAcc>5){dd.wakeAcc=0;const w=document.getElementById('wake');if(w){const e=document.createElementNS('http://www.w3.org/2000/svg','ellipse');
      e.setAttribute('cx',(dd.bx-20).toFixed(1));e.setAttribute('cy','140');e.setAttribute('rx','4');e.setAttribute('ry','1.6');e.setAttribute('fill','#fff');
      e.style.transformOrigin=`${(dd.bx-20).toFixed(1)}px 140px`;w.appendChild(e);
      e.animate([{transform:'scale(1)',opacity:.85},{transform:'scale(3.2,1.6)',opacity:0}],{duration:1600,easing:'ease-out',fill:'forwards'}).onfinish=()=>e.remove();}}
    if(dd.p>=1&&!dd.done&&Math.abs(dd.bx-target)<2)sceneDone('boat');
  }else if(sc==='wheel'){
    dd.vel=Math.min(1000,dd.vel+dtB*1700);dd.vel*=Math.pow(.45,fdt);dd.ang=(dd.ang+dd.vel*fdt)%360;dd.rot+=dd.vel*fdt;
    const w=document.getElementById('wheel'),bl=document.getElementById('wblur'),st=document.getElementById('wstick');
    if(w)w.setAttribute('transform',`rotate(${dd.ang.toFixed(1)} 160 88)`);
    if(bl)bl.setAttribute('opacity',Math.min(.32,dd.vel/1000*.4).toFixed(3));
    if(st)st.setAttribute('transform',`rotate(${(dd.lean*3).toFixed(2)} 160 200)`);
    if(dd.rot>=1800&&!dd.done)sceneDone('wheel');
  }else if(sc==='bubbles'){
    if(!dd.done){dd.spawn+=dtB;while(dd.spawn>=.3){dd.spawn-=.3;spawnBubble();}}
    const wd=document.getElementById('wand');if(wd)wd.setAttribute('r',(12+dd.lean*1.5).toFixed(2));
  }
}
function sceneDone(sc){
  if(dd.done)return;dd.done=true;softChime();
  const later=(fn,ms)=>{dd.timer=setTimeout(()=>{if(state.mode==='dandelion')fn();},ms);};
  if(sc==='dand'){
    const h=document.getElementById('hiderIn');if(h)h.classList.add('hidehop');
    later(()=>{say('Кто там?');later(()=>{say(HIDERS[dd.hider][1]+'!');later(nextScene,3400);},2600);},1000);
    return;
  }
  const msg={candle:dd.cands.length>1?'Свечки погасли! Молодец!':'Свечка погасла! Молодец!',boat:'Приплыли! Молодец!',wheel:'Как крутится! Молодец!',bubbles:'Молодец!'}[sc];
  if(sc==='candle')dd.candles=dd.candles%3+1;
  later(()=>{say(msg);later(nextScene,3800);},800);
}
function dandLoop(){
  if(state.mode!=='dandelion'||!dd)return;
  const now=performance.now(),fdt=Math.min(.1,(now-(dd.lastFrame||now))/1000);dd.lastFrame=now;
  const dtB=dd.blowT-dd.prevT;dd.prevT=dd.blowT;const blowing=now-dd.lastBlow<300;
  const vu=document.getElementById('vu');if(vu&&mic)vu.style.setProperty('--lv',Math.min(1,mic.voice?mic.level*14:0).toFixed(2));
  const sc=BLOW_SCENES[dd.si];
  sceneUpdate(sc,dd.done?0:dtB,blowing&&!dd.done,fdt,now/1000);
  if(dtB>0)dd.moved+=dtB;
  if(!dd.done&&!dd.nudged&&dd.moved>0&&now-dd.lastBlow>7000&&sc!=='bubbles'){dd.nudged=true;say('Подуй ещё!');}
  dd.raf=requestAnimationFrame(dandLoop);
}
