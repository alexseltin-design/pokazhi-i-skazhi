/* ---------- play timer and "what comes next" ---------- */
const NEXT_ACTS={eat:['кушать','🍽️'],bath:['купаться','🛁'],walk:['гулять','🌳'],sleep:['спать','😴'],toys:['играть с игрушками','🧸'],book:['читать книжку','📚']};
const MENU_MODES=['home','record','family','jumpmenu','drawmenu','talkmenu','sync','levels','dict'];
const sess={end:null,warned:false,iv:null};
function sessTick(){
  if(!MENU_MODES.includes(state.mode)&&state.sessMin>0&&!sess.end){
    sess.end=Date.now()+state.sessMin*60000;sess.total=state.sessMin*60000;sess.warned=false;
    clearInterval(sess.iv);sess.iv=setInterval(sessUpdate,1000);
  }
  sessUpdate();
}
function sessUpdate(){
  let bar=document.getElementById('sessbar');
  if(!sess.end){if(bar)bar.remove();return;}
  if(!bar){bar=document.createElement('div');bar.id='sessbar';bar.innerHTML='<i></i>';document.body.appendChild(bar);}
  const left=sess.end-Date.now(),frac=Math.max(0,left/sess.total);
  bar.firstChild.style.width=(frac*100)+'%';bar.classList.toggle('low',frac<.2);
  if(left<=60000&&!sess.warned&&sess.total>60000){sess.warned=true;say('Скоро игра закончится.');}
  if(left<=0)sessEnd();
}
function sessEnd(){
  clearInterval(sess.iv);sess.end=null;
  let g=0;while(state.mode!=='home'&&g++<3)goHome();
  const bar=document.getElementById('sessbar');if(bar)bar.remove();
  const [word,ic]=NEXT_ACTS[state.nextAct]||NEXT_ACTS.eat;
  const o=document.createElement('div');o.className='sessend';o.id='sessend';
  o.innerHTML=`<div class="big">${em(ic)}</div><h2>Всё! Игра закончилась</h2><p>Теперь ${word}!</p>
    <div class="row2"><button class="pbtn ok" data-sess="close">Хорошо</button><button class="pbtn" data-sess="more">Ещё 5 минут</button></div>`;
  document.body.appendChild(o);
  if(state.calm)softChime();
  setTimeout(()=>speakSeq(['Всё! Игра закончилась.',`Теперь ${word}!`]),state.calm?900:200);
  o.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    o.remove();stopAudio();if(synth)synth.cancel();
    if(b.dataset.sess==='more'){sess.end=Date.now()+5*60000;sess.total=5*60000;sess.warned=false;clearInterval(sess.iv);sess.iv=setInterval(sessUpdate,1000);sessUpdate();}
  });
}
