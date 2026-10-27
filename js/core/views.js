/* ---------- views ---------- */
const cat=()=>CATS[state.cat];
function chips(){return Object.entries(CATS).filter(([k,c])=>c.items.length&&(!c.hidden||state.mode==='record')).map(([k,c])=>`<button class="chip ${k===state.cat?'on':''}" data-cat="${k}" aria-pressed="${k===state.cat}"><span class="ci">${em(c.icon)}</span>${c.name}</button>`).join('');}
function seg(label,key,opts){return `<div class="seg"><span class="segl">${label}</span><div class="segb">${opts.map(([v,t])=>`<button data-set="${key}" data-val="${esc(v)}" class="${String(state[key])===String(v)?'on':''}">${esc(t)}</button>`).join('')}</div></div>`;}
function voiceSeg(){
  if(!ruVoices.length)return '';
  const cur=currentVoice(),lab=['','обычный','улучшенный ★','премиум ★★'];
  return `<div class="seg"><span class="segl">Голос</span><div class="segb">${ruVoices.slice().sort((a,b)=>vq(b)-vq(a)).map(v=>`<button data-voice="${esc(v.voiceURI)}" class="${cur&&cur.voiceURI===v.voiceURI?'on':''}">${esc(v.name.replace(/\s*\(.*\)/,''))}, ${lab[vq(v)]}</button>`).join('')}</div><button class="rb" data-act="testvoice">▶ Проверить</button></div>`;
}
function voiceTip(){
  if(!synth||!ruVoices.length)return '';
  if(Math.max(...ruVoices.map(vq))>1)return '';
  return `<div class="grown"><h2>🔈 Голос звучит как робот?</h2><p class="tip">Сейчас на iPad установлен только простой русский голос. Скачайте улучшенный, он звучит намного живее: Настройки → Универсальный доступ → Устный контент → Голоса → Русский → Милена → «улучшенный» или «премиум», загрузить. Потом полностью закройте игру и откройте снова. А ещё лучше запишите свой голос в настройках для взрослых.</p></div>`;
}
function homeHTML(){
  const nRec=Object.keys(recURL).length;
  return `<section class="home">
    <div class="hero"><div class="hero-emo"><span>${em('🐰')}</span><span>${em('🐻')}</span><span>${em('🐸')}</span></div><h1>Покажи и скажи</h1></div>
    <div class="cats">${chips()}</div>
    ${state.homeMsg?`<p class="warn">${esc(state.homeMsg)}</p>`:''}
    ${voiceTip()}
    <div class="modes">${MODES.filter(m=>state.games[m[0]]).map(([k,c,i,t])=>`<button class="mode ${c}" data-act="${k}"><span class="mi">${em(i)}</span><span>${t}</span></button>`).join('')}</div>
    <details class="adult" ${state.adultOpen?'open':''}><summary>⚙️ Для взрослых: семья, свой голос, настройки</summary>
    <div class="grown">
      <h2>Для взрослого: семья и свой голос</h2>
      <p class="tip">Добавьте фото близких: появится раздел «Семья» во всех играх. А ещё можно записать своим голосом слова и фразы игры («Молодец!», числа, цвета), и игра будет говорить им вместо компьютерного.${nRec?` Записано: ${nRec}.`:''}</p>
      <div class="cats"><button class="big-rec" data-act="family" style="background:#CAFFBF">👪 Фото семьи${CATS.family.items.length?` (${CATS.family.items.length})`:''}</button><button class="big-rec" data-act="levels" style="background:#FFE08A">📈 Уровни</button><button class="big-rec" data-act="sync" style="background:#BFE3FF">🔄 Голос на всех устройствах</button><button class="big-rec" data-act="record">${em('🎙')} Записать свой голос</button></div>
    </div>
    <div class="grown">
      <h2>Для взрослого: настройки</h2>
      ${seg('Спокойный режим','calm',[[1,'включён'],[0,'выключен']])}
      <p class="tip">Спокойный режим: без фанфар и конфетти, мягкие медленные анимации, звуки тише. Подходит, если сильные эмоции перевозбуждают ребёнка.</p>
      ${seg('Таймер игры','sessMin',[[0,'выкл'],[5,'5 минут'],[10,'10 минут'],[15,'15 минут']])}
      ${seg('Что будет потом','nextAct',Object.entries(NEXT_ACTS).map(([k,v])=>[k,v[0]]))}
      <p class="tip">Таймер включается, когда ребёнок начинает любую игру. Сверху появляется тонкая полоска: она уменьшается и желтеет ближе к концу. За минуту до конца игра скажет «Скоро игра закончится», а в конце спокойно покажет, что будет дальше: «Всё! Теперь кушать!».</p>
      ${seg('Герой в «Сделай как я»','hero',[['girl','девочка'],['boy','мальчик']])}
      ${gamesSeg()}
      ${voiceSeg()}
      ${seg('Звуки животных и машин','sounds',[[1,'включены'],[0,'только слово']])}
      ${seg('Скорость голоса','rate',[[0.75,'медленно'],[0.9,'обычно']])}
      ${seg('Картинок на странице в «Нажимай и слушай»','listenCount',[[4,'4'],[6,'6'],[99,'все']])}
      <p class="tip">Чтобы выйти из игры, держите кнопку «Назад» одну секунду: так ребёнок не выйдет случайно. Голоса со звёздочкой звучат естественнее; если их нет, улучшенный голос можно скачать: Настройки → Универсальный доступ → Устный контент → Голоса → Русский.</p>
      ${!synth?'<p class="warn">Этот браузер не умеет озвучивать слова. Откройте страницу в Safari или запишите свой голос.</p>':''}
      ${synth&&synth.getVoices().length>0&&!ruVoices.length?'<p class="warn">На устройстве не найден русский голос. Его можно добавить: Настройки → Универсальный доступ → Устный контент → Голоса → Русский.</p>':''}
    </div>
    </details>
  </section>`;
}
function holdBack(){return `<button class="back" id="back" aria-label="Назад (держите)"><span class="fill"></span><span class="bl">← Назад</span></button>`;}
function cardHTML(it,i){return `<button class="card" data-i="${i}" style="--c:${it.c}" aria-label="${esc(it.w)}">${it.img?`<img class="ph" src="${it.img}" alt="">`:`<span class="emo"${it.sc?` style="font-size:calc(var(--s)*${(.5*it.sc).toFixed(3)})"`:''}>${em(it.e)}</span>`}${it.hide?'':`<span class="word">${esc(it.w)}</span>`}</button>`;}
/* pictures always in the same order, page by page: arrows, swipe, and dots showing where you are */
const listenPages=()=>Math.max(1,Math.ceil(cat().items.length/Math.min(state.listenCount,cat().items.length)));
function listenHTML(){
  const pages=listenPages(),pg=Math.min(state.listenPage||0,pages-1);
  return `<header class="bar">${holdBack()}<div class="title"><span>${em(cat().icon)}</span>${cat().name}</div></header>
  <main class="stage pstage" id="stage">
    ${pages>1?`<button class="pgbtn left" data-act="pgprev" aria-label="Назад" ${pg===0?'disabled':''}>‹</button>`:''}
    <div class="grid" id="grid">${state.listenItems.map(cardHTML).join('')}</div>
    ${pages>1?`<button class="pgbtn right" data-act="pgnext" aria-label="Дальше" ${pg===pages-1?'disabled':''}>›</button>`:''}
  </main>
  ${pages>1?`<div class="pdots">${Array.from({length:pages},(_,i)=>`<span class="${i===pg?'on':''}"></span>`).join('')}</div>`:''}`;
}
function goPage(d){const pages=listenPages(),n=Math.max(0,Math.min(pages-1,(state.listenPage||0)+d));if(n===state.listenPage)return;state.listenPage=n;pickListen();render();}
function wireSwipe(){
  const st=document.getElementById('stage');if(!st)return;let x0=null,y0=0;
  st.addEventListener('pointerdown',e=>{x0=e.clientX;y0=e.clientY;});
  st.addEventListener('pointerup',e=>{if(x0===null)return;const dx=e.clientX-x0,dy=e.clientY-y0;x0=null;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.5)goPage(dx<0?1:-1);});
}
function starsHTML(){return em('⭐').repeat(state.stars)+`<span class="dim">${em('⭐')}</span>`.repeat(5-state.stars);}
function findHTML(){
  return `<header class="bar">${holdBack()}<div class="stars" id="stars">${starsHTML()}</div><button class="ctl" data-act="repeat" aria-label="Повторить вопрос">${em('🔊')}</button></header>
  <div class="q">${esc(findQ(state.target))}</div>
  <main class="stage" id="stage"><div class="grid" id="grid">${state.options.map(cardHTML).join('')}</div></main>`;
}
function recordHTML(){
  const rows=cat().items.map((it,i)=>{
    const has=!!recURL[it.key], on=state.recKey===it.key, other=state.recKey&&!on;
    const suggestion=it.ph?it.w:it.hint?`${it.w}! ${it.hint}!`:`${it.w}!`;
    return `<div class="row">
      <div class="re" style="--c:${it.c}">${it.img?`<img src="${it.img}" alt="">`:em(it.e)}</div>
      <div class="rt"><b>${esc(it.w)}</b><small>${it.ph?'Скажите':'Скажите, например'}: «${esc(suggestion)}»</small>${has?'<span class="has">✓ Записан ваш голос</span>':''}</div>
      <button class="rb ${on?'recording':'rec'}" data-rec="${i}" ${other?'disabled':''}>${on?'⏹ Стоп':em('🎙')+' Записать'}</button>
      <button class="rb" data-play="${i}" ${has&&!state.recKey?'':'disabled'} aria-label="Послушать">▶</button>
      <button class="rb" data-del="${i}" ${has&&!state.recKey?'':'disabled'} aria-label="Удалить запись">🗑</button>
    </div>`;}).join('');
  return `<header class="bar"><button class="back" data-act="home">← Назад</button><div class="title">Свой голос</div></header>
  <div class="cats small">${chips()}</div>
  ${state.recError?`<p class="warn">${esc(state.recError)}</p>`:'<p class="tip">Нажмите «Записать», скажите фразу весело и чуть медленнее обычного, потом нажмите «Стоп». Запись сразу проиграется, чтобы вы могли проверить. Записи хранятся только на этом iPad. В разделе «Фразы игры» то, что игра говорит чаще всего: похвала, числа, цвета.</p>'}
  <div class="recwrap">${rows}</div>`;
}
function familyHTML(){
  const items=CATS.family.items,d=state.famDraft,ok=d&&(state.famName||'').trim();
  return `<header class="bar"><button class="back" data-act="home">← Назад</button><div class="title">Фото семьи</div></header>
  <p class="tip">Подпишите фото так, как ребёнок называет человека: «Мама», «Папа», «Баба». Фото хранятся только на этом iPad и никуда не отправляются. Имена можно озвучить своим голосом: «Записать свой голос», раздел «Семья».</p>
  <div class="famadd">
    <button class="famph" data-act="fampick" aria-label="Выбрать фото">${d?`<img src="${d.url}" alt="">`:em('📷')+'<span>Выбрать фото</span>'}</button>
    <div class="famf"><input id="famname" type="text" placeholder="Кто это? Например: Мама" value="${esc(state.famName||'')}" maxlength="30" autocomplete="off" autocorrect="off">
      <button class="big-rec" data-act="famadd" style="background:#CAFFBF" ${ok?'':'disabled'}>Добавить</button></div>
    <input id="famfile" type="file" accept="image/*" hidden>
  </div>
  ${state.famErr?`<p class="warn">${esc(state.famErr)}</p>`:''}
  <div class="recwrap">${items.map((it,i)=>`<div class="row"><div class="re" style="--c:${it.c}"><img src="${it.img}" alt=""></div><div class="rt"><b>${esc(it.w)}</b></div><button class="rb" data-famdel="${i}" aria-label="Удалить">🗑</button></div>`).join('')}</div>`;
}
function rhythmHTML(){
  return `<header class="bar">${holdBack()}<div class="stars" id="stars">${starsHTML()}</div><button class="ctl" data-act="rhreplay" aria-label="Послушать ещё раз">${em('🔊')}</button></header>
  <div class="q" id="rhq">Послушай</div><div class="beats" id="beats"></div>
  <main class="stage"><button class="drum" id="drum" aria-label="Барабан">${em('🥁')}</button></main>`;
}
var settingsLoaded=false;
var SAVE_KEYS=['levels','micSens','hero','calm','sessMin','nextAct','listenCount','choices','rate','sounds','voiceURI','countLevel','jumpHint','jumpLevel','jumpLayout','games','drawAcc'];
function loadSettings(){
  try{const o=JSON.parse(localStorage.getItem('pokazhi-settings')||'{}');
    SAVE_KEYS.forEach(k=>{if(o[k]===undefined)return;state[k]=(k==='games'||k==='levels')?Object.assign({},state[k],o[k]):o[k];});
    if(o.learnLevel&&!o.levels)state.levels.learn=o.learnLevel;
    const ol=o.levels||{};
    if(o.countLevel&&!ol.count)state.levels.count=o.countLevel;
    if(o.jumpLevel&&!ol.jump)state.levels.jump=o.jumpLevel;
    if(o.drawAcc&&!ol.draw)state.levels.draw=({easy:1,mid:2,hard:3})[o.drawAcc]||2;}catch(e){}
  settingsLoaded=true;
}
function saveSettings(){if(!settingsLoaded)return;try{const o={};SAVE_KEYS.forEach(k=>o[k]=state[k]);localStorage.setItem('pokazhi-settings',JSON.stringify(o));}catch(e){}}
var MODES=[['listen','m1','👆','Нажимай и слушай'],['find','m2','🔍','Найди картинку'],['talkmenu','m10','🗣️','Говорим'],['hear','m7','👂','Кто это?'],['copy','m8','🙌','Сделай как я'],['drawmenu','m3','✏️','Рисуем пальцем'],['count','m5','🔢','Считаем'],['jump','m6','🟥','Цветной коврик'],['dandelion','m11','🌼','Подуй!'],['rhythm','m4','🥁','Повтори за мной']];
function gamesSeg(){return `<div class="seg"><span class="segl">Игры на главном экране</span><div class="segb">${MODES.map(([k,,,t])=>`<button data-game="${k}" class="${state.games[k]?'on':''}">${t}</button>`).join('')}</div></div>`;}
function render(){
  saveSettings();
  document.body.classList.toggle('calm',!!state.calm);
  sessTick();
  const v=state.mode;
  /* keep the list where it was when the same screen redraws (e.g. after recording a word) */
  const keepScroll=render._last===v?[...app.querySelectorAll('.recwrap,.home')].map(el=>el.scrollTop):null;
  render._last=v;
  setTimeout(()=>{if(keepScroll)app.querySelectorAll('.recwrap,.home').forEach((el,i)=>{if(keepScroll[i]!==undefined)el.scrollTop=keepScroll[i];});},0);
  app.innerHTML=v==='home'?homeHTML():v==='listen'?listenHTML():v==='find'?findHTML():v==='draw'?drawHTML():v==='rhythm'?rhythmHTML():v==='count'?countHTML():v==='jump'?jumpHTML():v==='jumpmenu'?jumpMenuHTML():v==='talkmenu'?talkMenuHTML():v==='sync'?syncHTML():v==='levels'?levelsHTML():v==='dandelion'?dandHTML():v==='learn'?learnHTML():v==='dict'?dictHTML():v==='blow'?blowHTML():v==='parrot'?parrotHTML():v==='finish'?finishHTML():v==='choose'?chooseHTML():v==='brush'?brushHTML():v==='stamps'?stampsHTML():v==='roads'?roadsHTML():v==='hear'?hearHTML():v==='copy'?copyHTML():v==='breathe'?breatheHTML():v==='drawmenu'?drawMenuHTML():v==='scratch'?scratchHTML():v==='paint'?paintHTML():v==='family'?familyHTML():recordHTML();
  if(v==='listen'||v==='find'){wireBack();fitGrid();if(v==='listen')wireSwipe();}
  if(v==='draw'){wireBack();fitBoard();wireCanvas();}
  if(v==='rhythm'){wireBack();wireDrum();updRh(0);}
  if(v==='count'){wireBack();fitGrid();nextHint();}
  if(v==='jump'){wireBack();fitTiles();}
  if(v==='scratch'){wireBack();fitScratch();}
  if(v==='hear'){wireBack();fitGrid();}
  if(v==='copy'){wireBack();}
  if(v==='breathe'){wireBack();}
  if(v==='blow'||v==='parrot'||v==='finish'||v==='choose'||v==='learn'){wireBack();}
  if(v==='dandelion'){wireBack();wireDand();}
  if(v==='brush'){wireBack();fitBrush();}
  if(v==='stamps'){wireBack();fitPlain();wireStamps();}
  if(v==='roads'){wireBack();fitPlain();wireRoads();}
  if(v==='paint'){wireBack();fitPlain();}
}
