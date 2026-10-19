// Optional village projects run in the same Python sandbox as campaign quests.
// They never replace, skip, or advance the campaign.
export const villagers = [
  { id: 'rowan', name: 'Rowan', role: 'Innkeeper', location: 'The Hearth & Honey', color: 'coral',
    intro: 'There is always a spare seat here. I inherited this tavern from my aunt, along with a drawer full of wonderfully confusing receipts.',
    friendLines: ['Come in, traveler. A warm cup is a fine place to start.', 'Your little calculator has given me time to sit with the guests again.', 'The pantry is ready for the festival. Aunt June would have saved you the best seat.'] },
  { id: 'mira', name: 'Mira', role: 'Game maker', location: 'The Tinker’s Workshop', color: 'gold',
    intro: 'I am making games for our first village festival in years. My brother used to run the stalls; I would like to bring a little of that laughter back.',
    friendLines: ['Want to try an idea? All the best games begin with a little experimenting.', 'People are stopping to play your guessing game. The green is starting to sound like itself again.', 'Now every player gets their moment on the scoreboard. I wish my brother could see this.'] },
  { id: 'elio', name: 'Elio', role: 'Garden keeper', location: 'Willowmere Lake', color: 'green',
    intro: 'These lantern flowers light the path home. I keep a notebook of their sunlight and glow, but I am still learning which patterns I can trust.',
    friendLines: ['Walk softly. There is plenty here to notice, and no need to know every answer.', 'Your care rules helped the apprentices understand what to check first.', 'You tested the model on new flowers. That honest little error matters more than a beautiful promise.'] }
];

const project = data => ({ kind: 'project', type: 'code', ...data });
const check = (name, body) => `f = scope.get("${name}")\nassert callable(f), "Define a function named ${name}."\n${body}`;

export const projects = [
  project({
    id: 'project-tavern-bill', npc: 'rowan', title: 'A little help at the till', subtitle: 'Build Rowan a reusable bill calculator', minutes: 10, xp: 160, coins: 70, requires: 0,
    storyBefore: 'The lunch crowd arrives in a cheerful muddle. Rowan slides over a receipt: “Three bowls, eight coins each, and a ten-percent festival discount. Could we make this easier for every order?”',
    storyAfter: 'Rowan pins your calculator beside the till. “That is one less thing to keep in my head. Stay a while; I can finally enjoy my tea while it is warm.”',
    lesson: [
      'A program can start with one small job. This calculator takes a quantity, a price for each item, and a percentage discount. Its answer should change when the order changes.',
      'def bill(quantity, price, discount): names a function and its three inputs. The indented lines belong to the function. return sends the answer back so another part of the program can use it. print() only displays an answer.',
      'First calculate subtotal = quantity * price. A discount of 10 means ten percent, so the remaining fraction is 1 - discount / 100. Multiply the subtotal by that fraction.',
      'Use round(value, 2) to round this game’s bill to two decimal places. The caller supplies a nonnegative quantity and price, and a discount from 0 to 100. For now, focus on those valid inputs.'
    ],
    example: 'def ribbon_cost(length, price):\n    return round(length * price, 2)\n\nprint(ribbon_cost(2, 3.5))  # 7.0',
    task: 'Finish bill(quantity, price, discount). Return quantity × price after the percentage discount, rounded to two decimal places. The same function must work for different orders, including zero items and a 100% discount.',
    starter: 'def bill(quantity, price, discount):\n    subtotal = quantity * price\n    # Return the discounted subtotal, rounded to 2 places\n    pass\n\nprint(bill(3, 8, 10))',
    hint: 'Replace pass with return round(subtotal * (1 - discount / 100), 2). Keep this line indented inside the function.',
    solution: 'def bill(quantity, price, discount):\n    subtotal = quantity * price\n    return round(subtotal * (1 - discount / 100), 2)\n\nprint(bill(3, 8, 10))',
    checks: check('bill', 'for quantity, price, discount, expected in [(3,8,10,21.6), (2,3.75,0,7.5), (0,9,25,0), (5,4,100,0), (7,2.13,15,12.67), (1,4,50,2)]:\n    result = f(quantity, price, discount)\n    assert isinstance(result, (int, float)) and not isinstance(result, bool), "Return a number, rather than printing or returning text."\n    assert abs(result - expected) < 1e-9, f"For quantity={quantity}, price={price}, discount={discount}, the bill should be {expected}."'),
    takeaway: 'A function turns a one-off calculation into a tool that works for every order.',
    demo: { fields: [{ name: 'quantity', label: 'Bowls of stew', type: 'number', value: 3, min: 0, max: 100, step: 1 }, { name: 'price', label: 'Coins per bowl', type: 'number', value: 8, min: 0, max: 1000, step: 0.01 }, { name: 'discount', label: 'Discount (%)', type: 'number', value: 10, min: 0, max: 100, step: 1 }], expression: 'bill(quantity, price, discount)', instructions: 'Change Rowan’s order and run your own calculator. The result is the bill in coins.' }
  }),
  project({
    id: 'project-pantry-ledger', npc: 'rowan', title: 'Room on the pantry shelves', subtitle: 'Turn stock counts into a shopping plan', minutes: 14, xp: 210, coins: 90, requires: 8, previous: 'project-tavern-bill',
    storyBefore: 'Rowan opens a cupboard that smells of mint and honey. “Aunt June always stocked enough for unexpected visitors. Could your next tool tell me what we need, without losing today’s counts?”',
    storyAfter: 'A tidy shopping list replaces the crossed-out scraps. Rowan places a fresh loaf on the windowsill. “Enough for everyone, and a little extra. That was her way.”',
    lesson: [
      'A dictionary connects a name to a value: {"tea": 2, "bread": 8} records two tins of tea and eight loaves. A new dictionary, plan = {}, can hold the amounts to buy.',
      'for item, count in stock.items(): visits every item and its count. If count < target, the missing amount is target - count. Store it with plan[item] = target - count.',
      'Items already at or above the target need no entry in the shopping plan. A count of zero is useful information: an empty shelf may need the full target amount.',
      'Keep the original stock dictionary unchanged. This tool returns a separate plan; making a plan should not pretend that a delivery has already happened. Inputs are nonnegative whole counts and a nonnegative whole target.'
    ],
    example: 'stock = {"tea": 2, "bread": 8}\nfor item, count in stock.items():\n    print(item, count)\n\nplan = {}\nplan["tea"] = 3\nprint(plan)  # {"tea": 3}',
    task: 'Define pantry_plan(stock, target). Return a new dictionary containing only items below target, with the quantity needed to reach target. Leave stock unchanged. Empty stock returns {}.',
    starter: 'def pantry_plan(stock, target):\n    plan = {}\n    # Visit each item and count; add only the shortages\n    return plan\n\nprint(pantry_plan({"tea": 2, "bread": 8, "honey": 0}, 5))',
    hint: 'Loop with for item, count in stock.items():. Inside it, use if count < target: and then plan[item] = target - count. Return plan after the loop.',
    solution: 'def pantry_plan(stock, target):\n    plan = {}\n    for item, count in stock.items():\n        if count < target:\n            plan[item] = target - count\n    return plan\n\nprint(pantry_plan({"tea": 2, "bread": 8, "honey": 0}, 5))',
    checks: check('pantry_plan', 'for original, target, expected in [({"tea":2,"bread":8,"honey":0},5,{"tea":3,"honey":5}), ({"milk":3,"berries":2},3,{"berries":1}), ({"tea":0},0,{}), ({},6,{}), ({"flour":10,"salt":1},12,{"flour":2,"salt":11})]:\n    stock = original.copy()\n    result = f(stock, target)\n    assert result == expected, f"With stock {original} and target {target}, return {expected}."\n    assert stock == original, "Keep today\'s stock unchanged; return a new shopping plan."\n    assert result is not stock, "Build a separate dictionary for the plan."'),
    takeaway: 'A useful data tool preserves its inputs and turns them into an actionable result.',
    demo: { fields: [{ name: 'stock', label: 'Stock (JSON object)', type: 'text', value: '{"tea":2,"bread":8,"honey":0}' }, { name: 'target', label: 'Target on each shelf', type: 'number', value: 5, min: 0, max: 1000, step: 1 }], expression: 'pantry_plan(__import__("json").loads(stock), target)', instructions: 'Edit the counts inside the JSON object, using double quotes around item names. Your program returns only what Rowan needs to buy.' }
  }),
  project({
    id: 'project-guessing-game', npc: 'mira', title: 'The secret in the acorn', subtitle: 'Make a guessing game respond to the player', minutes: 12, xp: 180, coins: 75, requires: 4,
    storyBefore: 'Mira shakes a small wooden acorn. “I have hidden a number in here. The player needs a clue after every guess. Can you give this game a voice?”',
    storyAfter: 'The first player guesses too low, laughs, and tries again. Mira paints your name under the stall’s sign. “See? A few little rules, and suddenly we are playing.”',
    lesson: [
      'A game responds to player choices. A function called guess_feedback(guess, secret) receives the player’s number and the hidden number, then returns a clue.',
      'if guess < secret: handles a guess that is too small. elif guess > secret: checks another condition only when the first one was false. else: handles the remaining case: the numbers are equal.',
      'Each branch needs an indented return followed by text in quotes. Returning the clue lets the interface show it, speak it, or use it later. A print() inside the function would only write to the console.',
      'Test all three paths, including equality. This project builds the game’s feedback engine; the workshop lets you try different guesses and secret numbers.'
    ],
    example: 'def compare_age(age, minimum):\n    if age < minimum:\n        return "Too young"\n    elif age > minimum:\n        return "Older"\n    else:\n        return "Same age"',
    task: 'Define guess_feedback(guess, secret). Return exactly "Too low" when guess < secret, "Too high" when guess > secret, or "You found it!" when the numbers match.',
    starter: 'def guess_feedback(guess, secret):\n    # Choose and return one of the three clues\n    pass\n\nprint(guess_feedback(3, 7))',
    hint: 'Use if guess < secret: return "Too low", elif guess > secret: return "Too high", and else: return "You found it!". Put each return on its own indented line.',
    solution: 'def guess_feedback(guess, secret):\n    if guess < secret:\n        return "Too low"\n    elif guess > secret:\n        return "Too high"\n    else:\n        return "You found it!"\n\nprint(guess_feedback(3, 7))',
    checks: check('guess_feedback', 'for guess, secret, expected in [(3,7,"Too low"), (9,7,"Too high"), (7,7,"You found it!"), (1,2,"Too low"), (2,1,"Too high"), (0,0,"You found it!"), (-3,-2,"Too low"), (100,15,"Too high")]:\n    assert f(guess, secret) == expected, f"A guess of {guess} with secret {secret} should return {expected!r}."'),
    takeaway: 'Conditions turn a player’s input into a meaningful response. Check every branch, especially the boundary.',
    demo: { fields: [{ name: 'guess', label: 'Your guess', type: 'number', value: 3, min: 0, max: 100, step: 1 }, { name: 'secret', label: 'Secret number (test setting)', type: 'number', value: 7, min: 0, max: 100, step: 1 }], expression: 'guess_feedback(guess, secret)', instructions: 'Try a lower guess, a higher guess, and an exact match. This is the testing bench, so you can change the secret too.' }
  }),
  project({
    id: 'project-festival-scores', npc: 'mira', title: 'Everyone gets a turn', subtitle: 'Build the festival’s running scoreboard', minutes: 15, xp: 220, coins: 95, requires: 8, previous: 'project-guessing-game',
    storyBefore: 'The festival green is filling up. Mira holds a stack of score slips. “Some people played three rounds, some one, and Pip earned a mysterious penalty. We should count everyone fairly.”',
    storyAfter: 'Mira hangs up a scoreboard with every player’s name, even those who scored zero. “There. Nobody disappears just because they are still learning.”',
    lesson: [
      'A list can hold a sequence of rounds. Each round here is a pair: [player_name, points]. A player can appear more than once, so copying the latest score would lose earlier rounds.',
      'Use totals = {} to start an empty dictionary. for name, points in rounds: unpacks each pair into two names. totals.get(name, 0) reads the previous total, using zero for a new player.',
      'Update the total with totals[name] = totals.get(name, 0) + points. Keep zero scores and negative penalties; they are real results. This tool totals scores but does not sort or rank players.',
      'Build a new dictionary without changing the original round slips. Empty rounds should return an empty dictionary. Names are text and points are whole numbers.'
    ],
    example: 'totals = {}\nfor name, points in [["Pip", 2], ["Pip", 3]]:\n    totals[name] = totals.get(name, 0) + points\nprint(totals)  # {"Pip": 5}',
    task: 'Define festival_scores(rounds). Return a dictionary of total points for every player across all rounds. Preserve zero scores and penalties, and leave the input unchanged.',
    starter: 'def festival_scores(rounds):\n    totals = {}\n    # Add each round to that player\'s total\n    return totals\n\nprint(festival_scores([["Pip", 3], ["Mira", 0], ["Pip", 5]]))',
    hint: 'Loop with for name, points in rounds: and update totals[name] = totals.get(name, 0) + points. Return totals after the loop.',
    solution: 'def festival_scores(rounds):\n    totals = {}\n    for name, points in rounds:\n        totals[name] = totals.get(name, 0) + points\n    return totals\n\nprint(festival_scores([["Pip", 3], ["Mira", 0], ["Pip", 5]]))',
    checks: check('festival_scores', 'import copy\nfor rounds, expected in [([["Pip",3],["Mira",0],["Pip",5]], {"Pip":8,"Mira":0}), ([["Ada",4],["Pip",2],["Ada",-4]], {"Ada":0,"Pip":2}), ([["Elio",-2],["Elio",1]], {"Elio":-1}), ([], {}), ([["A",1],["B",1],["A",2],["B",3]], {"A":3,"B":4})]:\n    original = copy.deepcopy(rounds)\n    assert f(rounds) == expected, f"Add all of each player\'s rounds; expected {expected}."\n    assert rounds == original, "Keep the original round slips unchanged."'),
    takeaway: 'Accumulating records by a key turns a pile of events into a fair, reusable scoreboard.',
    demo: { fields: [{ name: 'rounds', label: 'Rounds (JSON name/points pairs)', type: 'text', value: '[["Pip",3],["Mira",0],["Pip",5]]' }], expression: 'festival_scores(__import__("json").loads(rounds))', instructions: 'Add another ["name", points] pair to the JSON list. Repeated names should accumulate; zero scores and penalties should stay visible.' }
  }),
  project({
    id: 'project-plant-adviser', npc: 'elio', title: 'Listen to the lantern flowers', subtitle: 'Write a small, explainable rule system', minutes: 13, xp: 230, coins: 100, requires: 12,
    storyBefore: 'Elio kneels beside a drooping lantern flower. “Our apprentices need a simple place to begin. First check the water, then the light. Can you turn that little routine into a tool?”',
    storyAfter: 'A wooden care sign appears beside the beds. Elio taps the first rule. “We know exactly why it says this. If the rules prove wrong, we can change them.”',
    lesson: [
      'This adviser follows rules that a person writes. It does not learn from examples, so it is not a trained machine-learning model. Clear rules are useful when the task and priorities are simple.',
      'For our fictional lantern flowers, moisture below 30 means "Water". Otherwise, light below 4 hours means "Move into light". If neither rule applies, return "Let it grow".',
      'Rule order matters. A flower with moisture 20 and light 2 needs "Water" first, even though both measurements are low. An if / elif / else chain gives the first matching rule priority.',
      'The boundary belongs to the next case: moisture exactly 30 is not below 30, and light exactly 4 is not below 4. Inputs are moisture from 0 to 100 and light hours from 0 to 24. These are game rules, not a universal guide to real plants.'
    ],
    example: 'def lantern_check(fuel, wick):\n    if fuel < 2:\n        return "Refill"\n    elif wick < 1:\n        return "Replace wick"\n    else:\n        return "Ready"',
    task: 'Define plant_advice(moisture, light). Apply the rules in order: moisture < 30 → "Water"; otherwise light < 4 → "Move into light"; otherwise → "Let it grow".',
    starter: 'def plant_advice(moisture, light):\n    # Check moisture first, then light\n    pass\n\nprint(plant_advice(20, 2))',
    hint: 'Use if moisture < 30:, then elif light < 4:, then else:. Return the exact message from each branch.',
    solution: 'def plant_advice(moisture, light):\n    if moisture < 30:\n        return "Water"\n    elif light < 4:\n        return "Move into light"\n    else:\n        return "Let it grow"\n\nprint(plant_advice(20, 2))',
    checks: check('plant_advice', 'for moisture, light, expected in [(20,2,"Water"), (20,12,"Water"), (30,2,"Move into light"), (30,4,"Let it grow"), (80,3.5,"Move into light"), (0,0,"Water"), (100,24,"Let it grow"), (29.9,4,"Water")]:\n    assert f(moisture, light) == expected, f"At moisture {moisture} and light {light}, apply the first matching rule: {expected}."'),
    takeaway: 'A transparent rule system can be useful without learning. Its behavior depends on the rules, their order, and their boundaries.',
    demo: { fields: [{ name: 'moisture', label: 'Moisture (%)', type: 'number', value: 20, min: 0, max: 100, step: 1 }, { name: 'light', label: 'Hours of light', type: 'number', value: 2, min: 0, max: 24, step: 0.5 }], expression: 'plant_advice(moisture, light)', instructions: 'Try both measurements low, then test moisture 30 and light 4. Your rules should explain every change in the advice.' }
  }),
  project({
    id: 'project-lantern-predictor', npc: 'elio', title: 'A glow we have not seen', subtitle: 'Fit a tiny model and test a new flower', minutes: 20, xp: 320, coins: 135, requires: 20, previous: 'project-plant-adviser',
    storyBefore: 'Elio unfolds a notebook of sunlight hours and measured glow. “The rules helped us care for the flowers. This time I wonder whether examples could teach us a pattern. I kept one new flower aside to find out.”',
    storyAfter: 'A small observation table appears beside the garden. Elio writes down the prediction and its error together. “Now we have something to test, not just something to believe.”',
    lesson: [
      'A model can learn a numeric pattern from examples. Each training pair is [sunlight_hours, measured_glow]. Our deliberately small model predicts glow = weight × hours. It has one learned weight and no intercept.',
      'For this model, the weight that minimizes the sum of squared training errors is sum(x * y) / sum(x * x). Calculate both sums by looping over the training pairs. The weight comes from the data; do not type in a fixed answer.',
      'Define fit_brightness(samples) to return that learned weight. Then define predict_brightness(weight, hours) to multiply a learned weight by new hours. The training samples are nonempty, have numeric nonnegative measurements, and contain at least one positive sunlight value, so the denominator is not zero.',
      'Keep a new flower’s measured glow out of training. Predict its glow first, then compare with its actual measurement using abs(actual - prediction). That absolute error is an honest check on unseen data; do not adjust your model repeatedly to make one held-out flower look perfect.',
      'One flower cannot establish reliability, and a straight line through zero may be a poor fit. Soil, weather, noisy measurements, and sunlight far outside the training range can change the result. Collect independent observations and inspect errors before trusting the model.'
    ],
    example: 'samples = [[1, 2], [2, 4], [3, 6]]\nnumerator = 0.0\ndenominator = 0.0\nfor x, y in samples:\n    numerator += x * y\n    denominator += x * x\nprint(numerator / denominator)  # learned weight: 2.0\n\n# A new flower: prediction 8, observed glow 7.5\nprint(abs(7.5 - 8))  # held-out absolute error: 0.5',
    task: 'Implement fit_brightness(samples), returning sum(x*y) / sum(x*x) learned from the supplied pairs. Implement predict_brightness(weight, hours), returning weight * hours. Keep training data unchanged. The new flower’s actual glow is used only to measure error, never to fit the weight.',
    starter: 'def fit_brightness(samples):\n    numerator = 0.0\n    denominator = 0.0\n    # Add x*y and x*x for each training pair\n    pass\n\ndef predict_brightness(weight, hours):\n    # Apply the learned weight to new hours\n    pass\n\nweight = fit_brightness([[1, 2], [2, 4], [3, 6]])\nprediction = predict_brightness(weight, 4)\nprint("Prediction:", prediction)\nprint("Held-out error:", abs(7.5 - prediction))',
    hint: 'In fit_brightness, loop with for x, y in samples:, add x * y to numerator and x * x to denominator, then return numerator / denominator after the loop. In predict_brightness, return weight * hours.',
    solution: 'def fit_brightness(samples):\n    numerator = 0.0\n    denominator = 0.0\n    for x, y in samples:\n        numerator += x * y\n        denominator += x * x\n    return numerator / denominator\n\ndef predict_brightness(weight, hours):\n    return weight * hours\n\nweight = fit_brightness([[1, 2], [2, 4], [3, 6]])\nprediction = predict_brightness(weight, 4)\nprint("Prediction:", prediction)\nprint("Held-out error:", abs(7.5 - prediction))',
    checks: check('fit_brightness', 'import copy\npredict = scope.get("predict_brightness")\nassert callable(predict), "Define predict_brightness(weight, hours)."\nfor samples in [[[1,2],[2,4],[3,6]], [[1,3],[2,6],[4,12]], [[1,5],[2,7]], [[0,8],[2,6]], [[2,0],[3,0]], [[0.5,2],[1.5,5]]]:\n    original = copy.deepcopy(samples)\n    expected = sum(x*y for x,y in samples) / sum(x*x for x,y in samples)\n    learned = f(samples)\n    assert isinstance(learned, (int, float)) and abs(learned - expected) < 1e-9, "Learn the weight from all training pairs using sum(x*y) / sum(x*x)."\n    assert samples == original, "Keep training measurements unchanged."\n    for hours in [0, 1.5, 4, 7]:\n        result = predict(learned, hours)\n        assert isinstance(result, (int, float)) and abs(result - expected*hours) < 1e-9, "Predict using the supplied learned weight and new hours."\nassert abs(predict(1.25, 8) - 10) < 1e-9, "Use the weight argument, not a global training result."'),
    takeaway: 'Training learns a parameter from examples. Independent measurements reveal prediction error; they do not belong in the training calculation.',
    demo: { fields: [{ name: 'samples', label: 'Training pairs [hours, glow] (JSON)', type: 'text', value: '[[1,2],[2,4],[3,6]]' }, { name: 'hours', label: 'New flower: sunlight hours', type: 'number', value: 4, min: 0, max: 24, step: 0.5 }, { name: 'actual', label: 'New flower: measured glow (held out)', type: 'number', value: 7.5, min: 0, max: 1000, step: 0.1 }], expression: '{"learned weight": fit_brightness(__import__("json").loads(samples)), "prediction": predict_brightness(fit_brightness(__import__("json").loads(samples)), hours), "held-out absolute error": abs(actual - predict_brightness(fit_brightness(__import__("json").loads(samples)), hours))}', instructions: 'Change the held-out measured glow: the error should change, but the learned weight and prediction should stay the same. Keep training data nonempty, with at least one positive sunlight value. One held-out flower is only a small demonstration, not proof that the model will generalize.' }
  })
];

export function projectUnlocked(state, id) {
  const item = projects.find(project => project.id === id);
  return Boolean(item && (state.completed?.length || 0) >= item.requires && (!item.previous || state.projects?.includes(item.previous)));
}

export function friendship(state, npc) {
  const ownProjects = projects.filter(project => project.npc === npc);
  const count = ownProjects.filter(project => state.projects?.includes(project.id)).length;
  const met = Boolean(state.metVillagers?.includes(npc) || count);
  return { count, total: ownProjects.length, met, label: count >= 2 ? 'Trusted friend' : count === 1 ? 'Growing friendship' : met ? 'New acquaintance' : 'Not yet met' };
}
