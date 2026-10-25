const check=(name,body)=>`f=scope.get("${name}")\nassert callable(f), "Define ${name}."\n${body}`;
const make=data=>({kind:'continuing',xp:350+data.requires*3,coins:140+data.requires,minutes:25,...data});
export const continuingStories = [
  {npc:'rowan',name:'Rowan',building:'bakery',title:'A bakery with room for tomorrow',intro:'Mabel’s oven is warm again. Rowan wants the village to share its work without turning every morning into a rush.',original:'project-pantry-ledger'},
  {npc:'mira',name:'Mira',building:'library',title:'Books beyond the reading room',intro:'The library doors are open. Mira and Nell wonder how its stories might reach neighbors who cannot come to the square.',original:'project-festival-scores'},
  {npc:'elio',name:'Elio',building:'greenhouse',title:'A glasshouse through every season',intro:'June’s seedlings have found new homes. Elio wants the nursery to stay thoughtful as its needs and equipment change.',original:'project-lantern-predictor'}
];
export const continuingProjects = [
  make({id:'rowan-shared-oven',npc:'rowan',requires:40,buildings:['bakery'],originalProjects:['project-pantry-ledger'],tools:['bakery-planner'],
    title:'The oven has more than one morning',
    story:'Bea volunteers on market days; Kit takes the quieter mornings. Rowan brings their orders in a little ring-bound book, so nobody has to rebuild the planner you already made.',
    lesson:'Reuse a tested function when a larger job contains the same smaller job. plan_bakes(orders, capacity) is loaded from your restored bakery. Call it separately for each day, preserve the order of the days, and return their reports. A blank day still belongs in the ledger. Keeping each day independent prevents orders leaking between mornings.',
    task:'Write weekly_oven(days, capacity). days maps day names to lists of [bread, count] orders. Call the saved plan_bakes once for each day; return {"days": reports_by_day, "batches": total_batch_count}. Preserve days. capacity is a positive integer, counts are nonnegative integers. Empty days have empty batches; an empty week has zero batches.',
    starter:'def weekly_oven(days, capacity):\n    reports = {}\n    # plan_bakes is your saved bakery function.\n    return {"days": reports, "batches": 0}',
    solution:'def weekly_oven(days, capacity):\n    reports = {day: plan_bakes(orders, capacity) for day, orders in days.items()}\n    return {"days": reports, "batches": sum(len(r["batches"]) for r in reports.values())}',
    checks:check('weekly_oven',`import copy
days={"Monday":[["rye",3],["bun",2]],"Tuesday":[],"Friday":[["rye",1],["rye",1]]}
before=copy.deepcopy(days); out=f(days,3)
assert list(out["days"])==list(days) and out["batches"]==3, "Plan each morning independently and count all batches."
assert out["days"]["Monday"]["batches"]==[{"rye":3},{"bun":2}]
assert out["days"]["Tuesday"]=={"totals":{},"batches":[]} and out["days"]["Friday"]["totals"]=={"rye":2}
assert days==before and f({},4)=={"days":{},"batches":0}
assert f({"a":[["bun",7]]},2)["batches"]==4`),
    hint:'Build a new dictionary with one plan_bakes call per day. Sum the lengths of the reports’ batches lists.',
    demo:'weekly_oven({"Monday":[["rye",3],["bun",2]],"Wednesday":[],"Friday":[["bun",7]]}, 4)',
    outcome:'Rowan hangs the shared oven ledger beside Mabel’s recipe tin. Bea and Kit can each see their morning, including the day the oven rests.'}),
  make({id:'mira-library-round',npc:'mira',requires:48,buildings:['library'],originalProjects:['project-festival-scores'],tools:['library-loans'],
    title:'A reading room without walls',
    story:'Nell packs a basket for the haven and the café. Mira asks that the second stop see what was actually lent at the first, so the last copy is never promised twice.',
    lesson:'Your saved lend_books(catalog, requests) already returns a new stock and served/waiting lists. Thread its returned stock through a sequence of stops. Record each stop separately, including repeated visits to the same place. A list preserves visits; a dictionary keyed only by place would lose repeated stops.',
    task:'Write library_round(catalog, stops). stops is a list of [place, requested_titles] pairs. Use saved lend_books at every stop in order, passing its returned stock to the next. Return {"stock": final_stock, "visits": [{"place": ..., "served": [...], "waiting": [...]}, ...]}. Preserve inputs; return a stock copy even when no stops are requested.',
    starter:'def library_round(catalog, stops):\n    stock = catalog.copy()\n    visits = []\n    return {"stock": stock, "visits": visits}',
    solution:'def library_round(catalog, stops):\n    stock = catalog.copy()\n    visits = []\n    for place, requests in stops:\n        report = lend_books(stock, requests)\n        stock = report["stock"]\n        visits.append({"place": place, "served": report["served"], "waiting": report["waiting"]})\n    return {"stock": stock, "visits": visits}',
    checks:check('library_round',`import copy
catalog={"Clocks":1,"Gardens":2}; stops=[["Haven",["Clocks"]],["Cafe",["Clocks","Gardens"]],["Haven",["Gardens","Unknown"]]]
before=copy.deepcopy((catalog,stops)); r=f(catalog,stops)
assert r=={"stock":{"Clocks":0,"Gardens":0},"visits":[{"place":"Haven","served":["Clocks"],"waiting":[]},{"place":"Cafe","served":["Gardens"],"waiting":["Clocks"]},{"place":"Haven","served":["Gardens"],"waiting":["Unknown"]}]}, "Pass remaining copies onward and keep repeated visits."
assert (catalog,stops)==before
out=f(catalog,[]); assert out=={"stock":catalog,"visits":[]} and out["stock"] is not catalog
assert f({},[["Cafe",["Tea"]]])["visits"][0]["waiting"]==["Tea"]`),
    hint:'Call lend_books(stock, requests), append a visit record, then replace stock with report["stock"].',
    demo:'library_round({"Clocks":1,"Gardens":2}, [["Haven",["Gardens"]],["Cafe",["Clocks"]],["Haven",["Clocks","Gardens"]]])',
    outcome:'A lined book basket waits beside the library door. Nell’s round reaches the haven and café, with a clear waiting list for the next visit.'}),
  make({id:'elio-care-ranges',npc:'elio',requires:76,buildings:['greenhouse'],originalProjects:['project-lantern-predictor'],tools:['greenhouse-model'],
    title:'When a reading needs a second look',
    story:'A loose sensor makes one moisture reading look more precise than it is. Elio brings a lower and upper plausible reading, and keeps June’s watering can close.',
    lesson:'Your classifier chooses the nearest labeled moisture example. In this exercise there are exactly two distinct reference readings: lower is "check", higher is "rest", in that order. Its decision changes only once between them. Probe both ends of each uncertainty interval. If either end lies outside the reference range, or the labels disagree, ask a person to inspect. Agreement describes this small model; it is not a probability that the plant is healthy.',
    task:'Write care_ranges(examples, intervals). examples contains exactly the two ordered reference pairs described above. intervals contains valid [low, high] pairs with low <= high. For each interval call your saved classify_plants(examples, [low, high]); return "ask" if outside the reference range or endpoint labels differ, otherwise the shared label. Return a list and preserve inputs.',
    starter:'def care_ranges(examples, intervals):\n    decisions = []\n    # Probe both ends with classify_plants.\n    return decisions',
    solution:'def care_ranges(examples, intervals):\n    decisions = []\n    for low, high in intervals:\n        labels = classify_plants(examples, [low, high])["labels"]\n        outside = low < examples[0][0] or high > examples[1][0]\n        decisions.append("ask" if outside or labels[0] != labels[1] else labels[0])\n    return decisions',
    checks:check('care_ranges',`import copy
examples=[[20,"check"],[80,"rest"]]; ranges=[[20,30],[40,60],[60,80],[10,25],[75,90],[50,50]]
before=copy.deepcopy((examples,ranges));assert f(examples,ranges)==["check","ask","rest","ask","ask","check"], "Respect range limits, disagreement, and the classifier's first-example tie."
assert (examples,ranges)==before and f(examples,[])==[]
assert f([[0,"check"],[10,"rest"]],[[1,2],[4,6],[8,9]])==["check","ask","rest"]`),
    hint:'Read the two labels from classify_plants. Outside-range checks use examples[0][0] and examples[1][0].',
    demo:'care_ranges([[20,"check"],[80,"rest"]], [[25,35],[45,55],[65,75],[10,25]])',
    outcome:'Elio ties an amber ribbon to uncertain pots. The nursery’s care board now makes room for “let’s look together,” instead of pretending every reading is certain.'}),
  make({id:'rowan-tomorrow',npc:'rowan',requires:92,previous:'rowan-shared-oven',buildings:['bakery'],originalProjects:['project-pantry-ledger'],tools:['bakery-planner'],
    title:'Enough bread, with room to be wrong',
    story:'The bakery has several mornings of demand recorded. Rowan wants to try a forecast, but first asks whether it would have helped on mornings already lived.',
    lesson:'Backtest a trailing-mean forecast using only earlier days. Compare it with yesterday’s demand over exactly the same evaluation days. Prefer the mean only when its MAE is strictly lower; ties keep the simpler yesterday baseline. Forecast the next morning with the chosen method, round up to whole loaves, then use your saved oven planner. A retrospective win is evidence, not a guarantee about tomorrow.',
    task:'Write tomorrow_bake(history, width, capacity). history is a list of nonnegative demand counts, width a positive integer smaller than len(history), capacity positive. For t from width onward, compare mean(history[t-width:t]) and history[t-1] against history[t]. Return {"method": "mean" or "yesterday", "mae": chosen_MAE, "loaves": rounded_up_next_prediction, "oven": plan_bakes([["daily loaf", loaves]], capacity)}. On ties choose yesterday. Reject invalid width with ValueError; preserve history.',
    starter:'import math\n\ndef tomorrow_bake(history, width, capacity):\n    # Compare on the same past-only evaluation mornings.\n    return {}',
    solution:'import math\n\ndef tomorrow_bake(history, width, capacity):\n    if width <= 0 or width >= len(history):\n        raise ValueError("Keep at least one evaluation morning")\n    mean_error = sum(abs(sum(history[t-width:t])/width-history[t]) for t in range(width,len(history)))/(len(history)-width)\n    yesterday_error = sum(abs(history[t-1]-history[t]) for t in range(width,len(history)))/(len(history)-width)\n    use_mean = mean_error < yesterday_error\n    loaves = math.ceil(sum(history[-width:])/width if use_mean else history[-1])\n    return {"method": "mean" if use_mean else "yesterday", "mae": mean_error if use_mean else yesterday_error, "loaves": loaves, "oven": plan_bakes([["daily loaf",loaves]],capacity)}',
    checks:check('tomorrow_bake',`import math
for history,width,capacity in [([2,8,2,8,2],2,3),([1,2,3,4,5],2,4),([0,0,0],1,2),([1,4,2,5],2,4)]:
    before=history.copy(); n=len(history)-width
    a=sum(abs(sum(history[t-width:t])/width-history[t]) for t in range(width,len(history)))/n
    b=sum(abs(history[t-1]-history[t]) for t in range(width,len(history)))/n
    expected=math.ceil(sum(history[-width:])/width if a<b else history[-1]); r=f(history,width,capacity)
    assert r["method"]==("mean" if a<b else "yesterday") and abs(r["mae"]-min(a,b))<1e-9, "Compare the same past-only mornings, keeping the baseline on ties."
    assert r["loaves"]==expected and sum(sum(batch.values()) for batch in r["oven"]["batches"])==expected
    assert all(sum(batch.values())<=capacity for batch in r["oven"]["batches"]) and history==before
for width in [0,-1,3]:
    try: f([1,2,3],width,2)
    except ValueError: pass
    else: raise AssertionError("Keep a positive window and an evaluation morning.")`),
    hint:'Keep both accumulated errors on the same t values. After selecting the method, forecast from the end of history and pass whole loaves to plan_bakes.',
    demo:'tomorrow_bake([3,9,4,8,3,9,4], 2, 4)',
    outcome:'The chalkboard beside the oven now shows a forecast and its past error. Rowan leaves a little space beneath it: “Tomorrow can still surprise us.”'}),
  make({id:'elio-heater-review',npc:'elio',requires:100,previous:'elio-care-ranges',buildings:['greenhouse'],originalProjects:['project-lantern-predictor'],
    title:'Warmth for every corner',
    story:'Mira has fitted the nursery with a small learning heater. Elio asks you to compare trial reports before replacing the familiar controls; the cold corner matters as much as the sunny bench.',
    lesson:'A low pooled MAE can conceal poor results in a small room. Every report here contains absolute errors from the same validation observations, grouped by room. A candidate must satisfy the per-room limit and improve the baseline’s pooled MAE. Pool by observations, not by averaging room means. This selects on validation; a separate final test and a human review still belong before real use.',
    task:'Write choose_heater(baseline, candidates, limit). Each report has id and errors mapping the same rooms to nonempty lists of nonnegative absolute errors; matching rooms have equal counts across reports. Return {"id": chosen_id, "mae": pooled_MAE, "rooms": room_MAEs}. Start with baseline. A candidate is eligible only if every room MAE <= limit and pooled MAE is strictly below the current best. Ties keep the earlier choice. Preserve reports. If none qualify, keep baseline even when it exceeds the limit: that means review is needed.',
    starter:'def choose_heater(baseline, candidates, limit):\n    # Separate the pooled comparison from the per-room guard.\n    return {}',
    solution:'def choose_heater(baseline, candidates, limit):\n    def report(item):\n        rooms = {name: sum(values)/len(values) for name,values in item["errors"].items()}\n        errors = [value for values in item["errors"].values() for value in values]\n        return {"id": item["id"], "mae": sum(errors)/len(errors), "rooms": rooms}\n    best = report(baseline)\n    for item in candidates:\n        candidate = report(item)\n        if all(value <= limit for value in candidate["rooms"].values()) and candidate["mae"] < best["mae"]:\n            best = candidate\n    return best',
    checks:check('choose_heater',`import copy
b={"id":"familiar","errors":{"sun":[2,2,2],"shade":[2]}}
cs=[{"id":"uneven","errors":{"sun":[0,0,0],"shade":[5]}},{"id":"gentle","errors":{"sun":[1,1,1],"shade":[2]}},{"id":"same","errors":{"sun":[1,1,1],"shade":[2]}}]
before=copy.deepcopy((b,cs));assert f(b,cs,2)=={"id":"gentle","mae":1.25,"rooms":{"sun":1,"shade":2}}, "Guard each room, pool by observations, and keep the first tie."
assert f(b,cs,0)["id"]=="familiar" and f(b,[],2)["mae"]==2
assert f(b,[cs[0]],6)["mae"]==1.25 and (b,cs)==before
assert f({"id":"old","errors":{"one":[0]}},[{"id":"new","errors":{"one":[0]}}],1)["id"]=="old"`),
    hint:'Use a helper to calculate the pooled error and room errors. Accept a candidate only if both the room limit and strict improvement checks pass.',
    demo:'choose_heater({"id":"familiar","errors":{"sun":[2,2,2],"shade":[2]}}, [{"id":"uneven","errors":{"sun":[0,0,0],"shade":[5]}},{"id":"gentle","errors":{"sun":[1,1,1],"shade":[2]}}], 2)',
    outcome:'A little brass review plate hangs by the heater. Elio keeps the room-by-room results beside it, so the quiet corner is never lost inside an average.'}),
  make({id:'mira-reading-bag',npc:'mira',requires:104,previous:'mira-library-round',buildings:['library'],originalProjects:['project-festival-scores'],
    title:'The small bag with many possibilities',
    story:'Nell’s traveling library has become a tradition. The new reading bag can carry only so much; Mira asks you to plan a whole collection instead of choosing each attractive book in isolation.',
    lesson:'This is a 0/1 knapsack: each book can travel once. Integer weight uses capacity and positive value measures a fictional request score. Dynamic programming compares taking and leaving each book. Update capacities downward so one book cannot be reused during the same pass. On an equal score choose the lexicographically smaller list of original indices, making decisions reproducible.',
    task:'Write reading_bag(books, capacity). books is a list of {"title": str, "weight": positive_int, "value": positive_int}; capacity is a nonnegative integer. Return {"indices": ascending_selected_indices, "value": total_value, "weight": total_weight} maximizing value within capacity. Break ties by lexicographically smaller index list. Keep duplicate titles as distinct books, preserve inputs, and use dynamic programming.',
    starter:'def reading_bag(books, capacity):\n    best = [(0, []) for _ in range(capacity+1)]\n    return {"indices": [], "value": 0, "weight": 0}',
    solution:'def reading_bag(books, capacity):\n    best = [(0, []) for _ in range(capacity+1)]\n    for index, book in enumerate(books):\n        for space in range(capacity, book["weight"]-1, -1):\n            value, chosen = best[space-book["weight"]]\n            candidate = (value+book["value"], chosen+[index])\n            old = best[space]\n            if candidate[0] > old[0] or candidate[0] == old[0] and candidate[1] < old[1]:\n                best[space] = candidate\n    value, chosen = best[capacity]\n    return {"indices": chosen, "value": value, "weight": sum(books[i]["weight"] for i in chosen)}',
    checks:check('reading_bag',`import copy,itertools
books=[{"title":"Clocks","weight":3,"value":4},{"title":"Gardens","weight":2,"value":3},{"title":"Gardens","weight":2,"value":3},{"title":"Tea","weight":1,"value":1}]
before=copy.deepcopy(books)
for capacity in range(10):
    possibilities=[]
    for flags in itertools.product([False,True],repeat=len(books)):
        ids=[i for i,v in enumerate(flags) if v]; weight=sum(books[i]["weight"] for i in ids)
        if weight<=capacity: possibilities.append((sum(books[i]["value"] for i in ids),ids,weight))
    value,ids,weight=min(possibilities,key=lambda item:(-item[0],item[1]))
    assert f(books,capacity)=={"indices":ids,"value":value,"weight":weight}, "Choose the whole best collection, with each book at most once and stable ties."
assert books==before and f([],4)=={"indices":[],"value":0,"weight":0}
assert f([{"title":"One","weight":1,"value":2}],5)["value"]==2`),
    hint:'For each book, loop space from capacity down to its weight. Store both best score and chosen indices; compare indices only when scores tie.',
    demo:'reading_bag([{"title":"Clocks","weight":3,"value":4},{"title":"Gardens","weight":2,"value":3},{"title":"Tea Tales","weight":2,"value":3}], 4)',
    outcome:'Mira stitches a brass clasp onto Nell’s reading bag. The collection travels with a plan—and a reminder that the scores are suggestions the readers can question.'})
];
