import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { quests } from '../dist/content.js';
import { villagers, projects, projectUnlocked, friendship } from '../dist/projects.js';
import { freshState, normalizeState, meetVillager, completeProject, completeQuest, visibleStreak } from '../dist/state.js';

const project = id => projects.find(item => item.id === id);
const availableState = count => { const state = freshState(); state.completed = quests.slice(0, count).map(quest => quest.id); return state; };

test('the village has three connected two-project stories and progressively unlocked tools', () => {
  assert.equal(villagers.length, 3);
  assert.equal(projects.length, 6);
  assert.equal(new Set(projects.map(item => item.id)).size, 6);
  for (const villager of villagers) {
    const story = projects.filter(item => item.npc === villager.id);
    assert.equal(story.length, 2);
    assert.equal(story[1].previous, story[0].id);
    assert.equal(villager.friendLines.length, 3);
    assert.ok(story[1].requires > story[0].requires);
  }
  for (const item of projects) {
    assert.equal(item.type, 'code'); assert.equal(item.kind, 'project');
    for (const field of ['title', 'subtitle', 'task', 'starter', 'solution', 'checks', 'hint', 'storyBefore', 'storyAfter', 'takeaway']) assert.ok(item[field], `${item.id} needs ${field}`);
    assert.ok(item.lesson.length >= 3);
    assert.ok(item.demo.fields.length > 0 && item.demo.expression && item.demo.instructions);
    assert.ok(item.xp > 0 && item.coins > 0);
  }
});

test('legacy saves migrate without changing campaign progress, money, pets, or existing drafts', () => {
  const legacy = availableState(24);
  delete legacy.projects; delete legacy.projectCode; delete legacy.metVillagers; delete legacy.villagePosition;
  legacy.coins = 543; legacy.xp = 800; legacy.owned = ['pip', 'fern']; legacy.equipped = 'fern';
  legacy.drafts[quests[0].id] = 'print("Hello, Pip!")';
  const normalized = normalizeState(legacy);
  assert.deepEqual(normalized.completed, legacy.completed);
  assert.equal(normalized.coins, 543); assert.equal(normalized.xp, 800);
  assert.deepEqual(normalized.owned, legacy.owned); assert.equal(normalized.equipped, 'fern');
  assert.deepEqual(normalized.drafts, legacy.drafts);
  assert.deepEqual(normalized.projects, []); assert.deepEqual(normalized.projectCode, {});
  assert.deepEqual(normalized.metVillagers, []); assert.deepEqual(normalized.villagePosition, { x: 500, y: 460 });
});

test('project eligibility requires both curriculum progress and the previous character project', () => {
  const state = freshState();
  assert.deepEqual(projects.filter(item => projectUnlocked(state, item.id)).map(item => item.id), ['project-tavern-bill']);
  assert.equal(projectUnlocked(state, 'unknown'), false);
  for (const item of projects.slice(1)) assert.equal(completeProject(state, item.id, item.solution).ok, false);
  assert.equal(state.coins, 0); assert.equal(state.xp, 0);
  state.completed = quests.slice(0, 20).map(item => item.id);
  assert.equal(projectUnlocked(state, 'project-pantry-ledger'), false);
  assert.equal(projectUnlocked(state, 'project-festival-scores'), false);
  assert.equal(projectUnlocked(state, 'project-lantern-predictor'), false);
  for (const item of projects) {
    assert.equal(projectUnlocked(state, item.id), true);
    assert.equal(completeProject(state, item.id, item.solution, '2026-10-19').ok, true);
  }
  assert.equal(state.projects.length, 6);
  assert.equal(state.completed.length, 20);
});

test('villager introductions and friendship cannot be farmed by repeated visits', () => {
  const state = freshState(), before = structuredClone(state);
  assert.deepEqual(friendship(state, 'rowan'), { count: 0, total: 2, met: false, label: 'Not yet met' });
  assert.equal(meetVillager(state, 'rowan').first, true);
  for (let i = 0; i < 10; i++) assert.equal(meetVillager(state, 'rowan').first, false);
  assert.deepEqual(state.metVillagers, ['rowan']);
  assert.equal(state.xp, before.xp); assert.equal(state.coins, before.coins);
  assert.equal(state.streak, 0); assert.equal(state.lastActivity, null);
  assert.equal(friendship(state, 'rowan').label, 'New acquaintance');
  assert.equal(meetVillager(state, 'unknown').ok, false);
  const first = project('project-tavern-bill'); completeProject(state, first.id, first.solution, '2026-10-19');
  assert.equal(friendship(state, 'rowan').count, 1);
  assert.equal(friendship(state, 'rowan').label, 'Growing friendship');
  state.completed = quests.slice(0, 8).map(item => item.id);
  const second = project('project-pantry-ledger'); completeProject(state, second.id, second.solution, '2026-10-19');
  assert.equal(friendship(state, 'rowan').count, 2);
  assert.equal(friendship(state, 'rowan').label, 'Trusted friend');
});

test('project completion rewards once, stores the tested source, and replay only replaces the source', () => {
  const state = freshState(), item = projects[0];
  assert.equal(completeProject(state, item.id, '').ok, false);
  assert.equal(completeProject(state, item.id, 'x'.repeat(30001)).ok, false);
  const result = completeProject(state, item.id, item.solution, '2026-10-19');
  assert.equal(result.ok, true); assert.equal(result.replay, false);
  assert.equal(result.xp, item.xp); assert.equal(result.coins, item.coins);
  assert.equal(state.xp, item.xp); assert.equal(state.coins, item.coins);
  assert.deepEqual(state.completed, []); assert.deepEqual(state.projects, [item.id]);
  assert.equal(state.projectCode[item.id], item.solution);
  const balances = { xp: state.xp, coins: state.coins };
  const edited = item.solution + '\n# A tested revision';
  const replay = completeProject(state, item.id, edited, '2026-10-19');
  assert.equal(replay.replay, true); assert.equal(replay.xp, 0); assert.equal(replay.coins, 0);
  assert.deepEqual({ xp: state.xp, coins: state.coins }, balances);
  assert.equal(state.projectCode[item.id], edited);
  assert.equal(friendship(state, 'rowan').count, 1);
  assert.deepEqual(normalizeState(structuredClone(state)), state);
});

test('projects contribute to learning days and existing achievements without unlocking campaign quests', () => {
  const state = freshState(), item = projects[0];
  completeProject(state, item.id, item.solution, '2026-10-17');
  completeQuest(state, quests[0].id, '2026-10-18');
  const reward = completeProject(state, item.id, item.solution, '2026-10-19');
  assert.equal(state.streak, 3); assert.equal(visibleStreak(state, '2026-10-19'), 3);
  assert.ok(reward.achievements.some(item => item.id === 'streak'));
  assert.deepEqual(state.completed, [quests[0].id]);
  const coins = state.coins; completeProject(state, item.id, item.solution, '2026-10-19');
  assert.equal(state.coins, coins);
});

test('imported project progress rejects gaps, duplicate rewards, foreign IDs, oversized text, and invalid positions', () => {
  const raw = availableState(8);
  raw.projects = ['unknown', 'project-pantry-ledger', 'project-tavern-bill', 'project-tavern-bill', 'project-festival-scores', 'project-lantern-predictor'];
  raw.projectCode = { 'project-tavern-bill': 'x'.repeat(40000), 'project-pantry-ledger': projects[1].solution, 'project-festival-scores': 'forged', unknown: 'forged' };
  raw.metVillagers = ['rowan', 'rowan', 'nobody'];
  raw.drafts = { 'project-plant-adviser': 'y'.repeat(40000), unknown: 'discard' };
  raw.villagePosition = { x: -5, y: 9999 };
  const normalized = normalizeState(raw);
  assert.deepEqual(normalized.projects, ['project-tavern-bill', 'project-pantry-ledger']);
  assert.equal(normalized.projectCode['project-tavern-bill'].length, 30000);
  assert.equal(normalized.projectCode['project-festival-scores'], undefined);
  assert.equal(normalized.projectCode.unknown, undefined);
  assert.deepEqual(normalized.metVillagers, ['rowan']);
  assert.equal(normalized.drafts['project-plant-adviser'].length, 30000);
  assert.equal(normalized.drafts.unknown, undefined);
  assert.deepEqual(normalized.villagePosition, { x: 0, y: 650 });
  assert.deepEqual(normalizeState({ version: 1, villagePosition: { x: Infinity, y: '20' } }).villagePosition, { x: 500, y: 460 });
  assert.deepEqual(normalizeState({ version: 1, projects: ['project-pantry-ledger'] }).projects, []);
});

test('all project references pass and blank code fails in the real Python curriculum checker', () => {
  // The existing helper also verifies the campaign's misconception fixtures.
  const result = spawnSync('python', ['tests/check_curriculum.py'], { input: JSON.stringify([...quests.filter(item => item.type === 'code'), ...projects]), encoding: 'utf8', timeout: 20000 });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(result.stdout, /All Python curriculum checks passed/);
});

test('project checkers reject plausible mistakes and every working demo executes the submitted functions', () => {
  const wrong = [
    ['project-tavern-bill', 'def bill(quantity, price, discount):\n    return 21.6'],
    ['project-tavern-bill', 'def bill(quantity, price, discount):\n    return round(quantity * price - discount, 2)'],
    ['project-tavern-bill', 'def bill(quantity, price, discount):\n    return quantity * price * (1 - discount / 100)'],
    ['project-pantry-ledger', 'def pantry_plan(stock, target):\n    return {name: target - count for name, count in stock.items()}'],
    ['project-pantry-ledger', 'def pantry_plan(stock, target):\n    result = {name: target - count for name, count in stock.items() if count < target}\n    stock.clear()\n    return result'],
    ['project-guessing-game', 'def guess_feedback(guess, secret):\n    return "Too low" if guess <= secret else "Too high"'],
    ['project-guessing-game', 'def guess_feedback(guess, secret):\n    return "You found it!" if guess == 7 else "Too low" if guess < 7 else "Too high"'],
    ['project-festival-scores', 'def festival_scores(rounds):\n    return {name: points for name, points in rounds}'],
    ['project-festival-scores', 'def festival_scores(rounds):\n    result = {}\n    for name, points in rounds:\n        if points > 0:\n            result[name] = result.get(name, 0) + points\n    return result'],
    ['project-plant-adviser', 'def plant_advice(moisture, light):\n    if light < 4:\n        return "Move into light"\n    return "Water" if moisture < 30 else "Let it grow"'],
    ['project-plant-adviser', 'def plant_advice(moisture, light):\n    if moisture <= 30:\n        return "Water"\n    return "Move into light" if light < 4 else "Let it grow"'],
    ['project-lantern-predictor', 'def fit_brightness(samples):\n    return 2.0\ndef predict_brightness(weight, hours):\n    return weight * hours'],
    ['project-lantern-predictor', 'def fit_brightness(samples):\n    return sum(y for x,y in samples)/sum(x for x,y in samples)\ndef predict_brightness(weight, hours):\n    return weight * hours'],
    ['project-lantern-predictor', 'def fit_brightness(samples):\n    return sum(x*y for x,y in samples)/sum(x*x for x,y in samples)\ndef predict_brightness(weight, hours):\n    return 2 * hours']
  ];
  const script = `import importlib.util, json, sys\nsys.dont_write_bytecode = True\nspec = importlib.util.spec_from_file_location('runtime', 'dist/runtime.py')\nruntime = importlib.util.module_from_spec(spec)\nspec.loader.exec_module(runtime)\ndata = json.load(sys.stdin)\nprojects = {p['id']: p for p in data['projects']}\nfor project_id, source in data['wrong']:\n    result = json.loads(runtime.run_source(source, projects[project_id]['checks']))\n    assert not result['passed'], f'{project_id}: accepted misconception: {source}'\nfor project in projects.values():\n    scope = {}\n    exec(project['solution'], scope)\n    scope.update({field['name']: field['value'] for field in project['demo']['fields']})\n    result = eval(project['demo']['expression'], scope)\n    assert result is not None, project['id'] + ': empty demo result'\n    if project['id'] == 'project-lantern-predictor':\n        scope['actual'] = 100\n        changed = eval(project['demo']['expression'], scope)\n        assert changed['learned weight'] == result['learned weight']\n        assert changed['prediction'] == result['prediction']\n        assert changed['held-out absolute error'] != result['held-out absolute error']\nprint('All project misconception and demo checks passed.')`;
  const result = spawnSync('python', ['-c', script], { input: JSON.stringify({ projects, wrong }), encoding: 'utf8', timeout: 20000 });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.match(result.stdout, /All project misconception and demo checks passed/);
});
