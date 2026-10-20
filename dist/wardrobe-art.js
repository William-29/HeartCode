// Each layer comes from a painted atlas with a shared fitting plane.
// Source images stay intact. SVG viewBoxes select the measured source regions.
const sheets={
  bodies:{src:'assets/hearthwick-outfits.png',w:1774,h:887},
  heads:{src:'assets/hearthwick-hairstyles.png',w:2172,h:724},
  knit:{src:'assets/hearthwick-knitwear.png',w:2172,h:724}
};
const bodyCrops={rust:[130,112,460,750],moss:[668,112,460,750],apron:[1228,112,460,750]};
const headCrops={cap:[70,8,660,680],waves:[747,8,660,680],braid:[1435,8,660,710]};
const scarfCrops={cream:[30,30,560,660],ember:[585,30,560,660],sage:[1130,30,560,660]};
function piece(sheet,crop,place,extra=''){
  const asset=sheets[sheet];
  return `<svg x="${place[0]}" y="${place[1]}" width="${place[2]}" height="${place[3]}" viewBox="${crop.join(' ')}" preserveAspectRatio="none" overflow="hidden" ${extra}><image href="${asset.src}" width="${asset.w}" height="${asset.h}"/></svg>`;
}
export function dressedArt(look={},portrait=false){
  return `<svg class="dressed-character-art" viewBox="${portrait?'65 0 285 285':'0 0 400 900'}" aria-hidden="true" focusable="false">${wardrobeLayers(look).map(layer=>piece(layer.sheet,layer.crop,layer.place)).join('')}</svg>`;
}
export function wardrobeLayers(look={}){
  const outfit=bodyCrops[look.outfit]?look.outfit:'rust',hair=headCrops[look.hair]?look.hair:'cap';
  const scarf=look.scarf==='none'?'none':scarfCrops[look.scarf]?look.scarf:'cream';
  return [
    {sheet:'bodies',crop:bodyCrops[outfit],place:[0,215,400,670]},
    {sheet:'heads',crop:headCrops[hair],place:[83,0,240,hair==='braid'?258:248]},
    ...(scarf!=='none'?[{sheet:'knit',crop:scarfCrops[scarf],place:[83,186,218,257]}]:[]),
    ...(look.accessory==='swallow'?[{sheet:'knit',crop:[1680,160,450,390],place:[112,302,49,42]}]:[])
  ].map(layer=>({...layer,src:sheets[layer.sheet].src}));
}
export function wardrobeSwatch(slot,id){
  if(slot==='hair')return `<svg viewBox="0 0 110 110" aria-hidden="true">${piece('heads',headCrops[id]||headCrops.cap,[0,0,110,110])}</svg>`;
  if(slot==='outfit')return `<svg viewBox="0 0 100 140" aria-hidden="true">${piece('bodies',bodyCrops[id]||bodyCrops.rust,[7,0,86,140])}</svg>`;
  if(slot==='scarf'&&scarfCrops[id])return `<svg viewBox="0 0 110 130" aria-hidden="true">${piece('knit',scarfCrops[id],[0,0,110,130])}</svg>`;
  if(slot==='accessory'&&id==='swallow')return `<svg viewBox="0 0 110 100" aria-hidden="true">${piece('knit',[1680,160,450,390],[0,0,110,100])}</svg>`;
  return '<span class="plain-garment" aria-hidden="true">—</span>';
}
