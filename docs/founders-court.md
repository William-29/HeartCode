# Founders’ Court

Enter **Founders’ Court** from the village’s square marker or the **Pop over to → Visit** menu. Neighbour conversations also lead to the court. The original eight sidebar destinations remain unchanged.

## Restoring places people remember

The court is an extension of Hearthwick’s warm, painted village. Three aligned scenes show closure, work in progress, and reopening. Each building updates independently; completing a bakery project cannot repair the greenhouse. At the second stage, useful details appear through the windows. After the third project, a separate, free opening ceremony reveals the final building, a neighbour’s closing memory, a working service, and a clothing keepsake.

The stories grow from familiar neighbours:

- **Mabel’s Bakery:** Rowan brings out his mother’s recipes and gathers a team for the morning bake.
- **The Lantern Library:** Mira restores the lending desk where she borrowed her first clock-repair book.
- **June’s Glasshouse:** Elio brings his aunt’s seedlings and notebooks back to a shared nursery.

Their existing village conversations acknowledge the restoration. A notebook in the court collects the memories revealed so far. The opening story stays hidden until the building actually opens.

| Building | First project | Second project | Final project |
| --- | --- | --- | --- |
| Bakery | Flour calculation, after 2 trail quests | Scaled recipe shopping list, after 12 | Multi-batch oven scheduler, after 28 |
| Library | Recover and clean titles, after 4 | Search available books, after 12 | Lending transactions with waiting lists, after 28 |
| Glasshouse | Replacement glass calculation, after 2 | Missing-data-aware watering ledger, after 10 | Nearest-neighbour classifier with a label summary, after 24 |

Each project also requires the previous repair for that building. Every project has a lesson, starter code, hint, worked solution, and real Python checks with changed inputs. The last projects require multiple processing steps and preserve their original inputs.

Each first completion awards 180 / 250 / 320 XP and 90 / 125 / 160 coins according to stage. Replays save revised code without repeat rewards. Restoration contributes to the normal learning-day streak and eligible existing achievements, without completing trail quests.

The reopened buildings have working services powered by the saved code. The glasshouse also offers a held-out evaluation: its example classifier gets 3 of 4 cases right, giving a concrete reason to discuss limited features and representative training data rather than presenting correct code as a perfect model.

## The makers’ exhibition

Six places on the square’s wooden tables hold finished creations. The exhibition catalogue includes:

- The six original neighbour projects, including the playable guessing game.
- The ten High Street creations.
- The nine restoration projects.

Initially the first available creations fill the tables. The player can put them away and choose a personal display. Emptying the exhibition is a persistent choice; removed works remain in the catalogue. Clicking a displayed creation runs it. Original games retain their existing playable controls; new tools expose editable inputs, actual Python results, and the source the player saved.

Unfinished projects and projects without saved code cannot be exhibited. Revisiting or running an exhibit never grants repeat rewards.

## Clothing earned through the adventure

Open **Your wardrobe** from the room header, click your character in the room, or follow the link from Founders’ Court.

The wardrobe has four independently selectable categories and 12 choices:

| Category | Choice | How it is earned |
| --- | --- | --- |
| Hair & hats | Familiar tweed cap | Already owned |
| Hair & hats | Loose chestnut waves | Complete 4 trail quests |
| Hair & hats | Gardener’s braid | Elio’s first village project |
| Outfits | Rust traveller’s coat | Already owned |
| Outfits | June’s moss cardigan | Reopen the glasshouse |
| Outfits | Mabel’s indigo apron | Reopen the bakery |
| Scarves | Open collar | Already owned |
| Scarves | Oatmeal scarf | Already owned |
| Scarves | Rowan’s hearth scarf | Both Rowan projects |
| Scarves | Leaf-stitched sage scarf | Both Elio projects |
| Keepsakes | Plain lapel | Already owned |
| Keepsakes | Brass library swallow | Reopen the library |

There are no cosmetic purchases or stat bonuses. The unlocked pieces have named origins and are fitted to the existing adventurer’s painted proportions. The chosen look appears in the village, quest map, room, café, courtyard, and player portrait. NPC artwork is preserved.

See [the artwork record](restoration-artwork.md) for the source assets, final ImageGen prompts, and [the fitting preview](wardrobe-registration.png). The preview is generated from the live layer coordinates; it is not a browser screenshot.

## Saves and verification

The existing save format gains `restoration` and `wardrobe` fields. Older saves receive safe defaults while retaining coins, lessons, pets, room arrangements, and High Street progress. Imports enforce sequential building stages, validate exhibition ownership, and replace unavailable clothing with the default choice.

Tests cover real Python reference solutions and common mistakes; progression and duplicate rewards; the opening ceremony; clothing gates; catalogue ownership and six display places; valid input handling and text-as-data; held-out evaluation; save migration; DOM-adapter flows; cancellation and late results; all player rendering locations; and source atlas bounds.

The clothing registration sheet was visually inspected. Full browser layout, pointer interaction, and hosted Pyodide execution were not visually verified because the session had no enabled browser preview surface. Local HTTP checks and module checks remain part of verification.
