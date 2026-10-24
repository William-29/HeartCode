import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { freshState, normalizeState } from '../dist/state.js';
import { quests } from '../dist/content.js';
import { adventures, adventureById, trainStops, gardenBeds, heldOutBeds } from '../dist/adventure-content.js';
import { available, ready, collectClue, chooseTheory, finishAdventure, travel, observe, customerSource, trainingSource, resultValue, keepModel, plant } from '../dist/adventure-model.js';
import { renderAdventures, mountAdventures, stationScene } from '../dist/adventures.js';

function progressed(count=60){const state=freshState();state.completed=quests.slice(0,count).map(q=>q.id);return state;}
function prepare(state,item){
  if(item.clues){item.clues.forEach((_,i)=>collectClue(state,item.id,i));chooseTheory(state,item.id,item.answer);}
  if(item.area==='station')travel(state,trainStops.find(s=>s.task===item.id).id);
  if(item.area==='garden')gardenBeds.slice(0,4).forEach(b=>observe(state,b.id));
}
function python(cases){
  const result=spawnSync('python',['-c',`import sys,json,importlib.util
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location("runtime","dist/runtime.py")
runtime=importlib.util.module_from_spec(spec);spec.loader.exec_module(runtime)
print(json.dumps([json.loads(runtime.run_source(c["code"],c.get("checks",""))) for c in json.load(sys.stdin)]))
`],{input:JSON.stringify(cases),encoding:'utf8',timeout:20000,env:{...process.env,PYTHONUTF8:'1'}});
  assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout);
}

test('beginner mysteries, shop and observation beds work immediately; later content follows trail progress',()=>{
  const s=freshState();
  assert.deepEqual(adventures.filter(i=>available(s,i)).map(i=>i.id),['delivery','parcel-shop']);
  assert.equal(ready(s,adventureById('delivery')),false);
  assert.equal(ready(s,adventureById('parcel-shop')),true);
  assert.equal(observe(s,'a'),true);
  for(const stop of trainStops){
    assert.equal(travel(s,stop.id),false);
    const before=progressed(stop.requires-1),after=progressed(stop.requires);
    assert.equal(travel(before,stop.id),false);assert.equal(travel(after,stop.id),true);
    assert.equal(after.adventure.location,stop.id);assert.deepEqual(after.adventure.visited,[stop.id]);
    assert.equal(ready(after,adventureById(stop.task)),true);
    travel(after,'home');assert.equal(ready(after,adventureById(stop.task)),false);
  }
  assert.equal(travel(s,'bogus'),false);
});
test('mysteries need all clues and a supported theory, and rewards cannot be farmed or advance the campaign',()=>{
  const s=progressed(),before=[...s.completed];
  for(const item of adventures.filter(i=>i.clues)){
    assert.equal(chooseTheory(s,item.id,item.answer),false);
    assert.equal(finishAdventure(s,item.id,item.solution).ok,false);
    item.clues.forEach((_,i)=>{assert.equal(collectClue(s,item.id,i),true);collectClue(s,item.id,i);});
    assert.equal(s.adventure.clues[item.id].length,3);
    assert.equal(chooseTheory(s,item.id,(item.answer+1)%3),false);
    assert.equal(chooseTheory(s,item.id,item.answer),true);
    const reward=finishAdventure(s,item.id,item.solution);assert.equal(reward.ok,true);assert.equal(reward.coins,item.coins);
    const coins=s.coins,xp=s.xp;
    assert.equal(finishAdventure(s,item.id,item.solution).replay,true);
    assert.equal(s.coins,coins);assert.equal(s.xp,xp);
  }
  assert.deepEqual(s.completed,before);
  assert.equal(collectClue(s,'delivery',-1),false);assert.equal(collectClue(s,'unknown',0),false);
});
test('new activity saves migrate, preserve completed work and sanitize invalid data without awarding rewards',()=>{
  const old=freshState();delete old.adventure;old.coins=321;
  assert.deepEqual(normalizeState(old).adventure,freshState().adventure);assert.equal(normalizeState(old).coins,321);
  const s=progressed();
  for(const item of adventures){prepare(s,item);finishAdventure(s,item.id,item.solution);}
  s.adventure.visits['parcel-shop']=2;
  const round=normalizeState(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(round,s);
  const bad=progressed(0);
  bad.adventure={completed:['forest-task','delivery','parcel-shop','parcel-shop'],code:{'forest-task':'pass','delivery':'pass','parcel-shop':'x'.repeat(40000)},drafts:{'parcel-shop':'x'.repeat(40000),alien:'pass'},observations:['a','a','unknown'],visited:['forest'],location:'forest',theories:['delivery'],clues:{delivery:[0,0,99]},visits:{'parcel-shop':Infinity},model:{slope:Infinity},planting:{hours:999}};
  const safe=normalizeState(bad);
  assert.deepEqual(safe.adventure.completed,['parcel-shop']);assert.equal(safe.adventure.location,'home');
  assert.deepEqual(safe.adventure.observations,['a']);assert.equal(safe.adventure.model,null);
  assert.equal(safe.adventure.code['parcel-shop'].length,30000);assert.equal(safe.adventure.drafts.alien,undefined);
  assert.deepEqual(safe.adventure.theories,[]);assert.equal(safe.coins,0);
});
test('all ten solutions pass real Python checks; blank and plausible wrong solutions fail',()=>{
  const wrong={
    delivery:'def missing(expected, received):\n return expected-received',
    lanterns:'def lanterns(levels, threshold):\n return [i for i,x in enumerate(levels) if x > threshold]',
    forecast:'def baseline(training, inspection):\n return sum(inspection)/len(inspection)',
    'parcel-shop':'def postage(weight):\n return 2+int(weight)*3',
    'stock-shop':'def reorder(stock, target):\n return {k:target-v for k,v in stock.items()}',
    'reviews-shop':'def positive_rate(reviews):\n return sum(x>4 for x in reviews)/len(reviews)',
    'seaside-task':'def fare(adults, children):\n return (adults+children)*7',
    'snow-task':'def average_valid(readings):\n v=[x for x in readings if x]\n return sum(v)/len(v) if v else None',
    'forest-task':'def mae(actual, predicted):\n return sum(a-p for a,p in zip(actual,predicted))/len(actual)',
    'garden-fit':'def fit(samples):\n return 2,1'
  };
  const results=python(adventures.flatMap(i=>[i.solution,'',wrong[i.id]].map(code=>({code,checks:i.checks}))));
  adventures.forEach((item,i)=>{assert.equal(results[i*3].passed,true,item.id+': '+results[i*3].error);assert.equal(results[i*3+1].passed,false,item.id);assert.equal(results[i*3+2].passed,false,item.id);});
});
test('returning customers execute saved Python with varied inputs without repeat commissions',()=>{
  const s=progressed(),cases=[],expected=[];
  for(const item of adventures.filter(i=>i.customers)){
    finishAdventure(s,item.id,item.solution);
    for(let i=0;i<item.customers.length;i++){
      s.adventure.visits[item.id]=i;
      const demo=customerSource(s,item.id);assert.equal(demo.customer.name,item.customers[i].name);
      cases.push({code:demo.code,checks:item.checks});
      expected.push(item.id==='parcel-shop'?2+3*demo.customer.args[0]:item.id==='stock-shop'?Object.fromEntries(Object.entries(demo.customer.args[0]).filter(([,n])=>n<demo.customer.args[1]).map(([k,n])=>[k,demo.customer.args[1]-n])):demo.customer.args[0].filter(n=>n>=4).length/demo.customer.args[0].length);
    }
  }
  const coins=s.coins;
  python(cases).forEach((r,i)=>{assert.equal(r.passed,true,r.error);assert.deepEqual(resultValue(r.output),expected[i]);});
  assert.equal(s.coins,coins);
  assert.throws(()=>customerSource(freshState(),'parcel-shop'),/Finish/);
});
test('garden fits actual training observations, evaluates held-out beds and uses saved parameters for growth',()=>{
  const s=progressed(20),item=adventureById('garden-fit');
  gardenBeds.slice(0,3).forEach(b=>observe(s,b.id));
  assert.equal(ready(s,item),false);assert.throws(()=>trainingSource(s),/Collect/);
  observe(s,'d');finishAdventure(s,item.id,item.solution);
  const source=trainingSource(s),result=python([{code:source}])[0];
  assert.equal(result.passed,true,result.error);
  const value=resultValue(result.output);assert.equal(keepModel(s,value),true);
  const training=gardenBeds.slice(0,4),mx=2.5,my=training.reduce((n,b)=>n+b.y,0)/4;
  const slope=training.reduce((n,b)=>n+(b.x-mx)*(b.y-my),0)/training.reduce((n,b)=>n+(b.x-mx)**2,0);
  assert.ok(Math.abs(s.adventure.model.slope-slope)<1e-9);
  const mae=heldOutBeds.reduce((n,b)=>n+Math.abs(b.y-(slope*b.x+my-slope*mx)),0)/3;
  assert.ok(Math.abs(value.mae-mae)<1e-9);assert.ok(value.mae<value.baselineMae);
  for(const invalid of [NaN,Infinity,0,7]) assert.equal(plant(s,invalid),false);
  assert.equal(plant(s,4.5),true);assert.equal(s.adventure.planting.predicted,value.slope*4.5+value.intercept);
  s.adventure.planting.revealed=true;
  assert.deepEqual(normalizeState(s),s);
  const saved=JSON.parse(JSON.stringify(s));saved.adventure.model.samples=['a'];
  assert.equal(normalizeState(saved).adventure.model,null);
  assert.equal(observe(s,'a'),false);assert.ok(s.adventure.model);
  assert.equal(observe(s,'e'),true);assert.equal(s.adventure.model,null);assert.equal(s.adventure.planting,null);
  // A fitting implementation can inspect its argument: held-out x=1.5 must never be present.
  s.adventure.code[item.id]=item.solution+'\n_original_fit=fit\ndef fit(samples):\n assert all(x != 1.5 for x,y in samples)\n return _original_fit(samples)';
  assert.equal(python([{code:trainingSource(s)}])[0].passed,true);
});

function uiHarness(state=freshState()){
  let pending, rewards=0,saves=0,cancels=0,learned=0;
  const originalDocument=globalThis.document;
  const nodes=new Map();
  class Element extends EventTarget {
    constructor(dataset={}){super();this.dataset=dataset;this.disabled=false;this.open=false;this.textContent='';this.value='';this.classList={add(){}};}
    set innerHTML(value){
      this.html=value;this.fields=new Map();this.buttons=[];
      for(const m of value.matchAll(/<button\b([^>]*)>/g)){
        const button=new Element(Object.fromEntries([...m[1].matchAll(/data-([a-z-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]])));button.disabled=m[1].includes('disabled');this.buttons.push(button);
      }
      for(const m of value.matchAll(/(?:id)="([^"]+)"/g))this.fields.set(m[1],new Element());
      if(this.fields.has('adventure-code'))this.fields.get('adventure-code').value=value.split('maxlength="30000">')[1]?.split('</textarea>')[0].replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&')||'';
      if(this.fields.has('garden-hours'))this.fields.get('garden-hours').value='4';
    }
    get innerHTML(){return this.html;}
    set outerHTML(value){this.innerHTML=value;}
    querySelector(selector){
      if(selector[0]==='#')return this.fields?.get(selector.slice(1))||null;
      if(selector==='button')return this.buttons?.[0]||null;
      const work=selector.match(/\[data-work="([^"]+)"\]/)?.[1];
      if(work)return this.buttons.find(b=>b.dataset.work===work)||null;
      return new Element();
    }
    querySelectorAll(selector){return (this.buttons||[]).filter(b=>selector==='[data-work]'?b.dataset.work:b.dataset.adventure);}
    closest(){return this;}contains(el){return this.buttons?.includes(el)||this.fields && [...this.fields.values()].includes(el);}
    focus(){globalThis.document.activeElement=this;}
    showModal(){this.open=true;}close(){if(this.open){this.open=false;this.dispatchEvent(new Event('close'));}}
  }
  const root=new Element(),dialog=new Element();root.innerHTML=renderAdventures(state);
  globalThis.document={activeElement:null,querySelector:selector=>selector==='.adventure-hub'?root:dialog};
  const session=mountAdventures({state,root,dialog,onLearn(){learned++;},onSave(){saves++;},onReward(){rewards++;},cancelRun(){cancels++;},runPython(code,checks,onPhase){onPhase('running');return new Promise(resolve=>{pending={code,checks,resolve};});}});
  const click=(target,key,value,id,index)=>{
    const el=new Element({[key]:value,...(id===undefined?{}:{id}),...(index===undefined?{}:{index:String(index)})});
    if(target===root)root.buttons.push(el);
    const event=new Event('click');Object.defineProperty(event,'target',{value:el});target.dispatchEvent(event);
  };
  return {state,root,dialog,click:(action,id,index)=>click(root,'adventure',action,id,index),work:action=>click(dialog,'work',action),
    pending:()=>pending,rewards:()=>rewards,saves:()=>saves,cancels:()=>cancels,learned:()=>learned,
    async finish(result){pending.resolve(result);await Promise.resolve();await Promise.resolve();},
    dispose(){session.dispose();globalThis.document=originalDocument;},session};
}
test('activity UI guides clue investigation, persists checked repairs, and only celebrates first completion',async()=>{
  const ui=uiHarness();
  try{
    ui.click('section','mysteries');ui.click('challenge','delivery');assert.equal(ui.dialog.open,false);
    for(let i=0;i<3;i++)ui.click('clue','delivery',i);
    ui.click('theory','delivery',1);assert.deepEqual(ui.state.adventure.theories,[]);
    ui.click('theory','delivery',0);ui.click('challenge','delivery');assert.equal(ui.dialog.open,true);
    const item=adventureById('delivery');ui.dialog.querySelector('#adventure-code').value=item.solution;
    ui.work('run');assert.equal(ui.pending().checks,item.checks);
    await ui.finish({passed:false,error:'Try again'});assert.equal(ui.rewards(),0);
    ui.work('run');await ui.finish({passed:true,output:''});
    assert.equal(ui.rewards(),1);assert.ok(ui.state.adventure.completed.includes('delivery'));
    assert.match(ui.dialog.querySelector('#adventure-output').textContent,/Three tea parcels/);
    const coins=ui.state.coins;
    ui.work('run');await ui.finish({passed:true,output:''});assert.equal(ui.rewards(),1);assert.equal(ui.state.coins,coins);assert.equal(ui.learned(),2);
    ui.work('close');assert.equal(ui.dialog.open,false);
  }finally{ui.dispose();}
});
test('closing, stopping and navigating discard late Python results and prevent accidental reward delivery',async()=>{
  const ui=uiHarness();
  try{
    ui.click('section','shop');ui.click('challenge','parcel-shop');ui.work('run');
    const late=ui.pending();ui.work('close');assert.ok(ui.cancels());
    ui.click('challenge','parcel-shop');late.resolve({passed:true,output:''});await Promise.resolve();
    assert.equal(ui.rewards(),0);assert.equal(ui.state.coins,0);
    ui.work('run');ui.work('stop');await ui.finish({passed:true,output:''});assert.equal(ui.rewards(),0);
    ui.work('run');ui.session.dispose();await ui.finish({passed:true,output:''});assert.equal(ui.rewards(),0);
  }finally{ui.dispose();}
});
test('shop customer UI runs the saved creation, rotates customers and grants no visit rewards',async()=>{
  const s=freshState(),item=adventureById('parcel-shop');finishAdventure(s,item.id,item.solution);
  const coins=s.coins,ui=uiHarness(s);
  try{
    ui.click('section','shop');ui.click('customer',item.id);ui.work('serve');
    const result=python([{code:ui.pending().code,checks:ui.pending().checks}])[0];await ui.finish(result);
    assert.match(ui.dialog.querySelector('#adventure-output').textContent,/9.5 coins postage/);
    assert.equal(s.adventure.visits[item.id],1);assert.equal(s.coins,coins);assert.equal(ui.rewards(),0);
    ui.work('close');ui.click('customer',item.id);assert.match(ui.dialog.innerHTML,/Rowan stopped by/);
  }finally{ui.dispose();}
});
test('train and garden UI support full visit, observation, fitting and planting flows',async()=>{
  const s=progressed(32),ui=uiHarness(s);
  try{
    ui.click('section','station');ui.click('travel','forest');
    assert.match(ui.root.innerHTML,/YOU HAVE ARRIVED/);assert.match(ui.root.innerHTML,/Fernwood/);
    ui.click('landmark','forest',0);assert.deepEqual(s.adventure.landmarks,['forest-0']);
    ui.click('challenge','forest-task');assert.equal(ui.dialog.open,true);ui.work('close');
    ui.click('travel','home');assert.equal(s.adventure.location,'home');
    ui.click('section','garden');gardenBeds.slice(0,4).forEach(b=>ui.click('observe',b.id));
    ui.click('challenge','garden-fit');ui.dialog.querySelector('#adventure-code').value=adventureById('garden-fit').solution;
    ui.work('run');await ui.finish(python([{code:ui.pending().code,checks:ui.pending().checks}])[0]);
    ui.work('close');ui.click('train');
    await ui.finish(python([{code:ui.pending().code}])[0]);
    assert.ok(s.adventure.model);ui.work('close');ui.click('plant');assert.ok(s.adventure.planting);
    ui.click('grow');assert.equal(s.adventure.planting.revealed,true);assert.match(ui.root.innerHTML,/Absolute error/);
    ui.click('observe','e');assert.equal(s.adventure.model,null);assert.equal(s.adventure.planting,null);
  }finally{ui.dispose();}
});
test('destination scenes are distinct, named, and all activities keep a way home',()=>{
  const scenes=['home',...trainStops.map(s=>s.id)].map(stationScene);
  assert.equal(new Set(scenes).size,4);
  for(const scene of scenes){assert.match(scene,/role="img"/);assert.match(scene,/aria-label=/);}
  assert.match(renderAdventures(freshState()),/href="#village"/);
});
