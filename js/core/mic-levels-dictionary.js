/* ---------- microphone engine (shared by the speech games) ---------- */
let mic=null,talkUntil=0;
function SENS(){return ({low:5,mid:3.2,high:2.2})[state.micSens]||3.2;}
function gameTalking(){return (synth&&synth.speaking)||!!recSrc||!!audio||Date.now()<talkUntil;}
async function startMic(){
  if(mic)return true;
  const c=AC();if(!c||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return false;
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:false}});
    if(c.state==='suspended')await c.resume();
    const src=c.createMediaStreamSource(stream),proc=c.createScriptProcessor(2048,1,1),mute=c.createGain();mute.gain.value=0;
    src.connect(proc);proc.connect(mute);mute.connect(c.destination);
    const len=Math.round(c.sampleRate*6);
    mic={stream,src,proc,mute,ring:new Float32Array(len),len,pos:0,total:0,level:0,floor:.01,voice:false,onFrame:null};
    proc.onaudioprocess=e=>{
      if(!mic)return;const d=e.inputBuffer.getChannelData(0);let sum=0;
      for(let i=0;i<d.length;i++){const v=d[i];sum+=v*v;mic.ring[mic.pos]=v;mic.pos=(mic.pos+1)%mic.len;}
      mic.total+=d.length;const rms=Math.sqrt(sum/d.length);mic.level=rms;
      if(rms<mic.floor*1.5)mic.floor=mic.floor*.95+rms*.05;else mic.floor=Math.min(mic.floor*1.002,.05);
      mic.voice=!gameTalking()&&rms>Math.max(mic.floor*SENS(),.012);
      mic.onFrame&&mic.onFrame(mic,d.length);
    };
    return true;
  }catch(e){return false;}
}
function stopMic(){if(!mic)return;try{mic.proc.onaudioprocess=null;mic.proc.disconnect();mic.src.disconnect();mic.mute.disconnect();mic.stream.getTracks().forEach(t=>t.stop());}catch(e){}mic=null;}
function grab(a,b){
  const n=b-a;if(n<=0||mic.total-a>mic.len)return null;const out=new Float32Array(n);
  for(let i=0;i<n;i++)out[i]=mic.ring[((mic.pos-(mic.total-(a+i)))%mic.len+mic.len)%mic.len];return out;
}
const MIC_ERR='Не получилось включить микрофон. Разрешите доступ к микрофону, когда iPad спросит. Если игра открыта внутри claude.ai, откройте её по ссылке с GitHub: там микрофон работает.';
function stopVoiceGames(){
  if(vb){cancelAnimationFrame(vb.raf);clearTimeout(vb.timer);}
  if(pr&&pr.src){try{pr.src.stop();}catch(e){}pr.src=null;}
  if(fn)clearTimeout(fn.timer);if(ch)clearTimeout(ch.timer);if(dd){cancelAnimationFrame(dd.raf);clearTimeout(dd.timer);}if(lt){clearTimeout(lt.timer);if(lt.src){try{lt.src.stop();}catch(e){}lt.src=null;}}
  stopMic();
}

/* ---------- levels: go up after 5 good tries, quietly down after 3 misses in a row ---------- */
const LV_GAMES={
  learn:{name:'Попугай учит',names:['Одно слово','Два слова','Три слова','Ответ на вопрос']},
  finish:{name:'Договори',names:['Звукоподражания','Назови, кто это','Знакомые фразы']},
  choose:{name:'Что хочешь?',names:['Из двух','Скажи «Дай…»','Из трёх']},
  find:{name:'Найди картинку',names:['Из двух','Из трёх','Из четырёх','Разные темы','Кто что делает?','Для чего это?','Большой или маленький']},
  copy:{name:'Сделай как я',names:['Показ и голос','Только голос','Два действия']},
  hear:{name:'Кто это?',names:['Из двух','Из трёх','Звери и машины','Звуки дома']},
  count:{name:'Считаем',names:['До трёх, считаем вместе','До трёх, выбрать ответ','До пяти','До десяти','Дай столько']},
  jump:{name:'Цветной коврик',names:['Один цвет','Два цвета подряд','Две ножки','Ножка и ручка']},
  draw:{name:'Обводи по точкам',names:['Легко','Средне','Точно']},
  roads:{name:'Дорожки',names:['Широкая дорога','Средняя','Узкая']}
};
const lvStat={};
function lv(g){return Math.min(LV_GAMES[g].names.length,Math.max(1,state.levels[g]||1));}
function lvReset(g){lvStat[g]={ok:0,bad:0,streak:0};}
function lvResult(g,ok){
  const max=LV_GAMES[g].names.length,st=lvStat[g]||(lvStat[g]={ok:0,bad:0,streak:0});
  if(ok){
    st.ok++;st.streak=0;
    if(st.ok>=5){if(st.bad<=1&&lv(g)<max){state.levels[g]=lv(g)+1;lvReset(g);saveSettings();lvAnnounce(g);return 'up';}lvReset(g);}
  }else{
    st.bad++;st.streak++;
    if(st.streak>=3&&lv(g)>1){state.levels[g]=lv(g)-1;lvReset(g);saveSettings();return 'down';}
  }
  return '';
}
function lvAnnounce(g){
  toast(`Новый уровень: ${LV_GAMES[g].names[lv(g)-1]}`);
  if(speechBusy&&curQueue)curQueue.push('Новый уровень!');else say('Новый уровень!');
}
function levelsHTML(){
  return `<section class="home">
    <header class="bar"><button class="back" data-act="levelsback">← Назад</button><div class="title">Уровни</div></header>
    <div class="grown"><p class="tip">Уровень меняется сам: 5 удачных попыток почти без ошибок — игра переходит выше и говорит «Новый уровень!». 3 неудачи подряд — тихо, без объявления, возвращается на уровень ниже. Здесь можно поставить любой уровень вручную. Уровни есть во всех играх, кроме самых простых: «Нажимай и слушай», «Подуй», раскраски и штампы.</p></div>
    ${Object.entries(LV_GAMES).map(([g,G])=>`<div class="grown lvcard"><h2>${G.name}</h2>
      <div class="segb">${G.names.map((n,i)=>`<button data-lv="${g}:${i+1}" class="${lv(g)===i+1?'on':''}">${i+1}. ${n}</button>`).join('')}</div>
      <span class="lvnow">Сейчас: ${lv(g)}. ${G.names[lv(g)-1]}</span></div>`).join('')}
  </section>`;
}

/* ---------- success dictionary (kept on this device only) ---------- */
function dictLoad(){try{return JSON.parse(localStorage.getItem('pokazhi-dict')||'{}')||{};}catch(e){return {};}}
let DICT=dictLoad();
function dictSave(){try{localStorage.setItem('pokazhi-dict',JSON.stringify(DICT));}catch(e){}}
function dictEntry(w,src){const k=w.toLowerCase().replace(/[!?.]/g,'').trim();return DICT[k]||(DICT[k]={w:w.replace(/[!?.]/g,'').trim(),tries:0,said:null,src});}
function dictTry(w,src){const e=dictEntry(w,src);e.tries++;e.last=Date.now();dictSave();}
function dictSaid(w,src){const e=dictEntry(w,src);if(!e.said)e.said=Date.now();e.last=Date.now();dictSave();}
function toast(t){const o=document.createElement('div');o.className='toast';o.textContent=t;document.body.appendChild(o);setTimeout(()=>o.remove(),1800);}
const fmtDate=t=>new Date(t).toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
function dictHTML(){
  const arr=Object.entries(DICT).sort((a,b)=>(!!b[1].said-!!a[1].said)||((b[1].last||0)-(a[1].last||0)));
  const n=arr.filter(x=>x[1].said).length,t=arr.length-n;
  return `<header class="bar"><button class="back" data-act="home">← Назад</button><div class="title">Словарик успехов</div></header>
  <div class="grown">
    <p class="dictsum">Сказала: ${n} ${formN(n,[0,'слово','слова','слов'])}${t?`, пробовала ещё ${t}`:''}</p>
    <p class="tip">Сюда попадают слова из «Попугай учит» (когда вы нажали «Сказала» или «Пробовала»), из «Договори» и «Что хочешь?». Можно добавить и слова, которые она сказала в жизни. Хранится только на этом iPad.</p>
    <div class="dictadd"><input id="dictin" type="text" placeholder="Новое слово, которое она сказала" maxlength="40" autocomplete="off"><button class="big-rec" data-act="dictadd" style="background:#CAFFBF">Добавить</button></div>
  </div>
  <div class="recwrap">${arr.length?arr.map(([k,e])=>`<div class="row"><div class="rt"><b>${esc(e.w)}</b><small>${e.said?`<span class="chipS ok">сказала ${fmtDate(e.said)}</span>`:'<span class="chipS try">пробовала</span>'}${e.tries?`попыток: ${e.tries}`:''}${e.src?` · ${esc(e.src)}`:''}</small></div>
    <button class="rb" data-dsaid="${esc(k)}">${e.said?'Снять отметку':'✓ Сказала'}</button><button class="rb" data-ddel="${esc(k)}" aria-label="Удалить">🗑</button></div>`).join(''):'<p class="tip">Пока пусто. Слова появятся, когда вы поиграете в «Попугай учит».</p>'}</div>`;
}
