/* ---------- talk menu ---------- */
const TALK_GAMES=[['learn','🦜','Попугай учит','«Мяч прыгает!» — попугай говорит, ты повторяешь'],['parrot','🦜','Попугай-повторюшка','Свободная игра: попугай повторяет всё смешным голосом'],['finish','💬','Договори','«Корова говорит…» — и ждём'],['choose','🗣️','Что хочешь?','«Хочешь мячик или машинку?»'],['levels','📈','Уровни','Для взрослых: на каком она уровне и как поменять'],['dict','📚','Словарик успехов','Для взрослых: какие слова она уже пробовала и говорила']];
function talkMenuHTML(){
  return `<section class="home">
    <header class="bar"><button class="back" data-act="home">← Назад</button><div class="title">Говорим</div></header>
    <div class="lvls">${TALK_GAMES.map(([a,i,t,ex])=>`<button class="lvl" data-act="${a}"><span class="li">${em(i)}</span><b>${t}</b><small>${ex}</small></button>`).join('')}</div>
    <div class="grown">
      ${seg('Чувствительность микрофона','micSens',[['low','низкая'],['mid','средняя'],['high','высокая']])}
      <p class="tip">Первые две игры слушают микрофон: iPad спросит разрешение. Слова игра не распознаёт, засчитывается любой звук голоса, даже тихое «а». Если реагирует на шум вокруг, поставьте чувствительность пониже, если не слышит ребёнка, повыше.</p>
      <p class="tip">Главное правило: не просить «скажи правильно». Радуемся любой попытке, а сами говорим простые слова и звуки, чтобы ей было что повторить. В «Договори» и «Что хочешь?» засчитываете вы: нажмите, когда она попробовала сказать.</p>
    </div>
  </section>`;
}

/* ---------- say something and it happens ---------- */
const BLOW=[{e:'🎈',kind:'grow',say:'Скажи что-нибудь, и шарик надуется!',done:'Молодец!'},
  {e:'🚗',kind:'drive',say:'Скажи что-нибудь, и машинка поедет!',done:'Приехали!'},
  {e:'🌱',kind:'flower',say:'Скажи что-нибудь, и цветочек вырастет!',done:'Какой цветочек!'}];
let vb=null;
function startBlow(){
  state.mode='blow';vb={i:0,p:0,done:false,err:false,raf:0,timer:null};render();
  startMic().then(ok=>{
    if(state.mode!=='blow')return;
    if(!ok){vb.err=true;render();return;}
    mic.onFrame=(m,n)=>{if(!vb||vb.done)return;if(m.voice){vb.p=Math.min(1,vb.p+n/ac.sampleRate/2.2);}};
    say(BLOW[vb.i].say);blowLoop();
  });
}
function blowHTML(){
  const S=BLOW[vb.i];
  if(vb.err)return `<header class="bar">${holdBack()}<div class="title">Скажи, и случится</div></header><main class="stage"><p class="warn" style="max-width:52ch;font-size:20px">${MIC_ERR}</p></main>`;
  const inner=S.kind==='drive'
    ?`<div class="vroad"></div><div class="vobj" style="left:86%;top:58%">${em('🏠')}</div><div class="vobj" id="vobj" style="left:14%;top:62%;--sc:.7">${em(S.e)}</div>`
    :`<div class="vobj" id="vobj" style="left:50%;top:${S.kind==='flower'?62:52}%;--sc:.45">${em(S.e)}</div>`;
  return `<header class="bar">${holdBack()}<div class="title">Скажи, и случится</div><button class="ctl" data-act="nextblow" aria-label="Дальше">${em('➡️')}</button></header>
  <div class="q">Скажи что-нибудь!</div>
  <main class="stage" id="stage"><div class="scene">${inner}</div></main>
  <div class="vubar"><div class="vu" id="vu">${em('🎤')}</div></div>`;
}
function blowLoop(){
  if(state.mode!=='blow'||!vb)return;
  const o=document.getElementById('vobj'),vu=document.getElementById('vu'),S=BLOW[vb.i];
  if(vu&&mic)vu.style.setProperty('--lv',Math.min(1,mic.voice?mic.level*14:0).toFixed(2));
  if(o&&!vb.done){
    if(S.kind==='grow')o.style.setProperty('--sc',(.45+vb.p*.8).toFixed(3));
    if(S.kind==='drive')o.style.left=(14+vb.p*62)+'%';
    if(S.kind==='flower')o.style.setProperty('--sc',(.45+vb.p*.9).toFixed(3));
    if(vb.p>=1)blowDone(o,S);
  }
  vb.raf=requestAnimationFrame(blowLoop);
}
function blowDone(o,S){
  vb.done=true;
  if(S.kind==='grow')o.classList.add('fly');
  if(S.kind==='flower'){o.innerHTML=em('🌸');anim(o,'pop');}
  softChime();setTimeout(()=>say(S.done),700);
  vb.timer=setTimeout(nextBlow,4000);
}
function nextBlow(){if(state.mode!=='blow')return;clearTimeout(vb.timer);vb.i=(vb.i+1)%BLOW.length;vb.p=0;vb.done=false;render();say(BLOW[vb.i].say);}

/* ---------- parrot: repeats what she says in a funny voice ---------- */
let pr=null;
function startParrot(){
  state.mode='parrot';pr={phase:'idle',on:0,err:false,src:null};render();
  startMic().then(ok=>{
    if(state.mode!=='parrot')return;
    if(!ok){pr.err=true;render();return;}
    mic.onFrame=parrotFrame;setParrot('idle');say('Скажи что-нибудь попугаю!');
  });
}
function parrotHTML(){
  if(pr.err)return `<header class="bar">${holdBack()}<div class="title">Попугай-повторюшка</div></header><main class="stage"><p class="warn" style="max-width:52ch;font-size:20px">${MIC_ERR}</p></main>`;
  return `<header class="bar">${holdBack()}<div class="title">Попугай-повторюшка</div></header>
  <div class="q" id="pq">Скажи что-нибудь попугаю!</div>
  <main class="stage" id="stage"><div class="parrot idle" id="parrot">${em('🦜')}</div></main>
  <div class="vubar"><div class="vu" id="vu">${em('🎤')}</div></div>`;
}
function setParrot(ph){
  const el=document.getElementById('parrot'),q=document.getElementById('pq');if(!el)return;
  el.className='parrot '+ph;q.textContent=ph==='rec'?'Слушаю…':ph==='talk'?'':'Скажи что-нибудь попугаю!';
}
function parrotFrame(m){
  if(!pr)return;const now=performance.now(),sr=ac.sampleRate;
  const vu=document.getElementById('vu');if(vu)vu.style.setProperty('--lv',Math.min(1,m.voice?m.level*14:0).toFixed(2));
  if(pr.phase==='idle'){
    if(m.voice){pr.on++;if(pr.on>=2){pr.phase='rec';pr.start=Math.max(0,m.total-Math.round(sr*.35));pr.t0=now;pr.last=now;setParrot('rec');}}
    else pr.on=0;
  }else if(pr.phase==='rec'){
    if(m.voice)pr.last=now;
    if(now-pr.last>700||now-pr.t0>4000){
      const end=m.total-Math.round(sr*Math.max(0,(now-pr.last)/1000-.15));
      pr.phase='play';playParrot(pr.start,end);
    }
  }
}
function playParrot(a,b){
  const sr=ac.sampleRate,data=grab(a,b);
  if(!data||data.length<sr*.25){pr.phase='idle';pr.on=0;setParrot('idle');return;}
  let peak=0;for(let i=0;i<data.length;i++)peak=Math.max(peak,Math.abs(data[i]));
  const buf=ac.createBuffer(1,data.length,sr);buf.copyToChannel(data,0);
  const src=ac.createBufferSource(),g=ac.createGain();src.buffer=buf;src.playbackRate.value=1.45;
  g.gain.value=Math.min(4,.8/Math.max(peak,.01))*vol();src.connect(g);g.connect(ac.destination);
  talkUntil=Date.now()+data.length/sr/1.45*1000+500;pr.src=src;setParrot('talk');
  src.onended=()=>{pr.src=null;setTimeout(()=>{if(state.mode!=='parrot')return;pr.phase='idle';pr.on=0;setParrot('idle');},400);};
  src.start();
}

/* ---------- finish the word ---------- */
/* level 1: animal and vehicle sounds  [picture, prompt, spoken sound, sound effect] */
const FINISH=[['🐮','Корова говорит…','Му, му!'],['🐱','Кошка говорит…','Мяу, мяу!'],['🐶','Собака говорит…','Гав, гав!'],['🦆','Утка говорит…','Кря, кря!'],
  ['🐷','Свинка говорит…','Хрю, хрю!'],['🐸','Лягушка говорит…','Ква, ква!'],['🐑','Овечка говорит…','Бе, бе!'],['🚗','Машина гудит…',null,'car'],['🚂','Поезд едет…',null,'train']];
/* level 2: finish the word  [picture, start, ending, whole word] */
const FINISH2=[['🐱','Кто это?','Кошка','Кошка'],['🐶','Кто это?','Собака','Собака'],['🐮','Кто это?','Корова','Корова'],['🦆','Кто это?','Утка','Утка'],
  ['🐸','Кто это?','Лягушка','Лягушка'],['🐷','Кто это?','Свинка','Свинка'],['🚗','Что это?','Машина','Машина'],['⚽','Что это?','Мяч','Мяч'],
  ['🍎','Что это?','Яблоко','Яблоко'],['🍌','Что это?','Банан','Банан'],['🧸','Кто это?','Мишка','Мишка'],['🎈','Что это?','Шарик','Шарик']];
/* level 3: familiar phrases and folk rhymes  [picture, start, missing word, whole phrase] */
const FINISH3=[['🔢','Раз, два…','три','Раз, два, три!'],['👏','Ладушки, ладушки! Где были?','У бабушки','Ладушки, ладушки! Где были? У бабушки!'],
  ['🌙','Спокойной…','ночи','Спокойной ночи!'],['☀️','Доброе…','утро','Доброе утро!'],['👋','Пока-…','пока','Пока-пока!'],
  ['🍽️','Приятного…','аппетита','Приятного аппетита!'],['🎉','С днём…','рождения','С днём рождения!'],['🐻','Мишка косолапый по лесу…','идёт','Мишка косолапый по лесу идёт!']];
let fn=null;
const finishPool=()=>fn.lvl===1?FINISH:fn.lvl===2?FINISH2:FINISH3;
const finishItem=()=>finishPool()[fn.i%finishPool().length];
function startFinish(){state.mode='finish';state.stars=0;fn={last:-1,i:0,busy:false,timer:null,lvl:lv('finish')};newFinish();}
function newFinish(){
  clearTimeout(fn.timer);fn.lvl=lv('finish');const n=finishPool().length;let i;do{i=Math.floor(Math.random()*n);}while(i===fn.last&&n>1);
  fn.last=i;fn.i=i;fn.busy=false;render();fn.timer=setTimeout(()=>{if(state.mode==='finish')say(finishItem()[1]);},400);
}
/* the full answer, said as a hint or after success */
function finishSound(pre){
  const F=finishItem();pre=pre||[];
  if(fn.lvl===1){if(F[2])speakSeq([...pre,F[2]]);else speakSeq(pre,()=>FX[F[3]]());}
  else speakSeq([...pre,F[3]]);
}
function finishHTML(){
  const F=finishItem();
  return `<header class="bar">${holdBack()}<div class="stars" id="stars">${starsHTML()}</div><button class="ctl" data-act="finishask" aria-label="Повторить">${em('🔊')}</button></header>
  <div class="q">${F[1]}</div>
  <main class="stage" id="stage"><div class="choicecards"><div class="bigcard" id="fcard" style="--s:min(42vmin,300px);--c:${COLORS[fn.i%COLORS.length]}">${em(F[0])}</div><div class="bubble">?</div></div></main>
  <p class="hintline">${fn.lvl===1?'Подождите 5–10 секунд. Засчитывается любой звук или слог.':fn.lvl===2?'Ждём название: «кошка», «мяч». Подойдёт и начало слова, например «ко».':'Ждём пропущенное слово. Подойдёт и его начало.'}</p>
  <div class="pbar"><button class="pbtn ok" data-act="finishok">✓ Получилось</button><button class="pbtn" data-act="finishhint">${em('🔊')} Подсказка</button><button class="pbtn" data-act="finishnext">⏭ Другое</button></div>`;
}
function finishOk(){
  if(!fn||fn.busy)return;fn.busy=true;
  const c=document.getElementById('fcard');if(c)anim(c,'pop');finishSound(['Да!']);
  const F=finishItem();
  dictTry(fn.lvl===1?(F[2]?F[2].split(',')[0]:({car:'Би-би',train:'Чух-чух'})[F[3]])+' ('+F[1].split(' ')[0].toLowerCase()+')':fn.lvl===2?F[3]:F[2],'Договори');
  lvResult('finish',true);
  state.stars++;document.getElementById('stars').innerHTML=starsHTML();
  fn.timer=afterSpeech(()=>{if(state.mode!=='finish')return;if(state.stars>=5)party(()=>{if(state.mode==='finish'){state.stars=0;newFinish();}});else newFinish();},2500);
}

/* ---------- what do you want? ---------- */
const WANTS=[['⚽','мячик','мячик'],['toy-mashinka','машинка','машинку'],['🧸','мишка','мишку'],['🎈','шарик','шарик'],['🍎','яблоко','яблоко'],
  ['🍌','банан','банан'],['🧀','сыр','сыр'],['🐟','рыбка','рыбку'],['🍓','клубничка','клубничку'],['🐥','цыплёнок','цыплёнка']];
let ch=null;
function startChoose(){state.mode='choose';state.stars=0;ch={pair:[0,1],busy:false,timer:null,lvl:lv('choose')};newChoose();}
function newChoose(){
  clearTimeout(ch.timer);ch.lvl=lv('choose');const n=ch.lvl===3?3:2,pick=[];
  while(pick.length<n){const k=Math.floor(Math.random()*WANTS.length);if(!pick.includes(k))pick.push(k);}
  ch.pair=pick;ch.busy=false;render();ch.timer=setTimeout(askChoose,400);
}
function askChoose(){
  if(state.mode!=='choose')return;const w=ch.pair.map(k=>WANTS[k][2]);
  const q=w.length===3?`Хочешь ${w[0]}, ${w[1]} или ${w[2]}?`:`Хочешь ${w[0]} или ${w[1]}?`;
  speakSeq(ch.lvl===2?[q,'Скажи: дай!']:[q]);
}
function chooseHTML(){
  const big=ch.pair.length===3?'min(28vmin,230px)':'min(36vmin,280px)';
  return `<header class="bar">${holdBack()}<div class="stars" id="stars">${starsHTML()}</div><button class="ctl" data-act="chooseask" aria-label="Повторить вопрос">${em('🔊')}</button></header>
  <div class="q">${ch.lvl===2?'Скажи: «Дай…»':'Что хочешь?'}</div>
  <main class="stage" id="stage"><div class="choicecards">${ch.pair.map((k,j)=>`<button class="bigcard" data-want="${j}" style="--s:${big};--c:${COLORS[(k+2)%COLORS.length]}">${em(WANTS[k][0])}<b>${cap(WANTS[k][1])}</b></button>`).join('')}</div></main>
  <p class="hintline">${ch.lvl===2?'Засчитывайте, если она попробовала сказать «дай» или название. Можно подсказать: «Дай мячик».':'Нажмите на картинку, когда она попробует сказать слово. Если только показала пальцем, назовите слово сами и подождите.'}</p>`;
}
function chooseTap(j){
  if(!ch||ch.busy)return;ch.busy=true;const W=WANTS[ch.pair[j]];
  document.querySelectorAll('[data-want]').forEach((b,k)=>{if(k===j)anim(b,'pop');else b.classList.add('dim');});
  speakSeq(ch.lvl===2?[`Дай ${W[2]}!`,`Держи ${W[2]}!`]:[cap(W[1])+'!',`Держи ${W[2]}!`]);dictTry(ch.lvl===2?`Дай ${W[2]}`:cap(W[1]),'Что хочешь?');
  lvResult('choose',true);
  state.stars++;document.getElementById('stars').innerHTML=starsHTML();
  ch.timer=afterSpeech(()=>{if(state.mode!=='choose')return;if(state.stars>=5)party(()=>{if(state.mode==='choose'){state.stars=0;newChoose();}});else newChoose();},1800);
}
