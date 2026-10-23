# The animal haven and Elio's observatory

Two optional places extend Hearthwick without adding overlapping village signs or more main navigation buttons. Find both in the village's Nearby menu. The haven also opens from Companions; the observatory opens from Willowmere Lake. Their projects appear in the existing exhibition and use the same Python runner, drafts, hints, cancellation, and first-completion celebrations.

## The animal haven

Rowan's spare blanket became a shared refuge in the old potting cottage. Moss, Bramble, and Clover have distinct needs and stories. Three projects unlock at 0, 8, and 18 campaign quests: aggregate a pantry dictionary, build a deduplicated care schedule, and filter/rank suitable homes. Each requires the preceding project. The final project also requires a correct explanation that essential needs outrank preferences.

Saved Python runs against the actual fictional animal/home records. Recommendations offer a review with Rowan, then an explicit button to arrange a first meeting. The game independently checks the basic requirements before accepting that meeting. Suggestions never automatically adopt animals or change the player's owned companions. Introductions save and appear in each animal's story; they grant no repeat rewards. Care categories and portions are game examples, not real animal-care guidance.

## The observatory

Elio reopens the place where June brought children for cocoa and stargazing. Four projects unlock at 0, 6, 14, and 26 campaign quests: alignment error, grouped observation counts, mean/median summaries, and a grouped-mean brightness predictor. Later projects also require 6, 10, and 20 observations respectively. Repairing the telescope visibly removes its cover and enables observations.

Each explicit observation records the chosen sky condition and a noisy fictional Lantern Star brightness measurement. Every seventh visit includes an instrument disturbance; the raw value remains visible. No real-time waits or daily requirements. The journal keeps the newest 120 readings and shows an SVG plot and raw table. Stable visit IDs reserve every fifth observation for testing even after older rows are dropped. Saved Python learns only from training rows; held-out labels enter after prediction. The report compares mean absolute error with an overall-training-mean baseline. Zero-valued predictions remain valid. No claim of real astronomy is made.

## Compatibility and verification

Version-1 saves receive empty haven fields. Imports validate and bound observation IDs, conditions, brightness, code, and introductions; unearned observations/meetings are removed. Seven new non-teaching projects join the exhibition catalog. Existing saves, rewards, wardrobe access, map geometry, and eight main navigation entries remain intact.

163 automated tests pass. New checks cover progression, real Python edge cases and incorrect starters, personal-data demonstrations, held-out-label isolation, saved-code substitution, one-time rewards, manual meeting review/cancellation/confirmation, malformed imports, observation bounds, restoration, route entrances, and exhibition replay. Static module/asset checks and HTTP serving are verified. No browser surface was available in this session: rendered layout, animation and live Pyodide playback remain unverified in-browser. The two background images were visually inspected directly.

## Artwork

Generated with the built-in image-generation tool and saved in `dist/assets/animal-haven.png` and `dist/assets/willowmere-observatory.png`. Both use detailed painterly pixel-art backgrounds with honey timber, sage paint, amber lamps, period furnishings, and clear floor space. The haven is a converted cottage with woven beds, blankets and a village-facing door; the observatory has a copper dome, warm study corner and a lantern-lit lake view. Animal and brass telescope overlays are native SVG, matching the existing illustrated mechanism approach. Reduced motion disables ambient movement.
