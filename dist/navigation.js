// Places share a home, even when their activities use separate screens.
export const placeParents = { wardrobe:'room', adventures:'village', courtyard:'village', shared:'village', lake:'village', clockwork:'village', apprentices:'tavern', discoveries:'companions' };
const nearby = {
  village:['adventures','courtyard','clockwork','lake','room'],
  tavern:['apprentices','practice','quests','festival'],
  quests:['practice','tavern','village'], practice:['quests','apprentices','clockwork'],
  room:['wardrobe','companions','achievements','village'], wardrobe:['room','companions','courtyard'],
  companions:['discoveries','lake','room'], discoveries:['companions','village','clockwork'],
  courtyard:['shared','adventures','village'], shared:['courtyard','apprentices','village'],
  apprentices:['tavern','practice','shared'], lake:['companions','adventures','village'],
  clockwork:['discoveries','practice','village'], adventures:['courtyard','lake','village'],
  festival:['tavern','courtyard','room'], achievements:['room','quests','wardrobe']
};
export const routeFromHash = hash => hash.replace(/^#/, '').split('/')[0] || 'village';
export const parentPlace = route => placeParents[route] || route;
export function placeNavigation(route, routes) {
  const parent = placeParents[route];
  return `<div class="place-navigation"><div class="breadcrumb"><a href="#village">Hearthwick</a><span>/</span>${parent && parent !== 'village' ? `<a href="#${parent}">${routes[parent][0]}</a><span>/</span>` : ''}<strong>${routes[route][0]}</strong></div><details class="nearby-places"><summary>Nearby <span aria-hidden="true">⌄</span></summary><nav aria-label="Nearby places"><p>A little further along...</p>${(nearby[route] || ['village']).map(id=>`<a href="#${id}">${routes[id][0]}<span aria-hidden="true">→</span></a>`).join('')}<a class="exhibition-direction" href="#courtyard/exhibition">The makers’ exhibition <span aria-hidden="true">→</span></a></nav></details></div>`;
}
export function roomNavigation(active) {
  return `<nav class="room-navigation" aria-label="Your room"><a href="#room" ${active==='room'?'aria-current="page"':''}>Your room</a><a href="#wardrobe" ${active==='wardrobe'?'aria-current="page"':''}>Wardrobe</a></nav>`;
}
