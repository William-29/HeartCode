export const roomGeometry = Object.freeze({
  chair: { x: 23, y: 49, w: 23, h: 34 },
  lamp: { x: 59, y: 23, w: 9, h: 14 },
  plant: { x: 49, y: 23, w: 8, h: 12 },
  rug: { x: 25, y: 70, w: 45, h: 24 },
  wall: { x: 36, y: 21, w: 11, h: 17 }
});
export const wallpapers = Object.freeze({ honey: 'Honey plaster', sage: 'Sage wallpaper', rose: 'Rose wallpaper', blue: 'Blue wallpaper' });
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export function roomPosition(slot, value) {
  const geometry = roomGeometry[slot];
  if (!Object.hasOwn(roomGeometry, slot)) return null;
  const rotation = Number.isFinite(value?.rotation) ? ((Math.round(value.rotation / 15) * 15 % 360) + 360) % 360 : 0;
  const radians = rotation * Math.PI / 180;
  // The scene is 3:2. Account for rotation so no corner can leave it.
  const extraX = (Math.abs(geometry.w * Math.cos(radians)) + Math.abs(geometry.h / 1.5 * Math.sin(radians)) - geometry.w) / 2;
  const extraY = (Math.abs(geometry.h * Math.cos(radians)) + Math.abs(geometry.w * 1.5 * Math.sin(radians)) - geometry.h) / 2;
  return {
    x: clamp(Number.isFinite(value?.x) ? value.x : geometry.x, Math.max(0, extraX), Math.min(100 - geometry.w, 100 - geometry.w - extraX)),
    y: clamp(Number.isFinite(value?.y) ? value.y : geometry.y, Math.max(0, extraY), Math.min(100 - geometry.h, 100 - geometry.h - extraY)),
    rotation
  };
}
export function normalizeLayout(value) {
  return Object.fromEntries(Object.keys(roomGeometry).map(slot => [slot, roomPosition(slot, value?.[slot])]));
}
export function normalizeAmbience(value) {
  return {
    weather: value?.weather === 'rain' ? 'rain' : 'clear',
    motion: value?.motion !== false,
    rain: value?.rain === true, fire: value?.fire === true, cafe: value?.cafe === true,
    volume: Number.isFinite(value?.volume) ? clamp(value.volume, 0, 1) : .35
  };
}
export const petActivities = Object.freeze({ pet: { label: 'Pet', points: 2 }, fetch: { label: 'Play fetch', points: 3 }, train: { label: 'Practice a trick', points: 4 } });
export const petBeds = Object.freeze([
  { id: 'blanket', name: 'Knitted cushion', required: 6 },
  { id: 'basket', name: 'Willow basket', required: 18 },
  { id: 'nest', name: 'Patchwork nest', required: 36 }
]);
const validDay = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value));
export function normalizePetCare(value, owned = ['pip']) {
  return Object.fromEntries(owned.map(id => {
    const input = value?.[id];
    const points = Number.isSafeInteger(input?.points) ? clamp(input.points, 0, 10000) : 0;
    const last = Object.fromEntries(Object.keys(petActivities).filter(action => validDay(input?.last?.[action])).map(action => [action, input.last[action]]));
    const unlocked = petBeds.filter(bed => points >= bed.required);
    const tricks = ['hop', 'twirl'].filter((trick, index) => points >= (index ? 18 : 6) && Array.isArray(input?.tricks) && input.tricks.includes(trick));
    return [id, { points, last, tricks, bed: input?.bed === null ? null : unlocked.find(bed => bed.id === input?.bed)?.id || unlocked.at(-1)?.id || null }];
  }));
}
export function petFriend(state, id = state.equipped) {
  return normalizePetCare(state.petCare, state.owned)[id] || { points: 0, last: {}, tricks: [], bed: null };
}
export function careForPet(state, id, action, today) {
  if (!state.owned.includes(id) || !Object.hasOwn(petActivities, action) || !validDay(today)) return { ok: false };
  state.petCare = normalizePetCare(state.petCare, state.owned);
  const friend = state.petCare[id], before = friend.points;
  const points = friend.last[action] === today ? 0 : petActivities[action].points;
  friend.points = Math.min(10000, friend.points + points); friend.last[action] = today;
  const unlocked = petBeds.filter(bed => before < bed.required && friend.points >= bed.required);
  if (unlocked.length) friend.bed = unlocked.at(-1).id;
  const learned = [];
  if (action === 'train') for (const [trick, required] of [['hop', 6], ['twirl', 18]]) {
    if (friend.points >= required && !friend.tricks.includes(trick)) { friend.tricks.push(trick); learned.push(trick); }
  }
  return { ok: true, points, total: friend.points, unlocked, learned };
}
export function choosePetBed(state, id, bedId) {
  if (!state.owned.includes(id)) return false;
  state.petCare = normalizePetCare(state.petCare, state.owned);
  const friend = state.petCare[id], bed = petBeds.find(bed => bed.id === bedId);
  if (bedId !== 'none' && (!bed || friend.points < bed.required)) return false;
  friend.bed = bedId === 'none' ? null : bedId; return true;
}
