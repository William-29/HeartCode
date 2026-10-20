import { icon, sprite } from './art.js';
import { characterSprite, characterPortrait } from './characters.js';
import { projects, projectUnlocked } from './projects.js';
import { achievements } from './content.js';
import { roomItems, roomSlots, normalizeHome, festivalProgress, festivalStalls, periods, villagePeriod, schedules } from './village-life-model.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const title = word => word[0].toUpperCase() + word.slice(1);

export function routineControls(state) {
  const period = villagePeriod(state.villageTime);
  return `<div class="village-routine-bar"><label>${icon('clock')} Time in Hearthwick <select id="village-time" aria-label="Village time of day"><option value="auto" ${!periods.includes(state.villageTime) ? 'selected' : ''}>Follow my clock</option>${periods.map(time => `<option value="${time}" ${state.villageTime === time ? 'selected' : ''}>${title(time)}</option>`).join('')}</select></label><span>${period === 'morning' ? 'Bread in the oven. Dew in the garden.' : period === 'afternoon' ? 'Workshop doors open. Time for a cup of tea.' : 'Lanterns on. The kettle is still warm.'}</span></div>`;
}
export function routineNotes(state) {
  const schedule = schedules[villagePeriod(state.villageTime)];
  return `<details class="village-daybook"><summary>${icon('book')} Around the village today</summary><div>${Object.entries(schedule).map(([id, routine]) => `<p>${characterPortrait(id, 'routine-face')}<span><strong>${title(id)} · ${esc(routine.place)}</strong>${esc(routine.activity)}</span></p>`).join('')}</div><small>Morning 06:00–12:00 · Afternoon 12:00–17:00 · Evening 17:00–06:00. All activities stay available at every hour.</small></details>`;
}
export function mountVillageClock(state, onChange, now = () => new Date()) {
  let last = villagePeriod(state.villageTime, now());
  const update = () => {
    if (document.hidden || document.querySelector('dialog[open]')) return;
    const next = villagePeriod(state.villageTime, now());
    if (next !== last) { last = next; onChange(); }
  };
  const timer = setInterval(update, 30000);
  document.addEventListener('visibilitychange', update);
  return { dispose() { clearInterval(timer); document.removeEventListener('visibilitychange', update); } };
}

// Crop windows preserve the original transparent atlas; no raster edits are needed.
const furnishingFrames = {
  'chair-cinnamon': [15, 15, 410, 390], 'chair-sage': [15, 408, 410, 375],
  'lamp-brass': [445, 15, 280, 380], 'lamp-glass': [440, 400, 285, 383],
  'plant-fern': [720, 25, 385, 370], 'plant-flowers': [725, 400, 375, 383],
  'rug-braided': [1105, 85, 500, 290], 'rug-patchwork': [1105, 434, 505, 310],
  'wall-books': [1605, 15, 375, 405], 'wall-stars': [1640, 418, 330, 350]
};
export function furnishingArt(id, className = '') {
  const frame = furnishingFrames[id];
  if (!frame) return '';
  return `<svg class="furnishing-art item-${id} ${className}" viewBox="${frame.join(' ')}" preserveAspectRatio="xMidYMax meet" aria-hidden="true" overflow="hidden"><image href="assets/hearthwick-furnishings.png" width="1983" height="793"/></svg>`;
}

export function renderRoom(state, companion, selectedSlot = 'chair') {
  if (!Object.hasOwn(roomSlots, selectedSlot)) selectedSlot = 'chair';
  const home = normalizeHome(state.home);
  const trophies = achievements.filter(item => state.achievements.includes(item.id));
  const festival = festivalProgress(state);
  return `<div class="page-heading life-heading"><div><p class="eyebrow">ABOVE THE HEARTH & HONEY</p><h1>A room of your own<span class="gold">.</span></h1><p>Leave your boots by the door. There’s nowhere else you need to be.</p></div><button class="text-button" data-action="navigate" data-route="village">Down to the village ${icon('arrow')}</button></div>
  <div class="home-stage"><section class="home-scene" role="img" aria-label="Your cozy room, furnished with ${esc(Object.values(home.placed).filter(Boolean).map(id => roomItems.find(item => item.id === id)?.name).join(', '))}. ${esc(companion.name)} is here. ${trophies.length} achievement trophies${festival.celebrated ? ' and your festival keepsake' : ''} on display."><img class="home-backdrop" src="assets/hearthwick-room.png" alt="" draggable="false"><div class="home-firelight" aria-hidden="true"></div>
    ${Object.entries(home.placed).map(([slot, id]) => id ? `<div class="home-object home-${slot}">${furnishingArt(id)}${slot === 'lamp' ? '<span class="home-lamp-glow"></span>' : ''}</div>` : '').join('')}
    <div class="home-trophy-shelf">${trophies.slice(-4).map(trophy => `<span class="home-trophy" title="${esc(trophy.name)}">${icon('trophy')}</span>`).join('')}${festival.celebrated ? `<span class="home-festival-pennant">${icon('spark')}</span>` : ''}</div><div class="home-pet">${sprite(companion.id)}</div><div class="home-traveler">${characterSprite('traveler')}</div><span class="home-room-name">${esc(state.name)}’s little corner</span></section></div>
  <div class="room-after-scene"><p>${icon('trophy')} ${trophies.length ? `${trophies.length} achievement${trophies.length === 1 ? '' : 's'} earned · ${trophies.slice(-4).map(trophy => esc(trophy.name)).join(', ')}` : 'Your first achievement will find a home on this shelf.'}${festival.celebrated ? ' · Lantern Festival keepsake unlocked' : ''}</p><p>${icon('coin')} ${state.coins} coins · Furnishings are yours to keep. Rearranging is free.</p></div>
  <section class="room-shop" aria-labelledby="room-shop-title"><div class="section-heading"><h2 id="room-shop-title">Little things for your room</h2><span class="eyebrow">REARRANGING IS FREE</span></div><nav class="room-slot-tabs" aria-label="Choose a furnishing spot">${Object.entries(roomSlots).map(([slot, label]) => `<button class="room-slot-tab ${slot === selectedSlot ? 'selected' : ''}" data-action="room-slot" data-id="${slot}" aria-pressed="${slot === selectedSlot}">${label}</button>`).join('')}</nav>${Object.entries(roomSlots).filter(([slot]) => slot === selectedSlot).map(([slot, label]) => `<div class="room-shop-row"><div class="room-slot-heading"><h3>${label}</h3>${home.placed[slot] ? `<button class="text-button" data-action="room-remove" data-id="${slot}" aria-label="Clear ${label.toLowerCase()}">Clear this spot</button>` : '<span>Room to make it yours</span>'}</div><div class="room-options">${roomItems.filter(item => item.slot === slot).map(item => {
    const owned = home.owned.includes(item.id), placed = home.placed[slot] === item.id;
    return `<article class="room-shop-item ${placed ? 'is-placed' : ''}"><div class="room-item-picture">${furnishingArt(item.id)}</div><div><h4>${item.name}</h4><p>${item.description}</p><button class="button ${placed ? 'subtle' : 'outline'}" data-action="room-furnish" data-id="${item.id}" ${placed || (!owned && state.coins < item.cost) ? 'disabled' : ''}>${placed ? `${icon('check')} In your room` : owned ? 'Place in room' : `${icon('coin')} ${item.cost} coins · Buy & place`}</button>${!owned && state.coins < item.cost ? `<small>${item.cost - state.coins} more coins needed</small>` : ''}</div></article>`;
  }).join('')}</div></div>`).join('')}</section>`;
}

export function festivalDecor() {
  return `<div class="festival-strings" aria-hidden="true">${Array.from({ length: 11 }, (_, index) => `<i style="--i:${index};--drop:${38 + (5 - Math.abs(5 - index)) * 4}px"></i>`).join('')}</div>`;
}
export function renderFestival(state) {
  const progress = festivalProgress(state), current = progress.acts[progress.current];
  return `<div class="page-heading life-heading"><div><p class="eyebrow">A STORY MADE WITH YOUR NEIGHBORS</p><h1>The lantern festival<span class="gold">.</span></h1><p>Six little creations. A whole village brought together.</p></div><button class="text-button" data-action="navigate" data-route="village">Back to the lane ${icon('arrow')}</button></div>
  <section class="festival-green ${progress.celebrated ? 'festival-open' : ''}">${festivalDecor()}<div class="festival-sign"><span>HEARTHWICK</span><h2>${progress.celebrated ? 'Welcome, neighbor.' : progress.ready ? 'It’s almost time.' : 'Good things take a little making.'}</h2><p>${progress.celebrated ? 'The lights are on, the games are ready, and your Python is part of it all. Pop into any stall to try what you made.' : `${progress.done} of 6 preparations made together`}</p></div><div class="festival-cast" aria-hidden="true">${['rowan', 'mira', 'elio'].map(id => characterSprite(id)).join('')}</div><div class="festival-path"></div></section>
  ${progress.celebrated ? `<div class="festival-letter"><p class="eyebrow">A NOTE LEFT AT YOUR DOOR</p><p>“We used to say somebody ought to put on a festival. Then you came along and started with one small thing. Every bill, game, score, plant, and lantern carries a little of what you learned. Thank you for making this place feel like home.”</p><span>— Rowan, Mira & Elio</span><p class="festival-keepsake">${icon('spark')} Lantern Festival keepsake on your room shelf · 200 XP & 150 coins collected</p></div>` : `<div class="festival-letter"><p class="eyebrow">${progress.ready ? 'THE LAST INVITATION' : `CHAPTER ${progress.current + 1} OF 3 · ${current.title.toUpperCase()}`}</p><p>${esc(progress.ready ? 'Rowan puts the kettle down. Mira checks the games one last time. Elio cups a lantern in his hands. “Everything is ready. Shall we light the village together?”' : current.letter)}</p>${progress.ready ? `<button class="button primary" data-action="festival-celebrate">${icon('flame')} Light the lanterns · 200 XP & 150 coins</button>` : '<span>No deadline. Every completed village project counts, including ones you made earlier.</span>'}</div>`}
  <section class="festival-story" aria-label="Festival preparations">${progress.acts.map((act, index) => `<div class="festival-act"><div class="festival-act-title"><span>${String(index + 1).padStart(2, '0')}</span><div><h2>${act.title}</h2><p>${act.done}/2 preparations complete${act.done === 2 ? ' · Made with care' : ''}</p></div></div><div class="festival-stalls">${act.projects.map(id => {
    const project = projects.find(project => project.id === id), stall = festivalStalls[id], done = state.projects.includes(id), unlocked = projectUnlocked(state, id), runnable = done && !!state.projectCode[id];
    const previous = projects.find(item => item.id === project.previous);
    return `<article class="festival-stall ${done ? 'stall-ready' : ''}"><div class="stall-awning"></div><span class="stall-symbol">${icon(stall.icon)}</span><p class="eyebrow">${done ? 'YOUR CREATION IS HERE' : `MADE WITH ${project.npc.toUpperCase()}`}</p><h3>${stall.name}</h3><p>${done ? stall.use : esc(project.storyBefore)}</p>${runnable ? `<button class="button primary" data-action="project-demo" data-id="${id}">Visit & try your Python ${icon('play')}</button>` : unlocked ? `<button class="button outline" data-action="project" data-id="${id}">${done ? 'Restore your creation' : 'Help prepare this stall'} ${icon('code')}</button>` : `<p class="festival-prerequisite">${icon('lock')} ${state.completed.length < project.requires ? `Complete ${project.requires} trail quests (${state.completed.length}/${project.requires}).` : `First make “${esc(previous?.title)}”.`}<button class="text-button" data-action="navigate" data-route="quests">Visit the learning trail ${icon('arrow')}</button></p>`}${runnable ? `<button class="text-button" data-action="project" data-id="${id}">Revisit the code</button>` : ''}</article>`;
  }).join('')}</div></div>`).join('')}</section><p class="festival-footnote">Trying a stall is free. Project and festival rewards are earned once; the festival stays open for return visits.</p>`;
}

export function renderCafe(state, companion) {
  const period = villagePeriod(state.villageTime);
  return `<div class="dialog-top"><span class="eyebrow">THE CAFÉ TERRACE · ${period.toUpperCase()}</span><button class="icon-button" data-action="close-village" aria-label="Leave the café table">${icon('close')}</button></div><div class="cafe-break"><p class="eyebrow">A MOMENT WITH ${esc(companion.name).toUpperCase()}</p><h2>The next thing can wait.</h2><div class="cafe-vignette" aria-hidden="true"><div class="cafe-window"></div><div class="cafe-visitor">${characterSprite('traveler')}</div><div class="cafe-pet">${sprite(companion.id)}</div><div class="cafe-table"><span class="cafe-cup"></span><i class="cafe-steam"></i></div><div class="cafe-flower">${furnishingArt('plant-flowers')}</div></div><p>${period === 'morning' ? 'A little steam rises from your cup. Somewhere inside, Rowan is taking bread out of the oven.' : period === 'afternoon' ? 'A spoon clinks against a cup. Mira waves from the courtyard; the sun finds a gap between the awnings.' : 'Lamplight pools on the cobblestones. The workshop closes softly, and the village settles around you.'}</p><p class="cafe-pet-note">${esc(companion.name)} settles beside you. “${esc(companion.quote || 'A very good place to pause.')}”</p><button class="button outline" data-action="close-village">Back to our little adventure ${icon('arrow')}</button></div>`;
}
