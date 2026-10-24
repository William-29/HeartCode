import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, normalizeState, adoptPet } from '../dist/state.js';
import { pets, quests } from '../dist/content.js';
import { roomGeometry, roomPosition, normalizeLayout, normalizeAmbience, careForPet, petFriend, choosePetBed } from '../dist/cozy-model.js';
import { normalizeHome, furnishRoom, removeFurnishing } from '../dist/village-life-model.js';
import { ambientLevels, createAmbience } from '../dist/ambience.js';
import { weatherArt, renderPetCorner, mountPetPlay } from '../dist/cozy-ui.js';
import { renderRoom } from '../dist/village-life.js';
import { mountRoomEditor } from '../dist/room-editor.js';

test('old saves retain their game and room while gaining safe weather, sound and friendship defaults', () => {
  const old = freshState(); old.coins = 143; old.xp = 400; old.drafts.practice = 'print("tea")';
  old.home.placed.rug = null;
  delete old.ambience; delete old.petCare; delete old.home.layout; delete old.home.wallpaper;
  const result = normalizeState(old);
  assert.equal(result.coins, 143); assert.equal(result.xp, 400); assert.equal(result.drafts.practice, old.drafts.practice);
  assert.deepEqual(result.home.placed, old.home.placed); assert.deepEqual(result.home.owned, old.home.owned);
  assert.deepEqual(result.ambience, normalizeAmbience());
  assert.deepEqual(result.home.layout, normalizeLayout()); assert.equal(result.home.wallpaper, 'honey');
  assert.equal(result.petCare.pip.points, 0);
  const bad = normalizeState({ ...old, ambience: { weather: '<script>', rain: 'yes', volume: Infinity }, petCare: { pip: { points: -5, bed: 'nest', tricks: ['twirl'] }, foreign: { points: 999 } }, home: { ...old.home, wallpaper: '__proto__', layout: { chair: { x: Infinity, y: -900, rotation: NaN } } } });
  assert.equal(bad.ambience.rain, false); assert.equal(bad.home.wallpaper, 'honey');
  assert.equal(bad.home.layout.chair.x, 23); assert.equal(bad.home.layout.chair.y, 0);
  assert.equal(bad.petCare.pip.bed, null); assert.deepEqual(bad.petCare.pip.tricks, []); assert.equal(bad.petCare.foreign, undefined);
});

test('every rotated furnishing stays entirely inside the room even at extreme drag coordinates', () => {
  for (const [slot, geometry] of Object.entries(roomGeometry)) for (let angle = -360; angle <= 360; angle += 15) {
    for (const [x,y] of [[-999,-999],[999,999],[50,50]]) {
      const p = roomPosition(slot, { x,y,rotation:angle }), radians = p.rotation * Math.PI / 180;
      const cx = (p.x + geometry.w / 2) * 1.5, cy = p.y + geometry.h / 2;
      const halfW = (Math.abs(geometry.w * 1.5 * Math.cos(radians)) + Math.abs(geometry.h * Math.sin(radians))) / 2;
      const halfH = (Math.abs(geometry.h * Math.cos(radians)) + Math.abs(geometry.w * 1.5 * Math.sin(radians))) / 2;
      assert.ok(cx - halfW >= -1e-8 && cx + halfW <= 150 + 1e-8, `${slot}, ${angle}, x`);
      assert.ok(cy - halfH >= -1e-8 && cy + halfH <= 100 + 1e-8, `${slot}, ${angle}, y`);
    }
  }
  assert.equal(roomPosition('__proto__', {}), null);
});

test('arrangements and wallpaper survive buying, clearing, swapping and save round trips', () => {
  const state = freshState(); state.coins = 300;
  state.home.layout.chair = roomPosition('chair', { x: 50, y: 40, rotation: 30 }); state.home.wallpaper = 'sage';
  const layout = structuredClone(state.home.layout);
  furnishRoom(state, 'chair-sage'); removeFurnishing(state, 'chair'); furnishRoom(state, 'chair-cinnamon');
  assert.equal(state.coins, 180); assert.deepEqual(state.home.layout, layout);
  assert.deepEqual(normalizeState(JSON.parse(JSON.stringify(state))).home, state.home);
  assert.deepEqual(normalizeHome(state.home).layout, layout);
});

test('pet care earns once per activity per local day, learns tricks through practice and unlocks beds without learning rewards', () => {
  let state = freshState(); const learning = { coins: state.coins, xp: state.xp, completed: [...state.completed] };
  const pet = careForPet(state, 'pip', 'pet', '2026-10-20'); assert.equal(pet.points, 2);
  assert.equal(careForPet(state, 'pip', 'fetch', '2026-10-20').points, 3);
  const train = careForPet(state, 'pip', 'train', '2026-10-20');
  assert.equal(train.points, 4); assert.deepEqual(train.learned, ['hop']); assert.equal(train.unlocked[0].id, 'blanket');
  state = normalizeState(JSON.parse(JSON.stringify(state)));
  for (const action of ['pet','fetch','train']) assert.equal(careForPet(state, 'pip', action, '2026-10-20').points, 0);
  assert.equal(state.petCare.pip.points, 9);
  for (const action of ['pet','fetch','train']) careForPet(state, 'pip', action, '2026-10-21');
  assert.deepEqual(state.petCare.pip.tricks, ['hop','twirl']); assert.equal(state.petCare.pip.bed, 'basket');
  assert.equal(choosePetBed(state, 'pip', 'nest'), false); assert.equal(choosePetBed(state, 'pip', 'blanket'), true);
  assert.equal(choosePetBed(state, 'pip', 'none'), true); assert.equal(normalizeState(state).petCare.pip.bed, null);
  for (const day of ['2026-10-22','2026-10-23']) for (const action of ['pet','fetch','train']) careForPet(state, 'pip', action, day);
  assert.equal(state.petCare.pip.bed, 'nest');
  assert.deepEqual({ coins: state.coins, xp: state.xp, completed: state.completed }, learning);
  const before = structuredClone(state);
  assert.equal(careForPet(state, 'nova', 'pet', '2026-10-23').ok, false);
  assert.equal(careForPet(state, 'pip', '__proto__', '2026-10-23').ok, false);
  assert.deepEqual(state, before);
});

test('pet friendship is separate for adopted companions and rewards can never unlock tricks before training', () => {
  const state = freshState(); state.coins = 9999; state.completed = quests.map(q => q.id);
  adoptPet(state, 'nova');
  careForPet(state, 'pip', 'pet', '2026-10-20'); careForPet(state, 'pip', 'fetch', '2026-10-20');
  careForPet(state, 'pip', 'pet', '2026-10-21');
  assert.deepEqual(petFriend(state, 'pip').tricks, []); assert.equal(petFriend(state, 'nova').points, 0);
  careForPet(state, 'nova', 'train', '2026-10-21');
  assert.equal(petFriend(state, 'nova').points, 4); assert.equal(petFriend(state, 'pip').points, 7);
  assert.deepEqual(normalizeState(state).petCare, state.petCare);
});

test('rain, static weather, room editing and pet rewards render safely and remain optional', () => {
  const state = freshState();
  assert.equal(weatherArt(state), '');
  state.ambience.weather = 'rain'; state.ambience.motion = false;
  assert.ok(weatherArt(state).includes('weather-still')); assert.ok(weatherArt(state).includes('rain-puddles'));
  assert.ok(!weatherArt(state, 'room').includes('rain-puddles'));
  state.petCare.pip.points = 6; state.petCare.pip.bed = 'blanket';
  const html = renderRoom(state, pets[0], 'chair', true);
  assert.equal((html.match(/data-room-object=/g) || []).length, 4);
  assert.ok(html.includes('data-room-edit="rotate-right"')); assert.ok(html.includes('bed-blanket'));
  assert.ok(html.includes('weather-room')); assert.ok(html.includes('id="room-wallpaper"'));
  const corner = renderPetCorner(state, { ...pets[0], name: '<script>pet</script>' });
  assert.ok(!corner.includes('<script>pet')); assert.ok(corner.includes('&lt;script&gt;pet&lt;/script&gt;'));
  assert.ok(corner.includes('data-pet-play="fetch"'));
});

test('each sound responds to its own toggle, weather, volume and location', () => {
  const prefs = { weather:'rain', rain:true, fire:true, cafe:true, volume:.5 };
  assert.ok(ambientLevels(prefs, 'village').rain > 0); assert.equal(ambientLevels(prefs, 'village').fire, 0);
  assert.ok(ambientLevels(prefs, 'room').fire > 0); assert.equal(ambientLevels(prefs, 'room').cafe, 0);
  assert.deepEqual(ambientLevels(prefs, 'quests'), { rain:0, fire:0, cafe:0 });
  assert.equal(ambientLevels({ ...prefs, weather:'clear' }, 'village').rain, 0);
  assert.equal(ambientLevels({ ...prefs, fire:false }, 'room').fire, 0);
  assert.deepEqual(ambientLevels({ ...prefs, volume:0 }, 'room'), { rain:0, fire:0, cafe:0 });
});

test('audio waits for a gesture, pauses on blur and visibility, updates routes, and releases its loops', () => {
  const doc = new EventTarget(), win = new EventTarget(); doc.hidden = false;
  let contexts = 0, resumed = 0, suspended = 0, closed = 0, stopped = 0, started = 0;
  const gains = [];
  class Audio {
    constructor() { contexts++; this.sampleRate = 100; this.currentTime = 1; this.destination = {}; }
    createBuffer(channels, length) { return { getChannelData: () => new Float32Array(length) }; }
    createBufferSource() { return { connect() {}, disconnect() {}, start() { started++; }, stop() { stopped++; } }; }
    createBiquadFilter() { return { frequency:{ value:0 }, connect() {} }; }
    createGain() { const node = { gain:{ value:0, setTargetAtTime(value) { this.value = value; } }, connect() {}, disconnect() {} }; gains.push(node); return node; }
    resume() { resumed++; return Promise.resolve(); }
    suspend() { suspended++; return Promise.resolve(); }
    close() { closed++; return Promise.resolve(); }
  }
  win.AudioContext = Audio;
  let scene = 'room'; const prefs = { weather:'rain', rain:true, fire:true, cafe:true, volume:.5 };
  const audio = createAmbience(() => prefs, () => scene, { doc, win });
  audio.update(); assert.equal(contexts, 0);
  doc.dispatchEvent(new Event('pointerdown')); assert.equal(contexts, 1); assert.equal(started, 3); assert.ok(resumed > 0);
  assert.ok(gains[0].gain.value > 0); assert.ok(gains[1].gain.value > 0); assert.equal(gains[2].gain.value, 0);
  win.dispatchEvent(new Event('blur')); assert.ok(suspended > 0); assert.ok(gains.every(node => node.gain.value === 0));
  win.dispatchEvent(new Event('focus')); assert.ok(gains[1].gain.value > 0);
  doc.hidden = true; doc.dispatchEvent(new Event('visibilitychange')); assert.ok(gains.every(node => node.gain.value === 0));
  doc.hidden = false; scene = 'village'; doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(gains[1].gain.value, 0); assert.ok(gains[2].gain.value > 0);
  audio.dispose(); audio.dispose(); assert.equal(stopped, 3); assert.equal(closed, 1);
  const before = resumed; doc.dispatchEvent(new Event('pointerdown')); audio.update(); assert.equal(resumed, before);
});

class Node {
  constructor(dataset = {}) { this.dataset = dataset; this.listeners = new Map(); this.style = {}; this.classes = new Set(); this.disabled = false; this.open = true; this.textContent = ''; this.classList = { toggle:(key,on) => on ? this.classes.add(key) : this.classes.delete(key) }; }
  addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type,new Set()); this.listeners.get(type).add(fn); }
  removeEventListener(type,fn) { this.listeners.get(type)?.delete(fn); }
  emit(type,values = {}) { for (const fn of [...(this.listeners.get(type) || [])]) fn({ target:this, preventDefault() {}, ...values }); }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  closest(selector) { return selector === '[data-room-object]' && this.dataset.roomObject || selector === '[data-room-edit]' && this.dataset.roomEdit || selector === '[data-pet-play]' && this.dataset.petPlay ? this : null; }
  focus() {}
  setPointerCapture(id) { this.capture = id; }
  hasPointerCapture(id) { return this.capture === id; }
  releasePointerCapture() { this.capture = null; }
  removeAttribute(name) { if (name === 'data-playing') delete this.dataset.playing; }
}
function globals(values, run) {
  const previous = Object.fromEntries(Object.keys(values).map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  Object.assign(globalThis,values);
  try { run(); } finally { for(const [key,descriptor] of Object.entries(previous)) { if(descriptor) Object.defineProperty(globalThis,key,descriptor); else delete globalThis[key]; } }
}
test('room dragging uses scaled coordinates, saves on release, cancels safely and supports keyboard, wallpaper and reset', () => {
  const win = new Node(), root = new Node(), drawer = new Node(), chair = new Node({roomObject:'chair'}), status = new Node();
  root.getBoundingClientRect = () => ({ width:300,height:200 });
  root.querySelectorAll = () => [chair]; drawer.querySelector = () => status;
  let saves = 0; const selections = [], state = freshState();
  globals({window:win}, () => {
    const editor = mountRoomEditor({state,root,drawer,onSave:()=>saves++,onSelect:slot=>selections.push(slot)});
    const original = structuredClone(state.home.layout.chair);
    root.emit('pointerdown',{target:chair,button:0,pointerId:1,clientX:100,clientY:100});
    assert.equal(selections.at(-1),'chair');
    root.emit('pointermove',{pointerId:1,clientX:130,clientY:120});
    assert.deepEqual(state.home.layout.chair,original); assert.equal(parseFloat(chair.style.left),33);
    root.emit('pointerup',{pointerId:1}); assert.equal(saves,1); assert.equal(state.home.layout.chair.x,33); assert.equal(state.home.layout.chair.y,59);
    root.emit('keydown',{target:chair,key:'r'}); assert.equal(state.home.layout.chair.rotation,15);
    root.emit('keydown',{target:chair,key:'ArrowLeft',shiftKey:true}); assert.equal(state.home.layout.chair.x,29);
    const saved = structuredClone(state.home.layout.chair);
    root.emit('pointerdown',{target:chair,button:0,pointerId:2,clientX:100,clientY:100});
    root.emit('pointermove',{pointerId:2,clientX:900,clientY:900});
    root.emit('pointercancel',{pointerId:2}); assert.deepEqual(state.home.layout.chair,saved);
    assert.equal(parseFloat(chair.style.left),saved.x);
    drawer.emit('change',{target:{ id:'room-wallpaper',value:'rose' }}); assert.equal(state.home.wallpaper,'rose'); assert.equal(root.dataset.wallpaper,'rose');
    drawer.emit('click',{target:new Node({roomEdit:'reset'})}); assert.deepEqual(state.home.layout,normalizeLayout());
    drawer.open=false;drawer.emit('toggle');assert.equal(chair.disabled,true);
    root.emit('pointerdown',{target:chair,button:0,pointerId:3,clientX:100,clientY:100});root.emit('pointermove',{pointerId:3,clientX:120,clientY:120});
    assert.deepEqual(state.home.layout,normalizeLayout());
    editor.dispose(); editor.dispose();
    assert.equal([...root.listeners.values(),...drawer.listeners.values(),...win.listeners.values()].reduce((n,set)=>n+set.size,0),0);
  });
});

test('pet play prevents overlapping rewards and cancels unfinished activity on navigation or hidden tabs', () => {
  const root = new Node(), doc = new Node(), status = new Node(), buttons = ['pet','fetch','train'].map(petPlay=>new Node({petPlay}));
  root.querySelector=()=>status;root.querySelectorAll=()=>buttons;
  const timers=new Map();let seq=0;const completed=[];
  globals({document:doc,matchMedia:()=>({matches:false}),setTimeout:fn=>{timers.set(++seq,fn);return seq;},clearTimeout:id=>timers.delete(id)},()=>{
    const session=mountPetPlay({state:freshState(),root,onComplete:action=>completed.push(action)});
    root.emit('click',{target:buttons[1]});root.emit('click',{target:buttons[0]});assert.equal(timers.size,1);
    const callback=[...timers.values()][0];timers.clear();callback();assert.deepEqual(completed,['fetch']);assert.ok(buttons.every(b=>!b.disabled));
    root.emit('click',{target:buttons[2]});doc.hidden=true;doc.emit('visibilitychange');assert.equal(timers.size,0);assert.deepEqual(completed,['fetch']);
    doc.hidden=false;root.emit('click',{target:buttons[0]});const stale=[...timers.values()][0];
    session.dispose();stale();assert.equal(timers.size,0);assert.deepEqual(completed,['fetch']);
    assert.equal([...root.listeners.values(),...doc.listeners.values()].reduce((n,set)=>n+set.size,0),0);
  });
});
