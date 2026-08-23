# NEON GUESS — Four/Tournament Natural Guess Release Report

## Executive conclusion

The live Four/Tournament route previously rendered `GuessGrid`. The repair was applied to the actual route used by `/tournament`, not only to the legacy social Four route. `TournamentGameplay` now renders one assigned opponent target and a single `{opponent} · GUESS CORRECT` action. The card-selection surface and its explanatory copy were removed from that live component.

## Root cause

The previous verification covered `GameBoardPage.jsx`, while `/tournament` is routed through `TournamentPage.jsx` into `CompetitiveModePage.jsx`. The actual Tournament gameplay component contained a direct `GuessGrid` invocation and the `GUESS BOARD` / `Choose one card` copy. Database deletion could not remove the visual because the cards were generated at render time from `getItemsByCategory`.

## Implementation

`src/pages/CompetitiveModePage.jsx` was changed so `TournamentGameplay`:

- no longer computes a selectable item grid;
- no longer renders `GuessGrid`, `GUESS BOARD`, or `Choose one card`;
- renders `TargetCard` with `mode="opponent"`;
- shows the assigned opponent target only;
- uses one `GUESS CORRECT` button;
- submits the projected opponent target through the existing authoritative `actions.recordGuess` action;
- preserves match labels, timer, scores, round locking, match resolution, transition, final, consolation, and voice-host structure.

`src/context/CompetitiveModeContext.jsx` was changed so the private Tournament target projection gives each player the opponent's target, while retaining `targetOwnerId`. This keeps the target private to the match participant and prevents exposing the player's own protected target as the visible target.

## Evidence gates

| Gate | Result |
|---|---|
| Actual `/tournament` route identified | PASS |
| Focused Tournament natural-flow regression | PASS |
| Existing legacy Four natural-flow regression | PASS |
| Full `npm test` smoke suite | PASS |
| Production `npm run build` | PASS |
| `git diff --check` | PASS |
| Built `CompetitiveModePage` chunk contains `GuessGrid` / `GUESS BOARD` / `Choose one card` markers | PASS — no markers found |
| Local application route loads after repair | PASS |
| Four-player live match with four independent clients | NOT RUN in this sandbox |
| GitHub Pages deployment for commit `cff4678` | IN PROGRESS at last check |

## Regression guard added

`scripts/tournament-natural-guess-flow.test.mjs` now checks the actual Tournament gameplay block and fails if any of these return:

- `GuessGrid`;
- `GUESS BOARD`;
- `Choose one card`;
- a missing opponent-mode TargetCard;
- a missing `GUESS CORRECT` action;
- a missing opponent-target private projection.

## Release decision

**Code and built-bundle status: READY for the requested UI correction.**

**Production status: CONDITIONAL until GitHub Pages completes deployment and a real Four room is tested with four independent clients.** The code-level and bundle-level proof is complete; the remaining operational proof is the end-to-end live match check, because a single browser session cannot simulate four independent Firebase identities reliably.

## Commit

`cff4678 fix tournament natural guess flow`

Repository: https://github.com/hamo236/neon-guess-game-public
