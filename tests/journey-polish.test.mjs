import test from 'node:test';
import assert from 'node:assert/strict';
import { setBusyControls, editorIndent } from '../dist/editor-controls.js';
import { parentPlace, routeFromHash, placeNavigation, roomNavigation } from '../dist/navigation.js';
import { freshState, normalizeState } from '../dist/state.js';
import { clockProjects } from '../dist/clockwork-content.js';
import { completeNeighbour, inspectMechanism } from '../dist/neighbour-model.js';
import { exhibitCatalog, displayExhibit, displayedExhibits } from '../dist/exhibition-model.js';
import { renderRoom } from '../dist/village-life.js';
import { renderWardrobe } from '../dist/community.js';

test('running and stopping editors preserves locked controls through repeated stop events', () => {
  const controls = [
    {dataset:{work:'run'},disabled:false}, {dataset:{work:'move'},disabled:true},
    {dataset:{work:'stop'},disabled:true}, {dataset:{work:'close'},disabled:false}
  ];
  const dialog={querySelectorAll:()=>controls}, remembered=new Map();
  const busy=value=>setBusyControls(dialog,'[data-work]',value,remembered,'work');
  busy(false); assert.equal(controls[1].disabled,true);
  busy(true); busy(true); assert.deepEqual(controls.map(c=>c.disabled),[true,true,false,false]);
  busy(false); busy(false); assert.deepEqual(controls.map(c=>c.disabled),[false,true,true,false]);
  assert.equal(remembered.size,0);
});

test('all project editors can indent and leave with Shift+Tab or Escape then Tab', () => {
  let edits=0, inputs=0, blocked=0, stopped=0;
  const target={selectionStart:0,selectionEnd:0,setRangeText(){edits++;}};
  const press=(key,shiftKey=false)=>editorIndent({key,shiftKey,target,preventDefault(){blocked++;},stopPropagation(){stopped++;}},()=>inputs++);
  press('Tab'); assert.equal(edits,1); assert.equal(inputs,1);
  press('Tab',true); assert.equal(blocked,1);
  press('Escape'); press('Tab'); assert.equal(blocked,2); assert.equal(stopped,1);
  press('Tab'); assert.equal(edits,2);
});

test('the room and wardrobe are freely connected for a brand-new player while clothing milestones remain locked', () => {
  const s=freshState(),room=renderRoom(s,{id:'pip',name:'Pip'}),wardrobe=renderWardrobe(s);
  assert.match(room, /href="#wardrobe"/); assert.match(room,/Change your look/);
  assert.match(wardrobe,/UPSTAIRS AT THE HEARTH & HONEY/);
  assert.match(wardrobe,/href="#room"/); assert.match(wardrobe,/Locked/);
  assert.equal(parentPlace('wardrobe'),'room'); assert.equal(parentPlace('apprentices'),'tavern');
  assert.equal(parentPlace('discoveries'),'companions');
  assert.equal(routeFromHash('#courtyard/exhibition'),'courtyard');
  assert.equal(routeFromHash('#clockwork/exhibit/clock-latch'),'clockwork');
  assert.match(roomNavigation('wardrobe'),/href="#wardrobe" aria-current="page"/);
  const names=Object.fromEntries(['village','room','wardrobe','companions','courtyard'].map(id=>[id,[id]]));
  const nav=placeNavigation('wardrobe',names);
  assert.match(nav,/href="#room"/); assert.match(nav,/href="#courtyard\/exhibition"/);
});

test('a repaired clock joins the exhibition, survives export/import, and cannot be displayed before completion', () => {
  const s=freshState(),p=clockProjects[0];
  s.neighbours.code[p.id]=p.solution;
  assert.equal(displayExhibit(s,p.id).ok,false);
  inspectMechanism(s,p.id,p.answer); assert.equal(completeNeighbour(s,p.id,p.solution).ok,true);
  const item=exhibitCatalog(s).find(x=>x.id===p.id);
  assert.equal(item.kind,'neighbour'); assert.equal(item.place,'clockwork'); assert.equal(item.source,p.solution);
  s.restoration.exhibition=[];
  assert.equal(displayExhibit(s,p.id).ok,true);
  const restored=normalizeState(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(displayedExhibits(restored).map(x=>x.id),[p.id]);
  assert.equal(restored.coins,s.coins); assert.equal(restored.xp,s.xp);
});
