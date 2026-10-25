import { quests } from './content.js';

export const WORLD_WIDTH = 11200;
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
  { name: 'The Master’s Summit', short: 'The summit', icon: 'trophy', mood: 'Put your learning together', description: 'An academy milestone brings training, validation, and honest reporting into one complete project.', label: [4510, 100], color: 'gold' },
  { name: 'The River Workshop', short: 'The river workshop', icon: 'code', mood: 'There is more beyond the summit', description: 'Follow the mountain stream to a paper mill where data arrives a little at a time.', label: [4950, 155], color: 'green' },
  { name: 'Pathfinder’s Crossing', short: 'The crossing', icon: 'map', mood: 'Every route has a reason', description: 'Lantern bridges connect the riverside hamlets. Learn to search for a route and account for its cost.', label: [5400, 970], color: 'gold' },
  { name: 'The Branching Orchard', short: 'The orchard', icon: 'leaf', mood: 'Let the evidence choose a branch', description: 'Among the fruit trees, learn how models split examples and why a diverse council helps.', label: [5850, 180], color: 'green' },
  { name: 'The Mist Garden', short: 'The mist garden', icon: 'flask', mood: 'Leave room for uncertainty', description: 'At the glasshouse, compare promises with outcomes and ask what your sample cannot tell you.', label: [6430, 115], color: 'blue' },
  { name: 'The Lantern Conservatory', short: 'The conservatory', icon: 'spark', mood: 'Many lanterns, one thoughtful signal', description: 'Warm windows welcome you to multiclass networks, stable calculations, and attention.', label: [6990, 975], color: 'purple' },
  { name: 'The Keeper’s Beacon', short: 'The beacon', icon: 'trophy', mood: 'Keep a careful watch', description: 'Above the harbour, connect changing data, model uncertainty, and a report your neighbours can trust.', label: [7580, 110], color: 'gold' },
  { name: 'Tidemark Dispatch', short: 'The harbour post', icon: 'database', mood: 'The beacon lights another path', description: 'Cross the old coast viaduct to a post office where every arrival deserves careful handling.', label: [8280, 875], color: 'blue' },
  { name: 'The Timekeeper’s Terraces', short: 'The terraces', icon: 'clock', mood: 'Make room for tomorrow', description: 'Water clocks and hillside gardens invite you to learn from the past without borrowing the future.', label: [8780, 130], color: 'gold' },
  { name: 'The Pattern Meadow', short: 'The meadow', icon: 'leaf', mood: 'Patterns waiting to be questioned', description: 'Gather among the flowering trees and discover what unlabeled observations can reveal.', label: [9350, 100], color: 'green' },
  { name: 'The Gradient Foundry', short: 'The foundry', icon: 'flask', mood: 'A steady hand makes a warmer home', description: 'Copper pipes and warm glass shelter a workshop for checking gradients and training a small network.', label: [9820, 925], color: 'rose' },
  { name: 'The Prism Archive', short: 'The prism archive', icon: 'book', mood: 'Choose what deserves a place', description: 'Study sequences and ranked evidence beneath a glass roof beside the ponds.', label: [10410, 925], color: 'purple' },
  { name: 'The Wayfarers’ Hall', short: 'The fellowship', icon: 'trophy', mood: 'A plan to carry home', description: 'At a welcoming ridge-top hall, bring uncertainty, resources and future consequences into one thoughtful plan.', label: [10850, 110], color: 'gold' }
];

// Keep all original quest coordinates and the academy arrival intact. The same
// continuous spline carries the traveler over the mountain pass into six new regions.
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
  [4640, 160], [4820, 280], [4960, 420], [5070, 540],
  [5140, 690], [5290, 800], [5450, 850], [5600, 720],
  [5670, 550], [5740, 400], [5880, 290], [6030, 380],
  [6180, 310], [6340, 220], [6500, 300], [6600, 450],
  [6700, 600], [6830, 750], [6980, 850], [7140, 730],
  [7300, 640], [7430, 510], [7570, 380], [7730, 250],
  [7870, 170], [8030, 290], [8210, 400], [8380, 560],
  [8500, 520], [8670, 390], [8790, 270], [8910, 230],
  [9040, 300], [9210, 250], [9380, 210], [9530, 320],
  [9650, 450], [9790, 600], [9940, 660], [10070, 550],
  [10200, 620], [10340, 750], [10490, 800], [10610, 670],
  [10730, 530], [10840, 410], [10920, 300], [11010, 230],
  [11110, 160]
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
