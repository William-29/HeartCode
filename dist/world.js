import { quests, chapters } from './content.js';
import { isUnlocked } from './state.js';
import { icon, sprite } from './art.js';
import { characterSprite } from './characters.js';
import { rewardChest } from './cozy-art.js';
import { WORLD_WIDTH, WORLD_HEIGHT, regions, stops, regionForStop, positionForProgress, legPath, pointOnLeg } from './world-model.js';

const esc = text => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const traveler = characterSprite('traveler', 'traveler-sprite');

export function renderWorld(state, companion, selectedIndex, receipt) {
  const current = Math.min(state.completed.length, quests.length - 1);
  const selected = Number.isInteger(selectedIndex) ? selectedIndex : current;
  const position = positionForProgress(state.completed.length);
  const percentage = Math.round(state.completed.length / quests.length * 100);
  return `<div class="page-heading world-heading"><div><p class="eyebrow">THE HEARTHLANDS · AN ADVENTURE IN LEARNING</p><h1>A world worth wandering<span class="gold">.</span></h1><p>A warm tavern. A winding trail. A little more magic with every quest.</p></div><span class="completion-pill">${icon('map')} ${percentage}% explored</span></div>
    <label class="region-picker" for="world-region-select">Explore a region <select id="world-region-select">${regions.map((region, index) => `<option value="${index}" ${index === Math.floor(selected / 4) ? 'selected' : ''}>${index + 1}. ${region.short}${state.completed.length >= (index + 1) * 4 ? ' - explored' : ''}</option>`).join('')}</select><span>${regions.length} regions &middot; ${quests.length} quests</span></label>
    <section class="world-shell" aria-label="The Hearthlands adventure map">
      <div class="world-topline"><span>${icon('map')} THE HEARTHLANDS <span class="world-divider">/</span> <b id="world-location">${regionForStop(current).mood}</b></span><span class="world-weather">${icon('spark')} Always a good day to wander</span></div>
      <div class="world-viewport" tabindex="0" role="region" aria-label="Adventure map. Drag to explore; use arrow keys to pan, plus and minus to zoom, or the region selector to jump." aria-describedby="world-instructions">
        <div class="world-canvas" style="width:${WORLD_WIDTH}px;height:${WORLD_HEIGHT}px">
          <img class="world-art world-art-original" src="assets/hearthlands.png" alt="" width="1600" height="1067" draggable="false">
          <img class="world-art world-art-expansion" src="assets/guildlands.png" alt="" width="3200" height="1067" draggable="false">
          <img class="world-art world-art-connection" src="assets/guild-pass.png" alt="" width="640" height="1067" draggable="false">
          <div class="world-light"></div>
          <svg class="world-trails" viewBox="0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}" aria-hidden="true">${stops.slice(0, -1).map((_, i) => `${i >= 24 && i <= 28 ? `<path class="connector-road-edge" d="${legPath(i)}"/><path class="connector-road" d="${legPath(i)}"/><path class="connector-road-stones" d="${legPath(i)}"/>` : ''}${i === 15 || i === 16 || i === 25 ? `<path class="bridge-deck" d="${legPath(i)}"/><path class="bridge-planks" d="${legPath(i)}"/>` : ''}<path class="trail-shadow" d="${legPath(i)}"/><path class="trail ${i < state.completed.length ? 'traveled' : ''}" data-leg="${i}" d="${legPath(i)}"/>`).join('')}</svg>
          <div class="world-decor" aria-hidden="true"><span class="map-cloud cloud-one"></span><span class="map-cloud cloud-two"></span><span class="lake-glint glint-one">✧</span><span class="lake-glint glint-two">✧</span><span class="lake-glint glint-three">✧</span><span class="chimney-smoke smoke-one"></span><span class="chimney-smoke smoke-two"></span>${Array.from({ length: 12 }, (_, i) => `<i class="forest-firefly" style="left:${350 + i * 32}px;top:${320 + (i % 4) * 52}px;--delay:${i * .37}s"></i>`).join('')}</div>
          ${regions.map((region, index) => `<div class="world-region-label ${region.color}" style="left:${region.label[0]}px;top:${region.label[1]}px"><span>CHAPTER ${chapters[index].numeral}</span><strong>${region.name}</strong></div>`).join('')}
          ${quests.map((quest, i) => {
            const done = state.completed.includes(quest.id), unlocked = isUnlocked(state, quest.id);
            return `<button class="world-node ${done ? 'cleared' : unlocked ? 'current' : 'undiscovered'} ${i === selected ? 'selected' : ''}" data-world="select" data-index="${i}" style="left:${stops[i].x}px;top:${stops[i].y}px" aria-label="Quest ${i + 1}: ${esc(quest.title)}. ${done ? 'Complete, replay available' : unlocked ? 'Ready to begin' : 'Locked, preview available'}" aria-pressed="${i === selected}"><span class="node-ring"><span>${done ? icon('check') : String(i + 1).padStart(2, '0')}</span></span><span class="node-tooltip">${quest.title}</span></button>`;
          }).join('')}
          <div class="guild-finish ${state.completed.length === quests.length ? 'reached' : ''}" style="left:${stops[quests.length].x}px;top:${stops[quests.length].y}px" aria-label="Hearthlands academy, journey’s end">${icon('trophy')}<span>THE ACADEMY</span></div>
          <div role="img" class="world-traveler" style="left:${position.x}px;top:${position.y}px" aria-label="You and ${companion.name}"><span class="traveler-name">YOU</span><div class="traveler-party">${traveler}<span class="travel-companion">${sprite(companion.id)}</span></div><div class="arrival-sparks" aria-hidden="true">${Array.from({ length: 8 }, (_, i) => `<i style="--spark:${i}"></i>`).join('')}</div>
        </div>
        <div class="world-vignette" aria-hidden="true"></div><div class="world-compass" aria-hidden="true"><span>N</span>✦</div>
        <div class="world-controls" role="group" aria-label="Map controls"><button data-world="zoom-in" aria-label="Zoom in" title="Zoom in">+</button><span id="world-zoom" aria-live="off">100%</span><button data-world="zoom-out" aria-label="Zoom out" title="Zoom out">−</button><span class="control-divider"></span><button data-world="fit" aria-label="Show the whole world" title="Show the whole world">${icon('map')}</button><button data-world="follow" aria-label="Find my adventurer" title="Find my adventurer">${icon('paw')}</button></div>
        <div class="travel-announcement" role="status" aria-live="polite" hidden><span class="travel-status-dot"></span><span id="travel-message"></span><button data-world="skip">Skip walk ${icon('arrow')}</button><button class="arrival-quest" data-action="${state.completed.length === quests.length ? 'navigate' : 'quest'}" data-route="tavern" data-id="${quests[current].id}" hidden>${state.completed.length === quests.length ? 'Back to the tavern' : 'Begin next quest'} ${icon('arrow')}</button></div>
      </div>
      <div class="world-bottomline"><span id="world-instructions">Drag to wander <span>·</span> Select a stop to discover its quest</span><div><span class="legend-dot cleared"></span> Explored <span class="legend-dot current"></span> Your next quest <span class="legend-dot locked"></span> Yet to discover</div></div>
    </section>
    ${receipt ? renderReceipt(receipt) : ''}
    <div id="world-inspector" aria-live="polite">${renderStop(state, selected)}</div>
    <p class="world-footnote">${icon('leaf')} The path opens one quest at a time. Your coins, companions, and hard-earned progress travel with you.</p>`;
}

function renderReceipt(receipt) {
  const { quest, result, leveled, level, output } = receipt;
  return `<section class="journey-receipt" aria-label="Quest completion rewards"><span class="receipt-illustration">${rewardChest()}</span><div><p class="eyebrow">QUEST COMPLETE · ${quest.title}</p><h2>${quest.id === 'masters-pipeline' ? 'Master of the Hearthlands. What a journey.' : quest.id === 'guild-trial' ? 'Welcome to the guild, tavern legend.' : 'A new spell learned. A new path opened.'}</h2><p>${esc(quest.takeaway)}</p><div class="receipt-rewards"><span>${icon('spark')} +${result.xp} XP</span><span>${icon('coin')} +${result.coins} coins</span>${leveled ? `<span>${icon('trophy')} Level ${level} reached!</span>` : ''}</div>${result.achievements.length ? `<div class="receipt-achievements">${result.achievements.map(a => `<span>${icon('trophy')} ${a.name} · +${a.coins} coins</span>`).join('')}</div>` : ''}${output.trim() ? `<details class="receipt-output"><summary>Your Python output</summary><pre>${esc(output.slice(0, 2000))}</pre></details>` : ''}</div><button class="icon-button" data-action="dismiss-receipt" aria-label="Dismiss quest completion summary">${icon('close')}</button></section>`;
}

export function renderStop(state, index) {
  const quest = quests[index], region = regionForStop(index), chapter = chapters[quest.chapter], done = state.completed.includes(quest.id), unlocked = isUnlocked(state, quest.id);
  const allDone = state.completed.length === quests.length;
  return `<section class="world-quest-preview ${region.color}"><span class="destination-emblem">${icon(region.icon)}</span><div class="destination-description"><span class="eyebrow">${region.name.toUpperCase()} · CHAPTER ${chapter.numeral}</span><h2>${quest.title}</h2><p>${esc(quest.subtitle)}. ${esc(chapter.description)}</p><div class="destination-meta"><span>${esc(chapter.difficulty)} · Quest ${index + 1}/${quests.length}</span><span>${icon(quest.type === 'code' ? 'code' : 'book')} ${quest.type === 'code' ? 'Coding challenge' : 'Knowledge check'}</span><span>${icon('clock')} ${quest.minutes} min</span><span>${icon('spark')} ${quest.xp} XP</span><span>${icon('coin')} ${quest.coins} coins</span></div></div><div class="destination-action"><span>${done ? 'A familiar trail. Replays are always welcome.' : unlocked ? 'Your next little adventure is ready.' : `Complete “${quests[index - 1]?.title}” first.`}</span><button class="button ${unlocked ? 'primary' : 'subtle'}" data-action="quest" data-id="${quest.id}" ${unlocked ? '' : 'disabled'}>${icon(done ? 'reset' : unlocked ? 'play' : 'lock')} ${done ? 'Revisit quest' : unlocked ? 'Begin this quest' : 'Path not yet open'} ${unlocked ? icon('arrow') : ''}</button>${allDone ? '<button class="text-button" data-action="navigate" data-route="tavern">Return to the tavern</button>' : ''}</div></section>`;
}

// All camera and travel animation is transient. Persistent progress is committed
// before this mounts, so skipping, navigating away, or reloading cannot lose rewards.
export function mountWorld({ state, selectedIndex, travel, reducedMotion, onSelect }) {
  const root = document.querySelector('.world-shell');
  if (!root) return null;
  const viewport = root.querySelector('.world-viewport'), canvas = root.querySelector('.world-canvas'), actor = root.querySelector('.world-traveler');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = reducedMotion || media.matches, disposed = false, frame = 0, cameraFrame = 0, walking = false, skipClick = false;
  let zoom = viewport.clientWidth < 600 ? .72 : .88, pan = { x: 0, y: 0 }, actorPosition = positionForProgress(state.completed.length), drag = null;
  let selected = selectedIndex ?? Math.min(state.completed.length, quests.length - 1);
  const abort = new AbortController(), signal = abort.signal;
  const listen = (target, type, callback, options = {}) => target.addEventListener(type, callback, { ...options, signal });
  function revealRegion() {
    const picker = document.querySelector('#world-region-select');
    if (picker) picker.value = String(Math.floor(selected / 4));
  }
  revealRegion();
  listen(document, 'change', event => { if (event.target.id === 'world-region-select') select(Number(event.target.value) * 4); });
  function clampPan() {
    const w = viewport.clientWidth, h = viewport.clientHeight;
    pan.x = WORLD_WIDTH * zoom <= w ? (w - WORLD_WIDTH * zoom) / 2 : Math.min(0, Math.max(w - WORLD_WIDTH * zoom, pan.x));
    pan.y = WORLD_HEIGHT * zoom <= h ? (h - WORLD_HEIGHT * zoom) / 2 : Math.min(0, Math.max(h - WORLD_HEIGHT * zoom, pan.y));
  }
  function paint() { if (disposed) return; clampPan(); canvas.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`; root.querySelector('#world-zoom').textContent = `${Math.round(zoom * 100)}%`; }
  function center(point, smooth = false) {
    cancelAnimationFrame(cameraFrame);
    const destination = { x: viewport.clientWidth / 2 - point.x * zoom, y: viewport.clientHeight * .53 - point.y * zoom };
    if (!smooth || reduce) { pan = destination; paint(); return; }
    const start = performance.now(), origin = { ...pan };
    function tick(now) { if (disposed) return; const t = Math.min(1, (now - start) / 450), ease = 1 - (1 - t)**3; pan = { x: origin.x + (destination.x - origin.x) * ease, y: origin.y + (destination.y - origin.y) * ease }; paint(); if (t < 1) cameraFrame = requestAnimationFrame(tick); }
    cameraFrame = requestAnimationFrame(tick);
  }
  function placeActor(point) { actorPosition = point; actor.style.left = `${point.x}px`; actor.style.top = `${point.y}px`; }
  function select(index, follow = true) {
    if (!Number.isInteger(index) || !quests[index]) return;
    finishTravel(); selected = index; onSelect(index);
    root.querySelectorAll('.world-node').forEach(node => { const chosen = Number(node.dataset.index) === index; node.classList.toggle('selected', chosen); node.setAttribute('aria-pressed', String(chosen)); });
    document.querySelectorAll('.region-button').forEach(button => { const chosen = Number(button.dataset.index) === Math.floor(index / 4); button.classList.toggle('selected', chosen); button.setAttribute('aria-pressed', String(chosen)); });
    revealRegion();
    root.querySelector('#world-location').textContent = regionForStop(index).mood;
    document.querySelector('#world-inspector').innerHTML = renderStop(state, index);
    if (follow) center(stops[index], true);
  }
  function zoomTo(value) {
    finishTravel(); cancelAnimationFrame(cameraFrame);
    const next = Math.max(Math.min(.24, viewport.clientWidth / WORLD_WIDTH, viewport.clientHeight / WORLD_HEIGHT), Math.min(1.5, value));
    const centerPoint = { x: (viewport.clientWidth / 2 - pan.x) / zoom, y: (viewport.clientHeight / 2 - pan.y) / zoom };
    zoom = next; pan = { x: viewport.clientWidth / 2 - centerPoint.x * zoom, y: viewport.clientHeight / 2 - centerPoint.y * zoom }; paint();
  }
  function finishTravel() {
    if (!walking || disposed) return;
    walking = false; cancelAnimationFrame(frame); actor.classList.remove('walking'); actor.classList.add('arrived');
    placeActor(stops[travel.to]); root.querySelector(`[data-leg="${travel.from}"]`)?.classList.add('traveled');
    const message = travel.final ? `You reached the Hearthlands academy. All ${quests.length} quests are complete!` : `${travel.newRegion ? 'New region discovered! ' : ''}You and your companion arrived at ${regionForStop(travel.to).name}.`;
    root.querySelector('#travel-message').textContent = message; root.querySelector('[data-world="skip"]').hidden = true;
    root.querySelector('.arrival-quest').hidden = false;
    root.querySelector('.travel-announcement').classList.add('arrived'); root.querySelector('.travel-announcement').setAttribute('role', 'status');
    center(actorPosition); viewport.setAttribute('aria-busy', 'false');
  }
  listen(document, 'click', event => {
    const button = event.target.closest('[data-world]'); if (!button || !document.querySelector('.world-shell')) return;
    if (skipClick) { skipClick = false; event.preventDefault(); event.stopPropagation(); return; }
    const action = button.dataset.world;
    if (action === 'select') select(Number(button.dataset.index));
    if (action === 'region') { zoom = viewport.clientWidth < 600 ? .72 : .88; select(Number(button.dataset.index) * 4); }
    if (action === 'zoom-in') zoomTo(zoom + .15);
    if (action === 'zoom-out') zoomTo(zoom - .15);
    if (action === 'fit') { finishTravel(); cancelAnimationFrame(cameraFrame); zoom = Math.min(viewport.clientWidth / WORLD_WIDTH, viewport.clientHeight / WORLD_HEIGHT); pan = { x: 0, y: 0 }; paint(); }
    if (action === 'follow') { finishTravel(); zoom = viewport.clientWidth < 600 ? .72 : .88; select(Math.min(state.completed.length, quests.length - 1), false); center(actorPosition, true); }
    if (action === 'skip') finishTravel();
  });
  listen(viewport, 'focusin', event => { const node = event.target.closest('.world-node'); if (node && !drag) center(stops[Number(node.dataset.index)], true); });
  listen(viewport, 'pointerdown', event => {
    if (event.button !== 0 || event.target.closest('.world-controls,.travel-announcement')) return;
    finishTravel(); cancelAnimationFrame(cameraFrame); skipClick = false;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, originX: pan.x, originY: pan.y, moved: false };
  });
  listen(viewport, 'pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 6) { drag.moved = true; viewport.setPointerCapture(event.pointerId); viewport.classList.add('dragging'); }
    if (drag.moved) { pan = { x: drag.originX + dx, y: drag.originY + dy }; paint(); }
  });
  const stopDrag = event => { if (!drag || event.pointerId !== drag.id) return; skipClick = drag.moved; drag = null; viewport.classList.remove('dragging'); if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId); };
  listen(viewport, 'pointerup', stopDrag); listen(viewport, 'pointercancel', stopDrag);
  // A drag must never accidentally open a quest or move the selected stop.
  listen(viewport, 'click', event => { if (skipClick) { event.stopPropagation(); event.preventDefault(); skipClick = false; } }, { capture: true });
  listen(viewport, 'keydown', event => {
    if (event.target !== viewport) return;
    const moves = { ArrowLeft: [100, 0], ArrowRight: [-100, 0], ArrowUp: [0, 100], ArrowDown: [0, -100] };
    if (moves[event.key]) { event.preventDefault(); finishTravel(); cancelAnimationFrame(cameraFrame); pan.x += moves[event.key][0]; pan.y += moves[event.key][1]; paint(); }
    if (['+', '=', '-'].includes(event.key)) { event.preventDefault(); zoomTo(zoom + (event.key === '-' ? -.15 : .15)); }
    if (event.key === 'Home') { event.preventDefault(); finishTravel(); center(actorPosition, true); }
  });
  listen(media, 'change', () => { reduce = reducedMotion || media.matches; if (reduce) { finishTravel(); cancelAnimationFrame(cameraFrame); } });
  const resize = new ResizeObserver(() => { if (!walking) center(state.completed.length === quests.length && selected === quests.length - 1 ? actorPosition : stops[selected]); }); resize.observe(viewport);
  if (travel) {
    walking = true; placeActor(stops[travel.from]); center(actorPosition);
    actor.classList.add('walking'); viewport.setAttribute('aria-busy', 'true');
    root.querySelector(`[data-leg="${travel.from}"]`)?.classList.remove('traveled');
    root.querySelector('.travel-announcement').hidden = false;
    root.querySelector('#travel-message').textContent = travel.final ? 'One last stroll to the academy…' : `Quest complete! Wandering toward ${regionForStop(travel.to).name}…`;
    if (reduce) finishTravel();
    else {
      const start = performance.now();
      function step(now) {
        if (disposed || !walking) return;
        const elapsed = Math.max(0, now - start - 450), t = Math.min(1, elapsed / 2400), eased = t*t*(3-2*t), point = pointOnLeg(travel.from, eased);
        actor.classList.toggle('facing-left', stops[travel.to].x < stops[travel.from].x);
        placeActor(point); center(point);
        if (t < 1) frame = requestAnimationFrame(step); else finishTravel();
      }
      frame = requestAnimationFrame(step);
    }
  } else center(state.completed.length === quests.length ? actorPosition : stops[selected]);
  return { finishTravel, dispose() { disposed = true; cancelAnimationFrame(frame); cancelAnimationFrame(cameraFrame); abort.abort(); resize.disconnect(); } };
}
