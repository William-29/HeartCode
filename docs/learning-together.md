# Learning together, the morning round, and Willowmere

Three accepted additions extend Hearthwick's existing places, stories, Python runtime, and save format. Letters, a recipe notebook, and a newspaper were declined and are not included.

## Where to go

- **The learning table:** visit its marker in the village, talk with Rowan or Mira, or use the invitation inside the tavern. `#apprentices`.
- **The morning round:** Founders' Court → The morning round. `#shared`.
- **Willowmere Lake:** the lakeside path in the village, or Elio's conversation. `#lake`.

The eight primary navigation links remain unchanged. Each new world fits the available viewport; longer conversations, ledgers, and coding activities use a single scrollable dialog. All three worlds provide a return link and keyboard-accessible controls.

## Apprentices

Nell helped rescue the library's cards. Kit helps Rowan prepare trays. Both use the existing painted clothing and character layers, with distinct warm outfits and hairstyles.

Each has three conversations. First explain a mistake, then choose a test that distinguishes it from a correct solution, then repair real Python. Incorrect answers provide specific feedback without charging coins or reducing confidence. Hints, starters, worked solutions, draft saving, Stop, and keyboard editor controls are available.

| Apprentice | Trail quests | Topic |
|---|---:|---|
| Nell | 0 | Returning a greeting instead of only printing it |
| Kit | 2 | Multiplication and a test that exposes addition |
| Nell | 8 | Filtering available books |
| Kit | 10 | Returning after a loop; empty collections |
| Nell | 16 | Missing values versus observed zero |
| Kit | 24 | Held-out evaluation and accuracy |

Conversations are sequential for each person, independently of the other apprentice. Confidence and dialogue change after each completed lesson. Rewards are granted once per lesson; revisiting can update saved code without repeating rewards.

## Connected places

These projects use **the actual saved restoration source**, loaded into separate Python namespaces so each tool retains its helpers. Checks verify results on varied inputs and verify that the connected project calls the restored functions.

1. **June's herbs, Mabel's bread** (28 trail quests; bakery and greenhouse reopened): call the saved shopping-list function to prepare a herb basket and total its bundles.
2. **A recipe travels with the basket** (28 quests; all three buildings reopened; first connection finished): clean handwritten requests and run the saved lending tool, preserving a queue for unavailable copies.
3. **One morning, many helping hands** (32 quests; previous connection finished): combine the saved oven planner, watering ledger, and lending desk into one morning report.

Completed connections add a basket, recipe satchel, and moving courier to the shared court. Re-running a project executes the saved code on the village's sample morning and presents reports for the neighbours. Restoration tools revised later are picked up on the next run. Visits award no repeat coins.

## Lake journal

Visit with the equipped companion, choose a fictional weather condition and either the reeds or jetty, then **Cast & observe**. Every cast immediately records its outcome, including “No catch”; fish are released. There are no bait costs, timers, daily streak requirements, or coins for repeated casting.

The newest 120 rows are retained, with a persistent cast number. The journal includes an accessible frequency chart, weather filters, raw observations, and prompts about sample size, missing misses, selection bias, and correlation versus causation. Game catch probabilities are fictional and depend on weather and shore.

| Project | Trail quests | Recorded casts | Lesson |
|---|---:|---:|---|
| Every cast belongs in the story | 4 | 6 | Count every outcome |
| What does often really mean? | 12 | 12 | Empirical frequency, including quiet casts |
| A guess for a different morning | 24 | 18 | Weather-conditioned majority classifier |

Projects are sequential. The model holds every fifth observation out for testing. Test labels are introduced only after predictions, including the next-cast guess, have been produced. The report compares correct predictions with an overall-most-common baseline. New observations require a fresh run; no old score is presented as current. The journal explains that this modest model can lose to its baseline and that a frequency is not a promise.

## Save, motion, and sound

`neighbours` is a new optional field in the existing version-1 save. Old saves receive an empty field. Imports bound code/drafts, remove unknown or out-of-order completions, validate observation categories and IDs, remove duplicate rows, and preserve existing progress. Currency remains in the existing state.

The worlds use the fitted wardrobe character and equipped pet. Courier, lake ripples, receipt animation, and painted light effects respect reduced motion. The lake's rain follows its selected fictional weather, with the existing independent rain audio control. The table inherits tavern fire/café sound controls; the court inherits village ambience. No audio is downloaded.

## Verification

- Automated Python execution checks all 12 solutions and rejects their faulty starters and blank submissions.
- Model tests cover gates, one-time rewards, save migration/imports, data retention, actual tool reuse, and held-out evaluation.
- Controller tests cover explanation/example/code flow, shared report rendering, lake observations/filtering, replay, cancellation, and disposal.
- App tests cover routes and the unchanged eight-link navigation. Existing movement tests include both new village destinations.
- No browser surface was available in this session. Full browser layout and Pyodide loading could not be visually verified; controller tests use the shipped Python checker under local CPython.

See [learning-together-artwork.md](learning-together-artwork.md) for the lake artwork, source path, and full generation prompt.
