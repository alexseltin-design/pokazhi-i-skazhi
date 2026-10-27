/* ---------- sync the parent's voice recordings between devices with a "family code" ----------
   No logins. One device creates a family code; other devices type it in (or scan the QR code).
   Everything is encrypted on the device with a key made from the code, so the server only ever
   stores unreadable data. Only voice recordings are synced: photos and family names stay local. */
const SYNC={code:null,fid:null,key:null,db:null,fs:null,unsub:null,status:'off',err:'',count:0,last:0,first:true,queue:Promise.resolve(),applying:false};
const SYNC_V='10.12.2';
const SYNC_ABC='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const _te=new TextEncoder(),_td=new TextDecoder();
function _b64(buf){let s='';const a=new Uint8Array(buf);for(let i=0;i<a.length;i+=0x8000)s+=String.fromCharCode.apply(null,a.subarray(i,i+0x8000));return btoa(s);}
function _unb64(s){const b=atob(s),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;}
async function _sha(s){const h=new Uint8Array(await crypto.subtle.digest('SHA-256',_te.encode(s)));return [...h].map(x=>x.toString(16).padStart(2,'0')).join('');}
function syncNormalize(s){return String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'').split('').filter(c=>SYNC_ABC.includes(c)).join('');}
function syncPretty(c){return c.replace(/(.{4})(?=.)/g,'$1-');}
function syncNewCode(){const r=crypto.getRandomValues(new Uint8Array(12));return [...r].map(x=>SYNC_ABC[x%SYNC_ABC.length]).join('');}
async function _key(code){
  const base=await crypto.subtle.importKey('raw',_te.encode(code),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt:_te.encode('pokazhi-i-skazhi-sync-v1'),iterations:150000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function _enc(bytes){const iv=crypto.getRandomValues(new Uint8Array(12));const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},SYNC.key,bytes);return _b64(iv)+'.'+_b64(ct);}
async function _dec(s){const [i,c]=s.split('.');return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:_unb64(i)},SYNC.key,_unb64(c)));}
/* when each recording was last changed, as this device knows it */
function _known(){try{return JSON.parse(localStorage.getItem('pokazhi-sync-known')||'{}');}catch(e){return {};}}
function _saveKnown(k){try{localStorage.setItem('pokazhi-sync-known',JSON.stringify(k));}catch(e){}}
const syncable=key=>!String(key).startsWith('family:');
function syncRefresh(){if(state.mode==='sync'||state.mode==='record')render();}

async function syncLoad(){
  if(SYNC.db)return true;
  if(typeof FIREBASE_CONFIG==='undefined'||!FIREBASE_CONFIG){SYNC.err='Синхронизация ещё не настроена: нужно добавить ключи Firebase (см. docs/FIREBASE.md).';return false;}
  if(!window.crypto||!crypto.subtle){SYNC.err='Этот браузер не поддерживает шифрование. Откройте игру по ссылке https://…';return false;}
  try{
    const app=await import(`https://www.gstatic.com/firebasejs/${SYNC_V}/firebase-app.js`);
    const auth=await import(`https://www.gstatic.com/firebasejs/${SYNC_V}/firebase-auth.js`);
    const fs=await import(`https://www.gstatic.com/firebasejs/${SYNC_V}/firebase-firestore.js`);
    const a=app.initializeApp(FIREBASE_CONFIG);
    await auth.signInAnonymously(auth.getAuth(a));
    SYNC.fs=fs;SYNC.db=fs.getFirestore(a);return true;
  }catch(e){SYNC.err='Не получилось связаться с сервером синхронизации. Проверьте интернет.';return false;}
}
async function syncConnect(code,isNew){
  code=syncNormalize(code);
  if(code.length<12){SYNC.err='Код должен состоять из 12 знаков.';syncRefresh();return;}
  SYNC.status='connecting';SYNC.err='';syncRefresh();
  if(!(await syncLoad())){SYNC.status='off';syncRefresh();return;}
  SYNC.code=code;SYNC.fid=(await _sha('fid:'+code)).slice(0,32);SYNC.key=await _key(code);SYNC.first=true;
  try{localStorage.setItem('pokazhi-sync',JSON.stringify({code}));}catch(e){}
  const fs=SYNC.fs,col=fs.collection(SYNC.db,'families',SYNC.fid,'recs');
  if(SYNC.unsub)SYNC.unsub();
  SYNC.unsub=fs.onSnapshot(col,snap=>{
    const changes=snap.docChanges();SYNC.count=snap.size;
    SYNC.queue=SYNC.queue.then(async()=>{
      const known=_known();const remote=new Set();
      for(const ch of changes){
        try{
          const v=ch.doc.data();const name=_td.decode(await _dec(v.n));remote.add(name);
          if(!(v.t>(known[name]||0)))continue;
          known[name]=v.t;SYNC.applying=true;
          if(v.x){await delRec(name);}
          else{const bytes=await _dec(v.d);const mime=_td.decode(await _dec(v.m));await saveRec(name,new Blob([bytes],{type:mime}));}
          SYNC.applying=false;
        }catch(e){SYNC.applying=false;}
      }
      _saveKnown(known);
      if(SYNC.first){SYNC.first=false;
        /* first look at the family: send up this device's recordings that the family does not have yet */
        for(const k of Object.keys(recURL)){if(syncable(k)&&!remote.has(k))await syncPush(k);}
      }
      SYNC.status='on';SYNC.last=Date.now();syncRefresh();
    });
  },()=>{SYNC.err='Нет доступа к семейным записям. Проверьте настройки Firebase.';SYNC.status='off';syncRefresh();});
  if(isNew)toast('Семейный код создан');
}
async function _docRef(key){return SYNC.fs.doc(SYNC.db,'families',SYNC.fid,'recs',(await _sha('rec:'+SYNC.fid+':'+key)).slice(0,40));}
async function syncPush(key){
  if(!SYNC.fid||!syncable(key)||SYNC.applying)return;
  try{
    const blob=await (await fetch(recURL[key])).blob();const bytes=new Uint8Array(await blob.arrayBuffer());
    if(bytes.length>700000)return;               /* very long recordings are not synced */
    const t=Date.now(),known=_known();known[key]=t;_saveKnown(known);
    await SYNC.fs.setDoc(await _docRef(key),{n:await _enc(_te.encode(key)),d:await _enc(bytes),m:await _enc(_te.encode(blob.type||'audio/mp4')),t,x:false});
    SYNC.last=Date.now();syncRefresh();
  }catch(e){SYNC.err='Не получилось отправить запись. Попробуем позже.';}
}
async function syncDelete(key){
  if(!SYNC.fid||!syncable(key)||SYNC.applying)return;
  try{const t=Date.now(),known=_known();known[key]=t;_saveKnown(known);
    await SYNC.fs.setDoc(await _docRef(key),{n:await _enc(_te.encode(key)),d:'',m:'',t,x:true});}catch(e){}
}
function syncDisconnect(){
  if(SYNC.unsub)SYNC.unsub();Object.assign(SYNC,{code:null,fid:null,key:null,unsub:null,status:'off',err:'',count:0});
  try{localStorage.removeItem('pokazhi-sync');localStorage.removeItem('pokazhi-sync-known');}catch(e){}
  syncRefresh();
}
function syncStart(){
  let saved=null;try{saved=JSON.parse(localStorage.getItem('pokazhi-sync')||'null');}catch(e){}
  const m=location.hash.match(/^#join=([A-Za-z0-9-]+)/);
  if(m){state.syncJoin=syncNormalize(m[1]);history.replaceState(null,'',location.pathname+location.search);state.mode='sync';render();}
  else if(saved&&saved.code)syncConnect(saved.code,false);
}
function syncQR(text){
  if(typeof qrcode==='undefined')return '';
  const q=qrcode(0,'M');q.addData(text);q.make();return q.createSvgTag({cellSize:5,margin:2,scalable:true});
}
function syncHTML(){
  const on=!!SYNC.code;
  const link=on?`${location.origin}${location.pathname}#join=${SYNC.code}`:'';
  const t=SYNC.last?new Date(SYNC.last).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):'';
  return `<section class="home">
    <header class="bar"><button class="back" data-act="home">← Назад</button><div class="title">Голос на всех устройствах</div></header>
    <div class="grown"><p class="tip">Записи вашего голоса появятся на всех устройствах, где введён один и тот же семейный код: на телефоне, планшете, у бабушки. Записи шифруются прямо на устройстве, и без кода их никто не сможет прослушать. Фото семьи и подписи к ним на другие устройства не переносятся.</p></div>
    ${SYNC.err?`<p class="warn">${esc(SYNC.err)}</p>`:''}
    ${on?`<div class="grown synccard">
        <h2>Семейный код</h2>
        <div class="synccode">${syncPretty(SYNC.code)}</div>
        <div class="syncqr">${syncQR(link)}</div>
        <p class="tip">На другом устройстве откройте игру → «Для взрослых» → «Голос на всех устройствах» → «У меня есть код» и введите этот код. Или наведите камеру телефона на QR-код.</p>
        <p class="tip">${SYNC.status==='on'?`Подключено ✓ Записей в семье: ${SYNC.count}.${t?` Обновлено в ${t}.`:''}`:'Подключаемся…'}</p>
        <button class="pbtn" data-act="syncoff">Отключить это устройство</button>
      </div>`
    :`<div class="grown synccard">
        <h2>Это первое устройство?</h2>
        <button class="big-rec" data-act="syncnew" style="background:#CAFFBF">Создать семейный код</button>
        <h2 style="margin-top:14px">У меня уже есть код</h2>
        <div class="dictadd"><input id="syncin" type="text" placeholder="XXXX-XXXX-XXXX" maxlength="16" autocomplete="off" autocapitalize="characters" value="${esc(state.syncJoin?syncPretty(state.syncJoin):'')}"><button class="big-rec" data-act="syncjoin" style="background:#FFE08A">Подключиться</button></div>
        ${SYNC.status==='connecting'?'<p class="tip">Подключаемся…</p>':''}
      </div>`}
  </section>`;
}
