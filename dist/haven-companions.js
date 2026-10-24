// Stable IDs retain old Haven stories while each visitor joins the main pet system.
export const havenCompanions = [
  {id:'moss',name:'Moss',species:'Mosslight sprite',color:'green',cost:90,required:0,helpProject:'shelter-pantry',helpTitle:'A bowl with every name',rarity:'A HAVEN FRIEND',quiet:true,space:1,time:1,food:'dewberries',portions:2,
    story:'Rowan found Moss sheltering inside a cracked flowerpot after the greenhouse path flooded. The little sprout’s glow returns when familiar voices gather near. Help Rowan prepare a dependable pantry, and Moss will be ready to choose a travelling friend.',
    description:'A shy woodland sprout whose soft glow brightens with good company.',quote:'A small beginning can grow into something lovely.'},
  {id:'bramble',name:'Bramble',species:'Autumn hedgehog',color:'gold',cost:240,required:8,helpProject:'shelter-round',helpTitle:'The morning and evening round',rarity:'A HAVEN FRIEND',quiet:false,space:2,time:3,food:'seedcakes',portions:3,
    story:'Bramble once carried fallen leaves to the old bakery doorstep. When its shutters closed, he lost his familiar morning round. Give the haven a steady care schedule so this little leaf-backed wanderer can feel settled again.',
    description:'A round forest spirit with amber leaves in place of prickles and a fondness for bakery windows.',quote:'One small task, then a warm place to rest.'},
  {id:'clover',name:'Clover',species:'Moonbeam moth',color:'purple',cost:420,required:18,helpProject:'shelter-match',helpTitle:'A recommendation is an invitation',rarity:'A HAVEN FRIEND',quiet:true,space:2,time:2,food:'moonnectar',portions:2,
    story:'Clover followed the festival lanterns down from the mist garden. Loud, crowded corners make her pale wings fold away. Build a thoughtful introduction helper that respects each visitor’s needs; then Rowan can prepare her quiet travelling nest with you.',
    description:'A velvet-winged moth with soft moon markings who rests beside the gentlest lantern.',quote:'Leave a little room for what you do not know yet.'}
];
export function havenHelpComplete(state, companion) {
  return !companion.helpProject || state.neighbours?.completed?.includes(companion.helpProject) === true;
}
