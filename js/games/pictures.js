/* ---------- game logic ---------- */
function pickListen(){const per=Math.min(state.listenCount,cat().items.length),pg=Math.min(state.listenPage||0,listenPages()-1);state.listenItems=cat().items.slice(pg*per,pg*per+per);}
function startListen(){if(!cat().items.length)return;state.mode='listen';state.listenPage=0;pickListen();render();}
function startFind(){if(cat().items.length<2){state.homeMsg='Для игры «Найди картинку» нужно хотя бы два фото семьи.';render();return;}state.mode='find';state.stars=0;newRound();}
/* level 6: what is it for?  level 7: big or small */
const FUNCQ=[{e:'🥄',w:'Ложка',q:'Чем едят суп?',a:'Ложкой!'},{e:'☕',w:'Кружка',q:'Из чего пьют чай?',a:'Из кружки!'},{e:'🛏️',w:'Кровать',q:'На чём спят?',a:'На кровати!'},
  {e:'🪥',w:'Щётка',q:'Чем чистят зубки?',a:'Щёткой!'},{e:'🧦',w:'Носки',q:'Что надевают на ножки?',a:'Носки!'},{e:'🧢',w:'Кепка',q:'Что надевают на голову?',a:'Кепку!'},
  {e:'🧤',w:'Варежки',q:'Что надевают на ручки?',a:'Варежки!'},{e:'🚗',w:'Машина',q:'На чём ездят?',a:'На машине!'},{e:'📚',w:'Книжка',q:'Что читают?',a:'Книжку!'},{e:'🛁',w:'Ванна',q:'Где купаются?',a:'В ванне!'}];
const SIZES=[['⚽','мяч','m'],['toy-mashinka','машинка','f'],['🍎','яблоко','n'],['🧸','мишка','m'],['🐟','рыбка','f'],['🎈','шарик','m'],['🐱','кошка','f'],['🍌','банан','m']];
const ADJ={m:['большой','маленький'],f:['большая','маленькая'],n:['большое','маленькое']};
function findQ(t){return t.q||`Где ${nm(t)}?`;}
function mixedPool(){return Object.entries(CATS).filter(([k,c])=>!c.hidden&&k!=='family').flatMap(([k,c])=>c.items);}
function newRound(){
  const L=lv('find');let t,opts;
  if(L<=4){
    const items=L===4?mixedPool():cat().items,n=Math.min([2,3,4,3][L-1],items.length);
    const pool=items.filter(it=>it!==state.last);t=pool[Math.floor(Math.random()*pool.length)];
    const used=new Set([t.e,t.w]),rest=[];for(const it of shuffle(items)){if(rest.length>=n-1)break;if(used.has(it.e)||used.has(it.w))continue;used.add(it.e);used.add(it.w);rest.push(it);}
    opts=shuffle([t,...rest]);
  }else if(L===5){
    const T=LEARN[Math.floor(Math.random()*LEARN.length)],others=shuffle(LEARN.filter(x=>x.v!==T.v)).slice(0,2);
    const mk=(x,i)=>({e:x.e,w:x.n,c:COLORS[(i*3+1)%COLORS.length],q:`Кто ${x.v}?`,ans:`${x.n} ${x.v}!`});
    opts=shuffle([T,...others]).map(mk);t=opts.find(o=>o.w===T.n);
  }else if(L===6){
    const T=FUNCQ[Math.floor(Math.random()*FUNCQ.length)],others=shuffle(FUNCQ.filter(x=>x!==T)).slice(0,2);
    opts=shuffle([T,...others]).map((x,i)=>({e:x.e,w:x.w,c:COLORS[(i*3+2)%COLORS.length],q:T.q,ans:x.a}));t=opts.find(o=>o.w===T.w);
  }else{
    const [e,w,g]=SIZES[Math.floor(Math.random()*SIZES.length)],big=Math.random()<.5,A=ADJ[g],col=COLORS[Math.floor(Math.random()*COLORS.length)];
    const q=`Где ${big?A[0]:A[1]} ${w}?`;
    const B={e,w:`${A[0]} ${w}`,c:col,sc:1.3,hide:1,q,ans:`${cap(A[0])} ${w}!`,wrongSay:`Это ${A[0]} ${w}.`};
    const S={e,w:`${A[1]} ${w}`,c:col,sc:.6,hide:1,q,ans:`${cap(A[1])} ${w}!`,wrongSay:`Это ${A[1]} ${w}.`};
    opts=shuffle([B,S]);t=big?B:S;
  }
  state.last=t;state.target=t;state.options=opts;state.busy=false;state.roundMiss=false;
  render();setTimeout(()=>{if(state.mode==='find')say(findQ(t));},350);
}
function sparkle(el){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  ['⭐','✨','⭐'].forEach((s,i)=>{
    const sp=document.createElement('span');sp.className='spark';sp.innerHTML=em(s);
    sp.style.left=(20+i*28)+'%';sp.style.top='30%';sp.style.animationDelay=(i*90)+'ms';
    el.appendChild(sp);setTimeout(()=>sp.remove(),1200);
  });
}
function anim(el,cls){el.classList.remove('pop','yay','nope');void el.offsetWidth;el.classList.add(cls);}
function findTap(el,it){
  if(state.busy)return;
  const t=state.target;
  if(it===t){
    state.busy=true;anim(el,'yay');sparkle(el);
    if(t.ans)speakSeq(['Да!',t.ans]);else sayItem(t,'Да!');
    if(!state.roundMiss)lvResult('find',true);
    state.stars++;document.getElementById('stars').innerHTML=starsHTML();
    afterSpeech(()=>{if(state.mode!=='find')return;if(state.stars>=5)party(()=>{if(state.mode==='find'){state.stars=0;newRound();}});else newRound();},1200);
  }else{
    anim(el,'nope');
    if(!state.roundMiss){state.roundMiss=true;lvResult('find',false);}
    speakSeq(t.q?[it.wrongSay||`Это ${nm(it)}.`,t.q]:[`Это ${nm(it)}.`,`А где ${nm(t)}?`]);
  }
}
