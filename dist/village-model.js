// Coordinates describe the ground beneath each character's feet, not its sprite.
export const VILLAGE_WIDTH = 1000;
export const VILLAGE_HEIGHT = 650;
export const VILLAGE_START = Object.freeze({ x: 500, y: 460 });
export const WALK_SPEED = 150;
export const destinations = Object.freeze([
  { id: 'rowan', name: 'Rowan', place: 'The Hearth & Honey', hint: 'Stories & tavern projects', x: 270, y: 340, icon: 'home', color: 'coral' },
  { id: 'mira', name: 'Mira', place: 'The Tinker’s Workshop', hint: 'Playful Python projects', x: 675, y: 333, icon: 'spark', color: 'lavender' },
  { id: 'elio', name: 'Elio', place: 'Willowmere Lake', hint: 'Curious little AI experiments', x: 350, y: 500, icon: 'leaf', color: 'blue' },
  { id: 'workbench', name: 'Your workbench', place: 'The open-air workshop', hint: 'Practice & build freely', x: 840, y: 375, icon: 'code', color: 'gold' },
  { id: 'companions', name: 'Companion garden', place: 'A place for little friends', hint: 'Meet & choose your pet', x: 825, y: 555, icon: 'paw', color: 'green' },
  { id: 'trail', name: 'The learning trail', place: 'Beyond the village', hint: 'Continue your learning journey', x: 500, y: 100, icon: 'map', color: 'green' },
  { id: 'room', name: 'Your room', place: 'Above the tavern', hint: 'Decorate & display your keepsakes', x: 160, y: 310, icon: 'home', color: 'coral' },
  { id: 'cafe', name: 'A quiet table', place: 'The café terrace', hint: 'Take a little break with your pet', x: 385, y: 390, icon: 'clock', color: 'gold' },
  { id: 'festival', name: 'The lantern festival', place: 'The village green', hint: 'Help prepare & try your creations', x: 600, y: 535, icon: 'spark', color: 'gold' },
  { id: 'highstreet', name: 'High Street', place: 'The station & market lane', hint: 'Mysteries, your shop, train trips & the learning garden', x: 600, y: 185, icon: 'book', color: 'gold' },
  { id: 'courtyard', name: 'Founders’ Court', place: 'The old village square', hint: 'Restore beloved places & exhibit your working projects', x: 775, y: 465, icon: 'home', color: 'coral' },
  { id: 'lakeside', name: 'The lakeside path', place: 'Willowmere jetty', hint: 'Fish with your pet & learn from your observations', x: 355, y: 590, icon: 'leaf', color: 'blue' },
  { id: 'apprentices', name: 'The learning table', place: 'Nell & Kit at the tavern', hint: 'Teach a little Python over a warm cup of tea', x: 390, y: 285, icon: 'book', color: 'gold' },
  { id: 'clockwork', name: 'The clockmaker', place: 'Mira’s repair bench', hint: 'Mend clocks and a remembered music box', x: 740, y: 292, icon: 'clock', color: 'gold' },
  { id: 'discoveries', name: 'Companion discoveries', place: 'Little detours together', hint: 'Follow clues your pet has noticed', x: 540, y: 615, icon: 'paw', color: 'green' }
]);

const solidRects = [
  { left: 30, right: 390, top: 0, bottom: 265 },
  { left: 660, right: 970, top: 0, bottom: 275 }
];
const solidEllipses = [
  { x: 184, y: 493, rx: 150, ry: 102 },
  { x: 500, y: 318, rx: 60, ry: 38 },
  { x: 930, y: 382, rx: 29, ry: 31 }
];

export function isWalkable(point) {
  if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return false;
  if (point.x < 30 || point.x > 970 || point.y < 70 || point.y > 620) return false;
  if (solidRects.some(rect => point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom)) return false;
  return !solidEllipses.some(shape => ((point.x - shape.x) / shape.rx) ** 2 + ((point.y - shape.y) / shape.ry) ** 2 <= 1);
}

export function segmentWalkable(from, to) {
  const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 4));
  for (let step = 0; step <= steps; step++) {
    if (!isWalkable({ x: from.x + (to.x - from.x) * step / steps, y: from.y + (to.y - from.y) * step / steps })) return false;
  }
  return true;
}

const grid = [];
const gridByKey = new Map();
for (let row = 0; row < 28; row++) for (let col = 0; col < 48; col++) {
  const node = { x: 30 + col * 20, y: 70 + row * 20, col, row, key: `${col},${row}` };
  if (isWalkable(node)) { grid.push(node); gridByKey.set(node.key, node); }
}
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function normalizePosition(position) {
  if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) return { ...VILLAGE_START };
  const clamped = { x: Math.min(970, Math.max(30, position.x)), y: Math.min(620, Math.max(70, position.y)) };
  if (isWalkable(clamped)) return clamped;
  let nearest = grid[0];
  for (const point of grid) if (distance(point, clamped) < distance(nearest, clamped)) nearest = point;
  return { x: nearest.x, y: nearest.y };
}

function anchorFor(point) {
  let best = null, score = Infinity;
  for (const candidate of grid) {
    const candidateScore = distance(candidate, point);
    if (candidateScore < score && segmentWalkable(point, candidate)) { best = candidate; score = candidateScore; }
  }
  return best;
}

// A small deterministic A* grid keeps clicks from taking the player through roofs
// or the lake. Line-of-sight smoothing makes the final walk feel less grid-bound.
export function findRoute(from, target) {
  const start = normalizePosition(from), finish = normalizePosition(target);
  if (segmentWalkable(start, finish)) return [start, finish];
  const source = anchorFor(start), goal = anchorFor(finish);
  if (!source || !goal) return [];
  const open = new Set([source.key]), closed = new Set(), previous = new Map();
  const costs = new Map([[source.key, 0]]);
  while (open.size) {
    let key, best = Infinity;
    for (const candidateKey of open) {
      const score = costs.get(candidateKey) + distance(gridByKey.get(candidateKey), goal);
      if (score < best) { key = candidateKey; best = score; }
    }
    const current = gridByKey.get(key);
    if (key === goal.key) {
      const points = [finish]; let cursor = goal;
      while (cursor) { points.unshift({ x: cursor.x, y: cursor.y }); cursor = gridByKey.get(previous.get(cursor.key)); }
      points.unshift(start);
      const route = [start]; let index = 0;
      while (index < points.length - 1) {
        let next = points.length - 1;
        while (next > index + 1 && !segmentWalkable(points[index], points[next])) next--;
        route.push(points[next]); index = next;
      }
      return route;
    }
    open.delete(key); closed.add(key);
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, 1], [-1, -1]]) {
      const neighbor = gridByKey.get(`${current.col + dx},${current.row + dy}`);
      if (!neighbor || closed.has(neighbor.key) || !segmentWalkable(current, neighbor)) continue;
      const cost = costs.get(key) + distance(current, neighbor);
      if (cost >= (costs.get(neighbor.key) ?? Infinity)) continue;
      previous.set(neighbor.key, key); costs.set(neighbor.key, cost); open.add(neighbor.key);
    }
  }
  return [];
}

export function moveBy(position, dx, dy) {
  let result = normalizePosition(position);
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 4));
  if (!Number.isFinite(steps)) return result;
  for (let step = 0; step < steps; step++) {
    const next = { x: result.x + dx / steps, y: result.y + dy / steps };
    if (isWalkable(next)) result = next;
    else if (isWalkable({ x: next.x, y: result.y })) result.x = next.x;
    else if (isWalkable({ x: result.x, y: next.y })) result.y = next.y;
  }
  return result;
}

export function advanceRoute(position, route, distanceToWalk) {
  let current = { ...position }, remaining = route.map(point => ({ ...point }));
  let budget = Math.max(0, Number.isFinite(distanceToWalk) ? distanceToWalk : 0);
  while (remaining.length && budget >= 0) {
    const goal = remaining[0], length = distance(current, goal);
    if (length <= budget) { current = goal; remaining.shift(); budget -= length; }
    else { current = { x: current.x + (goal.x - current.x) * budget / length, y: current.y + (goal.y - current.y) * budget / length }; break; }
  }
  return { position: current, route: remaining, arrived: remaining.length === 0 };
}

export function nearbyDestination(position, radius = 65, places = destinations) {
  return places.filter(place => distance(position, place) <= radius).sort((a, b) => distance(position, a) - distance(position, b))[0] || null;
}
