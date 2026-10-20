import test from 'node:test';
import { discoveries } from '../dist/clockwork-content.js';
import { noticeDiscoveries } from '../dist/neighbour-model.js';
import assert from 'node:assert/strict';
import { destinations, VILLAGE_START, isWalkable, normalizePosition, findRoute, segmentWalkable, moveBy, advanceRoute, nearbyDestination } from '../dist/village-model.js';
import { renderVillage, mountVillage, fitVillageViewport } from '../dist/village.js';
import { scheduledPlaces } from '../dist/village-life-model.js';

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
  assert.equal((html.match(/data-village-walk=/g) || []).length, destinations.length);
  assert.ok(html.includes('id="village-destination"'));
  for (const place of destinations) assert.ok(html.includes(`<option value="${place.id}">`));
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
      this.listeners = new Map(); this.style = { setProperty(key,value){this[key]=value;} }; this.dataset = {}; this.classes = new Set(); this.hidden = false; this.clientWidth = 1000; this.clientHeight = 650; this.scrollLeft = 0; this.textContent = ''; this.innerHTML = '';
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
  for (const id of ['rowan', 'mira', 'elio']) fields.set(`[data-village-walk="${id}"]`, new Element());
  let dialogOpen = false, next = 0, time = 0; const frames = new Map(), timers = new Map();
  root.querySelector = selector => fields.get(selector); root.querySelectorAll = () => []; root.contains = element => fields.has(element);
  doc.querySelector = selector => selector === '.village-shell' ? root : selector === 'dialog[open]' ? dialogOpen : null;
  viewport.closest = selector => selector === '.village-viewport' ? viewport : null;
  const overrides = { setTimeout: (callback, delay) => { timers.set(++next, {callback, delay}); return next; }, clearTimeout: id => timers.delete(id), document: doc, window: win, matchMedia: () => media, requestAnimationFrame: callback => { frames.set(++next, callback); return next; }, cancelAnimationFrame: id => frames.delete(id) };
  const previous = new Map(Object.keys(overrides).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.assign(globalThis, overrides);
  try {
    run({ root, viewport, scene, actor, media, doc, win, frames, timers, marker,
      closeDialog: () => { dialogOpen = false; },
      fireTimers: () => { const pending = [...timers.values()]; timers.clear(); pending.forEach(timer => timer.callback()); },
      openDialog: () => { dialogOpen = true; },
      step: (milliseconds = 50) => { time += milliseconds; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(time)); },
      clickPlace: id => { const target = new Element(); target.dataset.villageWalk = id; target.closest = selector => selector === '[data-village-walk]' ? target : null; root.emit('click', { target }); },
      directVisit: id => { const target = new Element(); target.dataset.villageVisit = id; target.closest = selector => selector === '[data-village-visit]' ? target : null; root.emit('click', { target }); },
      listenerCount: () => [root, viewport, scene, actor, marker, status, interact, media, doc, win].reduce((total, element) => total + [...element.listeners.values()].reduce((sum, entries) => sum + entries.size, 0), 0)
    });
  } finally { for (const [key, descriptor] of previous) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } }
}

test('walking to a villager calls visit after arrival and disposes every listener and frame', () => villageHarness(h => {
  const visits = [], moves = [], session = mountVillage({ state: { villagePosition: VILLAGE_START, villageTime: 'evening' }, onVisit: id => visits.push(id), onMove: point => moves.push(point) });
  h.clickPlace('rowan'); assert.equal(visits.length, 0); assert.equal(h.frames.size, 1);
  let ticks = 0; while (h.frames.size && ticks++ < 300) h.step();
  assert.ok(ticks < 300); assert.deepEqual(visits, ['rowan']);
  assert.deepEqual(moves.at(-1), { x: 270, y: 340 }); assert.ok(h.marker.hidden);
  session.dispose(); session.dispose(); assert.equal(h.listenerCount(), 0); assert.equal(h.frames.size, 0);
}));

test('keyboard walking pauses for dialogs, blur, and hidden tabs without opening a destination', () => villageHarness(h => {
  const visits = [], moves = [], session = mountVillage({ state: { villageTime: 'evening' }, onVisit: id => visits.push(id), onMove: point => moves.push(point) });
  h.root.emit('keydown', { target: h.viewport, key: 'd' }); h.step(); h.step();
  assert.ok(parseFloat(h.actor.style.left) > 50);
  h.win.emit('blur'); assert.equal(h.frames.size, 0); assert.equal(moves.length, 1);
  h.clickPlace('mira'); h.step(); h.doc.hidden = true; h.doc.emit('visibilitychange'); assert.equal(h.frames.size, 0);
  h.doc.hidden = false; h.clickPlace('rowan'); h.step(); h.openDialog(); h.step(); assert.equal(h.frames.size, 0); assert.deepEqual(visits, []);
  session.dispose(); assert.equal(h.listenerCount(), 0);
}));

test('direct visits need no movement and reduced motion remains reactive', () => villageHarness(h => {
  const visits = [], session = mountVillage({ state: { villageTime: 'evening' }, onVisit: id => visits.push(id) });
  h.directVisit('companions'); assert.deepEqual(visits, ['companions']); assert.equal(h.frames.size, 0);
  h.media.matches = true; h.media.emit('change'); assert.ok(h.root.classes.has('village-still'));
  h.media.matches = false; h.media.emit('change'); assert.ok(!h.root.classes.has('village-still'));
  session.dispose();
  const manual = mountVillage({ state: { villageTime: 'evening' }, reducedMotion: true }); assert.ok(h.root.classes.has('village-still'));
  manual.dispose();
}));

test('following a companion walks a safe path, discovers its clue and opens the shared discovery journal once', () => villageHarness(h => {
  for (const clue of discoveries) {
    const state={villagePosition:VILLAGE_START,villageTime:'evening',neighbours:{found:[],completed:[]}},visits=[],moves=[];
    assert.ok(isWalkable(clue));assert.ok(findRoute(VILLAGE_START,clue).length>=2);
    const session=mountVillage({state,onExplore:p=>noticeDiscoveries(state,p),onVisit:id=>visits.push(id),onMove:p=>moves.push(p)});
    assert.equal(session.followDiscovery(clue.id),true);assert.equal(state.neighbours.found.length,0);
    let ticks=0;while(h.frames.size&&ticks++<400)h.step();
    assert.ok(ticks<400);assert.ok(state.neighbours.found.includes(clue.id));assert.deepEqual(visits,['discoveries']);assert.deepEqual(moves.at(-1),{x:clue.x,y:clue.y});
    session.dispose();assert.equal(h.listenerCount(),0);
  }
}));

test('reduced-motion discovery visits arrive immediately; blocked or disposed walks never reveal a clue', () => villageHarness(h => {
  const state={villageTime:'evening',neighbours:{found:[],completed:[]}},visits=[];
  const session=mountVillage({state,reducedMotion:true,onExplore:p=>noticeDiscoveries(state,p),onVisit:id=>visits.push(id)});
  h.openDialog();assert.equal(session.followDiscovery(discoveries[0].id),false);assert.equal(state.neighbours.found.length,0);
  h.closeDialog();assert.equal(session.followDiscovery(discoveries[0].id),true);assert.ok(state.neighbours.found.includes(discoveries[0].id));assert.deepEqual(visits,['discoveries']);assert.equal(h.frames.size,0);
  session.dispose();assert.equal(session.followDiscovery(discoveries[1].id),false);assert.equal(state.neighbours.found.length,1);
}));

test('routine changes walk villagers along safe paths and clicking a moving villager holds them for a visit', () => villageHarness(h => {
  const visits = [], previousPlaces = scheduledPlaces(destinations, 'morning');
  const session = mountVillage({ state: { villageTime: 'afternoon' }, previousPlaces, onVisit: id => visits.push(id) });
  assert.ok(h.frames.size > 0);
  h.step(); h.step();
  const stopped = session.places().find(place => place.id === 'rowan');
  h.clickPlace('rowan');
  let ticks = 0;
  while (h.frames.size && ticks++ < 500) {
    h.step();
    for (const place of session.places()) assert.ok(isWalkable(place), place.id);
    const rowan = session.places().find(place => place.id === 'rowan');
    assert.equal(rowan.x, stopped.x); assert.equal(rowan.y, stopped.y);
  }
  assert.ok(ticks < 500); assert.deepEqual(visits, ['rowan']);
  for (const id of ['mira', 'elio']) {
    const final = session.places().find(place => place.id === id), target = scheduledPlaces(destinations, 'afternoon').find(place => place.id === id);
    assert.equal(final.x, target.x); assert.equal(final.y, target.y);
  }
  session.dispose(); assert.equal(h.frames.size, 0); assert.equal(h.listenerCount(), 0);
}));

test('routine travel finishes immediately for reduced motion and all transient frames stop on disposal', () => villageHarness(h => {
  const previousPlaces = scheduledPlaces(destinations, 'morning');
  const reduced = mountVillage({ state: { villageTime: 'evening' }, previousPlaces, reducedMotion: true });
  assert.equal(h.frames.size, 0);
  assert.deepEqual(reduced.places(), scheduledPlaces(destinations, 'evening'));
  reduced.dispose();
  const moving = mountVillage({ state: { villageTime: 'afternoon' }, previousPlaces });
  assert.ok(h.frames.size > 0); h.step(); h.step();
  h.media.matches = true; h.media.emit('change');
  assert.equal(h.frames.size, 0); assert.deepEqual(moving.places(), scheduledPlaces(destinations, 'afternoon'));
  moving.dispose(); assert.equal(h.listenerCount(), 0);
}));

test('a fresh village wanders throughout every period, pauses between walks, and stays on safe ground', () => villageHarness(h => {
  for (const period of ['morning', 'afternoon', 'evening']) {
    const session = mountVillage({ state: { villageTime: period } });
    const start = session.places();
    assert.equal(h.frames.size, 0);
    assert.equal(h.timers.size, 3);
    for (let lap = 0; lap < 5; lap++) {
      h.fireTimers();
      assert.ok(h.frames.size > 0, `${period}: ambient movement starts without a clock change`);
      let count = 0;
      while (h.frames.size && count++ < 500) {
        h.step();
        for (const place of session.places()) assert.ok(isWalkable(place), `${period}: ${place.id}`);
      }
      assert.ok(count < 500);
      assert.equal(h.timers.size, 3);
      if (lap === 0) for (const id of ['rowan', 'mira', 'elio']) {
        const before = start.find(place => place.id === id), after = session.places().find(place => place.id === id);
        assert.ok(Math.hypot(before.x - after.x, before.y - after.y) > 1, id);
      }
    }
    session.dispose(); assert.equal(h.timers.size, 0); assert.equal(h.frames.size, 0); assert.equal(h.listenerCount(), 0);
  }
}));

test('ambient villagers wait for conversations, proximity and focus, then resume without a reload', () => villageHarness(h => {
  const session = mountVillage({ state: { villageTime: 'evening', villagePosition: { x: 270, y: 340 } } });
  const rowan = session.places().find(place => place.id === 'rowan');
  h.fireTimers(); h.step(); h.step();
  assert.deepEqual(session.places().find(place => place.id === 'rowan'), rowan);
  h.openDialog(); h.step();
  const paused = session.places();
  h.fireTimers(); assert.equal(h.frames.size, 0); assert.deepEqual(session.places(), paused);
  h.closeDialog(); h.fireTimers(); assert.ok(h.frames.size > 0);
  h.win.emit('blur'); assert.equal(h.frames.size, 0); assert.equal(h.timers.size, 0);
  h.win.emit('focus'); assert.equal(h.timers.size, 3);
  h.fireTimers(); assert.ok(h.frames.size > 0);
  h.media.matches = true; h.media.emit('change');
  assert.equal(h.frames.size, 0); assert.equal(h.timers.size, 0);
  h.media.matches = false; h.media.emit('change'); assert.equal(h.timers.size, 3);
  session.dispose(); assert.equal(h.timers.size, 0);
}));

test('clicking an ambient walker holds the same destination until arrival, including timer retries', () => villageHarness(h => {
  const visits = [], session = mountVillage({ state: { villageTime: 'evening' }, onVisit: id => visits.push(id) });
  h.fireTimers(); h.step(); h.step();
  const stopped = session.places().find(place => place.id === 'rowan');
  h.clickPlace('rowan');
  for (let i = 0; i < 180 && !visits.length; i++) {
    if (i % 20 === 0) h.fireTimers();
    h.step();
    const rowan = session.places().find(place => place.id === 'rowan');
    assert.equal(rowan.x, stopped.x); assert.equal(rowan.y, stopped.y);
  }
  assert.deepEqual(visits, ['rowan']);
  session.dispose();
}));

test('the village camera fits the entire scene at phone, tablet, desktop, and short window sizes', () => {
  for (const [width, height] of [[300, 250], [720, 380], [1300, 580], [600, 120]]) {
    const scale = fitVillageViewport(width, height);
    assert.ok(scale > 0);
    assert.ok(1000 * scale <= width + 1e-8);
    assert.ok(650 * scale <= height + 1e-8);
    assert.ok(Math.abs(1000 * scale - width) < 1e-8 || Math.abs(650 * scale - height) < 1e-8);
  }
});
