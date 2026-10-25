/* ---------- parrot teaches: model the phrase, wait, echo her, model again ---------- */
const LEARN=[
  {e:'⚽',n:'Мяч',v:'прыгает',a:'bounce'},{e:'🚗',n:'Машина',v:'едет',a:'drive'},{e:'🐱',n:'Кошка',v:'спит',a:'sleep'},
  {e:'🐕',n:'Собака',v:'бежит',a:'run'},{e:'🐦',n:'Птичка',v:'летит',a:'fly'},{e:'🐟',n:'Рыбка',v:'плывёт',a:'swim'},
  {e:'🐇',n:'Зайка',v:'прыгает',a:'hop'},{e:'✈️',n:'Самолёт',v:'летит',a:'flyR'},{e:'🧸',n:'Мишка',v:'спит',a:'sleep'},
  {e:'🦆',n:'Утка',v:'плывёт',a:'swim'},{e:'🎈',n:'Шарик',v:'летит',a:'rise'},{e:'🚂',n:'Поезд',v:'едет',a:'drive'}];
/* three words: who + does + what */
const LEARN3=[
  {e:'🐱',o:'🥛',t:'Кошка пьёт молоко',a:'eat'},{e:'🐇',o:'🥕',t:'Зайка ест морковку',a:'eat'},{e:'🐕',o:'⚽',t:'Собака несёт мяч',a:'carry'},
  {e:'🦆',o:'🍞',t:'Утка ест хлеб',a:'eat'},{e:'🧸',o:'🍯',t:'Мишка ест мёд',a:'eat'},{e:'🐱',o:'⚽',t:'Кошка катает мяч',a:'roll'},
  {e:'🚗',o:'🧸',t:'Машина везёт мишку',a:'ride'},{e:'🚂',o:'🐇',t:'Поезд везёт зайку',a:'ride'}];
let lt=null;
const learnPool=()=>lt.lvl===3?LEARN3:LEARN;
const learnItem=()=>learnPool()[lt.i%learnPool().length];
/* what the child should say at this level */
function learnPhrase(){
  const L=learnItem();
  if(lt.lvl===1)return L.n+'!';
  if(lt.lvl===3)return L.t+'!';
  if(lt.lvl===4)return cap(L.v)+'!';
  return `${L.n} ${L.v}!`;
}
const learnQuestion=()=>`Что делает ${low(learnItem().n)}?`;
function startLearn(){
  state.mode='learn';state.stars=0;lt={i:0,last:-1,phase:'model',on:0,timer:null,src:null,noMic:false,lvl:lv('learn')};
  pickLearn();render();
  startMic().then(ok=>{if(state.mode!=='learn')return;if(!ok){lt.noMic=true;}else mic.onFrame=learnFrame;lt.timer=setTimeout(()=>learnModel('ask'),500);});
}
function pickLearn(){
  lt.lvl=lv('learn');const n=learnPool().length;let i;do{i=Math.floor(Math.random()*n);}while(i===lt.last&&n>1);
  lt.i=i;lt.last=i;lt.phase='model';lt.on=0;lt.reprompts=0;lt.attempts=0;
}
function learnHTML(){
  const L=learnItem();
  const scene=lt.lvl===3
    ?(L.a==='ride'?`<div class="lpair p-ride" id="lobj"><span class="subj ride"><span class="rider">${em(L.o)}</span>${em(L.e)}</span></div>`
      :`<div class="lpair p-${L.a}" id="lobj"><span class="obj2">${em(L.o)}</span><span class="subj">${em(L.e)}</span></div>`)
    :`<div class="lobj a-${L.a}" id="lobj"><span>${em(L.e)}</span></div>${L.a==='sleep'?`<div class="zz">${em('💤')}</div>`:''}`;
  return `<header class="bar">${holdBack()}<div class="stars" id="stars">${starsHTML()}</div><button class="ctl" data-act="learnagain" aria-label="Ещё раз">${em('🔊')}</button></header>
  <div class="q" id="lq">${lt.lvl===4?learnQuestion():learnPhrase().replace('!','')}</div>
  <main class="stage" id="stage"><div class="lscene">
    ${scene}
    <div class="parrot small idle" id="lparrot">${em('🦜')}</div>
  </div></main>
  <p class="hintline" id="lhint">${lt.noMic?'Микрофон недоступен: нажимайте «Сказала» или «Пробовала», когда она попробует повторить.':lt.lvl===4?'Попугай задаёт вопрос и ждёт ответа. Подойдёт и одно слово: «Прыгает!»':'Попугай повторит всё, что услышит, а засчитываете вы: «Сказала» — если было слово, «Пробовала» — если была попытка.'}</p>
  <div class="pbar"><button class="pbtn ok" data-act="learnsaid">⭐ Сказала!</button><button class="pbtn" data-act="learntry">👍 Пробовала</button><button class="pbtn" data-act="learnnext">⏭ Дальше</button></div>`;
}
function setLP(ph){const el=document.getElementById('lparrot');if(el)el.className='parrot small '+ph;}
/* kind: 'ask' (start), 'reprompt' (after silence), 'answer' (after her attempt: show the right answer) */
function learnModel(kind){
  if(state.mode!=='learn')return;
  kind=kind||'ask';
  let parts;
  if(lt.lvl===4){const A=learnPhrase(),L=learnItem();
    parts=kind==='ask'?[learnQuestion()]:kind==='reprompt'?[learnQuestion(),A]:[A,`${L.n} ${L.v}!`];}
  else parts=[learnPhrase()];
  lt.phase='model';setLP('talk');
  speakSeq(parts,()=>{if(state.mode!=='learn'||lt.phase!=='model')return;lt.phase='listen';lt.wait=performance.now();setLP('rec');});
}
function learnFrame(m){
  if(!lt||state.mode!=='learn')return;const now=performance.now(),sr=ac.sampleRate;
  if(lt.phase==='listen'){
    if(m.voice){lt.on++;if(lt.on>=2){lt.phase='rec';lt.start=Math.max(0,m.total-Math.round(sr*.35));lt.t0=now;lt.last=now;}}
    else{lt.on=0;if(now-lt.wait>9000&&lt.reprompts<1){lt.reprompts++;learnModel('reprompt');}}
  }else if(lt.phase==='rec'){
    if(m.voice)lt.last=now;
    if(now-lt.last>700||now-lt.t0>4000){
      const end=m.total-Math.round(sr*Math.max(0,(now-lt.last)/1000-.15));
      lt.phase='echo';learnEcho(lt.start,end);
    }
  }
}
/* Is this sound an attempt to speak? Looks at length, syllable-like bursts, voice pitch and rhythm.
   Laughter = many short, very regular, breathy bursts; squeals = very high pitch; claps/blowing = no voice. */
function analyzeSpeech(raw,srIn,E){
  const k=Math.max(1,Math.round(srIn/12000)),sr=srIn/k,n=Math.floor(raw.length/k),d=new Float32Array(n);
  for(let i=0;i<n;i++){let a=0;for(let j=0;j<k;j++)a+=raw[i*k+j];d[i]=a/k;}
  const fl=Math.round(sr*.02),N=Math.floor(n/fl);if(N<6)return {ok:false,why:'short'};
  const en=new Float32Array(N);let max=0;
  for(let i=0;i<N;i++){let q=0;for(let j=0;j<fl;j++){const v=d[i*fl+j];q+=v*v;}en[i]=Math.sqrt(q/fl);if(en[i]>max)max=en[i];}
  const sm=Array.from(en,(v,i)=>(en[i-1]??v)*.25+v*.5+(en[i+1]??v)*.25),thr=max*.3;
  const minLag=Math.floor(sr/1100),maxLag=Math.floor(sr/90),R=new Float32Array(maxLag+1);
  let act=0,voiced=0,f0s=0,f0n=0;
  for(let i=0;i<N;i++){
    if(sm[i]<thr)continue;act++;
    const st=i*fl,len=Math.min(fl*2,n-st-maxLag);if(len<fl)continue;
    let e0=0;for(let j=0;j<len;j++)e0+=d[st+j]*d[st+j];
    let best=0;
    for(let lag=minLag;lag<=maxLag;lag++){let c=0,e1=0;for(let j=0;j<len;j+=2){const w=d[st+j+lag];c+=d[st+j]*w;e1+=w*w;}R[lag]=c/Math.sqrt((e0/2)*e1+1e-12);if(R[lag]>best)best=R[lag];}
    /* take the first strong peak (the true pitch), not a multiple of it */
    let bl=0;for(let lag=minLag+1;lag<maxLag;lag++){if(R[lag]>=best*.9&&R[lag]>=R[lag-1]&&R[lag]>=R[lag+1]){bl=lag;break;}}
    if(best>.5&&bl){voiced++;f0s+=sr/bl;f0n++;}
  }
  const bursts=[];let on=false,s0=0;
  for(let i=0;i<N;i++){if(!on&&sm[i]>=thr){on=true;s0=i;}else if(on&&sm[i]<thr*.7){on=false;bursts.push([s0,i]);}}
  if(on)bursts.push([s0,N]);
  const merged=[];bursts.forEach(b=>{const l=merged[merged.length-1];if(l&&b[0]-l[1]<4)l[1]=b[1];else merged.push(b.slice());});
  const syl=merged.length,dur=act*.02,vr=act?voiced/act:0,f0=f0n?f0s/f0n:0;
  const lens=merged.map(b=>(b[1]-b[0])*.02),meanLen=lens.reduce((a,b)=>a+b,0)/Math.max(1,syl);
  const gaps=merged.slice(1).map((b,i)=>(b[0]-merged[i][0])*.02),gm=gaps.reduce((a,b)=>a+b,0)/Math.max(1,gaps.length);
  const cv=gaps.length>1?Math.sqrt(gaps.reduce((a,g)=>a+(g-gm)*(g-gm),0)/gaps.length)/gm:1;
  const info={syl,dur:+dur.toFixed(2),voiced:+vr.toFixed(2),f0:Math.round(f0),cv:+cv.toFixed(2)};
  if(dur<.15)return {ok:false,why:'short',...info};
  if(vr<.3)return {ok:false,why:'noise',...info};
  if(f0>650)return {ok:false,why:'squeal',...info};
  if(syl===1&&lens[0]>1.8)return {ok:false,why:'long',...info};
  if(syl>E+3)return {ok:false,why:'laugh',...info};
  if(syl>=4&&cv<.3&&meanLen<.18)return {ok:false,why:'laugh',...info};
  if(syl>=E+2&&vr<.55)return {ok:false,why:'laugh',...info};
  return {ok:true,...info};
}
function learnEcho(a,b){
  const sr=ac.sampleRate,data=grab(a,b);
  if(!data||data.length<sr*.25){lt.phase='listen';lt.on=0;lt.wait=performance.now();return;}
  const E=Math.max(1,(learnPhrase().match(/[аеёиоуыэюя]/gi)||[]).length);
  const res=analyzeSpeech(data,sr,E);lt.lastCheck=res;
  let peak=0;for(let i=0;i<data.length;i++)peak=Math.max(peak,Math.abs(data[i]));
  const buf=ac.createBuffer(1,data.length,sr);buf.copyToChannel(data,0);
  const src=ac.createBufferSource(),g=ac.createGain();src.buffer=buf;src.playbackRate.value=1.45;
  g.gain.value=Math.min(4,.8/Math.max(peak,.01))*vol();src.connect(g);g.connect(ac.destination);
  talkUntil=Date.now()+data.length/sr/1.45*1000+500;lt.src=src;setLP('talk');
  src.onended=()=>{lt.src=null;setTimeout(()=>{
    if(state.mode!=='learn'||lt.phase==='praise')return;
    if(res.ok){lt.attempts=(lt.attempts||0)+1;setAttn(true);}
    lt.reprompts=0;learnModel('answer');   /* always show the right phrase again, then keep listening */
  },350);};
  src.start();
}
function setAttn(on){document.querySelectorAll('[data-act="learnsaid"],[data-act="learntry"]').forEach(b=>b.classList.toggle('attn',on));
  const h=document.getElementById('lhint');if(h&&on)h.textContent='Похоже на попытку сказать. Нажмите «Сказала» или «Пробовала».';}
function learnPraise(kind){
  if(state.mode!=='learn'||lt.phase==='praise')return;
  lt.phase='praise';setLP('talk');setAttn(false);
  const o=document.querySelector('#lobj>span,#lobj .subj');if(o)anim(o,'pop');
  const L=learnItem(),word=kind==='said'?'Молодец!':'Хорошо!';
  speakSeq(lt.lvl===4?[learnPhrase(),`${L.n} ${L.v}!`,word]:[learnPhrase(),word],()=>setLP('idle'));
  if(kind==='said')lvResult('learn',true);
  state.stars++;document.getElementById('stars').innerHTML=starsHTML();
  lt.timer=afterSpeech(()=>{if(state.mode!=='learn')return;
    if(state.stars>=5)party(()=>{if(state.mode==='learn'){state.stars=0;pickLearn();render();lt.timer=setTimeout(()=>learnModel('ask'),700);}});
    else{pickLearn();render();lt.timer=setTimeout(()=>learnModel('ask'),700);}},1500);
}
function learnTry(){
  if(!lt)return;dictTry(learnPhrase(),'Попугай учит');toast('Отмечено: пробовала 👍');
  if(lt.phase!=='praise'){if(lt.src){try{lt.src.stop();}catch(e){}lt.src=null;}learnPraise('try');}
}
function learnSaid(){
  if(!lt)return;dictSaid(learnPhrase(),'Попугай учит');toast('Записано в словарик ⭐');
  if(lt.phase!=='praise'){if(lt.src){try{lt.src.stop();}catch(e){}lt.src=null;}learnPraise('said');}
}
function learnNext(){if(!lt)return;if(lt.phase!=='praise'&&!lt.attempts)lvResult('learn',false);clearTimeout(lt.timer);if(lt.src){try{lt.src.stop();}catch(e){}lt.src=null;}stopAudio();if(synth)synth.cancel();pickLearn();render();lt.timer=setTimeout(()=>learnModel('ask'),400);}
