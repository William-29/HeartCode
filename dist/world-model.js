import { quests } from './content.js';

export const WORLD_WIDTH = 4800;
export const WORLD_HEIGHT = 1067;
export const regions = [
  { name: 'Hearthwood Tavern', short: 'The tavern', icon: 'home', mood: 'A warm welcome', description: 'Lanterns glow. The kettle sings. Your first Python spells begin beside the hearth.', label: [195, 715], color: 'gold' },
  { name: 'Sunmeadow Fields', short: 'The fields', icon: 'leaf', mood: 'Golden afternoon', description: 'Follow the wildflowers through sunlit fields, learning logic with every little step.', label: [690, 760], color: 'green' },
  { name: 'The Copper Fox', short: 'The pub', icon: 'home', mood: 'Good company ahead', description: 'A bustling country pub, a market full of ingredients, and a few delightfully messy datasets.', label: [1285, 970], color: 'rose' },
  { name: 'Moonwater Lake', short: 'The lake', icon: 'spark', mood: 'Ripples of possibility', description: 'Cross the still water and discover what artificial intelligence can—and cannot—do.', label: [1230, 365], color: 'blue' },
  { name: 'Glimmerwood Forest', short: 'The forest', icon: 'leaf', mood: 'A little wild magic', description: 'Luminous mushrooms light the way. Look closer: there are patterns hidden in the trees.', label: [455, 390], color: 'purple' },
  { name: 'Starfall Peaks', short: 'The peaks', icon: 'trophy', mood: 'Your legend awaits', description: 'Past the mist and crystal stones, forge your first model and reach the adventurers’ guild.', label: [1070, 105], color: 'blue' },
  { name: 'The Guild Workshop', short: 'The workshop', icon: 'code', mood: 'The adventure grows', description: 'The guild doors open onto a much wider world. Craft reliable Python before setting out again.', label: [1480, 115], color: 'gold' },
  { name: 'Ledgerbrook Market', short: 'The market', icon: 'database', mood: 'Stories in every ledger', description: 'Cross the trading town with JSON records, CSV shipments, and a merchant’s messy ledger.', label: [2070, 875], color: 'green' },
  { name: 'The Statistician’s Garden', short: 'The garden', icon: 'leaf', mood: 'A thoughtful little detour', description: 'Among orchards and winding garden paths, discover variation, probability, and careful conclusions.', label: [1950, 235], color: 'green' },
  { name: 'The Glasshouse', short: 'The glasshouse', icon: 'flask', mood: 'Prepare with care', description: 'The alchemist’s plants thrive on well-prepared data. Keep tomorrow’s answers out of today’s training.', label: [2350, 125], color: 'blue' },
  { name: 'The Sentinel Gates', short: 'The gates', icon: 'network', mood: 'Every mistake tells a story', description: 'Help the sentinels understand false alarms, missed threats, and the tradeoffs of a decision.', label: [3000, 140], color: 'rose' },
  { name: 'Modelmaker Valley', short: 'The valley', icon: 'flask', mood: 'Build, compare, improve', description: 'Watermills turn and models take shape. Test neighbors, penalties, and fair comparisons.', label: [3100, 355], color: 'gold' },
  { name: 'The Neural Observatory', short: 'The observatory', icon: 'spark', mood: 'A new mind takes shape', description: 'Under the crystal dome, assemble a neuron, measure its loss, and teach it from examples.', label: [3370, 975], color: 'purple' },
  { name: 'The Whispering Archives', short: 'The archives', icon: 'book', mood: 'Seek evidence among the scrolls', description: 'Search the lakeside library with text vectors, similarity, and a healthy respect for trustworthy sources.', label: [3970, 390], color: 'blue' },
  { name: 'The Master’s Summit', short: 'The summit', icon: 'trophy', mood: 'Put your learning together', description: 'The final mountain trail brings training, validation, and honest reporting into one complete project.', label: [4510, 100], color: 'gold' }
];

// Preserve the original route, then continue past the guild to the final academy.
export const stops = [
  [180, 825], [270, 920], [365, 860], [420, 790],
  [530, 850], [660, 930], [770, 850], [900, 875],
  [1045, 920], [1190, 870], [1380, 880], [1510, 750],
  [1470, 615], [1450, 495], [1370, 410], [1210, 365],
  [1040, 430], [860, 470], [725, 415], [745, 330],
  [700, 245], [840, 210], [1020, 210], [1180, 200],
  [1300, 170], [1500, 220], [1620, 310], [1700, 390],
  [1780, 520], [1900, 650], [2100, 760], [2300, 800],
  [2400, 650], [2220, 540], [2100, 380], [2070, 270],
  [2180, 240], [2320, 210], [2430, 240], [2550, 300],
  [2700, 240], [2860, 230], [3020, 220], [3160, 280],
  [3210, 410], [3140, 520], [2980, 610], [3060, 710],
  [3200, 830], [3380, 880], [3500, 790], [3590, 700],
  [3720, 640], [3850, 530], [3990, 510], [4130, 600],
  [4280, 560], [4430, 450], [4540, 330], [4550, 200],
  [4640, 160]
].map(([x, y]) => ({ x, y }));

export function regionForStop(index) { return regions[Math.floor(Math.max(0, Math.min(quests.length - 1, index)) / 4)]; }
export function positionForProgress(completed) { return stops[Math.max(0, Math.min(quests.length, Math.floor(Number(completed) || 0)))]; }
export function travelForCompletion(questId, result) {
  const from = quests.findIndex(q => q.id === questId);
  if (from < 0 || !result.ok || result.replay) return null;
  return { from, to: from + 1, newRegion: from < quests.length - 1 && Math.floor(from / 4) !== Math.floor((from + 1) / 4), final: from === quests.length - 1 };
}
export function legControlPoints(index) {
  if (!Number.isInteger(index) || index < 0 || index >= stops.length - 1) throw new RangeError('Unknown journey leg.');
  const a = stops[Math.max(0, index - 1)], b = stops[index], c = stops[index + 1], d = stops[Math.min(stops.length - 1, index + 2)];
  return [b, { x: b.x + (c.x - a.x) / 6, y: b.y + (c.y - a.y) / 6 }, { x: c.x - (d.x - b.x) / 6, y: c.y - (d.y - b.y) / 6 }, c];
}
export function pointOnLeg(index, progress) {
  const [a, b, c, d] = legControlPoints(index), t = Math.max(0, Math.min(1, progress)), u = 1 - t;
  return { x: u**3*a.x + 3*u*u*t*b.x + 3*u*t*t*c.x + t**3*d.x, y: u**3*a.y + 3*u*u*t*b.y + 3*u*t*t*c.y + t**3*d.y };
}
export function legPath(index) {
  const [a, b, c, d] = legControlPoints(index);
  return `M ${a.x} ${a.y} C ${b.x} ${b.y}, ${c.x} ${c.y}, ${d.x} ${d.y}`;
}
