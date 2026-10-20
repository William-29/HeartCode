import { weatherArt } from './cozy-ui.js';
import { icon, sprite } from './art.js';
import { sceneArt } from './alley-scene.js';
import { characterSprite } from './characters.js';
import { villagePeriod, scheduledPlaces, festivalProgress } from './village-life-model.js';
import { routineControls, routineNotes } from './village-life.js';
import { VILLAGE_WIDTH, VILLAGE_HEIGHT, destinations, normalizePosition, findRoute, moveBy, advanceRoute, nearbyDestination, WALK_SPEED } from './village-model.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function villagerSprite(id) { return characterSprite(id, 'village-npc-sprite'); }

const adventurer = characterSprite('traveler', 'village-adventurer');

export function fitVillageViewport(width, height) {
  return Math.max(0, Math.min(width / VILLAGE_WIDTH, height / VILLAGE_HEIGHT));
}

export function renderVillage(state, companion = { id: 'pip', name: 'Pip' }) {
  const position = normalizePosition(state.villagePosition);
  const projects = Array.isArray(state.projects) ? state.projects : [];
  const met = new Set(state.metVillagers || []);
  const period = villagePeriod(state.villageTime), places = scheduledPlaces(destinations, state.villageTime);
  return `<section class="village-shell village-${period}" aria-labelledby="village-title">
    <div class="village-heading"><div><p class="eyebrow">A LITTLE PLACE TO CALL HOME</p><h1 id="village-title">${period === 'morning' ? 'A gentle morning' : period === 'afternoon' ? 'An easy afternoon' : 'Early evening'} in Hearthwick<span>.</span></h1><p>${period === 'evening' ? 'The lights are on. Stay a little while.' : 'The village is waking up around you. Stay a little while.'}</p></div><span class="village-weather">${icon('spark')} The warm light of home</span></div>
    ${routineControls(state)}
    <div class="village-stage"><div class="village-frame"><div class="village-topline"><span>${icon('home')} HEARTHWICK VILLAGE</span><span>${projects.length ? `${projects.length} little ${projects.length === 1 ? 'project' : 'projects'}, a happier village` : 'Every good story starts with hello'}</span></div>
    <div class="village-viewport" tabindex="0" role="region" aria-label="Walkable village" aria-describedby="village-instructions">
      <div class="village-scene" style="aspect-ratio:${VILLAGE_WIDTH}/${VILLAGE_HEIGHT}">${sceneArt(projects)}${weatherArt(state)}
        ${places.map(place => `<button type="button" class="village-destination village-${place.id} ${place.color} ${met.has(place.id) ? 'has-met' : ''}" data-village-walk="${place.id}" style="left:${place.x / 10}%;top:${place.y / 6.5}%" aria-label="Walk to ${esc(place.name)}. ${esc(place.activity || place.hint)}">${['rowan', 'mira', 'elio'].includes(place.id) ? `<span class="village-npc">${villagerSprite(place.id)}<span class="village-hello" aria-hidden="true">${met.has(place.id) ? '♡' : '!'}</span></span>` : `<span class="village-place-icon">${icon(place.icon)}</span>`}<span class="village-place-name">${esc(place.name)}</span><span class="village-place-hint">${esc(place.place)}</span></button>`).join('')}
        ${festivalProgress(state).celebrated ? '<div class="village-festival-ribbons" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>' : ''}
        <div role="img" class="village-actor" style="left:${position.x / 10}%;top:${position.y / 6.5}%" aria-label="You and ${esc(companion.name)}"><span class="village-you">YOU</span><div class="village-party">${adventurer}<span class="village-following-pet">${sprite(companion.id)}</span></div></div>
        <div class="village-walk-marker" hidden aria-hidden="true"></div>
        <span class="village-map-note" aria-hidden="true">Good company. A little curiosity. Home.</span>
      </div>
    </div>
    <div class="village-bottomline"><p id="village-instructions">Click to wander <span>·</span> <kbd>WASD</kbd> / <kbd>↑ ↓ ← →</kbd> to walk <span>·</span> <kbd>E</kbd> to chat</p><button type="button" class="village-interact" data-village-interact disabled>Explore the village ${icon('arrow')}</button></div></div></div>
    <p class="village-status" role="status" aria-live="polite">The kettle is on. Your next adventure can wait a moment.</p>
    <nav class="village-direct" aria-label="Visit a village place directly"><label for="village-destination">Pop over to</label><select id="village-destination">${places.map(place => `<option value="${place.id}">${esc(place.name)}</option>`).join('')}</select><button type="button" data-village-go>Visit ${icon('arrow')}</button></nav>
    ${routineNotes(state)}
    ${projects.length ? '<p class="village-growth-note">Your work is becoming part of this place. Look for the little things you’ve helped grow.</p>' : '<p class="village-growth-note">Help your neighbors build things with Python, and watch the village grow with you.</p>'}
  </section>`;
}

export function mountVillage({ state, previousPlaces, reducedMotion = false, onVisit = () => {}, onMove = () => {} }) {
  const root = document.querySelector('.village-shell');
  if (!root) return { dispose() {}, pause() {} };
  const viewport = root.querySelector('.village-viewport'), scene = root.querySelector('.village-scene');
  const actor = root.querySelector('.village-actor'), marker = root.querySelector('.village-walk-marker');
  const status = root.querySelector('.village-status'), interact = root.querySelector('[data-village-interact]');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const places = scheduledPlaces(destinations, state.villageTime);
  const routines = new Map(); let routineFrame = 0, routineTime = null;
  const anchors = places.filter(place => ['rowan', 'mira', 'elio'].includes(place.id)).map(place => ({ ...place }));
  const timers = new Map(), laps = new Map();
  let focused = true;
  let position = normalizePosition(state.villagePosition), route = [], destination = null, near = null;
  let frame = 0, lastTime = null, disposed = false, dirty = false, pointerDown = null;
  const held = new Set(), listeners = [];
  const listen = (target, name, callback, options) => { target.addEventListener(name, callback, options); listeners.push(() => target.removeEventListener(name, callback, options)); };
  const blocked = () => !focused || document.hidden || !!document.querySelector('dialog[open]');
  const commit = () => { if (dirty) { dirty = false; onMove({ x: Math.round(position.x * 10) / 10, y: Math.round(position.y * 10) / 10 }); } };
  const motion = () => { root.classList.toggle('village-still', reducedMotion || media.matches); if (reducedMotion || media.matches) { clearStrollTimers(); finishRoutines(); } else scheduleStrolls(); };
  const paint = () => {
    actor.style.left = `${position.x / 10}%`; actor.style.top = `${position.y / 6.5}%`;
    const next = nearbyDestination(position, 65, places);
    if (next?.id !== near?.id) {
      near = next; interact.disabled = !near;
      interact.innerHTML = near ? `${['rowan', 'mira', 'elio'].includes(near.id) ? 'Chat with' : 'Visit'} ${esc(near.name)} ${icon('arrow')}` : `Explore the village ${icon('arrow')}`;
      root.querySelectorAll('[data-village-walk]').forEach(button => button.classList.toggle('nearby', button.dataset.villageWalk === near?.id));
    }
  };
  const paintNeighbor = routine => {
    routine.button.style.left = `${routine.place.x / 10}%`; routine.button.style.top = `${routine.place.y / 6.5}%`;
  };
  const stopRoutine = id => {
    const routine = routines.get(id);
    if (routine) { routine.button.classList.remove('npc-walking'); routines.delete(id); }
    if (!routines.size && routineFrame) { cancelAnimationFrame(routineFrame); routineFrame = 0; routineTime = null; }
  };
  function clearStrollTimers() { for (const timer of timers.values()) clearTimeout(timer); timers.clear(); }
  function scheduleStroll(anchor, delay = 4500) {
    if (disposed || reducedMotion || media.matches || timers.has(anchor.id)) return;
    timers.set(anchor.id, setTimeout(() => {
      timers.delete(anchor.id);
      if (disposed) return;
      const place = places.find(place => place.id === anchor.id);
      if (blocked() || routines.has(anchor.id) || destination?.id === anchor.id || Math.hypot(position.x - place.x, position.y - place.y) < 80) {
        scheduleStroll(anchor, 1500); return;
      }
      const lap = laps.get(anchor.id) || 0;
      const offsets = [[65, 25], [30, 65], [-45, 20], [0, 0]];
      const [dx, dy] = offsets[lap % offsets.length];
      laps.set(anchor.id, lap + 1);
      const target = normalizePosition({ x: anchor.x + dx, y: anchor.y + dy });
      const path = findRoute(place, target);
      const button = root.querySelector(`[data-village-walk="${anchor.id}"]`);
      if (button && path.length > 1) {
        routines.set(anchor.id, { place, target, route: path.slice(1), button, ambient: true });
        button.classList.add('npc-walking');
        if (!routineFrame) { routineTime = null; routineFrame = requestAnimationFrame(stroll); }
      }
      scheduleStroll(anchor, 6500 + (lap % 3) * 900);
    }, delay));
  }
  function scheduleStrolls() { anchors.forEach((anchor, index) => scheduleStroll(anchor, 650 + index * 1100)); }
  function pauseRoutines() { for (const id of [...routines.keys()]) stopRoutine(id); }
  function finishRoutines() {
    for (const [id, routine] of routines) { Object.assign(routine.place, routine.target); paintNeighbor(routine); stopRoutine(id); }
    paint();
  }
  const stroll = time => {
    routineFrame = 0;
    if (disposed || blocked()) { pauseRoutines(); return; }
    const seconds = routineTime == null ? 0 : Math.min(.05, Math.max(0, (time - routineTime) / 1000)); routineTime = time;
    for (const [id, routine] of routines) {
      if (routine.ambient && Math.hypot(position.x - routine.place.x, position.y - routine.place.y) < 80) { stopRoutine(id); continue; }
      const oldX = routine.place.x;
      const result = advanceRoute(routine.place, routine.route, seconds * (routine.ambient ? 48 : 90));
      Object.assign(routine.place, result.position); routine.route = result.route;
      routine.button.classList.toggle('npc-facing-left', routine.place.x < oldX);
      paintNeighbor(routine);
      if (!result.route.length) stopRoutine(id);
    }
    paint();
    if (routines.size) routineFrame = requestAnimationFrame(stroll);
  };
  const stop = () => {
    if (frame) cancelAnimationFrame(frame); frame = 0; lastTime = null;
    route = []; destination = null; held.clear(); marker.hidden = true;
    actor.classList.remove('is-walking'); commit();
  };
  const visit = id => {
    if (disposed || blocked() || !places.some(place => place.id === id)) return;
    stopRoutine(id); stop(); status.textContent = `Visiting ${places.find(place => place.id === id).name}.`;
    onVisit(id);
  };
  const tick = time => {
    frame = 0;
    if (disposed || blocked()) { stop(); return; }
    const seconds = lastTime == null ? 0 : Math.min(.05, Math.max(0, (time - lastTime) / 1000)); lastTime = time;
    let dx = (held.has('ArrowRight') || held.has('d') ? 1 : 0) - (held.has('ArrowLeft') || held.has('a') ? 1 : 0);
    let dy = (held.has('ArrowDown') || held.has('s') ? 1 : 0) - (held.has('ArrowUp') || held.has('w') ? 1 : 0);
    const old = position;
    if (dx || dy) {
      const scale = WALK_SPEED * seconds / Math.hypot(dx, dy);
      position = moveBy(position, dx * scale, dy * scale);
    } else if (route.length) {
      const result = advanceRoute(position, route, WALK_SPEED * seconds); position = result.position; route = result.route;
    }
    if (position.x !== old.x || position.y !== old.y) {
      dirty = true; actor.classList.toggle('facing-left', position.x < old.x); paint();
    }
    if (!route.length && !held.size) {
      const arrived = destination; destination = null; marker.hidden = true; actor.classList.remove('is-walking'); lastTime = null; commit();
      if (arrived) visit(arrived.id);
      else if (dirty === false) status.textContent = near ? `${near.name} is nearby. Press E or use the visit button.` : 'A good place to take a breath. Where next?';
      return;
    }
    actor.classList.add('is-walking'); frame = requestAnimationFrame(tick);
  };
  const start = () => { if (!frame && !disposed) { lastTime = null; frame = requestAnimationFrame(tick); } };
  const walk = (target, place = null) => {
    if (disposed || blocked()) return;
    stop(); destination = place;
    route = findRoute(position, target).slice(1);
    if (!route.length) { destination = null; status.textContent = 'That spot is tucked away. Try a nearby path.'; return; }
    marker.style.left = `${route.at(-1).x / 10}%`; marker.style.top = `${route.at(-1).y / 6.5}%`; marker.hidden = false;
    status.textContent = place ? `Walking to ${place.name}…` : 'Off for a little wander…';
    viewport.focus({ preventScroll: true }); start();
  };
  listen(root, 'click', event => {
    if (event.target.closest('[data-village-go]')) { visit(root.querySelector('#village-destination').value); return; }
    const direct = event.target.closest('[data-village-visit]');
    if (direct) { visit(direct.dataset.villageVisit); return; }
    if (event.target.closest('[data-village-interact]')) { if (near) visit(near.id); return; }
    const button = event.target.closest('[data-village-walk]');
    if (button) { const place = places.find(item => item.id === button.dataset.villageWalk); stopRoutine(place.id); walk(place, place); return; }
    if (!event.target.closest('.village-scene')) return;
    // A touch scroll should never become an accidental walk at the end of a drag.
    if (pointerDown && Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 8) return;
    const bounds = scene.getBoundingClientRect();
    walk({ x: (event.clientX - bounds.left) / bounds.width * VILLAGE_WIDTH, y: (event.clientY - bounds.top) / bounds.height * VILLAGE_HEIGHT });
  });
  listen(scene, 'pointerdown', event => { pointerDown = { x: event.clientX, y: event.clientY }; });
  listen(root, 'keydown', event => {
    if (blocked() || event.target.closest('input, textarea, select, [contenteditable="true"]') || event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(key)) {
      if (!event.target.closest('.village-viewport')) return;
      event.preventDefault(); route = []; destination = null; marker.hidden = true; held.add(key); start();
    } else if ((key === 'e' || key === 'Enter') && event.target === viewport) { event.preventDefault(); if (near) visit(near.id); }
    else if (key === 'Escape') stop();
  });
  listen(document, 'keyup', event => {
    held.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key);
    if (!held.size && !route.length) stop();
  });
  listen(root, 'focusout', event => { if (!root.contains(event.relatedTarget)) stop(); });
  listen(window, 'blur', () => { focused = false; stop(); pauseRoutines(); clearStrollTimers(); });
  listen(window, 'focus', () => { focused = true; scheduleStrolls(); });
  listen(document, 'visibilitychange', () => { if (document.hidden) { stop(); pauseRoutines(); clearStrollTimers(); } else scheduleStrolls(); });
  listen(media, 'change', motion);
  if (!reducedMotion && !media.matches && !blocked() && Array.isArray(previousPlaces)) {
    for (const place of places.filter(place => ['rowan', 'mira', 'elio'].includes(place.id))) {
      const previous = previousPlaces.find(previous => previous.id === place.id);
      const button = root.querySelector(`[data-village-walk="${place.id}"]`);
      if (!previous || !button || !Number.isFinite(previous.x) || !Number.isFinite(previous.y)) continue;
      const path = findRoute(previous, place);
      if (path.length < 2 || Math.hypot(previous.x - place.x, previous.y - place.y) < 1) continue;
      const routine = { place, target: { x: place.x, y: place.y }, route: path.slice(1), button };
      Object.assign(place, path[0]); routines.set(place.id, routine); button.classList.add('npc-walking'); paintNeighbor(routine);
    }
    if (routines.size) routineFrame = requestAnimationFrame(stroll);
  }
  motion(); paint();
  const fit = () => {
    const scale = fitVillageViewport(viewport.clientWidth, viewport.clientHeight || 650);
    scene.style.transform = `translate(-50%, -50%) scale(${scale})`;
  };
  const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
  resize?.observe(viewport); fit(); listen(window, 'resize', fit);
  return {
    places: () => places.map(place => ({ ...place })),
    pause() { stop(); pauseRoutines(); },
    dispose() { if (disposed) return; disposed = true; clearStrollTimers(); resize?.disconnect(); if (routineFrame) cancelAnimationFrame(routineFrame); routineFrame = 0; routines.clear(); stop(); listeners.splice(0).forEach(remove => remove()); }
  };
}
