import test from 'node:test';
import assert from 'node:assert/strict';
import { quests, pets } from '../dist/content.js';
import { freshState, completeQuest, completeDaily, normalizeState } from '../dist/state.js';
import { stops, regions, WORLD_WIDTH, WORLD_HEIGHT, pointOnLeg, legPath, positionForProgress, travelForCompletion, regionForStop } from '../dist/world-model.js';
import { renderWorld, mountWorld } from '../dist/world.js';

test('the overworld has a stop for every quest and a distinct academy destination', () => {
  assert.equal(stops.length, quests.length + 1); assert.equal(regions.length, 15);
  for (const point of stops) assert.ok(point.x > 0 && point.x < WORLD_WIDTH && point.y > 0 && point.y < WORLD_HEIGHT);
  assert.equal(new Set(stops.map(p => `${p.x},${p.y}`)).size, stops.length);
  for (let i = 0; i < quests.length; i++) assert.equal(regionForStop(i), regions[quests[i].chapter]);
  assert.equal(regionForStop(quests.length), regions.at(-1));
});
test('walking follows continuous curves and finishes exactly at the next quest', () => {
  for (let i = 0; i < quests.length; i++) {
    assert.deepEqual(pointOnLeg(i, 0), stops[i]); assert.deepEqual(pointOnLeg(i, 1), stops[i + 1]);
    assert.match(legPath(i), /^M .+ C /);
    for (let t = 0; t <= 1; t += .025) { const p = pointOnLeg(i, t); assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y)); assert.ok(p.x >= 0 && p.x <= WORLD_WIDTH && p.y >= 0 && p.y <= WORLD_HEIGHT); }
  }
  assert.throws(() => pointOnLeg(quests.length, .5), RangeError);
});
test('only a first campaign clear creates forward travel; daily quests and replays do not', () => {
  const s = freshState();
  assert.equal(travelForCompletion(quests[3].id, completeQuest(s, quests[3].id)), null);
  assert.equal(travelForCompletion('daily', completeDaily(s, '2026-10-18')), null);
  for (let i = 0; i < quests.length; i++) {
    const result = completeQuest(s, quests[i].id, '2026-10-18'), travel = travelForCompletion(quests[i].id, result);
    assert.deepEqual([travel.from, travel.to], [i, i + 1]); assert.equal(travel.final, i === quests.length - 1);
    assert.equal(travel.newRegion, i < quests.length - 1 && (i + 1) % 4 === 0);
    assert.equal(travelForCompletion(quests[i].id, completeQuest(s, quests[i].id, '2026-10-18')), null);
  }
});
test('saved progress restores the destination independently of an interrupted animation', () => {
  const s = freshState(); for (const q of quests.slice(0, 9)) completeQuest(s, q.id);
  const restored = normalizeState(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(positionForProgress(restored.completed.length), stops[9]);
  assert.deepEqual(positionForProgress(-1), stops[0]); assert.deepEqual(positionForProgress(999), stops[quests.length]);
});
test('the map exposes 60 named controls, locked previews, and all fifteen regions', () => {
  const html = renderWorld(freshState(), pets[0], null, null);
  assert.equal((html.match(/data-world="select"/g) || []).length, quests.length);
  assert.equal((html.match(/class="world-node current /g) || []).length, 1);
  assert.equal((html.match(/class="world-node undiscovered /g) || []).length, quests.length - 1);
  for (const r of regions) assert.ok(html.includes(r.name));
  assert.ok(html.includes('data-world="follow"')); assert.ok(html.includes('data-world="fit"'));
  const locked = renderWorld(freshState(), pets[0], 8, null); assert.match(locked, /Path not yet open/);
});
test('a finished adventure shows the academy and never indexes a nonexistent quest', () => {
  const s = freshState(); for (const q of quests) completeQuest(s, q.id);
  const html = renderWorld(s, pets[0], null, null);
  assert.match(html, /guild-finish reached/); assert.equal((html.match(/class="world-node cleared /g) || []).length, quests.length);
  assert.ok(html.includes('Return to the tavern')); assert.ok(!html.includes('undefined'));
});
test('the old guild ending now opens a new region without marking the whole journey complete', () => {
  const state = freshState(); for (const q of quests.slice(0, 23)) completeQuest(state, q.id);
  const result = completeQuest(state, 'guild-trial'), travel = travelForCompletion('guild-trial', result);
  assert.deepEqual(travel, { from: 23, to: 24, newRegion: true, final: false });
  const html = renderWorld(state, pets[0], null, null);
  assert.ok(html.includes('40% explored')); assert.ok(html.includes('assets/guildlands.png')); assert.ok(!html.includes('guild-finish reached'));
  assert.ok(html.includes('A ledger of little words')); assert.equal(regionForStop(24).name, 'The Guild Workshop');
});
test('completion summary safely escapes Python output and shows achievement bonuses', () => {
  const s = freshState(), result = completeQuest(s, quests[0].id);
  const html = renderWorld(s, pets[0], 1, { quest: quests[0], result, output: '<script>alert(1)</script>', leveled: false, level: 1 });
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;')); assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('The first spark · +20 coins'));
});

// A minimal DOM adapter exercises animation lifecycle without launching a browser.
// Visual layout and browser input behavior still require a connected browser.
function mapHarness(run, reduced = false) {
  class Element extends EventTarget {
    constructor() { super(); this.style = {}; this.hidden = false; this.textContent = ''; this.attributes = {}; this.classes = new Set(); this.classList = { add: x => this.classes.add(x), remove: x => this.classes.delete(x), toggle: (x, v) => v ? this.classes.add(x) : this.classes.delete(x) }; }
    setAttribute(k, v) { this.attributes[k] = v; }
  }
  const document = new Element(), root = new Element(), viewport = new Element(), canvas = new Element(), actor = new Element(), media = new Element();
  viewport.clientWidth = 1000; viewport.clientHeight = 600; media.matches = reduced;
  const elements = new Map([['.world-shell', root], ['.world-viewport', viewport], ['.world-canvas', canvas], ['.world-traveler', actor]]);
  const get = selector => { if (!elements.has(selector)) elements.set(selector, new Element()); return elements.get(selector); };
  root.querySelector = get; document.querySelector = get; root.querySelectorAll = document.querySelectorAll = () => [];
  const frames = new Map(); let number = 0, disconnected = false;
  const overrides = { document, matchMedia: () => media, requestAnimationFrame: callback => { frames.set(++number, callback); return number; }, cancelAnimationFrame: id => frames.delete(id), ResizeObserver: class { observe() {} disconnect() { disconnected = true; } } };
  const previous = new Map(Object.keys(overrides).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.assign(globalThis, overrides);
  try { run({ actor, viewport, get, frames, disconnected: () => disconnected }); }
  finally { for (const [key, descriptor] of previous) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } }
}

test('skip walk arrives immediately and never awards duplicate rewards', () => mapHarness(({ actor, frames, viewport, get }) => {
  const state = freshState(), result = completeQuest(state, quests[0].id), before = JSON.stringify(state);
  const session = mountWorld({ state, travel: travelForCompletion(quests[0].id, result), selectedIndex: 1, reducedMotion: false, onSelect() {} });
  assert.ok(actor.classes.has('walking')); assert.equal(frames.size, 1);
  session.finishTravel(); session.finishTravel();
  assert.equal(actor.style.left, `${stops[1].x}px`); assert.equal(actor.style.top, `${stops[1].y}px`);
  assert.equal(frames.size, 0); assert.equal(viewport.attributes['aria-busy'], 'false'); assert.ok(get('[data-world="skip"]').hidden);
  assert.equal(JSON.stringify(state), before); session.dispose();
}));
test('reduced motion reaches the destination without scheduling a walking animation', () => mapHarness(({ actor, frames }) => {
  const state = freshState(), result = completeQuest(state, quests[0].id);
  const session = mountWorld({ state, travel: travelForCompletion(quests[0].id, result), selectedIndex: 1, reducedMotion: false, onSelect() {} });
  assert.equal(frames.size, 0); assert.equal(actor.style.left, `${stops[1].x}px`); assert.ok(!actor.classes.has('walking')); session.dispose();
}, true));
test('leaving the map cancels animation frames and disconnects resize observers', () => mapHarness(({ frames, actor, disconnected }) => {
  const state = freshState(), result = completeQuest(state, quests[0].id);
  const session = mountWorld({ state, travel: travelForCompletion(quests[0].id, result), selectedIndex: 1, reducedMotion: false, onSelect() {} });
  const callback = [...frames.values()][0]; frames.clear(); callback(performance.now() + 1500);
  assert.notEqual(actor.style.left, `${stops[0].x}px`); assert.notEqual(actor.style.left, `${stops[1].x}px`);
  session.dispose(); const last = actor.style.left; callback(performance.now() + 4000);
  assert.equal(frames.size, 0); assert.equal(actor.style.left, last); assert.ok(disconnected());
}));
test('advanced chapter transitions and the final academy walk reach their actual destinations', () => {
  for (const index of [23, 27, 51, 59]) mapHarness(({ actor, frames, get }) => {
    const state = freshState(); for (const q of quests.slice(0, index)) completeQuest(state, q.id);
    const result = completeQuest(state, quests[index].id), saved = JSON.stringify(state);
    const session = mountWorld({ state, travel: travelForCompletion(quests[index].id, result), selectedIndex: Math.min(index + 1, quests.length - 1), reducedMotion: false, onSelect() {} });
    const callback = [...frames.values()][0]; frames.clear(); callback(performance.now() + 4000);
    assert.equal(actor.style.left, `${stops[index + 1].x}px`); assert.equal(actor.style.top, `${stops[index + 1].y}px`);
    assert.equal(get('.arrival-quest').hidden, false); assert.equal(frames.size, 0);
    assert.match(get('#travel-message').textContent, index === 59 ? /All 60 quests are complete/ : /New region discovered/);
    assert.equal(JSON.stringify(state), saved); session.dispose();
  });
});
