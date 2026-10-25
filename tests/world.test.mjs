import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { quests, pets } from '../dist/content.js';
import { freshState, completeQuest, completeDaily, normalizeState } from '../dist/state.js';
import { stops, regions, WORLD_WIDTH, WORLD_HEIGHT, pointOnLeg, legPath, positionForProgress, travelForCompletion, regionForStop } from '../dist/world-model.js';
import { renderWorld, mountWorld } from '../dist/world.js';

test('the overworld has a stop for every quest and a distinct beacon destination', () => {
  assert.equal(stops.length, quests.length + 1); assert.equal(regions.length, 27);
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
test('the map exposes 108 named controls, locked previews, and all twenty-seven regions', () => {
  const html = renderWorld(freshState(), pets[0], null, null);
  assert.equal((html.match(/data-world="select"/g) || []).length, quests.length);
  assert.equal((html.match(/class="world-node current /g) || []).length, 1);
  assert.equal((html.match(/class="world-node undiscovered /g) || []).length, quests.length - 1);
  for (const r of regions) assert.ok(html.includes(r.name));
  assert.ok(html.includes('data-world="follow"')); assert.ok(html.includes('data-world="fit"'));
  const locked = renderWorld(freshState(), pets[0], 8, null); assert.match(locked, /Path not yet open/);
});
test('a finished adventure shows the beacon and never indexes a nonexistent quest', () => {
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
  assert.ok(html.includes(`${Math.round(24/quests.length*100)}% explored`)); assert.ok(html.includes('assets/guildlands.png')); assert.ok(!html.includes('guild-finish reached'));
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
    setPointerCapture() { this.captured = true; }
    hasPointerCapture() { return !!this.captured; }
    releasePointerCapture() { this.captured = false; }
    getBoundingClientRect() { return { left: 120, top: 80, width: this.clientWidth, height: this.clientHeight }; }
    closest() { return null; }
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
  try { run({ actor, viewport, canvas, document, get, frames, disconnected: () => disconnected }); }
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
test('advanced chapter transitions and the final beacon walk reach their actual destinations', () => {
  for (const index of [23, 27, 51, 59, 63, 67, 71, 75, 79, 83, 87, 91, 95, 99, 103, 107]) mapHarness(({ actor, frames, get }) => {
    const state = freshState(); for (const q of quests.slice(0, index)) completeQuest(state, q.id);
    const result = completeQuest(state, quests[index].id), saved = JSON.stringify(state);
    const session = mountWorld({ state, travel: travelForCompletion(quests[index].id, result), selectedIndex: Math.min(index + 1, quests.length - 1), reducedMotion: false, onSelect() {} });
    const callback = [...frames.values()][0]; frames.clear(); callback(performance.now() + 4000);
    assert.equal(actor.style.left, `${stops[index + 1].x}px`); assert.equal(actor.style.top, `${stops[index + 1].y}px`);
    assert.equal(get('.arrival-quest').hidden, false); assert.equal(frames.size, 0);
    assert.match(get('#travel-message').textContent, index === 107 ? /All 108 quests are complete/ : /New region discovered/);
    assert.equal(JSON.stringify(state), saved); session.dispose();
  });
});

test('the academy arrival becomes quest 61 and the illustrated pass covers the new join', () => {
  assert.deepEqual(stops[59], { x: 4550, y: 200 });
  assert.deepEqual(stops[60], { x: 4640, y: 160 });
  const s = freshState(); for (const q of quests.slice(0, 59)) completeQuest(s, q.id);
  const result = completeQuest(s, 'masters-pipeline');
  assert.deepEqual(travelForCompletion('masters-pipeline', result), { from:59, to:60, newRegion:true, final:false });
  const html = renderWorld(s, pets[0], null, null);
  assert.ok(html.includes('The mill that never stops') && !html.includes('guild-finish reached'));
  assert.ok(html.includes('assets/frontierlands.png') && html.includes('assets/academy-pass.png'));
  const css = readFileSync(new URL('../dist/world-frontier.css', import.meta.url), 'utf8');
  assert.match(css, /world-art-frontier\{left:4800px;width:3200px/);
  assert.match(css, /world-art-academy-pass\{left:4480px;width:640px/);
  assert.match(css, /mask-image:linear-gradient/);
  // Adjacent Bezier legs share their first derivative: no walking kink at the join.
  const epsilon = .00001;
  for (const i of [59,60,61,62,63]) {
    const a=pointOnLeg(i,1-epsilon), b=stops[i+1], c=pointOnLeg(i+1,epsilon);
    assert.ok(Math.abs((b.x-a.x)-(c.x-b.x))<1e-6);
    assert.ok(Math.abs((b.y-a.y)-(c.y-b.y))<1e-6);
  }
});

test('map tools belong to the stationary stage, outside the panned and focus-scrolled viewport', () => {
  const html=renderWorld(freshState(),pets[0],null,null), stack=[];
  let toolsParent, viewportParent;
  for(const match of html.matchAll(/<\/?div\b[^>]*>/g)) {
    const tag=match[0];
    if(tag.startsWith('</')) { stack.pop(); continue; }
    const classes=tag.match(/class="([^"]*)"/)?.[1] || '';
    if(classes==='world-controls') toolsParent=[...stack];
    if(classes==='world-viewport') viewportParent=[...stack];
    stack.push(classes);
  }
  assert.equal(toolsParent.at(-1),'world-map-stage');
  assert.equal(viewportParent.at(-1),'world-map-stage');
  assert.ok(!toolsParent.includes('world-viewport') && !toolsParent.includes('world-canvas'));
  const css=readFileSync(new URL('../dist/world-frontier.css',import.meta.url),'utf8');
  assert.match(css,/world-map-stage>\.world-controls\{position:absolute;left:max\(12px/);
  assert.match(css,/bottom:max\(12px,env\(safe-area-inset-bottom\)\)/);
});

test('zoom controls still respond immediately after dragging at either end of the expanded map', () => {
  for(const completed of [0,60,83,84,100,107,108]) mapHarness(({viewport,canvas,document,get})=>{
    const state=freshState(); state.completed=quests.slice(0,completed).map(q=>q.id);
    const session=mountWorld({state,reducedMotion:true,onSelect(){}});
    function dispatch(target,type,properties={}) {
      const event=new Event(type,{cancelable:true});
      for(const [key,value] of Object.entries(properties)) Object.defineProperty(event,key,{value});
      target.dispatchEvent(event);
    }
    dispatch(viewport,'pointerdown',{button:0,pointerId:1,clientX:500,clientY:200});
    dispatch(viewport,'pointermove',{pointerId:1,clientX:200,clientY:210});
    dispatch(viewport,'pointerup',{pointerId:1});
    const click=action=>dispatch(document,'click',{target:{closest:()=>({dataset:{world:action}})}});
    click('zoom-in'); assert.equal(get('#world-zoom').textContent,'103%');
    click('zoom-out'); assert.equal(get('#world-zoom').textContent,'88%');
    click('fit'); assert.equal(get('#world-zoom').textContent,`${Math.round(100*viewport.clientWidth/WORLD_WIDTH)}%`);
    assert.equal(camera(canvas).zoom,viewport.clientWidth/WORLD_WIDTH);
    click('follow'); assert.equal(get('#world-zoom').textContent,'88%');
    viewport.scrollLeft=700;viewport.scrollTop=200;dispatch(viewport,'scroll');
    assert.equal(viewport.scrollLeft,0);assert.equal(viewport.scrollTop,0);
    assert.deepEqual(get('.world-controls').style,{});
    session.dispose();
  },true);
});

function wheel(viewport, deltaY, properties = {}) {
  const event = new Event('wheel', { cancelable: true });
  for (const [key, value] of Object.entries({ deltaY, deltaMode: 0, clientX: 720, clientY: 380, ...properties })) Object.defineProperty(event, key, { value });
  viewport.dispatchEvent(event);
  return event;
}

function camera(canvas) {
  const [, x, y, zoom] = canvas.style.transform.match(/translate\(([-\d.e]+)px, ([-\d.e]+)px\) scale\(([-\d.e]+)\)/);
  return { x: Number(x), y: Number(y), zoom: Number(zoom) };
}

test('wheel zoom keeps the map point under the cursor steady and does not change progress', () => mapHarness(({ viewport, canvas }) => {
  const state = freshState(); state.completed = quests.slice(0, 40).map(q => q.id);
  const saved = JSON.stringify(state);
  const session = mountWorld({ state, reducedMotion: true, onSelect() { assert.fail('Zoom must not select a quest'); } });
  const before = camera(canvas), point = { x: (600 - before.x) / before.zoom, y: (300 - before.y) / before.zoom };
  assert.equal(wheel(viewport, -100).defaultPrevented, true);
  const after = camera(canvas);
  assert.ok(after.zoom > before.zoom);
  assert.ok(Math.abs(point.x * after.zoom + after.x - 600) < 1e-8);
  assert.ok(Math.abs(point.y * after.zoom + after.y - 300) < 1e-8);
  wheel(viewport, 100);
  assert.ok(Math.abs(camera(canvas).zoom - before.zoom) < 1e-8);
  assert.equal(JSON.stringify(state), saved);
  session.dispose();
}));

test('wheel units, zoom limits, browser shortcuts and cleanup behave consistently', () => {
  const scales = [];
  for (const [deltaY, deltaMode] of [[96, 0], [6, 1], [.16, 2]]) mapHarness(({ viewport, canvas }) => {
    const session = mountWorld({ state: freshState(), reducedMotion: true, onSelect() {} });
    const original = canvas.style.transform;
    for (const properties of [{ ctrlKey: true }, { metaKey: true }]) {
      assert.equal(wheel(viewport, -100, properties).defaultPrevented, false);
      assert.equal(canvas.style.transform, original);
    }
    assert.equal(wheel(viewport, 0, { deltaX: 100 }).defaultPrevented, false);
    wheel(viewport, deltaY, { deltaMode }); scales.push(camera(canvas).zoom);
    for (let i = 0; i < 30; i++) wheel(viewport, -1000);
    assert.equal(camera(canvas).zoom, 1.5);
    for (let i = 0; i < 40; i++) wheel(viewport, 1000);
    assert.equal(camera(canvas).zoom, viewport.clientWidth/WORLD_WIDTH);
    session.dispose(); const disposed = canvas.style.transform;
    assert.equal(wheel(viewport, -100).defaultPrevented, false);
    assert.equal(canvas.style.transform, disposed);
  });
  assert.ok(scales.every(scale => Math.abs(scale - scales[0]) < 1e-10));
});

test('wheel input during a drag does not fight the pointer camera', () => mapHarness(({ viewport, canvas }) => {
  const session = mountWorld({ state: freshState(), reducedMotion: true, onSelect() {} });
  const event = new Event('pointerdown');
  for (const [key, value] of Object.entries({ button: 0, pointerId: 1, clientX: 500, clientY: 200 })) Object.defineProperty(event, key, { value });
  viewport.dispatchEvent(event);
  const before = canvas.style.transform;
  assert.equal(wheel(viewport, -100).defaultPrevented, true);
  assert.equal(canvas.style.transform, before);
  session.dispose();
}));
