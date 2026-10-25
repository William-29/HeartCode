import { laterFellowshipQuests } from './fellowship-later-content.js';
import { code, quiz, check } from './fellowship-shared.js';

// Quests 85–108 extend the existing trail; IDs and ordering of quests 1–84 stay fixed.
export const fellowshipChapters = [
  {id:21,numeral:'XXII',title:'The tidemark dispatch',topic:'Python',label:'DEPENDABLE STREAMS',icon:'database',description:'Handle repeated messages, combine statistics and reason about late arrivals.',difficulty:'Expert practice',color:'blue'},
  {id:22,numeral:'XXIII',title:'The timekeeper’s terraces',topic:'ML',label:'FORECASTING THROUGH TIME',icon:'clock',description:'Build past-only features, time folds and an honest forecast backtest.',difficulty:'Expert practice',color:'gold'},
  {id:23,numeral:'XXIV',title:'The pattern meadow',topic:'ML',label:'UNSUPERVISED LEARNING',icon:'leaf',description:'Discover clusters by alternating assignments and centers, then question what they mean.',difficulty:'Expert+',color:'green'},
  {id:24,numeral:'XXV',title:'The gradient foundry',topic:'AI',label:'BACKPROPAGATION & TRAINING',icon:'flask',description:'Check derivatives, trace gradients and train a small hidden layer.',difficulty:'Expert+',color:'rose'},
  {id:25,numeral:'XXVI',title:'The prism archive',topic:'AI',label:'SEQUENCES & EVIDENCE',icon:'book',description:'Mask future tokens, evaluate ranked evidence and plan a limited context budget.',difficulty:'Advanced synthesis',color:'purple'},
  {id:26,numeral:'XXVII',title:'The wayfarers’ fellowship',topic:'AI',label:'DECISIONS OVER TIME',icon:'trophy',description:'Plan with uncertain transitions, delayed rewards and a bounded decision horizon.',difficulty:'Fellowship capstone',color:'gold'}
];
const smoothHelper=`def smooth_level(values, alpha):
    level = values[0]
    for value in values[1:]:
        level = alpha * value + (1-alpha) * level
    return level
`;
const assignHelper=`def assign_clusters(points, centers):
    return [min(range(len(centers)), key=lambda j:
                sum((x-c)**2 for x,c in zip(point, centers[j])))
            for point in points]
`;
const centerHelper=`def move_centers(points, labels, previous):
    result = []
    for j, old in enumerate(previous):
        members = [p for p,label in zip(points,labels) if label == j]
        result.append([sum(p[d] for p in members)/len(members)
                       for d in range(len(old))] if members else list(old))
    return result
`;

export const fellowshipQuests = [
code({id:'dispatch-revisions',chapter:21,title:'A parcel should arrive only once',subtitle:'Reconcile retried and out-of-order events',
lesson:['The beacon report reaches a harbour post office. Boats sometimes retransmit a parcel message, and an older revision can arrive after its correction. Counting every arrival would count the same parcel twice.', 'Use a stable event ID as an idempotency key. Keep the record with the highest revision for each ID; an equal revision leaves the first record unchanged. Preserve the order in which IDs first appeared, even when replacing a record.', 'This is an in-memory reconciliation rule, not a guarantee of exactly-once network delivery. A production system must also persist its deduplication state and define how long IDs remain valid.'],
example:'events = [{"id":"tea", "revision":2, "value":8},\n          {"id":"tea", "revision":1, "value":3}]\n# The older message must not overwrite value 8.',
task:'Write latest_events(events). Each record has a hashable id, integer revision and numeric value. Return one copied record per ID, ordered by first appearance, keeping the greatest revision and the first record on a revision tie. Input may be empty. Do not mutate records or return the original dictionaries.',
starter:'def latest_events(events):\n    latest = {}\n    # Replace an ID only when its revision increases.\n    return []',
solution:`def latest_events(events):
    latest = {}
    for event in events:
        key = event["id"]
        if key not in latest or event["revision"] > latest[key]["revision"]:
            latest[key] = dict(event)
    return list(latest.values())`,
checks:check('latest_events',`import copy
events=[{"id":"a","revision":2,"value":8},{"id":0,"revision":0,"value":0},{"id":"a","revision":1,"value":3},{"id":"a","revision":2,"value":99},{"id":0,"revision":3,"value":5}]
before=copy.deepcopy(events)
out=f(events)
assert out==[events[0],events[4]], "Keep highest revisions in first-seen ID order; ties keep the first record."
assert events==before and all(all(row is not e for e in events) for row in out), "Return copies and preserve the incoming ledger."
assert f(events+events)==out, "Replayed messages must not change the result."
assert f([])==[]`),
hint:'A dictionary keeps insertion order. Updating an existing key does not move it; use dict(event) when storing a record.',takeaway:'A retry should not duplicate an effect, and a late older message should not undo a correction.'}),
code({id:'online-moments',chapter:21,title:'The harbour’s running ledger',subtitle:'Update mean and variance without storing the stream',
lesson:['The postmaster wants the average parcel weight and its spread without retaining every reading. Keep (count, mean, M2), where M2 is the sum of squared deviations from the running mean.', 'Welford’s update for each x is: increment count; delta = x - mean; mean += delta/count; M2 += delta*(x - new_mean). Notice that the final factor uses the UPDATED mean. The population variance is M2/count; sample variance would use count-1.', 'Subtracting mean squared from mean-of-squares can lose precision for large, nearly equal readings. This incremental calculation is usually more stable, though floating-point arithmetic still has limits. An empty stream has state (0, 0.0, 0.0).'],
example:'# Starting at (1, 2, 0), receive 4:\n# count=2, delta=2, mean=3, M2=0+2*(4-3)=2.\n# Population variance is 2/2 = 1.',
task:'Write running_moments(source). Consume the iterable once and return (count, mean, M2) using Welford’s update. Return (0, 0.0, 0.0) for no observations. Keep constant-size running state rather than collecting observations.',
starter:'def running_moments(source):\n    count, mean, m2 = 0, 0.0, 0.0\n    # Update these three values for each observation.\n    return count, mean, m2',
solution:`def running_moments(source):
    count, mean, m2 = 0, 0.0, 0.0
    for value in source:
        count += 1
        delta = value - mean
        mean += delta / count
        m2 += delta * (value - mean)
    return count, mean, m2`,
checks:check('running_moments',`for values in [[],[7],[2,4,6],[-2,0,2],[10**9+1,10**9+2,10**9+3]]:
    got=f(iter(values)); mean=sum(values)/len(values) if values else 0
    assert len(got)==3 and got[0]==len(values)
    assert abs(got[1]-mean)<1e-7 and abs(got[2]-sum((x-mean)**2 for x in values))<1e-7, "M2 uses the old delta and the new mean."
assert f(x for x in [1,1,1])==(3,1,0)`),
hint:'Compute delta before changing the mean, then update M2 after changing it. Return M2 itself, not the variance.',takeaway:'A compact sufficient summary lets you calculate a stream’s spread without keeping its full history.'}),
code({id:'merge-moments',chapter:21,title:'Two boats bring one story',subtitle:'Combine summaries with different sample sizes',
lesson:['Two boats summarize different batches as (n, mean, M2). Averaging their means equally would give a tiny boat the same influence as a large one. Weight the combination by the counts.', 'For summaries A and B, let n = na+nb and delta = mean_b-mean_a. The combined mean is mean_a + delta*nb/n. The combined M2 is M2a+M2b+delta²*na*nb/n. The extra term accounts for separation between the batch means.', 'Empty summaries contribute nothing. This merge rule permits parallel processing without collecting all the rows in one place. It assumes disjoint batches: overlapping batches would double-count observations, so the parcel IDs still matter.'],
example:'# A=(2, 3, 2) summarizes [2,4]; B=(1,9,0) summarizes [9].\n# n=3, delta=6 -> mean=5, M2=2+0+36*2/3=26.',
task:'Write merge_moments(a, b) for valid (count, mean, M2) tuples with nonnegative counts. Return their combined tuple using the formula. If either count is zero, return the other tuple. Both empty inputs use (0, 0.0, 0.0).',
starter:'def merge_moments(a, b):\n    na, ma, sa = a\n    nb, mb, sb = b\n    return (0, 0.0, 0.0)',
solution:`def merge_moments(a, b):
    na, ma, sa = a
    nb, mb, sb = b
    if na == 0:
        return tuple(b)
    if nb == 0:
        return tuple(a)
    n = na + nb
    delta = mb - ma
    return n, ma + delta*nb/n, sa + sb + delta*delta*na*nb/n`,
checks:check('merge_moments',`for a,b,want in [((2,3,2),(1,9,0),(3,5,26)),((1,2,0),(3,6,8),(4,5,20)),((0,0,0),(2,3,2),(2,3,2)),((2,3,2),(0,0,0),(2,3,2)),((0,0,0),(0,0,0),(0,0,0))]:
    out=f(a,b)
    assert isinstance(out,tuple) and len(out)==3 and all(abs(x-y)<1e-9 for x,y in zip(out,want)), "Include between-batch variation and weight means by counts."
    assert all(abs(x-y)<1e-9 for x,y in zip(f(b,a),want)), "Swapping batches should preserve the combined summary."`),
hint:'Handle empty counts first to avoid division by zero. Add the between-batch term to M2; do not just add the two M2 values.',takeaway:'Combining evidence correctly requires knowing how much evidence each summary represents.'}),
quiz({id:'late-tide-evidence',chapter:21,title:'The boat after closing time',subtitle:'Choose an explicit policy for late data',
lesson:['Event time is when something happened; arrival time is when its record reaches the system. Bad weather can delay a boat, so these orders need not match.', 'A watermark is a processing estimate or policy about how far event time has advanced. It helps decide when to close a window; it cannot prove that every earlier event has arrived. Systems must decide whether to revise old results, retain a late-data queue, or reject events with a documented reason.', 'The harbour promises a provisional hourly report with a correction history. Silently pretending that a delayed reading never existed would make the report look more certain than it is.'],
task:'An 11:50 reading arrives at 12:20, after the 11:00–12:00 report was provisionally closed. Which response matches the harbour’s promise?',options:['Relabel the event as 12:20 so the earlier report appears complete.','Record the late arrival, revise the earlier window using its event time, and retain the report versions.','Assume the watermark proves the reading is fraudulent.','Count it in both hours to avoid losing it.'],answer:1,
explanations:['Changing event time alters what was actually observed.','Correct. The result can improve while its correction history remains visible.','Watermarks are not proofs that no older event can arrive.','Double-counting would distort both the count and the statistics.'],hint:'Separate when the observation happened from when the village learned about it.',takeaway:'Timely reports and final reports are different promises; make late-data handling explicit.'}),
code({id:'past-only-lags',chapter:22,title:'Yesterday’s steps on the terrace',subtitle:'Build supervised examples from a time series',
lesson:['The terrace gardener wants to predict the next day’s water use from recent days. A lag feature contains a value observed before the target time. For width 2, a row uses [day t-2, day t-1] to predict day t.', 'Do not include the target value in its own feature window. That would make training look impressive while giving the model information unavailable at prediction time. These readings are equally spaced and already ordered.', 'The transformation creates overlapping examples. They are not independent random samples; split and evaluate them in time order. Fit any later scaling only on the training portion.'],
example:'# [2,4,8,10], width=2 ->\n# features [[2,4],[4,8]], targets [8,10]',
task:'Write lag_rows(values, width). Return (features, targets), using exactly width earlier observations for each target, oldest first. width is an integer; reject width <= 0 with ValueError. Too few observations return ([], []). Preserve values and return separate feature lists.',
starter:'def lag_rows(values, width):\n    features, targets = [], []\n    return features, targets',
solution:`def lag_rows(values, width):
    if width <= 0:
        raise ValueError("Positive lag width required")
    return [values[t-width:t] for t in range(width,len(values))], list(values[width:])`,
checks:check('lag_rows',`values=[2,4,8,10]; before=values.copy()
assert f(values,2)==([[2,4],[4,8]],[8,10]), "Each target needs only earlier values."
assert values==before and f([3,0,-1],1)==([[3],[0]],[0,-1])
assert f([1,2],2)==([],[]) and f([],3)==([],[])
xs,ys=f(values,2); xs[0][0]=99
assert values==before and xs[1]==[4,8], "Feature rows must be separate lists."
for width in [0,-1]:
    try: f(values,width)
    except ValueError: pass
    else: raise AssertionError("Reject nonpositive lag widths.")`),
hint:'The first target index is width. Slice values[t-width:t], whose end excludes the target at t.',takeaway:'Feature availability at prediction time is part of a model’s contract.'}),
code({id:'expanding-time-folds',chapter:22,title:'Leave a little space for tomorrow',subtitle:'Generate expanding time folds with a gap',
lesson:['A single time split answers one historical question. Walk-forward validation repeats that question at later origins: train on the past, then evaluate on a later block.', 'A gap leaves observations between training and validation unused. This can help when labels take time to arrive or nearby examples overlap, but the appropriate gap depends on when features and outcomes become available.', 'Our convention starts with min_train rows, skips gap rows, then evaluates test_size rows. Move the test start forward by test_size and expand training. Emit only full test blocks. This is a teaching convention; libraries may choose the first split differently.'],
example:'# n=9, min_train=3, test_size=2, gap=1\n# train [0,1,2], test [4,5]\n# train [0,1,2,3,4], test [6,7]',
task:'Write time_folds(n, min_train, test_size, gap). Return (train_indices, test_indices) pairs using the convention above. All arguments are integers. Raise ValueError if n < 0, min_train <= 0, test_size <= 0 or gap < 0. Return [] if no complete fold fits.',
starter:'def time_folds(n, min_train, test_size, gap):\n    folds = []\n    return folds',
solution:`def time_folds(n, min_train, test_size, gap):
    if n < 0 or min_train <= 0 or test_size <= 0 or gap < 0:
        raise ValueError("Invalid time-fold sizes")
    folds = []
    for start in range(min_train+gap, n-test_size+1, test_size):
        folds.append((list(range(start-gap)), list(range(start,start+test_size))))
    return folds`,
checks:check('time_folds',`assert f(9,3,2,1)==[([0,1,2],[4,5]),([0,1,2,3,4],[6,7])], "Expand the past and keep the stated gap."
assert f(6,2,2,0)==[([0,1],[2,3]),([0,1,2,3],[4,5])]
assert f(4,3,2,0)==[] and f(0,1,1,0)==[]
for args in [(-1,1,1,0),(4,0,1,0),(4,1,0,0),(4,1,1,-1)]:
    try: f(*args)
    except ValueError: pass
    else: raise AssertionError("Validate all fold sizes.")`),
hint:'The test start is min_train+gap. Training ends at start-gap, and a test block fits only if start+test_size <= n.',takeaway:'Validation must reproduce the information boundary of the future decision.'}),
code({id:'exponential-forecast',chapter:22,title:'A gentle memory for the waterwheel',subtitle:'Exponential smoothing for a changing level',
lesson:['A recent observation can deserve more weight than a distant one. Simple exponential smoothing updates a level with level = alpha*x + (1-alpha)*old_level, starting at the first observation.', 'Alpha near 1 responds quickly; alpha near 0 changes slowly. Choose alpha using past validation, not the future test outcomes. No setting is best for every series.', 'This model has no trend or seasonality. Its multi-step forecast repeats the final level; it does not invent new observations to update that level. Trend and seasonal patterns need different models or features.'],
example:'# values [2,6,10], alpha=.5 -> levels 2,4,7.\n# A three-step forecast is [7,7,7].',
task:'Write level_forecast(values, alpha, horizon). Return horizon copies of the final smoothed level. Values is a nonempty list of finite readings, horizon an integer >= 0 and alpha in [0,1]. Raise ValueError for violations of those three conditions. Preserve values.',
starter:'def level_forecast(values, alpha, horizon):\n    return []',
solution:`def level_forecast(values, alpha, horizon):
    if not values or not 0 <= alpha <= 1 or horizon < 0:
        raise ValueError("Need readings, alpha in [0,1] and a nonnegative horizon")
    level = values[0]
    for value in values[1:]:
        level = alpha*value + (1-alpha)*level
    return [level]*horizon`,
checks:check('level_forecast',`values=[2,6,10]
assert f(values,.5,3)==[7,7,7] and values==[2,6,10]
assert f(values,0,2)==[2,2] and f(values,1,2)==[10,10]
assert f([0],.4,0)==[] and f([-2],.5,1)==[-2]
for args in [([],.5,1),([1],-.1,1),([1],1.1,1),([1],.5,-1)]:
    try: f(*args)
    except ValueError: pass
    else: raise AssertionError("Validate observations, smoothing weight and horizon.")`),
hint:'Each new level mixes the current reading with the previous level. After consuming the observations, repeat that level without updating it.',takeaway:'A forecast should reflect the model’s assumptions, including the patterns it cannot represent.'}),
code({id:'terrace-backtest',chapter:22,title:'The forecast earns its place',subtitle:'Compare one-step forecasts with a persistence baseline',minutes:24,
lesson:['The timekeeper requests an honest backtest. At each origin t, fit the smoothing level on values[:t], forecast values[t], then reveal that outcome. The last observed value values[t-1] is the persistence baseline.', 'A forecast at an earlier origin must not change when later observations are altered. This is a useful leakage test. Here alpha is already chosen; using this same backtest repeatedly to choose it would turn the results into validation rather than a final test.', 'Store predictions as well as mean absolute error. A single average hides changes over time. Improvement over a baseline on this history is useful evidence, not a promise about every future season.'],
example:'# At origin t=3, training is values[:3].\n# The outcome values[3] is used only after making the forecast.',
task:'Write backtest(values, start, alpha) using smooth_level. For each t from start to len(values)-1, predict from values[:t]. Return predictions, mae, and baseline_mae in a dictionary. The baseline predicts values[t-1]. Inputs are finite, 1 <= start < len(values), alpha in [0,1]. Preserve values.',
starter:smoothHelper+'\ndef backtest(values, start, alpha):\n    predictions = []\n    return {}',
solution:smoothHelper+`
def backtest(values, start, alpha):
    predictions = [smooth_level(values[:t],alpha) for t in range(start,len(values))]
    actual = values[start:]
    return {"predictions":predictions,
            "mae":sum(abs(a-p) for a,p in zip(actual,predictions))/len(actual),
            "baseline_mae":sum(abs(values[t]-values[t-1]) for t in range(start,len(values)))/len(actual)}`,
checks:check('backtest',`import copy
values=[2,6,10,4,8]; before=copy.deepcopy(values)
r=f(values,2,.5)
assert r["predictions"]==[4,7,5.5], "Predict at each origin using only its earlier readings."
assert abs(r["mae"]-11.5/3)<1e-10 and abs(r["baseline_mae"]-14/3)<1e-10
assert values==before
assert f([2,6,10,400,800],2,.5)["predictions"][:2]==r["predictions"][:2], "Future outcomes must not rewrite earlier forecasts."
assert f([5,5,5],1,.5)=={"predictions":[5,5],"mae":0,"baseline_mae":0}
assert f([1,4,7],1,1)["mae"]==f([1,4,7],1,1)["baseline_mae"]`),
hint:'Build predictions before calculating errors. At time t, exclude values[t] from the history passed to smooth_level.',takeaway:'An honest forecasting experiment advances its information boundary one step at a time.'}),
code({id:'meadow-assignment',chapter:23,title:'Baskets without labels',subtitle:'Assign examples to their nearest cluster center',
lesson:['The meadow has measurements but no answer labels. K-means groups points around centers using squared Euclidean distance. This is unsupervised learning: a cluster number is not a known plant species.', 'For each point, sum squared coordinate differences to each center and choose the least distance. Break equal distances by the lower center index so repeated runs behave predictably.', 'Distances depend on units. A feature measured in thousands may dominate one measured in fractions. Preprocessing choices influence the clusters; choose and fit them with the intended use in mind.'],
example:'# point [2,0], centers [[0,0],[4,0]] -> equal distance 4.\n# Choose center index 0 by the stated tie rule.',
task:'Write assign_clusters(points, centers). Return nearest-center indices, in point order, using squared Euclidean distance; ties choose the lower index. Centers is nonempty and all vectors share a positive dimension. Points may be empty. Preserve all inputs.',
starter:'def assign_clusters(points, centers):\n    return []',solution:assignHelper,
checks:check('assign_clusters',`import copy
points=[[2,0],[4,1],[-1,0],[0,5]]; centers=[[0,0],[4,0],[0,6]]
before=copy.deepcopy((points,centers))
assert f(points,centers)==[0,1,0,2], "Use all coordinates and break ties by center index."
assert (points,centers)==before and f([],centers)==[]
assert f([[1,2,8]],[[1,2,9],[1,2,0]])==[0]
assert f([[0]],[[0],[0]])==[0]`),
hint:'Use min over the center indices with squared distance as the key. Iterating indices in order gives the requested tie rule.',takeaway:'Unsupervised grouping begins with a choice of representation and distance, not a supplied correct label.'}),
code({id:'meadow-centers',chapter:23,title:'Move the gathering places',subtitle:'Recompute centroids and handle empty clusters',
lesson:['After assignment, move each center to the coordinate-wise mean of its assigned points. For fixed assignments this minimizes the sum of squared distances inside each group.', 'An empty cluster has no mean. Implement an explicit policy: this exercise keeps its previous center. Other systems may reseed it, which changes the algorithm’s behavior.', 'Return new lists. If updating a center also changes the old state, comparing iterations becomes unreliable. Empty clusters and repeated points are normal edge cases, not reasons to discard the whole dataset.'],
example:'# Points [0,2] and [4,6] assigned to cluster 0\n# give center [(0+4)/2,(2+6)/2] = [2,4].',
task:'Write move_centers(points, labels, previous). Return the mean vector for each cluster index in previous order; retain the previous vector when that cluster is empty. Points and labels match, labels are valid indices, and all vectors have the same positive width. Return independent lists and preserve inputs.',
starter:'def move_centers(points, labels, previous):\n    result = []\n    return result',solution:centerHelper,
checks:check('move_centers',`import copy
p=[[0,2],[4,6],[9,1]]; labels=[0,0,2]; old=[[0,0],[5,5],[10,0]]
before=copy.deepcopy((p,labels,old)); out=f(p,labels,old)
assert out==[[2,4],[5,5],[9,1]], "Average coordinate-wise, retaining empty centers."
assert (p,labels,old)==before
out[1][0]=99
assert old[1]==[5,5], "Return new center lists, including retained centers."
assert f([],[],[[1,2],[3,4]])==[[1,2],[3,4]]`),
hint:'For each cluster j, gather its assigned points. Average each dimension separately, or copy previous[j] if there are none.',takeaway:'An iterative model needs an explicit empty-group policy and careful separation of old and new state.'}),
code({id:'lloyd-meadow',chapter:23,title:'Let the meadow settle',subtitle:'Alternate assignments and centroids',minutes:25,
lesson:['Lloyd’s k-means algorithm alternates the two steps you built: assign points to centers, then recompute centers from those assignments. Each full iteration uses the centers produced by the preceding iteration.', 'Stop after max_steps or when the largest squared center movement is at most tolerance squared. Recompute labels against the FINAL centers before returning, since the last centroid update may change the nearest center.', 'Report inertia: the sum of squared distances to assigned centers. Lower inertia for a fixed k and representation indicates tighter groups, not proof of meaningful categories. Different initial centers can reach different local solutions.'],
example:'# One iteration can move centers far enough that an old assignment changes.\n# Always assign once more after the final center update.',
task:'Write cluster_meadow(points, initial, max_steps, tolerance) using the supplied helpers. Copy initial centers, alternate assignments and updates, and stop by the rule above. Return {"centers": ..., "labels": ..., "inertia": ...}. Inputs have valid shapes, initial is nonempty, max_steps is an integer >= 1 and tolerance >= 0. Reject invalid step/tolerance values with ValueError; preserve inputs.',
starter:assignHelper+'\n'+centerHelper+'\ndef cluster_meadow(points, initial, max_steps, tolerance):\n    centers = [list(c) for c in initial]\n    return {}',
solution:assignHelper+'\n'+centerHelper+`
def cluster_meadow(points, initial, max_steps, tolerance):
    if max_steps < 1 or tolerance < 0:
        raise ValueError("Need positive steps and nonnegative tolerance")
    centers = [list(c) for c in initial]
    for _ in range(max_steps):
        labels = assign_clusters(points, centers)
        updated = move_centers(points, labels, centers)
        movement = max(sum((a-b)**2 for a,b in zip(old,new)) for old,new in zip(centers,updated))
        centers = updated
        if movement <= tolerance*tolerance:
            break
    labels = assign_clusters(points, centers)
    inertia = sum(sum((x-c)**2 for x,c in zip(p,centers[j])) for p,j in zip(points,labels))
    return {"centers":centers,"labels":labels,"inertia":inertia}`,
checks:check('cluster_meadow',`import copy
p=[[0],[2],[10],[12]]; initial=[[0],[12]]; before=copy.deepcopy((p,initial))
r=f(p,initial,20,0)
assert r=={"centers":[[1],[11]],"labels":[0,0,1,1],"inertia":4}
assert (p,initial)==before
r=f([[0],[4],[5],[6]],[[0],[4]],1,0)
assert r["centers"]==[[0],[5]] and r["labels"]==[0,1,1,1] and r["inertia"]==2
r=f([[0],[2],[3],[10]],[[0],[3]],1,0)
assert r["labels"]==[0,0,1,1], "Return assignments for the final centers, not stale labels."
assert f([],[[1]],2,0)=={"centers":[[1]],"labels":[],"inertia":0}
for steps,tol in [(0,0),(2,-1)]:
    try: f(p,initial,steps,tol)
    except ValueError: pass
    else: raise AssertionError("Validate iteration controls.")`),
hint:'Save updated centers before testing movement. Once the loop ends, call assign_clusters again, then calculate inertia from those final labels.',takeaway:'Alternating local improvements can discover structure, but initialization and representation still shape the answer.'}),
quiz({id:'clusters-are-not-species',chapter:23,title:'A name is a promise',subtitle:'Interpret clusters without inventing ground truth',
lesson:['June clusters plants using height and leaf width. A tight group might reflect age, watering or the units of measurement rather than species. Cluster IDs can also permute between otherwise equivalent runs.', 'Inertia usually decreases as more centers are allowed, so comparing k=2 with k=20 by inertia alone favors complexity. Inspect stability, practical usefulness and the assumptions of the distance measure.', 'The meadow will use clusters as suggestions for a gardener to investigate. Naming them as confirmed species requires independent botanical evidence.'],
task:'A run with 20 centers has lower inertia than one with 3. What conclusion is justified?',options:['The meadow contains exactly 20 species.','Cluster 0 must represent the same species in every run.','The 20-center fit has lower within-cluster squared distance; usefulness and biological meaning still need evidence.','The lower inertia proves the model will improve every future harvest.'],answer:2,
explanations:['More centers can fit the same observations more tightly without discovering species.','Cluster indices are arbitrary identifiers, not stable biological labels.','Correct. The objective measures compactness under a chosen representation.','A fitting objective alone does not establish future benefit.'],hint:'Ask what inertia measures and what the dataset never supplied as labels.',takeaway:'Useful exploratory structure is a starting point for investigation, not an automatic claim about the world.'}),
...laterFellowshipQuests
];
