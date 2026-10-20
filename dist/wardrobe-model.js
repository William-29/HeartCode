export const wardrobeItems = [
  {id:'cap',slot:'hair',name:'The familiar cap',description:'Your old tweed cap, soft from many journeys.',requirement:'Already yours',test:()=>true},
  {id:'waves',slot:'hair',name:'A little windswept',description:'Soft chestnut waves, with the cap left on its hook.',requirement:'Complete 4 trail quests',test:s=>s.completed.length>=4},
  {id:'braid',slot:'hair',name:'A gardener’s braid',description:'Elio shows you how to keep your hair clear of seedlings. A simple linen ribbon holds it.',requirement:'Complete Elio’s first village project',test:s=>s.projects.includes('project-plant-adviser')},
  {id:'rust',slot:'outfit',name:'The traveller’s coat',description:'Rust tweed, a familiar satchel, and boots that know the lane.',requirement:'Already yours',test:()=>true},
  {id:'moss',slot:'outfit',name:'June’s moss cardigan',description:'Mended wool, warm brass buttons, and sleeves ready for the potting bench.',requirement:'Reopen June’s Glasshouse',test:s=>s.restoration.opened.includes('greenhouse')},
  {id:'apron',slot:'outfit',name:'Mabel’s indigo apron',description:'Rowan has let out the ties and stitched your initials inside the pocket.',requirement:'Reopen Mabel’s Bakery',test:s=>s.restoration.opened.includes('bakery')},
  {id:'none',slot:'scarf',name:'An open collar',description:'For an afternoon when the sun reaches the courtyard.',requirement:'Already yours',test:()=>true},
  {id:'cream',slot:'scarf',name:'The oatmeal scarf',description:'The familiar soft knit you brought to Hearthwick.',requirement:'Already yours',test:()=>true},
  {id:'ember',slot:'scarf',name:'Rowan’s hearth scarf',description:'Rust-coloured wool with cream stripes, knitted for someone who kept the pantry running.',requirement:'Complete both of Rowan’s village projects',test:s=>['project-tavern-bill','project-pantry-ledger'].every(id=>s.projects.includes(id))},
  {id:'sage',slot:'scarf',name:'The leaf-stitched scarf',description:'Elio stitched a small golden sprig into the wool after your second project together.',requirement:'Complete both of Elio’s village projects',test:s=>['project-plant-adviser','project-lantern-predictor'].every(id=>s.projects.includes(id))},
  {id:'none',slot:'accessory',name:'A plain lapel',description:'The coat is lovely just as it is.',requirement:'Already yours',test:()=>true},
  {id:'swallow',slot:'accessory',name:'The library swallow',description:'A little worn brass bird, given to those who help stories find their way home.',requirement:'Reopen the Lantern Library',test:s=>s.restoration.opened.includes('library')}
];
export const wardrobeSlots={hair:'Hair & hats',outfit:'Warm outfits',scarf:'Scarves',accessory:'Keepsakes'};
export function freshWardrobe(){return {hair:'cap',outfit:'rust',scarf:'cream',accessory:'none'};}
export function itemUnlocked(state,item){return !!item&&item.test({...state,projects:state.projects||[],restoration:state.restoration||{opened:[]}});}
export function normalizeWardrobe(value,state){
  const result=freshWardrobe();
  for(const slot of Object.keys(result)){
    const item=wardrobeItems.find(i=>i.slot===slot&&i.id===value?.[slot]);
    if(itemUnlocked(state,item))result[slot]=item.id;
  }
  return result;
}
export function wear(state,slot,id){
  const item=wardrobeItems.find(i=>i.slot===slot&&i.id===id);
  if(!itemUnlocked(state,item))return false;
  state.wardrobe[slot]=id;return true;
}
export const wardrobeCount=state=>wardrobeItems.filter(i=>itemUnlocked(state,i)).length;
