# A more connected Hearthwick

The wardrobe belongs upstairs. **Your room / Wardrobe** tabs, the room character's **Change your look** label, and the sidebar portrait all open it immediately, including on a fresh save. Clothing remains earned through the existing milestones. Founders' Court now leads back to the lane rather than presenting the wardrobe as a courtyard activity.

The header's **Nearby** signpost changes with your location: apprentices beside the tavern, discoveries beside companions, the morning round beside restoration, and the wardrobe beside the room. Parent places stay highlighted in the main navigation. The eight main navigation entries remain unchanged. Page arrivals use a short fade and respect both motion preferences.

The exhibition now includes thirteen more saved creations: the shared morning tools, lake analysis, repaired clocks, and companion discoveries. Choose **Try it** to visit the working creation in its own place, run your actual saved Python, and return to the exhibition. First completion also offers a route to the exhibition. Apprentice conversations remain conversations rather than display objects. Six-table curation and version-1 save compatibility are preserved.

## Bugs addressed

- Side activity saves update the level label without overwriting the player portrait.
- Results from an older editor cannot alter a newly opened editor, including a reopened copy of the same quest.
- Navigation closes open stories and cancels their Python; queued close events cannot clear a newly opened side activity.
- Running or stopping code restores each control's prior disabled state, preserving milestone and mechanism locks.
- All side-project editors support Shift+Tab or Escape then Tab to leave, matching the main editor. Escape first releases editor focus without closing the lesson.
- Worker startup/message errors produce a recoverable response instead of leaving Run stuck.
- The skip link moves focus into the current activity instead of navigating to an unknown route.
- Import accepts valid larger adventures with accumulated drafts, up to 20 MiB, while retaining normalization and draft limits.

## Verification

151 automated tests pass, including real Python project checks, movement/pathfinding, saves, rewards, editor cancellation, exhibition handoffs, wardrobe access, audio lifecycle, and the new regressions. Local HTTP checks passed for the page and six runtime/style/module endpoints; local imports and literal artwork paths resolve. No connected browser was available for a visual, keyboard, or audio playthrough. The DOM adapters test behavior, not rendered layout.
