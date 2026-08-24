# Animals Category — Research and Integration Preparation

## Scope

Add one new Animals category using the same canonical category metadata, item schema, local-image resolver, target selector, lobby selector, rematch selector, and mode propagation already used by the existing categories. The intended change is additive. No gameplay rules, timers, scoring, bracket behavior, Firebase rules, room schema, or visual layout redesign is authorized.

## Repository evidence

The canonical source of truth is `src/data/gameData.js`.

- `CATEGORIES` currently contains `cartoons`, `football`, and `sports`.
- `CATEGORY_META` is the shared category-card/select metadata consumed by the lobby and category controls.
- Each category metadata entry has `id`, `label`, `icon`, and a representative absolute public image path.
- `ALL_ITEMS` is the shared target dataset. Each item has `id`, `name`, `category`, and `image`.
- `resolveImages` and `resolveItemImages` prepend Vite's configured `BASE_URL`, which is required for GitHub Pages.
- `getItemsByCategory(category)` feeds the target selector.
- `src/game/targetSelector.js` selects unique targets by category and therefore should require no algorithm change if Animals has enough valid items.

The shared UI enumerates `Object.values(CATEGORY_META)` or `Object.entries(actions.CATEGORY_META)` in the relevant lobby and post-results surfaces. This means a correctly added canonical category should appear in 1v1, 2v2, Four-player lobby selection, and Four-player retry selection without separate mode-specific category lists.

`src/pages/LobbyPage.jsx` contains both the 1v1 select and the shared category-card controls. `src/pages/CompetitiveModePage.jsx` consumes the same category metadata through the competitive lobby/result flow. `src/pages/GameResultsPage.jsx` contains a presentation label list that must be inspected and updated only if it is user-visible and currently hardcoded. `src/pages/HowToPlayPage.jsx` also contains a hardcoded explanatory category list and may need a matching additive entry so documentation does not omit Animals.

## Current asset contract

Existing images are local files under `public/images/<category>/...jpg`, referenced from source as `/images/<category>/<filename>.jpg`. The built app resolves them through `import.meta.env.BASE_URL`. Animals should use a new directory such as `public/images/animals/` only if the supplied screenshots/assets are confirmed to be individual image files suitable for the existing contract. No remote URLs, Firebase Storage records, base64 blobs, or new asset pipeline should be introduced.

## Protected systems

- 1v1 gameplay and room lifecycle: protected; only shared category enumeration may receive the additive category.
- 2v2 Team Battle gameplay, target plan, synchronization, and UI behavior: protected; no mode-specific logic changes.
- Four-player tournament bracket, match/round isolation, private targets, scoring, timers, and transitions: protected; only the category data path may expand.
- Firebase schema, reads/writes, listeners, and rules: protected; no change is expected.
- Existing category IDs, item IDs, image paths, labels, and visual classes: protected; do not rename or reorder existing data.
- Existing layouts and styling: protected; the new option must use existing rendering and classes.

## Expected minimal implementation surface after screenshots are supplied

1. Add `CATEGORIES.ANIMALS` and one `CATEGORY_META` entry in `src/data/gameData.js`.
2. Add one item entry per supplied animal to `ALL_ITEMS`, with unique stable IDs and local image paths.
3. Copy/normalize supplied assets into `public/images/animals/` only after inspecting their filenames, dimensions, formats, and count.
4. Update only hardcoded user-facing category documentation or label lists that would otherwise omit Animals; first confirm each occurrence is a display list rather than a gameplay rule.
5. Update image-path and item-count tests only to reflect the verified asset count, preserving the tests' intent and the existing base-path resolver.
6. Run source, image-path, build, smoke, Team Battle, target-selector, and protected-mode regression checks.

## Asset-dependent open questions

- Exact number of animals.
- Exact animal names and spelling/capitalization.
- Whether screenshots show one animal per image or contact sheets containing multiple animals.
- Whether files are already present in the connected computer or need to be extracted from screenshots.
- File formats, dimensions, orientation, crop consistency, transparency, and image quality.
- Whether any screenshot contains copyrighted watermarks, duplicate animals, unreadable labels, or ambiguous species.
- Desired category label: likely `Animals`, pending confirmation from the supplied visual assets and project naming style.
- Desired category icon: must reuse an existing Material Symbols icon unless the repository already defines a more appropriate one; no new visual system is needed.

## Safety contract

Feature: add Animals as a fourth target category.

Purpose: let users select Animals in 1v1, 2v2, and Four-player using the existing category flow.

Direct impact: canonical game data, local assets, and any hardcoded user-facing category documentation.

Indirect impact: shared lobby enumeration, target selection, Four-player retry category selector, and result/help labels through existing data consumers.

Firebase impact: none expected.

State impact: category values may include `animals`; existing state shape remains unchanged.

Gameplay impact: no algorithm change; `getItemsByCategory` and existing target assignment should handle the new category.

Main risks: broken GitHub Pages paths, mismatched item IDs, too few unique animals for concurrent targets, accidental hardcoded category validation, and updating a gameplay allowlist instead of a display list.

Rollback: remove only the Animals metadata/items/assets and revert any additive display-list/test-count changes; preserve all existing category data and logic.

Verification: source contract, asset existence, base-path build, target-selector uniqueness, 1v1/2v2/Four category enumeration, smoke/build/regression suites, and public bundle image-path checks.

Status: preparation complete; implementation is intentionally blocked until the animal screenshots/assets are supplied and inspected.
