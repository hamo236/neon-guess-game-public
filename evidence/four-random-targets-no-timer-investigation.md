# Four Random Targets and No Time Left Investigation

## Scope lock

Target: Four-player tournament target assignments repeat across rooms and the Four UI/logic exposes a `TIME LEFT` countdown.

Protected: 1v1, 2v2 Team Battle, all bracket transitions, semifinal branch isolation, final/third-place progression, target privacy, scoring, Firebase identity/authorization, and existing reveal timing.

## Source evidence

- `src/context/CompetitiveModeContext.jsx:21-24` assigns Four targets using `items[(index + offset) % items.length]`.
- `src/context/CompetitiveModeContext.jsx:224-227` starts both semifinals with fixed offsets and no room-specific seed.
- `src/context/CompetitiveModeContext.jsx:241` retries a tournament with the same fixed offsets.
- `src/context/CompetitiveModeContext.jsx:274-276`, `301-302`, and `318` reconstruct targets with the same fixed offsets when resolving, advancing rounds, and starting Final/Third Place.
- `src/modes/tournamentEngine.js:4-14` defines fixed branch/round offsets: Semi A 0, Semi B 3, Final 6, Consolation 9.
- `src/modes/tournamentEngine.js:69` and `123` stamp `roundEndTimestamp: Date.now() + 60000` for Four matches.
- `src/context/CompetitiveModeContext.jsx` has an effect that resolves a Four match when `roundEndTimestamp` expires and fills missing guesses with `__timeout__`.
- `src/pages/CompetitiveModePage.jsx:14` defines `Timer` with the `TIME LEFT` label; `TournamentGameplay` renders it and disables the Four action when seconds reach zero.
- `src/modes/teamBattleTargetPlan.js:4-27` already provides a room-seeded, deterministic shuffle implementation used by 2v2. This is a reference only; 2v2 code is protected and will not be changed.

## Root cause

Four target assignment is deterministic by category, player order, match ID, and round number. It has no room-specific seed, so equivalent rooms receive the same target sequence at the same bracket/round positions.

Four also still contains an independent timeout lifecycle: engine deadlines, a context auto-resolve effect, and a UI countdown plus timeout-based button lock.

## Minimal repair decision

Add a Four-only room seed derived from the authoritative tournament room identity and creation timestamp, use the existing seeded-shuffle principle to produce targets consistently for all clients and all fallback reconstruction paths, and preserve branch/round isolation by deriving each assignment from the same room seed plus match/round context.

Remove Four `roundEndTimestamp` deadlines, the Four timeout auto-resolution path, the Four `Timer` rendering, and the Four button's `seconds === 0` lock. Preserve the five-second reveal and bracket transition timers because they are not `TIME LEFT` gameplay timers and are required for existing progression.

## Acceptance criteria

1. Equivalent rooms with the same category and player ordering do not receive the same deterministic target sequence solely because their branch/round positions match.
2. All clients reconstruct the same targets for the same room, match, and round.
3. Semi A and Semi B remain isolated; Final and Third Place remain isolated.
4. Four progresses through its existing actions, reveal, and bracket transitions without timeout auto-resolution.
5. Four renders no `TIME LEFT` or gameplay countdown.
6. 1v1 and 2v2 source behavior remains unchanged.
7. Focused tests, protected-mode tests, build, and diff checks pass.

## Verification status before edit

SOURCE VERIFIED: YES
ROOT CAUSE VERIFIED: YES
LIVE FIREBASE VERIFIED: NOT YET
FOUR-CLIENT VERIFIED: NOT YET
BUILD VERIFIED: NOT YET
TEST VERIFIED: NOT YET

NO CONSTITUTION CHANGE: the request removes an unwanted timer and changes target distribution randomness, while preserving gameplay sequence, round count, reveal, bracket, scoring, and mode boundaries.
