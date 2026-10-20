// These bounds match village-signs.css in the scene's 1000 x 650 coordinates.
export const SIGN_WIDTH = 160, SIGN_HEIGHT = 68;
export const isNeighbour = place => ['rowan', 'mira', 'elio'].includes(place.id);
export const signBounds = place => ({left:place.x-SIGN_WIDTH/2,top:place.y-SIGN_HEIGHT,right:place.x+SIGN_WIDTH/2,bottom:place.y});
export const overlaps = (a,b,gap=6) => a.left < b.right+gap && a.right+gap > b.left && a.top < b.bottom+gap && a.bottom+gap > b.top;
const inside = r => r.left>=10 && r.right<=990 && r.top>=10 && r.bottom<=640;
const box = (x,y,w,h) => ({left:x-w/2,right:x+w/2,top:y,bottom:y+h});

export function cluePositions(clues, places) {
  const occupied=places.filter(p=>!isNeighbour(p)).map(signBounds), result={};
  for (const clue of clues) {
    const candidates=[[0,0],[0,42],[42,0],[-42,0],[0,-42],[0,58],[58,0],[-58,0],[0,-58],[42,42],[-42,42]];
    for (const [dx,dy] of candidates) {
      const bounds=box(clue.x+dx,clue.y+dy-13,26,26);
      if (!inside(bounds)||occupied.some(r=>overlaps(bounds,r))) continue;
      result[clue.id]={x:clue.x+dx,y:clue.y+dy,bounds};occupied.push(bounds);break;
    }
  }
  return result;
}

export function neighbourNameplates(places, clues=[]) {
  const occupied=places.filter(p=>!isNeighbour(p)).map(signBounds);
  occupied.push(...Object.values(cluePositions(clues,places)).map(c=>c.bounds));
  const neighbours=places.filter(isNeighbour), result={};
  for (const person of neighbours) {
    const others=neighbours.filter(p=>p.id!==person.id).map(p=>box(p.x,p.y-68,56,68));
    const candidates=[[0,5],[0,-94],[-68,5],[68,5],[0,31],[-68,-26],[68,-26],[0,-120]];
    result[person.id]={x:0,y:5,hidden:true};
    for (const [dx,dy] of candidates) {
      const bounds=box(person.x+dx,person.y+dy,64,20);
      if (!inside(bounds)||[...occupied,...others].some(r=>overlaps(bounds,r))) continue;
      result[person.id]={x:dx,y:dy,hidden:false,bounds};occupied.push(bounds);break;
    }
  }
  return result;
}
