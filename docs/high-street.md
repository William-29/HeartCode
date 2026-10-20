# Hearthwick High Street

Enter through **High Street** in the village scene, or choose it from **Pop over to → Visit**. The new area has four places and a persistent route back to the village. Existing saves gain empty adventure progress without losing the campaign, room, pets, or coins.

## What opens when

| Place | Activity | Completed trail quests |
| --- | --- | --- |
| Detective desk | Missing delivery: subtraction and function return values | 0 |
| Little Python Shop | Parcel calculator commission | 0 |
| Garden | Collect six fictional sunflower observations | 0 |
| Railway | Brinehaven: harbour fares | 4 |
| Detective desk | Lantern controller: boundaries and loop indentation | 8 |
| Little Python Shop | Stock reorder commission | 8 |
| Little Python Shop | Review proportions commission | 16 |
| Railway | Snowbell: missing readings and valid zeroes | 16 |
| Garden | Fit a least-squares line and evaluate it | 20 |
| Detective desk | Forecast investigation: data leakage | 24 |
| Railway | Fernwood: mean absolute error and validation | 32 |

Each of the ten coding activities awards XP and coins on its first successful check. Replaying replaces the saved source without another payout. These activities count toward learning-day streaks and existing eligible achievements, but do not complete campaign quests.

## Mysteries

Each case has three inspectable notes, a theory choice, a debugging challenge, and a story resolution. All evidence must be examined before the theory is accepted. Wrong theories have no penalty. The first case explains functions and arithmetic. Later cases require interpreting boundaries, indentation, and training/evaluation separation.

## Shop

The player builds three reusable functions. Completed commissions unlock returning customers with rotating requests. Serving a customer runs the saved Python function with that customer's actual inputs and displays its output. Repeat visits never award coins or XP. A revised tool must pass its checks before replacing the working copy. Pending drafts are stored separately.

## Railway

Three locations have distinct vector scenery, an arrival animation, two inspectable landmarks, a local coding project, and a journal souvenir earned by helping the local character. Travel is free. Destinations unlock by campaign progress and the player's current destination survives reloads. The return journey is always available. Reduced-motion preferences disable arrival and environmental animations.

## Learning garden

Six clickable training beds record sunlight hours and fictional one-week growth. Four observations are enough to begin fitting after quest 20.

The player's Python `fit(samples)` implementation calculates least-squares slope and intercept. Running **Fit & evaluate** passes only collected training pairs into that function. Three distinct held-out beds are used afterward to compute MAE, alongside a training-mean baseline MAE.

The saved coefficients determine the displayed prediction and the preview plant height. Choose 1–6 hours of sun and advance a simulated growing week to reveal a new observation and its absolute error. New growth is a deterministic fictional simulation, not a claim about real horticulture. New evaluation beds are not silently added to training.

Collecting a new observation or successfully revising fitting code invalidates the old fitted model and planting. Refit explicitly to continue. Model provenance and completed activities survive exported saves; malformed or unavailable state is discarded during import.

## Implementation and verification

- `dist/adventure-content.js`: stories, progression gates, lessons, Python checks, and datasets.
- `dist/adventure-model.js`: save normalization, one-time rewards, travel, evidence, Python demo sources, model persistence, and planting.
- `dist/adventures.js`: activity rendering, vector station art, modal/editor controls, real Python execution, cancellation, and late-result protection.
- `dist/adventures.css`: warm paper, shop sign, railway, plant growth, responsive layouts, and reduced motion.
- `dist/state.js`, `dist/app.js`, and `dist/village-model.js`: existing-game integration.

The new tests run all ten solutions and plausible mistakes through the shared CPython checker, execute customer requests and fitting code, check reward deduplication and legacy save migration, and exercise UI events through DOM adapters. Existing village path tests cover the new High Street entrance. These checks do not replace real-browser layout or Pyodide download verification.

Browser QA was unavailable during implementation: the computer-use tool reported no enabled browser surfaces. No new runtime dependencies or external services were added. Python retains the game's existing Pyodide loading requirement.
