# Companion Haven and game audit — 24 October 2026

## Changes

The former animal shelter is now the Companion Haven, a refuge in Rowan's old potting cottage. Its three visitors share the main companion collection's pixel SVG style, palette, shadowing, and animation conventions.

| Friend | Background | Help project | Trail requirement | Adoption |
| --- | --- | --- | --- | --- |
| Moss, mosslight sprite | Sheltered in a cracked flowerpot after the greenhouse path flooded | A bowl with every name | Available immediately | 90 coins |
| Bramble, autumn hedgehog | Lost his familiar morning round when the bakery closed | The morning and evening round | 8 completed quests and the pantry project | 240 coins |
| Clover, moonbeam moth | Followed festival lanterns from the mist garden and needs quiet company | A recommendation is an invitation | 18 completed quests, earlier care projects, and a needs-first explanation | 420 coins |

Helping unlocks a separate, explicit adoption purchase. The same state action enforces the help, lesson, and coin requirements in both the Haven and the companion garden. Re-equipping is free. Achievement bonuses remain separate from the adoption price. Each new friend follows the player, appears in the room and on the trail, and supports existing friendship, play, training, and sleeping spots. The collection now contains eight companions. Old Haven project IDs, saved functions, and optional neighbour visits remain compatible; an optional introduction never purchases a companion.

The revised background uses botanical fantasy portraits, scarves, dried lavender, woven nests, brass lanterns, and a few softly glowing mushrooms. The retired dog-themed background is no longer shipped.

## Bugs fixed

- An old tab could overwrite newer rewards on page exit. A save guard now detects changes to the stored adventure. Clean tabs can load the newer state; conflicting local work stays available for export, with a visible warning instead of a silent overwrite. Explicit import/reset remains an intentional replacement. This does not attempt to merge concurrent wallets.
- Empty neighbour code drafts were discarded during normalization. Empty text now survives reload and reopening.
- Verbose saved programs could fill the console before the structured demo result was printed. The runtime retains the final valid tool result while shortening debug output; ordinary output remains bounded.
- Successfully revising High Street, restoration, and neighbour projects did not count as learning for the daily streak. Revisions now count, including streak achievements, without repeat commissions.
- Three beginner checkers accepted a memorized answer instead of reusable logic. Profit, inventory append/count, and missing-data cleaning now test changed inputs. Reference solutions still pass.
- Selecting a furnishing in the room could leave the shopping and clearing controls on another furnishing. Pointer and keyboard selection now update those controls without rebuilding the room during a drag.
- Short-height rules hid the entire furnishing heading, including Clear this spot. Only the redundant heading text is hidden now.
- The parent-place navigation marker used dark text against the wooden sidebar. It now has light text on desktop and a separate treatment at the actual 540px bottom-navigation breakpoint.
- Neighbour dialogs returned focus to an unrelated first action. They now return to the actual opening control, including after a scene repaint.
- The new Haven sprite wrapper initially inherited the label's cream background. That style now targets only the label; sprite animation delays and reduced-motion handling are preserved.

## Verification

Final command: `node --test --test-reporter=tap tests/*.test.mjs` — **182 passed, 0 failed, 0 skipped**.

The suite includes real CPython execution of campaign and project solutions, incorrect starters, empty submissions, conceptual mistakes, edge cases, saved tools, and held-out-data checks. Browser-controller adapters exercise event handling and cancellation without simulating pixel layout.

| Area | Verification performed |
| --- | --- |
| Main screens, settings, stories, lessons | Generated 131 markup documents: all 18 routes in fresh and advanced states, all 84 lessons, settings, café, three villager stories, and six original project dialogs. Checked nesting, duplicate IDs, nested links/buttons, and artwork paths. |
| Neighbour activities | Checked all 26 project dialogs plus both Haven/observatory journals. Controller tests cover teaching, connected projects, lake records, clock repairs, discoveries, Haven care/adoption/visits, and observatory observations. |
| Haven adoption | Required help, insufficient coins, exact purchase deduction plus separate achievement bonuses, free re-equipping, save round trips, invalid ownership imports, care activities, room/village rendering, updated scene labels, and dialog focus. |
| Progress and saves | Two app instances sharing storage, stale page exit, clean-tab refresh, conflicting draft preservation, failed writes, old-save migrations, large imports, and duplicate rewards. |
| Room and wardrobe | Drag coordinates and bounds, rotations, cancellation, keyboard controls, selection callbacks, furnishing ownership, wallpaper, clothing prerequisites, and fitted sprite atlas bounds. |
| Village and quest trail | Existing route finding, walking/routines, collision and label-spacing checks, all 84 map stops, extension geometry, pan/zoom controls, and completion travel tests. |
| Learning execution | Worker lifecycle, load/run timeout, stop and close behavior, stale result rejection, verbose-output result preservation, and project revision streaks. |
| Source and serving | Syntax checks for 47 JavaScript modules; text-encoding/reference inspection across 70 shipped text files; 177 local references checked. The local HTTP preview, changed modules, Python runtime, and replacement image all returned success. |

**Browser limitation:** the connected-surface inventory remained empty (`apps: []`, `browsers: []`) after the user offered to connect a browser. No live browser clicks or screenshots were possible. Responsive layout, actual animation timing, audio playback, browser focus behavior, and the Pyodide CDN startup still need an in-browser walkthrough. Controller and markup checks are not a substitute for that visual pass. The replacement cottage image was inspected directly.

## Artwork provenance

- Tool: built-in `image_gen.imagegen`, edit mode, opaque background.
- Reference: the former `dist/assets/animal-haven.png` cottage image, inspected before editing and retired after replacement.
- Saved asset: `dist/assets/companion-haven.png` (1536 × 1024).
- Companion sprites: native SVG paths in `dist/art.js`, retaining the established 26 × 26 pixel grid.
- No third-party reference images were used for this edit.

Exact image-edit prompt:

> Use case: precise-object-edit. Asset type: background for Hearthcode's Companion Haven. Edit the supplied image, keeping the same 3:2 composition, empty woven nests, timber beams, warm 1950s village back-alley cottage atmosphere, amber lantern lighting, tiled floor, rug, windows and open green door. Replace all dog/cat portrait pictures with small vintage botanical illustrations of a moss sprite, an autumn leaf hedgehog spirit, and a moon moth. Replace the hanging dog leashes with little wool scarves, dried lavender bundles, and a brass lantern hook. The room is a refuge for gentle fantasy companions, NOT a realistic animal shelter. Add a few softly glowing mushrooms beside the baskets, very restrained. Preserve the detailed warm painterly pixel-art style and architectural perspective. No live characters or animals baked into the background because game sprites are overlaid later. No legible words, no logos, no modern objects.
