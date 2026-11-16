(function(){
  'use strict';
  const L=window.ForestLesson,C=L.catalog;
  const root=document.getElementById('app'),notice=document.getElementById('sound-notice'),presenter=document.getElementById('presenter');
  const params=new URLSearchParams(location.search),seedText=params.get('seed');
  const seed=seedText!==null&&/^\d+$/.test(seedText)?Number(seedText)>>>0:Date.now()>>>0;
  const assets='../public/assets/';
  let session=L.createSession(seed),epoch=0,ready=true,task=null,activeClip=null,preview=false,returnPhase='welcome';
  let selected=null,disposeDrag=()=>{},gateTimer=null,frame=null,fallStates=new Map(),fallLast=null,helpShown=false,previousFocus=null,tutorial=null;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const capacity=()=>innerWidth<700?2:3;
  const names={welcome:'Начало',letter:'1 · Буква М',example:'2 · Молоко',packing:'3 · Посылка',speak:'4 · Твоё слово',catch:'5 · Открытки',reward:'Награда',parent:'Для взрослого'};
  const paths={play:'<path d="m9 5 11 7-11 7z"/>',next:'<path d="M4 12h15m-6-6 6 6-6 6"/>',sound:'<path d="m11 5-6 4H2v6h3l6 4zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',reset:'<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',parent:'<circle cx="12" cy="7" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3"/>',hint:'<path d="M9 18h6m-5 3h4M8 14a7 7 0 1 1 8 0l-1 2H9z"/>',envelope:'<rect x="2" y="5" width="20" height="14" rx="3"/><path d="m3 7 9 6 9-6"/>',pause:'<path d="M8 5v14M16 5v14"/>',check:'<path d="m5 12 4 4L19 6"/>'};
  const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
  const picture=(folder,name,className='',alt='')=>`<img class="${className}" src="${assets}${folder}/${name}.webp" alt="${alt}" draggable="false">`;
  const item=(id,className='')=>picture('objects/raster-v1',id,className,C[id].word);
  const hedgehog=pose=>picture('characters/hedgehog-v1','hedgehog_'+pose,'hedgehog','Ёжик-почтальон');
  const prop=(name,className='')=>picture('props/raster-v1',name,className);
  const button=(action,glyph,label,className='round',disabled=false)=>`<button class="${className}" data-action="${action}" aria-label="${label}" title="${label}" ${disabled?'disabled':''}>${icon(glyph)}</button>`;
  const voice=new ForestAudio.AudioQueue({url:id=>assets+'audio/demo-v2/'+id+'.wav',onClip(id){
    activeClip=id;
    root.querySelectorAll('[data-word]').forEach(card=>card.classList.toggle('spoken',id==='word-'+card.dataset.word));
    root.querySelectorAll('[data-action="replay"]').forEach(el=>el.classList.toggle('playing',!!id));
    root.querySelectorAll('.big-letter,.sound-cue').forEach(el=>el.classList.toggle('sound-on',id==='letter-m'));
    if(session.phase==='letter'&&id==='word-soap')root.querySelector('.model-object')?.classList.add('revealed');
    if(session.phase==='packing'&&id==='packing-intro')showDragExample();
    updatePresenter();
  }});
  function header(){return`<header class="topbar"><div class="brand">${icon('envelope')}<span>Лесная почта</span></div><div class="top-actions"><span class="demo-badge">Демо</span>${button('reset','reset','Начать заново')}${button('parent','parent','Для взрослого: удерживайте две секунды','round parent-gate')}</div></header>`;}
  function parcelProgress(){return`<div class="parcel-progress" aria-label="Отправлено посылок: ${session.packing.sent?1:0} из одной"><span class="parcel-step ${session.packing.sent?'filled':''}">${prop('parcel')}</span></div>`;}
  function envelopeProgress(){return`<div class="envelope-progress" aria-label="Собрано конвертов: ${session.catch.collected.length} из пяти">${[0,1,2,3,4].map(n=>`<span class="envelope-step ${n<session.catch.collected.length?'filled':''}">${prop('envelope')}</span>`).join('')}</div>`;}
  function canAdvance(){return session.phase==='letter'&&session.letterDone||session.phase==='example'&&session.exampleDone||session.phase==='packing'&&session.packing.sent||session.phase==='speak'&&session.speech.offered||session.phase==='catch'&&session.catch.lettersSent;}
  function footer(){const phase=session.phase;return`<footer class="controls">${button('replay','sound','Послушать ещё раз','round replay')}${phase==='speak'||phase==='packing'&&!session.packing.sent?button('hint','hint','Помоги мне','round hint-button',!ready):parcelProgress()}${phase==='catch'?button('pause','pause','Пауза','round pause-button'):''}${ready&&canAdvance()?button('next','next',phase==='speak'?'Я закончил: дальше':'Дальше','primary next'):'<span class="next-space" aria-hidden="true"></span>'}</footer>`;}
  function card(id,kind){const packed=session.packing.packed.includes(id);return`<article class="choice ${packed?'packed':''} ${selected===id?'selected':''} ${helpShown&&L.packTargets.includes(id)?'hinted':''}" data-word="${id}"><button class="picture-button" ${kind==='pack'?`data-pack="${id}" aria-pressed="${selected===id}"`:`data-listen="${id}"`} aria-label="${kind==='pack'?'Выбрать':'Послушать'}: ${C[id].word}" ${!ready||kind==='pack'&&(packed||session.packing.sent)?'disabled':''}>${item(id)}${packed?'<span class="packed-check">'+icon('check')+'</span>':''}</button><button class="round word-audio" data-audio="${id}" aria-label="Послушать: ${C[id].word}" ${!ready?'disabled':''}>${icon('sound')}</button></article>`;}
  function content(){const p=session.phase;
    if(p==='welcome')return`<section class="welcome-content"><div class="welcome-sign"><h1 tabindex="-1">Лесная почта</h1><div class="sign-envelope">${prop('envelope')}</div></div><div class="cast">${hedgehog('greeting')}${prop('mailbox','mailbox')}${prop('parcel','parcel')}</div><button class="primary start" data-action="start">${icon('play')}<span>Играть</span></button></section>`;
    if(p==='letter'||p==='example')return`<section class="lesson model"><div class="guide">${hedgehog('pointing')}</div><div class="model-paper"><h1 tabindex="-1" class="model-title">${p==='letter'?'Это буква М':'<span class="sr-only">Второй пример: молоко</span>'}</h1><span class="big-letter" aria-label="Буква эм">М</span><div class="model-object ${p==='example'||session.letterDone?'revealed':''}">${item(p==='letter'?'soap':'milk')}</div><button class="round model-audio" data-audio="${p==='letter'?'soap':'milk'}" aria-label="Послушать название" ${!ready?'disabled':''}>${icon('sound')}</button></div></section>${footer()}`;
    if(p==='packing')return`<section class="packing-content"><h1 tabindex="-1" class="sr-only">Положи в посылку слова на букву М</h1><div class="packing-guide">${hedgehog(session.packing.sent?'parcel':'pointing')}<div class="sound-cue" aria-hidden="true">М</div></div><div class="packing-work"><div class="choices packing-choices" role="group" aria-label="Картинки для посылки">${session.packing.order.map(id=>card(id,'pack')).join('')}</div><button class="drop-zone ${selected?'drop-ready':''} ${session.packing.sent?'parcel-sent':''}" data-action="drop" aria-label="Положить выбранную картинку в посылку" ${!ready||session.packing.sent?'disabled':''}>${prop('parcel','large-parcel')}<span class="packed-slots">${L.packTargets.map(id=>`<span>${session.packing.packed.includes(id)?item(id):''}</span>`).join('')}</span><svg class="drop-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2v14m-6-6 6 6 6-6M4 18v4h16v-4"/></svg></button></div></section>${footer()}`;
    if(p==='speak')return`<section class="speak-content ${session.speech.hintCount?'with-hints':''}"><h1 class="sr-only" tabindex="-1">Придумай своё слово и скажи вслух</h1><div class="speech-cast"><div class="speech-cloud" aria-hidden="true"><span>М</span><i></i><i></i><i></i></div>${hedgehog('listening')}</div>${session.speech.hintCount?`<div class="choices speech-hints" role="group" aria-label="Примеры слов">${L.speechHints.map(id=>card(id,'listen')).join('')}</div>`:''}</section>${footer()}`;
    if(p==='catch'){const ids=L.activeIds(session,capacity()),pending=session.catch.pending;return`<section class="catch-content"><h1 class="sr-only" tabindex="-1">Поймай открытки и собери пять конвертов</h1>${envelopeProgress()}<div class="catch-field" aria-label="Падающие открытки">${ids.map(id=>`<button class="falling-card ${pending===id?'caught':''}" data-catch="${id}" aria-label="Поймать: ${C[id].word}" ${!ready?'disabled':''}>${item(id)}</button>`).join('')}<div class="catch-hedgehog">${hedgehog(pending&&C[pending].target?'happy':'idle')}</div><button class="mailbox-button ${session.catch.collected.length===5?'mailbox-ready':''} ${session.catch.lettersSent?'mail-sent':''}" data-action="send-letters" aria-label="Отправить пять писем" ${!ready||session.catch.collected.length!==5||session.catch.lettersSent?'disabled':''}>${prop('mailbox')}${session.catch.collected.length===5&&!session.catch.lettersSent?'<span class="mailbox-arrow">'+icon('next')+'</span>':''}</button>${session.catch.lettersSent?prop('envelope','departing-envelope'):''}</div></section>${footer()}`;}
    if(p==='reward')return`<section class="reward-content"><h1 tabindex="-1">Спасибо!</h1><div class="reward-cast">${hedgehog('celebration')}${prop('reward-stamp','reward-stamp')}</div><div class="reward-actions">${button('replay','sound','Послушать ещё раз')}${button('reset','play','Играть ещё раз','primary play-again')}</div></section>`;
    return report();
  }
  function report(){const r=L.report(session);return`<section class="report"><div class="report-heading"><p class="eyebrow">ДЛЯ ВЗРОСЛОГО · ДЕМО 5–6 ЛЕТ</p><h1 tabindex="-1">Наша лесная почта</h1><p>Пять учебных экранов: буква М, слова на М, действие и речь.</p></div>${preview?'<p class="preview-note">Просмотр из пульта. Эти действия не являются обычным прохождением.</p>':''}<div class="metrics"><div><strong>${r.parcelsSent}</strong><span>посылок отправлено из одной</span></div><div><strong>${r.lettersSent}</strong><span>писем отправлено из пяти</span></div></div><div class="report-card"><h2>Собираем посылку</h2><p>Упаковано предметов: ${r.packed.length} из двух. ${r.packed.length?'Внутри: '+r.packed.map(id=>C[id].word).join(', ')+'.':''} Попыток положить картинку: ${r.packingAttempts}. Неподходящих картинок: ${r.packingWrongDrops}. Подсказок: ${r.packingHints}.</p></div><div class="report-card"><h2>Придумываем слово</h2><p>${r.speechAdvanced?'После приглашения нажата стрелка продолжения.':r.speechOffered?'Приглашение произнести слово прозвучало.':'Приглашение ещё не завершено.'} Подсказок с примерами: ${r.speechHints}. Микрофон не включается; наличие и правильность устного ответа не проверяются.</p></div><div class="report-card"><h2>Ловим открытки</h2><p>Собрано конвертов: ${r.lettersCollected} из пяти. ${r.targetWords.length?'Слова: '+r.targetWords.join(', ')+'.':''} Всего озвучено пойманных картинок: ${r.caughtWords.length}. Это практика со слушанием, без оценки самостоятельного чтения.</p></div><div class="report-card home-tip"><h2>Попробуйте вместе</h2><p>Найдите дома знакомый предмет и послушайте начало его названия. Предложите ребёнку придумать ещё один пример.</p></div><p class="adult-note">Голос Microsoft Dmitry — синтетический. Озвучка и методика требуют проверки с методистом. Результаты хранятся только в памяти страницы.</p><div class="report-actions"><button class="primary" data-action="reset">Начать заново</button><button class="secondary" data-action="back">Вернуться к игре</button></div></section>`;}
  function updatePresenter(){if(!params.has('presenter'))return;presenter.hidden=false;
    if(!presenter.firstChild){presenter.innerHTML='<strong>Пульт показа</strong><span id="presenter-phase"></span><span id="presenter-clip"></span><label>Экран <select id="phase-select"><option value="">Выбрать…</option>'+L.phases.map(p=>`<option value="${p}">${names[p]}</option>`).join('')+'</select></label><button id="presenter-reset">Сбросить</button><small>Переход создаёт отдельный просмотр без выдуманных результатов.</small>';
      document.getElementById('presenter-reset').onclick=reset;document.getElementById('phase-select').onchange=event=>{if(!event.target.value)return;session=L.createSession(seed);session.phase=event.target.value;preview=true;fallStates.clear();returnPhase='welcome';enter();};}
    document.getElementById('presenter-phase').textContent=names[session.phase]+(preview?' · просмотр':' · прохождение');document.getElementById('presenter-clip').textContent=activeClip?'Звучит: '+activeClip:'Пауза';
  }
  function stopMotion(){if(frame!==null)cancelAnimationFrame(frame);frame=null;fallLast=null;}
  function clearTutorial(){tutorial?.remove();tutorial=null;}
  function showDragExample(){clearTutorial();if(motion.matches)return;const from=root.querySelector('.packing-choices'),to=root.querySelector('[data-action="drop"]');if(!from||!to)return;const a=from.getBoundingClientRect(),b=to.getBoundingClientRect();tutorial=document.createElement('div');tutorial.className='drag-example';tutorial.setAttribute('aria-hidden','true');tutorial.innerHTML=prop('envelope');tutorial.style.left=a.left+a.width/2-38+'px';tutorial.style.top=a.top+a.height/2-38+'px';tutorial.style.setProperty('--to-x',b.left+b.width/2-a.left-a.width/2+'px');tutorial.style.setProperty('--to-y',b.top+b.height/2-a.top-a.height/2+'px');tutorial.addEventListener('animationend',clearTutorial,{once:true});document.body.append(tutorial);}
  function positionCards(){const cards=[...root.querySelectorAll('[data-catch]')],field=root.querySelector('.catch-field');if(!field)return;const ids=new Set(cards.map(c=>c.dataset.catch)),count=capacity();for(const id of fallStates.keys())if(!ids.has(id))fallStates.delete(id);
    const used=new Set();for(const state of fallStates.values()){if(state.lane>=count||used.has(state.lane))state.lane=-1;else used.add(state.lane);}
    cards.forEach((card,index)=>{const id=card.dataset.catch;let state=fallStates.get(id);if(!state){state={elapsed:0,lane:-1,duration:6000+index*400};fallStates.set(id,state);}if(state.lane<0){state.lane=[0,1,2].find(n=>n<count&&!used.has(n));used.add(state.lane);}
      const laneWidth=field.clientWidth/count;const x=state.lane*laneWidth+(laneWidth-card.offsetWidth)/2;const travel=Math.max(0,field.clientHeight-card.offsetHeight-70);const y=motion.matches?20+state.lane*30:10+travel*Math.min(1,state.elapsed/state.duration);card.style.transform=`translate(${x}px,${y}px)`;
      if(session.catch.pending===id){const helper=root.querySelector('.catch-hedgehog');if(helper)helper.style.transform=`translateX(${Math.max(0,Math.min(field.clientWidth-helper.offsetWidth,x+card.offsetWidth/2-helper.offsetWidth/2))}px)`;}
    });
  }
  function startMotion(){stopMotion();positionCards();if(session.phase!=='catch'||!ready||!notice.hidden||!L.activeIds(session,capacity()).length||session.catch.pending||motion.matches)return;
    function tick(now){if(session.phase!=='catch'||!ready||!notice.hidden||session.catch.pending)return;const dt=fallLast===null?0:Math.min(now-fallLast,100);fallLast=now;const expired=[];for(const[id,state]of fallStates){state.elapsed+=dt;if(state.elapsed>=state.duration)expired.push(id);}positionCards();if(expired.length){for(const id of expired){session=L.miss(session,id,capacity());fallStates.delete(id);}render();return;}frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);
  }
  function render(focus=false){disposeDrag();stopMotion();clearTutorial();cancelGate();const focused=document.activeElement;const selector=focused?.dataset?.action?`[data-action="${focused.dataset.action}"]`:focused?.dataset?.audio?`[data-audio="${focused.dataset.audio}"]`:null;
    root.className='scene '+session.phase+(['letter','example','packing'].includes(session.phase)?' counter':' forest');root.innerHTML=header()+content();
    if(session.phase==='packing')disposeDrag=ForestDrag.attach(root,{drop:drop});else disposeDrag=()=>{};
    if(focus)root.querySelector('h1')?.focus({preventScroll:true});else if(selector)root.querySelector(selector)?.focus({preventScroll:true});
    updatePresenter();if(session.phase==='catch')startMotion();
  }
  function instruction(){switch(session.phase){
    case'letter':return{kind:'instruction',ids:['hello','letter-name','letter-m','word-soap','soap-start','continue']};
    case'example':return{kind:'instruction',ids:['word-milk','example-start','letter-m','example-same','continue']};
    case'packing':return session.packing.packed.length===2&&!session.packing.sent?{kind:'send-parcel',ids:['packing-send','continue']}:session.packing.sent?{kind:'none',ids:['packing-send','continue']}:{kind:'none',ids:['packing-intro',...session.packing.order.map(id=>'word-'+id)]};
    case'speak':return{kind:'instruction',ids:['speak-start','letter-m','speak-end']};
    case'catch':if(session.catch.pending)return catchTask(session.catch.pending);if(session.catch.lettersSent)return{kind:'none',ids:['letters-send','continue']};if(session.catch.collected.length===5)return{kind:'none',ids:['letters-ready']};return{kind:'instruction',ids:['catch-story','catch-how','letter-m','catch-goal']};
    case'reward':return{kind:'none',ids:['reward']};default:return null;
  }}
  function catchTask(id){return{kind:'catch',id,ids:[C[id].letterAudio,C[id].wordAudio]};}
  async function runAudio(nextTask){if(!nextTask)return;const token=++epoch;task=nextTask;ready=false;disposeDrag();stopMotion();render();
    const result=await voice.play(nextTask.ids);if(token!==epoch||result.status==='cancelled')return;if(result.status==='error'){showNotice('error');return;}
    if(nextTask.kind==='instruction')session=L.instructionDone(session);
    if(nextTask.kind==='send-parcel')session=L.sendParcel(session);
    if(nextTask.kind==='catch'){session=L.finishCatch(session,nextTask.id);fallStates.delete(nextTask.id);task=null;return void runAudio({kind:'none',ids:session.catch.collected.length===5?['letters-ready']:C[nextTask.id].target?['envelope-added']:['other-letter']});}
    if(nextTask.kind==='send-letters')session=L.sendLetters(session);
    task=null;ready=true;render();document.getElementById('status').textContent='Можно продолжать.';
  }
  function enter(){++epoch;voice.stop();disposeDrag();stopMotion();notice.hidden=true;root.inert=false;presenter.inert=false;task=null;selected=null;helpShown=session.packing.hintCount>0;ready=['welcome','parent'].includes(session.phase);render(true);window.scrollTo(0,0);
    if(!ready){if(session.phase==='catch'&&session.catch.introduced&&!session.catch.pending&&session.catch.collected.length<5){ready=true;render();}else void runAudio(instruction());}
  }
  function reset(){session=L.createSession(seedText!==null?seed:Date.now());preview=false;returnPhase='welcome';fallStates.clear();enter();}
  function drop(id){if(!ready||session.phase!=='packing')return;const result=L.pack(session,id);if(result.effect==='ignored')return;session=result.session;selected=null;
    if(result.effect==='hint')helpShown=true;
    const feedback=result.effect==='send-parcel'?{kind:'send-parcel',ids:['packing-send','continue']}:result.effect==='packed'?{kind:'none',ids:['packing-one']}:{kind:'none',ids:[C[id].letterAudio,C[id].wordAudio,result.effect==='hint'?'packing-hint':'packing-retry']};
    void runAudio(feedback);
  }
  function catchCard(id){if(!ready||session.phase!=='catch'||session.catch.pending||!L.activeIds(session,capacity()).includes(id))return;stopMotion();session=L.beginCatch(session,id,capacity());void runAudio(catchTask(id));}
  function showNotice(kind){previousFocus=document.activeElement;++epoch;voice.stop();disposeDrag();stopMotion();clearTutorial();ready=false;
    document.getElementById('notice-title').textContent=kind==='error'?'Поможем включить звук':'Сделаем паузу';document.getElementById('notice-description').textContent=kind==='error'?'Для взрослого: проверьте громкость и доступность звуковых файлов. Затем попробуйте ещё раз.':'Когда будешь готов, нажми на кнопку продолжения.';document.getElementById('resume-audio').textContent=kind==='error'?'Попробовать ещё раз':'Продолжить';notice.hidden=false;root.inert=true;presenter.inert=true;document.getElementById('resume-audio').focus();
  }
  document.getElementById('resume-audio').onclick=()=>{notice.hidden=true;root.inert=false;presenter.inert=false;previousFocus?.focus?.();if(task)void runAudio(task);else{ready=true;render();}};
  document.getElementById('notice-reset').onclick=reset;
  notice.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const first=document.getElementById('resume-audio'),last=document.getElementById('notice-reset');if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});
  root.addEventListener('click',event=>{const target=event.target.closest('button');if(!target||target.disabled)return;
    if(target.dataset.pack){if(ready){selected=selected===target.dataset.pack?null:target.dataset.pack;render();root.querySelector('[data-action="drop"]')?.focus({preventScroll:true});}return;}
    if(target.dataset.catch)return catchCard(target.dataset.catch);
    const listen=target.dataset.audio||target.dataset.listen;if(listen){if(ready)void runAudio({kind:'none',ids:[C[listen].wordAudio]});return;}
    const action=target.dataset.action;
    if(action==='reset')return reset();if(action==='parent')return;
    if(action==='back'){session.phase=returnPhase;return enter();}
    if(action==='pause')return showNotice('pause');
    if(action==='replay'){if(session.catch.pending&&session.phase==='catch')return void runAudio(catchTask(session.catch.pending));if(task)return void runAudio(task);return void runAudio(instruction());}
    if(action==='hint'&&ready){session=L.hint(session);helpShown=true;if(session.phase==='packing')void runAudio({kind:'none',ids:['packing-hint','word-soap','word-milk']});else if(session.phase==='speak')void runAudio({kind:'none',ids:['speak-hint',...L.speechHints.map(id=>C[id].wordAudio)]});return;}
    if(action==='drop'){if(selected)drop(selected);return;}
    if(action==='send-letters'&&ready&&session.catch.collected.length===5&&!session.catch.lettersSent){void runAudio({kind:'send-letters',ids:['letters-send','continue']});return;}
    if((action==='start'||action==='next')&&ready){const next=L.advance(session);if(next.phase!==session.phase){session=next;enter();}}
  });
  function cancelGate(){const held=gateTimer!==null;clearTimeout(gateTimer);gateTimer=null;root.querySelector('.parent-gate')?.classList.remove('holding');if(held&&session.phase==='catch'&&ready)startMotion();}
  function beginGate(target){if(gateTimer||session.phase==='parent')return;stopMotion();target.classList.add('holding');gateTimer=setTimeout(()=>{cancelGate();returnPhase=session.phase;session.phase='parent';enter();},2000);}
  root.addEventListener('pointerdown',event=>{const target=event.target.closest('[data-action="parent"]');if(target&&event.button===0){target.setPointerCapture(event.pointerId);beginGate(target);}});
  root.addEventListener('pointerup',cancelGate);root.addEventListener('pointercancel',cancelGate);root.addEventListener('pointerleave',cancelGate);
  root.addEventListener('keydown',event=>{if(event.target.closest('[data-action="parent"]')&&[' ','Enter'].includes(event.key)){event.preventDefault();if(!event.repeat)beginGate(event.target);}});
  root.addEventListener('keyup',event=>{if([' ','Enter'].includes(event.key))cancelGate();});root.addEventListener('focusout',event=>{if(event.target.closest('.parent-gate'))cancelGate();});window.addEventListener('blur',cancelGate);
  document.addEventListener('visibilitychange',()=>{cancelGate();if(document.hidden&&!['welcome','parent'].includes(session.phase)&&notice.hidden)showNotice('pause');});
  window.addEventListener('resize',()=>{if(session.phase==='catch')render();});motion.addEventListener('change',()=>{if(session.phase==='catch'){for(const state of fallStates.values())state.elapsed=0;startMotion();}});
  render();
})();
