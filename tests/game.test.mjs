import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { quests, chapters, pets, achievements, dailyQuestions } from '../dist/content.js';
import { freshState, normalizeState, isUnlocked, nextQuest, levelInfo, completeQuest, completeDaily, adoptPet, visibleStreak } from '../dist/state.js';

test('the campaign contains 60 unique quests with four in each of fifteen chapters', () => {
  assert.equal(quests.length, 60); assert.equal(chapters.length, 15); assert.equal(new Set(quests.map(q => q.id)).size, 60);
  for (const ch of chapters) assert.equal(quests.filter(q => q.chapter === ch.id).length, 4);
  for (const q of [...quests.filter(q => q.type === 'quiz'), ...dailyQuestions]) { assert.ok(q.answer >= 0 && q.answer < q.options.length); assert.equal(q.options.length, 4); }
});
test('a new player has exactly the first quest and one free companion', () => {
  const s = freshState(); assert.equal(s.xp, 0); assert.equal(s.coins, 0); assert.deepEqual(s.owned, ['pip']);
  assert.equal(quests.filter(q => isUnlocked(s, q.id)).length, 1); assert.equal(nextQuest(s).id, quests[0].id);
});
test('locked quests cannot grant rewards', () => {
  const s = freshState(); assert.equal(completeQuest(s, quests[2].id).ok, false); assert.equal(s.xp, 0); assert.equal(s.coins, 0);
});
test('first clear grants rewards, unlocks next quest and an achievement once', () => {
  const s = freshState(); const first = completeQuest(s, quests[0].id, '2026-10-18');
  assert.equal(first.xp, quests[0].xp); assert.equal(first.achievements[0].id, 'first'); assert.ok(isUnlocked(s, quests[1].id));
  const before = { coins: s.coins, xp: s.xp }; const repeat = completeQuest(s, quests[0].id, '2026-10-18');
  assert.equal(repeat.replay, true); assert.equal(repeat.xp, 0); assert.equal(s.coins, before.coins); assert.equal(s.xp, before.xp); assert.equal(s.completed.length, 1);
});
test('the entire curriculum can be completed and all companions afforded', () => {
  const s = freshState(); for (const q of quests) assert.equal(completeQuest(s, q.id, '2026-10-18').ok, true);
  assert.equal(s.completed.length, 60); assert.equal(nextQuest(s), null); assert.ok(s.achievements.includes('graduate')); assert.ok(s.achievements.includes('master-scholar'));
  for (const pet of pets) assert.equal(adoptPet(s, pet.id).ok, true);
  assert.equal(s.owned.length, 5); assert.ok(s.coins >= 0); assert.ok(s.achievements.includes('collector'));
});
test('adoption enforces quest and coin requirements; equipping is free', () => {
  const s = freshState(); s.coins = 1000; assert.equal(adoptPet(s, 'fern').ok, false);
  s.completed = quests.slice(0, 2).map(q => q.id); s.coins = 139; assert.equal(adoptPet(s, 'fern').ok, false);
  s.coins = 140; const adopted = adoptPet(s, 'fern'); assert.equal(adopted.ok, true); assert.equal(s.equipped, 'fern');
  const coins = s.coins; adoptPet(s, 'pip'); adoptPet(s, 'fern'); assert.equal(s.coins, coins); assert.equal(s.owned.length, 2);
});
test('daily rewards are claimed once per local calendar date', () => {
  const s = freshState(); assert.equal(completeDaily(s, '2026-10-18').ok, true); const coins = s.coins;
  assert.equal(completeDaily(s, '2026-10-18').ok, false); assert.equal(s.coins, coins); assert.equal(s.xp, 50);
  assert.equal(completeDaily(s, '2026-10-19').ok, true); assert.equal(s.xp, 100);
});
test('streak tracks consecutive days and resets after a gap', () => {
  const s = freshState(); completeDaily(s, '2026-10-18'); completeQuest(s, quests[0].id, '2026-10-18'); assert.equal(s.streak, 1);
  completeDaily(s, '2026-10-19'); completeDaily(s, '2026-10-20'); assert.equal(s.streak, 3); assert.ok(s.achievements.includes('streak'));
  assert.equal(visibleStreak(s, '2026-10-21'), 3); assert.equal(visibleStreak(s, '2026-10-22'), 0);
  completeDaily(s, '2026-10-22'); assert.equal(s.streak, 1);
});
test('XP leveling handles exact boundaries', () => {
  assert.deepEqual(levelInfo(0), { level: 1, current: 0, needed: 200, percent: 0 });
  assert.equal(levelInfo(199).level, 1); assert.equal(levelInfo(200).level, 2); assert.equal(levelInfo(200).current, 0);
  assert.equal(levelInfo(459).level, 2); assert.equal(levelInfo(460).level, 3);
});
test('save normalization restores valid progress and rejects incompatible files', () => {
  const s = freshState(); completeQuest(s, quests[0].id); s.drafts[quests[0].id] = 'print("Hello, Pip!")';
  assert.deepEqual(normalizeState(JSON.parse(JSON.stringify(s))), s);
  assert.throws(() => normalizeState({ version: 5 })); assert.throws(() => normalizeState(null));
  const bad = normalizeState({ version: 1, coins: -2, xp: Infinity, owned: ['fake', 'pip', 'pip'], equipped: 'fake', completed: [quests[3].id], name: 'x'.repeat(100) });
  assert.equal(bad.coins, 0); assert.equal(bad.xp, 0); assert.deepEqual(bad.owned, ['pip']); assert.equal(bad.equipped, 'pip'); assert.deepEqual(bad.completed, []); assert.equal(bad.name.length, 24);
});
test('all achievement descriptions have attainable progress targets', () => {
  for (const a of achievements) { const [value, target] = a.progress(freshState()); assert.ok(value >= 0 && target > 0); assert.ok(a.coins > 0); }
});
test('an original 24-quest save resumes at the workshop with its rewards and drafts intact', () => {
  const old = freshState(); for (const q of quests.slice(0, 24)) completeQuest(old, q.id, '2026-10-18');
  old.drafts['learn-a-weight'] = 'weight = 0.0'; adoptPet(old, 'nova');
  const restored = normalizeState(JSON.parse(JSON.stringify(old)));
  assert.deepEqual(restored, old); assert.equal(nextQuest(restored).id, 'word-ledger');
  assert.ok(restored.achievements.includes('graduate')); assert.ok(!restored.achievements.includes('master-scholar'));
  const reward = completeQuest(restored, 'word-ledger', '2026-10-18');
  assert.ok(!reward.achievements.some(a => a.id === 'graduate'));
  assert.equal(restored.coins, old.coins + quests[24].coins); assert.equal(restored.xp, old.xp + quests[24].xp);
});
test('advanced achievements unlock at their intended milestones exactly once', () => {
  const state = freshState(), milestones = new Map([[24, 'graduate'], [32, 'artisan'], [48, 'modelmaker'], [52, 'neural-scholar'], [56, 'archive-keeper'], [60, 'master-scholar']]);
  for (const [i, quest] of quests.entries()) {
    const reward = completeQuest(state, quest.id, '2026-10-18');
    for (const [count, id] of milestones) assert.equal(state.achievements.includes(id), i + 1 >= count);
    if (milestones.has(i + 1)) assert.ok(reward.achievements.some(a => a.id === milestones.get(i + 1)));
    const before = state.coins; completeQuest(state, quest.id, '2026-10-18'); assert.equal(state.coins, before);
  }
});
test('every coding solution passes the actual Python checker; empty submissions fail', () => {
  const python = spawnSync('python', ['tests/check_curriculum.py'], { input: JSON.stringify(quests.filter(q => q.type === 'code')), encoding: 'utf8', timeout: 20000 });
  assert.equal(python.status, 0, python.stderr + python.stdout); assert.match(python.stdout, /All Python curriculum checks passed/);
});
