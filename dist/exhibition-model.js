import { neighbourProjects } from './neighbour-content.js';
import { projects } from './projects.js';
import { adventures } from './adventure-content.js';
import { restorationProjects, buildingById } from './restoration-content.js';
const field=(name,label,value,type='number')=>({name,label,value:type==='json'?JSON.stringify(value):value,type});
const json=(name,label,value)=>field(name,label,value,'json');
const adventureDemos={
  delivery:{functionName:'missing',demo:[field('expected','Expected parcels',12),field('received','Received parcels',9)]},
  lanterns:{functionName:'lanterns',demo:[json('levels','Lantern readings',[3,5,7]),field('threshold','Light threshold',5)]},
  forecast:{functionName:'baseline',demo:[json('training','Training observations',[2,4,6]),json('inspection','Held-out observations',[100,80])]},
  'parcel-shop':{functionName:'postage',demo:[field('weight','Parcel weight in kg',2.5)]},
  'stock-shop':{functionName:'reorder',demo:[json('stock','Stock',{tea:2,honey:7}),field('target','Target stock',6)]},
  'reviews-shop':{functionName:'positive_rate',demo:[json('reviews','Reader ratings',[5,4,2,5])]},
  'seaside-task':{functionName:'fare',demo:[field('adults','Adults',2),field('children','Children',3)]},
  'snow-task':{functionName:'average_valid',demo:[json('readings','Sensor readings',[null,-4,0,4])]},
  'forest-task':{functionName:'mae',demo:[json('actual','Actual values',[2,4,6]),json('predicted','Predicted values',[1,5,6])]},
  'garden-fit':{functionName:'fit',demo:[json('samples','Training pairs',[[1,3.2],[2,4.8],[3,7.3],[4,8.8]])]}
};
export function exhibitCatalog(state){
  return [
    ...projects.filter(p=>state.projects.includes(p.id)&&state.projectCode[p.id]).map(p=>({...p,kind:'village',caption:`Made with ${p.npc}`,source:state.projectCode[p.id],symbol:p.id.includes('game')?'spark':'code'})),
    ...adventures.filter(p=>state.adventure.completed.includes(p.id)&&state.adventure.code[p.id]).map(p=>({...p,...adventureDemos[p.id],kind:'adventure',caption:'From High Street',source:state.adventure.code[p.id],symbol:p.area==='garden'?'leaf':'code'})),
    ...restorationProjects.filter(p=>state.restoration.completed.includes(p.id)&&state.restoration.code[p.id]).map(p=>({...p,kind:'restoration',caption:`Restoring ${buildingById(p.building).short.toLowerCase()}`,source:state.restoration.code[p.id],symbol:buildingById(p.building).icon})),
    ...neighbourProjects.filter(p=>p.kind!=='teaching'&&state.neighbours?.completed.includes(p.id)&&state.neighbours.code[p.id]).map(p=>({...p,kind:'neighbour',place:{shelter:'shelter',observatory:'observatory',shared:'shared',lake:'lake',clock:'clockwork',discovery:'discoveries'}[p.kind],caption:{shelter:'Made for the companion haven',observatory:'From Elio’s observatory',shared:'Made for the morning round',lake:'From your lake journal',clock:'From Mira’s repair bench',discovery:'Found with your companion'}[p.kind],source:state.neighbours.code[p.id],symbol:p.kind==='clock'?'clock':p.kind==='discovery'?'paw':'leaf'}))
  ];
}
export function displayedExhibits(state){
  const catalog=exhibitCatalog(state),ids=state.restoration.exhibition;
  return Array.isArray(ids)?ids.map(id=>catalog.find(p=>p.id===id)).filter(Boolean).slice(0,6):catalog.slice(0,6);
}
export function displayExhibit(state,id){
  const catalog=exhibitCatalog(state),item=catalog.find(p=>p.id===id);
  if(!item)return {ok:false,reason:'Finish and save this project first.'};
  const shown=displayedExhibits(state).map(p=>p.id),index=shown.indexOf(id);
  if(index>=0)shown.splice(index,1);
  else if(shown.length>=6)return {ok:false,reason:'The square has six display places. Put one away before adding another.'};
  else shown.push(id);
  state.restoration.exhibition=shown;
  return {ok:true,shown:index<0};
}
export function exhibitSource(item,raw){
  if(!item?.source||!item.functionName||!Array.isArray(item.demo))throw new Error('This creation has no saved Python. Revisit its project first.');
  const args=item.demo.map(f=>{
    const value=raw[f.name];
    if(value===undefined||value===null||String(value).length>5000)throw new Error(`Enter ${f.label.toLowerCase()} (up to 5,000 characters).`);
    if(f.type==='number'){
      const n=String(value).trim()?Number(value):NaN;
      if(!Number.isFinite(n)||Math.abs(n)>100000)throw new Error(`Use a finite number from -100000 to 100000 for ${f.label.toLowerCase()}.`);
      if((f.min!==undefined&&n<f.min)||(f.max!==undefined&&n>f.max))throw new Error(`${f.label} must be between ${f.min??-100000} and ${f.max??100000}.`);
      if(f.integer&&!Number.isInteger(n))throw new Error(`${f.label} must be a whole number.`);
      return n;
    }
    if(f.type==='json'){
      let parsed;try{parsed=JSON.parse(String(value));}catch{throw new Error(`Use valid JSON for ${f.label.toLowerCase()}: double quotes for text, null for missing values.`);}
      if(!parsed||typeof parsed!=='object')throw new Error(`${f.label} must be a JSON list or dictionary.`);
      return parsed;
    }
    return String(value);
  });
  return `${item.source}\n\nimport json as _exhibit_json\n_exhibit_args = _exhibit_json.loads(${JSON.stringify(JSON.stringify(args))})\n_exhibit_value = ${item.functionName}(*_exhibit_args)\nprint("EXHIBIT_RESULT:" + _exhibit_json.dumps(_exhibit_value, allow_nan=False))`;
}
export function exhibitResult(output){
  const line=String(output).split('\n').findLast(line=>line.startsWith('EXHIBIT_RESULT:'));
  if(!line)throw new Error('The creation did not return a result. Try another input or revisit its code.');
  return JSON.parse(line.slice('EXHIBIT_RESULT:'.length));
}
export const demoDefaults=item=>Object.fromEntries(item.demo.map(f=>[f.name,String(f.value)]));
export function greenhouseEvaluationSource(item){
  if(item?.id!=='greenhouse-model'||!item.source)throw new Error('Complete the glasshouse classifier first.');
  // The held-out labels enter evaluation only after predictions have been made.
  return `${item.source}\n\nimport json as _evj\n_training = [[10,"check"],[30,"check"],[65,"rest"],[85,"rest"]]\n_readings = [20,48,70,42]\n_report = classify_plants(_training, _readings)\n_truth = ["check","check","rest","check"]\n_labels = _report["labels"]\nassert len(_labels) == len(_truth), "Return one label per reading."\n_correct = sum(a == b for a,b in zip(_labels,_truth))\nprint("EXHIBIT_RESULT:" + _evj.dumps({"predictions":_labels,"held_out_labels":_truth,"correct":_correct,"total":len(_truth),"accuracy":_correct/len(_truth)}))`;
}
