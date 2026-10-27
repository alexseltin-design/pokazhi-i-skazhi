/* ---------- events ---------- */
app.addEventListener('click',e=>{
  const reg=e.target.closest&&e.target.closest('.reg');if(reg&&state.mode==='paint'){paintTap(reg);return;}
  const b=e.target.closest('button');if(!b||b.disabled)return;
  const d=b.dataset;
  if(b.classList.contains('obj')){objTap(b);return;}
  if(d.g!==undefined&&b.classList.contains('gitem')){giveTap(b);return;}
  if(d.ans!==undefined){ansTap(b,+d.ans);return;}
  if(d.cat){if(state.recKey)return;state.homeMsg=null;state.cat=d.cat;state.last=null;render();return;}
  if(d.bc!==undefined){bs.color=+d.bc;document.querySelectorAll('.pc').forEach(x=>x.classList.toggle('on',x.dataset.bc===d.bc));say(+d.bc<0?'Радуга!':cap(PAINTS[+d.bc].n)+'!');return;}
  if(d.st!==undefined){pickStamp(+d.st);return;}
  if(d.lv){const [g,n]=d.lv.split(':');state.levels[g]=+n;lvReset(g);render();return;}
  if(d.dsaid!==undefined){const e=DICT[d.dsaid];if(e){e.said=e.said?null:Date.now();e.last=Date.now();dictSave();render();}return;}
  if(d.ddel!==undefined){delete DICT[d.ddel];dictSave();render();return;}
  if(d.want!==undefined){chooseTap(+d.want);return;}
  if(d.game){state.games[d.game]=state.games[d.game]?0:1;render();return;}
  if(d.pc!==undefined){pickPaint(+d.pc);return;}
  if(d.jl){state.levels.jump=+d.jl;lvReset('jump');render();return;}
  if(d.set){const nv=parseFloat(d.val);state[d.set]=isNaN(nv)?d.val:nv;render();return;}
  if(d.voice){state.voiceURI=d.voice;render();say('Кошка! Мяу, мяу!');return;}
  if(d.famdel!==undefined){delFamily(CATS.family.items[+d.famdel]);return;}
  if(d.rec!==undefined){startRec(cat().items[+d.rec].key);return;}
  if(d.play!==undefined){playRec(cat().items[+d.play].key);return;}
  if(d.del!==undefined){delRec(cat().items[+d.del].key).then(render);return;}
  const a=d.act;
  if(a==='listen')return startListen();
  if(a==='find')return startFind();
  if(a==='draw')return startDraw();
  if(a==='drawmenu'){state.mode='drawmenu';render();return;}
  if(a==='talkmenu'){state.mode='talkmenu';render();return;}
  if(a==='dandelion')return startDand();
  if(a==='newdand'){nextScene();return;}
  if(a==='sync'){state.mode='sync';render();return;}
  if(a==='syncnew'){syncConnect(syncNewCode(),true);return;}
  if(a==='syncjoin'){const i=document.getElementById('syncin');syncConnect(i?i.value:'',false);return;}
  if(a==='syncoff'){syncDisconnect();return;}
  if(a==='levels'){state.levelsFrom=state.mode;state.mode='levels';render();return;}
  if(a==='levelsback'){state.mode=state.levelsFrom||'home';render();return;}
  if(a==='learn')return startLearn();
  if(a==='learnagain'){if(lt&&lt.phase!=='praise'&&lt.phase!=='echo'){lt.reprompts=0;learnModel('ask');}return;}
  if(a==='learnsaid'){learnSaid();return;}
  if(a==='learntry'){learnTry();return;}
  if(a==='learnnext'){learnNext();return;}
  if(a==='dict'){state.mode='dict';render();return;}
  if(a==='dictadd'){const i=document.getElementById('dictin');const v=i&&i.value.trim();if(v){dictSaid(cap(v),'добавлено вручную');render();}return;}
  if(a==='blow')return startBlow();
  if(a==='nextblow'){nextBlow();return;}
  if(a==='parrot')return startParrot();
  if(a==='finish')return startFinish();
  if(a==='finishask'){if(fn)say(finishItem()[1]);return;}
  if(a==='finishhint'){if(fn&&!fn.busy)finishSound();return;}
  if(a==='finishok'){finishOk();return;}
  if(a==='finishnext'){if(fn&&!fn.busy){lvResult('finish',false);newFinish();}return;}
  if(a==='choose')return startChoose();
  if(a==='chooseask'){askChoose();return;}
  if(a==='brush')return startBrush();
  if(a==='brushclear'){if(bs){bs.segs=[];render();}return;}
  if(a==='stamps')return startStamps();
  if(a==='stampclear'){if(stp){stp.phase=0;stp.placed=[];stp.done=false;clearTimeout(stp.timer);render();}return;}
  if(a==='nextdecor'){nextDecor();return;}
  if(a==='roads')return startRoads();
  if(a==='nextroad'){if(rd&&!rd.done)lvResult('roads',false);nextRoad();return;}
  if(a==='hear')return startHear();
  if(a==='hearagain'){if(hr&&!hr.busy)hearSound();return;}
  if(a==='copy')return startCopy();
  if(a==='copyagain'){sayCopy();return;}
  if(a==='copyok'){copyOk();return;}
  if(a==='copynext'){if(cp&&!cp.busy){lvResult('copy',false);cp.helped=false;newCopy();}return;}
  if(a==='copyshow'){if(cp&&!cp.shown){cp.shown=true;cp.helped=true;startCopyAnim();}return;}
  if(a==='breathe')return startBreathe();
  if(a==='scratch')return startScratch();
  if(a==='nextscratch'){nextScratch();return;}
  if(a==='paint')return startPaint();
  if(a==='nextpaint'){nextPaint();return;}
  if(a==='rhythm')return startRhythm();
  if(a==='count')return startCount();
  if(a==='jump'){state.mode='jumpmenu';render();return;}
  if(a==='jumpstart')return startJump();
  if(a==='jumpok'){jumpOk();return;}
  if(a==='jumpnext'){if(jp&&!jp.busy){lvResult('jump',false);newJump();}return;}
  if(a==='jumprepeat'){sayJump();return;}
  if(a==='countdemo'){countDemo();return;}
  if(a==='giveask'){if(cn&&cn.give)say(giveQ()+'!');return;}
  if(a==='rhreplay'){if(rh&&rh.phase!=='demo')demo();return;}
  if(a==='family'){state.mode='family';state.famErr=null;render();return;}
  if(a==='fampick'){const f=document.getElementById('famfile');if(f)f.click();return;}
  if(a==='famadd'){addFamily();return;}
  if(a==='erase'){if(tr&&!tr.done){tr.lines=[];tr.on=0;tr.off=0;tr.targets.forEach(p=>p.hit=false);redrawLines();startHand();}return;}
  if(a==='nexttrace'){if(tr&&!tr.done)lvResult('draw',false);nextTrace();return;}
  if(a==='record'){state.mode='record';state.recError=null;render();return;}
  if(a==='home')return goHome();
  if(a==='testvoice'){say('Кошка! Мяу, мяу!');return;}
  if(a==='pgnext'){goPage(1);return;}
  if(a==='pgprev'){goPage(-1);return;}
  if(a==='repeat'){say(findQ(state.target));return;}
  if(b.classList.contains('card')){
    const i=+d.i;
    if(state.mode==='listen'){anim(b,'pop');sayItem(state.listenItems[i]);}
    else if(state.mode==='find')findTap(b,state.options[i]);
    else if(state.mode==='hear')hearTap(b,hr.opts[i]);
  }
});
app.addEventListener('input',e=>{
  if(e.target.id!=='famname')return;
  state.famName=e.target.value;
  const b=app.querySelector('[data-act="famadd"]');if(b)b.disabled=!(state.famDraft&&state.famName.trim());
});
app.addEventListener('change',async e=>{
  if(e.target.id!=='famfile'||!e.target.files||!e.target.files[0])return;
  try{const blob=await resizeImage(e.target.files[0]);if(state.famDraft)URL.revokeObjectURL(state.famDraft.url);state.famDraft={blob,url:URL.createObjectURL(blob)};state.famErr=null;}
  catch(err){state.famErr='Не получилось открыть это фото. Попробуйте другое.';}
  render();
});
app.addEventListener('toggle',e=>{if(e.target.classList&&e.target.classList.contains('adult'))state.adultOpen=e.target.open;},true);
/* stop Safari's pull-to-refresh and page bounce: block finger-drag everywhere except lists that really scroll */
document.addEventListener('touchmove',e=>{
  const sc=e.target.closest&&e.target.closest('.home,.recwrap');
  if(sc&&sc.scrollHeight>sc.clientHeight+1)return;
  if(e.cancelable)e.preventDefault();
},{passive:false});
document.addEventListener('gesturestart',e=>e.preventDefault());
loadSettings();
render();
if(synth){loadVoices();synth.onvoiceschanged=loadVoices;}
loadRecs().then(loadFamily).then(syncStart);
