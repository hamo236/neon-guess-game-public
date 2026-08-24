# Animals Category Removal — Final Status

## Requested removals

Removed only these three Animals entries and their local image assets:

| Name | ID | Image |
|---|---|---|
| Leopard | a13 | `/images/animals/leopard.jpg` |
| Ostrich | a18 | `/images/animals/ostrich.jpg` |
| Rhinoceros | a21 | `/images/animals/rhino-wild.jpg` |

## Source and asset evidence

The canonical records were removed from `src/data/gameData.js`. The three corresponding files were deleted from `public/images/animals/`. A repository-wide search across `src`, `public`, and `scripts` found no remaining name or asset-path references.

The Animals catalog now contains 25 items and the complete catalog contains 93 items. All 93 IDs remain unique, and all remaining image paths remain unique.

## Verification

- Absence check for `Ostrich`, `Leopard`, `Rhinoceros`, and `rhino-wild`: PASS.
- Catalog check: PASS — 25 Animals, 93 total items, 93 unique IDs.
- Image-path regression: PASS — 97 source paths (93 item images plus 4 category-card images).
- Smoke QA: PASS.
- Team Battle flow, UI/adapter, and target freshness QA: PASS across all four categories.
- Production build: PASS.
- `git diff --check`: PASS.

The regression baselines were updated only to reflect the intentional catalog count change: `scripts/check-image-paths.mjs` now expects 97 image paths, and `scripts/qa-team-battle-target-freshness.mjs` now expects 25 Animals. No gameplay implementation was changed.

## Protected scope

No Firebase rules, room schema, target-selection algorithm, timers, scoring, bracket progression, navigation logic, or 1v1/2v2 gameplay files were changed. The diff is limited to the three requested image deletions, three canonical data-record deletions, and two exact-count regression baselines.

## Release status

Local source and production build are verified. The remaining step is to commit, push, wait for the Pages workflow, and confirm the public category no longer contains the three removed items.
