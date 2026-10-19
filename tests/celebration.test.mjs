import test from 'node:test';
import assert from 'node:assert/strict';
import { celebrationMarkup, showCelebration } from '../dist/celebration.js';

test('celebrations present real rewards and escape names without changing the result', () => {
  const result = Object.freeze({ xp: 80, coins: 35, name: '<b>Pip</b>', level: 2, achievements: Object.freeze([{ name: '<script>oops</script>' }]) });
  const html = celebrationMarkup(result);
  assert.ok(html.includes('Hello, level 2!')); assert.ok(html.includes('+80 XP')); assert.ok(html.includes('+35 coins'));
  assert.ok(html.includes('&lt;b&gt;Pip&lt;/b&gt;')); assert.ok(!html.includes('<script>'));
  const adoption = celebrationMarkup({ adoption: true, name: 'Fern' });
  assert.ok(adoption.includes('Fern found a home!')); assert.ok(!adoption.includes('+0'));
  assert.ok(celebrationMarkup({ daily: true }).includes('A little spark, well earned.'));
});

function harness(run, prefersReduced = false) {
  class Element extends EventTarget {
    constructor() { super(); this.children = []; this.attributes = {}; this.classes = new Set(); this.classList = { toggle: (key, value) => value ? this.classes.add(key) : this.classes.delete(key) }; }
    setAttribute(k, v) { this.attributes[k] = v; }
    append(child) { child.parent = this; this.children.push(child); }
    remove() { this.parent.children = this.parent.children.filter(child => child !== this); }
    querySelector() { return this.close ??= new Element(); }
  }
  const parent = new Element(), media = new Element(), timers = new Map(); media.matches = prefersReduced;
  let timerId = 0, listeners = 0;
  const add = media.addEventListener.bind(media), remove = media.removeEventListener.bind(media);
  media.addEventListener = (...args) => { listeners++; add(...args); };
  media.removeEventListener = (...args) => { listeners--; remove(...args); };
  const overrides = { document: { body: parent, createElement: () => new Element() }, matchMedia: () => media, setTimeout: (fn, duration) => { timers.set(++timerId, { fn, duration }); return timerId; }, clearTimeout: id => timers.delete(id) };
  const previous = new Map(Object.keys(overrides).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.assign(globalThis, overrides);
  try { run({ parent, media, timers, listeners: () => listeners }); }
  finally { for (const [key, descriptor] of previous) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } }
}

test('dismissal removes the celebration, timer and media listener, and is idempotent', () => harness(({ parent, timers, listeners }) => {
  const session = showCelebration({ xp: 90, coins: 40 });
  assert.equal(parent.children.length, 1); assert.equal(timers.size, 1); assert.equal(listeners(), 1);
  assert.equal(parent.children[0].attributes.role, 'status');
  parent.children[0].close.dispatchEvent(new Event('click'));
  session.dispose();
  assert.equal(parent.children.length, 0); assert.equal(timers.size, 0); assert.equal(listeners(), 0);
}));

test('automatic dismissal and page cleanup release everything without touching rewards', () => harness(({ parent, timers, listeners }) => {
  const reward = Object.freeze({ xp: 600, coins: 250 });
  const session = showCelebration(reward);
  [...timers.values()][0].fn();
  session.dispose();
  assert.equal(parent.children.length, 0); assert.equal(timers.size, 0); assert.equal(listeners(), 0);
  assert.deepEqual(reward, { xp: 600, coins: 250 });
}));

test('reduced motion is respected on entry and when the system preference changes', () => harness(({ parent, media }) => {
  let session = showCelebration({ xp: 80 });
  assert.ok(parent.children[0].classes.has('still'));
  media.matches = false; media.dispatchEvent(new Event('change'));
  assert.ok(!parent.children[0].classes.has('still')); session.dispose();
  session = showCelebration({}, { parent, reducedMotion: true });
  media.dispatchEvent(new Event('change'));
  assert.ok(parent.children[0].classes.has('still')); session.dispose();
}, true));
