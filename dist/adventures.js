import { setBusyControls, editorIndent } from './editor-controls.js';
import { adventures, adventureById, trainStops, gardenBeds, heldOutBeds } from './adventure-content.js';
import { available, ready, collectClue, chooseTheory, finishAdventure, travel, observe, customerSource, resultValue, trainingSource, keepModel, plant } from './adventure-model.js';
import { icon } from './art.js';
import { characterPortrait } from './characters.js';

const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sections={mysteries:['The detective desk','book'],shop:['Your little shop','home'],station:['The railway','map'],garden:['The learning garden','leaf']};
let section='mysteries', selectedCase='delivery';
const button=(action,label,id='',disabled=false)=>`<button class="button outline" data-adventure="${action}" data-id="${esc(id)}" ${disabled?'disabled':''}>${label}</button>`;
const lock=(state,item)=>`Complete ${item.requires} trail quests to unlock · ${Math.min(state.completed.length,item.requires)} / ${item.requires}`;
const status=(state,item)=>state.adventure.completed.includes(item.id)?'Finished · revisit any time':available(state,item)?`${item.xp} XP · ${item.coins} coins once`:lock(state,item);
const portrait=name=>characterPortrait(name==='Rowan'?'rowan':name==='Mira'?'mira':'elio','adventure-portrait');

// Keep the railway on the same illustrated journey as the village.
export function stationScene(place='home') {
  const scenes = {
    home: ['hearthwick', 'A lamplit village station, flower-filled platform and vintage steam train at sunset'],
    seaside: ['brinehaven', 'Brinehaven harbour, a seaside station, striped awnings and little boats in turquoise water'],
    snow: ['snowbell', 'Snowbell station, snowy timber cottages, warm windows and lanterns beside the mountain railway'],
    forest: ['fernwood', 'Fernwood forest academy, ivy-covered study cottages, a glasshouse and a quiet woodland platform']
  };
  const [asset, label] = scenes[place] || scenes.home;
  return `<img class="railway-art" src="assets/${asset}-station-v2.png" width="1536" height="1024" role="img" aria-label="${label}" alt="${label}">`;
}

function mysteries(state) {
  const item=adventureById(selectedCase)||adventures[0], a=state.adventure;
  const clues=a.clues[item.id]||[], done=a.completed.includes(item.id), unlocked=available(state,item);
  return `<div class="adventure-columns"><aside class="case-files"><p class="eyebrow">ROWAN'S NOTICEBOARD</p>${adventures.filter(i=>i.area==='mysteries').map(i=>`<button data-adventure="case" data-id="${i.id}" class="case-file ${i.id===item.id?'selected':''}"><span>${icon(state.adventure.completed.includes(i.id)?'check':'book')}</span><strong>${i.title}</strong><small>${esc(status(state,i))}</small></button>`).join('')}<p>No lost hearts. Take your time with the clues.</p></aside><article class="case-paper">
    <div class="adventure-voice">${portrait(item.voice)}<div><p class="eyebrow">A NOTE FROM ${esc(item.voice.toUpperCase())}</p><h2>${item.title}</h2></div></div><p>${item.intro}</p>
    ${unlocked?`<h3>1. Examine the evidence</h3><div class="evidence-row">${item.clues.map((clue,i)=>`<button class="evidence ${clues.includes(i)?'examined':''}" data-adventure="clue" data-id="${item.id}" data-index="${i}"><strong>${icon(clues.includes(i)?'check':'book')} Clue ${i+1}</strong><span>${clues.includes(i)?esc(clue):'Turn over this note'}</span></button>`).join('')}</div>
    <h3>2. Follow a theory</h3>${clues.length===item.clues.length?`<div class="theories">${item.theories.map((theory,i)=>`<button data-adventure="theory" data-id="${item.id}" data-index="${i}" class="button ${a.theories.includes(item.id)&&i===item.answer?'primary':'outline'}">${esc(theory)}</button>`).join('')}</div>`:'<p class="muted">Examine all three clues first.</p>'}
    <h3>3. Repair the Python</h3>${button('challenge',done?'Revisit your repair':'Open the ledger',item.id,!ready(state,item))}${done?`<p class="adventure-ending">${icon('check')} ${item.ending}</p>`:''}`:`<p class="notice">${lock(state,item)}</p><a class="button outline" href="#quests">Continue along the learning trail</a>`}
  </article></div>`;
}
function shop(state) {
  const a=state.adventure;
  return `<div class="shop-welcome"><div class="shop-sign"><span>EST. TODAY</span><h2>The Little Python Shop</h2><p>Useful things, made with care.</p></div><div><p>Bea left you the key to the corner shop. Complete commissions, then welcome neighbours back to try your saved tools with fresh inputs.</p><p class="muted">Each commission pays once. Returning visits are for conversation and testing your work.</p></div></div>
    <div class="commission-ledger">${adventures.filter(i=>i.area==='shop').map(item=>{
      const done=a.completed.includes(item.id), next=item.customers[(a.visits[item.id]||0)%item.customers.length];
      return `<article class="commission"><div class="commission-stamp">${icon(done?'check':'code')}</div><div><p class="eyebrow">${esc(item.voice)}</p><h3>${item.title}</h3><p>${done?item.ending:item.intro}</p><small>${status(state,item)}</small></div><div class="commission-actions">${button('challenge',done?'Revise tool':'Take commission',item.id,!available(state,item))}${done?button('customer',`Serve ${esc(next.name)}`,item.id):''}</div>${done?`<p class="customer-note">${icon('home')} ${esc(next.name)} is waiting: ${esc(next.request)}<br><small>${a.visits[item.id]||0} customer visits</small></p>`:''}</article>`;
    }).join('')}</div>`;
}
function station(state) {
  const a=state.adventure, stop=trainStops.find(s=>s.id===a.location);
  return `<div class="station-scene">${stationScene(stop?.id)}<span class="station-caption">${stop?stop.subtitle:'Platform one · the kettle is on'}</span></div>
    ${stop?`<div class="station-story"><div><p class="eyebrow">YOU HAVE ARRIVED</p><h2>${stop.name}</h2><p>${stop.story}</p></div>${button('travel','Return to Hearthwick','home')}</div><div class="landmark-row">${stop.landmarks.map(([name,text],i)=>`<button class="landmark" data-adventure="landmark" data-id="${stop.id}" data-index="${i}"><strong>${icon('leaf')} ${name}</strong><span>${a.landmarks.includes(`${stop.id}-${i}`)?text:'Stop here and look around'}</span></button>`).join('')}</div><div class="destination-mission"><div><h3>${adventureById(stop.task).title}</h3><p>${a.completed.includes(stop.task)?adventureById(stop.task).ending:adventureById(stop.task).intro}</p><small>${status(state,adventureById(stop.task))}</small></div>${button('challenge',a.completed.includes(stop.task)?'Revisit project':'Help a neighbour',stop.task)}</div>`
    :`<div class="station-story"><div><p class="eyebrow">THE HEARTHWICK LINE</p><h2>Somewhere new, something to learn.</h2><p>Your lesson progress opens the line. Trips are free, and your seat home is always saved.</p></div></div><div class="timetable">${trainStops.map(stop=>`<article><span class="ticket-number">${String(stop.requires).padStart(2,'0')}</span><div><h3>${stop.name}</h3><p>${stop.subtitle}</p><small>${available(state,stop)?a.visited.includes(stop.id)?'A familiar platform awaits':'Ready to visit':lock(state,stop)}</small></div>${button('travel','Board train',stop.id,!available(state,stop))}</article>`).join('')}</div>`}
    <div class="travel-journal"><span class="eyebrow">YOUR TRAVEL JOURNAL</span>${trainStops.map(stop=>`<span class="${a.completed.includes(stop.task)?'earned':'unearned'}">${icon(a.completed.includes(stop.task)?'check':'book')} ${stop.souvenir}</span>`).join('')}</div>`;
}
function garden(state) {
  const a=state.adventure, model=a.model, plot=a.planting, item=adventureById('garden-fit');
  const hours=gardenBeds.filter(b=>a.observations.includes(b.id)).map(b=>b.x);
  const rangeNote=hours.length?`Your recorded sunlight ranges from ${Math.min(...hours)} to ${Math.max(...hours)} hours. Outside that interval, the line is extrapolating into conditions you have not measured.`:'Record observations before choosing a prediction.';
  return `<div class="garden-intro"><div><p class="eyebrow">ELIO'S EXPERIMENT PATCH</p><h2>A garden that learns.</h2><p>Observe fictional sunflowers, fit a line, and compare its predictions with new growth. Collect observations now; the model workshop opens after 20 trail quests.</p></div>${portrait('Elio')}</div>
    <div class="observation-garden" aria-label="Six sunflower observation beds">${gardenBeds.map((b,i)=>`<button class="observation-bed ${a.observations.includes(b.id)?'observed':''}" data-adventure="observe" data-id="${b.id}" aria-label="${a.observations.includes(b.id)?`Recorded bed ${i+1}: ${b.x} ${b.x===1?'hour':'hours'}, ${b.y} centimetres`:`Observe bed ${i+1}`}"><span class="sunflower" style="--stem:${28+b.y*4}px"><span>✿</span></span><strong>Bed ${i+1}</strong><span>${a.observations.includes(b.id)?`${b.x} h sun · ${b.y} cm`:'Record observation'}</span></button>`).join('')}</div>
    <div class="garden-workbench"><section><h3>1. Your observation notebook</h3><p>${a.observations.length} / 6 training observations collected. At least four are needed to fit a line.</p>${a.observations.length?`<table><caption>Training data · fictional one-week growth</caption><thead><tr><th>Bed</th><th>Sunlight (h/day)</th><th>Growth (cm)</th></tr></thead><tbody>${gardenBeds.filter(b=>a.observations.includes(b.id)).map(b=>`<tr><td>${b.id.toUpperCase()}</td><td>${b.x}</td><td>${b.y}</td></tr>`).join('')}</tbody></table>`:'<p class="muted">Click a sunflower to measure it.</p>'}<p class="muted">Three separate held-out beds are reserved for evaluation. Their labels never go into your fitting function.</p></section>
    <section><h3>2. Fit, then check</h3><p>${available(state,item)?'Build your fitting function, then run it on the observations in your notebook.':lock(state,item)}</p><div class="adventure-actions">${button('challenge',a.completed.includes(item.id)?'Edit fitting code':'Build the model',item.id,!ready(state,item))}${button('train','Fit & evaluate',item.id,!a.completed.includes(item.id)||a.observations.length<4)}</div>${model?`<div class="model-report"><strong>growth = ${model.slope.toFixed(3)} × sunlight + ${model.intercept.toFixed(3)}</strong><p>Held-out MAE: <b>${model.mae.toFixed(2)} cm</b><br>Training-mean baseline MAE: <b>${model.baselineMae.toFixed(2)} cm</b></p><small>Lower is better. Only ${heldOutBeds.length} held-out examples: this is a small experiment, not proof of a general rule.</small></div>`:'<p class="muted">Collecting another observation or editing your fitting code clears the old model. Fit again to use the new version.</p>'}</section></div>
    <section class="prediction-patch"><div><h3>3. Plan a new bed</h3><p>Choose 1 to 6 sunlight hours. Your fitted line determines the predicted plant height.</p><p class="muted">${rangeNote}</p><label>Sunlight hours per day <input id="garden-hours" type="number" min="1" max="6" step="0.5" value="${plot?.hours||4}" ${model?'':'disabled'}></label>${button('plant','Plant with this prediction','',!model)}${plot?`<p>Prediction: <strong>${plot.predicted.toFixed(2)} cm</strong>${plot.revealed?` · Observed growth: <strong>${plot.actual.toFixed(1)} cm</strong><br>Absolute error: ${Math.abs(plot.actual-plot.predicted).toFixed(2)} cm`:' · The real growth is still covered.'}</p>${plot.revealed?'<p class="muted">This simulated new bed is another evaluation, not a training observation.</p>':button('grow','Advance one growing week')}`:''}</div><div class="prediction-plant">${plot?`<div><span class="sunflower predicted" style="--stem:${Math.max(10,Math.min(140,plot.predicted*8))}px"><span>✿</span></span><small>Predicted</small></div>${plot.revealed?`<div><span class="sunflower" style="--stem:${plot.actual*8}px"><span>✿</span></span><small>Observed</small></div>`:''}`:'<span class="empty-pot">A little room to grow.</span>'}</div></section>`;
}
export function renderAdventures(state) {
  return `<section class="adventure-hub"><header class="adventure-heading"><div><p class="eyebrow">JUST AROUND THE CORNER</p><h1>Hearthwick High Street</h1></div><a href="#village" class="button outline">${icon('home')} Back to the village</a></header><nav class="adventure-tabs" aria-label="High Street places">${Object.entries(sections).map(([key,[label,symbol]])=>`<button data-adventure="section" data-id="${key}" class="${section===key?'active':''}" ${section===key?'aria-current="page"':''}>${icon(symbol)}<span>${label}</span></button>`).join('')}</nav><div id="adventure-place">${({mysteries,shop,station,garden})[section](state)}</div><p id="adventure-message" class="adventure-message" role="status" aria-live="polite"></p></section>`;
}
function challengeMarkup(state,item) {
  const code=state.adventure.drafts[item.id]??state.adventure.code[item.id]??item.starter;
  return `<div class="dialog-top"><span class="eyebrow">${esc(item.voice)} · ${item.xp} XP / ${item.coins} coins once</span><button class="icon-button" data-work="close" aria-label="Close activity">${icon('close')}</button></div><h2>${item.title}</h2><p>${item.lesson}</p><div class="adventure-task">${item.task}</div><label for="adventure-code">Your Python</label><textarea id="adventure-code" class="adventure-code" data-gramm="false" spellcheck="false" autocapitalize="off" autocomplete="off" maxlength="30000">${esc(code)}</textarea><p class="editor-keyboard-note">Tab indents · Shift + Tab or Esc then Tab leaves the editor · Ctrl / ⌘ + Enter runs</p><div class="adventure-actions">${buttonWork('run','Run & check')}${buttonWork('stop','Stop',true)}${buttonWork('reset','Restore starter')}</div><details><summary>A gentle hint</summary><p>${item.hint}</p></details><details><summary>Study a worked solution</summary><pre>${esc(item.solution)}</pre><p>Try changing the inputs to explain why this works.</p></details><pre id="adventure-output" class="adventure-output" role="status" aria-live="polite">Your results will appear here. Python may take a moment to load the first time.</pre>`;
}
const buttonWork=(action,label,disabled=false)=>`<button class="button ${action==='run'?'primary':'outline'}" data-work="${action}" ${disabled?'disabled':''}>${label}</button>`;

export function mountAdventures({state,onSave,onReward,onLearn=()=>{},onOpen=()=>{},runPython,cancelRun,root=document.querySelector('.adventure-hub'),dialog=document.querySelector('#adventure-dialog')}) {
  let alive=true, serial=0, current=null, busy=false;
  const save=()=>onSave();
  const message=text=>{const el=root.querySelector('#adventure-message');if(el)el.textContent=text;};
  const redraw=(entrance=false)=>{
    const focus=root.contains(document.activeElement)?document.activeElement?.closest('[data-adventure]')?.dataset:null;
    root.removeEventListener('click',click);
    root.outerHTML=renderAdventures(state);root=document.querySelector('.adventure-hub');root.addEventListener('click',click);
    if(focus) [...root.querySelectorAll('[data-adventure]')].find(el=>el.dataset.adventure===focus.adventure&&el.dataset.id===focus.id&&el.dataset.index===focus.index)?.focus({preventScroll:true});
    if(entrance){const main=root.closest('main');if(main)main.scrollTop=0;}
  };
  const output=text=>{const el=dialog.querySelector('#adventure-output');if(el)el.textContent=text;};
  function stop(){serial++;if(busy)cancelRun();busy=false;setBusy(false);}
  const disabledBeforeRun = new Map();
  function setBusy(value){
    busy=value;
    setBusyControls(dialog,'[data-work]',value,disabledBeforeRun,'work',['close']);
    for(const el of dialog.querySelectorAll('textarea,input'))el.readOnly=value;
  }
  function focusActivity(item){
    const id=item?.id||item?.customerId;
    if(id) [...root.querySelectorAll('[data-adventure]')].find(el=>el.dataset.id===id&&el.dataset.adventure===(item.customerId?'customer':'challenge'))?.focus({preventScroll:true});
  }
  function close(){stop();const last=current;current=null;if(dialog.open)dialog.close();focusActivity(last);}
  function show(html){stop();dialog.innerHTML=html;if(!dialog.open)dialog.showModal();dialog.querySelector('button')?.focus();}
  async function execute(code,checks,apply){
    if(busy)return;
    const token=++serial;setBusy(true);output('Warming up Python…');
    try {
      const result=await runPython(code,checks,phase=>{if(alive&&token===serial)output(typeof phase==='string'?phase:'Running Python…');});
      if(!alive||token!==serial)return;
      setBusy(false);
      if(!result.passed){output(result.cancelled?'Stopped. Your code is saved.':`${result.output||''}\n${result.error||'Python could not run. Check your connection and try again.'}`);return;}
      apply(result);
    } catch(error){if(alive&&token===serial){setBusy(false);output(error.message||'Something went wrong. Please try again.');}}
  }
  function openChallenge(id){
    const item=adventureById(id);
    if(!ready(state,item)){message('Complete the lesson requirement and activity steps first.');return;}
    onOpen('adventure:'+id);show(challengeMarkup(state,item));current=item;
  }
  function openCustomer(id) {
    let demo;try{demo=customerSource(state,id);}catch(error){message(error.message);return;}
    show(`<div class="dialog-top"><span class="eyebrow">A NEIGHBOUR AT YOUR COUNTER</span><button class="icon-button" data-work="close" aria-label="Close customer">${icon('close')}</button></div><h2>${esc(demo.customer.name)} stopped by.</h2><p>${esc(demo.customer.request)}</p><p>Your saved Python tool will handle this request. No additional coins are awarded for repeat visits.</p><div class="adventure-actions">${buttonWork('serve','Use my tool')}${buttonWork('stop','Stop',true)}</div><pre id="adventure-output" class="adventure-output" role="status" aria-live="polite">Ready when you are.</pre>`);
    current={customerId:id,demo};
  }
  function click(event){
    const el=event.target.closest('[data-adventure]');if(!el||!root.contains(el))return;
    const {adventure:action,id,index}=el.dataset;
    if(action==='section'){if(!sections[id])return;section=id;redraw(true);return;}
    if(action==='case'){selectedCase=id;redraw();return;}
    if(action==='clue'){if(collectClue(state,id,Number(index))){save();redraw();}return;}
    if(action==='theory'){if(chooseTheory(state,id,Number(index))){save();redraw();message('That fits the evidence. Now test your repair in Python.');}else message('That theory does not explain all the clues. Read the notes together and try again.');return;}
    if(action==='challenge'){openChallenge(id);return;}
    if(action==='customer'){openCustomer(id);return;}
    if(action==='travel'){
      if(!travel(state,id)){message('Keep learning to open this railway line.');return;}
      save();redraw(true);root.querySelector('.station-scene')?.classList.add('arriving');message(id==='home'?'Welcome home.':`Next stop: ${trainStops.find(s=>s.id===id).name}. You have arrived.`);return;
    }
    if(action==='landmark'){
      const stop=trainStops.find(s=>s.id===id);
      if(state.adventure.location!==id||!stop?.landmarks[Number(index)])return;
      const key=`${id}-${index}`;if(!state.adventure.landmarks.includes(key))state.adventure.landmarks.push(key);
      save();redraw();return;
    }
    if(action==='observe'){if(observe(state,id)){save();redraw();message('Observation recorded in your notebook.');}return;}
    if(action==='train'){
      let source;try{source=trainingSource(state);}catch(error){message(error.message);return;}
      show(`<div class="dialog-top"><span class="eyebrow">GARDEN WORKSHOP</span><button class="icon-button" data-work="close" aria-label="Close workshop">${icon('close')}</button></div><h2>Fit on training. Check on held-out beds.</h2><p>Your saved fitting function receives only your notebook observations. Evaluation follows fitting.</p>${buttonWork('stop','Stop')}<pre id="adventure-output" class="adventure-output" role="status" aria-live="polite"></pre>`);
      current=null;execute(source,'',result=>{if(!keepModel(state,resultValue(result.output)))throw new Error('The model result was invalid. Check your fitting code.');save();redraw();output(`Model fitted and saved.\nHeld-out MAE: ${state.adventure.model.mae.toFixed(2)} cm.\nClose this window to plant a prediction.`);});return;
    }
    if(action==='plant'){
      const field=root.querySelector('#garden-hours'), hours=field?.value.trim()?Number(field.value):NaN;
      if(plant(state,hours)){save();redraw();message('Your prediction is planted. Advance a growing week to compare it with observed growth.');}else message('Fit a model first, then choose sunlight from 1 to 6 hours.');return;
    }
    if(action==='grow'&&state.adventure.planting){state.adventure.planting.revealed=true;save();redraw();message('A week has passed in the garden. Compare the two plants.');}
  }
  function work(event){
    const action=event.target.closest('[data-work]')?.dataset.work;if(!action)return;
    if(action==='close'){close();return;}
    if(action==='stop'){stop();output('Stopped. Your code is saved.');return;}
    if(busy)return;
    if(action==='reset'&&current?.id){const el=dialog.querySelector('#adventure-code');el.value=current.starter;state.adventure.drafts[current.id]=el.value;save();return;}
    if(action==='run'&&current?.id){
      const item=current,code=dialog.querySelector('#adventure-code').value;
      state.adventure.drafts[item.id]=code;save();
      execute(code,item.checks,result=>{
        const reward=finishAdventure(state,item.id,code);if(!reward.ok)throw new Error('This activity is not available yet.');
        onLearn(reward);
        save();redraw();output(`${result.output||''}\n${reward.replay?'Your revised code passed. Rewards were already collected.':`Well done! +${reward.xp} XP · +${reward.coins} coins`}\n\n${item.ending}`);
        if(!reward.replay)onReward(reward,item);
      });return;
    }
    if(action==='serve'&&current?.customerId){
      const {customerId,demo}=current;
      execute(demo.code,adventureById(customerId).checks,result=>{
        const value=resultValue(result.output);
        state.adventure.visits[customerId]=(state.adventure.visits[customerId]||0)+1;save();redraw();
        output(`${demo.customer.name}'s result: ${typeof value==='object'?JSON.stringify(value,null,2):value} ${demo.customer.unit}\n\n“Thank you. That is just what I needed.”\nYour saved Python function produced this result.`);
        const serve=dialog.querySelector('[data-work="serve"]');if(serve)serve.disabled=true;
        current=null;
      });
    }
  }
  function input(event){if(event.target.id==='adventure-code'&&current?.id){state.adventure.drafts[current.id]=event.target.value.slice(0,30000);save();}}
  function keydown(event){
    if(event.target.id!=='adventure-code')return;
    if(!busy)editorIndent(event,input);
    if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();dialog.querySelector('[data-work="run"]')?.click();}
  }
  const onClose=event=>{if(event.type==='close'&&dialog.open)return;stop();const last=current;current=null;focusActivity(last);};
  root.addEventListener('click',click);dialog.addEventListener('click',work);dialog.addEventListener('input',input);dialog.addEventListener('keydown',keydown);dialog.addEventListener('close',onClose);dialog.addEventListener('cancel',onClose);
  return {openStory(id){const item=adventureById(id);if(!item)return;section=item.area;if(item.area==='mysteries')selectedCase=id;redraw(true);if(ready(state,item))openChallenge(id);},dispose(){alive=false;close();root.removeEventListener('click',click);dialog.removeEventListener('click',work);dialog.removeEventListener('input',input);dialog.removeEventListener('keydown',keydown);dialog.removeEventListener('close',onClose);dialog.removeEventListener('cancel',onClose);}};
}
