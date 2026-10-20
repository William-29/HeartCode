# Restoration and wardrobe artwork

Mode: **built-in ImageGen**, using the existing Hearthwick village and neighbour illustrations as references. Originals remain in the ImageGen output directory; the selected assets below are copied into the game.

The character is assembled from separate painted body, head, scarf, and keepsake layers. Source images are not cropped or painted over on disk. `wardrobe-art.js` defines source rectangles and fitting positions; the live SVG renderer and the registration preview use the same coordinates. `tests/render-character-preview.ps1` renders a contact sheet for alignment review; it is not a browser screenshot.

[Clothing registration preview](wardrobe-registration.png)

The courtyard has aligned before, working, and reopened paintings. Each building reveals its own repaired details and final lighting independently, so progress on one cannot visually repair its neighbours.

## Painted outfit bodies

Saved asset: [dist/assets/hearthwick-outfits.png](../dist/assets/hearthwick-outfits.png)

Final prompt:

> Use case: stylized-concept. Production game paper-doll BODY atlas, transparent background. Reference image is style and identity reference only: use ONLY the young brown-haired adventurer at FAR LEFT, not the three other people. Match that adventurer's hand-painted textured storybook style, warm amber rim light, realistic soft wool/leather texture, same small adult proportions and neutral three-quarter front pose. Create exactly THREE separate headless fully clothed body cutouts side by side, evenly spaced, each from the bare base of the neck to the soles, SAME SIZE and IDENTICAL pose and limb positions. Heads and hair are intentionally absent because separate heads will be composited. Neck stub ends just above the collar. No scarves: collars and upper chest should be visible. Each body has the same blue-brown trousers, sensible worn brown boots, relaxed arms, one hand holding a brown cross-body satchel strap, the same brown satchel at the left hip. First body: the original warm rust tweed long coat over cream blouse and moss vest. Second: moss-green wool cardigan with brass buttons over an oatmeal shirt, rolled sleeves, comfortable brown trousers. Third: warm cinnamon knitted cardigan under an indigo baker's apron with cream stitching and small pockets, brown trousers. Three complete neck-to-boots outfits, consistent silhouette width, soles on same baseline. Fine painted details, warm and cozy 1950s village style, NOT flat vector, NOT chibi, NOT glossy 3D. No floor shadows, no background, no text or labels, no heads or floating accessories. Preserve true alpha transparency. Wide image. Leave clean transparent separation between the three bodies.

## Hairstyles and matching faces

Saved asset: [dist/assets/hearthwick-hairstyles.png](../dist/assets/hearthwick-hairstyles.png)

Final prompt:

> Use case: identity-preserve. Make a transparent game paper-doll HEAD atlas. Reference image is style and identity reference: use ONLY the young adventurer at FAR LEFT. Create THREE isolated heads with short neck stubs, side by side, SAME scale, identical face identity, same warm skin, kind brown eyes, same slight three-quarter front gaze and lighting. Only hairstyles change. LEFT: original short tousled chestnut hair with the original brown tweed newsboy cap. MIDDLE: loose softly wavy short chestnut hair, no hat, ears gently visible. RIGHT: chestnut hair in a loose low side braid over the left shoulder, a few soft strands around face, no hat, simple tiny cream ribbon at braid end. Each includes the full chin and a short visible neck ending below collarbone, but NO clothing or scarf and NO torso. The same face proportions and pose across all three heads, same eye and chin baseline. Match original painted textile storybook texture and warm golden ambient light, cozy 1950s village character, no photorealism, no flat vector, no chibi. Clean transparent separation, true alpha background, no text, no labels, no other people. Wide canvas.

## Knitted scarves and brass keepsake

Saved asset: [dist/assets/hearthwick-knitwear.png](../dist/assets/hearthwick-knitwear.png)

Final prompt:

> Use case: stylized-concept. Production transparent accessory atlas for the young adventurer at FAR LEFT of the reference image. Reference is style and garment-fit reference. Exactly FOUR separate items in one horizontal row, generous transparent gaps. Item 1: the adventurer's oatmeal cream chunky knitted scarf, loosely looped around an INVISIBLE neck with one long end hanging down the viewer's right side; remove all person, head and clothing, transparent neck opening. Item 2: same scarf, same shape and drape, but muted mulberry/rust wool with a narrow cream stripe at the fringe. Item 3: same scarf, same shape and drape, in soft sage wool with hand-stitched little ochre leaf at its hanging end. Item 4: a small vintage brass swallow brooch with a moss green enamel leaf, visible clasp not needed, angled to pin to a coat lapel. All objects are isolated transparent cutouts, soft warm amber lighting, textured hand-painted yarn and worn brass, matching the original cozy 1950s village painted storybook game. No bodies, faces, mannequin, clothing behind scarves, no background, floor, shadow or text. Each scarf stays wholly inside its separate column. Scarf openings and empty space must have genuine alpha transparency.

## Founders’ Court before restoration

Saved asset: [dist/assets/founders-court-before.png](../dist/assets/founders-court-before.png)

Final prompt:

> Use case: illustration-story. Game environment for the SAME village as the reference: matching intricate warm painted/pixel-like textures, amber lamps, cobblestones, 1950s cozy old-town charm, soft depth and tree shadows. Create a wide 3:2 scene of Founders' Court, a beloved courtyard whose three buildings have been closed for years and need neighbourly restoration. Same elevated three-quarter camera as reference. Composition must allow each building to be overlaid independently: LEFT THIRD (x 3-32%, y 10-65%) a charming red-brick bakery with red tiled roof, faded cream-and-rust awning rolled up, closed green shutters, dusty bread window, small stacked wooden crates. CENTER THIRD (x 35-64%, y 3-58%) a slightly taller old community library with blue slate roof, arched timber door, boarded lower window, ivy, a modest bell. RIGHT THIRD (x 68-98%, y 16-65%) a Victorian timber-and-glass greenhouse with several missing panes, overgrown but living greenery, covered seed trays, sage framing. Keep distinct gaps of visible cobblestone between each building. Lower 35% is an OPEN VILLAGE SQUARE with a circular stone medallion and a few empty simple wooden exhibition tables at bottom left and bottom right; no display objects yet. The path leads from bottom center to the three doors. One old wrought iron streetlamp near each building casts welcoming golden light, trees and climbing roses frame outer edges. The court feels quietly loved and full of possibility, not destroyed, unsafe or depressing. Gentle late afternoon sun, warm brick, cream plaster, moss and teal shadows, golden touches. No people, no characters, no words/sign lettering, no UI, labels, borders, no giant fountain. Full-frame artwork. Preserve spacious usable foreground for game markers.

## Founders’ Court during restoration

Saved asset: [dist/assets/founders-court-working.png](../dist/assets/founders-court-working.png)

Final prompt:

> Use case: precise-object-edit. Edit target is this EXACT courtyard. Create the intermediate RESTORATION-IN-PROGRESS state. Keep canvas, camera, composition, every building silhouette, roof, windows, doors, background trees, streetlamps, foreground tables, cobblestones and shadows pixel-aligned. Do not move anything. Preserve the warm painted storybook style. Make ONLY these local repairs: LEFT bakery: remove dusty bread-window objects, clean the empty bread counter inside, keep shutters and door closed, add a neat flour sack and small repair stool beside the old crates. CENTER library: remove the cross-boards over the lower right window, install clean glass, keep the room unlit and show neatly stacked books wrapped in a cloth on the inside sill; outside on the steps a wooden toolbox and one short folded ladder, same closed door. RIGHT greenhouse: repair the broken glass panels, straighten green frame, still keep the interior plants covered with neat cloths and the door closed, a small stack of empty seed trays next to it. No bright interior window glow or opening celebration yet. It should look cared for and actively being made ready. Keep all trees, flowers and lamps unchanged. Keep the entire lower 45% of the image exactly unchanged. No people, text, signs, letters, UI or new buildings.

## Founders’ Court reopened

Saved asset: [dist/assets/founders-court-restored.png](../dist/assets/founders-court-restored.png)

Final prompt:

> Use case: precise-object-edit. Edit this exact courtyard image into its lovingly RESTORED state for a game. Preserve the entire composition pixel-aligned: canvas 1536x1024, same camera, every building silhouette, roofs, walls, trees, flowers, lamp posts, cobblestones, paving medallion, all shadows and foreground tables in exactly the same positions. Change ONLY signs of closure and repair on the three buildings. LEFT bakery: polished green shutters open against the wall, clean warmly glowing bread display window with fresh loaves and a little flour bowl, smooth mended cream-and-rust awning, tidy delivery baskets replacing the stacked repair crates. CENTER library: remove the boards over the lower right window, show warmly illuminated bookshelves and an armchair through repaired glass, polished welcoming wooden arched door slightly ajar, one basket of books by the steps, neatly trained ivy. RIGHT greenhouse: replace every broken roof pane with complete transparent glinting glass, restore sage-green metalwork, remove dust covers and show healthy seedling trays, lemon tree and potting bench inside; tidy watering can by the door. Keep it cozy and believable, every repair visibly useful. Do NOT move, enlarge, reshape or add any buildings, doors, windows, lamps or trees. Do NOT change the square or tables at the bottom; these must remain exactly aligned and empty for separate game displays. No people, no text or lettering, no UI. Identical intricate painted storybook texture, warm 1950s village atmosphere.

