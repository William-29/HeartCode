# Mira's clockmaker workshop and companion discoveries

## Finding the new places

Visit **The clockmaker** from the village or Mira's conversation. **Companion discoveries** is also a village destination. Both appear in the direct-visit dropdown; the eight main navigation links remain unchanged. New world views fit the viewport, with reading and coding in the existing learning dialog.

## Four keepsakes to mend

Mira keeps her grandfather Orrin's bench. The objects belong to existing neighbours, with a personal memory and an outcome for each repair.

| Repair | Trail quests | Learning |
|---|---:|---|
| Rowan's kitchen clock | 0 | Inspect a latch; fix `or` versus `and` |
| The library dial | 4 | Trace hours; loop and wrap from 12 to 1 |
| June's music box | 12 | Arrange jobs; compose cleaning and repetition functions |
| The village clocks | 24 | Schedule simultaneous events; validate intervals |

Repairs are sequential. Each requires a correct inspection answer before Python completion. The music box also requires putting three jobs in order with keyboard-accessible earlier/later controls. Finished arrangements remain fixed for review, preserving completion on reload. All projects include a faulty starter, hint, worked solution, altered-input Python checks, saved drafts, and cancellation.

Completed objects visibly tick or move on the bench. Revisit the saved code and run a demonstration: the music box plays the returned notes only when **Listen to your melody** is clicked. Audio uses local synthesis, accepts at most 32 valid notes, and stops on Stop sound, navigation, dialog close, page hiding, or window blur. It never autoplays. Clock and note animations respect reduced motion.

## Three discoveries on familiar paths

Your equipped companion shows a small curiosity cue near a clue. Walking within 45 village units records it once and reveals a marker. Found clues are shared across all pets, with no friendship, species, purchase, or daily gate.

The discovery journal offers a hint and **Follow my companion**. This uses the existing safe walking paths and opens the journal on arrival. With reduced motion, it arrives immediately. Keyboard walking and direct visits remain available.

| Discovery | Place | Optional coding project | Trail quests |
|---|---|---|---:|
| Orrin's brass key | East of the fountain | Clean a smudged cupboard tag | 0 |
| The picnic tin | Ivy by the lakeside path | Remove duplicate guests while preserving order | 8 |
| The ribbon path | Beyond the companion garden | Trace directions to the listening bench | 16 |

The stories belong to Mira, Rowan, and Elio. Helping brings a returned key to the workshop, a picnic tin beside the café, and ribbons marking the reopened garden path. Their remembered outcomes remain in the discovery journal. The path project renders its actual returned coordinates as a small route diagram.

Finding clues grants no currency; each of the seven coding projects grants XP and coins only once. Replaying, listening, changing companions, or following a known clue does not repeat rewards or advance the main campaign.

## Saved progress and checks

The existing `neighbours` field now includes `found`, `inspected`, and `orders`. Old saves migrate with empty defaults. Imports validate clue IDs, sequence gates, inspection progress, and valid function-order permutations. Drafts and saved code retain their existing bounds.

Automated checks cover all seven new solutions and faulty starters; staged repairs; actual saved-code performances; all five companions; legacy/malformed saves; proximity and safe walking; reduced motion; no repeat rewards; controller flows; navigation; and audio start/stop lifecycle. Existing cancellation tests cover the shared learning controller. No connected browser was available for visual layout or audio playback QA.

## Artwork

Mode: **built-in ImageGen**, with the existing village as a style reference. Generated image inspected and copied into the project, source preserved.

- Asset: `dist/assets/clockmaker-workshop.png`
- Source: `C:/Users/willi/.codex/generated_images/01a15040-7707-7081-9f4a-fef6829ad54d/exec-df2f52ff-e174-4f8e-bd56-6242b7f4305c.png`
- Reference: `dist/assets/hearthwick-evening.png`
- Clocks and music-box mechanisms are native SVG with brass/wood gradients and motion; existing character layers and pet sprites are reused.

Final generation prompt:

> Use case: illustration-story. Game environment asset for Hearthcode. Reference is STYLE ONLY: warm detailed hand-painted pixel-inspired 1950s village, amber lantern light, moss green and honey-colored wood, welcoming human-scale craftsmanship. New scene: Mira's clockmaker workshop interior, 3:2 landscape. Elevated three-quarter camera, richly layered and cozy. A broad warmly lit wooden workbench spans the middle-lower half. Keep its broad tabletop clear across the center, from x20% to85%, y55% to72%, for game objects to be composited later. Back wall full of tiny drawers, tools, brass gears, shelves with clock cases, framed faded botanical prints. Green-shaded task lamp left, a pot of tea right, winter scarf hanging near door. Large window upper right looks out to the warm cobbled village. An unlit little fireplace on left with warm reflected room light. Warm ivory walls with aged timber and terracotta details. Empty floor lower quarter for player and companion. No people, no animals, no text, no logos, no UI, no borders. Avoid floating objects and modern screens. No large clocks on the clear workbench. Full bleed painted background, consistent with reference village.
