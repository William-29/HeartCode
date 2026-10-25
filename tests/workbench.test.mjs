import test from 'node:test';
import assert from 'node:assert/strict';
import { mountWorkbenches } from '../dist/workbench.js';

// A DOM adapter for lifecycle/interaction tests, not a browser layout test.
function surface() {
  let observer, observations=0, disconnected=false;
  class Element extends EventTarget {
    constructor(tag='div') {
      super();this.tag=tag;this.children=[];this.parent=null;this.classes=new Set();this.dataset={};this.attributes={};this.value='';this.scrollLeft=0;this.scrollTop=0;this.html='';
      this.style={setProperty:(key,value)=>{this.style[key]=value;}};
      this.classList={contains:name=>this.classes.has(name),add:name=>this.classes.add(name),remove:name=>this.classes.delete(name),toggle:(name,force)=>{const on=force??!this.classes.has(name);if(on)this.classes.add(name);else this.classes.delete(name);return on;}};
    }
    set className(value){this.classes=new Set(value.split(' '));}
    get isConnected(){return this===doc.body||!!this.parent?.isConnected;}
    matches(selector){return selector.split(',').some(s=>s.startsWith('#')?this.id===s.slice(1):s.startsWith('.')?this.classes.has(s.slice(1)):s.startsWith('[data-bench')?this.dataset.bench&&(s==='[data-bench]'||s.includes('"'+this.dataset.bench+'"')):this.tag===s);}
    closest(selector){return this.matches(selector)?this:this.parent?.closest(selector)||null;}
    querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
    querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
    append(...nodes){for(const node of nodes){node.remove();node.parent=this;this.children.push(node);}}
    before(node){const parent=this.parent;node.remove();node.parent=parent;parent.children.splice(parent.children.indexOf(this),0,node);}
    remove(){if(this.parent){this.parent.children.splice(this.parent.children.indexOf(this),1);this.parent=null;}}
    setAttribute(name,value){this.attributes[name]=value;}
    set innerHTML(value){this.html=value;if(this.classes.has('workbench-tools')){this.children=[];for(const name of ['smaller','output','larger','color','focus']){const node=new Element(name==='output'?'output':'button');if(name!=='output')node.dataset.bench=name;this.append(node);}}}
    get innerHTML(){return this.html;}
  }
  const doc=new EventTarget();doc.body=new Element('body');doc.createElement=tag=>new Element(tag);doc.querySelectorAll=s=>doc.body.querySelectorAll(s);
  doc.defaultView={MutationObserver:class {constructor(callback){observer=callback;}observe(){observations++;}disconnect(){disconnected=true;}}};
  const editor=(id,container='dialog')=>{const host=new Element(container);if(container!=='dialog')host.className='practice-layout';const field=new Element('textarea');field.id=id;field.value='assert total == 3';host.append(field);doc.body.append(host);return{host,field};};
  const click=(toolbar,action)=>{const event=new Event('click');Object.defineProperty(event,'target',{value:toolbar.querySelector(`[data-bench="${action}"]`)});toolbar.dispatchEvent(event);doc.dispatchEvent(new Event('click'));};
  return{doc,editor,click,changed:target=>observer([{target}]),observations:()=>observations,disconnected:()=>disconnected};
}

test('shared editor keeps input intact, persists preferences across screens and clamps text size',()=>{
  const ui=surface(),first=ui.editor('quest-code');let prefs={size:15,color:true},writes=0;
  const mounted=mountWorkbenches({doc:ui.doc,read:()=>prefs,save:value=>{prefs=value;writes++;}});
  const toolbar=first.host.querySelector('.workbench-tools');
  assert.equal(first.host.querySelector('#quest-code'),first.field);assert.equal(first.field.attributes.wrap,'off');
  assert.match(first.host.querySelector('.python-paint').innerHTML,/python-keyword/);
  for(let i=0;i<20;i++)ui.click(toolbar,'larger');assert.equal(prefs.size,22);assert.equal(toolbar.querySelector('[data-bench="larger"]').disabled,true);
  ui.click(toolbar,'color');assert.equal(prefs.color,false);assert.equal(first.host.querySelector('.warm-workbench').classList.contains('syntax-color'),false);
  const second=ui.editor('neighbour-code');ui.changed(ui.doc.body);
  assert.equal(second.host.querySelector('.warm-workbench').style['--code-size'],'22px');
  ui.click(second.host.querySelector('.workbench-tools'),'smaller');assert.equal(first.host.querySelector('.warm-workbench').style['--code-size'],'21px');
  assert.ok(writes>0);assert.equal(ui.observations(),1);
  mounted.dispose();assert.equal(ui.disconnected(),true);
});

test('typing, indentation and programmatic resets repaint; scrolling follows the real textarea',async()=>{
  const ui=surface(),{host,field}=ui.editor('practice-code','section');
  const mounted=mountWorkbenches({doc:ui.doc,read:()=>({size:15,color:true}),save(){}});
  const paint=host.querySelector('.python-paint');
  field.value='print("<img>")';field.dispatchEvent(new Event('input'));
  assert.match(paint.innerHTML,/&lt;img&gt;/);assert.doesNotMatch(paint.innerHTML,/<img>/);
  field.value='    pass';field.dispatchEvent(new Event('keyup'));assert.match(paint.innerHTML,/^    /);
  field.value='# restored starter';ui.doc.dispatchEvent(new Event('click'));await Promise.resolve();assert.match(paint.innerHTML,/restored starter/);
  field.scrollLeft=97;field.scrollTop=53;field.dispatchEvent(new Event('scroll'));assert.equal(paint.scrollLeft,97);assert.equal(paint.scrollTop,53);
  mounted.dispose();
});

test('focus view clears when a dialog closes or an editor is replaced; listeners are cleaned up',()=>{
  const ui=surface(),{host,field}=ui.editor('community-code');
  const mounted=mountWorkbenches({doc:ui.doc,read:()=>({}),save(){}});
  const toolbar=host.querySelector('.workbench-tools'),paint=host.querySelector('.python-paint');
  ui.click(toolbar,'focus');assert.equal(host.classList.contains('workbench-focus'),true);
  assert.equal(toolbar.querySelector('[data-bench="focus"]').attributes['aria-pressed'],'true');
  host.dispatchEvent(new Event('close'));assert.equal(host.classList.contains('workbench-focus'),false);
  ui.click(toolbar,'focus');field.remove();ui.changed(host);assert.equal(host.classList.contains('workbench-focus'),false);
  const before=paint.innerHTML;field.value='old detached input';field.dispatchEvent(new Event('input'));assert.equal(paint.innerHTML,before);
  const next=ui.editor('adventure-code');ui.changed(ui.doc.body);assert.ok(next.host.querySelector('.warm-workbench'));
  mounted.dispose();
});
