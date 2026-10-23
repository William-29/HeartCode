// Places share a home, even when their activities use separate screens.
export const placeParents = { shelter:'companions', observatory:'village', wardrobe:'room', adventures:'village', courtyard:'village', shared:'village', lake:'village', clockwork:'village', apprentices:'tavern', discoveries:'companions' };
export const villagePlaces = [
  {route:'observatory',name:'Observatory',image:'willowmere-observatory.png',host:'Stargaze with Elio'},
  {route:'shelter',name:'Animal haven',image:'animal-haven.png',host:'Care for animals with Rowan'},
  {route:'clockwork',name:'Clockmaker',image:'clockmaker-workshop.png',host:'Repair keepsakes with Mira'},
  {route:'lake',name:'Willowmere Lake',image:'willowmere-lake.png',host:'Fish and keep observations'},
  {route:'courtyard',name:'Restoration square',image:'founders-court-restored.png',host:'Restore buildings and exhibit projects'},
  {route:'adventures',name:'High Street',image:'hearthwick-evening.png',host:'Mysteries, shop, trains and garden'}
];
export function villagePostcards(current='') {
  return villagePlaces.map(p=>`<a class="place-postcard" href="#${p.route}" ${current===p.route?'aria-current="page"':''} aria-label="${p.name}: ${p.host}"><img src="assets/${p.image}" alt=""><span>${p.name}</span></a>`).join('');
}
export const routeFromHash = hash => hash.replace(/^#/, '').split('/')[0] || 'village';
export const parentPlace = route => placeParents[route] || route;
export function placeNavigation(route, routes) {
  const featured=new Set(villagePlaces.map(p=>p.route));
  return `<div class="place-navigation"><div class="breadcrumb"><a href="#village">Hearthwick</a><span>/</span><strong>${routes[route][0]}</strong></div><details class="nearby-places places-directory"><summary>Places <span aria-hidden="true">&#8964;</span></summary><nav aria-label="Travel directly to any place"><p>Where would you like to go?</p><div class="directory-pictures">${villagePostcards(route)}</div><div class="directory-links">${Object.entries(routes).filter(([id])=>!featured.has(id)).map(([id,[name]])=>`<a href="#${id}" ${route===id?'aria-current="page"':''}>${name}</a>`).join('')}<a class="exhibition-direction" href="#courtyard/exhibition">Project exhibition</a></div></nav></details></div>`;
}
export function roomNavigation(active) {
  return `<nav class="room-navigation" aria-label="Your room"><a href="#room" ${active==='room'?'aria-current="page"':''}>Your room</a><a href="#wardrobe" ${active==='wardrobe'?'aria-current="page"':''}>Wardrobe</a></nav>`;
}
