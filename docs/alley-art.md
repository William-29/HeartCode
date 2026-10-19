# Hearthwick evening background

Generated with the built-in image generation tool on 2026-10-19. No CLI fallback was used.

- Project asset: `dist/assets/hearthwick-evening.png`
- Original, preserved: `C:\Users\willi\.codex\generated_images\01a15480-28f6-7b33-8532-114bff57db8d\exec-dcdff03f-9ba0-48c6-ae00-a7845ad6b7f4.png`
- Image dimensions: 1536 × 1024 pixels.
- Intended display: 1000 × 650 world coordinates, with the scene image stretched to that full scene.

## Visual inspection and alignment

The final image has a warm brick cafe at upper left, a green workshop at upper right, an open cobbled center, small fountain, lower-left pond, and open lower-right companion garden. All six requested interaction foot positions are on open ground. No people, text, UI, or watermarks are visible. Building roofs extend to the upper edge more than the requested bounding rectangles, but the playable lower courtyard and character locations remain clear.

Approximate positions in a 1000 × 650 rendered scene:

- Large streetlamp heads: (33, 148), (56, 379), (926, 387), (949, 158), (611, 55), (374, 57).
- Tavern main windows/door: (271, 180), (159, 175), (108, 176). Tavern dormer windows: (193, 74), (258, 75).
- Workshop main windows: (721, 174), (865, 174). Door: (798, 197). Dormer: (794, 77).
- Overhead string-light bulbs: x approximately 416, 451, 486, 520, 555, 590, 624; y between 30 and 44, with the deepest sag at the center.
- Fountain visible area: x approximately 445–555, y approximately 266–346. Its ground/base center is near (500, 318).

These coordinates support subtle glow animation over the existing raster lights. The background already contains lamp posts and string wires; duplicate SVG lamp structures are unnecessary.

## Generation prompt

Use case: stylized-concept
Asset type: finished raster background for a playable cozy village exploration game.
Primary request: a richly detailed, comforting 1950s village back alley at early evening, warm brick cafe and craft workshop, garden pond, a little fountain, and inviting cobbled open courtyard. This should feel like a beautifully authored mature pixel-art game environment, with intricate small material details and gentle painterly color variation, not a diagram.
Output: one full-bleed landscape image, approximately 1536 x 1024, no frame or UI. The scene will be mapped directly onto a 1000 x 650 playable area.
Camera: fixed elevated three-quarter top-down orthographic game camera. Roofs, doorways, windows and ground are visible. No horizon, no perspective vanishing point, no distant street that shrinks into the distance. Ground positions throughout the scene must stay consistent with a flat map. Buildings face toward the bottom of the image.

LAYOUT: all percentages below are relative to the whole image, x from left and y from top. Preserve this playable layout precisely:
- Upper left: the ENTIRE visible footprint of an inviting old brick tavern/cafe, including tiled roof, awning and front step, must be contained inside x=7% to31%, y=17% to47%. Warm coral and rust-red bricks, weathered wooden door, glowing amber windows with a glimpse of curtains, burgundy/red-and-cream striped canvas awning. This is the major left building.
- Upper right: the ENTIRE visible footprint of a charming craft workshop, including roof and front step, contained inside x=66% to89%, y=17% to45%. Deep green painted storefront, worn honey-colored brick, warm illuminated windows, slate and terracotta roof detail.
- Top center: an open cobbled alley exit centered x=50%, y=15%, continuing to the top edge. This is a clear path, not a third central building.
- Small circular stone fountain centered x=50%, y=49%, with ground footprint radius only4% of image width. A modest water jet and basin, subtle turquoise reflections. Do not enlarge it.
- Lower left: small reflecting pond in a lush garden, centered x=18%, y=76%, oval radius14% image width and14% image height, contained entirely left of x=32%. Teal water, lily pads and reflected amber lamplight, natural stone edge, ferns and blossoms. A clear walkable path runs down its RIGHT edge around x=34%-38%.
- Lower right: a cozy little companion garden near x=80%, y=78%, flowers and low planting borders around an OPEN clear central patch. Keep x=80%,y=78% itself flat and unoccupied.
- The rest of the center and bottom is a broad, connected, open cobblestone courtyard. Keep these precise future character foot positions clear flat walkable ground: (27%,52%), (67.5%,51%), (35%,77%), (78%,52%), (80%,78%), and (50%,71%). Nothing blocks these spots. No objects in the main walking routes between them.

Set dressing: small planters, flower-filled window boxes, a bicycle and a few cafe tables tucked closely along building edges only, not scattered across the playable square. Worn masonry walls and foliage at outer borders create a sheltered back-alley feeling. Hanging amber string lights cross above the upper courtyard; several period streetlamps cast warm pools of light, placed near edges. No cars.
Lighting and materials: readable inviting early evening, NOT a dark night scene. Luminous honey, peach, copper and cream highlights, warm terracotta and wood, green foliage, teal water and cool dusty blue/slate ambient shadows. Warm light spills from the cafe and workshop windows over textured cobbles. Give the environment depth with contact shadows, long soft lamplight shadows, subtle damp glints, irregular individual stones, chipped paint, brick variation and layered plants. Generous light and color in the open courtyard.
Style: intricate high-quality cozy pixel-art painted game backdrop, fine deliberate pixel detail, rich material texture, organic imperfections, human-authored illustrated quality. Attractive mature proportions and strong atmosphere.
Strict constraints: NO people, animals, character sprites, text, letters, signs with writing, numbers, labels, UI, buttons, health bars, borders, logos or watermarks. No flat vector look, no simplistic SVG shapes, no cube-like toy houses. Do not put decorations, fences, benches or extra buildings across the marked walkable positions.
