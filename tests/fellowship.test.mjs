import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { quests, chapters, achievements, pets } from '../dist/content.js';
import { freshState, normalizeState, nextQuest, isUnlocked, completeQuest, completeProject, adoptPet, SAVE_KEY } from '../dist/state.js';
import { stops, regions, WORLD_WIDTH, WORLD_HEIGHT, legControlPoints, pointOnLeg, travelForCompletion } from '../dist/world-model.js';
import { renderWorld } from '../dist/world.js';
const baseline=JSON.parse(readFileSync(new URL('./fixtures/campaign-84.json',import.meta.url),'utf8'));

test('expansion preserves all 84 original quest definitions, chapters, regions and arrival coordinates',()=>{
  assert.equal(SAVE_KEY,'hearthcode-save-v1');
  for(const [i,old] of baseline.quests.entries()) {
    assert.equal(quests[i].id,old.id);
    assert.equal(createHash('sha256').update(JSON.stringify(quests[i])).digest('hex'),old.sha256,old.id);
  }
  assert.deepEqual(chapters.slice(0,21),baseline.chapters);
  assert.deepEqual(stops.slice(0,85),baseline.stops);
  assert.deepEqual(regions.slice(0,21),baseline.regions);
});

test('an 84-quest save resumes at 85 without losing coins, achievements, side projects or drafts',()=>{
  const old=freshState();
  for(const q of quests.slice(0,84)) completeQuest(old,q.id,'2026-10-25');
  old.name='Returning keeper'; old.sound=true;old.reducedMotion=true;old.villageTime='evening';
  old.drafts['beacon-monitor']='# My earlier monitoring draft';old.drafts.practice='print("Still home")';
  completeProject(old,'project-tavern-bill','def tavern_bill(*args): return 0','2026-10-25');
  adoptPet(old,'nova');
  const save=JSON.parse(JSON.stringify(old)),restored=normalizeState(save);
  assert.deepEqual(restored,save);
  assert.equal(nextQuest(restored).id,'dispatch-revisions');
  assert.ok(isUnlocked(restored,quests[84].id));assert.ok(!isUnlocked(restored,quests[85].id));
  const coins=restored.coins,xp=restored.xp;
  const replay=completeQuest(restored,'beacon-monitor','2026-10-25');
  assert.equal(replay.replay,true);assert.equal(restored.coins,coins);assert.equal(restored.xp,xp);
  const result=completeQuest(restored,quests[84].id,'2026-10-25');
  assert.equal(result.achievements.length,0);assert.equal(restored.coins,coins+quests[84].coins);
  assert.equal(restored.xp,xp+quests[84].xp);assert.equal(nextQuest(restored).id,quests[85].id);
  assert.deepEqual(normalizeState(JSON.parse(JSON.stringify(restored))),restored);
});

test('24 new quests supply distinct tasks, worked examples, explicit contracts and gradual chapter rewards',()=>{
  const seen=new Set(quests.slice(0,84).map(q=>q.task.trim().toLowerCase()));
  const added=quests.slice(84);assert.equal(added.length,24);
  for(const [i,q] of added.entries()) {
    assert.equal(q.chapter,21+Math.floor(i/4));
    assert.ok(!seen.has(q.task.trim().toLowerCase()),q.id);seen.add(q.task.trim().toLowerCase());
    assert.ok(q.lesson.length>=3&&q.lesson.every(p=>p.length>80),q.id);
    assert.ok(q.buildsOn.length>=2&&q.hint.length>50&&q.takeaway.length>50,q.id);
    assert.ok(q.minutes>=12&&q.minutes<=30,q.id);
    if(q.type==='code') assert.ok(q.example&&q.starter&&q.checks&&q.solution,q.id);
    else assert.equal(q.explanations.length,q.options.length);
    assert.ok(q.xp>=630&&q.coins>=260);
  }
});

test('new milestones award exactly once and saved partial expansion progress restores sequentially',()=>{
  const state=freshState(), milestones=new Map([[92,'terrace-timekeeper'],[100,'foundry-mentor'],[108,'fellowship-wayfarer']]);
  for(const [i,q] of quests.entries()) {
    const r=completeQuest(state,q.id,'2026-10-25');
    assert.ok(r.ok);
    for(const [count,id] of milestones) assert.equal(state.achievements.includes(id),i+1>=count);
    if(milestones.has(i+1)) assert.ok(r.achievements.some(a=>a.id===milestones.get(i+1)));
    if(i>=84) {
      assert.deepEqual(normalizeState(JSON.parse(JSON.stringify(state))),state);
      const before=[state.xp,state.coins];completeQuest(state,q.id,'2026-10-25');
      assert.deepEqual([state.xp,state.coins],before);
    }
  }
  assert.equal(nextQuest(state),null);
  assert.equal(state.achievements.filter(id=>milestones.has(achievements.find(a=>a.id===id)?.progress(state)[1])).length,3);
});

test('the coast passage and every new road remain continuous, bounded and navigable',()=>{
  assert.equal(WORLD_WIDTH,11200);
  assert.deepEqual(travelForCompletion('beacon-monitor',{ok:true}),{from:83,to:84,newRegion:true,final:false});
  assert.deepEqual(travelForCompletion('fellowship-budget-plan',{ok:true}),{from:107,to:108,newRegion:false,final:true});
  for(let i=83;i<108;i++) {
    const control=legControlPoints(i);
    for(let t=0;t<=1;t+=.01) {
      const p=pointOnLeg(i,t);assert.ok(p.x>=0&&p.x<=WORLD_WIDTH&&p.y>=0&&p.y<=WORLD_HEIGHT);
    }
    if(i<107) {
      const next=legControlPoints(i+1);
      assert.deepEqual(control[3],next[0]);
      for(const axis of ['x','y']) assert.ok(Math.abs((control[3][axis]-control[2][axis])-(next[1][axis]-next[0][axis]))<1e-8);
    }
    assert.ok(Math.hypot(stops[i+1].x-stops[i].x,stops[i+1].y-stops[i].y)<270);
  }
  // Markers remain separate at the ordinary 88% play zoom (42px target diameter).
  for(let i=84;i<108;i++) for(let j=i+1;j<109;j++) assert.ok(Math.hypot(stops[i].x-stops[j].x,stops[i].y-stops[j].y)*.88>48);
  const html=renderWorld(freshState(),pets[0],84,null);
  assert.match(html,/assets\/fellowshiplands.png/);assert.match(html,/assets\/coast-viaduct.png/);
  assert.match(html,/Quest 108:/);assert.match(html,/Wayfarers’ Hall, journey’s end/);
  const css=readFileSync(new URL('../dist/world-frontier.css',import.meta.url),'utf8');
  assert.match(css,/world-art-fellowship\{left:8000px;width:3200px/);
  assert.match(css,/world-art-coast-pass\{left:7680px;width:640px/);
});
