# Five approved improvements

Implemented on 2026-10-25. This change adds ideas 1, 3, 8, 9 and 15 only.

## One Thread to Follow

The compact strip below the header pins one goal and resolves its next useful
prerequisite. Choices include the learning trail, restoration, later character
stories, Mira's Test Bench, the festival and haven companions. Individual coding
activities can also be pinned. Changing the goal does not discard drafts.

The strip follows earlier projects and repairs before later lesson requirements.
Links open the relevant activity, building or observation screen directly. When
no goal is pinned, the most recently opened activity provides a return reminder.
Choosing the same activity link after closing its dialog reopens it correctly.

## A More Comfortable Workbench

The existing textareas remain the editable and accessible source. A shared
decorator adds optional Python coloring, text sizes from 12 to 22px, and a focus
view. Preferences are saved across campaign, practice, High Street, restoration
and neighborhood editors. Existing indentation, keyboard shortcuts, draft
saving, Run and Stop behavior remain in place. Run controls remain available
while reading the longer coding dialogs.

Coloring never executes pasted HTML. Focus view clears on dialog close or editor
replacement. Forced-colors mode shows the real textarea text.

## Mira's Test Bench

Visit the clockmaker's workshop and choose **Mira's Test Bench**. Four sequential
challenges become available after 8, 28, 48 and 84 trail quests:

- Empty baskets, multiple entries and fractional totals.
- Lending boundaries: equality, zero and invalid requests.
- Mean absolute error: cancellation, omitted rows and wrong denominators.
- Held-out evaluation: label leakage and misleading error reports.

Players write `test_tool(tool)` assertions. Each suite must accept two correct
implementations and reveal three planted faults. Empty suites, always-true and
always-false assertions fail. Hints and worked solutions have no penalty. These
test suites stay at Mira's bench rather than appearing as runnable village tools.

## Village Projects: Second Chapters

Meet Rowan, Mira or Elio, or choose **Our next chapters** in Places. Six projects
build on their original friendship projects and reopened buildings. Each second
chapter also requires that character's first chapter.

| Host | Project | Trail quests | Existing foundation |
| --- | --- | ---: | --- |
| Rowan | The oven has more than one morning | 40 | Bakery planner and pantry ledger |
| Mira | A reading room without walls | 48 | Library lending tool and festival scores |
| Elio | When a reading needs a second look | 76 | Greenhouse classifier and lantern predictor |
| Rowan | Enough bread, with room to be wrong | 92 | Shared oven, past-only forecasting |
| Elio | Warmth for every corner | 100 | Care intervals, grouped validation |
| Mira | The small bag with many possibilities | 104 | Library round, constrained selection |

The first four reuse the player's saved restoration functions. The heater review
compares pooled and per-room errors, while the reading bag uses 0/1 selection
with deterministic ties. Stories distinguish validation evidence from certainty.

Completed projects produce saved, runnable services with character outcomes.
They can be revisited from the story page or the existing makers' exhibition.
Repeated runs and revisions award no additional XP or coins.

## Badges for Understanding

Five new achievements recognize tested edge cases, boundaries, held-out
evaluation, composed village tools and per-room model evaluation. They use the
existing achievement/reward system and award coins once. Hints, failed attempts
and retries never disqualify a player.

## Compatibility and validation

- All 108 campaign quests, 8 companions and existing reward IDs are preserved.
- Achievement count increases from 20 to 25. Ten side activities are added.
- The save key and version remain unchanged. Older saves receive only the new
  workbench and thread defaults; existing progress and saved code are retained.
- `npm test`: **209 passed, 0 failed**. This includes actual Python solution and
  faulty-solution runs, prerequisite chains, save round-trips, once-only rewards,
  direct routes, completion controllers, editor interactions and markup/assets.
- The original 84-quest content fixture continues to pass unchanged.
- UI interaction tests use DOM adapters. A fresh browser visual/layout check is
  still pending; these results do not claim screenshot verification or a new
  manual playthrough. No connected browser was exposed during this session.

Main implementation modules: `objective-model.js`, `objective-ui.js`,
`workbench.js`, `testbench-content.js`, `continuing-content.js`,
`continuing-ui.js`, and `understanding-achievements.js`, with small integrations
in the existing app, state, navigation and activity controllers.
