import { normalizeLayout, wallpapers } from './cozy-model.js';
export const periods = Object.freeze(['morning', 'afternoon', 'evening']);
export function villagePeriod(preference = 'auto', now = new Date()) {
  if (periods.includes(preference)) return preference;
  const hour = now.getHours();
  return hour >= 6 && hour < 12 ? 'morning' : hour >= 12 && hour < 17 ? 'afternoon' : 'evening';
}
export const schedules = Object.freeze({
  morning: {
    rowan: { x: 270, y: 340, place: 'The Hearth & Honey', activity: 'Setting out warm bread and opening the café.' },
    mira: { x: 615, y: 410, place: 'The courtyard', activity: 'Testing her games before the workshop opens.' },
    elio: { x: 750, y: 590, place: 'The garden', activity: 'Watering the plants while the lane is quiet.' }
  },
  afternoon: {
    rowan: { x: 270, y: 385, place: 'The café tables', activity: 'Taking a tea break and watching the courtyard.' },
    mira: { x: 675, y: 333, place: 'The Tinker’s Workshop', activity: 'Repairing toys and sorting festival score slips.' },
    elio: { x: 350, y: 500, place: 'Willowmere Lake', activity: 'Writing down observations beside the water.' }
  },
  evening: {
    rowan: { x: 270, y: 340, place: 'The Hearth & Honey', activity: 'Keeping the kettle warm for the last visitors.' },
    mira: { x: 620, y: 440, place: 'The courtyard', activity: 'Bringing a little game out beneath the lamps.' },
    elio: { x: 350, y: 500, place: 'Willowmere Lake', activity: 'Checking the lanterns before settling in with a book.' }
  }
});
export function scheduledPlaces(places, preference, now = new Date()) {
  const schedule = schedules[villagePeriod(preference, now)];
  return places.map(place => ({ ...place, ...schedule[place.id] }));
}

export const roomSlots = Object.freeze({ chair: 'Reading chair', lamp: 'Lamplight', plant: 'Windowsill', rug: 'Floor', wall: 'Above the desk' });
export const roomItems = Object.freeze([
  { id: 'chair-cinnamon', slot: 'chair', name: 'Cinnamon armchair', cost: 0, description: 'Rowan saved you the comfortable one.' },
  { id: 'chair-sage', slot: 'chair', name: 'Sage velvet chair', cost: 120, description: 'A soft green seat for the next chapter.' },
  { id: 'lamp-brass', slot: 'lamp', name: 'Brass reading lamp', cost: 0, description: 'A little pool of golden light.' },
  { id: 'lamp-glass', slot: 'lamp', name: 'Stained-glass lamp', cost: 110, description: 'Honey and rose glass from Mira’s workshop.' },
  { id: 'plant-fern', slot: 'plant', name: 'Elio’s fern', cost: 45, description: 'A small piece of the forest for your window.' },
  { id: 'plant-flowers', slot: 'plant', name: 'Market flowers', cost: 70, description: 'Daisies in a well-loved blue jug.' },
  { id: 'rug-braided', slot: 'rug', name: 'Braided hearth rug', cost: 0, description: 'Warm wool beneath your boots.' },
  { id: 'rug-patchwork', slot: 'rug', name: 'Patchwork rug', cost: 95, description: 'Terracotta, cream, and a little petrol blue.' },
  { id: 'wall-books', slot: 'wall', name: 'Little book shelf', cost: 0, description: 'A shelf with room for another idea.' },
  { id: 'wall-stars', slot: 'wall', name: 'Stargazer print', cost: 140, description: 'A tiny observatory above your desk.' }
]);
export function freshHome() {
  return { owned: roomItems.filter(item => !item.cost).map(item => item.id), placed: { chair: 'chair-cinnamon', lamp: 'lamp-brass', plant: null, rug: 'rug-braided', wall: 'wall-books' }, layout: normalizeLayout(), wallpaper: 'honey' };
}
export function normalizeHome(value) {
  const home = freshHome();
  home.owned = [...new Set([...home.owned, ...(Array.isArray(value?.owned) ? value.owned.filter(id => roomItems.some(item => item.id === id)) : [])])];
  for (const slot of Object.keys(roomSlots)) {
    const id = value?.placed?.[slot];
    if (id === null || (home.owned.includes(id) && roomItems.some(item => item.id === id && item.slot === slot))) home.placed[slot] = id;
  }
  home.layout = normalizeLayout(value?.layout);
  home.wallpaper = Object.hasOwn(wallpapers, value?.wallpaper) ? value.wallpaper : 'honey';
  return home;
}
export function furnishRoom(state, id) {
  const item = roomItems.find(item => item.id === id);
  if (!item) return { ok: false, reason: 'That furnishing is not in the shop.' };
  state.home = normalizeHome(state.home);
  const owned = state.home.owned.includes(id);
  if (!owned && state.coins < item.cost) return { ok: false, reason: `You need ${item.cost - state.coins} more coins.` };
  if (!owned) { state.coins -= item.cost; state.home.owned.push(id); }
  state.home.placed[item.slot] = id;
  return { ok: true, purchased: !owned, item };
}
export function removeFurnishing(state, slot) {
  if (!Object.hasOwn(roomSlots, slot)) return { ok: false };
  state.home = normalizeHome(state.home); state.home.placed[slot] = null;
  return { ok: true };
}

export const festivalActs = Object.freeze([
  { title: 'A table for everyone', letter: 'Rowan unfolds a hand-drawn invitation. “A village festival needn’t be grand. A fair bill, a game, and a place for everyone to sit. Could you help us begin?”', projects: ['project-tavern-bill', 'project-guessing-game'] },
  { title: 'All the little preparations', letter: 'Mira arrives with shopping lists and score slips. “We’ve invited everyone. Now we need enough food and a scoreboard that remembers every player—even the ones who score zero.”', projects: ['project-pantry-ledger', 'project-festival-scores'] },
  { title: 'Let the lanterns glow', letter: 'Elio brushes a leaf from his notebook. “The garden is our final guest. Help the plants thrive, then learn how much light our lanterns will need. We’ll test the prediction before trusting it.”', projects: ['project-plant-adviser', 'project-lantern-predictor'] }
]);
export const festivalStalls = Object.freeze({
  'project-tavern-bill': { name: 'The honey café', use: 'Calculate a café bill with your own Python.', icon: 'home' },
  'project-guessing-game': { name: 'Mira’s guessing booth', use: 'Play a fresh round of your guessing game.', icon: 'spark' },
  'project-pantry-ledger': { name: 'The picnic pantry', use: 'Plan the shopping with your pantry tool.', icon: 'book' },
  'project-festival-scores': { name: 'The village games', use: 'Total the rounds with your fair scoreboard.', icon: 'trophy' },
  'project-plant-adviser': { name: 'Elio’s plant corner', use: 'Ask your rule system how to care for a plant.', icon: 'leaf' },
  'project-lantern-predictor': { name: 'The lantern walk', use: 'Try your learned brightness predictor.', icon: 'flame' }
});
export function festivalProgress(state) {
  const completed = new Set(state.projects || []);
  const acts = festivalActs.map(act => ({ ...act, done: act.projects.filter(id => completed.has(id)).length }));
  const done = acts.reduce((sum, act) => sum + act.done, 0);
  return { acts, done, ready: done === 6, current: Math.max(0, acts.findIndex(act => act.done < 2)), celebrated: state.festivalCelebrated === true && done === 6 };
}
export function celebrateFestival(state) {
  const progress = festivalProgress(state);
  if (!progress.ready) return { ok: false, reason: 'Help finish all six festival preparations first.' };
  if (progress.celebrated) return { ok: true, replay: true, xp: 0, coins: 0 };
  state.festivalCelebrated = true; state.xp += 200; state.coins += 150;
  return { ok: true, replay: false, xp: 200, coins: 150 };
}
