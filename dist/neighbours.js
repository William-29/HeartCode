import { renderContinuing, continuingReport, testBenchLedger } from './continuing-ui.js';
import { pinButton } from './objective-ui.js';
import { neighbourPlace } from './objective-model.js';
import { renderHaven, havenBook, animalStory, introductionReview, havenReport, havenOutcome } from './haven-ui.js';
import { adoptPet } from './state.js';
import { pets } from './content.js';
import { havenCompanions } from './haven-companions.js';
import { skyConditions, observeSky, arrangeIntroduction } from './haven-model.js';
import { setBusyControls, editorIndent } from './editor-controls.js';
import { icon, sprite } from './art.js';
import { characterSprite, characterPortrait } from './characters.js';
import { courtyardArt } from './community.js';
import { weatherArt } from './cozy-ui.js';
import { renderClockwork, renderDiscoveries, clockLedger, inspectionMarkup, orderMarkup, discoveryMarkup, discoveryBook, clockReport, createMusicPlayer } from './clockwork-ui.js';
import { discoveries } from './clockwork-content.js';
import { inspectMechanism, moveMechanism, mechanismReady } from './neighbour-model.js';
import { apprentices, teachingProjects, sharedProjects, lakeProjects, neighbourProject } from './neighbour-content.js';
import { neighbourUnlocked, lockReason, answerTeaching, completeNeighbour, confidence, cast, lakeSummary, splitObservations, projectSource, projectChecks, workingSource, workingResult, weathers, shores } from './neighbour-model.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(action,label,id='',disabled=false)=>`<button class="button outline" data-neighbour="${action}" data-id="${esc(id)}" ${disabled?'disabled':''}>${label}</button>`;
const head=(title,sub,back='village')=>`<header class="court-heading"><div><p class="eyebrow">SMALL THINGS, MADE TOGETHER</p><h1>${title}</h1><p>${sub}</p></div><a class="button outline" href="#${back}">${icon('home')} Back ${back==='courtyard'?'to the court':'to the village'}</a></header>`;
const top=title=>`<div class="dialog-top"><span class="eyebrow">${esc(title)}</span><button class="icon-button" data-neighbour="close" aria-label="Close">${icon('close')}</button></div>`;
const labelWeather=w=>({sun:'Sunlit',cloud:'Overcast',rain:'Rainy'}[w]);
const confidenceLabel=n=>['Finding their voice','Trying things out','Testing with care','Ready to help someone else'][n];
function progressList(state,items){
  return `<ol class="neighbour-project-list">${items.map(p=>{
    const done=state.neighbours.completed.includes(p.id),available=neighbourUnlocked(state,p);
    return `<li><span class="lesson-knot ${done?'done':''}">${icon(done?'check':available?'code':'lock')}</span><div><strong>${p.title}</strong><small>${done?'Made together · revisit whenever you like':available?`${p.xp} XP · ${p.coins} coins on first completion`:esc(lockReason(state,p))}</small></div>${button('project',done?'Revisit':'Begin',p.id,!available)}</li>`;
  }).join('')}</ol>`;
}
export function renderNeighbours(state,view='apprentices',companion={id:'pip',name:'Pip'}){
  if(view==='stories')return renderContinuing(state);
  if(['shelter','observatory'].includes(view))return renderHaven(state,view,companion);
  if(view==='clockwork')return renderClockwork(state,companion);
  if(view==='discoveries')return renderDiscoveries(state,companion);
  if(view==='lake')return renderLake(state,companion);
  if(view==='shared')return `<section class="neighbours-root neighbours-world" data-view="shared">${head('The morning round','Three open doors become one neighbourhood.','courtyard')}<div class="court-stage"><div class="court-frame shared-frame">${courtyardArt(state,'shared')}${weatherArt(state,'courtyard')}
    ${sharedProjects.map((p,i)=>`<button class="shared-place place-${i}" data-neighbour="project" data-id="${p.id}"><span>${icon(state.neighbours.completed.includes(p.id)?'check':i===0?'leaf':i===1?'book':'spark')}</span><strong>${['The herb basket','The recipe satchel','The shared round'][i]}</strong><small>${state.neighbours.completed.includes(p.id)?'A working village tradition':neighbourUnlocked(state,p)?'Ready to make together':'A promise for later'}</small></button>`).join('')}
    ${sharedProjects.some(p=>state.neighbours.completed.includes(p.id))?`<span class="round-courier ${state.neighbours.completed.includes('shared-morning')?'round-complete':''}">${characterSprite('rowan')}<span class="delivery-basket" aria-hidden="true">${icon('leaf')}</span></span>`:''}
    ${state.neighbours.completed.includes('shared-herbs')?`<span class="shared-keepsake herb-keepsake" role="img" aria-label="The greenhouse herb basket now supplies the bakery">${icon('leaf')}</span>`:''}
    ${state.neighbours.completed.includes('shared-books')?`<span class="shared-keepsake book-keepsake" role="img" aria-label="Library recipes now travel with the herb deliveries">${icon('book')}</span>`:''}
    <span class="court-traveller">${characterSprite('traveler','',state.wardrobe)}<span class="court-pet">${sprite(companion.id)}</span></span>
    <span class="court-lamplight" aria-hidden="true"></span></div></div><div class="neighbour-bottom"><p>Visit a delivery sign. Your saved restoration tools do the work.</p>${button('shared-book','Open the shared work ledger')}</div><p class="neighbour-status sr-only" role="status"></p></section>`;
  return `<section class="neighbours-root neighbours-world" data-view="apprentices">${head('A place beside you','There is room to learn, and room to make mistakes.')}<div class="court-stage"><div class="court-frame apprentice-room"><img class="neighbour-backdrop" src="assets/tavern.png" alt="A firelit tavern with quiet tables and a place to learn together">
    ${apprentices.map((a,i)=>`<button class="apprentice-person apprentice-${i}" data-neighbour="meet" data-id="${a.id}" aria-label="Talk with ${a.name}: ${confidenceLabel(confidence(state,a.id))}">${characterSprite('traveler','',a.look)}<span class="apprentice-name">${a.name}<small>${confidenceLabel(confidence(state,a.id))}</small></span></button>`).join('')}
    <span class="teaching-player">${characterSprite('traveler','',state.wardrobe)}<span class="court-pet">${sprite(companion.id)}</span></span><span class="court-lamplight" aria-hidden="true"></span><p class="table-motto">“You don’t have to know it all to be good company.”</p>
    </div></div><div class="neighbour-bottom"><p>Pull up a chair with Nell or Kit. Explain, choose a test, then mend the code.</p><div>${apprentices.map(a=>button('meet',`Sit with ${a.name}`,a.id)).join('')}</div></div><p class="neighbour-status sr-only" role="status"></p></section>`;
}
function renderLake(state,companion){
  const n=state.neighbours,last=n.observations.at(-1),weatherState={...state,ambience:{...state.ambience,weather:n.weather==='rain'?'rain':'clear'}};
  return `<section class="neighbours-root neighbours-world" data-view="lake">${head('Willowmere Lake','A little patience. A little curiosity. Your companion at your side.')}<div class="court-stage"><div class="court-frame lake-frame weather-${n.weather}">
    <img class="neighbour-backdrop" src="assets/willowmere-lake.png" alt="A willow-fringed lake, warm cottage lights and a wooden fishing jetty">${weatherArt(weatherState,'courtyard')}<span class="lake-light" aria-hidden="true"></span><span class="lake-ripple" aria-hidden="true"></span>
    <span class="lake-traveller at-${n.shore}">${characterSprite('traveler','',state.wardrobe)}<span class="court-pet">${sprite(companion.id)}</span></span>
    <button class="lake-journal-sign" data-neighbour="journal">${icon('book')} Your observation journal <small>${n.observations.length} recorded casts</small></button>
    <p class="lake-receipt" id="lake-receipt" role="status" aria-live="polite">${last?catchMessage(last,companion):`The kettle is packed. ${esc(companion.name)} has found a spot beside you.`}</p>
    </div></div><div class="lake-controls"><label>Imagine the weather <select id="lake-weather">${weathers.map(w=>`<option value="${w}" ${n.weather===w?'selected':''}>${labelWeather(w)}</option>`).join('')}</select></label><label>Settle by <select id="lake-shore">${shores.map(s=>`<option value="${s}" ${n.shore===s?'selected':''}>${s==='reeds'?'The reeds':'The jetty'}</option>`).join('')}</select></label><button class="button primary" data-neighbour="cast">${icon('leaf')} Cast & observe</button>${button('journal','Open journal')}</div><div class="neighbour-bottom"><p>Every fish goes back into the lake. No waiting, bait costs, or missed days.</p><span><a href="#observatory">Up the hill to Elio’s observatory</a> · Fictional weather · newest 120 casts kept</span></div><p class="neighbour-status sr-only" role="status"></p></section>`;
}
function catchMessage(row,pet){return row.catch==='No catch'?`A quiet cast. ${esc(pet.name)} settles closer. “No catch” is in the journal too.`:`A ${row.catch.toLowerCase()} catches the lantern light. You record it and gently let it go. ${esc(pet.name)} watches the ripples.`;}
function apprenticeMarkup(state,id){
  const a=apprentices.find(x=>x.id===id),n=confidence(state,id);
  return `${top(a.place)}<div class="apprentice-intro">${characterPortrait('traveler','community-portrait',a.look).replace('aria-label="Your Hearthwick adventurer"',`aria-label="${a.name}, your learning companion"`)}<div><h2>A quiet lesson with ${a.name}</h2><p>${a.story}</p></div></div><blockquote class="neighbour-memory">${a.voices[n]}</blockquote><p class="confidence-thread"><span aria-hidden="true">${'●'.repeat(n)}${'○'.repeat(3-n)}</span> ${confidenceLabel(n)} · ${n}/3 conversations</p>${progressList(state,teachingProjects.filter(p=>p.npc===id))}<p class="neighbour-note">Gentle explanations build confidence. A wrong answer costs nothing; try another example together.</p>`;
}
function teachingSteps(state,p){
  return `<section class="teaching-prompts"><h3>1. Explain what happened</h3><p>${p.question}</p><div class="teaching-options">${p.choices.map((text,i)=>`<button data-neighbour="answer" data-step="explanation" data-index="${i}" data-id="${p.id}" aria-pressed="${state.neighbours.explained.includes(p.id)&&i===p.answer}">${esc(text)}</button>`).join('')}</div><p id="explanation-feedback" class="teaching-feedback" role="status">${state.neighbours.explained.includes(p.id)?p.feedback[p.answer]:''}</p><h3>2. Choose an example that teaches us something</h3><p>${p.example}</p><div class="teaching-options">${p.examples.map((text,i)=>`<button data-neighbour="answer" data-step="example" data-index="${i}" data-id="${p.id}" aria-pressed="${state.neighbours.examples.includes(p.id)&&i===p.exampleAnswer}">${esc(text)}</button>`).join('')}</div><p id="example-feedback" class="teaching-feedback" role="status">${state.neighbours.examples.includes(p.id)?p.exampleFeedback[p.exampleAnswer]:''}</p></section>`;
}
function projectMarkup(state,p){
  const available=neighbourUnlocked(state,p),done=state.neighbours.completed.includes(p.id);
  if(!available)return `${top('A PROMISE FOR LATER')}<h2>${p.title}</h2>${pinButton('neighbour:'+p.id)}<p>${p.story||p.lesson}</p><p class="neighbour-lock">${icon('lock')} ${esc(lockReason(state,p))}</p><div class="community-actions"><button class="button outline" data-action="follow-objective" data-id="neighbour:${p.id}">Show my next step →</button><a class="button outline" href="#courtyard">Visit the restoration</a></div>`;
  return `${top(p.kind==='testing'?'MIRA’S TEST BENCH':p.kind==='continuing'?'OUR NEXT CHAPTER':p.kind==='shelter'?'ROWAN’S CARE LEDGER':p.kind==='observatory'?'ELIO’S SKY JOURNAL':p.kind==='teaching'?'LEARNING BY HELPING':p.kind==='shared'?'THE SHARED WORK LEDGER':p.kind==='clock'?'MIRA’S REPAIR BENCH':p.kind==='discovery'?'THINGS WE FOUND TOGETHER':'THE LAKE JOURNAL')}<h2>${p.title}</h2>${pinButton('neighbour:'+p.id)}<p>${p.story&&p.lesson?esc(p.story):''}</p><p>${p.lesson||p.story}</p>${p.kind==='teaching'?teachingSteps(state,p):p.inspection?inspectionMarkup(state,p):''}
    ${p.tools?`<details class="borrowed-tools"><summary>The working tools you are connecting</summary><p>These are your saved restoration functions. They are loaded for this project; you can call them directly.</p>${p.tools.map(id=>`<h4>${esc(id.replaceAll('-',' '))}</h4><pre>${esc(state.restoration.code[id])}</pre>`).join('')}</details>`:''}
    <h3>${p.kind==='teaching'?'3. Mend the code together':'Make the next small connection'}</h3><p>${p.task}</p><label for="neighbour-code">Your Python</label><textarea id="neighbour-code" class="adventure-code" data-gramm="false" spellcheck="false" autocapitalize="off" autocomplete="off" maxlength="30000">${esc(state.neighbours.drafts[p.id]??state.neighbours.code[p.id]??p.starter)}</textarea><p class="editor-keyboard-note">Tab indents · Shift + Tab or Esc then Tab leaves the editor · Ctrl / ⌘ + Enter runs</p>
    <div class="community-actions">${button('run','Run & check',p.id)}${button('stop','Stop','',true)}${button('reset','Restore starter',p.id)}${done&&!['teaching','testing'].includes(p.kind)?button('use','Use my saved tool',p.id):''}</div>
    <details><summary>A gentle hint</summary><p>${p.hint}</p></details><details><summary>Study a worked solution</summary><pre>${esc(p.solution)}</pre></details>
    <p class="neighbour-note">${done?'First-completion rewards already earned. You can revise and run this as often as you like.':`${p.xp} XP · ${p.coins} coins when you first finish. ${p.kind==='teaching'?'Explain and choose a test before completing the repair.':''}`}</p>
    <pre id="neighbour-output" class="adventure-output" role="status" aria-live="polite">Your results will appear here.</pre><div id="neighbour-result"></div><div class="community-actions">${p.kind==='teaching'?button('meet','Back to our conversation',p.npc):button(p.kind==='testing'?'test-bench':p.kind==='continuing'?'stories-home':p.kind==='shelter'?'shelter-book':p.kind==='observatory'?'sky-journal':p.kind==='lake'?'journal':p.kind==='clock'?'clock-ledger':p.kind==='discovery'?'discovery-book':'shared-book','Back to the story')}</div>`;
}
function journalMarkup(state,filter='all'){
  const all=state.neighbours.observations,rows=filter==='all'?all:all.filter(r=>r.weather===filter),summary=lakeSummary(rows),split=splitObservations(all);
  return `${top('WILLOWMERE · YOUR OBSERVATIONS')}<h2>The days beside the water</h2><p>Every mark is one cast, not one fish. This journal keeps the newest 120 observations. The charts describe your fictional game sample; they are not promises about the next cast.</p><label for="journal-filter">Compare weather <select id="journal-filter"><option value="all">All weather</option>${weathers.map(w=>`<option value="${w}" ${filter===w?'selected':''}>${labelWeather(w)}</option>`).join('')}</select></label><p>${rows.length} ${rows.length===1?'cast':'casts'} in this view · ${new Set(rows.map(r=>r.weather)).size} weather ${new Set(rows.map(r=>r.weather)).size===1?'condition':'conditions'} · ${new Set(rows.map(r=>r.shore)).size} shore ${new Set(rows.map(r=>r.shore)).size===1?'spot':'spots'}</p>
    <div class="lake-chart" role="img" aria-label="${esc(summary.map(r=>`${r.name}: ${r.count} of ${rows.length}`).join('; '))}">${summary.map(r=>`<div><span>${r.name}</span><i><b style="width:${r.frequency===null?0:r.frequency*100}%"></b></i><strong>${r.count} <small>(${r.frequency===null?'—':(r.frequency*100).toFixed(1)+'%'})</small></strong></div>`).join('')}</div>
    <aside class="lake-insight"><h3>A useful question</h3><p>${rows.length<6?'What changes if you include the casts where nothing bit? Collect a few more before looking for patterns.':new Set(all.map(r=>r.weather)).size<2?'All your observations come from one kind of weather. Try another condition before claiming a weather pattern.':'You chose both the weather and the shore. A difference between groups does not prove that weather caused it. Try balanced samples from both shore spots.'}</p><p>The prediction project keeps every fifth cast aside: ${split.train.length} training and ${split.test.length} test observations. A model that remembers the training data may still guess badly on these other casts.</p></aside>
    <h3>From observations to Python</h3>${progressList(state,lakeProjects)}<details><summary>Read the observation pages (${rows.length} rows)</summary><table class="lake-records"><thead><tr><th>Cast</th><th>Weather</th><th>Shore</th><th>Observation</th></tr></thead><tbody>${rows.slice().reverse().map(r=>`<tr><td>${r.id}</td><td>${labelWeather(r.weather)}</td><td>${r.shore}</td><td>${r.catch}</td></tr>`).join('')}</tbody></table>${!rows.length?'<p>Your first cast will make the first entry.</p>':''}</details>`;
}
function sharedMarkup(state){
  return `${top('FOUNDERS’ COURT · THE MORNING ROUND')}<h2>Our doors are open. What can we do together?</h2><p>Restoring a building gave it a future. Connecting the work gives the neighbours a reason to visit each other. Your Python joins the greenhouse’s baskets, the bakery’s oven, and the library’s recipe books.</p>${progressList(state,sharedProjects)}<div class="shared-memories">${sharedProjects.filter(p=>state.neighbours.completed.includes(p.id)).map(p=>`<blockquote>${p.outcome}${button('use','See the village use it',p.id)}</blockquote>`).join('')}</div>`;
}
function reportMarkup(state,p,r){
  if(p.kind==='continuing')return continuingReport(p,r);
  if(['shelter','observatory'].includes(p.kind))return havenReport(p,r,state);
  if(['clock','discovery'].includes(p.kind))return clockReport(p,r);
  if(p.kind==='shared'){
    const parts=p.id==='shared-herbs'?[['Pick from the greenhouse',r.pick],['Bundles in the basket',r.total]]:p.id==='shared-books'?[['Books packed',r.served],['Waiting their turn',r.waiting],['Copies left',r.stock]]:[['Kit’s oven batches',r.oven?.batches],['Elio’s morning observations',r.garden],['Nell’s book satchel',r.library?.served],['Waiting for a book',r.library?.waiting]];
    return `<div class="working-round"><h3>The village is using your Python</h3>${parts.map(([title,value])=>`<section><h4>${title}</h4><pre>${esc(JSON.stringify(value,null,2))}</pre></section>`).join('')}<p>${p.outcome}</p></div>`;
  }
  if(p.id==='lake-predict')return `<div class="working-round"><h3>A fair look at your lake model</h3><p>Your guesser matched <strong>${r.correct}/${r.total}</strong> held-out catches. The overall-most-common baseline matched <strong>${r.baseline_correct}/${r.total}</strong>.</p><p>${r.training_casts} training casts; ${r.test_casts} test casts. Training labels never include the held-out answers.</p><p>Next guess in your selected weather: <strong>${esc(r.next_guess)}</strong>. It is a guess, not a promise.</p><p>${r.correct>r.baseline_correct?'Weather helped on this small sample. Test more conditions before trusting it.':'This model did not beat the simpler baseline on this sample. More features or more representative observations may help.'} Each new cast changes the notebook; run the tool again to refresh this report.</p></div>`;
  return `<div class="working-round"><h3>Your Python, on your own observations</h3><pre>${esc(JSON.stringify(r,null,2))}</pre><p>${p.id==='lake-frequency'?'These fractions describe your sample, not a known probability for every future cast.':'Every quiet cast remains in the counts.'}</p></div>`;
}
export function mountNeighbours({state,view,companion,onSave,onReward,onAdoption=()=>{},onLearn=()=>{},onFollowDiscovery=()=>{},onOpen=()=>{},runPython,cancelRun,root=document.querySelector('.neighbours-root'),dialog=document.querySelector('#neighbour-dialog')}){
  let alive=true,busy=false,token=0,active=null;
  let music=null,melody=null;
  const output=text=>{const el=dialog.querySelector('#neighbour-output');if(el)el.textContent=text;};
  const disabledBeforeRun = new Map();
  let opener=null, openerAction=null;
  function busyState(value){
    busy=value;
    setBusyControls(dialog,'[data-neighbour]',value,disabledBeforeRun,'neighbour',['close']);
    for(const el of dialog.querySelectorAll('textarea,input'))el.readOnly=value;
  }
  function stop(){token++;if(busy)cancelRun();music?.stop();busyState(false);}
  function restoreFocus(){
    const target=opener&&root.contains(opener)?opener:openerAction?[...root.querySelectorAll('[data-neighbour]')].find(el=>el.dataset.neighbour===openerAction.neighbour&&el.dataset.id===openerAction.id):null;
    target?.focus({preventScroll:true});opener=null;openerAction=null;
  }
  function show(html){stop();active=null;if(!dialog.open){opener=document.activeElement;openerAction=opener?.closest?.('[data-neighbour]')?.dataset;}dialog.innerHTML=html;if(!dialog.open)dialog.showModal();dialog.scrollTop=0;dialog.querySelector('button')?.focus();}
  function close(){stop();active=null;if(dialog.open)dialog.close();restoreFocus();}
  function repaint(){
    const focused=root.contains(document.activeElement)?document.activeElement?.closest('[data-neighbour]')?.dataset:null;
    root.removeEventListener('click',click);root.removeEventListener('change',change);
    root.outerHTML=renderNeighbours(state,view,companion);root=document.querySelector('.neighbours-root');
    root.addEventListener('click',click);root.addEventListener('change',change);
    if(focused)[...root.querySelectorAll('[data-neighbour]')].find(el=>el.dataset.neighbour===focused.neighbour&&el.dataset.id===focused.id)?.focus({preventScroll:true});
  }
  function showProject(p){if(!p)return;onOpen('neighbour:'+p.id);show(projectMarkup(state,p));if(neighbourUnlocked(state,p))active=p;}
  async function execute(code,checks,done){
    music?.stop();
    if(busy)return;const mine=++token;busyState(true);output('Warming up Python…');
    try{
      const result=await runPython(code,checks,phase=>{if(alive&&mine===token)output(phase==='loading'?'Warming up Python…':'Running your Python…');});
      if(!alive||mine!==token)return;busyState(false);
      if(!result.passed){output(`${result.output||''}\n${result.error||'Try again. Your draft is saved.'}`);return;}
      done(result);
    }catch(error){if(alive&&mine===token){busyState(false);output(error.message||'Something went wrong. Your draft is saved.');}}
  }
  function useTool(p,fromExhibition=false){
    if(!p||!state.neighbours.completed.includes(p.id)||['teaching','testing'].includes(p.kind))return;
    show(`${top('YOUR WORK IN THE WORLD')}<h2>${p.title}</h2><p>${p.story}</p><p>Run the saved Python on ${p.kind==='observatory'?'your current sky observations':p.kind==='shelter'?'the haven’s visiting animals':p.kind==='lake'?'your current observations':p.kind==='clock'?'the repaired mechanism':p.kind==='discovery'?'the note you found together':'the village’s sample morning'}. You can revise the code whenever you like.</p><div class="community-actions">${button('run-use','Run my saved tool',p.id)}${button('stop','Stop','',true)}${button('project','Revisit the code',p.id)}</div><pre id="neighbour-output" class="adventure-output" role="status" aria-live="polite">Ready when you are.</pre><div id="neighbour-result"></div>${fromExhibition?'<a class="exhibition-return" href="#courtyard/exhibition">Back to the makers’ exhibition</a>':''}`);
    melody=null;
    active=p;
  }
  function click(event){
    const el=event.target.closest('[data-neighbour]');if(!el||!root.contains(el)&&!dialog.contains(el))return;
    const {neighbour:action,id,step,index}=el.dataset;
    if(action==='close'){close();return;}
    if(action==='stop'){stop();output('Stopped. Your draft is saved.');return;}
    if(busy)return;
    if(action==='adopt-companion' && havenCompanions.some(a=>a.id===id)){
      const result=adoptPet(state,id);
      if(!result.ok){show(animalStory(state,id));const note=dialog.querySelector('.haven-adoption small');if(note)note.textContent=result.reason;return;}
      companion=pets.find(p=>p.id===state.equipped);onSave();repaint();show(animalStory(state,id));onAdoption(result,companion);return;
    }
    if(action==='shelter-book'||action==='sky-journal'){show(havenBook(state,action==='shelter-book'?'shelter':'observatory'));return;}
    if(action==='animal'){const html=animalStory(state,id);if(html)show(html);return;}
    if(action==='review-introduction'){const html=introductionReview(state,id,el.dataset.home);if(html)show(html);return;}
    if(action==='confirm-introduction'){if(arrangeIntroduction(state,id,el.dataset.home)){onSave();repaint();show(animalStory(state,id));}return;}
    if(action==='observe-sky'){if(observeSky(state)){onSave();repaint();root.querySelector('.haven-scene-note')?.classList.add('fresh-catch');}return;}
    if(action==='test-bench'){show(testBenchLedger(state));return;}
    if(action==='stories-home'){close();return;}
    if(action==='clock-ledger'){show(clockLedger(state));return;}
    if(action==='discovery-book'){show(discoveryBook(state,companion));return;}
    if(action==='discovery'&&discoveries.some(d=>d.id===id)){show(discoveryMarkup(state,id,companion));return;}
    if(action==='follow-discovery'&&discoveries.some(d=>d.id===id)){close();onFollowDiscovery(id);return;}
    if(action==='inspect'&&active?.id===id){const result=inspectMechanism(state,id,Number(index));onSave();dialog.querySelector('#inspection-feedback').textContent=result.message;for(const b of dialog.querySelectorAll('[data-neighbour="inspect"]'))b.setAttribute('aria-pressed',String(result.ok&&b===el));return;}
    if(action==='move-step'&&active?.id===id){if(moveMechanism(state,id,Number(index),Number(el.dataset.direction))){onSave();dialog.querySelector('#mechanism-order').innerHTML=orderMarkup(state,active);dialog.querySelector('#mechanism-order').querySelector('button:not([disabled])')?.focus();}return;}
    if(action==='listen'&&active?.id==='clock-melody'&&melody){music||=createMusicPlayer();output(music.play(melody)?'Your saved Python’s notes are playing softly.':'These notes cannot play here. Your Python result is still shown below.');return;}
    if(action==='quiet'){music?.stop();output('A quiet moment.');return;}
    if(action==='meet'&&apprentices.some(a=>a.id===id)){show(apprenticeMarkup(state,id));return;}
    if(action==='project'){showProject(neighbourProject(id));return;}
    if(action==='shared-book'){show(sharedMarkup(state));return;}
    if(action==='journal'){show(journalMarkup(state));return;}
    if(action==='use'){useTool(neighbourProject(id));return;}
    if(action==='cast'){
      const row=cast(state);onSave();repaint();
      const receipt=root.querySelector('#lake-receipt');receipt?.classList.add('fresh-catch');
      return;
    }
    if(action==='answer'&&active?.id===id){
      const result=answerTeaching(state,id,step,Number(index));onSave();
      const message=dialog.querySelector(`#${step}-feedback`);if(message)message.textContent=result.message;
      for(const choice of dialog.querySelectorAll(`[data-step="${step}"]`))choice.setAttribute('aria-pressed',String(result.ok&&choice===el));
      return;
    }
    if(action==='reset'&&active){
      const area=dialog.querySelector('#neighbour-code');area.value=active.starter;state.neighbours.drafts[active.id]=area.value;onSave();return;
    }
    if(action==='run'&&active){
      const p=active,code=dialog.querySelector('#neighbour-code').value;
      state.neighbours.drafts[p.id]=code;onSave();
      if(p.inspection&&(!state.neighbours.inspected.includes(p.id)||!mechanismReady(state,p))){output(p.kind==='shelter'?'Consider the animal’s needs above before running the recommender. Your code is saved.':'Inspect the mechanism and arrange its jobs first. Your code is saved.');return;}
      if(p.kind==='teaching'&&(!state.neighbours.explained.includes(p.id)||!state.neighbours.examples.includes(p.id))){output('Explain the mistake and choose a useful test together first. Your code is safe here.');return;}
      execute(projectSource(state,p,code),projectChecks(p),result=>{
        const reward=completeNeighbour(state,p.id,code);if(!reward.ok)throw new Error('Finish the earlier steps first.');
        onLearn(reward);
        onSave();repaint();
        output(`${result.output||''}\n${reward.replay?'Your revised Python passed. First-completion rewards already earned.':`Made together. +${reward.xp} XP · +${reward.coins} coins`}\n\n${havenOutcome(state,p)||apprentices.find(a=>a.id===p.npc).voices[confidence(state,p.npc)]}`);
        const area=dialog.querySelector('#neighbour-result');
        const friend=havenCompanions.find(a=>a.helpProject===p.id);
        if(area)area.innerHTML=p.kind==='testing'?button('test-bench','Return to Mira’s Test Bench'):p.kind==='teaching'?button('meet','See how your apprentice is doing',p.npc):`${friend?button('animal',`Visit ${friend.name} · ${state.owned.includes(friend.id)?'your friend':'ready to adopt'}`,friend.id):''}${button('use','See your work in the world',p.id)} <a class="exhibition-return" href="#courtyard/exhibition">Give it a place at the exhibition</a>`;
        if(!reward.replay)onReward(reward);
      });return;
    }
    if(action==='run-use'&&active){
      const p=active;let code;try{code=workingSource(state,p);}catch(error){output(error.message);return;}
      execute(code,'',result=>{
        const report=workingResult(result.output);output('Your saved Python ran successfully. This visit earns no repeat rewards.');
        if(p.id==='clock-melody')melody=report;
        dialog.querySelector('#neighbour-result').innerHTML=reportMarkup(state,p,report);
        if(p.kind==='shared')root.querySelector('.round-courier')?.classList.add('round-delivering');
      });
    }
  }
  function change(event){
    if(event.target.id==='haven-sky'&&skyConditions.includes(event.target.value)){state.neighbours.sky=event.target.value;onSave();return;}
    if(event.target.id==='journal-filter'){const value=event.target.value;show(journalMarkup(state,weathers.includes(value)?value:'all'));dialog.querySelector('#journal-filter')?.focus();return;}
    const key=event.target.id==='lake-weather'?'weather':event.target.id==='lake-shore'?'shore':null;
    if(key&&(key==='weather'?weathers:shores).includes(event.target.value)){state.neighbours[key]=event.target.value;onSave();repaint();root.querySelector(`#lake-${key}`)?.focus();}
  }
  function input(event){if(event.target.id==='neighbour-code'&&active){state.neighbours.drafts[active.id]=event.target.value.slice(0,30000);onSave();}}
  function keydown(event){
    if(event.target.id!=='neighbour-code'||busy)return;
    editorIndent(event,input);
    if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();dialog.querySelector('[data-neighbour="run"]')?.click();}
  }
  const cancelled=event=>{if(event.type==='close'&&dialog.open)return;stop();active=null;if(event.type==='close')restoreFocus();};
  root.addEventListener('click',click);root.addEventListener('change',change);
  dialog.addEventListener('click',click);dialog.addEventListener('change',change);dialog.addEventListener('input',input);dialog.addEventListener('keydown',keydown);dialog.addEventListener('cancel',cancelled);dialog.addEventListener('close',cancelled);
  return {openProject(id){showProject(neighbourProject(id));},openBench(){show(testBenchLedger(state));},openDiscovery(id){if(discoveries.some(d=>d.id===id))show(discoveryMarkup(state,id,companion));},openDemo(id,fromExhibition=false){const p=neighbourProject(id);if(p&&(neighbourPlace(p)===view))useTool(p,fromExhibition);},dispose(){alive=false;close();music?.dispose();root.removeEventListener('click',click);root.removeEventListener('change',change);dialog.removeEventListener('click',click);dialog.removeEventListener('change',change);dialog.removeEventListener('input',input);dialog.removeEventListener('keydown',keydown);dialog.removeEventListener('cancel',cancelled);dialog.removeEventListener('close',cancelled);}};
}
