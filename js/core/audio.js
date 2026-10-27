/* ---------- saved recordings (kept on this device only) ---------- */
const recURL={};
let idb=null;
function openDB(){
  if(idb)return Promise.resolve(idb);
  return new Promise((res,rej)=>{
    try{const r=indexedDB.open('pokazhi-i-skazhi',2);
      r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('rec'))d.createObjectStore('rec');if(!d.objectStoreNames.contains('family'))d.createObjectStore('family',{keyPath:'id'});};
      r.onsuccess=()=>{idb=r.result;res(idb);};r.onerror=()=>rej(r.error);
    }catch(e){rej(e);}
  });
}
async function dbDo(mode,fn,store='rec'){const d=await openDB();return new Promise((res,rej)=>{const tx=d.transaction(store,mode);const st=tx.objectStore(store);const r=fn(st);tx.oncomplete=()=>res(r&&r.result);tx.onerror=()=>rej(tx.error);});}
async function loadRecs(){
  try{
    const d=await openDB();
    await new Promise(res=>{
      const tx=d.transaction('rec','readonly');const cur=tx.objectStore('rec').openCursor();
      cur.onsuccess=()=>{const c=cur.result;if(c){recURL[c.key]=URL.createObjectURL(c.value);c.continue();}};
      tx.oncomplete=res;tx.onerror=res;
    });
  }catch(e){}
  render();
}
async function saveRec(key,blob){delete recBuf[key];try{await dbDo('readwrite',st=>st.put(blob,key));}catch(e){}if(recURL[key])URL.revokeObjectURL(recURL[key]);recURL[key]=URL.createObjectURL(blob);
  if(typeof syncPush==='function'&&!SYNC.applying)syncPush(key);}
const famURL={};
async function loadFamily(){
  let rows=[];
  try{const d=await openDB();rows=await new Promise(res=>{const r=d.transaction('family','readonly').objectStore('family').getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>res([]);});}catch(e){}
  for(const id in famURL){URL.revokeObjectURL(famURL[id]);delete famURL[id];}
  rows.sort((a,b)=>a.t-b.t);
  CATS.family.items=rows.map((r,i)=>{famURL[r.id]=URL.createObjectURL(r.blob);return {img:famURL[r.id],w:r.name,s:null,fx:null,hint:null,c:COLORS[i%COLORS.length],key:'family:'+r.id,id:r.id,keep:true};});
  if(state.cat==='family'&&!CATS.family.items.length)state.cat='animals';
  render();
}
function resizeImage(file){
  return new Promise((res,rej)=>{
    const url=URL.createObjectURL(file),im=new Image();
    im.onload=()=>{const w=im.naturalWidth,h=im.naturalHeight,s=Math.min(w,h),out=600;const cv=document.createElement('canvas');cv.width=cv.height=out;
      cv.getContext('2d').drawImage(im,(w-s)/2,(h-s)/2,s,s,0,0,out,out);URL.revokeObjectURL(url);cv.toBlob(b=>b?res(b):rej(),'image/jpeg',0.85);};
    im.onerror=()=>{URL.revokeObjectURL(url);rej();};im.src=url;
  });
}
async function addFamily(){
  const name=(state.famName||'').trim();if(!state.famDraft||!name)return;
  const id=Date.now().toString(36);
  try{await dbDo('readwrite',st=>st.put({id,name,blob:state.famDraft.blob,t:Date.now()}),'family');}
  catch(e){state.famErr='Не получилось сохранить фото на этом устройстве.';render();return;}
  URL.revokeObjectURL(state.famDraft.url);state.famDraft=null;state.famName='';state.famErr=null;
  loadFamily();
}
async function delFamily(it){try{await dbDo('readwrite',st=>st.delete(it.id),'family');}catch(e){}await delRec(it.key);loadFamily();}
async function delRec(key){delete recBuf[key];try{await dbDo('readwrite',st=>st.delete(key));}catch(e){}if(recURL[key])URL.revokeObjectURL(recURL[key]);delete recURL[key];
  if(typeof syncDelete==='function'&&!SYNC.applying)syncDelete(key);}

/* ---------- audio playback ---------- */
let audio=null,speakToken=0,fallbackTimer=null;
const recBuf={};let recSrc=null;
function stopAudio(){speakToken++;speechBusy=false;curQueue=null;clearTimeout(fallbackTimer);if(audio){audio.pause();audio=null;}if(recSrc){try{recSrc.stop();}catch(e){}recSrc=null;}stopFx();}
async function getBuf(key){
  if(recBuf[key])return recBuf[key];
  const c=AC();if(!c)throw 0;
  const ab=await (await fetch(recURL[key])).arrayBuffer();
  recBuf[key]=await c.decodeAudioData(ab);return recBuf[key];
}
function playRecRaw(key,onEnd,tok){
  const end=()=>{if(tok===speakToken)onEnd&&onEnd();};
  getBuf(key).then(b=>{
    if(tok!==speakToken)return;
    const c=AC(),src=c.createBufferSource();src.buffer=b;src.connect(c.destination);
    src.onended=()=>{if(recSrc===src)recSrc=null;end();};recSrc=src;src.start();
  }).catch(()=>{if(tok!==speakToken)return;audio=new Audio(recURL[key]);audio.onended=end;audio.onerror=end;audio.play().catch(end);});
}
function playRec(key){stopAudio();if(synth)synth.cancel();playRecRaw(key,null,speakToken);}


/* real vehicle sounds, generated in the browser (no files needed) */
let ac=null,fxOut=null;
function vol(){return state.calm?0.5:1;}
function AC(){
  if(!ac){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;ac=new C();}
  if(ac.state==='suspended')ac.resume();
  return ac;
}
function stopFx(){if(fxOut){try{fxOut.gain.cancelScheduledValues(0);fxOut.gain.value=0;fxOut.disconnect();}catch(e){}fxOut=null;}}
function newOut(){const c=AC();if(!c)return null;stopFx();fxOut=c.createGain();fxOut.gain.value=0.9*vol();fxOut.connect(c.destination);return fxOut;}
function env(g,t,a,hold,r,peak){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.setValueAtTime(peak,t+a+hold);g.gain.exponentialRampToValueAtTime(0.0001,t+a+hold+r);}
function osc(out,type,f,t,dur,peak,filt){
  const c=ac,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
  let n=o;if(filt){const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=filt;o.connect(fl);n=fl;}
  n.connect(g);g.connect(out);env(g,t,0.02,Math.max(0,dur-0.08),0.06,peak);o.start(t);o.stop(t+dur+0.1);return o;
}
let noiseBuf=null;
function noise(out,t,dur,type,freq,q){
  const c=ac;
  if(!noiseBuf){noiseBuf=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
  const src=c.createBufferSource();src.buffer=noiseBuf;src.loop=true;
  const fl=c.createBiquadFilter();fl.type=type;fl.frequency.setValueAtTime(freq,t);if(q)fl.Q.value=q;
  const g=c.createGain();g.gain.value=0;src.connect(fl);fl.connect(g);g.connect(out);src.start(t);src.stop(t+dur+0.1);
  return {g,fl};
}
const FX={
  car(){const o=newOut();if(!o)return;const t=ac.currentTime+0.02;
    [0,0.3].forEach(d=>{osc(o,'square',415,t+d,0.2,0.12,1800);osc(o,'square',520,t+d,0.2,0.1,1800);});},
  bus(){const o=newOut();if(!o)return;const t=ac.currentTime+0.02;
    [0,0.5].forEach(d=>{osc(o,'sawtooth',233,t+d,0.38,0.12,1200);osc(o,'sawtooth',294,t+d,0.38,0.1,1200);});},
  siren(){const o=newOut();if(!o)return;const t=ac.currentTime+0.02;
    const s=ac.createOscillator(),g=ac.createGain(),fl=ac.createBiquadFilter();s.type='triangle';fl.type='lowpass';fl.frequency.value=2500;
    s.connect(fl);fl.connect(g);g.connect(o);
    for(let i=0;i<4;i++){s.frequency.setValueAtTime(640,t+i*0.6);s.frequency.linearRampToValueAtTime(980,t+i*0.6+0.3);s.frequency.setValueAtTime(980,t+i*0.6+0.3);s.frequency.linearRampToValueAtTime(640,t+i*0.6+0.6);}
    env(g,t,0.05,2.25,0.1,0.25);s.start(t);s.stop(t+2.5);},
  heli(){const o=newOut();if(!o)return;const t=ac.currentTime+0.02;
    const n=noise(o,t,2.2,'lowpass',380,1);
    for(let i=0;i<27;i++){const k=t+i*0.08;const peak=0.9*Math.min(1,(i+3)/8)*Math.min(1,(27-i)/6);n.g.gain.setValueAtTime(peak,k);n.g.gain.exponentialRampToValueAtTime(0.02,k+0.065);}
    osc(o,'sine',70,t,2.1,0.08);},
  plane(){const o=newOut();if(!o)return;const t=ac.currentTime+0.02;
    const n=noise(o,t,2.6,'bandpass',300,0.8);
    n.fl.frequency.exponentialRampToValueAtTime(1400,t+1.3);n.fl.frequency.exponentialRampToValueAtTime(350,t+2.6);
    n.g.gain.setValueAtTime(0.001,t);n.g.gain.exponentialRampToValueAtTime(0.7,t+1.2);n.g.gain.exponentialRampToValueAtTime(0.001,t+2.6);
    const d=ac.createOscillator(),g=ac.createGain();d.type='sawtooth';d.frequency.setValueAtTime(110,t);d.frequency.linearRampToValueAtTime(140,t+1.3);d.frequency.linearRampToValueAtTime(95,t+2.6);
    const fl=ac.createBiquadFilter();fl.type='lowpass';fl.frequency.value=500;d.connect(fl);fl.connect(g);g.connect(o);
    g.gain.setValueAtTime(0.001,t);g.gain.exponentialRampToValueAtTime(0.08,t+1.2);g.gain.exponentialRampToValueAtTime(0.001,t+2.6);d.start(t);d.stop(t+2.7);},
  train(){const o=newOut();if(!o)return;const t=ac.currentTime+0.02;
    const n=noise(o,t,1.8,'bandpass',900,1.2);
    for(let i=0;i<7;i++){const k=t+i*0.24;n.g.gain.setValueAtTime(0.001,k);n.g.gain.exponentialRampToValueAtTime(i%2?0.5:0.8,k+0.03);n.g.gain.exponentialRampToValueAtTime(0.001,k+0.2);}
    const w=t+1.75;[0,0.55].forEach(d=>{osc(o,'sine',740,w+d,0.42,0.12);osc(o,'sine',880,w+d,0.42,0.1);osc(o,'sine',1110,w+d,0.42,0.06);});},
  bell(){const o=newOut();if(!o)return;const t=ac.currentTime+0.02;
    [0,0.35].forEach(d=>{[[2100,0.18],[2790,0.1],[4300,0.05]].forEach(([f,p])=>{const s=ac.createOscillator(),g=ac.createGain();s.type='sine';s.frequency.value=f;s.connect(g);g.connect(o);
      g.gain.setValueAtTime(p,t+d);g.gain.exponentialRampToValueAtTime(0.0001,t+d+0.9);s.start(t+d);s.stop(t+d+1);});});},
  ship(){const o=newOut();if(!o)return;const t=ac.currentTime+0.02;
    [0,1.1].forEach(d=>{osc(o,'sawtooth',98,t+d,0.85,0.16,520);osc(o,'sawtooth',147,t+d,0.85,0.1,520);});},
  tractor(){const o=newOut();if(!o)return;const t=ac.currentTime+0.02;
    const s=ac.createOscillator(),g=ac.createGain(),fl=ac.createBiquadFilter();s.type='sawtooth';s.frequency.value=48;fl.type='lowpass';fl.frequency.value=320;
    s.connect(fl);fl.connect(g);g.connect(o);
    for(let i=0;i<20;i++){const k=t+i*0.1;const p=0.5*Math.min(1,(i+2)/5)*Math.min(1,(20-i)/5);g.gain.setValueAtTime(p,k);g.gain.exponentialRampToValueAtTime(0.03,k+0.08);}
    s.start(t);s.stop(t+2.1);}
};

/* ---------- speech ---------- */
const synth=window.speechSynthesis||null;
let ruVoices=[],speakTimer=null,unlocked=false;
function loadVoices(){
  if(!synth)return;
  ruVoices=synth.getVoices().filter(v=>/^ru/i.test(v.lang));
  if(state.mode==='home'&&settingsLoaded)render();
}
const vq=v=>{const t=(v.voiceURI+' '+v.name).toLowerCase();return /premium|премиум/.test(t)?3:/enhanced|улучш/.test(t)?2:1;};
function currentVoice(){
  const chosen=ruVoices.find(v=>v.voiceURI===state.voiceURI);if(chosen)return chosen;
  return ruVoices.slice().sort((a,b)=>vq(b)-vq(a)||(/milena|милена/i.test(b.name)?1:0)-(/milena|милена/i.test(a.name)?1:0))[0]||null;
}
/* voices are loaded from main.js, once everything is defined */
document.addEventListener('pointerdown',()=>{
  if(unlocked)return;unlocked=true;
  const c=AC();if(c){const b=c.createBuffer(1,1,22050),src=c.createBufferSource();src.buffer=b;src.connect(c.destination);src.start(0);}
  if(!synth)return;
  const u=new SpeechSynthesisUtterance(' ');u.volume=0;u.lang='ru-RU';synth.speak(u);
},{capture:true});
let speechBusy=false,curQueue=null;
/* run fn once the game has finished talking, plus a pause (so nothing gets cut off) */
function afterSpeech(fn,ms){let idle=0,total=0;const id=setInterval(()=>{total+=150;if(speechBusy&&total<15000){idle=0;return;}idle+=150;if(idle>=ms){clearInterval(id);fn();}},150);return id;}
function speakSeq(parts,onDone){
  stopAudio();
  parts=parts.slice();curQueue=parts;speechBusy=true;
  const tok=speakToken;let i=0;
  const next=()=>{
    if(tok!==speakToken)return;
    if(i>=parts.length){speechBusy=false;curQueue=null;onDone&&onDone();return;}
    const p=parts[i++];let stepDone=false;
    const step=()=>{if(stepDone)return;stepDone=true;clearTimeout(fallbackTimer);next();};
    const key=typeof p==='object'?p.rec:(recURL['ph:'+p]?'ph:'+p:null);
    if(key&&recURL[key]){playRecRaw(key,step,tok);return;}
    if(typeof p==='object'||!synth){step();return;}
    const u=new SpeechSynthesisUtterance(p);u.lang='ru-RU';const v=currentVoice();if(v)u.voice=v;u.rate=state.rate;u.pitch=1;
    u.onend=step;u.onerror=step;synth.speak(u);
    fallbackTimer=setTimeout(step,1200+p.length*110/state.rate);
  };
  clearTimeout(speakTimer);
  if(synth&&(synth.speaking||synth.pending)){synth.cancel();speakTimer=setTimeout(next,80);}else next();
}
const say=t=>{if(t)speakSeq([t]);};
function sayItem(it,prefix){
  if(recURL[it.key]){speakSeq(prefix&&recURL['ph:'+prefix]?[prefix,{rec:it.key}]:[{rec:it.key}]);return;}
  const parts=[];
  if(prefix)parts.push(prefix);
  parts.push(it.w+'!');
  if(it.s&&state.sounds)parts.push(it.s);
  speakSeq(parts,it.fx&&state.sounds?()=>FX[it.fx]():null);
}

/* ---------- recording ---------- */
let mediaRec=null,recStream=null,recTimer=null;
async function startRec(key){
  if(state.recKey){stopRec();return;}
  stopAudio();if(synth)synth.cancel();
  state.recError=null;
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!window.MediaRecorder){
    state.recError='На этой странице запись недоступна: браузер не даёт доступ к микрофону.';render();return;
  }
  try{recStream=await navigator.mediaDevices.getUserMedia({audio:true});}
  catch(e){state.recError='Нет доступа к микрофону. Разрешите микрофон для этой страницы и попробуйте ещё раз. Если не получается, запись на этой странице, к сожалению, недоступна.';render();return;}
  const pick=['audio/mp4','audio/webm','audio/ogg'].find(t=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t));
  const chunks=[];
  mediaRec=new MediaRecorder(recStream,pick?{mimeType:pick}:undefined);
  mediaRec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};
  mediaRec.onstop=async()=>{
    recStream.getTracks().forEach(t=>t.stop());
    const blob=new Blob(chunks,{type:mediaRec.mimeType||pick||'audio/mp4'});
    state.recKey=null;
    if(blob.size>0){await saveRec(key,blob);playRec(key);}
    render();
  };
  mediaRec.start();state.recKey=key;render();
  recTimer=setTimeout(stopRec,7000);
}
function stopRec(){clearTimeout(recTimer);if(mediaRec&&mediaRec.state!=='inactive')mediaRec.stop();}

/* sounds for the truck, scooter and taxi */
Object.assign(FX,{
  truck(){const o=newOut();if(!o)return;const t=ac.currentTime+.02;
    [0,.6].forEach(d=>{osc(o,'sawtooth',155,t+d,.42,.16,700);osc(o,'sawtooth',196,t+d,.42,.11,700);});},
  scooter(){const o=newOut();if(!o)return;const t=ac.currentTime+.02;
    const n=noise(o,t,1.4,'bandpass',500,1.2);n.fl.frequency.exponentialRampToValueAtTime(2400,t+1.1);
    n.g.gain.setValueAtTime(.001,t);n.g.gain.exponentialRampToValueAtTime(.35,t+.5);n.g.gain.exponentialRampToValueAtTime(.001,t+1.3);},
  taxi(){const o=newOut();if(!o)return;const t=ac.currentTime+.02;
    [0,.25].forEach(d=>{osc(o,'square',466,t+d,.16,.1,1800);osc(o,'square',587,t+d,.16,.08,1800);});}
});

/* elephant trumpet and a gentle lion roar */
Object.assign(FX,{
  elephant(){const o=newOut();if(!o)return;const t=ac.currentTime+.02;
    const s=ac.createOscillator(),g=ac.createGain(),fl=ac.createBiquadFilter(),lfo=ac.createOscillator(),lg=ac.createGain();
    s.type='sawtooth';s.frequency.setValueAtTime(330,t);s.frequency.exponentialRampToValueAtTime(620,t+.35);s.frequency.exponentialRampToValueAtTime(520,t+1.1);
    lfo.frequency.value=7;lg.gain.value=18;lfo.connect(lg);lg.connect(s.frequency);
    fl.type='bandpass';fl.frequency.value=900;fl.Q.value=1.2;s.connect(fl);fl.connect(g);g.connect(o);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.35,t+.12);g.gain.setValueAtTime(.3,t+.8);g.gain.exponentialRampToValueAtTime(.0001,t+1.25);
    s.start(t);lfo.start(t);s.stop(t+1.3);lfo.stop(t+1.3);},
  roar(){const o=newOut();if(!o)return;const t=ac.currentTime+.02;
    const n=noise(o,t,1.5,'lowpass',420,2);n.fl.frequency.setValueAtTime(260,t);n.fl.frequency.linearRampToValueAtTime(520,t+.5);n.fl.frequency.linearRampToValueAtTime(220,t+1.4);
    for(let i=0;i<18;i++){const k=t+i*.075;n.g.gain.setValueAtTime(.55*Math.min(1,(i+2)/6)*Math.min(1,(18-i)/6),k);n.g.gain.exponentialRampToValueAtTime(.15,k+.06);}
    osc(o,'sawtooth',85,t,1.3,.12,300);}
});
