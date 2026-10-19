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

by_id = {quest['id']: quest for quest in quests}
wrong = [
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
print(f'All Python curriculum checks passed ({len(quests)} solutions, {len(quests)} empty submissions, {len(wrong)} misconception cases, and runtime errors).')
