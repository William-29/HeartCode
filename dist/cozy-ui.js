import { icon, sprite } from './art.js';
import { normalizeAmbience, petFriend, petBeds, petActivities, wallpapers } from './cozy-model.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function weatherArt(state, location = 'village') {
  const prefs = normalizeAmbience(state.ambience);
  if (prefs.weather !== 'rain') return '';
  return `<div class="cozy-weather weather-${location} ${prefs.motion ? '' : 'weather-still'}" aria-hidden="true"><div class="rain-streaks">${Array.from({ length: 38 }, (_, i) => `<i style="--x:${(i * 37) % 101}%;--delay:${-(i % 11) * .23}s;--speed:${.8 + i % 5 * .17}s"></i>`).join('')}</div>${location === 'village' ? `<div class="rain-puddles">${[['43%','64%'],['62%','80%'],['70%','52%']].map(([x,y]) => `<span style="left:${x};top:${y}"><i></i></span>`).join('')}</div>` : ''}</div>`;
}
export function ambienceSettings(state) {
  const prefs = normalizeAmbience(state.ambience);
  return `<fieldset class="ambience-settings"><legend>Weather & quiet sounds</legend><label class="field-label" for="cozy-weather">Village weather</label><select id="cozy-weather" name="weather"><option value="clear" ${prefs.weather === 'clear' ? 'selected' : ''}>Clear skies</option><option value="rain" ${prefs.weather === 'rain' ? 'selected' : ''}>Gentle rain</option></select>
    <label class="toggle-row"><span><strong>Animate the weather</strong><small>Moving raindrops and puddle ripples. Reduce motion still takes priority.</small></span><input type="checkbox" name="weatherMotion" ${prefs.motion ? 'checked' : ''}></label>
    ${[['rain','Rainfall','Outside in the village and against your room window when it rains.'],['fire','Fireplace','A soft crackle in your room and the tavern.'],['cafe','Café ambience','A quiet room tone and occasional cups in the village, tavern, and festival.']].map(([id,name,description]) => `<label class="toggle-row"><span><strong>${name}</strong><small>${description}</small></span><input type="checkbox" name="ambient-${id}" ${prefs[id] ? 'checked' : ''}></label>`).join('')}
    <label class="field-label" for="ambience-volume">Ambient volume</label><input id="ambience-volume" name="ambientVolume" type="range" min="0" max="100" step="5" value="${Math.round(prefs.volume * 100)}"><small>Sounds begin after interaction and pause when you leave the tab. Reward chimes have their own switch.</small></fieldset>`;
}
export function petBedArt(state, id = state.equipped) {
  const friend = petFriend(state, id);
  return friend.bed ? `<span class="cozy-pet-bed bed-${friend.bed}" aria-hidden="true"><i></i></span>` : '';
}
export function renderPetCorner(state, companion) {
  const friend = petFriend(state), next = petBeds.find(bed => friend.points < bed.required);
  return `<section class="pet-corner" aria-labelledby="pet-corner-title"><div class="pet-play-yard" aria-hidden="true"><span class="pet-yard-window"></span>${petBedArt(state)}<span class="pet-play-friend">${sprite(companion.id)}</span><span class="pet-play-ball"></span><span class="pet-play-heart">♡</span></div><div class="pet-corner-copy"><p class="eyebrow">A LITTLE TIME TOGETHER</p><h2 id="pet-corner-title">${esc(companion.name)} is happy you're here.</h2><p><strong>${friend.points} friendship</strong> · ${friend.tricks.length ? `Tricks learned: ${friend.tricks.map(trick => trick === 'hop' ? 'little hop' : 'twirl').join(', ')}` : 'Practice together to learn a little hop at 6 friendship.'}</p><div class="pet-play-actions">${Object.entries(petActivities).map(([id, action]) => `<button type="button" class="button outline" data-pet-play="${id}">${action.label}${id === 'pet' ? ` ${esc(companion.name)}` : ''}</button>`).join('')}</div><p class="pet-play-status" role="status" aria-live="polite">No hurry. Friendship never fades.</p><small>Each activity earns friendship once a day: pet +2, fetch +3, practice +4. Play again whenever you like.</small><div class="pet-bed-choices" role="group" aria-label="Choose a sleeping spot"><button class="text-button" data-action="pet-bed" data-id="none" aria-pressed="${!friend.bed}">No bed</button>${petBeds.map(bed => `<button class="text-button" data-action="pet-bed" data-id="${bed.id}" ${friend.points < bed.required ? 'disabled' : ''} aria-pressed="${friend.bed === bed.id}">${bed.name}${friend.points < bed.required ? ` · ${bed.required} friendship` : ''}</button>`).join('')}</div><p class="pet-next-reward">${next ? `${next.required - friend.points} more friendship to unlock the ${next.name.toLowerCase()}.` : 'Every sleeping spot is yours. Make yourself comfortable.'} Your chosen bed also appears in your room.</p></div></section>`;
}
export function wallpaperArt() {
  return `<svg class="room-wallpaper-art" viewBox="0 0 1536 1024" aria-hidden="true"><defs><pattern id="room-wallpaper-pattern" width="28" height="32" patternUnits="userSpaceOnUse"><path d="M14 5q-9 7 0 16 9-9 0-16Z" fill="none" stroke="currentColor" stroke-width="1.5"/></pattern><clipPath id="room-plaster"><path d="M500 106 642 110 642 389 555 390 500 344ZM1058 140 1428 144 1428 210 1265 210 1265 282 1210 289 1206 396 1096 394 1094 352 1058 350Z"/></clipPath></defs><g clip-path="url(#room-plaster)"><path fill="var(--wallpaper-color,transparent)" d="M0 0h1536v1024H0Z"/><path fill="url(#room-wallpaper-pattern)" d="M0 0h1536v1024H0Z"/></g></svg>`;
}
export function roomEditControls(home, selectedSlot) {
  return `<div class="room-edit-controls"><p>Drag furnishings to arrange them. Use arrow keys to nudge, Shift for larger steps, and R to rotate. Escape cancels a drag.</p><div class="room-edit-row"><label>Wallpaper <select id="room-wallpaper">${Object.entries(wallpapers).map(([id,label]) => `<option value="${id}" ${home.wallpaper === id ? 'selected' : ''}>${label}</option>`).join('')}</select></label><div class="room-position-controls" role="group" aria-label="Move selected furnishing">${[['left','←'],['up','↑'],['down','↓'],['right','→']].map(([id,label]) => `<button type="button" data-room-edit="${id}" aria-label="Move selected furnishing ${id}">${label}</button>`).join('')}<button type="button" data-room-edit="rotate-left" aria-label="Rotate selected furnishing left">↶</button><button type="button" data-room-edit="rotate-right" aria-label="Rotate selected furnishing right">↷</button></div><button type="button" class="text-button" data-room-edit="reset">Reset arrangement</button></div><span class="room-position-status" role="status" aria-live="polite">Selected: ${esc(selectedSlot)}.</span></div>`;
}
export function mountPetPlay({ state, onComplete, root = document.querySelector('.pet-corner') }) {
  if (!root) return { dispose() {} };
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const status = root.querySelector('.pet-play-status'), buttons = [...root.querySelectorAll('[data-pet-play]')];
  let timer = 0, disposed = false;
  const stop = () => { clearTimeout(timer); timer = 0; root.removeAttribute('data-playing'); buttons.forEach(button => button.disabled = false); };
  const click = event => {
    const action = event.target.closest('[data-pet-play]')?.dataset.petPlay;
    if (disposed || timer || !Object.hasOwn(petActivities, action)) return;
    buttons.forEach(button => button.disabled = true);
    root.dataset.playing = action;
    root.dataset.trick = petFriend(state).tricks.includes('twirl') ? 'twirl' : 'hop';
    status.textContent = action === 'fetch' ? 'A little toss… and here comes your friend!' : action === 'train' ? `Try a little ${root.dataset.trick}. Good job, little friend!` : 'A gentle scratch and a happy little wiggle.';
    timer = setTimeout(() => { if (disposed) return; stop(); onComplete(action); }, state.reducedMotion || media.matches ? 150 : action === 'fetch' ? 2600 : 1400);
  };
  const hide = () => { if (document.hidden && timer) { stop(); status.textContent = 'We can play again when you return.'; } };
  root.addEventListener('click', click); document.addEventListener('visibilitychange', hide);
  return { dispose() { disposed = true; stop(); root.removeEventListener('click', click); document.removeEventListener('visibilitychange', hide); } };
}
