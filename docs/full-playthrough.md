# Live playthrough — 24 October 2026

Status: in progress. This record concerns actual Chrome interactions through Windows desktop control, distinct from the earlier automated audit.

Current checkpoint (continued 25 October): all 84 campaign quests are complete through real browser quizzes and Pyodide runs. Level 30, 31,195 XP and 12,737 coins were visible at the final beacon. Both Elio projects, all Haven care projects and glasshouse repairs are complete; all eight companions are owned. Bakery has two repairs complete. The full automated suite last passed 183/183. Village side activities remain in progress.

The game is served from the existing `dist/` on `http://127.0.0.1:4174/`. This separate origin starts with a fresh adventure; the player's original `http://127.0.0.1:4173/` save is untouched. No browser-console code or direct manipulation of browser storage is used.

## Confirmed so far

- Opened the fresh village in Chrome, maximized the window, and inspected the rendered scene.
- Click-to-walk moved the traveler to a path near the café and enabled the nearby-visit button. Villagers changed position during their routines.
- Opened Rowan's conversation through the direct neighbour button. The story, friendship status, Haven shortcut, project entrance, and locked second project rendered correctly.
- Opened Rowan's bill-calculator project and inspected its lesson, editor, hint/solution disclosures, run/reset controls, and modal reading surface.
- The real Pyodide browser runner rejected the unfinished bill-calculator starter with a useful explanation. A correct implementation passed, awarded 160 XP and 70 coins, and increased Rowan's friendship. Its saved demonstration returned 36.0 for five bowls at eight coins with a ten-percent discount.
- Pressing E near the cafe opened its scene. Walking to the learning-trail marker navigated to the quest map on arrival.
- Locked map stops explained their prerequisite and disabled beginning the quest.
- Campaign lesson 1 passed in real browser Python. The game returned to the map, moved the traveler to the next stop, displayed a completion receipt and level-up, unlocked lesson 2, and awarded 80 XP, 35 coins, plus the first-quest achievement's 20 coins.
- The first lesson's hint and Reset code controls worked. An incorrect answer to lesson 2 kept the lesson open with a relevant explanation and no penalty.
- Lessons 2 and 3 passed through their actual quiz controls. Lessons 4 and 5 passed through the real Python runner, including the conditional challenge's alternate-input checks. Completing the first chapter awarded its achievement and unlocked a wardrobe milestone.
- A browser reload retained completed lessons, the saved bill project, XP, coins, and the equipped companion on the separate QA origin.
- The next Python editor was inspected after text entry: the intrusive Grammarly Rewrite control was absent, confirming the opt-out fix in the loaded game.
- Campaign lessons 6, 7, and 8 passed through live loop/function editors and the debugging quiz. Eight main quests are now complete in the QA adventure.
- Entered the wardrobe from the room itself, changed to the earned windswept hairstyle, and inspected all four clothing categories. Restoration and friendship pieces show their specific requirements.
- Opened the decorating drawer, nudged the chair from 23% to 24%, rotated it to 15 degrees, and purchased the sage chair. The scene updated and coins changed from 555 to 435.
- At a fully visible 960 by 720 Chrome window, the village picture entrances, neighbour links, time selector, and visit control were all on screen. The room's existing decorating drawer remained bounded and its furnishing buttons were reachable.
- Inspected the redesigned Haven and Moss's story. The help-first flow and 90-coin adoption price are clear. Care-project completion and adoption are being exercised next.
- Completed Moss's pantry project through Ctrl+Enter in the actual browser editor. It awarded 140 XP and 60 coins and exposed a direct adoption action. Adopted Moss for 90 coins; the visitor dialog changed to owned/equipped with a celebration and a companion-play link.
- The companion page showed Moss equipped, two owned companions, and appropriate locks on other Haven visitors. Petting, fetch, and practice produced 9 friendship, the little-hop trick, and the knitted cushion. Selected the cushion.
- Campaign lessons 9 through 14 also passed live. In lesson 11, a truthiness filter incorrectly dropping zero was rejected with "Remove only None. Preserve zero and the order." The corrected filter passed. Moss appeared beside the lesson as the equipped companion.
- Campaign lessons 15 through 24 passed live, including gradient-descent training, MAE evaluation, and model selection before the untouched test set. The guild milestone opened the next region rather than ending the 84-quest campaign.
- Switched the village clock to Morning through its actual selector. Heading, routines, and scene changed, and the direct neighbour buttons remained available.
- Completed both Elio projects. Replayed the care tool at moisture 30 and light 4 and received "Let it grow" from the saved Python. The learned model returned prediction 8.0 and held-out error 0.5; Elio became a trusted friend. Its exhibition shortcut opened the makers' catalogue with the completed village and Haven tools.
- Ran Moss's saved pantry helper through the exhibition and received dewberries/seedcakes/moonnectar totals with an explicit no-repeat-reward message. Returned through the exhibition link, put away Rowan's calculator, and placed it back from the preserved catalogue. Escape dismissed the exhibition to its square.
- Completed all three glasshouse repairs in real browser Python, returned to each changing memory, and reopened the nursery. The opening scene showed repaired glazing and warm light, and awarded June's cardigan. Its working seedling bench ran the saved classifier and returned labels plus counts; held-out evaluation is next.
- The greenhouse's held-out evaluation returned 3/4 correct and explained the misclassification at moisture 48, rather than presenting functioning code as a guarantee of perfect predictions.
- After the manual refresh, replaying a pet activity retained the same visible reading position and kept friendship at 9. Adopted Fern, Ember, Sage and Nova through their ordinary shop controls, reaching six owned companions; re-equipped Moss for free with coins unchanged at 1,220. The Places menu exposed direct links to all the major activities and took the player to the Haven.
- Completed Bramble's care schedule and Clover's recommender, then adopted both at their displayed prices. Clover's project preserved the draft and withheld completion before the needs discussion. A wrong discussion choice explained why preferences cannot override needs. All eight companions are now owned.
- The saved recommender listed suitable hosts only. Postponing an introduction left the story unchanged; confirming Moss and Nell's visit recorded it while preserving ownership and coins. Re-equipped Moss from the Haven without a charge; 3/3 Haven friends welcomed and 732 coins remained.
- Wore the earned gardener hairstyle, June's cardigan and Elio's leaf scarf. The integrated character preview changed, and the bakery/library rewards remained locked. The wardrobe's story link returned to Founders' Court.
- Exhibition captions now show "Made with Elio" and "Made with Rowan" in the refreshed browser. The curated four tables persisted, while the full catalogue contained nine saved creations.

- Campaign lessons 25-41 passed through the live editors and quiz controls. Bakery stage two is complete; stage three became available after quest 28. The 26/27 road transition is connected. At the far end of the 84-quest map, dragging and zooming kept the controls pinned; whole-world view and Find my adventurer worked. Find my adventurer restored region 9 and the current lesson after viewing region 21.

- Completed campaign lessons 42-84 in the browser, including neural training, retrieval, the first pipeline capstone, generators, graph search, decision trees, calibration, bootstrap intervals, multiclass loss, attention and release monitoring. Quest 60 opened quest 61 on the connected river-workshop trail; quest 84 produced 100% explored and the final beacon reward.

- Replayed quest 84 with its saved Python. The result explicitly said first-clear rewards were already collected; the header remained at 31,195 XP and 12,737 coins. Clicking the map background and using Left/minus panned and changed zoom from 88% to 73%.
- Completed the bakery batch planner, reopened the bakery and earned Mabel's indigo apron. The opening art and memory changed meaningfully. The corrected See the place at work shortcut opened the saved batch-planning tool directly.

- Finished and reopened the library, earning the brass swallow. Its saved lending tool served the available copies and queued the repeated unavailable request. All three restoration buildings are reopened.
- Completed all three shared projects using the saved restoration functions. The live combined report contained oven batches, garden deficits, lent books and waiting requests; demonstrations awarded no repeat rewards.
- Completed all six apprentice conversations. Wrong explanations produced supportive feedback. Nell and Kit each reached 3/3 and Ready to help someone else; explanation and distinguishing-test choices preceded actual code validation.
- Recorded 18 lake casts, balanced across three weather conditions and two shores. Rain filtering showed six rows. Completed all three lake projects; the saved predictor scored 2/3 held-out catches versus baseline 1/3, with honest limitations.
- Restored Elio's telescope and recorded 20 sky observations through click and repeated keyboard activation. The chart showed 16 training and four hollow test markers across all sky conditions. All four observatory projects passed live; the saved prediction evaluation is underway.

- All four clockmaker projects passed, including inspection questions and the clean/repeat/play ordering puzzle. The saved music box returned the cleaned repeated notes; Listen and Stop sound changed playback state. Actual audio quality was not assessed.
- Found and repaired the discovery handoff bug: hash navigation focused main after starting a companion walk, cancelling it via focusout. The refreshed live game completed all three guided walks and all three discovery projects. The new app-controller regression covers movement focus across this handoff.
- The refreshed telescope has improved scale and warm wood/brass details. The lake filter now displays singular weather counts correctly.
- All three High Street mysteries passed after all clues and a supported theory. An incorrect theory kept the ledger locked and explained the evidence mismatch. The first shop commission passed; Bea's saved postage tool returned 9.5 for 2.5 kg and rotated to Rowan.

## Fixes made during the playthrough

- Grammarly's browser extension was inserting Rewrite controls into Python editors. All five code/JSON textarea templates now opt out with Grammarly's documented `data-gramm="false"` attribute, while retaining spellcheck settings. The user's browser-extension settings are unchanged. Source: https://support.grammarly.com/hc/en-us/articles/115000090392-I-do-not-see-Grammarly-on-a-certain-web-page-or-in-a-certain-text-field-but-see-it-on-other-web-pages . Confirmed visually in lesson 4 after reloading.
- Completing pet interactions recreated the page and jumped its reading surface to the top. Same-place renders now retain the main reading position, while entering a different place starts at its entrance. The existing app-controller regression test now covers repeated pet activities, bed selection, and navigation. All 183 automated checks pass. Confirmed live after the player's manual refresh.
- Exhibition captions used internal neighbour IDs, such as "Made with elio". They now use the character names from the village roster. Confirmed live after the refresh.
- Haven project replays still invited adoption after the companion already belonged to the player. Completion and demonstration reports now acknowledge that the friend has a home and that the tool continues helping future visitors. The actual Haven controller regression now runs an adopted companion's exhibited tool and checks the story plus unchanged coins. All 48 Haven/community checks passed after the change. Moss's corrected report is confirmed in the refreshed browser.
- The reopening screen's "See the place at work" led through another building-story screen before reaching its service. It now opens the saved working tool directly. Confirmed live at the bakery reopening: the button opened its saved batch planner directly.

## Remaining checklist

- Village: sustained keyboard movement, Mira, afternoon/evening control, discoveries, directory, and the remaining picture entrances. Click-to-walk, E, Rowan/Elio conversations, cafe, morning control and laptop layout have been checked.
- Campaign: all 84 lessons, map extension, zoom, panning, whole-world view and player recentering have been exercised. Final replay reward limits and map keyboard controls are being checked.
- Projects and places: Rowan's second tool, Mira's two games, festival, mysteries, tool shop, station destinations, learning garden, bakery/library restoration, apprentices, connected projects, lake, clockmaker, discoveries, Bramble/Clover care and observatory. Both Elio tools, Moss's care/adoption, exhibition replay/curation and glasshouse restoration are checked.
- Companions and home: remaining adoptions, free re-equipping, repeated-play reward limits, dragging/clearing/reset, wallpaper, and wearing the restoration reward. Moss's pet/fetch/trick/cushion progression, furniture buying/nudging/rotation and wardrobe categories/locks are checked.
- Persistence and usability: reload, drafts, export/import, repeat rewards, settings, reduced motion, available audio controls, narrow and short windows, keyboard focus and dialog dismissal.

- Companion-led discovery walks now retain the village movement surface as the navigation focus target. Confirmed live after refresh; all three walks reached their clues. The full automated run now passes 184 checks.
- The shop sign inherited dark heading/body colors on its green background. Its heading and subtitle now inherit the sign's light lettering. Live refresh check pending.

## Findings to investigate

- The live observatory telescope is oversized and its plain cover looks flatter than the warm scene. Improve its scale, materials and shading, then inspect after refreshing.
- Lake filtering renders singular counts as 1 weather conditions; tidy the displayed count grammar.

- In a restored approximately 960px-wide Chrome window, the village's bottom picture entrances and neighbour row appeared below the visible viewport. Reproduce after the desktop flow and correct if confirmed.
- Follow-up: explicitly sizing Chrome to 960 by 720 showed the village controls within the window. The earlier crop may have been an off-screen window boundary. At an extreme roughly 410px window height, the open decorating drawer leaves a very small room preview; no clipping fix has yet been justified by the normal laptop-size check.

No full-playthrough completion is claimed until the remaining checklist has been exercised and this record is updated.

## Latest continuation

- Mira's corrected prerequisite shortcut opened the earlier project directly. Both original Mira projects passed in browser Python and her friendship reached 2/2.
- Played the saved guessing game to completion in six guesses using its clues. Winning disabled further guesses; starting another round cleared the history and restored the initial input. The saved scoreboard preserved a zero score and accumulated a penalty correctly.
- Opened the festival with all six preparations. Its celebration awarded 200 XP and 150 coins, then replaced the invitation with the collected keepsake message. The room showed the festival keepsake.
- Dragged the sage chair and verified the saved position. Keyboard nudging also saved. Windows browser control stopped while checking the rotation shortcut because it could not verify the browser URL; the remaining home/settings walkthrough is still pending.
- Replaced the festival's flat gradient scenery with the familiar illustrated village backdrop and retained its lanterns, cast and readable sign. This visual update still needs a refreshed browser check.
- Added cursor-anchored mouse-wheel zoom to the quest map, including wheel-unit normalization, existing zoom limits, browser zoom shortcut preservation and drag protection. Controller regressions cover cursor anchoring, direction, limits, event cleanup and unchanged progress. All 187 automated tests pass. This new wheel interaction has not yet been checked in the live browser.
