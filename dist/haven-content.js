import { havenCompanions } from './haven-companions.js';
const project=(id,kind,requires,title,story,task,starter,solution,checks,extra={})=>({id,kind,requires,title,story,lesson:story,task,starter,solution,checks,xp:140+requires*5,coins:60+requires*2,hint:'Trace a small example on paper first. Keep the input unchanged and check the empty case as well.',...extra});
export const shelterAnimals=havenCompanions;
export const shelterHomes=[
  {id:'nell',name:'Nell',quiet:true,space:1,time:2,prefers:'Mosslight sprite',story:'A quiet reading corner above the library, with a deep windowsill. Nell welcomes a calm afternoon visitor.'},
  {id:'rowan',name:'Rowan',quiet:false,space:3,time:3,prefers:'Autumn hedgehog',story:'A lively bakery courtyard and a familiar evening walk. Rowan has room for an energetic visitor.'},
  {id:'elio',name:'Elio',quiet:true,space:2,time:2,prefers:'Moonbeam moth',story:'A peaceful garden cottage. Elio keeps a sheltered lantern and a gentle visiting routine.'}
];
export const shelterProjects=[
  project('shelter-pantry','shelter',0,'A bowl with every name',
    'Rowan found Moss in a flowerpot after the greenhouse path flooded. Neighbours brought blankets and made the empty potting cottage a haven for small woodland companions. Help Moss feel settled by making a pantry list that remembers every visitor. A dictionary can collect totals: use totals.get(food, 0) + portions to add to a food’s existing amount. These dewberries, seedcakes and moonnectar are imaginary supplies.',
    'Write pantry(animals). Each dictionary has food and portions. Return a dictionary adding portions for each food. Return {} for no animals; do not change the input.',
    'def pantry(animals):\n    return {}',
    'def pantry(animals):\n    totals = {}\n    for animal in animals:\n        food = animal["food"]\n        totals[food] = totals.get(food, 0) + animal["portions"]\n    return totals',
    'import copy\nf=scope.get("pantry")\nassert callable(f)\nfor rows,want in [([],{}),([{"food":"greens","portions":2}],{"greens":2}),([{"food":"a","portions":2},{"food":"b","portions":0},{"food":"a","portions":3}],{"a":5,"b":0})]:\n    before=copy.deepcopy(rows)\n    assert f(rows)==want, "Add portions for repeated foods."\n    assert rows==before',
    {demo:'pantry([])',outcome:'Moss’s little leaf begins to glow again. The pantry is ready, and Rowan can now prepare Moss’s travelling nest. Visit Moss to adopt your new friend for 90 coins.'}),
  project('shelter-round','shelter',8,'The morning and evening round',
    'Bramble used to bring fallen leaves to the bakery each morning. Its closed shutters broke his familiar routine. Nell offers a morning visit; Rowan takes evenings. Give Bramble a dependable round again. Group names in sets under each time label, then sorted(names) turns each set into a predictable list without duplicates.',
    'Write care_round(rows). Each row has name and times (a list of time labels). Return {time: sorted unique names}. An animal appears once per time, even with repeated rows. Do not change rows.',
    'def care_round(rows):\n    return {}',
    'def care_round(rows):\n    plan = {}\n    for row in rows:\n        for time in row["times"]:\n            plan.setdefault(time, set()).add(row["name"])\n    return {time: sorted(names) for time, names in plan.items()}',
    'import copy\nf=scope.get("care_round")\nassert callable(f)\nr=[{"name":"Z","times":["morning","evening","morning"]},{"name":"A","times":["morning"]},{"name":"Z","times":["morning"]}];before=copy.deepcopy(r)\nassert f(r)=={"morning":["A","Z"],"evening":["Z"]}\nassert f([])=={}\nassert f([{"name":"B","times":[]}])=={}\nassert r==before',
    {previous:'shelter-pantry',demo:'care_round([])',outcome:'Bramble arrives with a gold leaf for Rowan’s apron. A familiar routine has brought back his confidence. Visit Bramble to adopt your leaf-backed friend for 240 coins; there are no missed-day penalties.'}),
  project('shelter-match','shelter',18,'A recommendation is an invitation',
    'Clover followed the festival lights from the mist garden, but folds her wings in noisy corners. Rowan wants every visit to begin with listening. Filter required space, time and quiet before sorting suitable hosts by their preference and id. This transparent rule-based recommender is not a trained model. A score cannot know how a companion feels; your choice matters. Helping with this book prepares Clover’s quiet travelling nest.',
    'Write recommend(animal, homes). Keep homes with space >= animal.space, time >= animal.time, and quiet=True when the animal needs quiet. Return their ids, putting a matching prefers/species first, then sorting by id. Never alter inputs.',
    'def recommend(animal, homes):\n    return [home["id"] for home in homes]',
    'def recommend(animal, homes):\n    suitable = [h for h in homes if h["space"] >= animal["space"] and h["time"] >= animal["time"] and (not animal["quiet"] or h["quiet"])]\n    suitable.sort(key=lambda h: (h["prefers"] != animal["species"], h["id"]))\n    return [h["id"] for h in suitable]',
    'import copy\nf=scope.get("recommend")\nassert callable(f)\na={"space":2,"time":2,"quiet":True,"species":"Moonbeam moth"}\nh=[{"id":i,"space":sp,"time":t,"quiet":q,"prefers":pr} for i,sp,t,q,pr in [("z",2,2,True,"Moonbeam moth"),("a",3,3,True,"Mosslight sprite"),("b",1,3,True,"Moonbeam moth"),("c",3,1,True,"Moonbeam moth"),("d",3,3,False,"Moonbeam moth"),("y",2,2,True,"Moonbeam moth")]]\nbefore=copy.deepcopy((a,h))\nassert f(a,h)==["y","z","a"], "Filter needs before ranking preferences; break ties by id."\nassert f(a,[])==[]\nassert (a,h)==before\na["quiet"]=False\nassert f(a,h)==["d","y","z","a"]',
    {previous:'shelter-round',inspection:'A favourite companion species matches, but the visiting place has too little space. What should the tool do?',choices:['Recommend it anyway: preference matters most.','Exclude it, explain the need, and leave suitable introductions to people.','Automatically choose a different companion.'],answer:1,feedback:['A preference cannot override a required need.','Yes. Filter required needs first; people still review every introduction.','The tool should support a conversation, not make a placement.'],demo:'recommend({}, [])',outcome:'Clover opens her moon-marked wings beside the quiet lantern. Her travelling nest is ready: visit Clover to adopt her for 420 coins. The book also lets you arrange optional neighbour visits; those never move or purchase a companion.'})
];
export const observatoryProjects=[
  project('sky-focus','observatory',0,'Elio and the covered telescope',
    'June once brought the village children here with a flask of cocoa. After she left, Elio covered the telescope and stopped coming up the hill. He has finally opened the dome again. The brass tube is sound; its alignment dial needs a small Python helper.',
    'Write focus_error(measured, target). Return the absolute difference between the two numbers. A perfect alignment returns zero.',
    'def focus_error(measured, target):\n    return measured - target',
    'def focus_error(measured, target):\n    return abs(measured - target)',
    'f=scope.get("focus_error")\nassert callable(f)\nfor a,b in [(5,2),(2,5),(0,0),(-2,3),(1.5,2)]:\n    assert f(a,b)==abs(a-b), "Distance from the target cannot be negative."',
    {demo:'{"dial_error": focus_error(12.5, 10), "aligned": focus_error(10, 10)}',outcome:'Elio removes the old cover. The telescope catches its first light in years. Choose a sky and make a fictional observation whenever you like.'}),
  project('sky-chart','observatory',6,'Marks in June\'s margin',
    'The old notebook has little marks beside every visit, even the cloudy ones. Elio asks you to keep that habit: counting only clear nights would tell a misleading story. Your chart groups observations by cloud cover.',
    'Write sky_counts(rows). Count rows by their sky label. Return {label: count}, including cloudy observations, or {} for no rows.',
    'def sky_counts(rows):\n    return {}',
    'def sky_counts(rows):\n    counts = {}\n    for row in rows:\n        sky = row["sky"]\n        counts[sky] = counts.get(sky, 0) + 1\n    return counts',
    'f=scope.get("sky_counts")\nassert callable(f)\nassert f([])=={}\nassert f([{"sky":"clear"},{"sky":"cloudy"},{"sky":"clear"}])=={"clear":2,"cloudy":1}\nassert f([{"sky":"cloudy"}])=={"cloudy":1}',
    {previous:'sky-focus',skyRows:6,demo:'sky_counts([])',outcome:'Your own observations become a chart. The cloudy visits belong in the story too.'}),
  project('sky-noise','observatory',14,'The reading that leapt',
    'One brightness reading is much higher than its neighbours. Perhaps a moth crossed the lamp. Elio leaves the raw reading in the journal. Compare the mean with the median: a middle value resists an isolated extreme, but cannot tell you which measurement is true.',
    'Write brightness_summary(values). Return {"mean": average, "median": middle sorted value}. For even lengths average the two middle values. For [] return {"mean": None, "median": None}. Preserve the input.',
    'def brightness_summary(values):\n    return {"mean": 0, "median": 0}',
    'def brightness_summary(values):\n    if not values:\n        return {"mean": None, "median": None}\n    ordered = sorted(values)\n    n = len(ordered)\n    median = (ordered[(n - 1) // 2] + ordered[n // 2]) / 2\n    return {"mean": sum(values) / n, "median": median}',
    'f=scope.get("brightness_summary")\nassert callable(f)\nfor values,want in [([],{"mean":None,"median":None}),([1,2,99],{"mean":34,"median":2}),([4,1,3,2],{"mean":2.5,"median":2.5}),([0],{"mean":0,"median":0})]:\n    before=values.copy()\n    assert f(values)==want, "Sort a copy; handle odd, even, and empty samples."\n    assert values==before',
    {previous:'sky-chart',skyRows:10,demo:'brightness_summary([])',outcome:'Elio pins both summaries beside the original marks. You have made the uncertainty visible, without quietly deleting inconvenient observations.'}),
  project('sky-predict','observatory',26,'A little model, an honest test',
    'Can cloud cover help predict the brightness of our fictional Lantern Star? Train a small grouped-mean regression model: it learns an average for each sky condition. Every fifth observation stays aside for testing. A simple overall average is your baseline. These invented observations teach modelling, not astronomy.',
    'Write predict_brightness(rows, sky). Return the mean brightness of training rows matching sky. If none match, use all training rows. Return None for no rows. Do not change rows.',
    'def predict_brightness(rows, sky):\n    return 0',
    'def predict_brightness(rows, sky):\n    sample = [r for r in rows if r["sky"] == sky] or rows\n    if not sample:\n        return None\n    return sum(r["brightness"] for r in sample) / len(sample)',
    'import copy\nf=scope.get("predict_brightness")\nassert callable(f)\nr=[{"sky":"clear","brightness":80},{"sky":"clear","brightness":100},{"sky":"cloudy","brightness":30}];before=copy.deepcopy(r)\nassert f(r,"clear")==90\nassert f(r,"cloudy")==30\nassert f(r,"hazy")==70\nassert f([],"clear") is None\nassert r==before',
    {previous:'sky-noise',skyRows:20,demo:'predict_brightness([], "clear")',outcome:'Your saved model is ready to face observations it never trained on. Elio sets out a second cup: there is always another question worth asking.'})
];
