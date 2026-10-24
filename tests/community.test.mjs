import { clockProjects } from '../dist/clockwork-content.js';
import { completeNeighbour, inspectMechanism } from '../dist/neighbour-model.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { freshState, normalizeState } from '../dist/state.js';
import { quests } from '../dist/content.js';
import { projects } from '../dist/projects.js';
import { adventures } from '../dist/adventure-content.js';
import { buildings, restorationProjects, restorationById } from '../dist/restoration-content.js';
import { buildingStage, restorationUnlocked, completeRestoration, openBuilding, remember } from '../dist/restoration-model.js';
import { wardrobeItems, freshWardrobe, normalizeWardrobe, itemUnlocked, wear } from '../dist/wardrobe-model.js';
import { exhibitCatalog, displayedExhibits, displayExhibit, exhibitSource, exhibitResult, demoDefaults, greenhouseEvaluationSource } from '../dist/exhibition-model.js';
import { renderCourtyard, renderWardrobe, courtyardArt, mountCommunity } from '../dist/community.js';
import { wardrobeLayers, dressedArt } from '../dist/wardrobe-art.js';
import { renderVillage } from '../dist/village.js';
import { renderWorld } from '../dist/world.js';
import { renderRoom, renderCafe } from '../dist/village-life.js';
import { renderVillager } from '../dist/village-stories.js';
import { ambientLevels } from '../dist/ambience.js';

function progressed(n=60){const s=freshState();s.completed=quests.slice(0,n).map(q=>q.id);return s;}
function repair(s,building){
  for(const p of restorationProjects.filter(p=>!building||p.building===building))assert.equal(completeRestoration(s,p.id,p.solution).ok,true);
}
function python(cases){
  const p=spawnSync('python',['-c',`import sys,json,importlib.util
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location("runtime","dist/runtime.py")
runtime=importlib.util.module_from_spec(spec);spec.loader.exec_module(runtime)
print(json.dumps([json.loads(runtime.run_source(c["code"],c.get("checks",""))) for c in json.load(sys.stdin)]))
`],{input:JSON.stringify(cases),encoding:'utf8',env:{...process.env,PYTHONUTF8:'1'},timeout:20000});
  assert.equal(p.status,0,p.stderr);return JSON.parse(p.stdout);
}
test('restoration progresses through three independent building stories with both lesson and repair prerequisites',()=>{
  assert.equal(restorationProjects.length,9);
  const s=freshState();
  for(const p of restorationProjects)assert.equal(restorationUnlocked(s,p),false);
  s.completed=quests.slice(0,2).map(q=>q.id);
  assert.deepEqual(restorationProjects.filter(p=>restorationUnlocked(s,p)).map(p=>p.id),['bakery-flour','greenhouse-glass']);
  for(const b of buildings){
    const state=progressed(),stages=restorationProjects.filter(p=>p.building===b.id);
    assert.equal(completeRestoration(state,stages[2].id,stages[2].solution).ok,false);
    assert.equal(openBuilding(state,b.id),false);
    for(const p of stages){
      const reward=completeRestoration(state,p.id,p.solution);assert.equal(reward.ok,true);assert.equal(reward.xp,p.xp);
      assert.equal(buildingStage(state,b.id),p.stage);
      const coins=state.coins,xp=state.xp;assert.equal(completeRestoration(state,p.id,p.solution).replay,true);
      assert.equal(state.coins,coins);assert.equal(state.xp,xp);
    }
    assert.equal(remember(state,b.id,3),false);
    const coins=state.coins;assert.equal(openBuilding(state,b.id),true);assert.equal(openBuilding(state,b.id),false);
    assert.equal(remember(state,b.id,3),true);assert.equal(state.coins,coins);
    assert.equal(state.completed.length,60);assert.equal(state.projects.length,0);
  }
});
test('legacy and complete saves round-trip without losing progress; imports reject gaps, unowned exhibits and locked clothing',()=>{
  const old=progressed(4);delete old.restoration;delete old.wardrobe;old.coins=177;
  const restored=normalizeState(old);assert.equal(restored.coins,177);assert.deepEqual(restored.wardrobe,freshWardrobe());
  assert.equal(restored.restoration.completed.length,0);
  const s=progressed();repair(s);for(const b of buildings){openBuilding(s,b.id);remember(s,b.id,3);}
  wear(s,'outfit','moss');wear(s,'accessory','swallow');s.restoration.exhibition=['bakery-planner','greenhouse-model'];
  assert.deepEqual(normalizeState(JSON.parse(JSON.stringify(s))),s);
  const bad=progressed(4);
  bad.restoration={completed:['library-loans','bakery-flour','bakery-flour'],code:{'library-loans':'pass','bakery-flour':'x'.repeat(40000)},drafts:{'library-loans':'pass'},opened:['library','bakery'],memories:['bakery-3','unknown'],exhibition:['library-loans','alien','bakery-flour','bakery-flour']};
  bad.wardrobe={hair:'waves',outfit:'apron',scarf:'sage',accessory:'swallow'};
  const safe=normalizeState(bad);
  assert.deepEqual(safe.restoration.completed,['bakery-flour']);assert.equal(safe.restoration.code['bakery-flour'].length,30000);
  assert.deepEqual(safe.restoration.opened,[]);assert.deepEqual(safe.restoration.memories,[]);
  assert.deepEqual(safe.restoration.exhibition,['bakery-flour']);assert.deepEqual(safe.wardrobe,{...freshWardrobe(),hair:'waves'});
  assert.equal(safe.restoration.drafts['library-loans'],undefined);
});
test('all nine projects pass their real Python checks while blanks and plausible bugs fail',()=>{
  const wrong={
    'bakery-flour':'def flour_needed(loaves, grams_per_loaf):\n return int(loaves*grams_per_loaf)',
    'bakery-shopping':'def shopping_list(recipe, stock, batches):\n return {k:v*batches-stock.get(k,0) for k,v in recipe.items()}',
    'bakery-planner':'def plan_bakes(orders, capacity):\n return {"totals":dict(orders),"batches":[dict(orders)]}',
    'library-titles':'def clean_title(title):\n return title.title()',
    'library-search':'def find_books(catalog, query):\n return sorted(t for t in catalog if query in t)',
    'library-loans':'def lend_books(catalog, requests):\n return {"stock":catalog,"served":[t for t in requests if catalog.get(t,0)>0],"waiting":[]}',
    'greenhouse-glass':'def glass_order(total, intact, spares):\n return total-intact-spares',
    'greenhouse-water':'def watering_plan(beds, target):\n return {k:target-v for k,v in beds.items() if v and v<target}',
    'greenhouse-model':'def classify_plants(examples, readings):\n return {"labels":[examples[0][1]]*len(readings),"counts":{examples[0][1]:len(readings)}}'
  };
  const result=python(restorationProjects.flatMap(p=>[p.solution,'',wrong[p.id]].map(code=>({code,checks:p.checks}))));
  restorationProjects.forEach((p,i)=>{assert.equal(result[i*3].passed,true,`${p.id}: ${result[i*3].error}`);assert.equal(result[i*3+1].passed,false,p.id);assert.equal(result[i*3+2].passed,false,p.id);});
});
test('clothes are earned through specific quest, friendship and opening milestones, with no purchases or reward farming',()=>{
  const s=freshState(),coins=s.coins;
  assert.equal(wear(s,'outfit','apron'),false);assert.equal(wear(s,'hair','waves'),false);
  assert.equal(wear(s,'scarf','none'),true);
  s.completed=quests.slice(0,4).map(q=>q.id);assert.equal(wear(s,'hair','waves'),true);
  s.projects=['project-tavern-bill'];assert.equal(wear(s,'scarf','ember'),false);
  s.projects.push('project-pantry-ledger');assert.equal(wear(s,'scarf','ember'),true);
  s.projects.push('project-plant-adviser');assert.equal(wear(s,'hair','braid'),true);assert.equal(wear(s,'scarf','sage'),false);
  s.projects.push('project-lantern-predictor');assert.equal(wear(s,'scarf','sage'),true);assert.equal(s.coins,coins);
  s.completed=quests.map(q=>q.id);repair(s);
  for(const [b,slot,id] of [['bakery','outfit','apron'],['greenhouse','outfit','moss'],['library','accessory','swallow']]){
    assert.equal(wear(s,slot,id),false);openBuilding(s,b);assert.equal(wear(s,slot,id),true);
  }
  assert.ok(wardrobeItems.every(i=>itemUnlocked(s,i)));
  assert.deepEqual(normalizeWardrobe(s.wardrobe,s),s.wardrobe);
  assert.equal(wear(s,'alien','cap'),false);
});
test('exhibition gathers completed original games, High Street tools and restoration projects; six curated places persist',()=>{
  const s=progressed();
  s.projects=projects.map(p=>p.id);s.projectCode=Object.fromEntries(projects.map(p=>[p.id,p.solution]));
  s.adventure.completed=adventures.map(p=>p.id);s.adventure.code=Object.fromEntries(adventures.map(p=>[p.id,p.solution]));
  repair(s);
  assert.equal(exhibitCatalog(s).length,25);assert.equal(displayedExhibits(s).length,6);
  const coins=s.coins;assert.equal(displayExhibit(s,'greenhouse-model').ok,false);
  assert.equal(displayExhibit(s,projects[0].id).shown,false);
  assert.equal(displayExhibit(s,'greenhouse-model').shown,true);
  assert.ok(displayedExhibits(s).some(p=>p.id==='greenhouse-model'));
  assert.equal(displayExhibit(s,'alien').ok,false);assert.equal(s.coins,coins);
  for(const p of [...displayedExhibits(s)])displayExhibit(s,p.id);
  assert.deepEqual(displayedExhibits(s),[]);
  assert.deepEqual(normalizeState(s).restoration.exhibition,[]);
});
test('every new exhibit runs saved Python with actual controls, and hostile-looking field text remains data',()=>{
  const s=progressed();repair(s);
  s.adventure.completed=adventures.map(p=>p.id);s.adventure.code=Object.fromEntries(adventures.map(p=>[p.id,p.solution]));
  const items=exhibitCatalog(s);
  const result=python(items.map(p=>({code:exhibitSource(p,demoDefaults(p))})));
  for(const [i,r] of result.entries()){assert.equal(r.passed,true,`${items[i].id}: ${r.error}`);assert.doesNotThrow(()=>exhibitResult(r.output));}
  const title=items.find(p=>p.id==='library-titles');
  const strange='"); raise RuntimeError("oops") #';
  const injected=python([{code:exhibitSource(title,{title:strange})}])[0];
  assert.equal(injected.passed,true,injected.error);assert.equal(exhibitResult(injected.output),'"); Raise Runtimeerror("Oops") #');
  const numeric=items.find(p=>p.id==='bakery-flour'),structured=items.find(p=>p.id==='library-loans');
  for(const value of ['',NaN,Infinity,100001])assert.throws(()=>exhibitSource(numeric,{loaves:value,grams_per_loaf:200}),/finite/);
  assert.throws(()=>exhibitSource(structured,{catalog:'not JSON',requests:'[]'}),/valid JSON/);
  assert.throws(()=>exhibitSource(structured,{catalog:'null',requests:'[]'}),/list or dictionary/);
});
test('the reopened greenhouse evaluates held-out examples after prediction and shows a useful imperfect result',()=>{
  const s=progressed();repair(s,'greenhouse');openBuilding(s,'greenhouse');
  const p=exhibitCatalog(s).find(i=>i.id==='greenhouse-model');
  p.source+='\n_original=classify_plants\ndef classify_plants(examples, readings):\n assert all(pair[0] not in readings for pair in examples)\n assert "_truth" not in globals()\n return _original(examples, readings)';
  const r=python([{code:greenhouseEvaluationSource(p)}])[0];assert.equal(r.passed,true,r.error);
  assert.deepEqual(exhibitResult(r.output),{predictions:['check','rest','rest','check'],held_out_labels:['check','check','rest','check'],correct:3,total:4,accuracy:.75});
});
test('building stages have distinct artwork, reveal memories in order and change the original neighbour conversation',()=>{
  const s=progressed(),snapshots=[courtyardArt(s)];
  for(const p of restorationProjects.filter(p=>p.building==='library').slice(0,2)){completeRestoration(s,p.id,p.solution);snapshots.push(courtyardArt(s));}
  const last=restorationById('library-loans');completeRestoration(s,last.id,last.solution);
  assert.doesNotMatch(courtyardArt(s),/class="court-restored"/);
  openBuilding(s,'library');snapshots.push(courtyardArt(s));assert.equal(new Set(snapshots).size,4);
  assert.match(renderVillager(s,'mira'),/A child chooses the same clock book/);
  assert.match(renderCourtyard(s),/1 of 3 beloved places reopened/);
  assert.match(renderCourtyard(s),/The makers’ exhibition/);
});
test('the selected character layers are used in every player location and fit within verified atlas bounds',()=>{
  const s=progressed();repair(s);buildings.forEach(b=>openBuilding(s,b.id));
  s.wardrobe={hair:'braid',outfit:'moss',scarf:'sage',accessory:'swallow'};
  const renders=[renderVillage(s),renderWorld(s,{id:'pip',name:'Pip'}),renderRoom(s,{id:'pip',name:'Pip'}),renderCafe(s,{id:'pip',name:'Pip'}),renderCourtyard(s),renderWardrobe(s)];
  for(const html of renders){assert.match(html,/dressed-character-art/);assert.match(html,/hearthwick-outfits.png/);assert.match(html,/hearthwick-hairstyles.png/);}
  assert.match(renderRoom(s,{id:'pip',name:'Pip'}),/data-route="wardrobe"/);
  for(const outfit of ['rust','moss','apron'])for(const hair of ['cap','waves','braid'])for(const scarf of ['none','cream','ember','sage']){
    const layers=wardrobeLayers({outfit,hair,scarf,accessory:'swallow'});
    for(const l of layers){
      const png=readFileSync(new URL('../dist/'+l.src,import.meta.url));
      const w=png.readUInt32BE(16),h=png.readUInt32BE(20);
      assert.equal(png[25],6,'painted layers retain alpha transparency');
      assert.ok(l.crop[0]>=0&&l.crop[1]>=0&&l.crop[0]+l.crop[2]<=w&&l.crop[1]+l.crop[3]<=h,l.src);
      assert.ok(l.place[0]>=0&&l.place[1]>=0&&l.place[0]+l.place[2]<=400&&l.place[1]+l.place[3]<=900);
    }
  }
  assert.doesNotMatch(dressedArt({hair:'<script>'}),/<script>/);
});
test('courtyard and wardrobe inherit the existing optional weather and sound controls',()=>{
  const s=freshState();s.ambience={weather:'rain',rain:true,fire:true,cafe:true,motion:false,volume:.4};
  assert.match(renderCourtyard(s),/weather-courtyard weather-still/);
  assert.deepEqual(ambientLevels(s.ambience,'courtyard'),ambientLevels(s.ambience,'village'));
  assert.deepEqual(ambientLevels(s.ambience,'wardrobe'),ambientLevels(s.ambience,'room'));
  s.ambience.weather='clear';assert.doesNotMatch(renderCourtyard(s),/weather-courtyard/);
});

function harness(state=progressed(),view='court'){
  let pending,rewards=[],saves=0,cancels=0,originalDemos=[],neighbourDemos=[],learned=0;
  const previousDocument=globalThis.document,decode=s=>s.replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&amp;','&');
  class Element extends EventTarget{
    constructor(dataset={}){super();this.dataset=dataset;this.open=false;this.value='';this.textContent='';this.disabled=false;this.fields=new Map();this.buttons=[];this.scrollTop=0;}
    set innerHTML(value){
      this.html=value;this.fields=new Map();this.buttons=[];
      for(const m of value.matchAll(/<button\b([^>]*)>/g)){const b=new Element(Object.fromEntries([...m[1].matchAll(/data-([a-z-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]])));b.disabled=m[1].includes('disabled');this.buttons.push(b);}
      for(const m of value.matchAll(/<(textarea|input|pre|p)\b([^>]*\bid="([^"]+)"[^>]*)>/g)){
        const f=new Element();f.id=m[3];
        if(m[1]==='textarea')f.value=decode(value.slice(m.index+m[0].length).split('</textarea>')[0]);
        else if(m[1]==='input')f.value=decode(m[2].match(/value="([^"]*)"/)?.[1]||'');
        this.fields.set(f.id,f);
      }
    }
    get innerHTML(){return this.html;}set outerHTML(value){this.innerHTML=value;}
    querySelector(selector){
      if(selector[0]==='#')return this.fields.get(selector.slice(1))||null;
      if(selector==='button')return this.buttons[0];
      const action=selector.match(/data-community="([^"]+)"/)?.[1],id=selector.match(/data-id="([^"]+)"/)?.[1];
      return this.buttons.find(b=>(!action||b.dataset.community===action)&&(!id||b.dataset.id===id))||null;
    }
    querySelectorAll(selector){return selector==='textarea,input'?[...this.fields.values()].filter(f=>f.id==='community-code'||f.id.startsWith('exhibit-')):this.buttons;}
    contains(el){return this.buttons.includes(el)||[...this.fields.values()].includes(el);}closest(){return this;}
    focus(){globalThis.document.activeElement=this;}showModal(){this.open=true;}close(){if(this.open){this.open=false;this.dispatchEvent(new Event('close'));}}
  }
  const root=new Element(),dialog=new Element();root.innerHTML=view==='court'?renderCourtyard(state):renderWardrobe(state);
  globalThis.document={activeElement:null,querySelector:s=>s==='.community-root'?root:dialog};
  const session=mountCommunity({state,view,root,dialog,onLearn(){learned++;},onSave(){saves++;},onReward(r){rewards.push(r);},onNeighbourDemo(item){neighbourDemos.push(item);},onOriginalDemo(id){originalDemos.push(id);},cancelRun(){cancels++;},runPython(code,checks,onPhase){onPhase('running');return new Promise(resolve=>{pending={code,checks,resolve};});}});
  const click=(where,action,id,slot)=>{
    const button=new Element({community:action,...(id===undefined?{}:{id}),...(slot===undefined?{}:{slot})});where.buttons.push(button);
    const event=new Event('click');Object.defineProperty(event,'target',{value:button});where.dispatchEvent(event);
  };
  return {state,root,dialog,click:(action,id,slot)=>click(root,action,id,slot),work:(action,id,slot)=>click(dialog,action,id,slot),
    pending:()=>pending,rewards:()=>rewards,saves:()=>saves,cancels:()=>cancels,originalDemos,neighbourDemos,learned:()=>learned,
    async finish(result){pending.resolve(result);await Promise.resolve();await Promise.resolve();},
    dispose(){session.dispose();globalThis.document=previousDocument;},session};
}

test('the exhibition forwards newer creations to their working place and closes its own dialog',()=>{
  const s=freshState(),p=clockProjects[0];inspectMechanism(s,p.id,p.answer);completeNeighbour(s,p.id,p.solution);
  const ui=harness(s);
  try{
    ui.session.openExhibition();assert.match(ui.dialog.innerHTML,/Mira/);
    ui.work('exhibit',p.id);
    assert.equal(ui.dialog.open,false);
    assert.equal(ui.neighbourDemos.length,1);assert.equal(ui.neighbourDemos[0].place,'clockwork');
    assert.equal(ui.neighbourDemos[0].source,p.solution);
  }finally{ui.dispose();}
});
test('restoration UI carries a building from its first memory through checked repairs to reopening and a wearable gift',async()=>{
  const ui=harness();
  try{
    ui.click('building','bakery');assert.match(ui.dialog.innerHTML,/people to feed/);
    ui.work('open-building','bakery');assert.deepEqual(ui.state.restoration.opened,[]);
    for(const p of restorationProjects.filter(p=>p.building==='bakery')){
      ui.work('project',p.id);ui.dialog.querySelector('#community-code').value=p.solution;
      ui.work('run-project',p.id);const result=python([{code:ui.pending().code,checks:ui.pending().checks}])[0];await ui.finish(result);
      assert.match(ui.dialog.querySelector('#community-output').textContent,/A promise kept/);
      ui.work('building','bakery');
    }
    assert.match(ui.dialog.innerHTML,/It is time to turn the key/);
    ui.work('open-building','bakery');assert.match(ui.dialog.innerHTML,/Mabel’s indigo apron/);
    assert.deepEqual(ui.state.restoration.opened,['bakery']);assert.equal(ui.rewards().length,4);
    const coins=ui.state.coins;ui.work('open-building','bakery');assert.equal(ui.rewards().length,4);assert.equal(ui.state.coins,coins);
    ui.work('building','bakery');assert.match(ui.dialog.innerHTML,/Run the morning bake/);
  }finally{ui.dispose();}
});
test('exhibition UI curates projects, runs real saved tools and forwards original games to their playable dialogs',async()=>{
  const s=progressed();repair(s);
  const original=projects.find(p=>p.id==='project-guessing-game');s.projects=[original.id];s.projectCode[original.id]=original.solution;
  const ui=harness(s);
  try{
    ui.click('exhibition');assert.match(ui.dialog.innerHTML,/working creations/);
    ui.work('display',original.id);assert.equal(displayedExhibits(s).some(p=>p.id===original.id),false);
    ui.work('display','greenhouse-model');assert.equal(displayedExhibits(s).some(p=>p.id==='greenhouse-model'),true);
    ui.work('exhibit','bakery-planner');assert.match(ui.dialog.innerHTML,/Morning orders/);
    ui.dialog.querySelector('#exhibit-orders').value='[["bun",5]]';ui.dialog.querySelector('#exhibit-capacity').value='2';
    const coins=s.coins;ui.work('run-demo');await ui.finish(python([{code:ui.pending().code}])[0]);
    assert.match(ui.dialog.querySelector('#community-output').textContent,/"bun": 2/);assert.equal(s.coins,coins);
    ui.work('exhibit',original.id);assert.deepEqual(ui.originalDemos,[original.id]);assert.equal(ui.dialog.open,false);
  }finally{ui.dispose();}
});

test('revising a restored building counts as learning without paying another commission',async()=>{
  const s=progressed();repair(s);const ui=harness(s),p=restorationProjects[0],before=[s.coins,s.xp];
  try{
    ui.click('project',p.id);ui.dialog.querySelector('#community-code').value=p.solution;
    ui.work('run-project',p.id);await ui.finish(python([{code:ui.pending().code,checks:ui.pending().checks}])[0]);
    assert.equal(ui.learned(),1);assert.equal(ui.rewards().length,0);assert.deepEqual([s.coins,s.xp],before);
  }finally{ui.dispose();}
});
test('wardrobe UI enforces locks, updates the fitted preview and saves choices without altering rewards',()=>{
  const s=progressed(4),ui=harness(s,'wardrobe');
  try{
    ui.click('wardrobe-slot','outfit');ui.click('wear','apron','outfit');assert.equal(s.wardrobe.outfit,'rust');
    ui.click('wardrobe-slot','hair');ui.click('wear','waves','hair');assert.equal(s.wardrobe.hair,'waves');
    assert.match(ui.root.innerHTML,/A little windswept/);assert.match(ui.root.querySelector('.community-status')?.textContent||ui.root.innerHTML,/A little windswept/);
    assert.ok(ui.saves());assert.equal(s.coins,0);assert.equal(s.xp,0);
  }finally{ui.dispose();}
});
test('failed, stopped, closed and superseded restoration runs cannot award progress or overwrite a newer view',async()=>{
  const ui=harness();
  try{
    ui.click('project','bakery-flour');ui.work('run-project');await ui.finish({passed:false,error:'Not quite'});assert.equal(ui.rewards().length,0);
    ui.work('run-project');const old=ui.pending();ui.work('building','library');old.resolve({passed:true,output:''});await Promise.resolve();
    assert.match(ui.dialog.innerHTML,/The Lantern Library/);assert.equal(ui.state.restoration.completed.length,0);
    ui.work('project','library-titles');ui.work('run-project');ui.work('stop');await ui.finish({passed:true,output:''});assert.equal(ui.rewards().length,0);
    ui.work('run-project');ui.work('close');await ui.finish({passed:true,output:''});assert.equal(ui.rewards().length,0);
    ui.click('project','bakery-flour');ui.work('run-project');ui.session.dispose();await ui.finish({passed:true,output:''});assert.equal(ui.rewards().length,0);assert.ok(ui.cancels()>=3);
  }finally{ui.dispose();}
});
