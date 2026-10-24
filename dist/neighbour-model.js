import { freshHaven, normalizeHaven, havenExpression, skyPredictionSource } from './haven-model.js';
import { neighbourProjects, neighbourProject, teachingProjects } from './neighbour-content.js';
import { restorationById } from './restoration-content.js';
import { discoveries } from './clockwork-content.js';

export const weathers=['sun','cloud','rain'];
export const shores=['reeds','jetty'];
export const fishNames=['Minnow','Perch','Tench','No catch'];
export const freshNeighbours=()=>({completed:[],code:{},drafts:{},explained:[],examples:[],observations:[],casts:0,weather:'sun',shore:'jetty',found:[],inspected:[],orders:{},...freshHaven()});
const copyCode=(value,id)=>typeof value?.[id]==='string'?value[id].slice(0,30000):'';
export function neighbourUnlocked(state,p){
  if(!p||state.completed.length<p.requires)return false;
  const n=state.neighbours;
  if(p.kind==='discovery'&&!n.found.includes(p.id))return false;
  if(p.previous&&!n.completed.includes(p.previous))return false;
  if(p.kind==='teaching'){
    const prior=teachingProjects.filter(x=>x.npc===p.npc&&x.requires<p.requires);
    if(prior.some(x=>!n.completed.includes(x.id)))return false;
  }
  if(p.buildings?.some(id=>!state.restoration.opened.includes(id)))return false;
  if(p.tools?.some(id=>!state.restoration.completed.includes(id)||!state.restoration.code[id]?.trim()))return false;
  if(p.skyRows && n.skyObservations.length<p.skyRows)return false;
  return !p.observations||n.observations.length>=p.observations;
}
export function lockReason(state,p){
  if(p.kind==='discovery'&&!state.neighbours.found.includes(p.id))return 'Follow your companion’s clue in the village first.';
  if(state.completed.length<p.requires)return `After ${p.requires} trail quests (${state.completed.length} completed).`;
  if(p.kind==='teaching'&&teachingProjects.some(x=>x.npc===p.npc&&x.requires<p.requires&&!state.neighbours.completed.includes(x.id)))return 'Finish your earlier conversation together first.';
  if(p.previous&&!state.neighbours.completed.includes(p.previous))return 'Finish the earlier project in this story first.';
  if(p.buildings?.some(id=>!state.restoration.opened.includes(id)))return `Reopen the ${p.buildings.join(', ')} in Founders’ Court first.`;
  if(p.tools?.some(id=>!state.restoration.code[id]?.trim()))return 'Revisit the restoration and save the working tools first.';
  if(p.observations&&state.neighbours.observations.length<p.observations)return `Record ${p.observations} casts (${state.neighbours.observations.length} so far).`;
  if(p.skyRows&&state.neighbours.skyObservations.length<p.skyRows)return `Record ${p.skyRows} sky observations (${state.neighbours.skyObservations.length} so far).`;
  return '';
}
export function answerTeaching(state,id,step,index){
  const p=neighbourProject(id);
  if(p?.kind!=='teaching'||!neighbourUnlocked(state,p)||!['explanation','example'].includes(step))return {ok:false};
  const correct=index===(step==='explanation'?p.answer:p.exampleAnswer),list=step==='explanation'?'explained':'examples';
  if(correct&&!state.neighbours[list].includes(id))state.neighbours[list].push(id);
  return {ok:correct,message:(step==='explanation'?p.feedback:p.exampleFeedback)[index]||'Choose an example above.'};
}
export function completeNeighbour(state,id,code){
  const p=neighbourProject(id),n=state.neighbours;
  if(!neighbourUnlocked(state,p)||typeof code!=='string'||!code.trim()||code.length>30000)return {ok:false};
  if(p.kind==='teaching'&&(!n.explained.includes(id)||!n.examples.includes(id)))return {ok:false};
  if(p.inspection&&!n.inspected.includes(id))return {ok:false};
  if(p.order&&!mechanismReady(state,p))return {ok:false};
  const replay=n.completed.includes(id);
  n.code[id]=code;
  if(!replay){n.completed.push(id);state.xp+=p.xp;state.coins+=p.coins;}
  return {ok:true,replay,xp:replay?0:p.xp,coins:replay?0:p.coins};
}
export function confidence(state,npc){return teachingProjects.filter(p=>p.npc===npc&&state.neighbours.completed.includes(p.id)).length;}
export function inspectMechanism(state,id,index){
  const p=neighbourProject(id);
  if(!p?.inspection||!neighbourUnlocked(state,p)||!Number.isInteger(index)||index<0||index>=p.choices.length)return {ok:false,message:'Choose one of the explanations.'};
  const ok=index===p.answer;if(ok&&!state.neighbours.inspected.includes(id))state.neighbours.inspected.push(id);
  return {ok,message:p.feedback[index]};
}
export function mechanismOrder(state,p){return state.neighbours.orders[p.id]||p.order?.slice().reverse()||[];}
export function mechanismReady(state,p){return !p.order||mechanismOrder(state,p).every((name,i)=>name===p.order[i]);}
export function moveMechanism(state,id,index,direction){
  const p=neighbourProject(id);if(!p?.order||state.neighbours.completed.includes(id)||!neighbourUnlocked(state,p)||!Number.isInteger(index)||![-1,1].includes(direction))return false;
  const order=mechanismOrder(state,p).slice(),to=index+direction;
  if(index<0||index>=order.length||to<0||to>=order.length)return false;
  [order[index],order[to]]=[order[to],order[index]];state.neighbours.orders[id]=order;return true;
}
export function noticeDiscoveries(state,point){
  if(!state.neighbours||!Number.isFinite(point?.x)||!Number.isFinite(point?.y))return [];
  const found=discoveries.filter(d=>!state.neighbours.found.includes(d.id)&&Math.hypot(point.x-d.x,point.y-d.y)<=45);
  state.neighbours.found.push(...found.map(d=>d.id));return found;
}
// Catch probabilities are fictional game rules, not real ecology. Every cast is
// logged, including misses. Sampling happens only on an explicit player action.
export function cast(state,random=Math.random){
  const n=state.neighbours;
  const weights=n.weather==='rain'?[.15,.2,.4,.25]:n.weather==='cloud'?[.25,.3,.2,.25]:[.4,.25,.1,.25];
  if(n.shore==='reeds'){weights[0]+=.1;weights[1]-=.1;}
  let roll=Math.max(0,Math.min(.999999,random())),index=0;
  while(index<3&&roll>=weights[index]){roll-=weights[index];index++;}
  n.casts++;
  const row={id:n.casts,weather:n.weather,shore:n.shore,catch:fishNames[index]};
  n.observations.push(row);
  // A bounded notebook keeps exports small; the running cast number persists.
  n.observations=n.observations.slice(-120);
  return row;
}
export function lakeSummary(rows){
  const counts=Object.fromEntries(fishNames.map(f=>[f,0]));
  for(const r of rows)if(Object.hasOwn(counts,r.catch))counts[r.catch]++;
  return fishNames.map(name=>({name,count:counts[name],frequency:rows.length?counts[name]/rows.length:null}));
}
export function splitObservations(rows){
  return {train:rows.filter(r=>r.id%5!==0),test:rows.filter(r=>r.id%5===0)};
}
export function normalizeNeighbours(value,state){
  const n=freshNeighbours(),v=value&&typeof value==='object'?value:{},s={...state,neighbours:n};
  Object.assign(n,normalizeHaven(v));
  n.found=discoveries.filter(d=>Array.isArray(v.found)&&v.found.includes(d.id)).map(d=>d.id);
  n.weather=weathers.includes(v.weather)?v.weather:'sun';n.shore=shores.includes(v.shore)?v.shore:'jetty';
  const seen=new Set();
  n.observations=(Array.isArray(v.observations)?v.observations:[]).filter(r=>{
    if(!Number.isSafeInteger(r?.id)||r.id<1||r.id>10000000||seen.has(r.id)||!weathers.includes(r.weather)||!shores.includes(r.shore)||!fishNames.includes(r.catch))return false;
    seen.add(r.id);return true;
  }).sort((a,b)=>a.id-b.id).slice(-120).map(r=>({id:r.id,weather:r.weather,shore:r.shore,catch:r.catch}));
  n.casts=Math.max(n.observations.at(-1)?.id||0,Number.isSafeInteger(v.casts)&&v.casts>=0&&v.casts<10000000?v.casts:0);
  for(const p of neighbourProjects){
    if(!neighbourUnlocked(s,p))continue;
    if(p.inspection&&Array.isArray(v.inspected)&&v.inspected.includes(p.id))n.inspected.push(p.id);
    if(p.order&&Array.isArray(v.orders?.[p.id])&&v.orders[p.id].length===p.order.length&&new Set(v.orders[p.id]).size===p.order.length&&v.orders[p.id].every(name=>p.order.includes(name)))n.orders[p.id]=v.orders[p.id].slice();
    if(p.kind==='teaching')for(const k of ['explained','examples'])if(Array.isArray(v[k])&&v[k].includes(p.id))n[k].push(p.id);
    const code=copyCode(v.code,p.id),draft=copyCode(v.drafts,p.id);
    if(typeof v.drafts?.[p.id]==='string')n.drafts[p.id]=draft;
    if(Array.isArray(v.completed)&&v.completed.includes(p.id)&&code.trim()&&(!p.inspection||n.inspected.includes(p.id))&&mechanismReady(s,p)&&(p.kind!=='teaching'||n.explained.includes(p.id)&&n.examples.includes(p.id))){
      n.completed.push(p.id);n.code[p.id]=code;
    }
  }
  if(!n.completed.includes('sky-focus')){n.skyObservations=[];n.skyVisits=0;}
  if(!n.completed.includes('shelter-match'))n.introductions={};
  return n;
}
// Each restored tool receives its own namespace, like a tiny Python module.
// This preserves its helpers while preventing unrelated top-level names colliding.
export function toolPrelude(state,p){
  return (p.tools||[]).map((id,i)=>{
    const item=restorationById(id),source=state.restoration.code[id];
    if(!item||!source)throw new Error('Revisit the restoration to save this tool first.');
    return `_tool_${i} = {}\nexec(${JSON.stringify(source)}, _tool_${i})\n${item.functionName} = _tool_${i}[${JSON.stringify(item.functionName)}]`;
  }).join('\n')+'\n';
}
export function projectSource(state,p,code){return toolPrelude(state,p)+code;}
export function projectChecks(p){
  if(!p.tools?.length)return p.checks;
  // Functional checks plus spies verify that shared projects actually delegate
  // to the restored functions, rather than merely imitate their output.
  const names=p.tools.map(id=>restorationById(id).functionName);
  return `${p.checks}\n_calls=[]\nfor _name in ${JSON.stringify(names)}:\n    _original=scope[_name]\n    def _spy(*args, _fn=_original, _key=_name, **kwargs):\n        _calls.append(_key)\n        return _fn(*args, **kwargs)\n    scope[_name]=_spy\nexec(${JSON.stringify(p.demo)},scope)\nassert all(name in _calls for name in ${JSON.stringify(names)}), "Call each saved restoration tool in your project."`;
}
const payload=value=>`__import__("json").loads(${JSON.stringify(JSON.stringify(value))})`;
export function workingSource(state,p){
  const source=state.neighbours.code[p.id];
  if(!source)throw new Error('Finish this project first.');
  if(p.id==='sky-predict')return skyPredictionSource(state,source);
  let expression=havenExpression(state,p);
  const rows=state.neighbours.observations;
  if(p.id==='lake-tally')expression=`tally(${payload(rows.map(r=>r.catch))})`;
  if(p.id==='lake-frequency')expression=`{fish: frequency(${payload(rows.map(r=>r.catch))}, fish) for fish in ${JSON.stringify(fishNames)}}`;
  if(p.id==='lake-predict'){
    const {train,test}=splitObservations(rows);
    if(!train.length||!test.length)throw new Error('Record more observations for a separate test set.');
    // Only weather is sent for test cases. Their labels enter the program after
    // predictions, so a model cannot accidentally train on the answers.
    return `${source}\n_training=${payload(train)}\n_weather=${payload(test.map(r=>r.weather))}\n_predictions=[predict_catch(_training,w) for w in _weather]\n_next_guess=predict_catch(_training,${JSON.stringify(state.neighbours.weather)})\n_truth=${payload(test.map(r=>r.catch))}\nfrom collections import Counter\n_counts=Counter(r["catch"] for r in _training)\n_baseline=min(_counts,key=lambda k:(-_counts[k],k))\n_report={"training_casts":len(_training),"test_casts":len(_truth),"correct":sum(a==b for a,b in zip(_predictions,_truth)),"total":len(_truth),"baseline_correct":sum(a==_baseline for a in _truth),"predictions":_predictions,"actual":_truth,"next_guess":_next_guess}\nprint("NEIGHBOUR_RESULT:"+__import__("json").dumps(_report))`;
  }
  return `${projectSource(state,p,source)}\nprint("NEIGHBOUR_RESULT:"+__import__("json").dumps(${expression}))`;
}
export function workingResult(output){
  const line=output.split('\n').filter(x=>x.startsWith('NEIGHBOUR_RESULT:')).at(-1);
  if(!line)throw new Error('The tool did not return a report. Check its saved Python.');
  return JSON.parse(line.slice('NEIGHBOUR_RESULT:'.length));
}
