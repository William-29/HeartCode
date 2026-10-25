import { quests, pets } from './content.js';
import { projects } from './projects.js';
import { buildings, restorationProjects } from './restoration-content.js';
import { adventures } from './adventure-content.js';
import { neighbourProjects } from './neighbour-content.js';
import { continuingStories, continuingProjects } from './continuing-content.js';
import { testBenchProjects } from './testbench-content.js';
import { festivalActs } from './village-life-model.js';

export const neighbourPlace = p => ({teaching:'apprentices',shared:'shared',lake:'lake',clock:'clockwork',testing:'clockwork',discovery:'discoveries',shelter:'shelter',observatory:'observatory',continuing:'stories'}[p.kind]);
export const threadChoices = [
  ['campaign','Continue the learning trail'],
  ...buildings.map(b=>['building:'+b.id,'Reopen '+b.name]),
  ...continuingStories.map(s=>['story:'+s.npc,s.name+' · '+s.title]),
  ['testing','Mira’s Test Bench'],['festival','Prepare the lantern festival'],
  ...pets.filter(p=>p.helpProject).map(p=>['companion:'+p.id,'Welcome '+p.name])
];
function known(key) {
  if(threadChoices.some(([id])=>id===key))return true;
  const [type,id]=String(key).split(':');
  return ({quest:quests,project:projects,neighbour:neighbourProjects,repair:restorationProjects,adventure:adventures}[type]||[]).some(p=>p.id===id);
}
export function normalizeThread(value) {
  return {goal:known(value?.goal)?value.goal:null,last:known(value?.last)?value.last:null};
}
const action=(label,route,detail='')=>({label,route,detail});
function trail(state, requirement=quests.length) {
  const q=quests.find(q=>!state.completed.includes(q.id));
  return q ? action('Quest '+(quests.indexOf(q)+1)+': '+q.title,'quests/quest/'+q.id,`Learn the next step · ${state.completed.length}/${requirement} trail quests`) : action('All trail quests complete','quests');
}
export function objective(state,key=state.thread?.goal, seen=new Set()) {
  if(!known(key)||seen.has(key))return null;
  seen.add(key);
  const [type,id]=key.split(':');
  let title=threadChoices.find(([k])=>k===key)?.[1], done=false, next, count=0,total=1;
  const follow=k=>objective(state,k,new Set(seen))?.next;
  if(key==='campaign'){done=state.completed.length===quests.length;count=state.completed.length;total=quests.length;next=trail(state);}
  else if(type==='building') {
    const b=buildings.find(b=>b.id===id), group=restorationProjects.filter(p=>p.building===id);
    done=state.restoration.opened.includes(id);count=group.filter(p=>state.restoration.completed.includes(p.id)).length+(done?1:0);total=4;
    const pending=group.find(p=>!state.restoration.completed.includes(p.id));
    next=pending?follow('repair:'+pending.id):action(done?'Visit '+b.short:'Reopen '+b.name,'courtyard/building/'+id,done?'A beloved place is alive again.':'The repairs are ready. Share the opening with your neighbor.');
  } else if(type==='story'||key==='testing'||key==='festival') {
    const group=type==='story'?continuingProjects.filter(p=>p.npc===id):key==='testing'?testBenchProjects:festivalActs.flatMap(a=>a.projects).map(id=>projects.find(p=>p.id===id));
    const completed=key==='festival'?state.projects:state.neighbours.completed;
    count=group.filter(p=>completed.includes(p.id)).length;total=group.length+(key==='festival'?1:0);
    done=count===group.length&&(key!=='festival'||state.festivalCelebrated); if(done&&key==='festival')count++;
    const pending=group.find(p=>!completed.includes(p.id));
    next=pending?follow((key==='festival'?'project:':'neighbour:')+pending.id):action(key==='festival'&&!done?'Light the festival lanterns':'Visit what you made',key==='festival'?'festival':key==='testing'?'clockwork/bench':'stories');
  } else if(type==='companion') {
    const pet=pets.find(p=>p.id===id);done=state.owned.includes(id);count=Number(done);
    const unfinished=projects.find(p=>!state.projects.includes(p.id));
    const earnings=state.completed.length<quests.length?trail(state):unfinished?follow('project:'+unfinished.id):action('Visit the tavern’s daily challenge','tavern');
    next=done?action('Visit '+pet.name,'companions','Your friend has a home.'):!state.neighbours.completed.includes(pet.helpProject)?follow('neighbour:'+pet.helpProject):state.coins<pet.cost?{...earnings,detail:`${pet.cost-state.coins} more coins for ${pet.name}. Lessons and unfinished projects earn coins.`}:action('Welcome '+pet.name,'companions',`Care complete · adoption costs ${pet.cost} coins.`);
  } else {
    const lists={quest:quests,project:projects,neighbour:neighbourProjects,repair:restorationProjects,adventure:adventures};
    const p=lists[type]?.find(p=>p.id===id);if(!p)return null;title=p.title;
    const completed={quest:state.completed,project:state.projects,neighbour:state.neighbours.completed,repair:state.restoration.completed,adventure:state.adventure.completed}[type];
    done=completed.includes(id);count=Number(done);
    const requirement=type==='quest'?quests.indexOf(p):p.requires;
    if(!done&&p.previous&&!completed.includes(p.previous))next=follow(type+':'+p.previous);
    else if(!done&&p.kind==='teaching'&&neighbourProjects.some(x=>x.kind==='teaching'&&x.npc===p.npc&&x.requires<p.requires&&!completed.includes(x.id)))next=follow('neighbour:'+neighbourProjects.find(x=>x.kind==='teaching'&&x.npc===p.npc&&x.requires<p.requires&&!completed.includes(x.id)).id);
    else if(!done&&p.originalProjects?.some(id=>!state.projects.includes(id)))next=follow('project:'+p.originalProjects.find(id=>!state.projects.includes(id)));
    else if(!done&&p.buildings?.some(id=>!state.restoration.opened.includes(id)))next=follow('building:'+p.buildings.find(id=>!state.restoration.opened.includes(id)));
    else if(!done&&p.tools?.some(id=>!state.restoration.code[id]?.trim()))next=follow('repair:'+p.tools.find(id=>!state.restoration.code[id]?.trim()));
    else if(!done&&type==='repair'&&p.stage>1&&!completed.includes(restorationProjects.find(x=>x.building===p.building&&x.stage===p.stage-1).id))next=follow('repair:'+restorationProjects.find(x=>x.building===p.building&&x.stage===p.stage-1).id);
    else if(!done&&state.completed.length<requirement)next=trail(state,requirement);
    else if(!done&&p.kind==='discovery'&&!state.neighbours.found.includes(id))next=action('Follow your companion’s clue','discoveries/discovery/'+id,p.story);
    else if(!done&&p.observations&&state.neighbours.observations.length<p.observations)next=action('Record a cast at Willowmere','lake',`${state.neighbours.observations.length}/${p.observations} observations`);
    else if(!done&&p.skyRows&&state.neighbours.skyObservations.length<p.skyRows)next=action('Look through Elio’s telescope','observatory',`${state.neighbours.skyObservations.length}/${p.skyRows} observations`);
    else next=action((done?'Revisit: ':'Begin: ')+p.title,({quest:'quests/quest/',project:'village/project/',repair:'courtyard/project/',neighbour:neighbourPlace(p)+'/project/',adventure:'adventures/story/'}[type])+id,done?'Your work is saved.':'Your next small step is ready.');
  }
  return {key,title,done,count,total,next};
}
