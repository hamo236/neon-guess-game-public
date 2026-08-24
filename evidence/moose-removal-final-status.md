# Moose Removal — Final Status

## Requested change

Removed only the Moose item from the Animals category:

| Name | ID | Removed image |
|---|---|---|
| Moose | `a17` | `public/images/animals/moose.jpg` |

The canonical record was removed from `src/data/gameData.js`, and the corresponding image asset was deleted. A repository-wide search across `src`, `public`, and `scripts` found no remaining `Moose` or `moose` references.

## Resulting catalog

The Animals category now contains 24 items, and the complete catalog contains 92 game items. Existing category IDs, ordering around the remaining records, and all other animal assets are unchanged.

## Verification

- Moose absence check: PASS.
- Exact image-path check: PASS — 96 paths (92 item images plus 4 category-card images).
- Catalog and target freshness checks: PASS — Animals count 24; all four categories covered; room-scoped sequences remain deterministic and privacy-compatible.
- Smoke QA: PASS.
- Team Battle flow/UI/target freshness QA: PASS.
- Production build: PASS.
- `git diff --check`: PASS.

The two exact-count regression baselines were updated only for the intentional deletion: image paths 97 to 96 and Animals 25 to 24. The checks remain exact-count guards.

## Protected scope

No Firebase rules, room schema, target-selection algorithm, timers, scoring, bracket progression, navigation logic, or gameplay code was changed. No 1v1 or 2v2 behavior was changed. The implementation diff is limited to the Moose record, Moose image, two exact-count baselines, and this evidence record.

## Release status

Local verification is complete. The change is ready to commit, push, deploy to GitHub Pages, and verify publicly.
