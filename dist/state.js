import { quests, pets, achievements } from './content.js';
import { projects, villagers, projectUnlocked, friendship } from './projects.js';
import { freshHome, normalizeHome, periods, festivalProgress } from './village-life-model.js';
import { normalizeAmbience, normalizePetCare } from './cozy-model.js';
import { freshAdventure, normalizeAdventure } from './adventure-model.js';
import { freshRestoration, normalizeRestoration } from './restoration-model.js';
import { freshWardrobe, normalizeWardrobe } from './wardrobe-model.js';
import { exhibitCatalog } from './exhibition-model.js';
import { freshNeighbours, normalizeNeighbours } from './neighbour-model.js';
import { havenHelpComplete } from './haven-companions.js';
import { normalizeWorkbench } from './workbench.js';
import { normalizeThread } from './objective-model.js';
export const SAVE_KEY = 'hearthcode-save-v1';
export function freshState() {
  return { version: 1, name: 'Adventurer', xp: 0, coins: 0, completed: [], owned: ['pip'], equipped: 'pip', achievements: [], daily: [], streak: 0, lastActivity: null, drafts: {}, projects: [], projectCode: {}, metVillagers: [], villagePosition: { x: 500, y: 460 }, home: freshHome(), ambience: normalizeAmbience(), petCare: normalizePetCare(), adventure: freshAdventure(), restoration: freshRestoration(), wardrobe: freshWardrobe(), neighbours: freshNeighbours(), villageTime: 'auto', festivalCelebrated: false, workbench: normalizeWorkbench(), thread: normalizeThread(), sound: false, reducedMotion: false };
}
export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function dayNumber(key) { return Date.parse(`${key}T12:00:00Z`) / 86400000; }
export function normalizeState(value) {
  if (!value || value.version !== 1) throw new Error('This is not a compatible Hearthcode save.');
  const s = freshState();
  s.name = typeof value.name === 'string' ? value.name.trim().slice(0, 24) || 'Adventurer' : s.name;
  for (const field of ['xp', 'coins', 'streak']) s[field] = Number.isSafeInteger(value[field]) && value[field] >= 0 ? Math.min(value[field], 10000000) : 0;
  // A restored campaign can never skip prerequisites.
  for (const q of quests) { if (Array.isArray(value.completed) && value.completed.includes(q.id)) s.completed.push(q.id); else break; }
  // Side stories preserve their own prerequisites without advancing the campaign.
  for (const project of projects) if (Array.isArray(value.projects) && value.projects.includes(project.id) && projectUnlocked(s, project.id)) s.projects.push(project.id);
  s.metVillagers = [...new Set([
    ...(Array.isArray(value.metVillagers) ? value.metVillagers.filter(id => villagers.some(villager => villager.id === id)) : []),
    ...projects.filter(project => s.projects.includes(project.id)).map(project => project.npc)
  ])];
  if (value.projectCode && typeof value.projectCode === 'object') for (const id of s.projects) if (typeof value.projectCode[id] === 'string') s.projectCode[id] = value.projectCode[id].slice(0, 30000);
  if (value.villagePosition && typeof value.villagePosition === 'object') {
    for (const [axis, maximum] of [['x', 1000], ['y', 650]]) if (Number.isFinite(value.villagePosition[axis])) s.villagePosition[axis] = Math.max(0, Math.min(maximum, value.villagePosition[axis]));
  }
  s.owned = [...new Set(['pip', ...(Array.isArray(value.owned) ? value.owned.filter(id => pets.some(p => p.id === id)) : [])])];
  s.equipped = s.owned.includes(value.equipped) ? value.equipped : 'pip';
  s.achievements = Array.isArray(value.achievements) ? [...new Set(value.achievements.filter(id => achievements.some(a => a.id === id)))] : [];
  s.daily = Array.isArray(value.daily) ? [...new Set(value.daily.filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(dayNumber(d))))].slice(-400) : [];
  s.lastActivity = typeof value.lastActivity === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.lastActivity) && Number.isFinite(dayNumber(value.lastActivity)) ? value.lastActivity : null;
  s.sound = value.sound === true;
  s.home = normalizeHome(value.home);
  s.ambience = normalizeAmbience(value.ambience);
  s.petCare = normalizePetCare(value.petCare, s.owned);
  s.adventure = normalizeAdventure(value.adventure, s);
  s.restoration = normalizeRestoration(value.restoration, s);
  s.neighbours = normalizeNeighbours(value.neighbours, s);
  s.owned = s.owned.filter(id => havenHelpComplete(s, pets.find(p => p.id === id)));
  if (!s.owned.includes(s.equipped)) s.equipped = 'pip';
  s.petCare = normalizePetCare(s.petCare, s.owned);
  if (Array.isArray(s.restoration.exhibition)) {
    const owned = new Set(exhibitCatalog(s).map(item => item.id));
    s.restoration.exhibition = s.restoration.exhibition.filter(id => owned.has(id));
  }
  s.wardrobe = normalizeWardrobe(value.wardrobe, s);
  s.villageTime = periods.includes(value.villageTime) ? value.villageTime : 'auto';
  s.festivalCelebrated = value.festivalCelebrated === true && festivalProgress(s).ready;
  s.reducedMotion = value.reducedMotion === true;
  s.workbench = normalizeWorkbench(value.workbench);
  s.thread = normalizeThread(value.thread);
  if (value.drafts && typeof value.drafts === 'object') for (const key of [...quests.map(q => q.id), ...projects.map(project => project.id), 'practice']) if (typeof value.drafts[key] === 'string') s.drafts[key] = value.drafts[key].slice(0, 30000);
  return s;
}
export function isUnlocked(state, id) {
  const index = quests.findIndex(q => q.id === id);
  return index >= 0 && (index === 0 || state.completed.includes(quests[index - 1].id));
}
export function nextQuest(state) { return quests.find(q => !state.completed.includes(q.id)) || null; }
export function levelInfo(xp) {
  let level = 1, base = 0, needed = 200;
  while (xp >= base + needed) { base += needed; level++; needed = 200 + (level - 1) * 60; }
  return { level, current: xp - base, needed, percent: Math.min(100, Math.round((xp - base) / needed * 100)) };
}
export function visibleStreak(state, today = dateKey()) {
  if (!state.lastActivity || dayNumber(today) - dayNumber(state.lastActivity) > 1) return 0;
  return state.streak;
}
export function activity(state, today = dateKey()) {
  if (state.lastActivity === today) return;
  state.streak = state.lastActivity && dayNumber(today) - dayNumber(state.lastActivity) === 1 ? state.streak + 1 : 1;
  state.lastActivity = today;
}
export function unlockAchievements(state) {
  const earned = achievements.filter(a => !state.achievements.includes(a.id) && a.test(state));
  for (const achievement of earned) { state.achievements.push(achievement.id); state.coins += achievement.coins; }
  return earned;
}
export function completeQuest(state, id, today = dateKey()) {
  const quest = quests.find(q => q.id === id);
  if (!quest || !isUnlocked(state, id)) return { ok: false, reason: 'Complete the previous quest first.' };
  activity(state, today);
  if (state.completed.includes(id)) return { ok: true, replay: true, xp: 0, coins: 0, achievements: unlockAchievements(state) };
  state.completed.push(id); state.xp += quest.xp; state.coins += quest.coins;
  return { ok: true, replay: false, xp: quest.xp, coins: quest.coins, achievements: unlockAchievements(state) };
}
export function meetVillager(state, id) {
  if (!villagers.some(villager => villager.id === id)) return { ok: false, reason: 'Villager not found.' };
  const first = !state.metVillagers.includes(id);
  if (first) state.metVillagers.push(id);
  return { ok: true, first, friendship: friendship(state, id) };
}
// The caller runs the Python checks before committing the submitted source here,
// just as campaign completion follows a successful quiz or Python result.
export function completeProject(state, id, code, today = dateKey()) {
  const project = projects.find(item => item.id === id);
  if (!project || !projectUnlocked(state, id)) return { ok: false, reason: 'Finish the required lessons and the previous village project first.' };
  if (typeof code !== 'string' || !code.trim() || code.length > 30000) return { ok: false, reason: 'Run a project solution of up to 30,000 characters first.' };
  activity(state, today);
  meetVillager(state, project.npc);
  state.projectCode[id] = code;
  const replay = state.projects.includes(id);
  if (!replay) { state.projects.push(id); state.xp += project.xp; state.coins += project.coins; }
  return { ok: true, replay, xp: replay ? 0 : project.xp, coins: replay ? 0 : project.coins, achievements: unlockAchievements(state), project, friendship: friendship(state, project.npc) };
}
export function completeDaily(state, today = dateKey()) {
  if (state.daily.includes(today)) return { ok: false, reason: 'Today’s reward has already been collected.' };
  state.daily.push(today); state.daily = state.daily.slice(-400); state.xp += 50; state.coins += 25; activity(state, today);
  return { ok: true, xp: 50, coins: 25, achievements: unlockAchievements(state) };
}
export function adoptPet(state, id) {
  const pet = pets.find(p => p.id === id);
  if (!pet) return { ok: false, reason: 'Companion not found.' };
  if (state.owned.includes(id)) { state.equipped = id; return { ok: true, equipped: true, achievements: [] }; }
  if (state.completed.length < pet.required) return { ok: false, reason: `Complete ${pet.required} quests to meet ${pet.name}.` };
  if (!havenHelpComplete(state, pet)) return { ok: false, reason: `Help ${pet.name} with “${pet.helpTitle}” at the Companion Haven first.` };
  if (state.coins < pet.cost) return { ok: false, reason: `You need ${pet.cost - state.coins} more coins.` };
  state.coins -= pet.cost; state.owned.push(id); state.equipped = id; state.petCare = normalizePetCare(state.petCare, state.owned);
  return { ok: true, equipped: false, achievements: unlockAchievements(state) };
}
