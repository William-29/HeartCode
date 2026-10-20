import { adventures, adventureById, trainStops, gardenBeds, heldOutBeds } from './adventure-content.js';

export function freshAdventure() {
  return { completed:[], code:{}, drafts:{}, clues:{}, theories:[], visited:[], landmarks:[], location:'home', observations:[], model:null, planting:null, visits:{} };
}
export const available = (state, item) => !!item && state.completed.length >= item.requires;
export function ready(state, item) {
  if (!available(state,item)) return false;
  const a=state.adventure;
  if (item.area==='mysteries') return (a.clues[item.id]||[]).length===item.clues.length && a.theories.includes(item.id);
  if (item.area==='garden') return a.observations.length>=4;
  if (item.area==='station') return trainStops.some(stop=>stop.task===item.id && a.location===stop.id);
  return true;
}
export function normalizeAdventure(raw, state) {
  const a=freshAdventure(), v=raw && typeof raw==='object' ? raw : {};
  const ids=(value, allowed)=>Array.isArray(value)?[...new Set(value.filter(id=>allowed.includes(id)))]:[];
  a.observations=ids(v.observations,gardenBeds.map(b=>b.id));
  const stops=trainStops.filter(s=>available(state,s));
  a.visited=ids(v.visited,stops.map(s=>s.id));
  a.landmarks=ids(v.landmarks,stops.flatMap(s=>s.landmarks.map((_,i)=>`${s.id}-${i}`)));
  a.location=a.visited.includes(v.location)?v.location:'home';
  for (const item of adventures.filter(i=>available(state,i))) {
    if(item.clues && Array.isArray(v.clues?.[item.id]) && v.clues[item.id].length) a.clues[item.id]=ids(v.clues[item.id],item.clues.map((_,i)=>i));
    for(const key of ['code','drafts']) if(typeof v[key]?.[item.id]==='string') a[key][item.id]=v[key][item.id].slice(0,30000);
  }
  a.theories=ids(v.theories,adventures.filter(i=>i.clues && a.clues[i.id]?.length===i.clues.length).map(i=>i.id));
  a.completed=ids(v.completed,adventures.filter(i=>available(state,i) && a.code[i.id]?.trim() && (i.area!=='mysteries'||a.theories.includes(i.id)) && (i.area!=='garden'||a.observations.length>=4) && (i.area!=='station'||a.visited.includes(trainStops.find(s=>s.task===i.id)?.id))).map(i=>i.id));
  if(a.completed.includes('garden-fit') && validModel(v.model,a)) a.model={slope:v.model.slope,intercept:v.model.intercept,mae:v.model.mae,baselineMae:v.model.baselineMae,samples:[...a.observations].sort()};
  if(a.model && Number.isFinite(v.planting?.hours) && v.planting.hours>=1 && v.planting.hours<=6) a.planting=plantPrediction(a.model,v.planting.hours,!!v.planting.revealed);
  for(const item of adventures.filter(i=>i.customers)) if(Number.isSafeInteger(v.visits?.[item.id]) && v.visits[item.id]>0) a.visits[item.id]=Math.min(v.visits[item.id],100000);
  return a;
}
function validModel(model,a) {
  return model && ['slope','intercept','mae','baselineMae'].every(k=>Number.isFinite(model[k])&&Math.abs(model[k])<100000)
    && model.mae>=0 && model.baselineMae>=0 && JSON.stringify(model.samples)===JSON.stringify([...a.observations].sort());
}
export function collectClue(state,id,index) {
  const item=adventureById(id);
  if(!available(state,item)||!item.clues||!Number.isInteger(index)||!item.clues[index]) return false;
  const list=state.adventure.clues[id] ||= [];
  if(!list.includes(index)) list.push(index);
  return true;
}
export function chooseTheory(state,id,index) {
  const item=adventureById(id);
  if(!available(state,item)||!item.clues || (state.adventure.clues[id]||[]).length!==item.clues.length || index!==item.answer) return false;
  if(!state.adventure.theories.includes(id)) state.adventure.theories.push(id);
  return true;
}
// Called only after the Python checker succeeds, like campaign completion.
export function finishAdventure(state,id,code) {
  const item=adventureById(id), a=state.adventure;
  if(!ready(state,item)||typeof code!=='string'||!code.trim()||code.length>30000) return {ok:false};
  const replay=a.completed.includes(id);
  a.code[id]=code; a.drafts[id]=code;
  if(id==='garden-fit') {a.model=null;a.planting=null;}
  if(!replay){a.completed.push(id);state.xp+=item.xp;state.coins+=item.coins;}
  return {ok:true,replay,xp:replay?0:item.xp,coins:replay?0:item.coins};
}
export function travel(state,id) {
  if(id!=='home'&&!available(state,trainStops.find(s=>s.id===id))) return false;
  state.adventure.location=id;
  if(id!=='home'&&!state.adventure.visited.includes(id)) state.adventure.visited.push(id);
  return true;
}
export function observe(state,id) {
  if(!gardenBeds.some(b=>b.id===id)||state.adventure.observations.includes(id)) return false;
  state.adventure.observations.push(id);state.adventure.model=null;state.adventure.planting=null;return true;
}
const marker='HEARTH_RESULT:';
export function resultValue(output) {
  const line=String(output).split('\n').findLast(line=>line.startsWith(marker));
  if(!line) throw new Error('No result was returned. Try running your creation again.');
  return JSON.parse(line.slice(marker.length));
}
export function customerSource(state,id) {
  const item=adventureById(id),a=state.adventure;
  if(!item?.customers||!a.completed.includes(id)||!a.code[id]) throw new Error('Finish this commission first.');
  const customer=item.customers[(a.visits[id]||0)%item.customers.length];
  const args=JSON.stringify(JSON.stringify(customer.args));
  return {customer, code:`${a.code[id]}\n\nimport json as _hearth_json\n_hearth_args = _hearth_json.loads(${args})\n_hearth_result = ${item.functionName}(*_hearth_args)\nprint("${marker}" + _hearth_json.dumps(_hearth_result, allow_nan=False))`};
}
export function trainingSource(state) {
  const a=state.adventure;
  if(!a.completed.includes('garden-fit')||a.observations.length<4) throw new Error('Collect four observations and complete the fitting challenge first.');
  const training=gardenBeds.filter(b=>a.observations.includes(b.id)).map(b=>[b.x,b.y]);
  // Hold-out labels are used only AFTER fitting. The player's function receives training pairs only.
  return `${a.code['garden-fit']}\n\nimport json as _hj\nimport math as _hm\n_hearth_train = ${JSON.stringify(training)}\n_m, _b = fit(_hearth_train)\nassert _hm.isfinite(_m) and _hm.isfinite(_b), "Return finite model parameters."\n_hearth_test = ${JSON.stringify(heldOutBeds.map(b=>[b.x,b.y]))}\n_error = sum(abs(y-(_m*x+_b)) for x,y in _hearth_test)/len(_hearth_test)\n_mean = sum(y for x,y in _hearth_train)/len(_hearth_train)\n_base = sum(abs(y-_mean) for x,y in _hearth_test)/len(_hearth_test)\nprint("${marker}" + _hj.dumps({"slope":_m,"intercept":_b,"mae":_error,"baselineMae":_base}, allow_nan=False))`;
}
export function keepModel(state,value) {
  const model={...value,samples:[...state.adventure.observations].sort()};
  if(!state.adventure.completed.includes('garden-fit')||!validModel(model,state.adventure)) return false;
  state.adventure.model=model;state.adventure.planting=null;return true;
}
export function plantPrediction(model,hours,revealed=false) {
  return {hours,predicted:model.slope*hours+model.intercept,actual:Math.round((2*hours+1+Math.sin(hours*2)*.4)*10)/10,revealed};
}
export function plant(state,hours) {
  if(!state.adventure.model||!Number.isFinite(hours)||hours<1||hours>6) return false;
  state.adventure.planting=plantPrediction(state.adventure.model,hours);return true;
}
