<<<<<<< HEAD
# Hearthcode — The Learning Tavern

A cozy browser learning game with **84 progressive quests in 21 chapters** across Python, AI, and machine learning. Explore a living pixel-art world with taverns, fields, a country pub, magical forests, lakes, a trading town, gardens, an observatory, archives, and a mountain academy. Includes real Python coding challenges, explanations and hints, quizzes, XP levels, coins, **17 achievements**, five pixel companions, a rotating daily question, a practice room, and browser-local saves with JSON export/import.

## Beyond the academy: quests 61–84

Six new regions continue directly from the original academy arrival: the river workshop, pathfinder’s crossing, branching orchard, mist garden, lantern conservatory, and keeper’s beacon. Their 18 coding challenges and six knowledge checks introduce streams, graph search, learned tree splits, calibration, bootstrap uncertainty, multiclass networks, attention, and model monitoring. Existing 60-quest saves continue at quest 61, retaining the academy achievement, coins, companions, and drafts. Three new achievements mark the extended journey.

The world is now 8,000 units wide, with a painted mountain pass blending the old academy into the new landscape. Zoom, fit-world, and find-adventurer controls stay on a stationary layer outside the moving map. See the [curriculum and extension review](docs/frontier-extension.md) for the learning sequence, checks, and verification limits.

## Finding your way around

Village signs now have reserved space for their text and click targets, including separate lakeside and companion-discovery signs. Moving nameplates and found-clue markers avoid covering them. The [layout review](docs/village-layout-review.md) records the additional scene fixes, 155 passing tests, and the browser verification limit.

Your wardrobe is upstairs in **Your room**, with room/wardrobe tabs, a **Change your look** label on your character, and a sidebar portrait shortcut. It is available from the start; individual clothing rewards still follow their stories. The **Nearby** signpost connects related places without expanding the main navigation. The makers' exhibition now includes saved clock repairs, lake tools, shared village projects, and companion discoveries, with a route back from each working creation. See [the connection and bug-fix notes](docs/journey-polish.md) for the 151-test verification and preview limits.

## Learning together, shared projects, and Willowmere

**New: Mira's clockmaker workshop and pet-led discoveries.** Visit the clockmaker in the village to inspect and repair four remembered keepsakes with Python, including a music box you can choose to hear. Follow your companion's clues on village paths to find three small stories for Mira, Rowan, and Elio. Every pet can find every clue. Seven additional coding projects have one-time rewards, saved drafts, and progressively deeper lessons. See [the feature and artwork guide](docs/clockwork-and-discoveries.md).

Visit **The learning table** in the village or tavern to meet Nell and Kit. Six progressive conversations ask you to explain a Python mistake, choose a useful test, and repair real code. Their confidence and dialogue grow as you help.

In **Founders' Court → The morning round**, connect the actual Python tools saved during restoration. Three projects bring greenhouse herbs to the bakery, library recipes into the delivery baskets, and all three buildings into a shared morning plan. Reopened buildings, earlier connections, and trail lessons determine when each becomes available.

Follow **The lakeside path**, or speak with Elio, to fish with your companion at Willowmere. Every immediate cast becomes an observation, including “No catch.” A weather-filtered journal, charts, and three coding projects teach counting, empirical frequency, and a weather-based classifier evaluated against held-out observations and a simple baseline. The journal keeps the newest 120 casts; there are no timers or repeat-cast coin rewards.

All 12 new projects have one-time XP/coin rewards and saved drafts. Existing version-1 saves migrate automatically. The new worlds remain fitted to the viewport, with reading and coding in deliberate scrollable dialogs. See [the feature guide](docs/learning-together.md) and [the artwork record](docs/learning-together-artwork.md).

## A village to call home

The new **Village** is the default starting place. Click the ground to walk, click a destination to walk there and visit, or focus the scene and use **WASD / arrow keys**. Press **E / Enter** near a destination to interact. The destination list also opens activities directly for touch and keyboard access. The character and equipped pet explore a colourful village with a tavern, workshop, sheltered courtyard, garden, pond, and trail to the existing campaign. Movement routes around buildings and water; dialog opening, losing focus, and navigation stop movement.

Meet three villagers with personal stories. Helping them earns friendship, changes their conversations, and adds details to the village:

- **Rowan:** a bill calculator available immediately, followed by a pantry shopping planner after 8 campaign quests.
- **Mira:** a guessing game after 4 quests, followed by a festival scoreboard after 8.
- **Elio:** a plant-care rule system after 12 quests, followed by a learned brightness predictor with a held-out error experiment after 20.

The second project for each villager also requires their first. Each project includes a lesson, worked example, starter code, free hints, reference solution, and Python checks across multiple inputs. Completed creations can be tried with new inputs and downloaded as `.py` files. Mira's guessing game hides a fresh number from 1 to 100 and uses the player's saved Python function to give clues; a round tracks guesses until the number is found. The other creations have small input forms that run the submitted Python in the existing worker. The predictor explicitly separates rule-based behavior, learning from data, and testing on unseen measurements.

First completion earns XP and coins once; visits, demo runs, and replays cannot farm project rewards. Replays can update the saved creation. Projects do not advance or skip campaign quests. Village position, known villagers, completed projects, project drafts, and successful source code share the existing browser save and JSON backup. Older saves gain empty village fields without losing campaign progress. Local and published origins still need an exported/imported save to transfer progress.

`dist/village-model.js` handles walkability and paths; `dist/village.js` renders the illustrated village and animated characters. `dist/projects.js` contains the six projects and characters. `dist/village-stories.js` renders conversations and runnable creations. The village uses a local illustrated backdrop and adds no external service or package dependency. Reduced motion disables decorative walking/ambient effects while leaving movement usable.

## Lamplight in Hearthwick

The village now has the feeling of a cozy 1950s back alley at early evening: textured brick storefronts, striped cafe awnings, cobblestones, warm windows, streetlamps, a reflecting pond, and layered plants. A detailed illustrated background replaces the original flat SVG scenery. The movement layer, people, pets, project improvements, and lighting remain separate from the image. Building collision bounds follow the new artwork while all six destination locations stay compatible with saves.

Streetlamp glows, window light, reflections, and overhead bulbs vary gently with independent timing. The illustration already contains the lamp fixtures, so the overlays add light rather than duplicate posts. A grounded character shadow and warmer sprite lighting tie the walking party to the street. Both the game and operating-system Reduce motion settings keep ambient lighting still. The existing controls and direct-access destination links remain available.

The surrounding UI uses walnut navigation, ivory paper, terracotta enamel buttons, brass details, and muted petrol accents. Conversation sheets, lessons, the code editor, companions, achievements, campaign map frame, and celebrations share the palette. The tavern window has a wooden frame and a gently glowing string of bulbs. Learning pages remain light and readable.

`dist/alley-theme.css` provides the shared theme; `dist/village.css` loads `dist/alley-scene.css` for the village and lighting, while `dist/alley-scene.js` places the glow overlays and project improvements. The backdrop is `dist/assets/hearthwick-evening.png` (1536 x 1024), generated with the built-in ImageGen tool. Its original is preserved; the prompt and alignment notes are recorded in [docs/alley-art.md](docs/alley-art.md).

The traveler and all three villagers now share illustrated character art that matches the street: soft expressions, textured wool and leather, cinnamon coats, sage waistcoats, and warm lamplight highlights. The same people appear in the village, campaign map, conversation portraits, player profile, and Rowan's tavern note. Individual atlas crops keep their boots on the ground, with soft shadows, gentle idle breathing, and a restrained walking sway. Both reduced-motion settings disable these decorative character animations.

`dist/characters.js` and `dist/characters.css` render the shared atlas, `dist/assets/hearthwick-neighbors.png` (1774 x 887, transparent PNG). The original is preserved; the built-in ImageGen prompt, transparency checks, and source crop coordinates are recorded in [docs/character-art.md](docs/character-art.md).

The 68 automated tests cover campaign and project progression, real Python solutions, save compatibility, village paths, dialog handoffs, and motion cleanup. Artwork was inspected directly. No connected browser was available for visual layout or animation QA.

## Everyday life, your room, and the lantern festival

Choose **Follow my clock**, Morning, Afternoon, or Evening above the village. The automatic clock uses the player's device time: morning 06:00-12:00, afternoon 12:00-17:00, evening otherwise. Rowan, Mira, and Elio have different locations and routines throughout the day. When the period changes while the village is open, they follow walkable paths to their next spot; selecting a moving villager lets them stop for a visit. Lighting shifts with the period. Activities remain available at every hour, and both reduced-motion settings skip routine travel. The daybook and conversations describe what each villager is doing. **A quiet table** opens a peaceful cafe break with the equipped pet, without a timer or reward.

Visit **Your room** above the tavern or use its navigation link. A furnished room is available immediately: chair, lamp, rug, shelf, and a place for your pet. The secondhand shop offers ten furnishings across five fixed spots. Four starter pieces are free; optional purchases cost 45-140 earned coins. Buying places the item; owned pieces can be switched or cleared for free and are never charged twice. The shelf displays the latest four earned achievement trophies and a festival keepsake after its celebration. This is a choice of furnishings for fixed positions, rather than a drag-and-drop room editor.

**Festival** follows three chapters across the six existing village Python projects: the cafe and guessing game, pantry and scoreboard, then plant care and learned lantern brightness. Earlier completed projects count. Trail prerequisites and the previous project for each villager still apply. Every finished stall opens the actual saved Python creation with editable inputs, and its code can be revisited. After all six preparations, light the lanterns to receive **200 XP, 150 coins, and a permanent room keepsake once**. The festival stays open for repeat visits. Missing imported source code can be restored by replaying that project.

Room ownership and placement, the clock preference, and festival celebration join the existing local save and JSON backup. Old saves receive free starter furniture. Invalid room slots and unknown furnishings are rejected, and imported celebration status requires all six projects. Browser visual QA was unavailable; 68 automated checks cover these state rules, clock cleanup, village routes and moving-NPC interactions, room buttons, festival demo handoffs, and the existing real Python curriculum.

`dist/village-life-model.js` owns routines, furnishings, and festival progress; `dist/village-life.js` renders the room, cafe, daybook, and festival; `dist/village-life.css` provides responsive scenery and motion. The new furniture is code-native SVG and CSS, and the scenes reuse the established character atlas.

## Run locally

Requires Node.js. No package installation or build step is needed.

On Windows, double-click **Play-Hearthcode.cmd** to start the server and open the game in your default browser. Keep the launcher window open while playing. Alternatively:

```powershell
cd C:\Users\willi\Documents\PythonGame\hearthcode
npm start
```

Open http://127.0.0.1:4173. Serve the site over HTTP; opening index.html directly as a file does not support module imports or Python workers.

## Tests

```powershell
npm test
```

Tests require Python 3 on PATH. They validate campaign progression, reward idempotency, pet purchases, daily streaks, save normalization, XP thresholds, every coding solution, and several incorrect solutions against the same Python checker used in the browser.

## Learning path

1. The first spark: output, variables, types, arithmetic.
2. A little bit of logic: conditionals, loops, functions, debugging.
3. The data pantry: lists, dictionaries, cleaning, means.
4. A mind of its own: AI vs ML, rules vs learning, prompts, responsible AI.
5. The pattern seekers: features/labels, learning tasks, held-out evaluation, overfitting.
6. The prediction forge: linear prediction, gradient descent, MAE, model selection.
7. The artisan’s workshop: word frequencies, exceptions, mutable defaults, function contracts.
8. The merchant’s ledgers: JSON, CSV, grouped aggregation, duplicate detection.
9. The statistician’s garden: median, population variance, conditional probability, correlation versus causation.
10. The alchemist’s greenhouse: fitted scaling, transformations, chronological splitting, preprocessing leakage.
11. The sentinel gates: confusion counts, precision and recall, thresholds, imbalanced classification.
12. The modelmaker’s valley: nearest neighbors, pooled cross-validation errors, L2 penalties, grouped splits.
13. The neural observatory: stable sigmoid, a weighted neuron, cross-entropy, logistic-regression training.
14. The whispering archives: bag-of-words vectors, cosine similarity, ranked retrieval, untrusted source content.
15. The master’s summit: least-squares fitting, validation selection, group evaluation, a complete prediction pipeline.

Early quests introduce one idea at a time; later chapters combine functions and data structures, then algorithms and evaluation. Advanced lessons show prerequisites, worked examples, starter code, hints, and reference solutions. The final four quests connect training, selection, reporting, and a train/predict/evaluate pipeline. Difficulty labels are relative to this course, not professional certifications. All exercises use standard-library Python; the text retriever is a small teaching example, not a full language model.

Completion rewards are awarded once per quest, with larger XP rewards for later chapters and 600 XP for the final pipeline. Replays and the practice room are free, without additional quest rewards. All hints are free, and companions are cosmetic. The original guild achievement still unlocks after 24 quests; five later milestones continue through quest 60. Existing saves keep their coins, XP, companions, drafts, and earned badges, and resume at the first unfinished quest. A completed original save resumes at the guild workshop.

Curriculum references: [Python exceptions](https://docs.python.org/3/tutorial/errors.html), [scikit-learn common pitfalls and leakage](https://scikit-learn.org/stable/common_pitfalls.html), and [scikit-learn model evaluation](https://scikit-learn.org/stable/modules/model_evaluation.html).

## Explore the Hearthlands

Open **Quest map** to wander across the world. Drag with a mouse or finger to pan. The +/− buttons zoom; the map button shows the whole world, and the paw button finds your adventurer. Use the region selector to jump between twenty-one destinations; it follows the selected quest. Select any numbered stop to preview its quest, difficulty, and topic; available quests can be started from the panel beneath the map. Keyboard users can Tab through stops and controls, or focus the map and use arrow keys to pan, +/− to zoom, and Home to find their character.

Completing a campaign quest for the first time returns you to the map. Your coat-and-scarf traveler walks along the curved trail with the equipped companion following, while the camera tracks them. Arrival reveals the next stop, celebrates new regions, and displays rewards, achievement bonuses, and the lesson takeaway. The trail now continues beyond the original guild into a panorama three times the original world width, ending at the academy. Replays and daily challenges do not move campaign progress forward.

Progress is saved **before** travel begins. Skip walk, navigating away, or reloading cannot undo a reward or award it twice. The game's Reduce motion setting and the operating system's reduced-motion preference both skip the walk and disable ambient motion. Existing saves remain compatible. Fireflies, chimney smoke, drifting clouds, water glints, and walking sprites are decorative effects.

The test suite has 86 tests, including curved route continuity, reward/travel consistency, old-save migration, advanced achievement thresholds, saved positions, reduced motion, skip behavior, advanced and final arrivals, and animation cleanup. Every coding solution is checked, along with empty submissions and 27 deliberately incorrect implementations (including data leakage, incorrect denominators, unstable sigmoid, and reversed gradients). A lightweight DOM adapter verifies animation lifecycle; it does not replace visual browser QA. No connected browser was available in the implementation session.

## Runtime and privacy

- Progress and code drafts are saved under `hearthcode-save-v1` in this browser's localStorage. No backend user database is used. Different origins, devices, and browsers have separate saves. Settings can export/import a save; an import replaces current progress and preserves the prior save in localStorage under `hearthcode-before-import` when available.
- Real CPython is provided by pinned [Pyodide](https://pyodide.org/en/stable/usage/index.html) 0.27.7, loaded from jsDelivr in a Web Worker. The initial engine download needs internet access. Python code and quest checking execute locally in that worker. The Stop button terminates it; an 8-second execution timeout prevents endless loops from blocking the UI. Initial runtime loading has a separate 90-second timeout and a retryable error.
- The practice room supports standard-library exercises. Interactive input and a package installation UI are not included. Like other browser code, user-written Python can access browser capabilities exposed by Pyodide; this is a personal learning playground, not a hostile-code security sandbox.
- Daily questions and streaks use the player's device calendar day. Daily questions rotate through seven entries and can be claimed once per day. The game is local and does not attempt to prevent save editing or device-clock changes.
- Google Fonts provides Lora, DM Sans, and DM Mono; local fallbacks are specified if fonts cannot load.

## Source

### Founders’ Court, exhibition, and wardrobe

Visit **Founders’ Court** from the village to restore the bakery, library, and glasshouse through nine projects. Repairs reveal neighbours’ memories, change the artwork, and reopen useful services. Display and run up to six finished creations on the square, with all completed projects retained in the exhibition catalogue.

Choose independently fitted hair, outfits, scarves, and keepsakes in **Your wardrobe**, accessible from your room and the court. Clothing unlocks through lessons, friendship projects, and restoration rather than purchases. See [the feature guide](docs/founders-court.md) and [artwork and prompts](docs/restoration-artwork.md).

### High Street adventures

Visit **High Street** from the village to investigate three Python mysteries, run your own tool shop with returning customers, take progressively unlocked train trips to three towns, and train a small garden model. Beginner activities start immediately; advanced activities follow existing lesson progress. Ten new coding challenges award XP and coins once. Saved shop tools execute for customers, and the garden uses fitted parameters to predict growth.

See [the High Street guide](docs/high-street.md) for unlock requirements, save behavior, and verification details.

`dist/content.js`: original curriculum, pets, achievements, daily questions. `dist/advanced-content.js`: quests 25–60 and their Python checks. `dist/state.js`: pure progression logic. `dist/app.js`: UI. `dist/runtime.py`: shared checker. `dist/runner.js` and `dist/python-worker.js`: browser Python lifecycle. `dist/styles.css`: responsive tavern design. `dist/art.js`: original code-native pixel companions and interface icons. `dist/world-model.js`: map locations and shared Bézier route geometry. `dist/world.js`: map rendering, camera, input, and travel lifecycle. `dist/world.css`: world design and environmental animations.

## Tavern artwork

Generated with the built-in ImageGen tool and saved in `dist/assets/tavern.png`. The original generation is kept in the generator's output directory. Prompt used:

> Use case: illustration-story. Asset type: wide website game scene. Create a beautiful cozy fantasy tavern interior in detailed, crisp 16-bit pixel art, horizontal 3:2 composition. A welcoming stone fireplace glows amber on the right, a little orange cat curled on a green armchair, wood beams and warm lanterns, shelves full of books and jewel colored potion bottles, small wooden tables, hanging ivy, and an arched leaded window with midnight blue outside. A tiny friendly owl on a bookshelf. Magical programming academy atmosphere, old medieval inn, rich dark chocolate brown shadows, copper and gold light, muted forest green accents. Strong pixel clusters, artful game environment with clean readable silhouettes, no blur, no photorealism. Right half contains the fireplace, armchair, cat and most interest; left half darker with subtle background shelves, room for overlaid HTML title. No text, letters, numbers, logos, borders or UI.

## World artwork

The overworld was generated with the built-in ImageGen tool and saved as `dist/assets/hearthlands.png`. Its original generated file is preserved. The route, quest controls, adventurer, equipped companion, bridges, and animated environmental accents are drawn by application code above this illustration. Prompt used:

> Use case: stylized-concept. Asset type: playable pixel-art overworld map background for a cozy fantasy learning RPG. Create a polished wide 3:2 top-down / lightly isometric 16-bit pixel art world map, entire landscape fills the frame with NO margins. Charming old taverns, pubs, fields, magical forest, lakes, mountains. Carefully follow this layout: bottom LEFT (15% across, 80% down) a cozy half-timbered tavern village with amber windows and a red roof; bottom CENTER (50% across, 78% down) open sunlit wildflower meadows and wheat fields with fences and a windmill; bottom RIGHT (83% across, 76% down) a welcoming roadside pub with copper orange roof, a small market and beer garden; middle RIGHT (80% across, 47% down) shimmering turquoise lake with a wooden bridge, small sailboat and lily pads; middle LEFT (33% across, 43% down) a magical forest with teal, jade and purple trees, luminous mushrooms and tiny ancient stone ruins; TOP CENTER and TOP RIGHT (65% across, 15% down) misty lavender mountains, crystalline rocks and a little guild castle with pennants. Broad connected sandy walking trails wind between these six places in this order: bottom-left tavern, across lower meadows to bottom-right pub, up the right side of the lake, west across the lake bridge toward the magical forest, then northeast through the forest up to the mountain guild. Leave ample open grassy walking space around landmarks and paths, roughly 50 percent map is traversable open land. The lake water is mainly middle right; forest middle left; mountain ridge top. Beautiful lush green countryside with varied foliage, warm honey sunlight, blue-violet shadows, fairy-tale atmosphere. Detailed yet readable chunky pixel clusters and crisp edges, classic adventure game overworld, consistent scale and camera. No characters, no UI, no circles, no quest markers, no labels, no text, no letters or numbers, no logos, no frame.

## Guildlands artwork

The extension panorama is generated artwork in `dist/assets/guildlands.png`; the original output is preserved. It continues beside the original illustration without changing the existing quest coordinates. Generation prompt:

> Use case: stylized-concept. Asset type: a wide continuation map for a cozy pixel-art fantasy learning RPG. Generate an EXTRA WIDE 3:1 panoramic overworld, ideally 3072 by 1024 pixels. Top-down slightly isometric 16-bit pixel art, chunky readable pixels, bright lush detailed game landscape, matching a warm storybook countryside game. Fill entire image, no borders, no text, no UI or quest markers, no characters. An expansive connected valley beyond a medieval guild: LEFT third contains a timber riverside trading town, markets and ledgers workshop at the bottom, hillside statistical orchard and gardens above, a glass-roof alchemist greenhouse toward the top. MIDDLE third has a charming fortified stone gate at the top, a grassy valley of watermills and modelmaker workshops across the center, a magical observatory with small blue crystal towers toward the bottom. RIGHT third has moonlit library groves and a great wooden archive by a small lake in the middle, winding mountain trails leading to a golden-roof academy on a sunny peak at the upper right. A network of broad sandy winding paths connects every landmark; allow lots of open grass between landmarks for UI quest stops. Colorful forest, farms, lakes, wooden bridges, purple mountains in distance. Friendly, exploratory, warm emerald and gold palette gradually becomes blue and lavender to the right. Consistent camera, scale, and lighting. No words, letters, numbers, labels, circular icons, logos, frame, or legend.


## Connected guild pass

`dist/assets/guild-pass.png` is a connecting terrain panel made with the built-in ImageGen tool using the two existing maps as references. It spans world x=1320–1960, fully covering the original image join between quests 26 and 27. Its outer edges blend into the neighboring scenery with a CSS mask. A continuous road and bridge share the existing walking-path curves; quest positions and saved progress are unchanged. The source image remains in the generator output directory. Prompt:

> Use case: compositing.
> Asset type: a seamless transition panel for an existing pixel-art RPG overworld.
> Input 1 is the original Hearthlands map; input 2 is the wider Guildlands extension. In the game, input 1 occupies world x=0..1600, y=0..1067, and input 2 occupies x=1600..4800, y=0..1067. They currently have an ugly hard vertical join at x=1600.
> Create ONLY a portrait connector panel covering world x=1320..1960, y=0..1067 (aspect ratio 640:1067). This panel will be laid over the join with its far-left and far-right edges gently feathered. Match the original terrain at the left edge and the extension terrain at the right edge. It is a crop of the same world at the SAME scale, not a new complete world squeezed into a portrait.
> Top: continue the lavender mountain horizon and rocky green guild foothills of input 1 naturally into the fir-covered cliff ridges of the far left of input 2. Keep the same sunlit isometric/top-down perspective. Upper quarter: a walkable sandy mountain pass and small rustic stone bridge should connect diagonally from panel x=180,y=220 to x=300,y=310, descending toward x=380,y=390 and x=460,y=520. These coordinates are in a 640 by 1067 panel. The path must visibly connect across the middle; do not place a giant waterfall, wall, or building across that route.
> Middle: connected evergreen woods, grassy ledges, rocks, a stream with small bridges, continuous terrain without a dividing line. Transition the original lake shore on the left toward the extension's terraced trading village on the right. Lower quarter: connect the original tavern's grassy outskirts into the extension's riverside town outskirts. Tiny timber roof edges, flowered grass, sandy paths, and coherent blue water where appropriate. Preserve the existing asset scale; trees should be approximately 30-65 pixels tall when this panel is displayed at 640x1067, not huge close-up trees.
> Style: match both inputs' warm, colorful, detailed 16-bit pixel art; chunky crisp pixel clusters; emerald and jade foliage, honey sandy trails, lavender gray rocks, turquoise water. The two sides must read as one connected physical landscape. No border, text, labels, quest numbers, circles, UI, characters, or fog hiding the connection. Fill the full panel. Opaque background.


## Hosting

The private Sites project identity and static output path are in `.openai/hosting.json`. Publish the contents of `dist` as a static site. Source repository credentials are not stored in this project.

The local game is complete and can be run with the launcher above. Hosted publication requires access to the configured private Sites source repository. A registered Site identity alone does not mean a deployment is live.


## A cozier room and a village that moves

The room now matches the illustrated village: a glowing fireplace, quilted bed, evening window, warm timber, and ten detailed furnishing overlays. Open Decorate your room below the scene, then choose a furnishing category to buy, place, or clear its two options. Close the drawer for a larger room view. The village uses a compact header and controls to leave more space for exploration. Furniture ownership and saved layouts carry forward. Artwork and final generation prompts are in [docs/room-art.md](docs/room-art.md).

Rowan, Mira, and Elio take short walks and pauses within every morning, afternoon, and evening routine. They stop when approached or selected, wait during conversations, and resume afterward. Reduced motion keeps them still; hidden or unfocused windows pause the walks. All routes use the same collision-aware paths as the player.

The village and room fit inside the available screen. All eight navigation destinations stay visible, including a two-row phone layout, with Settings in the top bar. The quest map remains draggable and zoomable. Reading-heavy pages and dialogs keep a single vertical content scroll so longer lessons remain accessible.


## Weather, pet friendship, and free decorating

In **Settings > Weather & quiet sounds**, choose clear skies or gentle rain. Rain adds raindrops and warm puddle reflections to the village, and rain at your room and cafe windows. Weather animation has its own switch; Reduce motion takes priority. Rainfall, fireplace crackling, and cafe room tone/clinks each have their own sound switch and share an ambient volume slider. Reward chimes remain separate. Sounds are synthesized locally, begin only after interaction, follow the current location, and pause when the page is hidden or unfocused. New and migrated saves start with clear weather and ambient sounds off.

Visit **Companions** to pet your active friend, play fetch, and practice tricks. Each activity grants friendship once per device-calendar day (2, 3, and 4 points respectively); repeat play is always available. Friendship never decays and does not alter learning XP, coins, or streaks. Practice teaches a little hop at 6 friendship and a twirl at 18. Sleeping spots unlock at 6, 18, and 36 friendship: a knitted cushion, willow basket, and patchwork nest. Choose a bed there to display it in your room. Each adopted companion has its own friendship and learned tricks. Leaving an unfinished interaction cancels it without granting rewards.

In **Your room > Decorate your room**, drag the selected chair, lamp, plant, rug, or wall furnishing anywhere in the scene. Rotation and bounds are saved along with wallpaper. Use arrow keys to nudge a focused furnishing, Shift for larger steps, R to rotate clockwise, Shift+R to rotate counterclockwise, or the visible movement/rotation buttons. Escape cancels a drag. Reset arrangement restores furniture positions without discarding purchases or changing wallpaper. The existing one-furnishing-per-category selection remains; all owned variants can be swapped freely. Four wall finishes and the two rug variants are available through the drawer. Close it for the large room view.

The additions preserve version-1 saves. New validation covers legacy migration, malformed imports, rotated furniture bounds, drag/save/cancel behavior, drawer state, friendship reward deduplication, trick/bed unlocks, independent audio channels, gesture activation, and audio/timer cleanup. No connected browser was available for visual or audio playback QA; DOM adapters and local HTTP checks complement the 86 automated tests.


## The companion haven and Elio’s observatory

Visit the companion haven from Companions and the observatory from Willowmere Lake (both are also in Nearby). Seven new Python projects grow from beginner dictionaries and telescope alignment to scheduling, recommendation constraints, noisy measurements and held-out prediction tests. Arrange animal introductions after a personal review, restore the telescope, record fictional skies, and run your saved tools again in the village exhibition. Warm illustrated locations, persistent progress and one-time XP/coin rewards use the existing game systems. See [the feature and verification notes](docs/haven-observatory.md). The current suite has 163 passing tests; browser visual QA was unavailable.


## Direct village navigation

Six illustrated entrances below the village open the observatory, companion haven, clockmaker, lake, restoration square and High Street directly. The Places menu is the same flat directory everywhere, including the exhibition and all learning activities. Elio, Rowan and Mira each offer a picture shortcut at the top of their conversation. Village marker labels appear on hover, keyboard focus or proximity; direct neighbour buttons remain available without walking. No saved progress changes. Navigation, conversation routing and the existing movement flows are covered by 165 passing tests. Browser layout verification was unavailable in this session.
=======
# HeartCode
>>>>>>> origin/main


## Companion Haven and full-game audit (24 October 2026)

The Haven now welcomes three fantasy companions in the existing pixel-pet style: Moss the mosslight sprite, Bramble the autumn hedgehog, and Clover the moonbeam moth. Complete their care projects to unlock adoption for 90, 240, and 420 coins. Adopted friends use the normal companion, friendship, room, exploration, and save systems. Their cottage has matching botanical pictures, wool scarves, lanterns, and woodland details. Previous care-project progress is retained.

This update also protects newer saves from stale tabs, preserves empty drafts, synchronizes furniture selection with the room controls, keeps clearing available on short screens, improves parent-place navigation contrast, restores dialog focus, counts project revisions as learning, preserves saved-tool results after verbose logging, and strengthens three beginner lesson checks. See [the audit and verification record](docs/companion-haven-audit.md) for exact scope and browser limitations.
