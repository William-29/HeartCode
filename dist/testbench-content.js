// Players supply assertions, not the implementation. Both valid tools and
// plausible faulty versions are executed by the same browser Python checker.
export function testBenchChecks(reference, alternatives, faults) {
  return `test = scope.get("test_tool")
assert callable(test), "Define test_tool(tool), then call tool inside your assertions."
assert any(isinstance(node, ast.Assert) for node in ast.walk(tree)), "Use assert to describe a result the tool must produce."
def candidate(source):
    env = {}
    exec(source, env)
    implementation = env["tool"]
    def tool(*args):
        return implementation(*args)
    return tool
for source in ${JSON.stringify([reference,...alternatives])}:
    try:
        test(candidate(source))
    except BaseException as error:
        raise AssertionError("Your tests rejected a correct tool. Check the contract and expected values. " + str(error))
missed = []
for name, source in ${JSON.stringify(faults)}:
    try:
        test(candidate(source))
    except AssertionError:
        pass
    except BaseException as error:
        raise AssertionError("Use an assertion to reveal the fault, rather than a broken test: " + str(error))
    else:
        missed.append(name)
assert not missed, "Still unnoticed: " + "; ".join(missed) + ". Add a distinguishing example."
print("Both correct tools accepted; ${faults.length} faulty tools caught. Your tests describe useful promises.")`;
}
const make = (data, reference, alternatives, faults) => ({kind:'testing',npc:'mira',xp:180+data.requires*3,coins:65+data.requires, ...data, reference, alternatives, faults, checks:testBenchChecks(reference,alternatives,faults)});
export const testBenchProjects = [
  make({id:'bench-baskets',requires:8,title:'An empty basket still counts',
    story:'Mira has borrowed Rowan’s pocket till. Before it returns to the café, she wants a few promises written down.',
    lesson:'An assertion checks a promise: assert tool([2, 3]) == 5. Here tool is a function supplied to your test. Your tests run against two correct implementations and several faulty ones. A useful suite accepts both correct versions and catches every fault. Empty inputs, multiple entries and fractional coins each reveal something different.',
    task:'Write test_tool(tool). tool(prices) must return the sum of a list of nonnegative prices, including decimal values; an empty list totals 0. Use assert statements. Do not implement tool yourself.',
    starter:'def test_tool(tool):\n    assert tool([2, 3]) == 5\n    # What about an empty basket and half a coin?\n',
    solution:'def test_tool(tool):\n    assert tool([]) == 0\n    assert tool([2, 3]) == 5\n    assert tool([0.5, 1.25]) == 1.75',
    hint:'Check [], [2, 3], and [0.5, 1.25]. Each should produce a different known total.',
    outcome:'Rowan slips your three examples beside the till. The first small purchase is checked with the same care as a full basket.'},
    'def tool(prices):\n    return sum(prices)',
    ['def tool(prices):\n    result = 0\n    for price in prices:\n        result += price\n    return result'],
    [['empty basket returns None','def tool(prices):\n    return sum(prices) if prices else None'],['only the first price counts','def tool(prices):\n    return prices[0] if prices else 0'],['fractional coins disappear','def tool(prices):\n    return sum(int(p) for p in prices)']]),
  make({id:'bench-boundaries',requires:28,previous:'bench-baskets',title:'The last book on the shelf',
    story:'Nell brings the library’s lending latch to Mira. “The last copy belongs to a reader too.”',
    lesson:'Boundary tests check where a rule changes. tool(copies, requested) returns a boolean: a nonnegative request is allowed when copies is nonnegative and enough copies remain. A request of zero is allowed, even on an empty shelf. Negative requests are invalid. The exact boundary often exposes < where <= belongs.',
    task:'Write test_tool(tool) with assertions for allowed requests, insufficient copies, an exact fit, zero on an empty shelf, and negative requests. Both arguments are integers; negative copies are also invalid.',
    starter:'def test_tool(tool):\n    assert tool(3, 2) is True\n    # Test both sides of the boundary.\n',
    solution:'def test_tool(tool):\n    assert tool(3, 2) is True\n    assert tool(2, 3) is False\n    assert tool(2, 2) is True\n    assert tool(0, 0) is True\n    assert tool(3, -1) is False\n    assert tool(-1, 0) is False',
    hint:'Exact equality, (0, 0), and a negative request distinguish the three broken latches.',
    outcome:'Nell pins the boundary examples by the lending desk. “The last copy now gets the same fair check as the first.”'},
    'def tool(copies, requested):\n    return copies >= 0 and 0 <= requested <= copies',
    ['def tool(copies, requested):\n    if copies < 0 or requested < 0:\n        return False\n    return requested <= copies'],
    [['exact fits are refused','def tool(copies, requested):\n    return copies >= 0 and 0 <= requested < copies'],['negative requests are allowed','def tool(copies, requested):\n    return copies >= 0 and requested <= copies'],['an empty shelf refuses a zero request','def tool(copies, requested):\n    return copies > 0 and 0 <= requested <= copies']]),
  make({id:'bench-errors',requires:48,previous:'bench-boundaries',title:'Two mistakes must not cancel',
    story:'Elio’s lantern report looks reassuringly perfect. Mira asks you to check the measuring tool before believing its number.',
    lesson:'For equal-length lists, mean absolute error averages abs(actual-predicted). Opposite signed mistakes still count. An empty pair returns None because there is no measured error. Approximate comparisons such as abs(result-expected) < 1e-9 handle floating-point rounding.',
    task:'Write test_tool(tool) for tool(actual, predicted). Check empty lists, an exact prediction, opposite errors and unequal error sizes. Inputs always have equal lengths. Catch signed averaging, first-row-only evaluation and the wrong denominator.',
    starter:'def test_tool(tool):\n    assert tool([], []) is None\n    # Choose errors that cannot hide one another.\n',
    solution:'def test_tool(tool):\n    assert tool([], []) is None\n    assert tool([2], [2]) == 0\n    assert abs(tool([1, 5], [3, 3]) - 2) < 1e-9\n    assert abs(tool([1, 7], [1, 3]) - 2) < 1e-9',
    hint:'[1,5] versus [3,3] has opposite signed errors. [1,7] versus [1,3] has one perfect row and one error of four.',
    outcome:'The measuring dial no longer lets one mistake conceal another. Elio keeps the imperfect result; it tells him where to look.'},
    'def tool(actual, predicted):\n    return sum(abs(a-p) for a,p in zip(actual,predicted))/len(actual) if actual else None',
    ['def tool(actual, predicted):\n    if not actual:\n        return None\n    errors = [abs(a-p) for a,p in zip(actual,predicted)]\n    return sum(errors)/len(errors)'],
    [['opposite errors cancel','def tool(a,p):\n    return sum(x-y for x,y in zip(a,p))/len(a) if a else None'],['only the first row is measured','def tool(a,p):\n    return abs(a[0]-p[0]) if a else None'],['one extra observation enters the denominator','def tool(a,p):\n    return sum(abs(x-y) for x,y in zip(a,p))/(len(a)+1) if a else None']]),
  make({id:'bench-sealed',requires:84,previous:'bench-errors',title:'Keep tomorrow’s answers sealed',
    story:'The beacon sends a new evaluation instrument. Mira leaves its cover shut: you will judge its behavior through examples.',
    lesson:'A useful test can describe a relationship rather than one memorized answer. This tool learns the mean of training readings, predicts that constant, and reports MAE on held-out readings. Changing held-out labels should change the error when appropriate, but must never change the learned prediction. Both lists are nonempty.',
    task:'Write test_tool(tool). tool(training, held_out) returns {"prediction": training_mean, "mae": held_out_MAE}. Check exact expected values and compare calls with the same training but different held-out data. Catch training on held-out labels, claiming zero error, and measuring error on training instead.',
    starter:'def test_tool(tool):\n    first = tool([2, 4], [9])\n    second = tool([2, 4], [1])\n    # What must stay fixed? What must change?\n',
    solution:'def test_tool(tool):\n    first = tool([2, 4], [9])\n    second = tool([2, 4], [1])\n    assert first["prediction"] == second["prediction"] == 3\n    assert first["mae"] == 6\n    assert second["mae"] == 2\n    assert tool([5], [5])["mae"] == 0',
    hint:'With training [2,4], prediction stays 3. Held-out [9] has error 6; held-out [1] has error 2.',
    outcome:'Mira seals the test ledger with a brass clasp. Your tests protect a fair comparison even when the hidden implementation changes.'},
    'def tool(training, held_out):\n    mean = sum(training)/len(training)\n    return {"prediction":mean,"mae":sum(abs(v-mean) for v in held_out)/len(held_out)}',
    ['def tool(training, held_out):\n    prediction = sum(training)/len(training)\n    errors = [abs(prediction-v) for v in held_out]\n    return dict(prediction=prediction, mae=sum(errors)/len(errors))'],
    [['held-out labels influence training','def tool(t,h):\n    m=sum(t+h)/len(t+h)\n    return {"prediction":m,"mae":sum(abs(v-m) for v in h)/len(h)}'],['the error is always zero','def tool(t,h):\n    return {"prediction":sum(t)/len(t),"mae":0}'],['training error replaces held-out error','def tool(t,h):\n    m=sum(t)/len(t)\n    return {"prediction":m,"mae":sum(abs(v-m) for v in t)/len(t)}']])
];
