import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { destinations, normalizePosition, findRoute, advanceRoute } from '../dist/village-model.js';
import { discoveries } from '../dist/clockwork-content.js';
import { scheduledPlaces, periods } from '../dist/village-life-model.js';
import { SIGN_WIDTH, SIGN_HEIGHT, isNeighbour, signBounds, overlaps, cluePositions, neighbourNameplates } from '../dist/village-layout.js';
import { fitVillageViewport, renderVillage } from '../dist/village.js';
import { freshState } from '../dist/state.js';
import { renderCourtyard } from '../dist/community.js';
import { renderDiscoveries } from '../dist/clockwork-ui.js';

const signs=destinations.filter(p=>!isNeighbour(p));
const scaled=(r,s)=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,v*s]));
function assertClear(places) {
  const blockers=places.filter(p=>!isNeighbour(p)).map(signBounds);
  blockers.push(...Object.values(cluePositions(discoveries,places)).map(c=>c.bounds));
  const labels=neighbourNameplates(places,discoveries);
  for (const [id,label] of Object.entries(labels)) {
    if(label.hidden)continue;
    assert.ok(label.bounds.left>=10&&label.bounds.right<=990&&label.bounds.top>=10&&label.bounds.bottom<=640,id);
    for(const reserved of blockers)assert.equal(overlaps(label.bounds,reserved),false,`${id} must not cover a destination, clue, or another name`);
    blockers.push(label.bounds);
  }
}

test('every sign and its click target stays separate and inside the village at all scene scales',()=>{
  assert.equal(signs.length,12);
  for(const [width,height] of [[320,208],[600,390],[1000,650],[1400,420],[480,200]]) {
    const scale=fitVillageViewport(width,height);
    for(let i=0;i<signs.length;i++) {
      const bounds=signBounds(signs[i]);
      assert.ok(bounds.left>=10&&bounds.right<=990&&bounds.top>=10&&bounds.bottom<=640,signs[i].id);
      for(let j=i+1;j<signs.length;j++)assert.equal(overlaps(scaled(bounds,scale),scaled(signBounds(signs[j]),scale),8*scale),false,`${signs[i].id} overlaps ${signs[j].id} at ${width}x${height}`);
    }
  }
  const css=readFileSync(new URL('../dist/village-signs.css',import.meta.url),'utf8');
  assert.match(css,new RegExp(`width:${SIGN_WIDTH}px;height:${SIGN_HEIGHT}px`));
});

test('found clue buttons remain visible beside the signs, including the lakeside picnic tin',()=>{
  const positions=cluePositions(discoveries,destinations);
  assert.equal(Object.keys(positions).length,discoveries.length);
  for(const clue of discoveries){
    const placed=positions[clue.id];assert.ok(Math.hypot(placed.x-clue.x,placed.y-clue.y)<=60);
    for(const sign of signs)assert.equal(overlaps(placed.bounds,signBounds(sign)),false,`${clue.id} covers ${sign.id}`);
  }
  const s=freshState();s.neighbours.found=discoveries.map(d=>d.id);
  const html=renderVillage(s);
  assert.equal((html.match(/data-village-discovery=/g)||[]).length,3);
  assert.match(html,/The lakeside path/);assert.match(html,/Companion discoveries/);
});

test('nameplates avoid signs throughout all daily routines and intermediate stroll positions',()=>{
  let checked=0;
  for(const time of periods){
    const places=scheduledPlaces(destinations,time);assertClear(places);
    assert.ok(Object.values(neighbourNameplates(places,discoveries)).every(n=>!n.hidden),`${time}: all resting neighbours have visible names`);
    for(const person of places.filter(isNeighbour)){
      const anchor={...person};
      for(const [dx,dy] of [[65,25],[30,65],[-45,20],[0,0]]){
        let route=findRoute(person,normalizePosition({x:anchor.x+dx,y:anchor.y+dy})).slice(1);
        let steps=0;
        while(route.length&&steps++<400){const next=advanceRoute(person,route,4);Object.assign(person,next.position);route=next.route;assertClear(places);checked++;}
        assert.ok(steps<400);
      }
    }
  }
  assert.ok(checked>400);
});

test('courtyard books and discovery signs have separate horizontal space on narrow scenes',()=>{
  const html=renderCourtyard(freshState());
  const books=[...html.matchAll(/class="court-table-project [^"]*"[^>]*style="left:(\d+)%;/g)].map(m=>Number(m[1]));
  assert.equal(books.length,6);
  for(const x of books)assert.ok(x+1.8<31 || x-1.8>69,'Exhibition sign must not cover a book');
  const scene=renderDiscoveries(freshState(),{id:'pip',name:'Pip'});
  const signs=[...scene.matchAll(/class="discovery-sign [^"]*"[^>]*style="left:([\d.]+)%;/g)].map(m=>Number(m[1])).sort((a,b)=>a-b);
  assert.equal(signs.length,3);
  for(let i=1;i<signs.length;i++)assert.ok(signs[i]-signs[i-1]>23);
  const css=readFileSync(new URL('../dist/village-signs.css',import.meta.url),'utf8');
  assert.match(css,/\.court-square-sign\{[^}]*max-width:38cqw/);
  assert.match(css,/\.discovery-frame \.discovery-sign\{width:23cqw/);
});
