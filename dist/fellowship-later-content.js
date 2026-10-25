import { code, check } from './fellowship-shared.js';

const clipHelper=`import math

def clip_gradient(gradient, limit):
    norm = math.hypot(*gradient)
    factor = min(1.0, limit/norm) if norm else 1.0
    return [g*factor for g in gradient]
`;
const networkHelper=`def loss_gradient(x, target, p):
    # Two ReLU hidden units, one linear output; p has seven parameters.
    w0,w1,b0,b1,v0,v1,c = p
    z0,z1 = w0*x+b0,w1*x+b1
    h0,h1 = max(0,z0),max(0,z1)
    prediction = v0*h0+v1*h1+c
    error = prediction-target
    output_grad = 2*error
    d0 = output_grad*v0 if z0>0 else 0.0
    d1 = output_grad*v1 if z1>0 else 0.0
    return error*error, [d0*x,d1*x,d0,d1,output_grad*h0,output_grad*h1,output_grad]
`;
const attentionHelper=`import math

def attention(query, keys, values):
    scores = [sum(q*k for q,k in zip(query,key))/math.sqrt(len(query)) for key in keys]
    peak = max(scores)
    weights = [math.exp(s-peak) for s in scores]
    total = sum(weights)
    return [sum(w*v[d] for w,v in zip(weights,values))/total for d in range(len(values[0]))]
`;
const lossHelper=`import math

def token_loss(logits, target):
    peak = max(logits)
    return math.log(sum(math.exp(z-peak) for z in logits)) + peak-logits[target]
`;
const actionHelper=`def action_values(actions, values, gamma):
    return {action:sum(p*(reward+gamma*values.get(nxt,0.0))
                       for p,nxt,reward in outcomes)
            for action,outcomes in actions.items()}
`;

export const laterFellowshipQuests = [
code({id:'foundry-gradient-check',chapter:24,title:'Measure before turning the brass dial',subtitle:'Check gradients with central differences',
lesson:['The foundry has a loss function and an analytic gradient. Before trusting the gradient, estimate how the loss changes when one parameter moves a small distance in each direction.', 'The central difference for parameter i is (loss(p+h*ei)-loss(p-h*ei))/(2*h), where ei changes only that parameter. Restore the other coordinates for every evaluation. This estimates a partial derivative, not an optimization step.', 'Use a small, positive h, such as 1e-5. Extremely tiny steps can amplify floating-point error. Check away from corners such as ReLU at zero, where a unique derivative does not exist. Numerical checks are valuable for debugging, but too expensive to replace backpropagation during training.'],
example:'# loss([a,b]) = a*a + 3*b*b\n# At [2,-1], the analytic gradient is [4,-6].',
task:'Write numerical_gradient(loss, params, h). Return a central-difference estimate for each parameter, calling the supplied callable loss with independent perturbed lists. Raise ValueError if h <= 0. Preserve params. An empty parameter list returns [].',
starter:'def numerical_gradient(loss, params, h):\n    gradient = []\n    return gradient',
solution:`def numerical_gradient(loss, params, h):
    if h <= 0:
        raise ValueError("Positive difference step required")
    gradient = []
    for i in range(len(params)):
        plus, minus = list(params), list(params)
        plus[i] += h
        minus[i] -= h
        gradient.append((loss(plus)-loss(minus))/(2*h))
    return gradient`,
checks:check('numerical_gradient',`import math
p=[2,-1]; before=p.copy()
g=f(lambda x:x[0]**2+3*x[1]**2,p,1e-5)
assert len(g)==2 and abs(g[0]-4)<1e-7 and abs(g[1]+6)<1e-7 and p==before
g=f(lambda x:x[0]*x[1]+math.sin(x[0]),[.3,2],1e-5)
assert abs(g[0]-(2+math.cos(.3)))<1e-7 and abs(g[1]-.3)<1e-7, "Perturb each coordinate independently."
assert f(lambda x:0,[],1e-5)==[]
for h in [0,-1]:
    try: f(lambda x:sum(x),[1],h)
    except ValueError: pass
    else: raise AssertionError("The finite-difference step must be positive.")`),
hint:'Create two copies inside the coordinate loop. Increase just coordinate i in one, decrease it in the other, and divide the loss difference by 2*h.',takeaway:'Check a derivative against small controlled perturbations before using it to steer learning.'}),
code({id:'relu-backward',chapter:24,title:'Follow the warmth backward',subtitle:'Backpropagate through a dense ReLU layer',minutes:25,
lesson:['Quest 79 computed a dense layer’s forward pass. Now another layer supplies upstream[j], the derivative of the final loss with respect to output j. The chain rule tells us how to pass it backward.', 'For z[j] = dot(weights[j], inputs)+biases[j], set dz[j] = upstream[j] when z[j] > 0, otherwise 0. We choose derivative 0 at the ReLU corner. Then db[j]=dz[j], dw[j][i]=dz[j]*inputs[i], and dx[i]=sum(dz[j]*weights[j][i] over j).', 'Input gradients ADD across every output that used that input. Overwriting instead of adding would lose some paths through the network. The weight rows still represent output neurons, matching the earlier forward convention.'],
example:'# One active neuron: x=[2], w=[[3]], b=[0], upstream=[4]\n# dx=[12], dw=[[8]], db=[4].',
task:'Write relu_backward(inputs, weights, biases, upstream). Return {"dx": input_gradients, "dw": weight_gradients, "db": bias_gradients} using the formulas above. Shapes are valid; empty inputs or zero output rows are allowed. Preserve inputs and use zero derivative when pre-activation equals zero.',
starter:'def relu_backward(inputs, weights, biases, upstream):\n    dx = [0.0]*len(inputs)\n    dw, db = [], []\n    return {"dx":dx,"dw":dw,"db":db}',
solution:`def relu_backward(inputs, weights, biases, upstream):
    dx = [0.0]*len(inputs)
    dw, db = [], []
    for row,bias,grad in zip(weights,biases,upstream):
        z = sum(x*w for x,w in zip(inputs,row))+bias
        dz = grad if z>0 else 0.0
        db.append(dz)
        dw.append([dz*x for x in inputs])
        for i,w in enumerate(row):
            dx[i] += dz*w
    return {"dx":dx,"dw":dw,"db":db}`,
checks:check('relu_backward',`import copy
args=([2,-1],[[1,0],[2,1],[-1,0],[0,0]],[0,0,0,0],[3,4,5,6])
before=copy.deepcopy(args); r=f(*args)
assert r=={"dx":[11,4],"dw":[[6,-3],[8,-4],[0,0],[0,0]],"db":[3,4,0,0]}, "Gate inactive units and sum every path into each input."
assert args==before
assert f([], [[],[]], [2,-1], [3,4])=={"dx":[],"dw":[[],[]],"db":[3,0]}
assert f([2],[],[],[])=={"dx":[0],"dw":[],"db":[]}`),
hint:'Calculate dz for each output neuron first. Its weight gradients use the input values; its contribution to dx uses the old weights.',takeaway:'Backpropagation multiplies local derivatives and adds contributions where paths meet.'}),
code({id:'global-gradient-clip',chapter:24,title:'A steady hand on the bellows',subtitle:'Limit gradient magnitude while preserving its direction',
lesson:['Occasionally a batch produces an enormous gradient. Global norm clipping rescales the entire gradient vector together when its Euclidean norm exceeds a limit.', 'If norm > limit, multiply every component by limit/norm; otherwise return a copy unchanged. Component-wise clipping is different: it can change the direction. math.hypot(*gradient) calculates the Euclidean norm robustly.', 'Clipping can limit unstable updates, but it does not fix incorrect derivatives, data leakage or a badly chosen objective. A learning rate still controls the size of the parameter step after clipping.'],
example:'# gradient [3,4] has norm 5. With limit 2.5:\n# use scale .5 -> [1.5,2], preserving direction.',
task:'Write clip_gradient(gradient, limit). Return a new flat list with the same direction and norm at most limit, leaving shorter or zero gradients unchanged. Reject limit <= 0 with ValueError. Inputs are finite, and the norm is representable; empty gradients return [].',
starter:'import math\n\ndef clip_gradient(gradient, limit):\n    return list(gradient)',
solution:`import math

def clip_gradient(gradient, limit):
    if limit <= 0:
        raise ValueError("Positive clipping limit required")
    norm = math.hypot(*gradient)
    factor = min(1.0, limit/norm) if norm else 1.0
    return [g*factor for g in gradient]`,
checks:check('clip_gradient',`import math
g=[3,-4]; out=f(g,2.5)
assert out==[1.5,-2] and g==[3,-4], "Scale every component by one shared factor."
assert f([3,4],10)==[3,4] and f([0,0],1)==[0,0] and f([],1)==[]
out=f([1e200,1e200],1)
assert all(abs(v-1/math.sqrt(2))<1e-12 for v in out), "Use a norm calculation that does not square huge values directly."
assert f(g,5) is not g
for limit in [0,-1]:
    try: f(g,limit)
    except ValueError: pass
    else: raise AssertionError("Reject nonpositive clipping limits.")`),
hint:'Compute the norm once. If it is nonzero, choose min(1, limit/norm); multiply the whole vector by that scale.',takeaway:'Control the magnitude of an update without silently changing the direction of the gradient.'}),
code({id:'foundry-training-loop',chapter:24,title:'Teach the little greenhouse heater',subtitle:'Train a two-unit hidden layer with averaged, clipped gradients',minutes:28,
lesson:['The foundry now assembles a small regression network: one scalar input, two ReLU hidden units and one linear output. Its seven parameters are [w0,w1,b0,b1,v0,v1,c]. The supplied loss_gradient implements the forward pass and chain rule for squared error.', 'For each training step, evaluate every example using the SAME current parameters. Average the seven gradient components across the batch, clip that averaged vector once, then subtract learning_rate times the clipped gradient. Updating inside the example loop would be a different algorithm.', 'Record mean squared loss before training and after every update. The trace helps diagnose learning, but a large learning rate can still increase loss. Held-out evaluation remains separate; a falling training loss alone does not prove generalization.'],
example:'# For batch gradients [2,4] and [4,8], average first: [3,6].\n# Clip that one vector, then update the parameters together.',
task:'Write train_heater(xs, ys, initial, steps, learning_rate, limit) using loss_gradient and clip_gradient. Return {"params": final_list, "losses": [initial_mean_loss, ...one mean loss after each step]}. Matching xs/ys are nonempty; initial has seven finite numbers. steps is a nonnegative integer, rate >= 0, limit > 0. Preserve all inputs. The supplied helpers are complete.',
starter:clipHelper+'\n'+networkHelper+'\ndef train_heater(xs, ys, initial, steps, learning_rate, limit):\n    params = list(initial)\n    return {}',
solution:clipHelper+'\n'+networkHelper+`
def train_heater(xs, ys, initial, steps, learning_rate, limit):
    params = list(initial)
    n = len(xs)
    def mean_loss(p):
        return sum(loss_gradient(x,y,p)[0] for x,y in zip(xs,ys))/n
    losses = [mean_loss(params)]
    for _ in range(steps):
        gradients = [loss_gradient(x,y,params)[1] for x,y in zip(xs,ys)]
        average = [sum(g[j] for g in gradients)/n for j in range(7)]
        clipped = clip_gradient(average,limit)
        params = [p-learning_rate*g for p,g in zip(params,clipped)]
        losses.append(mean_loss(params))
    return {"params":params,"losses":losses}`,
checks:check('train_heater',`import copy, math
p=[1,-1,1,1,.5,.5,0]; before=p.copy()
# Independent one-step reference obtained by central differences of batch loss.
xs=[-1,.5,2]; ys=[1,0,2]
def loss(v):
    return sum((v[4]*max(0,v[0]*x+v[2])+v[5]*max(0,v[1]*x+v[3])+v[6]-y)**2 for x,y in zip(xs,ys))/len(xs)
# Avoid ReLU corners in the numerical reference.
p=[.7,-.4,1.3,1.1,.5,.3,.2]; before=p.copy()
h=1e-5; grad=[]
for j in range(7):
    a=p.copy(); b=p.copy(); a[j]+=h; b[j]-=h
    grad.append((loss(a)-loss(b))/(2*h))
scale=min(1,.4/math.hypot(*grad)); want=[a-.05*g*scale for a,g in zip(p,grad)]
r=f(xs,ys,p,1,.05,.4)
assert len(r["params"])==7 and all(abs(a-b)<1e-7 for a,b in zip(r["params"],want)), "Average before clipping and update all weights from the same batch."
assert len(r["losses"])==2 and abs(r["losses"][0]-loss(p))<1e-9 and abs(r["losses"][1]-loss(want))<1e-7
assert p==before
unclipped=f(xs,ys,p,1,.05,1000)
assert all(abs(a-(b-.05*g))<1e-7 for a,b,g in zip(unclipped["params"],p,grad)), "Average gradients even when clipping is inactive."
assert f(xs,ys,p,0,.05,1)=={"params":p,"losses":[loss(p)]}
r=f(xs,ys,p,25,.02,2)
assert len(r["losses"])==26 and r["losses"][-1]<r["losses"][0], "This small training example should learn."
one=f(xs,ys,p,2,.02,1000); doubled=f(xs*2,ys*2,p,2,.02,1000)
assert all(abs(a-b)<1e-9 for key in ["params","losses"] for a,b in zip(one[key],doubled[key])), "Duplicating a batch should not double its mean gradient."`),
hint:'Keep params unchanged while collecting one full batch of gradients. Average coordinate-wise, clip once, update, then measure the new loss.',takeaway:'A dependable training loop connects correct derivatives, update timing, scale control and an inspectable loss trace.'}),
code({id:'causal-archive',chapter:25,title:'The next word has not arrived',subtitle:'Apply a causal mask to sequence attention',
lesson:['The archive predicts the next token from a prefix. During training, the full sequence is present in memory, so attention needs an explicit causal rule to prevent reading future positions.', 'At query position i, allow keys and values at indices 0 through i, including the current position. Exclude later positions BEFORE softmax normalization. Setting their scores to zero would still give them positive probability.', 'The supplied attention function is the scaled, stable forward calculation from Quest 80. Apply it separately to each allowed prefix. This implements masking; it does not train a language model or establish that its output is true.'],
example:'# A zero query gives equal weights over the allowed prefix.\n# values [[2],[6],[10]] -> causal outputs [[2],[4],[6]].',
task:'Write causal_attention(queries, keys, values). For query i, call attention with keys[:i+1] and values[:i+1]. Return output vectors in sequence order. All three lists have equal length, shapes are valid, and empty sequences return []. Preserve inputs.',
starter:attentionHelper+'\ndef causal_attention(queries, keys, values):\n    return []',
solution:attentionHelper+`
def causal_attention(queries, keys, values):
    return [attention(query,keys[:i+1],values[:i+1]) for i,query in enumerate(queries)]`,
checks:check('causal_attention',`import copy
q=[[0],[0],[0]]; k=[[1],[2],[3]]; v=[[2,4],[6,8],[10,12]]
before=copy.deepcopy((q,k,v))
assert f(q,k,v)==[[2,4],[4,6],[6,8]], "Normalize over the visible prefix only."
assert (q,k,v)==before and f([],[],[])==[]
assert f(q,k,[[2,4],[600,800],[1000,1200]])[0]==[2,4], "Future values must not influence an earlier token."
out=f([[1],[1]],[[1],[-1]],[[3],[9]])
import math
assert abs(out[1][0]-(3*math.exp(1)+9*math.exp(-1))/(math.exp(1)+math.exp(-1)))<1e-10`),
hint:'The slice ends at i+1, not i. Keeping only the permitted rows before calling attention also normalizes over the correct set.',takeaway:'A causal mask enforces the same information boundary during training that exists during generation.'}),
code({id:'masked-token-loss',chapter:25,title:'Blank pages should not earn marks',subtitle:'Average sequence loss over real tokens only',
lesson:['The archive pads short sequences so batches fit a common structure. A padding position is not a word the model should learn to predict. A boolean mask marks which targets contribute to the loss.', 'Sum cross-entropy for every active token across the batch, then divide by the TOTAL active-token count. Averaging each sequence first would give short and long sequences equal weight instead of equal weight per token.', 'Masked positions may contain a placeholder target such as -1. Skip them before calling token_loss. If all positions are masked, return None: there was no evidence to score. The supplied helper calculates stable loss directly from logits.'],
example:'# Sequence A contributes 1 active token; B contributes 3.\n# Token-mean loss divides the combined sum by 4, not by 2.',
task:'Write sequence_loss(logit_batches, target_batches, mask_batches). Return the mean token_loss over True mask positions, or None if none are active. Shapes match; active targets are valid class indices and inactive targets may be invalid placeholders. Preserve inputs.',
starter:lossHelper+'\ndef sequence_loss(logit_batches, target_batches, mask_batches):\n    total, count = 0.0, 0\n    return None',
solution:lossHelper+`
def sequence_loss(logit_batches, target_batches, mask_batches):
    total, count = 0.0, 0
    for logits,targets,masks in zip(logit_batches,target_batches,mask_batches):
        for row,target,active in zip(logits,targets,masks):
            if active:
                total += token_loss(row,target)
                count += 1
    return total/count if count else None`,
checks:check('sequence_loss',`import math, copy
x=[[[0,0],[]],[[0,0],[0,0],[1000,-1000]]]; y=[[0,-99],[0,1,1]]; m=[[True,False],[True,True,True]]
before=copy.deepcopy((x,y,m))
assert abs(f(x,y,m)-(3*math.log(2)+2000)/4)<1e-9, "Average all active tokens and never evaluate padding."
assert (x,y,m)==before
assert f([[[]]],[[-99]],[[False]]) is None
assert f([],[],[]) is None
assert f([[[7]]],[[0]],[[True]])==0`),
hint:'Accumulate one total and one count outside both loops. Check the mask before evaluating the target index.',takeaway:'The averaging unit is part of the objective: per token and per sequence are different choices.'}),
code({id:'ranked-evidence',chapter:25,title:'The most useful scrolls first',subtitle:'Evaluate graded retrieval with NDCG',
lesson:['The archive already retrieves scrolls. Now villagers grade their relevance as 0, 1, 2 or 3. NDCG evaluates both the usefulness and order of a ranked list, rather than just whether one match appeared.', 'At zero-based rank i, discounted gain is (2**grade-1)/log2(i+2). DCG sums gains for the first k results. IDCG uses the k highest grades from the whole judged collection. NDCG = DCG/IDCG, or 0 when IDCG is zero.', 'This metric depends on the judgments and cutoff. It does not verify truth, source freshness or whether an answer is supported. Unjudged documents count as grade zero in this exercise, which is a policy choice rather than evidence of uselessness.'],
example:'# A grade-3 scroll contributes 7 at rank 1,\n# but only 7/log2(3) at rank 2.',
task:'Write ndcg(ranking, relevance, k). ranking contains unique document IDs; relevance maps judged IDs to nonnegative integer grades. Unjudged IDs have grade 0. Use the first k ranked results, normalize by the ideal top k grades from ALL relevance entries, and return 0.0 if the ideal gain is zero. k is a nonnegative integer. Preserve inputs.',
starter:'import math\n\ndef ndcg(ranking, relevance, k):\n    return 0.0',
solution:`import math

def ndcg(ranking, relevance, k):
    def gain(grades):
        return sum((2**grade-1)/math.log2(i+2) for i,grade in enumerate(grades))
    actual = gain([relevance.get(doc,0) for doc in ranking[:k]])
    ideal = gain(sorted(relevance.values(),reverse=True)[:k])
    return actual/ideal if ideal else 0.0`,
checks:check('ndcg',`import math
rel={"a":3,"b":1,"c":2}
assert abs(f(["a","c","b"],rel,3)-1)<1e-10
assert abs(f(["b","a"],rel,2)-(1+7/math.log2(3))/(7+3/math.log2(3)))<1e-10, "Normalize against the whole judged collection, not just retrieved documents."
assert f(["missing"],rel,1)==0 and f(["b"],rel,1)==1/7
assert f([],rel,2)==0 and f(["a"],rel,0)==0 and f(["a"],{"a":0},1)==0
assert rel=={"a":3,"b":1,"c":2}`),
hint:'Use the same discounted-gain function for the actual order and sorted ideal grades. The ideal list is not restricted to retrieved IDs.',takeaway:'Evaluate retrieval before trusting generation, while remembering what a ranking metric leaves unmeasured.'}),
code({id:'context-budget',chapter:25,title:'Only so much room on the reading desk',subtitle:'Choose evidence with a 0/1 budget',minutes:26,
lesson:['The librarian can send only a limited amount of text to a model. Each prepared excerpt has an integer token cost and a positive usefulness score. Choose a subset within the budget to maximize the total score; each excerpt can be used at most once.', 'Greedily taking the best score-per-token ratio can miss a better combination. Dynamic programming stores the best result for every capacity. Process capacities from high to low for each item so the same item cannot be used repeatedly in that pass.', 'This exercise assumes excerpt scores add independently. Real evidence can overlap, contradict, become stale or omit essential context. A budget optimizer supports curation; it does not replace checking the selected sources.'],
example:'# (cost,score): (3,5), (4,6), (5,8), budget 8.\n# Items 0 and 2 fit exactly and score 13.',
task:'Write pack_context(excerpts, budget). Each excerpt has positive integer cost and score. Return {"score": best_total, "indices": selected input indices in ascending order}. Total cost must be <= the nonnegative integer budget; use each excerpt once. For equal scores choose the lexicographically smaller index list. Preserve inputs. Empty selection has score 0.',
starter:'def pack_context(excerpts, budget):\n    # One best (score, index tuple) for each capacity.\n    best = [(0, ()) for _ in range(budget+1)]\n    return {"score":0,"indices":[]}',
solution:`def pack_context(excerpts, budget):
    best = [(0, ()) for _ in range(budget+1)]
    for i,item in enumerate(excerpts):
        cost, score = item["cost"],item["score"]
        for capacity in range(budget,cost-1,-1):
            previous = best[capacity-cost]
            candidate = (previous[0]+score,previous[1]+(i,))
            current = best[capacity]
            if candidate[0]>current[0] or (candidate[0]==current[0] and candidate[1]<current[1]):
                best[capacity] = candidate
    score, indices = best[budget]
    return {"score":score,"indices":list(indices)}`,
checks:check('pack_context',`import itertools, copy
def oracle(items,budget):
    candidates=[]
    for bits in itertools.product([0,1],repeat=len(items)):
        ids=[i for i,b in enumerate(bits) if b]
        if sum(items[i]["cost"] for i in ids)<=budget:
            candidates.append((sum(items[i]["score"] for i in ids),ids))
    score,ids=min(candidates,key=lambda pair:(-pair[0],pair[1]))
    return {"score":score,"indices":ids}
for items in [[],[{"cost":2,"score":3}],[{"cost":3,"score":5},{"cost":4,"score":6},{"cost":5,"score":8}],[{"cost":2,"score":2},{"cost":3,"score":2},{"cost":1,"score":2}]]:
    before=copy.deepcopy(items)
    for budget in range(11):
        assert f(items,budget)==oracle(items,budget), "Find the best subset, use each item once and resolve ties by index order."
    assert items==before`),
hint:'Walk capacities downward. Compare candidate score first, then its tuple of indices for a tie. Append the current index to a solution from capacity-cost.',takeaway:'A constrained combination problem can require comparing whole subsets, not just ranking individual choices.'}),
code({id:'discounted-journey',chapter:26,title:'A kindness that reaches tomorrow',subtitle:'Compute discounted returns along a journey',
lesson:['The wayfarers help neighbouring villages over several days. A decision can have a small immediate reward but make a later benefit possible. Return combines rewards over time.', 'For a recorded episode, G[t] = reward[t] + gamma*G[t+1], with zero after the final reward. Gamma discounts later rewards. It is a modeling choice about the planning objective, not a probability that every future event occurs.', 'Compute backward so each suffix return is available. These are returns for one observed journey, not expected values across all possible weather outcomes. Planning needs probabilities for those alternatives next.'],
example:'# rewards [1,2,4], gamma=.5 -> returns [3,4,4].\n# At t=0: 1 + .5*2 + .25*4 = 3.',
task:'Write discounted_returns(rewards, gamma). Return one return per time step in the original order. gamma is in [0,1]; raise ValueError otherwise. Empty rewards returns []. Preserve rewards and use a backward recurrence.',
starter:'def discounted_returns(rewards, gamma):\n    result = [0.0]*len(rewards)\n    return result',
solution:`def discounted_returns(rewards, gamma):
    if not 0 <= gamma <= 1:
        raise ValueError("Discount must be in [0,1]")
    result = [0.0]*len(rewards)
    future = 0.0
    for i in range(len(rewards)-1,-1,-1):
        future = rewards[i]+gamma*future
        result[i] = future
    return result`,
checks:check('discounted_returns',`r=[1,2,4]
assert f(r,.5)==[3,4,4] and r==[1,2,4]
assert f([3,-4,2],1)==[1,-2,2] and f(r,0)==r and f([],1)==[]
for gamma in [-.1,1.1]:
    try: f(r,gamma)
    except ValueError: pass
    else: raise AssertionError("Validate the discount.")`),
hint:'Keep one future return while traversing indices from len(rewards)-1 down to 0. Write each updated return into its original position.',takeaway:'The reward at the next step and the value of the whole future are different quantities.'}),
code({id:'bellman-choices',chapter:26,title:'Several kinds of weather',subtitle:'Back up expected action values',
lesson:['A boat crossing may reach the orchard or be delayed at the dock. Represent each action as outcomes (probability, next_state, immediate_reward), with probabilities summing to one.', 'Given continuation values V, calculate Q(action)=sum(probability*(reward+gamma*V[next_state])). The probability weights BOTH the immediate reward and the continuation value. Missing continuation states have value zero in this exercise.', 'This is a one-step Bellman backup using a supplied world model. It is not learning transitions from experience. Its usefulness depends on whether the probabilities, rewards and state description reflect the real decision.'],
example:'# sail: .5 chance of (orchard,reward 2), .5 of (dock,reward -1).\n# V[orchard]=4, V[dock]=0, gamma=.5 -> Q=.5*(2+2)+.5*(-1)=1.5.',
task:'Write action_values(actions, values, gamma). actions maps action names to nonempty outcome lists (probability, next_state, reward). Return a dictionary of expected action values in action order. Probabilities are valid distributions, gamma in [0,1], and missing next states have continuation value zero. Preserve inputs; empty actions returns {}.',
starter:'def action_values(actions, values, gamma):\n    return {}',solution:actionHelper,
checks:check('action_values',`import copy
a={"sail":[(.5,"orchard",2),(.5,"dock",-1)],"wait":[(1,"dock",.5)],"return":[(1,"home",-2)]}; v={"orchard":4,"dock":0}
before=copy.deepcopy((a,v)); r=f(a,v,.5)
assert r=={"sail":1.5,"wait":.5,"return":-2}, "Weight rewards and future values by outcome probabilities."
assert (a,v)==before and f({},v,.5)=={}
assert f({"a":[(.2,"x",10),(.8,"x",0)]},{"x":3},0)=={"a":2}
assert f({"a":[(1,"x",0)]},{"x":-4},.5)=={"a":-2}`),
hint:'For each outcome multiply its probability by the whole expression reward + gamma*values.get(next_state,0). Sum outcomes separately for each action.',takeaway:'Planning under uncertainty compares expected consequences, not just the single most attractive outcome.'}),
code({id:'fellowship-value-iteration',chapter:26,title:'Let the paths teach one another',subtitle:'Improve state values with synchronous Bellman sweeps',minutes:27,
lesson:['One-step backups become a planner when every state uses estimates for what comes next. Initialize all state values to zero. For each sweep, use the OLD values to calculate every state’s action values, then choose the maximum.', 'Terminal states have no actions and value zero. Other states must choose an action, even if every action value is negative. Do not silently introduce a free stop action. Synchronous updates must not depend on dictionary iteration order.', 'For finite models with bounded rewards and 0 <= gamma < 1, repeated Bellman optimality updates converge. A fixed number of sweeps gives an approximation. After the final sweep, derive a greedy policy from the final values; equal action values choose the first action in insertion order.'],
example:'# A -> B with reward 0; B -> terminal with reward 2.\n# gamma=.5, values initially 0:\n# sweep 1: A=0, B=2; sweep 2: A=1, B=2.',
task:'Write value_iteration(model, gamma, steps) using action_values. model maps state names to action dictionaries; every next_state exists in model and {} marks a terminal state. Return {"values": final_values, "policy": greedy_actions}, using None for terminal actions. Perform exactly steps synchronous sweeps, then derive the policy. steps is an integer >= 0 and gamma in [0,1); reject violations with ValueError. Preserve model.',
starter:actionHelper+'\ndef value_iteration(model, gamma, steps):\n    values = {state:0.0 for state in model}\n    return {}',
solution:actionHelper+`
def value_iteration(model, gamma, steps):
    if steps < 0 or not 0 <= gamma < 1:
        raise ValueError("Need nonnegative sweeps and discount below one")
    values = {state:0.0 for state in model}
    for _ in range(steps):
        updated = {}
        for state,actions in model.items():
            scores = action_values(actions,values,gamma)
            updated[state] = max(scores.values()) if scores else 0.0
        values = updated
    policy = {}
    for state,actions in model.items():
        scores = action_values(actions,values,gamma)
        policy[state] = max(scores,key=scores.get) if scores else None
    return {"values":values,"policy":policy}`,
checks:check('value_iteration',`import copy
model={"b":{"finish":[(1,"end",2)]},"a":{"go":[(1,"b",0)],"stay":[(1,"end",.25)]},"end":{}}
before=copy.deepcopy(model)
r=f(model,.5,1)
assert r["values"]=={"b":2,"a":.25,"end":0}, "Use old values throughout each sweep."
assert r["policy"]=={"b":"finish","a":"go","end":None}, "Derive policy from the final values."
assert f(model,.5,2)["values"]["a"]==1 and model==before
assert f({"s":{"first":[(1,"t",-2)],"second":[(1,"t",-2)]},"t":{}},.5,1)["policy"]["s"]=="first"
assert f({"s":{"loop":[(1,"s",1)]}},.5,3)["values"]["s"]==1.75
assert f(model,.5,0)["values"]=={s:0 for s in model}
for gamma,steps in [(1,1),(-.1,1),(.5,-1)]:
    try: f(model,gamma,steps)
    except ValueError: pass
    else: raise AssertionError("Validate sweep count and discounted-planning assumptions.")`),
hint:'Create a fresh updated dictionary for each sweep. Calculate the final policy in a separate pass after the values are finished.',takeaway:'Iterative planning passes future value through a graph; update timing and stopping rules define the algorithm.'}),
code({id:'fellowship-budget-plan',chapter:26,title:'A plan the whole village can share',subtitle:'Plan stochastic journeys with limited steps and coins',minutes:30,xp:1000,coins:450,
lesson:['The fellowship has only a few daylight steps and a small travel purse. The useful state now includes the place, remaining steps and remaining coins. Two visits to the same place can require different choices when these resources differ.', 'Each action pays its positive integer cost before its uncertain outcome. With h steps and b coins, evaluate reward + gamma*V[h-1,b-cost,next_state] across outcomes. Build tables from h=0 upward. Those zero-step tables contain zero future reward for every place and budget.', 'In this final project stopping is explicitly allowed and gives zero. Keep stop on a zero-value tie; otherwise keep the first action on an exact positive tie. Report the best expected value and first action for the requested start. This is planning in a supplied model, not a guarantee about a real journey; neighbours remain responsible for the plan.'],
example:'# A cheap first leg can leave enough coins for a valuable second leg.\n# A higher immediate reward can consume the whole purse.\n# Compare complete expected plans, including the option to stop.',
task:'Write plan_journey(model, start, horizon, budget, gamma). model[state][action] contains positive integer cost and outcomes as (probability, next_state, reward). All next states exist; probabilities are valid. horizon and budget are nonnegative integers, gamma in [0,1]. Return {"value": best_expected_return, "action": first_action_or_None}. Use at most horizon actions and budget coins, allow stopping for value 0, and apply the tie rules above. Preserve model. Use dynamic programming over remaining steps and budget.',
starter:`def plan_journey(model, start, horizon, budget, gamma):
    # previous[b][state] is the best value with one fewer step and b coins.
    previous = [{state:0.0 for state in model} for _ in range(budget+1)]
    first_action = None
    return {"value":0.0,"action":first_action}`,
solution:`def plan_journey(model, start, horizon, budget, gamma):
    previous = [{state:0.0 for state in model} for _ in range(budget+1)]
    first_action = None
    for _ in range(horizon):
        current = []
        for coins in range(budget+1):
            values = {}
            for state,actions in model.items():
                best, chosen = 0.0, None
                for action,spec in actions.items():
                    cost = spec["cost"]
                    if cost <= coins:
                        score = sum(p*(reward+gamma*previous[coins-cost][nxt])
                                    for p,nxt,reward in spec["outcomes"])
                        if score > best:
                            best, chosen = score, action
                values[state] = best
                if coins == budget and state == start:
                    first_action = chosen
            current.append(values)
        previous = current
    return {"value":previous[budget][start],"action":first_action}`,
checks:check('plan_journey',`import copy
model={"dock":{"walk":{"cost":1,"outcomes":[(1,"orchard",0)]},"ferry":{"cost":2,"outcomes":[(.5,"end",8),(.5,"end",0)]}},"orchard":{"deliver":{"cost":1,"outcomes":[(1,"end",10)]}},"end":{}}
before=copy.deepcopy(model)
assert f(model,"dock",1,2,.9)=={"value":4,"action":"ferry"}
assert f(model,"dock",2,2,.9)=={"value":9,"action":"walk"}, "Plan beyond immediate rewards while keeping coins for later actions."
assert f(model,"dock",2,1,.9)=={"value":0,"action":None}
assert f(model,"dock",0,2,.9)=={"value":0,"action":None}
assert f(model,"end",3,5,1)=={"value":0,"action":None} and model==before
# Independent small exhaustive planner, including loops and negative rewards.
loop={"s":{"a":{"cost":1,"outcomes":[(.5,"s",2),(.5,"t",-1)]},"b":{"cost":2,"outcomes":[(1,"t",3)]}},"t":{"back":{"cost":1,"outcomes":[(1,"s",1)]}}}
def oracle(m,s,h,b,g):
    if h==0: return (0,None)
    best,act=0,None
    for a,spec in m[s].items():
        if spec["cost"]<=b:
            score=sum(p*(r+g*oracle(m,n,h-1,b-spec["cost"],g)[0]) for p,n,r in spec["outcomes"])
            if score>best: best,act=score,a
    return best,act
for h in range(5):
    for b in range(5):
        for g in [0,.8,1]:
            value,action=oracle(loop,"s",h,b,g); out=f(loop,"s",h,b,g)
            assert abs(out["value"]-value)<1e-10 and out["action"]==action, "Track both remaining resources and probability-weighted futures."
ties={"s":{"first":{"cost":1,"outcomes":[(1,"t",2)]},"second":{"cost":1,"outcomes":[(1,"t",2)]}},"t":{}}
assert f(ties,"s",1,1,1)["action"]=="first"`),
hint:'At each step count, build a new table for every budget. An action uses the previous step table at coins-cost. Start every state at stop=0 and replace it only for a strictly better action.',takeaway:'You can now connect reliable Python, learned models, honest evidence and resource-aware planning into decisions a village can inspect.'})
];
