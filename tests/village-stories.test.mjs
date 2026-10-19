import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import * as content from '../dist/content.js';
import * as stateApi from '../dist/state.js';
import { projects, villagers, projectUnlocked } from '../dist/projects.js';
import { renderVillager, renderProjectDemo, demoSource, projectRequirement } from '../dist/village-stories.js';
import { characterPortrait } from '../dist/characters.js';

const byId = id => projects.find(project => project.id === `project-${id}`);
const defaults = project => Object.fromEntries(project.demo.fields.map(field => [field.name, String(field.value)]));
const escape = text => String(text).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

test('conversations explain locks and reveal each villager story as projects are completed', () => {
  const state = stateApi.freshState();
  for (const villager of villagers) {
    const first = projects.find(project => project.npc === villager.id);
    const html = renderVillager(state, villager.id);
    assert.ok(html.includes(escape(villager.friendLines[0])));
    assert.ok(html.includes(escape(first.storyBefore)));
    if (first.requires) {
      assert.ok(html.includes(projectRequirement(state, first)));
      assert.ok(!html.includes(`data-action="project" data-id="${first.id}"`));
    } else assert.ok(html.includes(`data-action="project" data-id="${first.id}"`));
  }
  assert.equal(renderVillager(state, 'unknown'), '');
  for (const quest of content.quests.slice(0, 20)) stateApi.completeQuest(state, quest.id);
  const second = byId('pantry-ledger');
  assert.match(projectRequirement(state, second), /A little help at the till/);
  for (const villager of villagers) {
    const own = projects.filter(project => project.npc === villager.id);
    stateApi.completeProject(state, own[0].id, own[0].solution);
    let html = renderVillager(state, villager.id);
    assert.ok(html.includes(escape(villager.friendLines[1])));
    assert.ok(html.includes('Growing friendship'));
    assert.ok(html.includes(`data-action="project-demo" data-id="${own[0].id}"`));
    assert.ok(html.includes(`data-action="project-download" data-id="${own[0].id}"`));
    assert.equal(projectRequirement(state, own[1]), '');
    stateApi.completeProject(state, own[1].id, own[1].solution);
    html = renderVillager(state, villager.id);
    assert.ok(html.includes(escape(villager.friendLines[2])));
    assert.ok(html.includes('Trusted friend'));
    assert.ok(html.includes('2/2 projects'));
    for (const project of own) {
      assert.ok(html.includes(escape(project.storyAfter)));
      assert.ok(!html.includes(escape(project.storyBefore)));
    }
  }
});

test('demo forms expose each real input and do not offer missing saved creations', () => {
  for (const project of projects) {
    const html = renderProjectDemo(project);
    assert.ok(html.includes('id="project-demo-form"'));
    assert.ok(html.includes('aria-live="polite"'));
    if (project.id === 'project-guessing-game') {
      assert.ok(html.includes('name="guess"'));
      assert.ok(!html.includes('name="secret"'));
      assert.ok(html.includes('Start a new round'));
      continue;
    }
    for (const field of project.demo.fields) {
      assert.ok(html.includes(`name="${field.name}"`));
      assert.ok(html.includes(`value="${escape(field.value)}"`));
    }
  }
  const oldSave = stateApi.freshState();
  oldSave.projects.push(byId('tavern-bill').id);
  const html = renderVillager(oldSave, 'rowan');
  assert.ok(html.includes('Revisit code'));
  assert.ok(!html.includes('data-action="project-demo"'));
  assert.ok(!html.includes('data-action="project-download"'));
});

test('demo controls reject absent, nonfinite, out-of-range and fractional integer values', () => {
  const project = byId('tavern-bill');
  assert.throws(() => demoSource(project, '', defaults(project)), /Complete this project/);
  assert.throws(() => demoSource(null, 'pass', {}), /Complete this project/);
  for (const value of ['', ' ', undefined, 'NaN', 'Infinity', '-1', '101', '1.5']) {
    assert.throws(() => demoSource(project, project.solution, { ...defaults(project), quantity: value }), /Enter|Choose a valid value/);
  }
  assert.throws(() => demoSource(project, project.solution, { ...defaults(project), discount: 101 }), /valid value/);
  assert.throws(() => demoSource(project, project.solution, { ...defaults(project), price: -0.01 }), /valid value/);
});

function runDemoCases(cases) {
  const python = spawnSync('python', ['-c', `import sys, json, importlib.util
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('runtime', 'dist/runtime.py')
runtime = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runtime)
cases = json.load(sys.stdin)
print(json.dumps([json.loads(runtime.run_source(case)) for case in cases]))
`], { input: JSON.stringify(cases), encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' }, timeout: 20000 });
  assert.equal(python.status, 0, python.stderr + python.stdout);
  return JSON.parse(python.stdout);
}

test('all saved creations execute real Python with changed inputs and held-out values stay out of training', () => {
  const cases = [
    ['tavern-bill', {}, '21.6'], ['tavern-bill', { quantity: 0 }, '0.0'], ['tavern-bill', { discount: 100 }, '0.0'],
    ['pantry-ledger', {}, "{'tea': 3, 'honey': 5}"], ['pantry-ledger', { stock: '{}' }, '{}'],
    ['guessing-game', {}, 'Too low'], ['guessing-game', { guess: 9 }, 'Too high'], ['guessing-game', { guess: 7 }, 'You found it!'],
    ['festival-scores', {}, "{'Pip': 8, 'Mira': 0}"], ['festival-scores', { rounds: '[["Pip",0],["Pip",-3],["Mira",2]]' }, "{'Pip': -3, 'Mira': 2}"],
    ['plant-adviser', { moisture: 20, light: 1 }, 'Water'], ['plant-adviser', { moisture: 30, light: 3 }, 'Move into light'], ['plant-adviser', { moisture: 30, light: 4 }, 'Let it grow'],
    ['lantern-predictor', {}, "{'learned weight': 2.0, 'prediction': 8.0, 'held-out absolute error': 0.5}"],
    ['lantern-predictor', { actual: 12 }, "{'learned weight': 2.0, 'prediction': 8.0, 'held-out absolute error': 4.0}"],
    ['lantern-predictor', { samples: '[[1,3],[2,6],[4,12]]', actual: 12 }, "{'learned weight': 3.0, 'prediction': 12.0, 'held-out absolute error': 0.0}"]
  ];
  const results = runDemoCases(cases.map(([id, values]) => { const project = byId(id); return demoSource(project, project.solution, { ...defaults(project), ...values }); }));
  for (const [index, result] of results.entries()) {
    assert.equal(result.passed, true, `${cases[index][0]}: ${result.error}`);
    assert.equal(result.output.trim().split('\n').at(-1), cases[index][2], cases[index][0]);
  }
});

test('quotes, backslashes and Python-looking text stay inert when demo values enter Python', () => {
  const probe = { demo: { fields: [{ name: 'message', label: 'Message', type: 'text' }], expression: 'message' } };
  const values = ['"); print("INJECTION_EXECUTED"); #', "'); __import__('os'); #", 'line one\nline two\\path\tend', 'Warm tea: “hello” ☕', '\\u0000 literal escape'];
  const result = runDemoCases(values.map(message => demoSource(probe, 'pass', { message })));
  for (const [index, item] of result.entries()) {
    assert.equal(item.passed, true, item.error);
    assert.equal(item.output, `\nYour result:\n${values[index]}\n`);
  }
});

// The adapter exercises the actual app functions and queued native-dialog close
// ordering. It deliberately makes no assertions about browser layout or pixels.
function appHarness() {
  const closeEvents = [], nodes = new Map(), stored = new Map(), pendingRuns = [], mounted = [];
  const decode = value => value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  class Element extends EventTarget {
    constructor(id = '') { super(); this.id = id; this.open = false; this.isConnected = true; this.children = []; this.nodes = new Map(); this.html = ''; this.textContent = ''; this.value = ''; this.disabled = false; this.hidden = false; this.style = {}; this.classes = new Set(); this.classList = { add: (...items) => items.forEach(item => this.classes.add(item)), remove: (...items) => items.forEach(item => this.classes.delete(item)), toggle: (item, value) => value ? this.classes.add(item) : this.classes.delete(item) }; }
    set innerHTML(html) {
      for (const node of this.nodes.values()) node.isConnected = false;
      this.html = html; this.nodes = new Map();
      for (const match of html.matchAll(/<(\w+)\b[^>]*\bid="([^"]+)"[^>]*>/g)) {
        const node = new Element(match[2]);
        if (match[1] === 'textarea') node.value = decode(html.slice(match.index + match[0].length).split('</textarea>')[0]);
        this.nodes.set(node.id, node);
      }
    }
    get innerHTML() { return this.html; }
    querySelector(selector) { if (selector.startsWith('#')) return this.nodes.get(selector.slice(1)) || null; return new Element(); }
    querySelectorAll() { return []; }
    showModal() { this.open = true; }
    close() { if (this.open) { this.open = false; closeEvents.push(() => this.dispatchEvent(new Event('close'))); } }
    focus() {}
    append(child) { this.children.push(child); child.parent = this; }
    remove() { this.isConnected = false; }
    setAttribute() {}
    scrollIntoView() {}
  }
  for (const id of ['app', 'quest-dialog', 'village-dialog', 'settings-dialog', 'toasts']) nodes.set(id, new Element(id));
  const document = new EventTarget();
  document.documentElement = new Element(); document.body = new Element();
  document.querySelector = selector => {
    if (!selector.startsWith('#')) return new Element();
    return nodes.get(selector.slice(1)) || [...nodes.values()].map(node => node.querySelector(selector)).find(Boolean) || null;
  };
  document.createElement = () => new Element();
  let currentRun = null, cancelled = 0;
  const cancelRun = () => { if (currentRun) { cancelled++; currentRun.resolve({ cancelled: true, passed: false, error: 'Stopped' }); currentRun = null; } };
  const runPython = (code, checks, onPhase) => {
    cancelRun(); onPhase('running');
    return new Promise(resolve => { currentRun = { code, checks, resolve }; pendingRuns.push(currentRun); });
  };
  const scope = {
    ...content, ...stateApi, projects, villagers, projectUnlocked, renderVillager, renderProjectDemo, demoSource, characterPortrait,
    document, window: Object.assign(new EventTarget(), { scrollTo() {} }), location: { hash: '' }, history: { pushState() {} },
    localStorage: { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value) },
    setTimeout: () => 1, clearTimeout() {}, matchMedia: () => ({ matches: false }),
    icon: () => '<svg></svg>', sprite: () => '<svg></svg>', bunting: () => '', teaCup: () => '', garden: () => '', rewardChest: () => '',
    showCelebration: (value, options) => ({ parent: options.parent, dispose() {} }),
    renderVillage: () => '<div class="village-viewport">The village</div>', mountVillage: options => { mounted.push(options); return { pause() {}, dispose() {} }; },
    renderWorld: () => 'The quest trail', mountWorld: () => ({ dispose() {} }), travelForCompletion: () => null,
    runPython, cancelRun, FormData: class { constructor(form) { this.entries = Object.entries(form.values || {}); } [Symbol.iterator]() { return this.entries[Symbol.iterator](); } }
  };
  const context = vm.createContext(scope);
  const source = readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '');
  vm.runInContext(source, context);
  return {
    call: (name, ...args) => context[name](...args),
    evaluate: expression => vm.runInContext(expression, context),
    state: () => vm.runInContext('state', context), node: id => document.querySelector(`#${id}`), mounted,
    flushClose: () => { while (closeEvents.length) closeEvents.shift()(); },
    finish: result => { assert.ok(currentRun, 'there is an active Python run'); const run = currentRun; currentRun = null; run.resolve(result); },
    cancelled: () => cancelled,
    pendingRuns, stored
  };
}

test('village UI flow meets Rowan, completes and tries a saved creation, and keeps campaign progress intact', async () => {
  const app = appHarness(), project = byId('tavern-bill');
  assert.equal(app.mounted.length, 1);
  assert.equal((app.node('app').innerHTML.match(/class="nav-link/g) || []).length, 6);
  app.call('openVillager', 'rowan');
  assert.equal(app.node('village-dialog').open, true);
  assert.ok(app.state().metVillagers.includes('rowan'));
  app.call('openProject', project.id); app.flushClose();
  assert.equal(app.node('quest-dialog').open, true);
  app.node('quest-code').value = project.solution;
  const execution = app.call('executeQuest');
  app.finish({ passed: true, output: '21.6\n' }); await execution;
  assert.deepEqual([...app.state().projects], [project.id]);
  assert.deepEqual([...app.state().completed], []);
  assert.equal(app.state().projectCode[project.id], project.solution);
  assert.ok(app.node('quest-dialog').innerHTML.includes('VILLAGE PROJECT COMPLETE'));
  const earned = { xp: app.state().xp, coins: app.state().coins };
  app.call('openProjectDemo', project.id);
  const form = app.node('project-demo-form'); form.values = { ...defaults(project), quantity: 2 };
  const demo = app.call('executeProjectDemo', { target: form, preventDefault() {} });
  app.flushClose();
  assert.equal(app.cancelled(), 0, 'the old quest close event must not cancel the new demo');
  app.finish({ passed: true, output: '14.4\n' }); await demo;
  assert.equal(app.node('project-demo-output').textContent, '14.4\n');
  assert.deepEqual({ xp: app.state().xp, coins: app.state().coins }, earned);
  app.call('closeVillage'); app.call('openProjectDemo', project.id); app.flushClose();
  assert.equal(app.evaluate('activeDemo.id'), project.id, 'a queued close must not reset a reopened demo');
  app.call('openProject', project.id); app.flushClose();
  app.node('quest-code').value = `${project.solution}\n# polished`;
  const replay = app.call('executeQuest'); app.finish({ passed: true, output: '21.6\n' }); await replay;
  assert.deepEqual({ xp: app.state().xp, coins: app.state().coins }, earned);
  assert.ok(app.state().projectCode[project.id].endsWith('# polished'));
  assert.ok(app.node('quest-dialog').innerHTML.includes('Rewards already earned'));
  assert.ok(app.stored.has(stateApi.SAVE_KEY));
});

test('closing a running creation discards its late result without changing a newer conversation', async () => {
  const app = appHarness(), project = byId('tavern-bill');
  stateApi.completeProject(app.state(), project.id, project.solution);
  app.call('openProjectDemo', project.id);
  const form = app.node('project-demo-form'); form.values = defaults(project);
  const run = app.call('executeProjectDemo', { target: form, preventDefault() {} });
  app.call('openVillager', 'mira');
  await run; app.flushClose();
  assert.equal(app.cancelled(), 1);
  assert.ok(app.node('village-dialog').innerHTML.includes('Mira'));
  assert.ok(!app.node('village-dialog').innerHTML.includes('project-demo-output'));
  assert.equal(app.state().projectCode[project.id], project.solution);
});

test('the festival game hides its secret, uses the saved Python for clues, and starts fresh rounds', async () => {
  const app = appHarness(), project = byId('guessing-game');
  for (const quest of content.quests.slice(0, 4)) stateApi.completeQuest(app.state(), quest.id);
  stateApi.completeProject(app.state(), project.id, project.solution);
  const earned = { xp: app.state().xp, coins: app.state().coins };
  app.call('openProjectDemo', project.id);
  assert.ok(!app.node('village-dialog').innerHTML.includes('name="secret"'));
  app.evaluate('activeGame.secret = 42');
  const form = app.node('project-demo-form');
  form.elements = { guess: { select() {} } };
  for (const [guess, clue] of [[20, 'Too low'], [60, 'Too high'], [42, 'You found it!']]) {
    form.values = { guess: String(guess) };
    const run = app.call('executeProjectDemo', { target: form, preventDefault() {} });
    const source = app.pendingRuns.at(-1).code;
    assert.ok(source.startsWith(project.solution));
    const [result] = runDemoCases([source]);
    assert.equal(result.passed, true, result.error);
    app.finish(result); await run;
    assert.ok(app.node('project-demo-output').textContent.endsWith(`${guess} — ${clue}`));
  }
  assert.equal(app.node('project-demo-run').disabled, true);
  assert.match(app.node('project-demo-status').textContent, /found it in 3 guesses/);
  assert.deepEqual({ xp: app.state().xp, coins: app.state().coins }, earned);
  app.call('openProjectDemo', project.id);
  assert.equal(app.evaluate('activeGame.attempts.length'), 0);
  assert.equal(app.evaluate('activeGame.won'), false);
  assert.ok(app.evaluate('activeGame.secret >= 1 && activeGame.secret <= 100'));
  assert.equal(app.node('project-demo-run').disabled, false);
});
