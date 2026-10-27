/* ---------- drawing: trace the dotted line ---------- */
function circlePts(cx,cy,r,n=56){const p=[];for(let i=0;i<=n;i++){const a=-Math.PI/2+i/n*Math.PI*2;p.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);}return p;}
function wavePts(x0,x1,y,amp,per,n=70){const p=[];for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n;p.push([x,y+amp*Math.sin(i/n*per*Math.PI*2)]);}return p;}
const TRACES=[
  {w:'Мячик',reward:'⚽',strokes:[circlePts(50,50,30)]},
  {w:'Дождик',reward:'🌧️',deco:[['☁️',50,22,30]],strokes:[[[28,44],[28,84]],[[44,44],[44,84]],[[60,44],[60,84]],[[76,44],[76,84]]]},
  {w:'Дорожка',reward:'🏠',deco:[['🚗',12,50,15],['🏠',88,50,15]],strokes:[wavePts(20,80,50,14,1.5)]},
  {w:'Солнышко',reward:'☀️',strokes:[circlePts(50,50,16,40),...Array.from({length:8},(_,k)=>{const a=k/8*Math.PI*2;return [[50+24*Math.cos(a),50+24*Math.sin(a)],[50+38*Math.cos(a),50+38*Math.sin(a)]];})]},
  {w:'Травка',reward:'🌱',strokes:[[[14,80],[24,45],[34,80],[44,45],[54,80],[64,45],[74,80],[84,45]]]},
  {w:'Домик',reward:'🏠',strokes:[[[26,52],[26,84],[74,84],[74,52]],[[18,54],[50,20],[82,54]]]},
  {w:'Змейка',reward:'🐍',deco:[['🐍',86,40,14]],strokes:[wavePts(12,76,55,18,2)]}
];
const PALETTE=['#FF5A5F','#3B82F6','#22A45D','#F59E0B','#A855F7','#EC4899'];
let tr=null; /* current trace session */
function resample(stroke,step=2,si=0){
  const out=[];for(let i=1;i<stroke.length;i++){const [x0,y0]=stroke[i-1],[x1,y1]=stroke[i];const len=Math.hypot(x1-x0,y1-y0);const n=Math.max(1,Math.round(len/step));for(let k=0;k<n;k++)out.push({x:x0+(x1-x0)*k/n,y:y0+(y1-y0)*k/n,hit:false,si});}
  const last=stroke[stroke.length-1];out.push({x:last[0],y:last[1],hit:false,si});return out;
}
function startDraw(){state.mode='draw';state.trace=-1;nextTrace();}
function nextTrace(){
  state.trace=(state.trace+1)%TRACES.length;
  const t=TRACES[state.trace];
  stopHand();
  tr={t,targets:t.strokes.flatMap((s,si)=>resample(s,2,si)),lines:[],cur:null,done:false,color:0,hand:null,on:0,off:0};
  render();
  setTimeout(()=>speakSeq([t.w+'!','Веди пальчиком!']),300);
  setTimeout(()=>{if(state.mode==='draw')startHand();},700);
}
function drawHTML(){
  const t=TRACES[state.trace];
  const pts=s=>s.map(p=>p.join(',')).join(' ');
  const svg=`<svg viewBox="0 0 100 100" aria-hidden="true">
    ${t.strokes.map(s=>`<polyline points="${pts(s)}" fill="none" stroke="var(--soft)" stroke-opacity=".5" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray=".1 5.5"/>`).join('')}
    ${t.strokes.map(s=>`<circle cx="${s[0][0]}" cy="${s[0][1]}" r="3.4" fill="#22A45D"><animate attributeName="r" values="3.4;5.2;3.4" dur="1.3s" repeatCount="indefinite"/></circle>`).join('')}
    ${(t.deco||[]).map(([e,x,y,sz])=>{const u=IMG[e.replace(/\uFE0F/g,'')];return u?`<image href="${u}" x="${x-sz/2}" y="${y-sz/2}" width="${sz}" height="${sz}"/>`:`<text x="${x}" y="${y}" font-size="${sz}" text-anchor="middle" dominant-baseline="central">${e}</text>`;}).join('')}
  </svg>`;
  return `<header class="bar">${holdBack()}<div class="title">${esc(t.w)}</div>
    <button class="ctl" data-act="erase" aria-label="Стереть">${em('🧽')}</button><button class="ctl" data-act="nexttrace" aria-label="Следующая картинка">${em('➡️')}</button></header>
  <main class="stage" id="stage"><div class="board" id="board">${svg}<canvas id="cv"></canvas></div></main>`;
}
function fitBoard(){
  const st=document.getElementById('stage'),b=document.getElementById('board'),cv=document.getElementById('cv');
  if(!st||!b||!cv)return;
  const size=Math.floor(Math.min(st.clientWidth,st.clientHeight,760));
  b.style.setProperty('--b',size+'px');
  const dpr=window.devicePixelRatio||1;cv.width=size*dpr;cv.height=size*dpr;
  redrawLines();
}
const ACC={easy:{r:9,ratio:.3},mid:{r:7,ratio:.5},hard:{r:5.5,ratio:.68}};
const accKey=()=>['easy','mid','hard'][lv('draw')-1];
function redrawLines(){
  const cv=document.getElementById('cv');if(!cv||!tr)return;
  const g=cv.getContext('2d'),k=cv.width/100;
  g.clearRect(0,0,cv.width,cv.height);g.lineCap='round';g.lineJoin='round';g.lineWidth=4.2*k;
  for(const ln of tr.lines){
    const P=ln.pts;if(!P.length)continue;g.strokeStyle=ln.c;g.fillStyle=ln.c;
    if(P.length===1){g.globalAlpha=P[0][2]?1:.18;g.beginPath();g.arc(P[0][0]*k,P[0][1]*k,2.1*k,0,7);g.fill();continue;}
    for(let i=1;i<P.length;i++){g.globalAlpha=(P[i][2]&&P[i-1][2])?1:.18;g.beginPath();g.moveTo(P[i-1][0]*k,P[i-1][1]*k);g.lineTo(P[i][0]*k,P[i][1]*k);g.stroke();}
  }
  g.globalAlpha=1;
}
function wireCanvas(){
  const cv=document.getElementById('cv');if(!cv)return;
  const pos=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100];};
  const mark=(x,y)=>{const r=ACC[accKey()].r;let near=false;for(const p of tr.targets){if(Math.hypot(p.x-x,p.y-y)<r){near=true;p.hit=true;}}return near;};
  cv.addEventListener('pointerdown',e=>{if(tr.done)return;e.preventDefault();stopHand();cv.setPointerCapture(e.pointerId);
    const [x,y]=pos(e);tr.cur={c:PALETTE[state.trace%PALETTE.length],pts:[[x,y,mark(x,y)]]};tr.lines.push(tr.cur);redrawLines();});
  cv.addEventListener('pointermove',e=>{if(!tr.cur)return;const [x,y]=pos(e);const l=tr.cur.pts[tr.cur.pts.length-1];
    const steps=Math.max(1,Math.ceil(Math.hypot(x-l[0],y-l[1])/1.5));let on=true;
    for(let i=1;i<=steps;i++){if(mark(l[0]+(x-l[0])*i/steps,l[1]+(y-l[1])*i/steps))tr.on++;else{tr.off++;on=false;}}
    tr.cur.pts.push([x,y,on]);redrawLines();});
  const up=()=>{if(!tr.cur)return;tr.cur=null;checkTrace();
    if(!tr.done){clearTimeout(handIdle);handIdle=setTimeout(()=>{if(state.mode==='draw'&&tr&&!tr.done&&!tr.cur)startHand();},5000);}};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
}
let handRAF=null,handIdle=null;
function stopHand(){cancelAnimationFrame(handRAF);clearTimeout(handIdle);if(tr&&tr.hand){tr.hand.remove();tr.hand=null;}}
function startHand(){
  stopHand();if(!tr||tr.done)return;
  const b=document.getElementById('board');if(!b)return;
  const cnt=tr.t.strokes.map((_,si)=>tr.targets.filter(p=>p.si===si&&!p.hit).length);
  const pts=tr.t.strokes[cnt.indexOf(Math.max(...cnt))];
  const seg=[];let L=0;for(let i=1;i<pts.length;i++){const l=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(l);L+=l;}
  const at=f=>{let d=f*L;for(let i=0;i<seg.length;i++){if(d<=seg[i]||i===seg.length-1){const k=seg[i]?Math.min(1,d/seg[i]):0;return [pts[i][0]+(pts[i+1][0]-pts[i][0])*k,pts[i][1]+(pts[i+1][1]-pts[i][1])*k];}d-=seg[i];}return pts[0];};
  const h=document.createElement('div');h.className='hand';h.innerHTML=em('👆');b.appendChild(h);tr.hand=h;
  const place=p=>{h.style.left=p[0]+'%';h.style.top=p[1]+'%';};
  place(pts[0]);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const dur=Math.max(1400,L*28),pause=800;let t0=null;
  const step=ts=>{
    if(t0===null)t0=ts;const e=(ts-t0)%(dur+pause*2);
    if(e<pause){place(pts[0]);h.style.opacity=1;}
    else if(e<pause+dur)place(at((e-pause)/dur));
    else h.style.opacity=0;
    handRAF=requestAnimationFrame(step);
  };
  handRAF=requestAnimationFrame(step);
}
function checkTrace(){
  if(tr.done)return;
  const hit=tr.targets.filter(p=>p.hit).length/tr.targets.length;
  if(hit<0.85)return;
  if(tr.on/Math.max(1,tr.on+tr.off)<ACC[accKey()].ratio){
    /* scribbled over the whole board: start again, gently */
    tr.lines=[];tr.on=0;tr.off=0;tr.targets.forEach(p=>p.hit=false);redrawLines();
    speakSeq(['Ой!','Давай по точкам.','Веди пальчиком!']);lvResult('draw',false);
    clearTimeout(handIdle);handIdle=setTimeout(()=>{if(state.mode==='draw'&&tr&&!tr.done)startHand();},1800);
    return;
  }
  tr.done=true;stopHand();
  const b=document.getElementById('board');
  const r=document.createElement('div');r.className='reward';r.innerHTML=em(tr.t.reward);b.appendChild(r);
  say(tr.t.w+'! Ура!');lvResult('draw',true);
  setTimeout(()=>{if(state.mode==='draw'&&tr&&tr.done)nextTrace();},3500);
}
addEventListener('resize',()=>{if(state.mode==='draw')fitBoard();});

/* ---------- drawing menu ---------- */
const DRAW_GAMES=[['brush','🎨','Волшебная кисть','Рисуем что хотим, линия поёт'],['stamps','🎂','Укрась','Украшаем торт, сажаем цветы, наряжаем ёлку'],['roads','🚗','Дорожки','Ведём по дороге и собираем по пути'],['draw','✏️','Обводи по точкам','Ведём пальчиком по пунктиру'],['scratch','🫧','Сотри и найди','Стираем туман: кто там спрятался?'],['paint','🖍️','Раскраска','Выбираем краску и нажимаем на картинку']];
function drawMenuHTML(){
  return `<section class="home">
    <header class="bar"><button class="back" data-act="home">← Назад</button><div class="title">Рисуем пальцем</div></header>
    <div class="lvls">${DRAW_GAMES.map(([a,i,t,ex])=>`<button class="lvl" data-act="${a}"><span class="li">${em(i)}</span><b>${t}</b><small>${ex}</small></button>`).join('')}</div>
    <div class="grown">
      <p class="tip">Линия, которая уходит от точек, получается бледной. Если ребёнок просто водит по всему экрану, картинка не засчитается: игра скажет «Давай по точкам» и покажет рукой, как надо. Точность меняется сама (уровни «Обводи по точкам» и «Дорожки» на экране «Уровни»).</p>
    </div>
  </section>`;
}
function fitPlain(){
  const st=document.getElementById('stage'),b=document.getElementById('board');if(!st||!b)return 0;
  const size=Math.floor(Math.min(st.clientWidth,st.clientHeight,760));b.style.setProperty('--b',size+'px');return size;
}

/* ---------- scratch and reveal ---------- */
let sc=null,swish=null;
function startScratch(){state.mode='scratch';sc={timer:null,item:null};nextScratch();}
function nextScratch(){
  clearTimeout(sc.timer);
  const pool=[...CATS.animals.items,...CATS.cars.items,...CATS.food.items,...CATS.toys.items,...CATS.family.items];
  sc.item=pool[bagNext('scratch'+pool.length,pool.length)];sc.done=false;sc.cells=new Set();
  render();setTimeout(()=>{if(state.mode==='scratch')say('Сотри пальчиком! Кто там?');},300);
}
function scratchHTML(){
  const it=sc.item;
  return `<header class="bar">${holdBack()}<div class="title">Кто там спрятался?</div><button class="ctl" data-act="nextscratch" aria-label="Другая картинка">${em('➡️')}</button></header>
  <main class="stage" id="stage"><div class="board scratch" id="board" style="--c:${it.c}"><div class="hidden-pic">${it.img?`<img class="ph" src="${it.img}" alt="">`:em(it.e)}</div><canvas id="cv"></canvas></div></main>`;
}
function fitScratch(){
  const size=fitPlain();const cv=document.getElementById('cv');if(!cv||!size)return;
  const dpr=window.devicePixelRatio||1;cv.width=size*dpr;cv.height=size*dpr;
  const g=cv.getContext('2d'),w=cv.width,h=cv.height;
  const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#B8C7EE');gr.addColorStop(1,'#DCC9F2');
  g.globalCompositeOperation='source-over';g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.fillStyle='rgba(255,255,255,.45)';
  for(let i=0;i<70;i++){g.beginPath();g.arc(Math.random()*w,Math.random()*h,(Math.random()*.025+.008)*w,0,7);g.fill();}
  g.fillStyle='rgba(255,255,255,.8)';g.font=`800 ${Math.round(w*.3)}px Nunito, sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText('?',w/2,h/2);
  sc.cells=new Set();
  const pos=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height];};
  let last=null,lastT=0;
  const rub=(a,b)=>{
    const bw=.16;g.globalCompositeOperation='destination-out';g.lineCap='round';g.lineWidth=bw*w;
    g.beginPath();g.moveTo(a[0]*w,a[1]*h);g.lineTo(b[0]*w+.1,b[1]*h);g.stroke();
    const steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.02));
    for(let i=0;i<=steps;i++){const x=a[0]+(b[0]-a[0])*i/steps,y=a[1]+(b[1]-a[1])*i/steps;
      for(let cx=0;cx<12;cx++)for(let cy=0;cy<12;cy++){if(Math.hypot((cx+.5)/12-x,(cy+.5)/12-y)<bw/2+.02)sc.cells.add(cx*12+cy);}}
  };
  cv.addEventListener('pointerdown',e=>{if(sc.done)return;e.preventDefault();cv.setPointerCapture(e.pointerId);last=pos(e);lastT=performance.now();rub(last,last);startSwish();});
  cv.addEventListener('pointermove',e=>{if(!last||sc.done)return;const p=pos(e),t=performance.now();
    const sp=Math.hypot(p[0]-last[0],p[1]-last[1])/Math.max(8,t-lastT)*1000;swishLevel(sp);rub(last,p);last=p;lastT=t;
    if(sc.cells.size>=108)revealScratch();});
  const up=()=>{last=null;stopSwish();};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
}
function revealScratch(){
  if(sc.done)return;sc.done=true;stopSwish();
  document.getElementById('board').classList.add('open');
  sayItem(sc.item);
  sc.timer=setTimeout(()=>{if(state.mode==='scratch')nextScratch();},4500);
}
/* soft "shhh" sound while rubbing */
function startSwish(){
  const c=AC();if(!c)return;stopSwish();
  const out=c.createGain();out.gain.value=0;out.connect(c.destination);
  const n=noise(out,c.currentTime,60,'bandpass',1500,.8);n.g.gain.value=1;swish={out};
}
function swishLevel(sp){if(!swish||!ac)return;swish.out.gain.setTargetAtTime(Math.min(.12,sp*.06)*vol(),ac.currentTime,.04);}
function stopSwish(){if(!swish)return;const o=swish.out;swish=null;try{o.gain.setTargetAtTime(0,ac.currentTime,.05);}catch(e){}setTimeout(()=>o.disconnect(),400);}

/* ---------- colouring ---------- */
const PAINTS=[{n:'красный',c:'#E5484D'},{n:'жёлтый',c:'#FFC53D'},{n:'синий',c:'#3E63DD'},{n:'зелёный',c:'#30A46C'},{n:'оранжевый',c:'#F76B15'},{n:'фиолетовый',c:'#8E4EC6'},{n:'розовый',c:'#F06292'},{n:'коричневый',c:'#8D5B3E'}];
const PICS=[
  {w:'Бабочка',r:['<ellipse cx="32" cy="36" rx="18" ry="16"/>','<ellipse cx="68" cy="36" rx="18" ry="16"/>','<ellipse cx="34" cy="64" rx="14" ry="13"/>','<ellipse cx="66" cy="64" rx="14" ry="13"/>','<ellipse cx="50" cy="50" rx="5" ry="26"/>'],
   d:['<path d="M48 26Q42 14 36 12M52 26Q58 14 64 12"/>']},
  {w:'Домик',r:['<path d="M22 48h56v40H22z"/>','<path d="M12 50L50 16L88 50z"/>','<path d="M42 64h16v24H42z"/>','<path d="M27 56h11v11H27z"/>','<path d="M62 56h11v11H62z"/>','<circle cx="87" cy="12" r="7"/>']},
  {w:'Рыбка',r:['<path d="M68 50L92 32V68z"/>','<path d="M36 34Q46 18 58 34z"/>','<path d="M38 66Q47 80 56 66z"/>','<ellipse cx="44" cy="50" rx="28" ry="18"/>'],
   d:['<circle cx="28" cy="46" r="3.5" fill="#1F2A44"/>','<path d="M19 56Q23 59 27 56"/>']},
  {w:'Цветочек',r:['<path d="M48 52h4v40h-4z"/>','<path d="M52 74Q66 60 77 68Q66 82 52 78z"/>','<circle cx="50" cy="21" r="10"/>','<circle cx="64.3" cy="31.4" r="10"/>','<circle cx="58.8" cy="48.3" r="10"/>','<circle cx="41.2" cy="48.3" r="10"/>','<circle cx="35.7" cy="31.4" r="10"/>','<circle cx="50" cy="36" r="8"/>']},
  {w:'Машинка',r:['<path d="M8 66V56Q8 50 16 50H30L40 38H66L78 50H86Q92 50 92 56V66z"/>','<path d="M42 41H52V50H34z"/>','<path d="M55 41H64L73 50H55z"/>','<circle cx="27" cy="67" r="9"/>','<circle cx="73" cy="67" r="9"/>'],
   d:['<circle cx="27" cy="67" r="3" fill="#1F2A44"/>','<circle cx="73" cy="67" r="3" fill="#1F2A44"/>']},
  {w:'Мячик',r:['<path d="M50 50L50 14A36 36 0 0 1 86 50z"/>','<path d="M50 50L86 50A36 36 0 0 1 50 86z"/>','<path d="M50 50L50 86A36 36 0 0 1 14 50z"/>','<path d="M50 50L14 50A36 36 0 0 1 50 14z"/>']}
];
let pt=null;
function startPaint(){state.mode='paint';pt={i:-1,fills:{},color:0,praised:false};nextPaint();}
function nextPaint(){pt.i=(pt.i+1)%PICS.length;pt.fills={};pt.praised=false;render();setTimeout(()=>{if(state.mode==='paint')speakSeq([PICS[pt.i].w+'!','Выбери краску!']);},300);}
function paintHTML(){
  const p=PICS[pt.i];
  const regs=p.r.map((sh,i)=>sh.replace(/^<(\w+)/,`<$1 data-r="${i}" class="reg" fill="${pt.fills[i]||'#ffffff'}"`)).join('');
  return `<header class="bar">${holdBack()}<div class="title">${p.w}</div><button class="ctl" data-act="nextpaint" aria-label="Другая картинка">${em('➡️')}</button></header>
  <main class="stage" id="stage"><div class="board paint" id="board"><svg viewBox="0 0 100 100" class="paintsvg">${regs}<g class="deco">${(p.d||[]).join('')}</g></svg></div></main>
  <div class="pal">${PAINTS.map((c,i)=>`<button class="pc ${pt.color===i?'on':''}" data-pc="${i}" style="--c:${c.c}" aria-label="${c.n}"></button>`).join('')}</div>`;
}
function bloop(){const c=AC();if(!c)return;const t=c.currentTime+.01,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(520,t);o.frequency.exponentialRampToValueAtTime(980,t+.12);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.22*vol(),t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.25);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+.3);}
function paintTap(el){
  const i=+el.dataset.r,col=PAINTS[pt.color].c;pt.fills[i]=col;el.setAttribute('fill',col);bloop();
  if(!pt.praised&&Object.keys(pt.fills).length===PICS[pt.i].r.length){pt.praised=true;const b=document.getElementById('board');anim(b,'pop');setTimeout(()=>say('Как красиво!'),300);}
}
function pickPaint(i){pt.color=i;document.querySelectorAll('.pc').forEach((b,k)=>b.classList.toggle('on',k===i));say(cap(PAINTS[i].n)+'!');}

/* ---------- magic brush ---------- */
let bs=null,btone=null;
function startBrush(){state.mode='brush';bs={color:-1,hue:0,segs:[],last:null};render();say('Рисуй пальчиком!');}
function brushHTML(){
  return `<header class="bar">${holdBack()}<div class="title">Волшебная кисть</div><button class="ctl" data-act="brushclear" aria-label="Стереть">${em('🧽')}</button></header>
  <main class="stage" id="stage"><div class="board" id="board"><canvas id="cv"></canvas></div></main>
  <div class="pal"><button class="pc rainbow ${bs.color<0?'on':''}" data-bc="-1" aria-label="радуга"></button>${PAINTS.map((c,i)=>`<button class="pc ${bs.color===i?'on':''}" data-bc="${i}" style="--c:${c.c}" aria-label="${c.n}"></button>`).join('')}</div>`;
}
function brushSeg(g,w,sg){g.strokeStyle=sg[4];g.shadowColor=sg[4];g.beginPath();g.moveTo(sg[0]*w,sg[1]*w);g.lineTo(sg[2]*w+.01,sg[3]*w);g.stroke();}
function fitBrush(){
  const size=fitPlain();const cv=document.getElementById('cv');if(!cv||!size)return;
  const dpr=window.devicePixelRatio||1;cv.width=cv.height=size*dpr;
  const g=cv.getContext('2d'),w=cv.width;g.lineCap='round';g.lineJoin='round';g.lineWidth=w*.045;g.shadowBlur=w*.02;
  bs.segs.forEach(sg=>brushSeg(g,w,sg));
  const pos=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height];};
  const col=()=>bs.color<0?`hsl(${(bs.hue=(bs.hue+3)%360)},85%,58%)`:PAINTS[bs.color].c;
  cv.addEventListener('pointerdown',e=>{e.preventDefault();cv.setPointerCapture(e.pointerId);const p=pos(e);bs.last=p;
    const sg=[p[0],p[1],p[0],p[1],col()];bs.segs.push(sg);brushSeg(g,w,sg);startBrushTone(p[1]);});
  cv.addEventListener('pointermove',e=>{if(!bs.last)return;const p=pos(e);const sg=[bs.last[0],bs.last[1],p[0],p[1],col()];
    bs.segs.push(sg);if(bs.segs.length>6000)bs.segs.shift();brushSeg(g,w,sg);bs.last=p;brushToneTo(p[1]);});
  const up=()=>{bs.last=null;stopBrushTone();};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
}
/* the line "sings": higher on top of the screen, lower at the bottom */
function startBrushTone(y){
  const c=AC();if(!c)return;stopBrushTone();
  const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=660-y*400;
  g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.05*vol(),c.currentTime+.15);
  o.connect(g);g.connect(c.destination);o.start();btone={o,g};
}
function brushToneTo(y){if(btone&&ac)btone.o.frequency.setTargetAtTime(660-y*400,ac.currentTime,.06);}
function stopBrushTone(){if(!btone||!ac)return;const {o,g}=btone;btone=null;g.gain.setTargetAtTime(.0001,ac.currentTime,.08);setTimeout(()=>{try{o.stop();}catch(e){}},500);}

/* ---------- decorate: put things on their places (cake, meadow, Christmas tree) ---------- */
const DECOR=[
  {name:'Торт',say:'Укрась торт!',done:'Какой красивый торт!',bg:'cake',
   phases:[{stamps:[['🍓','Клубничка'],['🌸','Цветочек'],['⭐','Звёздочка']],spots:[[34,37],[50,34],[66,37],[24,63],[41,67],[59,67],[76,63]]}]},
  {name:'Полянка',say:'Посади цветы на полянке!',done:'Какая красивая полянка!',bg:'meadow',
   phases:[{stamps:[['🌸','Цветочек'],['🌼','Ромашка']],spots:[[16,70],[34,83],[52,68],[70,82],[86,68]]},
           {say:'А теперь прилетели пчёлки и божьи коровки!',stamps:[['🐝','Пчёлка'],['🐞','Божья коровка']],spots:'above'}]},
  {name:'Ёлка',say:'Наряди ёлку!',done:'Какая нарядная ёлка!',bg:'tree',
   phases:[{stamps:[['ball-red','Красный шарик'],['ball-blue','Синий шарик'],['ball-yellow','Жёлтый шарик']],
            spots:[[50,30],[42,49],[58,49],[32,67],[50,64],[68,67],[24,81],[42,80],[58,80],[76,81]]},
           {say:'А на макушку — звёздочку!',stamps:[['⭐','Звёздочка']],spots:[[50,11]]}]}
];
const BALLS={'ball-red':'#E5484D','ball-blue':'#3E63DD','ball-yellow':'#F5B000'};
let stp=null;
function startStamps(){state.mode='stamps';stp={scene:-1,timer:null};nextDecor();}
function nextDecor(){
  clearTimeout(stp.timer);stp.scene=(stp.scene+1)%DECOR.length;stp.phase=0;stp.placed=[];stp.sel=0;stp.done=false;
  render();setTimeout(()=>{if(state.mode==='stamps')say(DECOR[stp.scene].say);},300);
}
function decorSpots(){
  const P=DECOR[stp.scene].phases[stp.phase];
  if(P.spots==='above')return stp.placed.filter(p=>p.phase===0).map(p=>[p.x+5,p.y-12]);
  return P.spots;
}
function stampHTML(key){return BALLS[key]?`<span class="dball" style="--bc:${BALLS[key]}"></span>`:em(key);}
function decorBG(bg){
  if(bg==='cake')return `<svg viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" fill="#FFF4E6"/>
    <ellipse cx="50" cy="88" rx="42" ry="6" fill="#fff" stroke="#E5DCCF"/>
    <rect x="14" y="52" width="72" height="34" rx="7" fill="#F7B3C8"/><path d="M14 58q4 7 9 0t9 0 9 0 9 0 9 0 9 0 9 0 9 0V52H14z" fill="#fff"/>
    <rect x="24" y="28" width="52" height="26" rx="6" fill="#FFDCE7"/><path d="M24 33q4 6 8.7 0t8.7 0 8.7 0 8.7 0 8.7 0 8.7 0V28H24z" fill="#fff"/></svg>`;
  if(bg==='meadow')return `<svg viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="58" fill="#BFE3FF"/><circle cx="84" cy="16" r="9" fill="#FFE07A"/>
    <path d="M0 58Q30 50 60 57T100 55V100H0Z" fill="#9ED98A"/><path d="M0 70Q40 64 100 70V100H0Z" fill="#8ACF76"/></svg>`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" fill="#EAF4FF"/>
    <rect x="44" y="86" width="12" height="10" rx="2" fill="#9C6A3F"/>
    <path d="M50 44L10 88H90Z" fill="#2E8B57"/><path d="M50 24L18 62H82Z" fill="#35A064"/><path d="M50 8L28 40H72Z" fill="#3FB370"/></svg>`;
}
function stampsHTML(){
  const D=DECOR[stp.scene],P=D.phases[stp.phase],spots=decorSpots();
  const filled=new Set(stp.placed.filter(p=>p.phase===stp.phase).map(p=>p.s));
  return `<header class="bar">${holdBack()}<div class="title">${D.name}</div>
    <button class="ctl" data-act="stampclear" aria-label="Начать заново">${em('🧽')}</button><button class="ctl" data-act="nextdecor" aria-label="Другая картинка">${em('➡️')}</button></header>
  <main class="stage" id="stage"><div class="board decor" id="board">${decorBG(D.bg)}
    ${stp.done?'':spots.map((p,i)=>filled.has(i)?'':`<span class="dspot" style="left:${p[0]}%;top:${p[1]}%"></span>`).join('')}
    ${stp.placed.map(p=>`<span class="dplaced" style="left:${p.x}%;top:${p.y}%"><span>${stampHTML(p.k)}</span></span>`).join('')}
  </div></main>
  <div class="stbar">${stp.done?'':P.stamps.map(([k,n],i)=>`<button class="stb ${stp.sel===i?'on':''}" data-st="${i}" aria-label="${n}">${stampHTML(k)}</button>`).join('')}</div>`;
}
function pickStamp(i){stp.sel=i;document.querySelectorAll('.stb').forEach((x,k)=>x.classList.toggle('on',k===i));say(DECOR[stp.scene].phases[stp.phase].stamps[i][1]+'!');}
function wireStamps(){
  const b=document.getElementById('board');if(!b)return;
  b.addEventListener('pointerdown',e=>{
    if(stp.done)return;e.preventDefault();const r=b.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*100,y=(e.clientY-r.top)/r.height*100;
    const spots=decorSpots(),filled=new Set(stp.placed.filter(p=>p.phase===stp.phase).map(p=>p.s));
    let best=-1,bd=17;spots.forEach((p,i)=>{if(filled.has(i))return;const d=Math.hypot(p[0]-x,p[1]-y);if(d<bd){bd=d;best=i;}});
    if(best<0)return;
    const P=DECOR[stp.scene].phases[stp.phase],sp=spots[best];
    stp.placed.push({phase:stp.phase,s:best,x:sp[0],y:sp[1],k:P.stamps[Math.min(stp.sel,P.stamps.length-1)][0]});
    bloopAt(500+Math.random()*400);
    if(filled.size+1>=spots.length){
      const D=DECOR[stp.scene];
      if(stp.phase+1<D.phases.length){stp.phase++;stp.sel=0;render();const txt=D.phases[stp.phase].say,scn=stp.scene;setTimeout(()=>{if(state.mode==='stamps'&&stp.scene===scn)say(txt);},500);}
      else{stp.done=true;render();const bd_=document.getElementById('board');if(bd_)anim(bd_,'pop');softChime();setTimeout(()=>say(D.done),600);
        stp.timer=setTimeout(()=>{if(state.mode==='stamps')nextDecor();},7000);}
    }else render();
  });
}
function bloopAt(f){const c=AC();if(!c)return;const t=c.currentTime+.01,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*1.6,t+.1);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.18*vol(),t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.22);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+.25);}

/* ---------- roads: a new winding road every time, many pairs, things to collect on the way ---------- */
const ROAD_PAIRS=[['🚗','🏠','Отвези машинку домой!'],['🐇','🥕','Помоги кролику найти морковку!'],['🐶','⚽','Помоги собачке найти мячик!'],
  ['🚂','🏠','Отвези поезд домой!'],['🐱','🥛','Помоги котику найти молоко!'],['🐝','🌸','Помоги пчёлке долететь до цветка!'],
  ['🦆','nature-voda','Помоги утке добраться до воды!'],['🧸','toy-kukla','Помоги мишке дойти до куклы!'],['🐞','🍂','Помоги божьей коровке доползти до листика!'],
  ['🐴','🍎','Помоги лошадке найти яблоко!'],['✈️','☁️','Помоги самолёту долететь до облака!'],['🚒','🏠','Отвези пожарную машину домой!'],
  ['🐔','🌿','Помоги курочке дойти до травки!'],['🚜','🥔','Отвези трактор к картошке!']];
/* things to pick up: [picture, accusative 1, 2–4, 5+, gender] */
const COLLECT=[['⭐','звёздочку','звёздочки','звёздочек','f'],['🍎','яблоко','яблока','яблок','n'],['🍓','клубничку','клубнички','клубничек','f']];
function makeRoad(L){
  const horiz=Math.random()<.65,n=[1,2,3][L-1]+(Math.random()<.5?0:1)+2,amp=[10,18,24][L-1],ctrl=[];
  for(let i=0;i<n;i++){
    const a=14+i/(n-1)*72;let b=(i===0||i===n-1)?50+(Math.random()-.5)*30:50+(i%2?1:-1)*(Math.random()<.5?1:-1)*amp*(.6+Math.random()*.6);
    b=Math.max(16,Math.min(84,b));ctrl.push(horiz?[a,b]:[b,100-a]);
  }
  const pts=[];
  for(let i=0;i<ctrl.length-1;i++){
    const p0=ctrl[Math.max(0,i-1)],p1=ctrl[i],p2=ctrl[i+1],p3=ctrl[Math.min(ctrl.length-1,i+2)];
    for(let s=0;s<12;s++){const t=s/12,t2=t*t,t3=t2*t;
      pts.push([0,1].map(k=>.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3)));}
  }
  pts.push(ctrl[ctrl.length-1]);
  return pts.map(p=>[Math.max(9,Math.min(91,p[0])),Math.max(9,Math.min(91,p[1]))]);
}
let rd=null;
function startRoads(){state.mode='roads';rd={timer:null};nextRoad();}
function nextRoad(){
  clearTimeout(rd.timer);const L=lv('roads');
  rd.pair=ROAD_PAIRS[bagNext('roads',ROAD_PAIRS.length)];
  rd.P=resample(makeRoad(L),1).map(q=>[q.x,q.y]);rd.idx=0;rd.drag=false;rd.done=false;
  const nc=L===1?0:L===2?2+Math.floor(Math.random()*2):3+Math.floor(Math.random()*2);
  rd.ci=COLLECT[Math.floor(Math.random()*COLLECT.length)];rd.got=0;
  rd.coll=Array.from({length:nc},(_,i)=>({idx:Math.round(rd.P.length*(.22+i*(.6/Math.max(1,nc-1||1)))),taken:false}));
  if(nc===1)rd.coll[0].idx=Math.round(rd.P.length*.5);
  render();setTimeout(()=>{if(state.mode==='roads')say(rd.pair[2]);},300);
}
function svgImg(e,x,y,sz){const u=IMG[e.replace(/\uFE0F/g,'')];return u?`<image href="${u}" x="${x-sz/2}" y="${y-sz/2}" width="${sz}" height="${sz}"/>`:'';}
function roadsHTML(){
  const pts=rd.P.map(q=>q.join(',')).join(' '),end=rd.P[rd.P.length-1],w=[15,11,8][lv('roads')-1];
  return `<header class="bar">${holdBack()}<div class="title">Дорожки</div><button class="ctl" data-act="nextroad" aria-label="Другая дорожка">${em('➡️')}</button></header>
  <main class="stage" id="stage"><div class="board roadboard" id="board">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <polyline points="${pts}" fill="none" stroke="#CFD6E4" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline id="donepath" points="" fill="none" stroke="#8FD6A5" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="${pts}" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="3 3"/>
      ${svgImg(rd.pair[1],end[0],end[1],17)}
    </svg>
    ${rd.coll.map((c,i)=>{const p=rd.P[Math.min(c.idx,rd.P.length-1)];return `<div class="rcoll${c.taken?' got':''}" id="rc${i}" style="left:${p[0]}%;top:${p[1]}%">${em(rd.ci[0])}</div>`;}).join('')}
    <div class="token hint" id="token"><span>${em(rd.pair[0])}</span></div>
  </div></main>`;
}
function placeToken(){
  const t=document.getElementById('token'),d=document.getElementById('donepath');if(!t)return;
  const p=rd.P[rd.idx];t.style.left=p[0]+'%';t.style.top=p[1]+'%';t.classList.toggle('hint',rd.idx===0&&!rd.drag);
  d.setAttribute('points',rd.P.slice(0,rd.idx+1).map(q=>q.join(',')).join(' '));
}
function wireRoads(){
  const b=document.getElementById('board');if(!b)return;
  const pos=e=>{const r=b.getBoundingClientRect();return [(e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100];};
  b.addEventListener('pointerdown',e=>{if(rd.done)return;e.preventDefault();const p=pos(e),t=rd.P[rd.idx];
    if(Math.hypot(p[0]-t[0],p[1]-t[1])<15){rd.drag=true;b.setPointerCapture(e.pointerId);roadMove(p);}});
  b.addEventListener('pointermove',e=>{if(rd.drag&&!rd.done)roadMove(pos(e));});
  const up=()=>{rd.drag=false;placeToken();};
  b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);
  placeToken();
}
function roadMove(p){
  let best=-1,bd=1e9;
  for(let j=Math.max(0,rd.idx-12);j<=Math.min(rd.P.length-1,rd.idx+12);j++){const d=Math.hypot(p[0]-rd.P[j][0],p[1]-rd.P[j][1]);if(d<bd){bd=d;best=j;}}
  if(bd>[13,9.5,7][lv('roads')-1])return; /* finger left the road: it waits */
  rd.idx=best;placeToken();
  rd.coll.forEach((c,i)=>{if(!c.taken&&c.idx<=rd.idx){c.taken=true;rd.got++;const el=document.getElementById('rc'+i);if(el)el.classList.add('got');bloopAt(520+rd.got*90);say(cap(NUM[rd.got])+'!');}});
  if(rd.idx>=rd.P.length-2)roadDone();
}
function roadDone(){
  rd.done=true;rd.drag=false;
  const t=document.querySelector('#token>span');if(t)anim(t,'yay');
  if(state.calm)softChime();
  const C=rd.ci,parts=['Добрались!'];
  if(rd.got)parts.push(`Собрали ${numAcc(rd.got,C[4])} ${formN(rd.got,[0,C[1],C[2],C[3]])}!`);
  parts.push('Молодец!');
  setTimeout(()=>{speakSeq(parts);lvResult('roads',true);},state.calm?600:0);
  rd.timer=afterSpeech(()=>{if(state.mode==='roads')nextRoad();},2200);
}
