import { buildings, restorationProjects, restorationById } from './restoration-content.js';
export function freshRestoration(){return {completed:[],code:{},drafts:{},opened:[],memories:[],exhibition:null};}
export const buildingStage=(state,id)=>restorationProjects.filter(p=>p.building===id&&state.restoration.completed.includes(p.id)).length;
export function restorationUnlocked(state,item){
  return !!item && state.completed.length>=item.requires &&
    (item.stage===1||state.restoration.completed.includes(restorationProjects.find(p=>p.building===item.building&&p.stage===item.stage-1).id));
}
export function normalizeRestoration(value,state){
  const v=value&&typeof value==='object'?value:{},r=freshRestoration(),temporary={...state,restoration:r};
  for(const p of restorationProjects){
    if(restorationUnlocked(temporary,p)){
      if(typeof v.drafts?.[p.id]==='string')r.drafts[p.id]=v.drafts[p.id].slice(0,30000);
      if(Array.isArray(v.completed)&&v.completed.includes(p.id)&&typeof v.code?.[p.id]==='string'&&v.code[p.id].trim()){
        r.completed.push(p.id);r.code[p.id]=v.code[p.id].slice(0,30000);
      }
    }
  }
  r.opened=buildings.filter(b=>buildingStage(temporary,b.id)===3&&Array.isArray(v.opened)&&v.opened.includes(b.id)).map(b=>b.id);
  r.memories=buildings.flatMap(b=>Array.from({length:(r.opened.includes(b.id)?3:Math.min(buildingStage(temporary,b.id),2))+1},(_,i)=>`${b.id}-${i}`)).filter(id=>Array.isArray(v.memories)&&v.memories.includes(id));
  // Exhibition ownership is checked by the exhibition model at read/write time.
  r.exhibition=Array.isArray(v.exhibition)?[...new Set(v.exhibition.filter(id=>typeof id==='string'&&/^[a-z0-9-]{1,80}$/.test(id)))].slice(0,6):null;
  return r;
}
// A successful Python run is required before the UI calls this commit function.
export function completeRestoration(state,id,code){
  const p=restorationById(id),r=state.restoration;
  if(!restorationUnlocked(state,p)||typeof code!=='string'||!code.trim()||code.length>30000)return {ok:false};
  const replay=r.completed.includes(id);
  r.code[id]=code;r.drafts[id]=code;
  if(!replay){r.completed.push(id);state.xp+=p.xp;state.coins+=p.coins;}
  return {ok:true,replay,xp:replay?0:p.xp,coins:replay?0:p.coins,building:p.building,stage:p.stage};
}
export function openBuilding(state,id){
  if(!buildings.some(b=>b.id===id)||buildingStage(state,id)!==3)return false;
  if(state.restoration.opened.includes(id))return false;
  state.restoration.opened.push(id);return true;
}
export function remember(state,id,index){
  if(!buildings.some(b=>b.id===id)||!Number.isInteger(index)||index<0||index>buildingStage(state,id))return false;
  if(index===3&&!state.restoration.opened.includes(id))return false;
  const key=`${id}-${index}`;
  if(!state.restoration.memories.includes(key))state.restoration.memories.push(key);
  return true;
}
