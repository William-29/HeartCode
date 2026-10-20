import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { freshState, normalizeState } from '../dist/state.js';
import { quests } from '../dist/content.js';
import { restorationProjects } from '../dist/restoration-content.js';
import { completeRestoration, openBuilding } from '../dist/restoration-model.js';
import { apprentices, teachingProjects, sharedProjects, lakeProjects, neighbourProjects } from '../dist/neighbour-content.js';
import { freshNeighbours, neighbourUnlocked, answerTeaching, completeNeighbour, confidence, cast, lakeSummary, splitObservations, projectSource, projectChecks, workingSource, workingResult } from '../dist/neighbour-model.js';
import { renderNeighbours, mountNeighbours } from '../dist/neighbours.js';
import { ambientLevels } from '../dist/ambience.js';

function progressed(n=60){
  const s=freshState();s.completed=quests.slice(0,n).map(q=>q.id);return s;
}
function restored(){
  const s=progressed();
  for(const p of restorationProjects)completeRestoration(s,p.id,p.solution);
  for(const id of ['bakery','library','greenhouse'])openBuilding(s,id);
  return s;
}
function observations(s,n=30){
  for(let i=0;i<n;i++){s.neighbours.weather=['sun','rain','cloud'][i%3];s.neighbours.shore=i%2?'reeds':'jetty';cast(s,()=>((i*37)%100)/100);}
}
function teach(s,p){
  answerTeaching(s,p.id,'explanation',p.answer);answerTeaching(s,p.id,'example',p.exampleAnswer);
  return completeNeighbour(s,p.id,p.solution);
}
function python(cases){
  const result=spawnSync('python',['-c',`import sys,json,importlib.util
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location("runtime","dist/runtime.py")
runtime=importlib.util.module_from_spec(spec);spec.loader.exec_module(runtime)
print(json.dumps([json.loads(runtime.run_source(c["code"],c.get("checks",""))) for c in json.load(sys.stdin)]))`],{input:JSON.stringify(cases),encoding:'utf8',env:{...process.env,PYTHONUTF8:'1'},timeout:20000});
  assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout);
}
test('apprentices begin gently, keep separate learning stories, and require explanation plus an example before code rewards',()=>{
  const s=freshState(),first=teachingProjects[0];
  assert.deepEqual(neighbourProjects.filter(p=>neighbourUnlocked(s,p)).map(p=>p.id),['nell-label']);
  assert.equal(completeNeighbour(s,first.id,first.solution).ok,false);
  assert.equal(answerTeaching(s,first.id,'explanation',0).ok,false);
  assert.equal(s.coins,0);assert.equal(confidence(s,'nell'),0);
  assert.equal(teach(s,first).ok,true);assert.equal(confidence(s,'nell'),1);assert.equal(confidence(s,'kit'),0);
  const coins=s.coins,xp=s.xp;assert.equal(teach(s,first).replay,true);assert.equal(s.coins,coins);assert.equal(s.xp,xp);
  s.completed=quests.slice(0,24).map(q=>q.id);
  assert.equal(completeNeighbour(s,'nell-missing','pass').ok,false);
  for(const p of teachingProjects)assert.equal(teach(s,p).ok,true);
  assert.equal(confidence(s,'nell'),3);assert.equal(confidence(s,'kit'),3);
  assert.equal(s.completed.length,24);assert.equal(s.projects.length,0);
});
test('connected projects require reopened places and saved tools, then unlock in story order without repeat commissions',()=>{
  const s=progressed();
  assert.equal(neighbourUnlocked(s,sharedProjects[0]),false);
  for(const p of restorationProjects)completeRestoration(s,p.id,p.solution);
  assert.equal(neighbourUnlocked(s,sharedProjects[0]),false);
  openBuilding(s,'bakery');openBuilding(s,'greenhouse');
  assert.equal(neighbourUnlocked(s,sharedProjects[0]),true);
  assert.equal(completeNeighbour(s,sharedProjects[1].id,sharedProjects[1].solution).ok,false);
  completeNeighbour(s,sharedProjects[0].id,sharedProjects[0].solution);
  assert.equal(neighbourUnlocked(s,sharedProjects[1]),false);
  openBuilding(s,'library');
  for(const p of sharedProjects){
    const reward=completeNeighbour(s,p.id,p.solution);assert.equal(reward.ok,true);
    const coins=s.coins;assert.equal(completeNeighbour(s,p.id,p.solution).replay,true);assert.equal(s.coins,coins);
  }
  delete s.restoration.code['bakery-shopping'];assert.equal(neighbourUnlocked(s,sharedProjects[0]),false);
});
test('all twelve projects pass real Python checks; their buggy starters and blank submissions fail',()=>{
  const s=restored();observations(s);
  const cases=neighbourProjects.flatMap(p=>[p.solution,p.starter,''].map(code=>({code:projectSource(s,p,code),checks:projectChecks(p)})));
  const results=python(cases);
  neighbourProjects.forEach((p,i)=>{
    assert.equal(results[i*3].passed,true,`${p.id}: ${results[i*3].error}`);
    assert.equal(results[i*3+1].passed,false,`${p.id} starter must need work`);
    assert.equal(results[i*3+2].passed,false,`${p.id} blank`);
  });
});
test('shared projects call the actual saved tools and detect replacements that only imitate their output',()=>{
  const s=restored(),p=sharedProjects[0];
  const imitation='def herb_order(recipe, stock, batches):\n    pick={k:v*batches-stock.get(k,0) for k,v in recipe.items() if v*batches>stock.get(k,0)}\n    return {"pick":pick,"total":sum(pick.values())}';
  const result=python([{code:projectSource(s,p,imitation),checks:projectChecks(p)}])[0];
  assert.equal(result.passed,false);assert.match(result.error,/Call each saved/);
  completeNeighbour(s,p.id,p.solution);
  s.restoration.code['bakery-shopping']='def shopping_list(recipe, stock, batches):\n    return {"thyme":7}';
  const used=python([{code:workingSource(s,p)}])[0];
  assert.equal(used.passed,true,used.error);assert.deepEqual(workingResult(used.output),{pick:{thyme:7},total:7});
});
test('casts are immediate, preserve misses and conditions, cap the journal, and never farm coins or XP',()=>{
  const s=freshState();s.neighbours.weather='rain';s.neighbours.shore='reeds';
  const row=cast(s,()=>.999);assert.deepEqual(row,{id:1,weather:'rain',shore:'reeds',catch:'No catch'});
  cast(s,()=>0);
  assert.deepEqual(lakeSummary(s.neighbours.observations).find(r=>r.name==='No catch'),{name:'No catch',count:1,frequency:.5});
  observations(s,130);
  assert.equal(s.neighbours.observations.length,120);assert.equal(s.neighbours.casts,132);
  assert.equal(s.neighbours.observations[0].id,13);assert.equal(s.coins,0);assert.equal(s.xp,0);
  assert.equal(lakeSummary([])[0].frequency,null);
  const split=splitObservations(s.neighbours.observations);
  assert.equal(split.train.length+split.test.length,120);
  assert.ok(split.test.every(r=>r.id%5===0));assert.ok(split.train.every(r=>r.id%5!==0));
});
test('lake learning gates on both observation counts and lessons; real tools use the player journal',()=>{
  const s=progressed(4);assert.equal(neighbourUnlocked(s,lakeProjects[0]),false);
  observations(s,6);assert.equal(neighbourUnlocked(s,lakeProjects[0]),true);
  completeNeighbour(s,lakeProjects[0].id,lakeProjects[0].solution);
  assert.equal(neighbourUnlocked(s,lakeProjects[1]),false);
  s.completed=quests.map(q=>q.id);observations(s,18);
  for(const p of lakeProjects)assert.equal(completeNeighbour(s,p.id,p.solution).ok,true);
  const results=python(lakeProjects.map(p=>({code:workingSource(s,p)})));
  assert.ok(results.every(r=>r.passed),results.map(r=>r.error).join('\n'));
  const counts=workingResult(results[0].output);assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),24);
  const frequencies=workingResult(results[1].output);assert.ok(Math.abs(Object.values(frequencies).reduce((a,b)=>a+b,0)-1)<1e-9);
  const report=workingResult(results[2].output);assert.equal(report.training_casts+report.test_casts,24);assert.equal(report.total,4);
});
test('held-out labels remain unavailable during prediction and a changing notebook gets a fresh evaluation',()=>{
  const s=restored();observations(s,30);
  const p=lakeProjects[2];
  s.neighbours.code[p.id]=p.solution.replace('def predict_catch(rows, weather):','def predict_catch(rows, weather):\n    assert "_truth" not in globals()\n    assert all(r["id"] % 5 != 0 for r in rows)');
  const code=workingSource(s,p),r=python([{code}])[0];
  assert.equal(r.passed,true,r.error);
  assert.ok(code.indexOf('_predictions=')<code.indexOf('_truth='));
  const before=workingResult(r.output);assert.equal(before.total,6);
  s.neighbours.code[p.id]=p.solution;observations(s,5);
  const after=workingResult(python([{code:workingSource(s,p)}])[0].output);assert.equal(after.total,7);
});
test('old saves migrate and completed stories round-trip; malformed imports cannot skip prerequisites or invent observations',()=>{
  const old=progressed(5);delete old.neighbours;old.coins=199;
  assert.deepEqual(normalizeState(old).neighbours,freshNeighbours());assert.equal(normalizeState(old).coins,199);
  const s=restored();observations(s,30);
  for(const p of teachingProjects)teach(s,p);
  for(const p of [...sharedProjects,...lakeProjects])completeNeighbour(s,p.id,p.solution);
  s.neighbours.drafts['nell-label']='print("keep my draft")';
  assert.deepEqual(normalizeState(JSON.parse(JSON.stringify(s))),s);
  const bad=freshState();bad.neighbours={completed:['nell-missing','shared-morning','lake-predict'],code:{'nell-missing':'pass','shared-morning':'pass','lake-predict':'pass'},explained:['nell-missing'],examples:['nell-missing'],weather:'fire',shore:'roof',observations:[{id:1,weather:'sun',shore:'jetty',catch:'Perch'},{id:1,weather:'sun',shore:'jetty',catch:'Perch'},{id:2,weather:'rain',shore:'roof',catch:'Alien'}],drafts:{'nell-label':'x'.repeat(40000)}};
  const safe=normalizeState(bad).neighbours;
  assert.deepEqual(safe.completed,[]);assert.equal(safe.observations.length,1);assert.equal(safe.drafts['nell-label'].length,30000);assert.equal(safe.weather,'sun');assert.equal(safe.shore,'jetty');
});
test('world scenes retain the existing art and character style, accessible entrances, motion controls, and local ambience',()=>{
  const s=freshState(),pet={id:'pip',name:'<Pip>'};
  for(const view of ['apprentices','shared','lake']){
    const html=renderNeighbours(s,view,pet);assert.match(html,/href="#(village|courtyard)"/);assert.match(html,/hearthwick-outfits.png/);
    assert.doesNotMatch(html,/<Pip>/);
  }
  assert.match(renderNeighbours(s,'apprentices'),/Nell/);assert.match(renderNeighbours(s,'apprentices'),/Kit/);
  assert.match(renderNeighbours(s,'lake'),/willowmere-lake.png/);
  const prefs={rain:true,fire:true,cafe:true,weather:'rain',volume:.5};
  assert.equal(ambientLevels(prefs,'apprentices').fire,ambientLevels(prefs,'tavern').fire);
  assert.equal(ambientLevels(prefs,'shared').cafe,ambientLevels(prefs,'village').cafe);
  assert.ok(ambientLevels(prefs,'lake').rain>0);assert.equal(ambientLevels(prefs,'lake').cafe,0);
  assert.match(readFileSync('dist/neighbours.css','utf8'),/prefers-reduced-motion/);
});

function harness(state=restored(),view='apprentices'){
  const previousDocument=globalThis.document,decode=s=>s.replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&amp;','&');
  let pending,rewards=[],saves=0,cancels=0;
  class Element extends EventTarget{
    constructor(dataset={}){super();this.dataset=dataset;this.open=false;this.value='';this.textContent='';this.fields=new Map();this.buttons=[];this.classList={add(){}};}
    set innerHTML(value){
      this.html=value;this.fields=new Map();this.buttons=[];
      for(const m of value.matchAll(/<button\b([^>]*)>/g)){const b=new Element(Object.fromEntries([...m[1].matchAll(/data-([a-z-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]])));b.disabled=m[1].includes('disabled');this.buttons.push(b);}
      for(const m of value.matchAll(/<(textarea|pre|p|div|select)\b([^>]*\bid="([^"]+)"[^>]*)>/g)){
        const f=new Element();f.id=m[3];if(m[1]==='textarea')f.value=decode(value.slice(m.index+m[0].length).split('</textarea>')[0]);this.fields.set(f.id,f);
      }
    }
    get innerHTML(){return this.html;}set outerHTML(value){this.innerHTML=value;}
    querySelector(selector){
      if(selector[0]==='#')return this.fields.get(selector.slice(1))||null;
      if(selector.startsWith('.'))return null;
      const action=selector.match(/data-neighbour="([^"]+)"/)?.[1];
      return this.buttons.find(b=>!action||b.dataset.neighbour===action)||null;
    }
    querySelectorAll(selector){if(selector==='textarea')return [...this.fields.values()].filter(f=>f.id==='neighbour-code');const step=selector.match(/data-step="([^"]+)"/)?.[1];return this.buttons.filter(b=>!step||b.dataset.step===step);}
    contains(el){return this.buttons.includes(el)||[...this.fields.values()].includes(el);}closest(){return this;}setAttribute(k,v){this[k]=v;}
    focus(){globalThis.document.activeElement=this;}showModal(){this.open=true;}close(){if(this.open){this.open=false;this.dispatchEvent(new Event('close'));}}
  }
  const root=new Element(),dialog=new Element();root.innerHTML=renderNeighbours(state,view);
  globalThis.document={activeElement:null,querySelector:s=>s==='.neighbours-root'?root:dialog};
  const session=mountNeighbours({state,view,companion:{id:'pip',name:'Pip'},root,dialog,onSave(){saves++;},onReward(r){rewards.push(r);},cancelRun(){cancels++;},runPython(code,checks,onPhase){onPhase('running');return new Promise(resolve=>{pending={code,checks,resolve};});}});
  const click=(where,action,id,extra={})=>{const el=new Element({neighbour:action,id,...extra});where.buttons.push(el);const event=new Event('click');Object.defineProperty(event,'target',{value:el});where.dispatchEvent(event);};
  return {state,root,dialog,session,click:(...args)=>click(root,...args),work:(...args)=>click(dialog,...args),pending:()=>pending,rewards:()=>rewards,saves:()=>saves,cancels:()=>cancels,
    change(where,id,value){const field=where.querySelector('#'+id);field.value=value;const event=new Event('change');Object.defineProperty(event,'target',{value:field});where.dispatchEvent(event);},
    async finish(result){pending.resolve(result);await Promise.resolve();await Promise.resolve();},
    dispose(){session.dispose();globalThis.document=previousDocument;}};
}
test('teaching UI guides explanation, example and real Python, then grows confidence without duplicate rewards',async()=>{
  const ui=harness(freshState()),p=teachingProjects[0];
  try{
    ui.click('meet','nell');assert.match(ui.dialog.innerHTML,/very small example/);
    ui.work('project',p.id);ui.work('run');assert.equal(ui.pending(),undefined);assert.match(ui.dialog.querySelector('#neighbour-output').textContent,/Explain/);
    ui.work('answer',p.id,{step:'explanation',index:'0'});assert.match(ui.dialog.querySelector('#explanation-feedback').textContent,/length/);
    ui.work('answer',p.id,{step:'explanation',index:String(p.answer)});
    ui.work('answer',p.id,{step:'example',index:String(p.exampleAnswer)});
    ui.dialog.querySelector('#neighbour-code').value=p.solution;
    ui.work('run');await ui.finish(python([{code:ui.pending().code,checks:ui.pending().checks}])[0]);
    assert.equal(ui.rewards().length,1);assert.equal(confidence(ui.state,'nell'),1);
    assert.match(ui.dialog.querySelector('#neighbour-output').textContent,/Made together/);
    ui.work('run');await ui.finish(python([{code:ui.pending().code,checks:ui.pending().checks}])[0]);assert.equal(ui.rewards().length,1);
    ui.work('meet','nell');assert.match(ui.dialog.innerHTML,/I tried another name/);
  }finally{ui.dispose();}
});
test('shared UI completes projects, shows their village changes, and runs saved tools without repeat rewards',async()=>{
  const ui=harness(restored(),'shared');
  try{
    for(const p of sharedProjects){
      ui.click('project',p.id);ui.dialog.querySelector('#neighbour-code').value=p.solution;
      ui.work('run');await ui.finish(python([{code:ui.pending().code,checks:ui.pending().checks}])[0]);
      assert.match(ui.dialog.querySelector('#neighbour-output').textContent,/Made together/);
      const coins=ui.state.coins;ui.work('use',p.id);ui.work('run-use');
      await ui.finish(python([{code:ui.pending().code}])[0]);
      assert.match(ui.dialog.querySelector('#neighbour-result').innerHTML,/village is using your Python/);assert.equal(ui.state.coins,coins);
    }
    assert.equal(ui.rewards().length,3);assert.match(ui.root.innerHTML,/round-complete/);assert.match(ui.root.innerHTML,/herb-keepsake/);assert.match(ui.root.innerHTML,/book-keepsake/);
  }finally{ui.dispose();}
});
test('lake UI records casts, changes conditions, filters the journal and runs an evaluated model',async()=>{
  const s=restored(),ui=harness(s,'lake');
  try{
    ui.change(ui.root,'lake-weather','rain');ui.change(ui.root,'lake-shore','reeds');
    ui.click('cast');assert.equal(s.neighbours.observations[0].weather,'rain');assert.equal(s.neighbours.observations[0].shore,'reeds');
    ui.click('journal');assert.match(ui.dialog.innerHTML,/1 casts in this view/);
    ui.change(ui.dialog,'journal-filter','sun');assert.match(ui.dialog.innerHTML,/0 casts in this view/);
    observations(s,24);
    for(const p of lakeProjects)completeNeighbour(s,p.id,p.solution);
    ui.work('use','lake-predict');ui.work('run-use');await ui.finish(python([{code:ui.pending().code}])[0]);
    assert.match(ui.dialog.querySelector('#neighbour-result').innerHTML,/held-out catches/);assert.match(ui.dialog.querySelector('#neighbour-result').innerHTML,/baseline/);
    assert.equal(ui.rewards().length,0);
  }finally{ui.dispose();}
});
test('failed, stopped, closed and disposed learning runs never commit late progress',async()=>{
  const ui=harness(restored(),'shared'),p=sharedProjects[0];
  try{
    ui.click('project',p.id);ui.work('run');await ui.finish({passed:false,error:'Not yet'});assert.equal(ui.rewards().length,0);
    ui.work('run');ui.work('stop');await ui.finish({passed:true,output:''});assert.equal(ui.rewards().length,0);
    ui.work('run');ui.work('close');await ui.finish({passed:true,output:''});assert.equal(ui.rewards().length,0);
    ui.click('project',p.id);ui.work('run');ui.session.dispose();await ui.finish({passed:true,output:''});assert.equal(ui.rewards().length,0);
    assert.equal(ui.state.neighbours.completed.length,0);assert.ok(ui.cancels()>=3);
  }finally{ui.dispose();}
});
