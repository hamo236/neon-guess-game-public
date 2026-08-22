# Engineering Task: Remove Nico Schlotterbeck from the Football Catalog

## Context
NEON GUESS uses `src/data/gameData.js` as the source of truth for target catalog entries and serves local images from `public/images`. The requested change is limited to one football player.

## User-Reported Problem
The user requested permanent removal of Nico Schlotterbeck because the name is too difficult to recall and negatively affects game difficulty. The user specified that the player must not appear in guesses and that only this player should be removed.

## Observed Behavior
Source inspection found exactly one catalog entry: `id: 'f27'`, name `Nico Schlotterbeck`, image `/images/football/nico-schlotterbeck.jpg`. Exactly one matching image file existed in `public/images/football`.

## Expected Behavior
The player, image file, and any direct project references must be absent. All other catalog entries, category counts, image resolver behavior, and gameplay systems must remain intact.

## Investigation Findings
- The player entry was in `src/data/gameData.js` at the f27 position between f26 and f28.
- The corresponding image was `public/images/football/nico-schlotterbeck.jpg`.
- No additional references remained after the targeted deletion.
- Neighboring entries f26 and f28 remain present.

## Root Cause
This is a requested content deletion, not a runtime defect. The source catalog and static image asset were the only confirmed production references.

## Implementation Requirements
Remove only the f27 catalog line and the matching image file. Update deterministic catalog-count assertions from 29 to 28 football items and add a regression test proving the removed name, slug, and ID do not return.

## Constraints
Do not alter target selection algorithms, round progression, scoring, Firebase state, synchronization, authentication, routing, image resolver behavior, or unrelated catalog entries.

## Verification Requirements
Run the removed-player regression, image-path source and built checks, production build, Team Battle QA chain, and `git diff --check`. Confirm f26/f28 remain and the final diff contains only the scoped data, asset, assertion, and regression-test changes.

## Regression Checks
The expected catalog counts are 28 football, 19 sports, and 21 cartoons. The total image-path source count is 71 including category metadata. Team Battle target freshness and the protected 3-round flow must pass.
