import { setBusyControls, editorIndent } from './editor-controls.js';
import { roomNavigation } from './navigation.js';
import { icon, sprite } from './art.js';
import { characterPortrait, characterSprite } from './characters.js';
import { buildings, buildingById, restorationProjects, restorationById } from './restoration-content.js';
import { buildingStage, restorationUnlocked, completeRestoration, openBuilding, remember } from './restoration-model.js';
import { exhibitCatalog, displayedExhibits, displayExhibit, exhibitSource, exhibitResult, greenhouseEvaluationSource } from './exhibition-model.js';
import { wardrobeItems, wardrobeSlots, itemUnlocked, wear, wardrobeCount } from './wardrobe-model.js';
import { wardrobeSwatch } from './wardrobe-art.js';
import { weatherArt } from './cozy-ui.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const control=(action,label,id='',disabled=false,style='outline')=>`<button class="button ${style}" data-community="${action}" data-id="${esc(id)}" ${disabled?'disabled':''}>${label}</button>`;
let wardrobeSlot='hair';
const scenePolygons={
  bakery:'45,45 525,45 557,567 45,583',
  library:'548,0 1018,0 1030,535 548,535',
  greenhouse:'1035,75 1515,75 1515,585 1035,585'
};
const featureRects={bakery:[312,348,195,172],library:[815,313,119,117],greenhouse:[1312,300,130,223]};
export function courtyardArt(state,prefix='court'){
  return `<svg class="courtyard-painting" viewBox="0 0 1536 1024" aria-hidden="true"><defs>${buildings.map(b=>{
    const r=featureRects[b.id];return `<clipPath id="${prefix}-${b.id}"><polygon points="${scenePolygons[b.id]}"/></clipPath><clipPath id="${prefix}-detail-${b.id}"><rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}"/></clipPath>`;
  }).join('')}</defs><image href="assets/founders-court-before.png" width="1536" height="1024"/>${buildings.map(b=>{
    const stage=buildingStage(state,b.id),open=state.restoration.opened.includes(b.id);
    return `${stage>=1?`<image href="assets/founders-court-working.png" width="1536" height="1024" clip-path="url(#${prefix}-${b.id})"/>`:''}${stage>=2?`<image href="assets/founders-court-restored.png" width="1536" height="1024" clip-path="url(#${prefix}-detail-${b.id})"/>`:''}${open?`<image class="court-restored" href="assets/founders-court-restored.png" width="1536" height="1024" clip-path="url(#${prefix}-${b.id})"/>`:''}`;
  }).join('')}</svg>`;
}
export function renderCourtyard(state,companion={id:'pip',name:'Pip'}){
  const shown=displayedExhibits(state),open=state.restoration.opened.length;
  return `<section class="community-root courtyard-root"><header class="court-heading"><div><p class="eyebrow">THE PLACES THAT REMEMBER US</p><h1>Founders’ Court</h1><p>${open===3?'Three open doors. A village making things together.':`${open} of 3 beloved places reopened · Every small repair has a story.`}</p></div><a href="#village" class="button outline">${icon('home')} Back to the lane</a></header>
    <div class="court-stage"><div class="court-frame">${courtyardArt(state)}${weatherArt(state,'courtyard')}
      ${buildings.map(b=>{const stage=buildingStage(state,b.id),opened=state.restoration.opened.includes(b.id);return `<button class="court-building ${opened?'is-open':''}" data-community="building" data-id="${b.id}" style="left:${b.position.x}%;top:${b.position.y}%" aria-label="${esc(b.name)}. ${esc(b.changes[stage])}${stage===3&&!opened?'. Ready to reopen':''}"><span class="court-door-icon">${icon(opened?'check':b.icon)}</span><strong>${b.short}</strong><small>${opened?'Come on in':stage===3?'Ready to reopen':`${stage} / 3 repairs`}</small></button><span class="court-neighbour" style="left:${b.position.x-5}%;top:${b.position.y+9}%">${characterSprite(b.neighbour)}</span>`;}).join('')}
      <div class="court-exhibit-objects" aria-label="Projects on the square’s tables">${Array.from({length:6},(_,i)=>{const exhibit=shown[i],x=i<3?17+i*5:74+(i-3)*5;return `<button class="court-table-project ${exhibit?'filled':''}" data-community="${exhibit?'exhibit':'exhibition'}" data-id="${exhibit?.id||''}" style="left:${x}%;top:${i<3?75:75}%" aria-label="${exhibit?`Run ${esc(exhibit.title)}`:'Choose a project for this exhibition table'}"><span class="exhibit-book">${icon(exhibit?.symbol||'book')}</span><span class="exhibit-hover">${exhibit?esc(exhibit.title):'A place for your work'}</span></button>`;}).join('')}</div>
      <span class="court-traveller">${characterSprite('traveler','',state.wardrobe)}<span class="court-pet">${sprite(companion.id)}</span></span>
      <span class="court-lamplight" aria-hidden="true"></span>
      <button class="court-square-sign" data-community="exhibition">${icon('spark')} The makers’ exhibition <small>${shown.length} creations on display</small></button>
    </div></div>
    <div class="court-bottom"><p>Visit a doorway to hear its story. Your finished tools belong on the square.</p><div><a class="button outline" href="#shared">${icon('leaf')} The morning round</a>${control('journal',`${icon('book')} The neighbours’ notebook`)}${control('exhibition',`${icon('code')} Arrange the exhibition`)}<a class="button outline" href="#village">${icon('home')} Back to the lane</a></div></div>
    <p class="community-status sr-only" role="status" aria-live="polite"></p></section>`;
}
export function renderWardrobe(state){
  const owned=wardrobeItems.filter(i=>i.slot===wardrobeSlot),chosen=state.wardrobe[wardrobeSlot];
  return `<section class="community-root wardrobe-root"><header class="court-heading"><div><p class="eyebrow">UPSTAIRS AT THE HEARTH & HONEY</p><h1>Your wardrobe</h1><p>Your own quiet corner to get ready. New pieces arrive through friendships and adventures.</p></div>${roomNavigation('wardrobe')}</header>
    <div class="wardrobe-room"><div class="tailor-mirror"><div class="mirror-arch"><div class="mirror-reflection">${characterSprite('traveler','wardrobe-person',state.wardrobe)}</div><span class="mirror-glint"></span></div><div class="mirror-shelf"></div><p>${esc(state.name)}<small>${wardrobeCount(state)} of ${wardrobeItems.length} choices earned</small></p></div>
    <div class="wardrobe-rail"><nav class="wardrobe-tabs" aria-label="Clothing categories">${Object.entries(wardrobeSlots).map(([slot,label])=>`<button data-community="wardrobe-slot" data-id="${slot}" aria-pressed="${wardrobeSlot===slot}">${label}</button>`).join('')}</nav><p class="tailor-note">“A good fit should feel like coming home.”<span>— A note tucked inside the wardrobe door</span></p><div class="wardrobe-choices">${owned.map(item=>{
      const unlocked=itemUnlocked(state,item),equipped=item.id===chosen;
      return `<article class="wardrobe-choice ${unlocked?'earned':'unearned'} ${equipped?'wearing':''}"><span class="garment-swatch">${wardrobeSwatch(item.slot,item.id)}</span><div><h2>${item.name}</h2><p>${item.description}</p><small>${equipped?'Wearing now':unlocked?'Yours to wear':item.requirement}</small></div><button class="button ${equipped?'subtle':'outline'}" data-community="wear" data-id="${item.id}" data-slot="${item.slot}" ${!unlocked||equipped?'disabled':''}>${equipped?icon('check')+' On':unlocked?'Wear it':icon('lock')+' Locked'}</button></article>`;
    }).join('')}</div><p class="wardrobe-assurance">Your choices travel with you through the village, the learning trail, your room, and the café.</p><a class="text-button" href="#courtyard">Visit the places behind these keepsakes ${icon('arrow')}</a></div></div><p class="community-status" role="status" aria-live="polite"></p></section>`;
}
const dialogTop=label=>`<div class="dialog-top"><span class="eyebrow">${esc(label)}</span><button class="icon-button" data-community="close" aria-label="Close">${icon('close')}</button></div>`;
function buildingMarkup(state,id){
  const b=buildingById(id),stage=buildingStage(state,id),opened=state.restoration.opened.includes(id),next=restorationProjects.find(p=>p.building===id&&p.stage===stage+1),final=restorationProjects.find(p=>p.building===id&&p.stage===3);
  return `${dialogTop('FOUNDERS’ COURT · '+b.keeper.toUpperCase()+' REMEMBERS')}<div class="building-introduction">${characterPortrait(b.neighbour,'community-portrait')}<div><h2>${b.name}</h2><p>${b.history}</p></div></div>
    <blockquote class="neighbour-memory">${b.memories[opened?3:Math.min(stage,2)]}</blockquote><p class="community-promise">${icon(b.icon)} ${b.promise}</p>
    <ol class="restoration-steps">${restorationProjects.filter(p=>p.building===id).map(p=>`<li class="${stage>=p.stage?'done':stage+1===p.stage?'next':''}"><span>${stage>=p.stage?icon('check'):p.stage}</span><div><strong>${p.title}</strong><small>${stage>=p.stage?'Made together':`After ${p.requires} trail quests`}</small></div>${stage>=p.stage?control('project','Revisit',p.id):''}</li>`).join('')}</ol>
    ${next?`<div class="next-restoration"><p class="eyebrow">OUR NEXT SMALL PROMISE</p><h3>${next.title}</h3><p>${next.outcome}</p><small>${next.xp} XP · ${next.coins} coins on first completion</small>${restorationUnlocked(state,next)?control('project',`Make this with ${b.keeper}`,next.id,false,'primary'):`<p class="restoration-lock">${icon('lock')} Complete ${next.requires} trail quests first (${state.completed.length}/${next.requires}). <a href="#quests">Visit the learning trail</a></p>`}</div>`
    :opened?`<div class="open-service"><h3>${b.changes[3]}</h3><p>Your work now helps the volunteers who keep this place running.</p>${control('exhibit',b.service,final.id,false,'primary')}${control('exhibition','Put your work on the square')}</div>`:`<div class="opening-invitation"><p class="eyebrow">ALL THREE PROMISES KEPT</p><h3>It is time to turn the key.</h3><p>The repairs are finished. ${b.keeper} is waiting to open the doors with you.</p>${control('open-building',b.opening,id,false,'primary')}</div>`}`;
}
function projectMarkup(state,item){
  const code=state.restoration.drafts[item.id]??state.restoration.code[item.id]??item.starter,b=buildingById(item.building);
  return `${dialogTop(`${b.name} · part ${item.stage} of 3`)}<h2>${item.title}</h2><p>${item.lesson}</p><div class="community-task">${item.task}</div><label for="community-code">Your Python</label><textarea id="community-code" class="adventure-code" spellcheck="false" autocapitalize="off" autocomplete="off" maxlength="30000">${esc(code)}</textarea><p class="editor-keyboard-note">Tab indents · Shift + Tab or Esc then Tab leaves the editor · Ctrl / ⌘ + Enter runs</p><div class="community-actions">${control('run-project','Run & check',item.id,false,'primary')}${control('stop','Stop','',true)}${control('reset-code','Restore starter',item.id)}${control('building','Back to the story',item.building)}</div><details><summary>A gentle hint</summary><p>${item.hint}</p></details><details><summary>Study a worked solution</summary><pre>${esc(item.solution)}</pre><p>Try another input and explain each step before moving on.</p></details><pre id="community-output" class="adventure-output" role="status" aria-live="polite">Your results will appear here. The first Python run may take a moment to load.</pre>`;
}
function exhibitionMarkup(state){
  const catalog=exhibitCatalog(state),shown=displayedExhibits(state);
  return `${dialogTop('THE VILLAGE SQUARE · MADE BY YOU')}<h2>The makers’ exhibition</h2><p>These are working creations, not trophies behind glass. Leave up to six on the square’s tables, and welcome a neighbour to try them. Every finished creation stays in your catalogue below.</p>
    <div class="exhibition-display">${Array.from({length:6},(_,i)=>{const p=shown[i];return `<article class="exhibition-plinth ${p?'occupied':''}"><span class="plinth-number">${i+1}</span><span class="plinth-object">${icon(p?.symbol||'book')}</span><h3>${p?esc(p.title):'A place for something you make'}</h3>${p?`<p>${esc(p.caption)}</p>${control('exhibit','Run this creation',p.id,false,'primary')}${control('display','Put away',p.id)}`:'<p>Choose a finished project from your catalogue.</p>'}</article>`;}).join('')}</div>
    <h3>Your working catalogue <small>${catalog.length} creations</small></h3>${catalog.length?`<div class="exhibit-catalogue">${catalog.map(p=>`<article><span>${icon(p.symbol)}</span><div><strong>${esc(p.title)}</strong><small>${esc(p.caption)}</small></div>${control('exhibit','Try it',p.id)}${control('display',shown.some(s=>s.id===p.id)?'On display · remove':'Put on a table',p.id)}</article>`).join('')}</div>`:'<p class="empty-exhibition">The tables are ready whenever you are. Help Rowan with a first Python project, finish a High Street commission, or begin a restoration. Your saved creation will appear here.</p><a href="#village" class="button outline">Find your first project in the village</a>'}<p id="community-message" class="community-message" role="status" aria-live="polite"></p>`;
}
function demoMarkup(item){
  return `${dialogTop(item.kind==='restoration'?'A TOOL THE VILLAGE USES':'FROM YOUR EXHIBITION')}<h2>${esc(item.title)}</h2><p>${esc(item.demoNote||'Change the inputs and run the Python you saved. Repeated visits do not award additional coins or XP.')}</p>
    <div class="exhibit-inputs">${item.demo.map(f=>`<label for="exhibit-${f.name}">${esc(f.label)}${f.type==='json'?`<textarea id="exhibit-${f.name}" data-exhibit-field="${f.name}" spellcheck="false" maxlength="5000">${esc(f.value)}</textarea><p class="editor-keyboard-note">Tab indents · Shift + Tab or Esc then Tab leaves the editor · Ctrl / ⌘ + Enter runs</p>`:`<input id="exhibit-${f.name}" data-exhibit-field="${f.name}" type="${f.type==='number'?'number':'text'}" ${f.type==='number'?`step="${f.integer?1:'any'}" min="${f.min??-100000}" max="${f.max??100000}"`:''} maxlength="5000" value="${esc(f.value)}">`}</label>`).join('')}</div>
    ${item.demo.some(f=>f.type==='json')?'<small>Lists use [ ], dictionaries use { }. Use double quotes for text and null for missing readings.</small>':''}<div class="community-actions">${control('run-demo','Run my saved Python',item.id,false,'primary')}${control('stop','Stop','',true)}${item.id==='greenhouse-model'?control('evaluate-model','Check held-out examples',item.id):''}${control('exhibition','Back to the exhibition')}</div>
    <details><summary>Revisit the Python you wrote</summary><pre>${esc(item.source)}</pre></details><pre id="community-output" class="adventure-output" role="status" aria-live="polite">Your creation is ready to try.</pre>`;
}
function journalMarkup(state){
  return `${dialogTop('THE NEIGHBOURS’ NOTEBOOK')}<h2>What we are bringing back.</h2><p>Three places, many hands. The memories below become part of your notebook as the restoration progresses.</p><div class="memory-journal">${buildings.map(b=>{
    const stage=buildingStage(state,b.id),opened=state.restoration.opened.includes(b.id),last=opened?3:Math.min(stage,2);
    return `<section><div>${characterPortrait(b.neighbour,'community-portrait')}<h3>${b.name}</h3></div>${b.memories.slice(0,last+1).map((memory,i)=>`<blockquote>${memory}<small>${i===0?'Before the first repair':i===3?'The opening day':`After repair ${i}`}</small></blockquote>`).join('')}<p>${b.changes[stage]}</p>${control('building','Visit this doorway',b.id)}</section>`;
  }).join('')}</div>`;
}
function openingMarkup(state,id){
  const b=buildingById(id),gift=wardrobeItems.find(i=>(id==='bakery'&&i.id==='apron')||(id==='greenhouse'&&i.id==='moss')||(id==='library'&&i.id==='swallow'));
  return `${dialogTop('A DOOR OPENS · A STORY CONTINUES')}<div class="opening-scene">${courtyardArt(state, 'opening')}</div><div class="opening-cast">${characterPortrait(b.neighbour,'community-portrait')}${characterPortrait('traveler','community-portrait',state.wardrobe)}</div><h2>Welcome back to ${b.name}.</h2><blockquote class="neighbour-memory">${b.memories[3]}</blockquote><div class="opening-keepsake"><span>${wardrobeSwatch(gift.slot,gift.id)}</span><div><h3>${gift.name}</h3><p>${gift.description}</p><a class="button outline" href="#wardrobe">Try it on in your wardrobe</a></div></div><div class="community-actions">${control('building','See the place at work',id,false,'primary')}${control('close','Stay a while in the square')}</div>`;
}

export function mountCommunity({state,view='court',companion,onSave,onReward,onOriginalDemo,onNeighbourDemo=()=>{},runPython,cancelRun,root=document.querySelector('.community-root'),dialog=document.querySelector('#community-dialog')}){
  let alive=true,token=0,busy=false,activeProject=null,activeDemo=null,lastDoor=null;
  function status(text){const el=dialog.open?dialog.querySelector('#community-message'):root.querySelector('.community-status');if(el)el.textContent=text;}
  function repaint(){
    const focus=root.contains(document.activeElement)?document.activeElement?.closest('[data-community]')?.dataset:null;
    root.removeEventListener('click',click);root.outerHTML=view==='wardrobe'?renderWardrobe(state):renderCourtyard(state,companion);root=document.querySelector('.community-root');root.addEventListener('click',click);
    if(focus)[...root.querySelectorAll('[data-community]')].find(el=>el.dataset.community===focus.community&&el.dataset.id===focus.id)?.focus({preventScroll:true});
  }
  function save(){onSave();}
  const disabledBeforeRun = new Map();
  function setBusy(value){
    busy=value;
    setBusyControls(dialog,'[data-community]',value,disabledBeforeRun,'community',['close','building','exhibition']);
    for(const el of dialog.querySelectorAll('textarea,input'))el.readOnly=value;
  }
  function stop(){token++;if(busy)cancelRun();setBusy(false);}
  function show(html){stop();activeProject=null;activeDemo=null;dialog.innerHTML=html;if(!dialog.open)dialog.showModal();dialog.scrollTop=0;dialog.querySelector('button')?.focus();}
  function close(){stop();activeProject=null;activeDemo=null;if(dialog.open)dialog.close();root.querySelector(`[data-community="${lastDoor?'building':'exhibition'}"]${lastDoor?`[data-id="${lastDoor}"]`:''}`)?.focus({preventScroll:true});}
  function output(text){const el=dialog.querySelector('#community-output');if(el)el.textContent=text;}
  async function execute(code,checks,apply){
    if(busy)return;const mine=++token;setBusy(true);output('Warming up Python…');
    try{
      const result=await runPython(code,checks,phase=>{if(alive&&mine===token)output(phase==='loading'?'Warming up Python…':'Running your Python…');});
      if(!alive||mine!==token)return;setBusy(false);
      if(!result.passed){output(`${result.output||''}\n${result.error||'Python could not run. Check your connection and try again.'}`);return;}
      apply(result);
    }catch(error){if(alive&&mine===token){setBusy(false);output(error.message||'Please try again. Your code is saved.');}}
  }
  function showBuilding(id){
    const b=buildingById(id);if(!b)return;lastDoor=id;
    const stage=buildingStage(state,id),index=state.restoration.opened.includes(id)?3:Math.min(stage,2);
    remember(state,id,index);save();show(buildingMarkup(state,id));
  }
  function showProject(id){
    const item=restorationById(id);if(!restorationUnlocked(state,item)){status('Finish the earlier repair and the required trail lessons first.');return;}
    show(projectMarkup(state,item));activeProject=item;
  }
  function showExhibit(id){
    const item=exhibitCatalog(state).find(p=>p.id===id);if(!item){status('Finish and save this creation first.');return;}
    if(item.kind==='village'){close();onOriginalDemo(id);return;}
    if(item.kind==='neighbour'){close();onNeighbourDemo(item);return;}
    show(demoMarkup(item));activeDemo=item;
  }
  function click(event){
    const el=event.target.closest('[data-community]');if(!el)return;
    if(!root.contains(el)&&!dialog.contains(el))return;
    const {community:action,id,slot}=el.dataset;
    if(action==='close'){close();return;}
    if(action==='building'){showBuilding(id);return;}
    if(action==='journal'){show(journalMarkup(state));return;}
    if(action==='exhibition'){lastDoor=null;show(exhibitionMarkup(state));return;}
    if(action==='project'){showProject(id);return;}
    if(action==='exhibit'){showExhibit(id);return;}
    if(action==='stop'){stop();output('Stopped. Your draft is saved.');return;}
    if(busy)return;
    if(action==='wardrobe-slot'&&wardrobeSlots[id]){wardrobeSlot=id;repaint();return;}
    if(action==='wear'){
      if(wear(state,slot,id)){save();repaint();status(`${wardrobeItems.find(i=>i.slot===slot&&i.id===id).name} is now part of your look.`);}return;
    }
    if(action==='display'){
      const result=displayExhibit(state,id);if(result.ok){save();repaint();show(exhibitionMarkup(state));}
      status(result.ok?(result.shown?'Your creation has a place on the square.':'Put away safely. It is still in your catalogue.'):result.reason);return;
    }
    if(action==='open-building'){
      if(openBuilding(state,id)){remember(state,id,3);save();repaint();show(openingMarkup(state,id));onReward({xp:0,coins:0,opening:true,building:id});}return;
    }
    if(action==='reset-code'&&activeProject){
      const area=dialog.querySelector('#community-code');area.value=activeProject.starter;state.restoration.drafts[activeProject.id]=area.value;save();return;
    }
    if(action==='run-project'&&activeProject){
      const item=activeProject,code=dialog.querySelector('#community-code').value;
      state.restoration.drafts[item.id]=code;save();
      execute(code,item.checks,result=>{
        const reward=completeRestoration(state,item.id,code);if(!reward.ok)throw new Error('This repair is not available yet.');
        remember(state,item.building,Math.min(item.stage,2));save();repaint();
        output(`${result.output||''}\n${reward.replay?'Your revised tool passed. Rewards were already earned.':`A promise kept. +${reward.xp} XP · +${reward.coins} coins`}\n\n${item.outcome}\n\nUse “Back to the story” to see what changed.`);
        if(!reward.replay)onReward(reward);
      });return;
    }
    if(action==='run-demo'&&activeDemo){
      const item=activeDemo,raw=Object.fromEntries(item.demo.map(f=>[f.name,dialog.querySelector(`#exhibit-${f.name}`).value]));
      let code;try{code=exhibitSource(item,raw);}catch(error){output(error.message);return;}
      execute(code,'',result=>{const value=exhibitResult(result.output);output(`Your saved Python returned:\n${typeof value==='string'?value:JSON.stringify(value,null,2)}\n\n${item.kind==='restoration'?'The volunteers can use this report for their next round of work.':'A working creation, ready for its next visitor.'}\nNo repeat rewards are awarded.`);});return;
    }
    if(action==='evaluate-model'&&activeDemo?.id==='greenhouse-model'){
      execute(greenhouseEvaluationSource(activeDemo),'',result=>{
        const value=exhibitResult(result.output);
        output(`Held-out evaluation (labels were not passed to your model):\n${JSON.stringify(value,null,2)}\n\nA prediction can be wrong even when the Python is correct. The reading 48 is closer to a “rest” example, but its held-out label is “check”. Discuss what another feature or more representative examples could teach us.`);
      });
    }
  }
  function input(event){if(event.target.id==='community-code'&&activeProject){state.restoration.drafts[activeProject.id]=event.target.value.slice(0,30000);save();}}
  function keydown(event){
    if(event.target.id!=='community-code'||busy)return;
    editorIndent(event,input);
    if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();dialog.querySelector('[data-community="run-project"]')?.click();}
  }
  const onClose=event=>{if(event.type==='close'&&dialog.open)return;stop();activeProject=null;activeDemo=null;};
  root.addEventListener('click',click);dialog.addEventListener('click',click);dialog.addEventListener('input',input);dialog.addEventListener('keydown',keydown);dialog.addEventListener('cancel',onClose);dialog.addEventListener('close',onClose);
  return {openExhibition(){lastDoor=null;show(exhibitionMarkup(state));},dispose(){alive=false;close();root.removeEventListener('click',click);dialog.removeEventListener('click',click);dialog.removeEventListener('input',input);dialog.removeEventListener('keydown',keydown);dialog.removeEventListener('cancel',onClose);dialog.removeEventListener('close',onClose);}};
}
