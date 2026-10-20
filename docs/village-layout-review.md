# Village overlap review

The lakeside and companion-discovery signs previously had centers only 90 world pixels apart, with unconstrained text and overlapping 135-pixel click targets. All twelve fixed village signs now occupy explicit 160 × 68 world-pixel areas. The lake, discoveries, festival, workbench, and courtyard approaches are spaced so every sign has a gap around it. Their walk destinations match their new positions and remain on traversable ground.

Moving villagers have smaller click targets around their bodies. Their nameplates choose a clear position beside or above them, avoiding signs, discovered-clue buttons, other names, and the scene edges. If a passing position has no clear space, the nameplate temporarily tucks away; the character, accessible name, and direct destination selector remain available. Found-clue buttons sit nearby without covering a sign. The underlying discovery locations and saved progress have not changed.

Additional checks and fixes:

- Discovery-scene signs use short location names and separate columns; full story titles remain in their accessible names and conversations.
- The makers' exhibition sign has a bounded width so it cannot cover the clickable books. Book hints align inward and do not intercept clicks.
- Shared-project, building, and apprentice labels wrap within their reserved space. Secondary text yields space in short scenes.
- The village daybook and room decorating drawer have bounded height; opening them cannot push all their controls or the room scene out of reach.
- Existing walking, routines, keyboard controls, clue unlocks, saved progress, and all learning controllers were exercised by the regression suite.

155 automated tests pass. Four layout regressions check every village sign pair across five scene scales, clue placement, hundreds of intermediate NPC positions across morning/afternoon/evening, and the exhibition/discovery spacing. JavaScript syntax, local module paths, and five local HTTP endpoints also pass. These are geometry and behavior checks: no connected browser was available for a rendered visual playthrough.
