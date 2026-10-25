() => {
  const rows=[]; const add=(sec,t,kind)=>{ if(t&&t.trim()) rows.push([sec,t.trim(),kind||'']); };
  const base=Object.entries(CATS).filter(([k,c])=>!c.hidden&&k!=='family');
  // 1. words
  base.forEach(([k,c])=>c.items.forEach(it=>{add('Слова: '+c.name,it.w+'!','word'); if(it.s) add('Слова: '+c.name,it.s,'sound');}));
  // 2. find
  add('Найди картинку','Да!');
  base.forEach(([k,c])=>c.items.forEach(it=>{add('Найди картинку',`Где ${nm(it)}?`,'q'); add('Найди картинку',`Это ${nm(it)}.`,'wrong'); add('Найди картинку',`А где ${nm(it)}?`,'q');}));
  const verbs=[...new Set(LEARN.map(x=>x.v))]; verbs.forEach(v=>add('Найди картинку',`Кто ${v}?`,'q'));
  FUNCQ.forEach(f=>{add('Найди картинку',f.q,'q');add('Найди картинку',f.a,'answer');});
  SIZES.forEach(([e,w,g])=>{const A=ADJ[g];A.forEach(a=>{add('Найди картинку',`Где ${a} ${w}?`,'q');add('Найди картинку',`${cap(a)} ${w}!`,'answer');add('Найди картинку',`Это ${a} ${w}.`,'wrong');});});
  // 3. hear
  ['Послушай! Кто это?','Послушай ещё раз.'].forEach(t=>add('Кто это?',t));
  HOME_SOUNDS.forEach(h=>{add('Кто это?',h.w+'!','word');add('Кто это?',`Это ${low(h.w)}.`,'wrong');});
  // 4. copy
  add('Сделай как я','Сделай как я!');
  ACTIONS.forEach(a=>add('Сделай как я',a[1]));
  ACTIONS.forEach((a,i)=>ACTIONS.forEach((b,j)=>{if(i!==j)add('Сделай как я',`${a[1].replace('!','')}, потом ${low(b[1])}`);}));
  // 5. learn
  LEARN.forEach(L=>{add('Попугай учит',L.n+'!','word');add('Попугай учит',`${L.n} ${L.v}!`);add('Попугай учит',`Что делает ${low(L.n)}?`,'q');});
  verbs.forEach(v=>add('Попугай учит',cap(v)+'!','answer'));
  LEARN3.forEach(L=>add('Попугай учит',L.t+'!'));
  ['Скажи что-нибудь попугаю!','Молодец!','Хорошо!'].forEach(t=>add('Попугай учит',t));
  // 6. finish
  FINISH.forEach(F=>{add('Договори',F[1],'cloze');if(F[2])add('Договори',F[2],'sound');});
  FINISH2.forEach(F=>{add('Договори',F[1],'cloze');add('Договори',F[3]+'!','word');});
  FINISH3.forEach(F=>{add('Договори',F[1],'cloze');add('Договори',F[3]);});
  // 7. choose
  WANTS.forEach(W=>{add('Что хочешь?',`Хочешь ${W[2]}…`,'piece1');add('Что хочешь?',`…${W[2]}…`,'piece2');add('Что хочешь?',`…или ${W[2]}?`,'piece3');
    add('Что хочешь?',cap(W[1])+'!','word');add('Что хочешь?',`Дай ${W[2]}!`);add('Что хочешь?',`Держи ${W[2]}!`);});
  add('Что хочешь?','Скажи: дай!');
  // 8. count
  ['Давай посчитаем!','Давай посчитаем вместе.','Спасибо!'].forEach(t=>add('Считаем',t));
  for(let n=1;n<=10;n++)add('Считаем',cap(NUM[n])+'!','number');
  COUNT_OBJ.forEach(o=>{add('Считаем',`Сколько ${o[3]}?`,'q');for(let n=1;n<=10;n++){const s=cap(`${numFor(n,o[4])} ${formN(n,o)}`);add('Считаем',s+'!','answer');}});
  RECEIVERS.forEach(r=>GIVE_FOOD.forEach(f=>{for(let n=1;n<=5;n++)add('Считаем',`Дай ${r[1]} ${numAcc(n,f[4])} ${formN(n,[0,f[1],f[2],f[3]])}!`);}));
  GIVE_FOOD.forEach(f=>{for(let n=1;n<=5;n++)add('Считаем',`${cap(numFor(n,f[4]))} ${formN(n,[0,f[5],f[2],f[3]])}!`,'answer');});
  // 9. colour mat
  const C=COLORS4.map(c=>c.n);
  C.forEach(a=>{add('Цветной коврик',`Встань на ${a}!`);add('Цветной коврик',`Молодец! ${cap(a)}!`,'praise');});
  C.forEach(a=>C.forEach(b=>{if(a!==b){add('Цветной коврик',`Сначала ${a}, потом ${b}!`);add('Цветной коврик',`Одна ножка на ${a}, другая на ${b}!`);add('Цветной коврик',`Ножку на ${a}, ручку на ${b}!`);add('Цветной коврик',`Ручку на ${a}, ножку на ${b}!`);}}));
  // 10. drawing
  TRACES.forEach(t=>{add('Рисуем',t.w+'!','word');add('Рисуем',t.w+'! Ура!','praise');});
  ['Веди пальчиком!','Ой!','Давай по точкам.','Сотри пальчиком! Кто там?','Выбери краску!','Как красиво!','Радуга!','Рисуй пальчиком!','Нажимай пальчиком!','Приехали!'].forEach(t=>add('Рисуем',t));
  PICS.forEach(p=>add('Рисуем',p.w+'!','word'));
  PAINTS.forEach(p=>add('Рисуем',cap(p.n)+'!','word'));
  STAMPS.forEach(s=>add('Рисуем',s[1]+'!','word'));
  ROADS.forEach(r=>add('Рисуем',r.say));
  // 11. blow
  ['Подуй на одуванчик!','Задуй свечку!','Задуй свечки!','Подуй на кораблик!','Подуй на вертушку!','Подуй, и будут пузыри!','Лопай пузыри!','Подуй ещё!','Кто там?',
   'Свечка погасла! Молодец!','Свечки погасли! Молодец!','Приплыли! Молодец!','Как крутится! Молодец!'].forEach(t=>add('Подуй',t));
  HIDERS.forEach(h=>add('Подуй',h[1]+'!','word'));BFRIENDS.forEach(b=>add('Подуй',b[1]+'!','word'));
  // 12. common
  ['Молодец!','Ура! Молодец!','Ура! Новый уровень!','Новый уровень!','Скоро игра закончится.','Всё! Игра закончилась.'].forEach(t=>add('Общие',t));
  Object.values(NEXT_ACTS).forEach(v=>add('Общие',`Теперь ${v[0]}!`));
  PHRASES.forEach(t=>add('Общие',t));
  return rows;
}
