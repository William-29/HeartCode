# Hearthwick neighbors character atlas

Generated with the built-in image generation tool on 2026-10-19. The village background was supplied only as a style and lighting reference. No CLI fallback, cropping, or pixel editing was used.

- Project asset: `dist/assets/hearthwick-neighbors.png`
- Original, preserved: `C:\Users\willi\.codex\generated_images\01a15480-28f6-7b33-8532-114bff57db8d\exec-e826ee74-f67e-4f37-98a6-147ed69d8efa.png`
- Style reference: `dist/assets/hearthwick-evening.png`
- Actual image dimensions: **1774 × 887 pixels**, RGBA PNG, 1,862,517 bytes.
- Requested layout: four characters in one row; actual order is traveler, Rowan, Mira, Elio.

## Visual and transparency verification

All four characters are fully visible from head to boots, with warm expressive faces, detailed wool and leather clothing, consistent warm lighting, and distinct silhouettes. There is no text, scenery, ground plane, or cast ground shadow. The image is painterly with fine textured edges, rather than a simple flat sprite. The soft illustrated style follows the village's warm material palette.

System.Drawing inspection confirmed genuine transparent alpha: 782,579 fully transparent pixels, 73,118 pixels with alpha 1–31, 10,086 with alpha 32–127, 17,834 with alpha 128–239, and 689,921 with alpha 240–255. Most character interiors are effectively opaque, with softer edges. The original is preserved unchanged.

The generated atlas does not have perfectly equal character cells: Rowan is wider and crosses the nominal second-quarter boundary. Use the individual rectangles below instead of equal-quarter clipping.

## Recommended CSS rectangles

Rectangles are native source pixels in `[x, y, width, height]` form. They are intended for CSS background image offsets or equivalent clipping without creating modified image files.

| Character | Alpha ≥ 32 content bounds | Full-body crop | Square head portrait |
| --- | --- | --- | --- |
| Traveler | [53, 40, 347, 815] | [40, 20, 375, 845] | [104, 22, 265, 265] |
| Rowan | [465, 36, 440, 816] | [450, 20, 470, 845] | [552, 14, 260, 260] |
| Mira | [957, 64, 317, 788] | [940, 20, 350, 845] | [980, 38, 280, 280] |
| Elio | [1387, 36, 346, 819] | [1370, 20, 380, 845] | [1430, 10, 260, 260] |

All full-body crops share native y=20 and height=845. Feet are at approximately native y=851–854, so they can use one ground baseline. At rendered crop height 70px, use scale 70/845 and multiply all source dimensions and offsets by that scale. CSS should supply the small ground shadow separately.

## Generation prompt

Use case: stylized-concept
Asset type: transparent character sprite atlas for a cozy 1950s village exploration game.
Input image 1 is a STYLE AND LIGHTING REFERENCE ONLY: a richly textured warm evening village. Do not edit, reproduce, or include its scenery. Generate only four new full-body character sprites, isolated on genuinely transparent alpha.

Canvas and layout: landscape 2048 x 1024 if possible, four equal invisible 512-pixel-wide cells in ONE horizontal row. Centers at x=12.5%,37.5%,62.5%,87.5%. Each whole body including carried items must fit inside its own quarter with comfortable transparent margins. All four heads near y=10%, feet at the SAME baseline near y=90%, similar scale. No dividing lines. No overlap, no cropping, no second row.
Characters, in this exact LEFT TO RIGHT order:
1. Traveler: welcoming androgynous young adult, warm peach skin, softly wavy brown hair under a tweed flat cap, cinnamon/rust wool coat, cream knitted scarf, muted petrol-blue trousers, brown leather boots, small leather satchel across the body. Calm curious smile. No hood, wizard hat, staff or weapon.
2. Rowan: kindly older innkeeper, comfortably round build, soft white beard and warm expressive face, cream shirt with rolled sleeves, sage-green waistcoat, rust-brown waist apron, practical brown boots. Holds a small ceramic mug close to torso, inside the cell. Welcoming relaxed smile.
3. Mira: warm tan-skinned adult woman with short softly wavy auburn hair, cream blouse beneath a terracotta cardigan, muted blue work overalls with a small utility pocket, brown shoes. Friendly lively expression, capable and approachable, relaxed arms.
4. Elio: brown-skinned adult gentleman with round glasses, muted lavender cloth cap, sage cardigan over a honey-colored shirt, brown trousers and boots, botanical leather satchel and a small notebook held near torso. Warm, thoughtful smile.

Consistent rendering: all in the SAME slightly elevated three-quarter game camera, front-facing turned slightly RIGHT, standing naturally. Cozy adult proportions approximately four heads tall, rounded forms and soft kind faces. Readable head, hands and boots. Strong, distinct silhouettes that remain recognizable around70 pixels tall in-game.
Medium: richly detailed fine-pixel painterly game illustration matching the reference village's materials, subtle pixel edges, textile weave, wool softness, leather wear and tiny warm highlights. Rich but controlled natural color variation. Soft warm golden key light from upper left, gentle cool teal shadow accents. Detailed illustrated quality without harsh black outlines or gritty dirt.
Avoid: flat SVG/vector shapes, chunky four-pixel characters, overly simplistic cartoons, exaggerated anime faces, glossy3D, plastic materials, sharp angular faces, giant heads, realism/horror faces, medieval wizards, combat equipment.
Transparency is essential: actual transparent RGBA pixels around each character, not a white, colored or checkerboard background. NO background scenery, floor, backdrop, frame, circles, panels, labels, text, logos, ground props or cast ground shadows. CSS will supply ground shadows. Each character alone from complete head to complete soles. Exactly four characters, equally spaced in one row.
