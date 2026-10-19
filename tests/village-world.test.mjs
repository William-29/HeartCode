import test from 'node:test';
import assert from 'node:assert/strict';
import { destinations, VILLAGE_START, isWalkable, normalizePosition, findRoute, segmentWalkable, moveBy, advanceRoute, nearbyDestination } from '../dist/village-model.js';
import { renderVillage, mountVillage } from '../dist/village.js';

test('every village destination is reachable without crossing a building or the lake', () => {
  for (const from of [VILLAGE_START, ...destinations]) {
    assert.ok(isWalkable(from));
    for (const to of destinations) {
      const route = findRoute(from, to);
      assert.ok(route.length >= 2, `${from.id || 'start'} to ${to.id}`);
      assert.deepEqual(route[0], { x: from.x, y: from.y });
      assert.deepEqual(route.at(-1), { x: to.x, y: to.y });
      for (let i = 1; i < route.length; i++) assert.ok(segmentWalkable(route[i - 1], route[i]), `${from.id || 'start'} to ${to.id}, segment ${i}`);
    }
  }
});

test('saved coordinates and clicks on water or buildings resolve to traversable ground', () => {
  for (const position of [null, { x: NaN, y: Infinity }, { x: -900, y: 9999 }, { x: 180, y: 490 }, { x: 200, y: 200 }, { x: 500, y: 320 }]) {
    const resolved = normalizePosition(position);
    assert.ok(isWalkable(resolved));
    const route = findRoute(VILLAGE_START, resolved);
    assert.ok(route.length >= 2);
    for (let i = 1; i < route.length; i++) assert.ok(segmentWalkable(route[i - 1], route[i]));
  }
  assert.deepEqual(normalizePosition(undefined), VILLAGE_START);
  assert.ok(!isWalkable({ x: 180, y: 490 }));
  assert.ok(!isWalkable({ x: 200, y: 200 }));
});

test('keyboard movement respects bounds and solids even during a long time step', () => {
  for (const [start, dx, dy] of [[{ x: 350, y: 500 }, -280, 0], [{ x: 200, y: 350 }, 0, -200], [VILLAGE_START, 1500, 1500], [VILLAGE_START, -1500, -1500]]) {
    const end = moveBy(start, dx, dy);
    assert.ok(isWalkable(end));
    assert.ok(end.x >= 30 && end.x <= 970 && end.y >= 70 && end.y <= 620);
  }
  assert.ok(moveBy({ x: 350, y: 500 }, -280, 0).x > 330);
  assert.ok(moveBy({ x: 200, y: 350 }, 0, -200).y > 265);
  const straight = moveBy(VILLAGE_START, 10, 0);
  assert.ok(Math.abs(straight.x - 510) < 1e-9); assert.equal(straight.y, 460);
});

test('route travel consumes distance continuously and arrives exactly once at the target', () => {
  let position = { ...VILLAGE_START }, route = findRoute(position, destinations[0]).slice(1), iterations = 0;
  while (route.length && iterations++ < 300) {
    const step = advanceRoute(position, route, 4);
    assert.ok(Math.hypot(position.x - step.position.x, position.y - step.position.y) <= 4.000001);
    assert.ok(isWalkable(step.position));
    position = step.position; route = step.route;
  }
  assert.ok(iterations < 300);
  assert.deepEqual(position, { x: destinations[0].x, y: destinations[0].y });
  assert.equal(nearbyDestination(position).id, 'rowan');
  assert.equal(nearbyDestination(VILLAGE_START), null);
});

test('the village includes direct accessible visits, safe names, and project-specific improvements', () => {
  const state = { projects: [], metVillagers: [], villagePosition: VILLAGE_START };
  const html = renderVillage(state, { id: 'pip', name: '<script>cat</script>' });
  assert.equal((html.match(/data-village-walk=/g) || []).length, 6);
  assert.equal((html.match(/data-village-visit=/g) || []).length, 6);
  assert.ok(html.includes('aria-describedby="village-instructions"'));
  assert.ok(html.includes('&lt;script&gt;cat&lt;/script&gt;')); assert.ok(!html.includes('<script>cat'));
  assert.ok(!html.includes('class="village-improvement"'));
  const grown = renderVillage({ ...state, projects: ['project-tavern-bill', 'project-guessing-game', 'project-plant-adviser', 'project-lantern-predictor'], metVillagers: ['rowan'] });
  assert.equal((grown.match(/class="village-improvement"/g) || []).length, 7);
  assert.ok(grown.includes('coral has-met'));
});

function villageHarness(run) {
  class Element {
    constructor() {
      this.listeners = new Map(); this.style = {}; this.dataset = {}; this.classes = new Set(); this.hidden = false; this.clientWidth = 1000; this.scrollLeft = 0; this.textContent = ''; this.innerHTML = '';
      this.classList = { add: name => this.classes.add(name), remove: name => this.classes.delete(name), toggle: (name, on) => on ? this.classes.add(name) : this.classes.delete(name) };
    }
    addEventListener(name, callback) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(callback); }
    removeEventListener(name, callback) { this.listeners.get(name)?.delete(callback); }
    emit(name, data = {}) { for (const callback of [...(this.listeners.get(name) || [])]) callback({ target: this, preventDefault() {}, ...data }); }
    focus() {}
    closest() { return null; }
    getBoundingClientRect() { return { left: 0, top: 0, width: 1000, height: 650 }; }
  }
  const root = new Element(), viewport = new Element(), scene = new Element(), actor = new Element(), marker = new Element(), status = new Element(), interact = new Element(), media = new Element(), doc = new Element(), win = new Element();
  const fields = new Map([['.village-viewport', viewport], ['.village-scene', scene], ['.village-actor', actor], ['.village-walk-marker', marker], ['.village-status', status], ['[data-village-interact]', interact]]);
  let dialogOpen = false, next = 0, time = 0; const frames = new Map();
  root.querySelector = selector => fields.get(selector); root.querySelectorAll = () => []; root.contains = element => fields.has(element);
  doc.querySelector = selector => selector === '.village-shell' ? root : selector === 'dialog[open]' ? dialogOpen : null;
  viewport.closest = selector => selector === '.village-viewport' ? viewport : null;
  const overrides = { document: doc, window: win, matchMedia: () => media, requestAnimationFrame: callback => { frames.set(++next, callback); return next; }, cancelAnimationFrame: id => frames.delete(id) };
  const previous = new Map(Object.keys(overrides).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.assign(globalThis, overrides);
  try {
    run({ root, viewport, scene, actor, media, doc, win, frames, marker,
      openDialog: () => { dialogOpen = true; },
      step: (milliseconds = 50) => { time += milliseconds; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(time)); },
      clickPlace: id => { const target = new Element(); target.dataset.villageWalk = id; target.closest = selector => selector === '[data-village-walk]' ? target : null; root.emit('click', { target }); },
      directVisit: id => { const target = new Element(); target.dataset.villageVisit = id; target.closest = selector => selector === '[data-village-visit]' ? target : null; root.emit('click', { target }); },
      listenerCount: () => [root, viewport, scene, actor, marker, status, interact, media, doc, win].reduce((total, element) => total + [...element.listeners.values()].reduce((sum, entries) => sum + entries.size, 0), 0)
    });
  } finally { for (const [key, descriptor] of previous) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } }
}

test('walking to a villager calls visit after arrival and disposes every listener and frame', () => villageHarness(h => {
  const visits = [], moves = [], session = mountVillage({ state: { villagePosition: VILLAGE_START }, onVisit: id => visits.push(id), onMove: point => moves.push(point) });
  h.clickPlace('rowan'); assert.equal(visits.length, 0); assert.equal(h.frames.size, 1);
  let ticks = 0; while (h.frames.size && ticks++ < 300) h.step();
  assert.ok(ticks < 300); assert.deepEqual(visits, ['rowan']);
  assert.deepEqual(moves.at(-1), { x: 270, y: 340 }); assert.ok(h.marker.hidden);
  session.dispose(); session.dispose(); assert.equal(h.listenerCount(), 0); assert.equal(h.frames.size, 0);
}));

test('keyboard walking pauses for dialogs, blur, and hidden tabs without opening a destination', () => villageHarness(h => {
  const visits = [], moves = [], session = mountVillage({ state: {}, onVisit: id => visits.push(id), onMove: point => moves.push(point) });
  h.root.emit('keydown', { target: h.viewport, key: 'd' }); h.step(); h.step();
  assert.ok(parseFloat(h.actor.style.left) > 50);
  h.win.emit('blur'); assert.equal(h.frames.size, 0); assert.equal(moves.length, 1);
  h.clickPlace('mira'); h.step(); h.doc.hidden = true; h.doc.emit('visibilitychange'); assert.equal(h.frames.size, 0);
  h.doc.hidden = false; h.clickPlace('rowan'); h.step(); h.openDialog(); h.step(); assert.equal(h.frames.size, 0); assert.deepEqual(visits, []);
  session.dispose(); assert.equal(h.listenerCount(), 0);
}));

test('direct visits need no movement and reduced motion remains reactive', () => villageHarness(h => {
  const visits = [], session = mountVillage({ state: {}, onVisit: id => visits.push(id) });
  h.directVisit('companions'); assert.deepEqual(visits, ['companions']); assert.equal(h.frames.size, 0);
  h.media.matches = true; h.media.emit('change'); assert.ok(h.root.classes.has('village-still'));
  h.media.matches = false; h.media.emit('change'); assert.ok(!h.root.classes.has('village-still'));
  session.dispose();
  const manual = mountVillage({ state: {}, reducedMotion: true }); assert.ok(h.root.classes.has('village-still'));
  manual.dispose();
}));
