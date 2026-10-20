# Hearthwick room refresh

Generated with the built-in ImageGen tool. No CLI or API fallback was used. The original generated files are preserved in the generator output directory.

## Assets

- `dist/assets/hearthwick-room.png` — 1536 x 1024 room background. Reference: `dist/assets/hearthwick-evening.png`.
- `dist/assets/hearthwick-furnishings.png` — 1983 x 793 transparent furnishing atlas. Reference: the new room background. Ten independently placeable furnishings are selected with SVG crop windows; the original raster is unchanged.

Permanent room details include the fireplace, desk, bed, curtains, and incidental books and greenery. Purchased chairs, lamps, plants, rugs, and wall decorations are separate overlays. Firelight gently flickers; reduced-motion settings disable it. Existing ownership and layouts remain compatible.

## Final room prompt

Use case: stylized-concept. Asset type: room background for Hearthcode, a cozy village learning game. Input image is a STYLE REFERENCE ONLY. Create the upstairs room above this 1950s European village cafe, in the same richly detailed fine-pixel painterly game illustration, softly lit materials, beautiful texture and welcoming warm colors.
Wide landscape 1536x1024 if possible, slightly elevated three-quarter view of an intimate complete room, all floor edges inside frame. Warm honey plaster, exposed dark walnut beams, weathered wooden floorboards, glowing brick fireplace on the BACK LEFT, small curtained evening window on the BACK CENTER, a small wooden desk underneath the window slightly RIGHT OF CENTER, snug bed with terracotta patchwork quilt tucked at the FAR RIGHT. Vintage enamel teapot on the mantel, tiny clock, worn books in a corner, embroidered curtains, small paper notes, glass bottles on a high ledge: considered personal details. Soft amber firelight spreads across the boards, golden window edges with muted dusk teal outside, gentle contact shadows, subtle material color differences. Cozy, bright enough to read, charming and lived-in.
IMPORTANT compositing layout: the large foreground floor is EMPTY for furniture sprites and a character to be added by code. No armchair and no rug anywhere. Leave the foreground area from x18% to x72%, y63% to y94% clear wooden floor. Leave the desk top at approximately x56%-66%, y55% empty for a small table lamp. Leave an empty short wooden trophy shelf on upper-right wall around x73%, y31%. Leave a small blank wall area around x37%, y34% for a shelf or print. Leave a clear window sill at x49%,y45% for a potted plant. The fireplace and bed are fixed scene furnishings, but all chairs, table lamps, potted plants, rugs and wall prints will be added later: do NOT paint those into the image.
No people, no pets, no interface, no lettering or text, no watermark. Avoid simplistic vector shapes, bland beige surfaces, plastic 3D, heavy black outlines or gloomy darkness. Depth and delightful tiny illustrated texture are essential.

## Final furnishing prompt

Create a transparent sprite atlas of TEN separate vintage cozy room furnishings, arranged in a precise FIVE-column TWO-row equal grid, each item entirely inside its cell with generous transparent margin. STYLE matches the reference image: rich painterly fine-pixel illustration, warm amber lighting from left, detailed wood grain, fabric stitching, soft contact shading. Slightly elevated front three-quarter view suitable for compositing into this room. Top row left to right: cinnamon upholstered reading armchair; brass table lamp with cream shade; fern in terracotta pot; oval braided warm brown rug lying flat viewed from above at an angle; small wall-mounted wooden bookshelf with books. Bottom row left to right: sage-green upholstered armchair; stained-glass amber and teal table lamp; cream flowers in a blue ceramic jug; oval terracotta and sage patchwork rug lying flat viewed from above at an angle; small framed star chart with no lettering. Each object isolated, no floor or scenery, no people, no text, no cell borders. Exactly ten objects, no overlapping cells. True transparent background. Landscape image, 5 columns and 2 rows.

## Verification

The generated background and transparent atlas were visually inspected. Browser UI inspection was unavailable: the enabled computer-use inventory reported no browsers or apps. The 73-test suite covers ambient walks in every period, path safety, approach/interaction pauses, focus and reduced-motion behavior, timer cleanup, category switching, saving and furnishing purchases, and all existing curriculum and map flows. Local HTTP checks served the updated modules, stylesheet and both image assets successfully.

The village fits a fixed 1000 x 650 coordinate system into the available viewport. The room uses a contained 3:2 scene. Navigation stays visible; a category selector replaces the long furnishing list. Reading pages and dialogs retain vertical scrolling for their content, while the quest map keeps its drag/zoom camera.

