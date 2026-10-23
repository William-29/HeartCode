# Beyond the academy — quests 61–84

The extension adds 24 quests without replacing, renaming, or changing any of the first 60 quest objects. It is a new course sequence after the original capstone, with new concepts introduced before they are combined. Each coding exercise includes an explanation, a worked example, a starter, a hint, a reference solution, and executable checks. Each quiz explains all four choices. The final project composes previously learned helpers into a versioned review report.

## Learning sequence and novelty

| Quests | New concepts | How this extends earlier learning |
| --- | --- | --- |
| 61–64 | Lazy generator batches, context managers, indexed inner joins, running-window updates | Earlier list cleaning and record aggregation become bounded-memory and efficient data workflows. Resource cleanup is distinguished from exception handling. |
| 65–68 | BFS, Dijkstra relaxation, graph representation costs, admissible and consistent A* heuristics | Introduces graph search as an AI technique. Tests distinguish fewest edges from least cost and explain when heuristic guarantees hold. |
| 69–72 | Multiclass Gini, weighted impurity gain, threshold search, ensemble diversity | Earlier classification/evaluation becomes learning a tree split from examples. Unequal branches and identical-tree ensembles expose common misconceptions. |
| 73–76 | Brier score, reliability bins, percentile bootstrap intervals, sampling limitations | Earlier descriptive statistics become evidence about forecast quality and uncertainty. Resampling precision is distinguished from representative data collection. |
| 77–80 | Stable softmax, multiclass log-sum-exp loss, dense ReLU layers, scaled dot-product attention | Earlier binary neurons and cosine retrieval become multi-output layers and query-dependent information mixing. Shapes and numerical stability are explicit. |
| 81–84 | Categorical total variation, selective prediction, shadow releases, versioned monitoring | Earlier static train/test pipelines extend into changing inputs, abstention, operational evaluation, and traceable reasons for human review. |

None of the new task prompts duplicate the earlier 60. Some deliberately build on older concepts: multiclass loss extends binary loss; attention uses dot products; the monitor composes previous functions. These are new applications with new contracts and edge cases, rather than repeated questions with renamed villagers.

The examples are small educational implementations, not claims to reproduce a full transformer, production monitoring service, or a universally reliable uncertainty method. Calibration is not inferred from a Brier score alone. Bootstrap intervals are approximate; repeating biased data cannot repair its sampling. Input drift is not equated with worse accuracy. A report without alerts does not approve a deployment.

## World and controls

- Original stops 1–60 and the academy arrival keep their exact coordinates. That arrival becomes stop 61. The same continuous cubic-spline path extends to the beacon after quest 84.
- The original art occupies x=0–4800. `frontierlands.png` continues at x=4800–8000. A separately painted `academy-pass.png` spans x=4480–5120 and feathers at both edges, bridging the academy, mountain forest, river, and mill.
- The two new paintings use the existing map as style/geography reference. Both source images were visually inspected. Their display proportions match their generated proportions (approximately 3:1 and 3:5).
- A missing closing tag on the traveler was nesting the map toolbar inside the moving canvas. The tag is repaired and a stationary `world-map-stage` explicitly owns the toolbar, compass, and arrival notice. Only its sibling viewport contains the transformed landscape.
- `overflow: clip` prevents native focus scrolling from moving the camera surface; a scroll reset handles fallback behavior. Zoom controls remain responsive immediately after a drag. They retain keyboard labels and focus indicators.
- Three new achievements unlock at 68, 76, and 84. The original Master of the Hearthlands remains a 60-quest milestone and is never re-awarded on continuation.

## Verification

- Full Node suite: 170 tests, covering campaign, existing village activities, save normalization, rewards, map geometry, and animation lifecycle.
- Real Python checker: 57 campaign reference solutions pass; 57 empty submissions fail; all 18 new unfinished starters fail. The checker rejects 46 explicit misconception implementations, including eager stream consumption, stack-based search, finalized-on-discovery weighted paths, unweighted impurity, bootstrap sampling without replacement, unstable softmax, missing attention scaling, and incorrect monitoring thresholds.
- A saved 60-quest journey resumes at 61 with state unchanged; the next completion grants only its new rewards. All 84 quests unlock and complete in sequence, and replays cannot duplicate rewards.
- Map checks cover all 84 path legs, in-bounds sampling, smooth derivatives at the academy join, each new chapter transition, reduced motion, skip/dispose behavior, toolbar ancestry, and zoom/fit/follow after dragging at progress 0, 60, 83, and 84.
- Compared every original quest object against source commit `1d1751abd7e0b9736415dc2dbe4ebcd499a2e639`: all 60 are unchanged.
- No browser was connected in this session. Automated DOM-adapter checks do not substitute for a rendered browser interaction or responsive screenshot review; those remain a verification limit. Asset inspection and local HTTP checks are separate from that limitation.

## Primary references used to check the new explanations

- [Python generators](https://docs.python.org/3/tutorial/classes.html#generators): suspended execution and generator state.
- [Scikit-learn decision tree formulation](https://scikit-learn.org/stable/modules/tree.html#mathematical-formulation): class impurity and split criteria.
- [Scikit-learn probability calibration](https://scikit-learn.org/stable/modules/calibration.html): reliability comparisons and the limits of reading calibration from an overall probability score.
- [SciPy bootstrap documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.bootstrap.html): same-size resampling with replacement and interval methods. The quest teaches a simple percentile method, not SciPy’s more advanced default interval.
- [Attention Is All You Need, section 3.2.1](https://arxiv.org/html/1706.03762v7): scaled dot-product attention and value mixing.
