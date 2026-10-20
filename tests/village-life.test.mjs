import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, normalizeState, completeQuest, completeProject } from '../dist/state.js';
import { quests, pets } from '../dist/content.js';
import { projects } from '../dist/projects.js';
import { villagePeriod, periods, scheduledPlaces, roomItems, furnishRoom, removeFurnishing, freshHome, festivalProgress, celebrateFestival } from '../dist/village-life-model.js';
import { renderRoom, renderFestival, renderCafe, mountVillageClock } from '../dist/village-life.js';
import { destinations, VILLAGE_START, findRoute, isWalkable, segmentWalkable } from '../dist/village-model.js';

function preparedState() {
  const state = freshState();
  for (const quest of quests.slice(0, 20)) completeQuest(state, quest.id);
  for (const project of projects) assert.equal(completeProject(state, project.id, project.solution).ok, true);
  return state;
}

test('device time changes routines at exact boundaries and a chosen period overrides the clock', () => {
  for (const [hour, minute, expected] of [[5,59,'evening'],[6,0,'morning'],[11,59,'morning'],[12,0,'afternoon'],[16,59,'afternoon'],[17,0,'evening'],[23,59,'evening']]) {
    const date = new Date(2026, 9, 20, hour, minute);
    assert.equal(villagePeriod('auto', date), expected);
    for (const period of periods) assert.equal(villagePeriod(period, date), period);
  }
});

test('every scheduled villager and new entrance stays on reachable ground in all periods', () => {
  for (const period of periods) for (const place of scheduledPlaces(destinations, period)) {
    assert.ok(isWalkable(place), `${period}: ${place.id}`);
    const path = findRoute(VILLAGE_START, place);
    assert.deepEqual(path.at(-1), { x: place.x, y: place.y });
    for (let i = 1; i < path.length; i++) assert.ok(segmentWalkable(path[i - 1], path[i]));
  }
});

test('legacy saves gain free furniture while malformed room imports cannot equip foreign items or wrong slots', () => {
  const legacy = { ...freshState(), coins: 89, xp: 120, drafts: { practice: 'print(7)' } };
  delete legacy.home; delete legacy.villageTime; delete legacy.festivalCelebrated;
  const restored = normalizeState(legacy);
  assert.deepEqual(restored.home, freshHome());
  assert.equal(restored.coins, 89); assert.equal(restored.xp, 120); assert.equal(restored.drafts.practice, 'print(7)');
  const invalid = normalizeState({ ...legacy, villageTime: '<script>', festivalCelebrated: true, home: { owned: ['plant-fern', 'plant-fern', 'foreign'], placed: { chair: 'plant-fern', lamp: 'lamp-glass', plant: 'plant-fern', rug: null, unknown: 'plant-fern' } } });
  assert.equal(invalid.home.placed.chair, 'chair-cinnamon'); assert.equal(invalid.home.placed.lamp, 'lamp-brass');
  assert.equal(invalid.home.placed.plant, 'plant-fern'); assert.equal(invalid.home.placed.rug, null);
  assert.equal(invalid.home.owned.filter(id => id === 'plant-fern').length, 1);
  assert.ok(!invalid.home.owned.includes('foreign')); assert.equal(invalid.villageTime, 'auto'); assert.equal(invalid.festivalCelebrated, false);
});

test('furnishings debit coins once, enforce affordability, and remain owned when cleared or replaced', () => {
  const state = freshState();
  const before = structuredClone(state);
  assert.equal(furnishRoom(state, 'plant-fern').ok, false); assert.deepEqual(state, before);
  assert.equal(furnishRoom(state, 'unknown').ok, false); assert.deepEqual(state, before);
  state.coins = 200;
  assert.equal(furnishRoom(state, 'plant-fern').purchased, true); assert.equal(state.coins, 155);
  assert.equal(removeFurnishing(state, 'plant').ok, true); assert.equal(state.home.placed.plant, null);
  assert.equal(furnishRoom(state, 'plant-fern').purchased, false); assert.equal(state.coins, 155);
  assert.equal(furnishRoom(state, 'plant-flowers').purchased, true); assert.equal(state.coins, 85);
  furnishRoom(state, 'plant-fern'); assert.equal(state.coins, 85); assert.equal(state.home.placed.plant, 'plant-fern');
  assert.equal(state.home.owned.filter(id => id === 'plant-fern').length, 1);
  assert.equal(removeFurnishing(state, '__proto__').ok, false);
  assert.deepEqual(state.completed, []); assert.equal(state.xp, 0);
  const restored = normalizeState(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored.home, state.home); assert.equal(restored.coins, 85);
});

test('festival chapters credit earlier projects, require all six preparations, and award a keepsake once across reloads', () => {
  const early = freshState(), initial = structuredClone(early);
  assert.equal(celebrateFestival(early).ok, false); assert.deepEqual(early, initial);
  completeProject(early, projects[0].id, projects[0].solution);
  assert.equal(festivalProgress(early).done, 1); assert.equal(festivalProgress(early).current, 0);
  const state = preparedState(), before = structuredClone(state);
  assert.equal(festivalProgress(state).ready, true);
  assert.deepEqual(celebrateFestival(state), { ok: true, replay: false, xp: 200, coins: 150 });
  assert.equal(state.xp, before.xp + 200); assert.equal(state.coins, before.coins + 150);
  assert.deepEqual(state.completed, before.completed); assert.deepEqual(state.projectCode, before.projectCode);
  const restored = normalizeState(JSON.parse(JSON.stringify(state)));
  assert.equal(festivalProgress(restored).celebrated, true);
  assert.deepEqual(celebrateFestival(restored), { ok: true, replay: true, xp: 0, coins: 0 });
  assert.equal(restored.coins, state.coins); assert.equal(restored.xp, state.xp);
});

test('festival stalls offer saved Python, explain locks, and can restore a missing source file', () => {
  const early = renderFestival(freshState());
  assert.ok(early.includes('CHAPTER 1 OF 3')); assert.ok(early.includes('Complete 20 trail quests'));
  assert.equal((early.match(/data-action="project-demo"/g) || []).length, 0);
  const ready = preparedState(), html = renderFestival(ready);
  assert.equal((html.match(/data-action="project-demo"/g) || []).length, 6);
  assert.ok(html.includes('data-action="festival-celebrate"'));
  delete ready.projectCode['project-tavern-bill'];
  const missing = renderFestival(ready);
  assert.equal((missing.match(/data-action="project-demo"/g) || []).length, 5); assert.ok(missing.includes('Restore your creation'));
  celebrateFestival(ready);
  assert.ok(!renderFestival(ready).includes('data-action="festival-celebrate"'));
  assert.ok(renderRoom(ready, pets[0]).includes('home-festival-pennant'));
});

test('room and café escape player names and visits cannot change rewards', () => {
  const state = freshState(); state.name = '<img onerror=boom>';
  const pet = { ...pets[0], name: '<script>pet</script>' }, before = structuredClone(state);
  const html = renderRoom(state, pet) + renderCafe(state, pet);
  assert.ok(!html.includes('<img onerror=boom>')); assert.ok(!html.includes('<script>pet</script>'));
  assert.ok(html.includes('&lt;img onerror=boom&gt;')); assert.ok(html.includes('&lt;script&gt;pet&lt;/script&gt;'));
  assert.deepEqual(state, before);
  for (const item of roomItems) assert.ok(renderRoom({ ...state, coins: 999 }, pet, item.slot).includes(item.id));
});

test('clock refresh waits for dialogs and hidden tabs, updates on return, and disposes its timer and listener', () => {
  const previous = Object.fromEntries(['document', 'setInterval', 'clearInterval'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const document = new EventTarget(); let dialog = false, callback, cleared, updates = 0;
  let now = new Date(2026, 9, 20, 11, 59);
  document.querySelector = () => dialog;
  Object.assign(globalThis, { document, setInterval: fn => { callback = fn; return 55; }, clearInterval: id => { cleared = id; } });
  try {
    const clock = mountVillageClock(freshState(), () => updates++, () => now);
    callback(); assert.equal(updates, 0);
    now = new Date(2026, 9, 20, 12, 0); dialog = true; callback(); assert.equal(updates, 0);
    dialog = false; document.hidden = true; callback(); assert.equal(updates, 0);
    document.hidden = false; document.dispatchEvent(new Event('visibilitychange')); assert.equal(updates, 1);
    callback(); assert.equal(updates, 1);
    clock.dispose(); assert.equal(cleared, 55);
    now = new Date(2026, 9, 20, 18, 0); document.dispatchEvent(new Event('visibilitychange')); assert.equal(updates, 1);
  } finally { for (const [key, descriptor] of Object.entries(previous)) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } }
});

test('room categories keep only two choices on screen while retaining all owned furniture in the scene', () => {
  const state = freshState(); state.coins = 1000;
  furnishRoom(state, 'plant-fern');
  const before = structuredClone(state);
  for (const slot of ['chair', 'lamp', 'plant', 'rug', 'wall']) {
    const html = renderRoom(state, pets[0], slot);
    assert.equal((html.match(/data-action="room-slot"/g) || []).length, 5);
    assert.equal((html.match(/class="room-shop-item /g) || []).length, 2);
    assert.ok(html.includes(`data-id="${slot}" aria-pressed="true"`));
    assert.ok(html.includes('assets/hearthwick-room.png'));
    assert.ok(html.includes('assets/hearthwick-furnishings.png'));
    for (const item of Object.values(state.home.placed)) assert.ok(html.includes(`item-${item}`));
  }
  assert.deepEqual(state, before);
});
