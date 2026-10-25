/* ---------- counting ---------- */
const COUNT_OBJ=[
  ['🐰','зайчик','зайчика','зайчиков','m'],['🧸','мишка','мишки','мишек','m'],['🍎','яблоко','яблока','яблок','n'],
  ['🚗','машинка','машинки','машинок','f'],['🐟','рыбка','рыбки','рыбок','f'],['⚽','мячик','мячика','мячиков','m'],
  ['🦋','бабочка','бабочки','бабочек','f'],['🐥','цыплёнок','цыплёнка','цыплят','m']];
const LEVELS={1:{min:1,max:3,ch:0},2:{min:1,max:3,ch:2},3:{min:1,max:5,ch:3},4:{min:1,max:10,ch:3}};
const NUM=['','один','два','три','четыре','пять','шесть','семь','восемь','девять','десять'];
const cap=x=>x[0].toUpperCase()+x.slice(1);
const formN=(n,o)=>{const a=n%10,b=n%100;return (a===1&&b!==11)?o[1]:(a>=2&&a<=4&&(b<12||b>14))?o[2]:o[3];};
const numFor=(n,g)=>n===1?(g==='f'?'одна':g==='n'?'одно':'один'):n===2?(g==='f'?'две':'два'):NUM[n];
let cn=null;
const summary=()=>cap(`${numFor(cn.n,cn.o[4])} ${formN(cn.n,cn.o)}`);
const question=()=>`Сколько ${cn.o[3]}?`;
function setQ(t){const q=document.getElementById('cq');if(q)q.textContent=t;}
function startCount(){state.mode='count';state.stars=0;cn={last:null,mist:0,timer:null};newCount();}
function newCount(){
  cn.roundMiss=false;cn.give=null;
  if(lv('count')===5){newGive();return;}
  const L=LEVELS[Math.min(4,lv('count'))];let n;
  do{n=L.min+Math.floor(Math.random()*(L.max-L.min+1));}while(n===cn.last&&L.max>L.min);
  cn.last=n;clearTimeout(cn.timer);
  Object.assign(cn,{n,o:COUNT_OBJ[Math.floor(Math.random()*COUNT_OBJ.length)],tapped:0,phase:'count',options:[]});
  render();setTimeout(()=>{if(state.mode==='count')say('Давай посчитаем!');},300);
}
function countHTML(){
  if(cn.give)return giveHTML();
  return `<header class="bar">${holdBack()}<div class="stars" id="stars">${starsHTML()}</div><button class="ctl" data-act="countdemo" aria-label="Посчитать вместе">${em('🔊')}</button></header>
  <div class="q" id="cq">Посчитай!</div>
  <main class="stage" id="stage"><div class="grid" id="grid">${Array.from({length:cn.n},(_,i)=>`<button class="card obj" data-o="${i}" style="--c:var(--panel)" aria-label="${cn.o[1]}"><span class="emo">${em(cn.o[0])}</span></button>`).join('')}</div></main>
  <div class="answers" id="answers" hidden></div>`;
}
function nextHint(){
  document.querySelectorAll('.obj').forEach(e=>e.classList.remove('next'));
  if(cn&&cn.phase==='count'){const x=document.querySelector('.obj:not(.on)');if(x)x.classList.add('next');}
}
function markObj(el,k){el.classList.add('on');el.classList.remove('next');const b=document.createElement('span');b.className='badge';b.textContent=k;el.appendChild(b);anim(el,'pop');}
function objTap(el){
  if(!cn||cn.phase!=='count'||el.classList.contains('on'))return;
  cn.tapped++;markObj(el,cn.tapped);say(cap(NUM[cn.tapped])+'!');nextHint();
  if(cn.tapped===cn.n){cn.phase='wait';cn.timer=setTimeout(afterCount,900);}
}
function afterCount(){
  if(state.mode!=='count')return;
  if(!LEVELS[Math.min(4,lv('count'))].ch){cn.phase='done';setQ(summary()+'!');say(summary()+'!');winCount();return;}
  askAnswer();
}
function makeOptions(n,L){
  const set=new Set([n]),hi=Math.max(L.max,L.ch);let g=0;
  while(set.size<L.ch&&g++<200){const d=n+Math.floor(Math.random()*5)-2;if(d>=1&&d<=hi)set.add(d);}
  for(let k=1;set.size<L.ch;k++)set.add(k);
  return [...set].sort((a,b)=>a-b);
}
function askAnswer(){
  if(state.mode!=='count')return;
  cn.phase='answer';cn.options=makeOptions(cn.n,LEVELS[Math.min(4,lv('count'))]);
  const a=document.getElementById('answers');a.hidden=false;
  a.innerHTML=cn.options.map(v=>`<button class="ans" data-ans="${v}" aria-label="${v}"><b>${v}</b><span class="dots" style="grid-template-columns:repeat(${Math.min(v,5)},14px)">${'<i></i>'.repeat(v)}</span></button>`).join('');
  fitGrid();setQ(question());say(question());
}
function ansTap(el,v){
  if(!cn||cn.phase!=='answer')return;
  if(v===cn.n){cn.phase='done';anim(el,'yay');setQ(summary()+'!');say('Да! '+summary()+'!');winCount();}
  else{
    anim(el,'nope');cn.mist++;cn.roundMiss=true;cn.phase='demo';say('Давай посчитаем вместе.');
    cn.timer=setTimeout(()=>autoCount(()=>{cn.timer=setTimeout(()=>{if(state.mode!=='count')return;cn.phase='answer';setQ(question());say(question());},1300);}),1600);
  }
}
function autoCount(done){
  const objs=[...document.querySelectorAll('.obj')];
  objs.forEach(e=>{e.classList.remove('on','next');const b=e.querySelector('.badge');if(b)b.remove();});
  let i=0;
  const step=()=>{
    if(state.mode!=='count')return;
    if(i<objs.length){markObj(objs[i],i+1);say(cap(NUM[i+1])+'!');i++;cn.timer=setTimeout(step,850);}
    else{say(summary()+'!');done&&done();}
  };
  cn.timer=setTimeout(step,200);
}
function countDemo(){
  if(!cn)return;
  if(cn.phase==='answer'){say(question());return;}
  if(cn.phase!=='count')return;
  cn.phase='demo';
  autoCount(()=>{
    if(!LEVELS[Math.min(4,lv('count'))].ch){cn.phase='done';setQ(summary()+'!');cn.timer=setTimeout(()=>{if(state.mode==='count')newCount();},2600);}
    else cn.timer=setTimeout(askAnswer,1400);
  });
}
function winCount(){
  if(cn.roundMiss===true)lvResult('count',false);else if(cn.roundMiss===false)lvResult('count',true);
  state.stars++;document.getElementById('stars').innerHTML=starsHTML();
  cn.timer=afterSpeech(()=>{
    if(state.mode!=='count')return;
    if(state.stars>=5)party(()=>{if(state.mode!=='count')return;state.stars=0;cn.mist=0;newCount();});
    else newCount();
  },1200);
}
/* level 5: give the right number  [picture, one (accusative), 2–4, 5+, gender, one (nominative)] */
const GIVE_FOOD=[['🍎','яблоко','яблока','яблок','n','яблоко'],['🍅','помидор','помидора','помидоров','m','помидор'],['🍓','клубничку','клубнички','клубничек','f','клубничка'],['🍌','банан','банана','бананов','m','банан']];
const RECEIVERS=[['🧸','мишке'],['🐇','зайке'],['🐱','котику']];
const numAcc=(n,g)=>n===1?(g==='f'?'одну':g==='n'?'одно':'один'):numFor(n,g);
function newGive(){
  let n;do{n=1+Math.floor(Math.random()*5);}while(n===cn.last);cn.last=n;clearTimeout(cn.timer);
  const f=GIVE_FOOD[Math.floor(Math.random()*GIVE_FOOD.length)],r=RECEIVERS[Math.floor(Math.random()*RECEIVERS.length)];
  cn.give={n,f,r,pile:n+2+Math.floor(Math.random()*2),placed:0,done:false};cn.phase='give';
  render();setTimeout(()=>{if(state.mode==='count')say(giveQ()+'!');},300);
}
const giveQ=()=>{const G=cn.give;return `Дай ${G.r[1]} ${numAcc(G.n,G.f[4])} ${formN(G.n,[0,G.f[1],G.f[2],G.f[3]])}`;};
function giveHTML(){
  const G=cn.give;
  return `<header class="bar">${holdBack()}<div class="stars" id="stars">${starsHTML()}</div><button class="ctl" data-act="giveask" aria-label="Повторить">${em('🔊')}</button></header>
  <div class="q" id="cq">${giveQ()}</div>
  <main class="stage" id="stage"><div class="give">
    <div class="pile">${Array.from({length:G.pile},(_,i)=>`<button class="gitem" data-g="${i}" aria-label="${G.f[5]}">${em(G.f[0])}</button>`).join('')}</div>
    <div class="recv"><div class="rbig" id="rbig">${em(G.r[0])}</div><div class="plate">${Array.from({length:G.n},()=>'<span class="slot"></span>').join('')}</div></div>
  </div></main>
  <p class="hintline">Ребёнок нажимает на угощение, оно ложится на тарелку, игра считает вслух. Пустые кружочки на тарелке подсказывают, сколько нужно.</p>`;
}
function giveTap(b){
  const G=cn.give;if(!G||G.done||b.classList.contains('used'))return;
  if(G.placed>=G.n)return;
  b.classList.add('used');const slot=document.querySelectorAll('.slot')[G.placed];
  if(slot){slot.innerHTML=em(G.f[0]);slot.classList.add('full');anim(slot,'pop');}
  G.placed++;say(cap(NUM[G.placed])+'!');bloopAt(500+G.placed*60);
  if(G.placed===G.n){G.done=true;
    cn.timer=setTimeout(()=>{if(state.mode!=='count')return;const r=document.getElementById('rbig');if(r)anim(r,'yay');softChime();
      speakSeq(['Спасибо!',`${cap(numFor(G.n,G.f[4]))} ${formN(G.n,[0,G.f[5],G.f[2],G.f[3]])}!`]);winCount();},700);}
}
