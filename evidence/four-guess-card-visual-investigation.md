# Four Guess Card Visual Investigation

## Scope

The user reported that Guess Card is still visible in Four after prior source/build verification. The active repository is `/home/ubuntu/neon_guess_publish`, remote `hamo236/neon-guess-game-public`, branch `main`, commit `500d7ce`.

## Confirmed route split

The classic Four/social flow is rendered by `GameBoardPage.jsx` through `/game` when `mode === GAME_MODES.SOCIAL && players.length > 2`. That component has a natural target branch and does not render `GuessGrid`.

The actual `/tournament` route is different: `App.jsx` routes `/tournament` to `TournamentPage.jsx`; `TournamentPage.jsx` wraps `CompetitiveModePage.jsx` with `COMPETITIVE_MODES.TOURNAMENT`; `CompetitiveModePage.jsx` renders `TournamentBoard`, which renders `TournamentGameplay` for a playing tournament match.

## Confirmed visual root cause

`CompetitiveModePage.jsx` still defines `GuessGrid` and `TournamentGameplay` still invokes it:

- `GuessGrid` renders `.ng-choice-grid` with a grid of item buttons, each containing an image and item name.
- `TournamentGameplay` renders the instruction `Find the target ... is protecting.` followed by `<GuessGrid items={items} ... />`.
- The same component tells the player: `Choose one card. The synchronized timer resolves the match for every player.`

This is a real user-visible multi-card Guess Card/grid in the Tournament Four route, not merely stale database data or a hidden CSS artifact.

## Why the previous verification missed it

The prior focused regression test inspected only `GameBoardPage.jsx` and proved that the classic social branch did not contain `GuessGrid`. It did not inspect `CompetitiveModePage.jsx`, which is the route used by the visible `4-PLAYER TOURNAMENT` screen at `/tournament`.

The earlier negative scan also failed correctly by finding `GuessGrid` in `src/pages/CompetitiveModePage.jsx`; that failure was not a false positive. It was evidence of the remaining production path.

## Visual runtime evidence

The local browser loaded `/neon-guess-game-public/tournament` and displayed the live `4-PLAYER TOURNAMENT` lobby with room creation and room code 500. The in-match visual state could not be reached with one browser client because TournamentGameplay requires a live four-player match. Therefore the exact four-client screenshot is `NOT VERIFIED`, but the component rendered by that route contains the unconditional playing-state GuessGrid call, which is `SOURCE VERIFIED` and is sufficient to confirm the defect.

## Status

Guess Card is **CONFIRMED PRESENT** in the current Tournament/Four gameplay route. The previous claim that Four was fully clear was too broad because it audited the wrong Four entrypoint. No database deletion can remove this UI: the card is constructed directly from `getItemsByCategory(state.category)` in the React render path.

## Protected behavior for a repair

A repair must remove the item-selection GuessGrid and timer-driven card-choice flow from TournamentGameplay, then render exactly one assigned opponent target and a `Guess Correct` confirmation action, while preserving semifinal/final/consolation match isolation, three-round progression, reveal behavior, scoring, Firebase authority, privacy, and voice-room match scoping.

Evidence labels: source route = SOURCE VERIFIED; GuessGrid invocation = SOURCE VERIFIED; local tournament lobby = RUNTIME VERIFIED; four-client in-match screenshot = NOT VERIFIED; live Firebase gameplay = NOT VERIFIED.
