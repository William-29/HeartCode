import { shelterAnimals, shelterHomes } from './haven-content.js';
export const skyConditions=['clear','hazy','cloudy'];
export const freshHaven=()=>({sky:'clear',skyVisits:0,skyObservations:[],introductions:{}});
export function homeSuitable(animal,home){return !!animal&&!!home&&home.space>=animal.space&&home.time>=animal.time&&(!animal.quiet||home.quiet);}
export function arrangeIntroduction(state,animalId,homeId){
  if(!state.neighbours.completed.includes('shelter-match'))return false;
  const animal=shelterAnimals.find(a=>a.id===animalId),home=shelterHomes.find(h=>h.id===homeId);
  if(!homeSuitable(animal,home))return false;
  state.neighbours.introductions[animalId]=homeId;return true;
}
export function observeSky(state,random=Math.random){
  const n=state.neighbours;if(!n.completed.includes('sky-focus')||n.skyVisits>=10000000)return null;
  const id=++n.skyVisits,roll=Math.max(0,Math.min(.999999,random()));
  // Deliberately fictional, noisy teaching data. Every seventh visit has an
  // instrument disturbance, kept in the raw journal rather than discarded.
  const brightness=Math.round(({clear:80,hazy:55,cloudy:25}[n.sky])+(roll-.5)*20+(id%7===0?35:0));
  const row={id,sky:n.sky,brightness};n.skyObservations.push(row);n.skyObservations=n.skyObservations.slice(-120);return row;
}
export function splitSky(rows){return {train:rows.filter(r=>r.id%5!==0),test:rows.filter(r=>r.id%5===0)};}
export function normalizeHaven(value){
  const v=value||{},n=freshHaven(),seen=new Set();
  n.sky=skyConditions.includes(v.sky)?v.sky:'clear';
  n.skyObservations=(Array.isArray(v.skyObservations)?v.skyObservations:[]).filter(r=>{
    if(!Number.isSafeInteger(r?.id)||r.id<1||r.id>10000000||seen.has(r.id)||!skyConditions.includes(r.sky)||!Number.isInteger(r.brightness)||r.brightness<0||r.brightness>125)return false;
    seen.add(r.id);return true;
  }).sort((a,b)=>a.id-b.id).slice(-120).map(({id,sky,brightness})=>({id,sky,brightness}));
  n.skyVisits=Math.max(n.skyObservations.at(-1)?.id||0,Number.isSafeInteger(v.skyVisits)&&v.skyVisits>=0&&v.skyVisits<=10000000?v.skyVisits:0);
  for(const a of shelterAnimals){const h=shelterHomes.find(h=>h.id===v.introductions?.[a.id]);if(homeSuitable(a,h))n.introductions[a.id]=h.id;}
  return n;
}
const payload=v=>`__import__("json").loads(${JSON.stringify(JSON.stringify(v))})`;
export function havenExpression(state,p){
  const n=state.neighbours;
  if(p.id==='shelter-pantry')return `pantry(${payload(shelterAnimals)})`;
  if(p.id==='shelter-round')return `care_round(${payload(shelterAnimals.map(a=>({name:a.name,times:['morning','evening']})))})`;
  if(p.id==='shelter-match')return `{a["id"]: recommend(a, ${payload(shelterHomes)}) for a in ${payload(shelterAnimals)}}`;
  if(p.id==='sky-chart')return `sky_counts(${payload(n.skyObservations)})`;
  if(p.id==='sky-noise')return `brightness_summary(${payload(n.skyObservations.map(r=>r.brightness))})`;
  return p.demo;
}
export function skyPredictionSource(state,source){
  const n=state.neighbours,{train,test}=splitSky(n.skyObservations);
  if(!train.length||!test.length)throw new Error('Make a few more observations for separate training and test samples.');
  // Test brightness labels enter only after the model has made its predictions.
  return `${source}\n_train=${payload(train)}\n_skies=${payload(test.map(r=>r.sky))}\n_guesses=[predict_brightness(_train, sky) for sky in _skies]\n_next=predict_brightness(_train, ${JSON.stringify(n.sky)})\n_truth=${payload(test.map(r=>r.brightness))}\n_baseline=sum(r["brightness"] for r in _train)/len(_train)\n_report={"training":len(_train),"testing":len(_truth),"mae":sum(abs(a-b) for a,b in zip(_guesses,_truth))/len(_truth),"baseline_mae":sum(abs(_baseline-b) for b in _truth)/len(_truth),"next":_next,"predictions":_guesses,"actual":_truth}\nprint("NEIGHBOUR_RESULT:"+__import__("json").dumps(_report, allow_nan=False))`;
}
