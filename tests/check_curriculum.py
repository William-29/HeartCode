import importlib.util
import json
import sys
sys.dont_write_bytecode = True

spec = importlib.util.spec_from_file_location('hearth_runtime', 'dist/runtime.py')
runtime = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runtime)
quests = json.load(sys.stdin)
for quest in quests:
    good = json.loads(runtime.run_source(quest['solution'], quest['checks']))
    assert good['passed'], f"{quest['id']}: solution failed: {good['error']}"
    blank = json.loads(runtime.run_source('pass', quest['checks']))
    assert not blank['passed'], f"{quest['id']}: accepted an empty solution"
    if quest.get('chapter', -1) >= 15:
        starter = json.loads(runtime.run_source(quest['starter'], quest['checks']))
        assert not starter['passed'], f"{quest['id']}: unfinished starter earned completion"

by_id = {quest['id']: quest for quest in quests}
wrong = [
    ('inventory-list', 'ingredients = ["mint", "water", "lemon"]\ningredients.append("honey")\nprint(4)'),
    ('inventory-list', 'ingredients = ["mint", "water", "lemon", "honey"]\nprint(len(ingredients))'),
    ('clean-the-pantry', 'readings = [12, None, 0, 18, None, 24]\nclean = [12, 0, 18, 24]\nprint(clean)'),
    ('door-keeper', 'level = 2\nprint("Train")'),
    ('repeat-the-spell', 'print("1\\n2\\n3\\n4\\n5")'),
    ('clean-the-pantry', 'readings = [12, None, 0, 18, None, 24]\nclean = [x for x in readings if x]\nprint(clean)'),
    ('spell-functions', 'def brew(herbs):\n    return 12'),
    ('learn-a-weight', 'ys = [2, 4, 6]\nweight = 2\nprint(2.0)'),
    ('measure-mistakes', 'def mae(actual, predicted):\n    return sum(a-p for a,p in zip(actual,predicted))/len(actual)'),
    ('safe-conversion', 'def safe_float(value):\n    try:\n        return float(value) or None\n    except (ValueError, TypeError):\n        return None'),
    ('pooled-validation', 'def pooled_mae(actual_folds, predicted_folds):\n    return sum(sum(abs(a-p) for a,p in zip(aa,pp))/len(aa) for aa,pp in zip(actual_folds,predicted_folds))/len(actual_folds)'),
    ('sigmoid-gate', 'import math\ndef sigmoid(x):\n    return 1/(1+math.exp(-x))'),
    ('cosine-compass', 'def cosine_similarity(a,b):\n    return sum(x*y for x,y in zip(a,b))'),
]
# Mutate working implementations to model specific conceptual mistakes. The same
# browser checks must reject these even though each submission is valid Python.
mutations = [
    ('word-ledger', 'text.lower().split()', 'text.split()'),
    ('median-orchard', 'ordered = sorted(values)', 'values.sort()\n    ordered = values'),
    ('variance-garden', '/ len(values)', '/ (len(values) - 1)'),
    ('transform-new-data', '(x - mean)', '(x - sum(values)/len(values))'),
    ('time-aware-split', 'ordered = sorted(rows, key=lambda row: row["date"])', 'rows.sort(key=lambda row: row["date"])\n    ordered = rows'),
    ('confusion-ledger', 'return counts', 'counts["fp"], counts["fn"] = counts["fn"], counts["fp"]\n    return counts'),
    ('precision-recall', 'return precision, recall', 'return recall, precision'),
    ('decision-threshold', 'score >= threshold', 'score > threshold'),
    ('one-neuron', ' + bias', ''),
    ('binary-log-loss', 'p = max(1e-12, min(1 - 1e-12, p))', 'p = p'),
    ('train-logistic', 'weight -=', 'weight +='),
    ('bag-of-words', 'text.lower().split()', 'text.split()'),
    ('retrieve-scrolls', '(-scores[i], i)', '(scores[i], i)'),
    ('fit-a-line', 'if denominator else 0.0', ''),
    ('choose-with-validation', 'return min(', 'return max('),
    ('honest-report', 'sum(sums.values())/len(actual)', 'sum(sums[g]/counts[g] for g in sums)/len(sums)'),
    ('masters-pipeline', 'fit_line(train_x, train_y)', 'fit_line(test_x, test_y)'),
    ('streaming-batches', 'for item in source:', 'for item in list(source):'),
    ('indexed-join', 'if o["customer_id"] in names', 'if names.get(o["customer_id"])'),
    ('rolling-window', 'total -= values[i - width]', 'total -= 0'),
    ('breadth-first-path', 'queue.popleft()', 'queue.pop()'),
    ('weighted-route', 'candidate < best.get(nxt, float("inf"))', 'nxt not in best'),
    ('gini-orchard', '(n / len(labels)) ** 2', '(n / len(labels))'),
    ('weighted-split-gain', '(len(left)*gini(left) + len(right)*gini(right)) / n', '(gini(left) + gini(right)) / 2'),
    ('learn-tree-stump', 'score < best_score - 1e-12', 'score <= best_score + 1e-12'),
    ('brier-weather', '(p-y)**2', '(int(p >= 0.5)-y)**2'),
    ('reliability-bins', 'min(int(p*bins), bins-1)', 'int(p*bins)'),
    ('bootstrap-interval', 'sample = [rng.choice(values) for _ in values]', 'sample = rng.sample(values, len(values))'),
    ('multiclass-softmax', 'math.exp(x - peak)', 'math.exp(x)'),
    ('multiclass-loss', ' + (peak-logits[target])', ''),
    ('dense-layer', 'max(0, sum(x*w for x,w in zip(inputs,row)) + bias)', 'sum(x*w for x,w in zip(inputs,row)) + bias'),
    ('attention-head', '/scale for key in keys', ' for key in keys'),
    ('category-drift', 'before.keys() | after.keys()', 'before.keys() & after.keys()'),
    ('selective-prediction', 'max(p, 1-p) >= minimum', 'p >= minimum'),
    ('beacon-monitor', 'drift > drift_limit', 'drift >= drift_limit'),
    ('beacon-monitor', 'if metrics["error"] is None:', 'if metrics["error"] == 0:'),
    ('dispatch-revisions', 'event["revision"] > latest[key]["revision"]', 'event["revision"] >= latest[key]["revision"]'),
    ('online-moments', 'm2 += delta * (value - mean)', 'm2 += delta * delta'),
    ('merge-moments', 'sa + sb + delta*delta*na*nb/n', 'sa + sb'),
    ('past-only-lags', 'values[t-width:t]', 'values[t-width+1:t+1]'),
    ('expanding-time-folds', 'list(range(start-gap))', 'list(range(start))'),
    ('exponential-forecast', 'alpha*value + (1-alpha)*level', 'alpha*level + (1-alpha)*value'),
    ('terrace-backtest', 'values[:t]', 'values[:t+1]'),
    ('meadow-assignment', 'range(len(centers))', 'reversed(range(len(centers)))'),
    ('meadow-centers', 'if members else list(old)', 'if members else [0]*len(old)'),
    ('lloyd-meadow', 'labels = assign_clusters(points, centers)\n    inertia', '# Keep stale labels\n    inertia'),
    ('foundry-gradient-check', '/(2*h)', '/h'),
    ('relu-backward', 'dx[i] += dz*w', 'dx[i] = dz*w'),
    ('global-gradient-clip', 'min(1.0, limit/norm)', 'max(1.0, limit/norm)'),
    ('foundry-training-loop', 'sum(g[j] for g in gradients)/n', 'sum(g[j] for g in gradients)'),
    ('causal-archive', 'keys[:i+1],values[:i+1]', 'keys,values'),
    ('masked-token-loss', 'total/count if count else None', 'total/len(logit_batches) if count else None'),
    ('ranked-evidence', 'sorted(relevance.values(),reverse=True)', 'sorted([relevance.get(doc,0) for doc in ranking],reverse=True)'),
    ('context-budget', 'range(budget,cost-1,-1)', 'range(cost,budget+1)'),
    ('discounted-journey', 'rewards[i]+gamma*future', 'gamma*rewards[i]+future'),
    ('bellman-choices', 'p*(reward+gamma*values.get(nxt,0.0))', 'p*reward+gamma*values.get(nxt,0.0)'),
    ('fellowship-value-iteration', 'updated[state] = max(scores.values()) if scores else 0.0', 'updated[state] = max(scores.values()) if scores else 0.0\n            values[state] = updated[state]'),
    ('fellowship-budget-plan', 'previous[coins-cost][nxt]', 'previous[coins][nxt]'),
]
for quest_id, old, new in mutations:
    solution = by_id[quest_id]['solution']
    assert old in solution, f'{quest_id}: invalid misconception fixture'
    wrong.append((quest_id, solution.replace(old, new)))
for quest_id, code in wrong:
    result = json.loads(runtime.run_source(code, by_id[quest_id]['checks']))
    assert not result['passed'], f'{quest_id}: accepted incorrect implementation'

syntax = json.loads(runtime.run_source('print('))
assert not syntax['passed'] and 'SyntaxError' in syntax['error']
failure = json.loads(runtime.run_source('print(1 / 0)'))
assert not failure['passed'] and 'ZeroDivisionError' in failure['error']
limited = json.loads(runtime.run_source('print("x" * 20000)'))
assert limited['passed'] and len(limited['output']) == 12000
profit_quest = next(q for q in quests if 'bowls * price - cost' in q['solution'])
hardcoded_profit = json.loads(runtime.run_source('bowls = 6\nprice = 8\ncost = 10\nprofit = 38\nprint(profit)', profit_quest['checks']))
assert not hardcoded_profit['passed']
for prefix in ('HEARTH_RESULT:', 'EXHIBIT_RESULT:', 'NEIGHBOUR_RESULT:'):
    verbose = json.loads(runtime.run_source('print("debug" * 10000)\nprint(' + repr(prefix + '{"value": 7}') + ')'))
    assert verbose['passed'] and len(verbose['output']) < 2000
    assert json.loads(verbose['output'].split(prefix)[-1]) == {'value': 7}
    broken = json.loads(runtime.run_source('print("debug" * 10000)\nprint(' + repr(prefix + 'incomplete') + ')'))
    assert broken['passed'] and len(broken['output']) == 12000
print(f'All Python curriculum checks passed ({len(quests)} solutions, {len(quests)} empty submissions, {len(wrong)} misconception cases, and runtime errors).')
