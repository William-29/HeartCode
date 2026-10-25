const done=(state,id)=>state.neighbours?.completed?.includes(id)===true;
const badge=(id,name,description,coins,projects)=>({id,name,description,coins,icon:'book',test:s=>projects.every(p=>done(s,p)),progress:s=>[projects.filter(p=>done(s,p)).length,projects.length]});
export const understandingAchievements = [
  badge('understanding-edge','Room for an empty basket','Write tests that accept correct tills and catch empty, partial and fractional-total faults.',70,['bench-baskets']),
  badge('understanding-boundary','The last copy matters','Catch the lending latch’s equality, zero and negative-request mistakes with your own assertions.',90,['bench-boundaries']),
  badge('understanding-evidence','Keep the seal intact','Write tests that expose label leakage and misleading evaluation reports.',180,['bench-sealed']),
  badge('understanding-connections','Built on promises kept','Connect the saved bakery planner and lending desk into working neighborhood services.',180,['rowan-shared-oven','mira-library-round']),
  badge('understanding-rooms','Every corner counts','Compare heater trials using both pooled error and a guard for every room.',220,['elio-heater-review'])
];
