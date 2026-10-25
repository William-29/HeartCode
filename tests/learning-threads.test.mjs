import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { freshState, normalizeState, completeProject, unlockAchievements, completeQuest } from '../dist/state.js';
import { quests } from '../dist/content.js';
import { projects } from '../dist/projects.js';
import { restorationProjects } from '../dist/restoration-content.js';
import { completeRestoration, openBuilding } from '../dist/restoration-model.js';
import { neighbourUnlocked, completeNeighbour, projectSource, projectChecks, workingSource, workingResult } from '../dist/neighbour-model.js';
import { testBenchProjects } from '../dist/testbench-content.js';
import { continuingProjects } from '../dist/continuing-content.js';
import { understandingAchievements } from '../dist/understanding-achievements.js';
import { objective, normalizeThread, threadChoices } from '../dist/objective-model.js';
import { threadMarkup } from '../dist/objective-ui.js';
import { renderContinuing, testBenchLedger } from '../dist/continuing-ui.js';
import { renderVillager } from '../dist/village-stories.js';
import { exhibitCatalog } from '../dist/exhibition-model.js';
import { normalizeWorkbench, highlightPython } from '../dist/workbench.js';

function ready(n=108) {
  const s=freshState();s.completed=quests.slice(0,n).map(q=>q.id);
  for(const p of projects)completeProject(s,p.id,p.solution);
  for(const p of restorationProjects)completeRestoration(s,p.id,p.solution);
  for(const id of ['bakery','library','greenhouse'])openBuilding(s,id);
  return s;
}
function python(cases) {
  const r=spawnSync('python',['-c',`import sys,json,importlib.util
sys.dont_write_bytecode=True
s=importlib.util.spec_from_file_location('runtime','dist/runtime.py'); m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
print(json.dumps([json.loads(m.run_source(c['code'],c.get('checks',''))) for c in json.load(sys.stdin)]))`],{input:JSON.stringify(cases),encoding:'utf8',env:{...process.env,PYTHONUTF8:'1'},timeout:20000});
  assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);
}
test('a pinned restoration follows lessons, repairs, reopening and completion in order',()=>{
  const s=freshState();s.thread.goal='building:bakery';
  assert.equal(objective(s).next.route,'quests/quest/'+quests[0].id);
  for(const q of quests.slice(0,2))completeQuest(s,q.id);
  assert.equal(objective(s).next.route,'courtyard/project/bakery-flour');
  completeRestoration(s,'bakery-flour','def flour_needed(a,b): return a*b');
  assert.equal(objective(s).next.route,'quests/quest/'+quests[2].id);
  s.completed=quests.slice(0,28).map(q=>q.id);
  for(const p of restorationProjects.filter(p=>p.building==='bakery'))completeRestoration(s,p.id,p.solution);
  assert.equal(objective(s).next.route,'courtyard/building/bakery');assert.equal(objective(s).done,false);
  openBuilding(s,'bakery');assert.equal(objective(s).done,true);assert.equal(objective(s).count,4);
});
test('later goals resolve useful earlier projects before asking for the final campaign milestone',()=>{
  const s=freshState();const goal='neighbour:rowan-tomorrow';
  assert.equal(objective(s,goal).next.route,'village/project/project-tavern-bill');
  completeProject(s,'project-tavern-bill',projects[0].solution);
  assert.equal(objective(s,goal).next.route,'quests/quest/'+quests[0].id);
  const r=ready(40);
  assert.equal(objective(r,goal).next.route,'stories/project/rowan-shared-oven');
  completeNeighbour(r,'rowan-shared-oven',continuingProjects[0].solution);
  assert.equal(objective(r,goal).next.route,'quests/quest/'+quests[40].id);
  r.completed=quests.slice(0,92).map(q=>q.id);
  assert.equal(objective(r,goal).next.route,'stories/project/rowan-tomorrow');
});
test('all primary goals produce a useful destination for a new and experienced player',()=>{
  for(const state of [freshState(),ready()])for(const [key] of threadChoices){
    const result=objective(state,key);assert.ok(result?.next?.route,key);assert.doesNotMatch(result.next.route,/undefined|null/);
    assert.ok(result.count>=0&&result.count<=result.total);
  }
  assert.equal(objective(freshState(),'missing:key'),null);
  assert.deepEqual(normalizeThread({goal:'javascript:alert(1)',last:'bad'}),{goal:null,last:null});
});
test('old saves gain preferences without losing work; new objectives, drafts and stories round-trip',()=>{
  const old=ready();delete old.workbench;delete old.thread;const restored=normalizeState(old);
  assert.equal(restored.coins,old.coins);assert.deepEqual(restored.projectCode,old.projectCode);
  assert.deepEqual(restored.workbench,{size:15,color:true});assert.deepEqual(restored.thread,{goal:null,last:null});
  restored.thread={goal:'story:elio',last:'neighbour:elio-care-ranges'};restored.workbench={size:19,color:false};
  for(const p of [...testBenchProjects,...continuingProjects])assert.equal(completeNeighbour(restored,p.id,p.solution).ok,true,p.id);
  restored.neighbours.drafts['bench-sealed']='';unlockAchievements(restored);
  const round=normalizeState(JSON.parse(JSON.stringify(restored)));
  assert.deepEqual(round,restored);
  const forged=normalizeState({...freshState(),neighbours:{completed:continuingProjects.map(p=>p.id),code:Object.fromEntries(continuingProjects.map(p=>[p.id,p.solution]))}});
  assert.deepEqual(forged.neighbours.completed,[]);
});
test('new projects unlock through their lessons, original friendships, buildings and previous chapter',()=>{
  const s=ready(),p=continuingProjects.find(p=>p.id==='rowan-tomorrow');
  assert.equal(neighbourUnlocked(s,p),false);
  completeNeighbour(s,p.previous,continuingProjects.find(x=>x.id===p.previous).solution);
  assert.equal(neighbourUnlocked(s,p),true);
  s.projects=[];assert.equal(neighbourUnlocked(s,p),false);s.projects=projects.map(p=>p.id);
  s.restoration.opened=[];assert.equal(neighbourUnlocked(s,p),false);
  const early=ready(8);assert.equal(neighbourUnlocked(early,testBenchProjects[0]),true);
  assert.equal(neighbourUnlocked(early,testBenchProjects[1]),false);
});
test('Test Bench accepts useful assertions, rejects empty or broken tests, and exposes every planted fault',()=>{
  const cases=testBenchProjects.flatMap(p=>[p.solution,p.starter,'def test_tool(tool):\n    assert True','def test_tool(tool):\n    assert False','def test_tool(tool):\n    return 0'].map(code=>({code,checks:p.checks})));
  const results=python(cases);
  for(let i=0;i<testBenchProjects.length;i++){
    assert.equal(results[5*i].passed,true,testBenchProjects[i].id+': '+results[5*i].error);
    for(let j=1;j<5;j++)assert.equal(results[5*i+j].passed,false,testBenchProjects[i].id+' false pass');
    assert.match(results[5*i+2].error,/Still unnoticed/);assert.match(results[5*i+3].error,/correct tool/);
  }
});
test('later service solutions pass and reject characteristic mistakes in actual Python',()=>{
  const s=ready();const mutations=[
    ['rowan-shared-oven','sum(len(r["batches"]) for r in reports.values())','len(reports)'],
    ['mira-library-round','lend_books(stock, requests)','lend_books(catalog, requests)'],
    ['elio-care-ranges','outside or labels[0] != labels[1]','outside'],
    ['rowan-tomorrow','mean_error < yesterday_error','mean_error <= yesterday_error'],
    ['elio-heater-review','all(value <= limit for value in candidate["rooms"].values())','True'],
    ['mira-reading-bag','range(capacity, book["weight"]-1, -1)','range(book["weight"], capacity+1)']
  ];
  const cases=[];
  for(const [id,from,to] of mutations){const p=continuingProjects.find(p=>p.id===id);assert.ok(p.solution.includes(from));cases.push({code:projectSource(s,p,p.solution),checks:projectChecks(p)},{code:projectSource(s,p,p.solution.replace(from,to)),checks:projectChecks(p)});}
  const results=python(cases);
  mutations.forEach(([id],i)=>{assert.equal(results[2*i].passed,true,id+': '+results[2*i].error);assert.equal(results[2*i+1].passed,false,id+' mutation should fail');});
});
test('continuing exhibitions execute saved code and borrowed tools; tests remain at Mira’s bench',()=>{
  const s=ready();for(const p of [...testBenchProjects,...continuingProjects])completeNeighbour(s,p.id,p.solution);
  const catalog=exhibitCatalog(s);assert.equal(catalog.filter(p=>p.place==='stories').length,6);assert.ok(!catalog.some(p=>p.kind==='testing'||p.id.startsWith('bench-')));
  const results=python(continuingProjects.map(p=>({code:workingSource(s,p)})));
  results.forEach((r,i)=>{assert.equal(r.passed,true,continuingProjects[i].id+': '+r.error);assert.ok(workingResult(r.output));});
  s.restoration.code['bakery-planner']='def plan_bakes(orders, capacity):\n    return {"totals":{},"batches":[{"borrowed":1}]}';
  const p=continuingProjects[0];const r=python([{code:workingSource(s,p)}])[0];assert.equal(workingResult(r.output).days.Monday.batches[0].borrowed,1);
});
test('understanding badges require demonstrated work, award once, and allow hints or repeated attempts',()=>{
  const s=ready();assert.deepEqual(unlockAchievements(s).filter(a=>a.id.startsWith('understanding')),[]);
  for(const p of [...testBenchProjects,...continuingProjects])completeNeighbour(s,p.id,p.solution);
  const before=s.coins, earned=unlockAchievements(s).filter(a=>a.id.startsWith('understanding'));
  assert.equal(earned.length,5);assert.equal(s.coins-before,understandingAchievements.reduce((sum,a)=>sum+a.coins,0));
  const coins=s.coins,xp=s.xp;
  for(const p of [...testBenchProjects,...continuingProjects])assert.equal(completeNeighbour(s,p.id,p.solution).replay,true);
  assert.deepEqual(unlockAchievements(s),[]);assert.equal(s.coins,coins);assert.equal(s.xp,xp);
});
test('new entrances, progress thread and story pages render balanced themed markup',()=>{
  const s=ready();s.thread={goal:'story:mira',last:'neighbour:bench-baskets'};
  const pages={thread:threadMarkup(s),stories:renderContinuing(s),bench:testBenchLedger(s),rowan:renderVillager(s,'rowan')};
  assert.match(pages.thread,/village\/project\/|stories\/project\//);assert.match(pages.thread,/Last worked on/);assert.match(pages.rowan,/#stories\/project\/rowan-shared-oven/);
  const r=spawnSync('python',['tests/validate_markup.py'],{input:JSON.stringify(pages),encoding:'utf8',env:{...process.env,PYTHONUTF8:'1'}});
  assert.equal(r.status,0,r.stderr);assert.deepEqual(JSON.parse(r.stdout).failures,{});
});
test('editor preferences are bounded and syntax coloring keeps pasted HTML inert',()=>{
  assert.deepEqual(normalizeWorkbench({size:900,color:false}),{size:22,color:false});assert.equal(normalizeWorkbench({size:-5}).size,12);
  const html=highlightPython('print("<img src=x onerror=alert(1)>") # <script>\nassert x == 3');
  assert.doesNotMatch(html,/<img|<script/);assert.match(html,/python-string/);assert.match(html,/python-comment/);assert.match(html,/python-keyword/);assert.match(html,/python-number/);
});
