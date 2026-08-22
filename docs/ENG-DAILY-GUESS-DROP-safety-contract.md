# Daily Guess Drop — Safety Contract

## Scope

This MVP adds an isolated daily challenge route at `/daily`. It reuses the existing `ALL_ITEMS` dataset but does not enter the room lifecycle or call Firebase.

## Protected systems

The following systems are explicitly out of scope and must not be changed by this feature: Firebase room data, player identity, host authority, scores in multiplayer rooms, round transitions, rematch behavior, session recovery, tournament namespaces, and team-battle namespaces.

## Data ownership

The daily challenge is deterministic from the UTC calendar date and the local dataset. Completion is stored only in browser `localStorage` under a versioned key. The UI must state that the result is device-only and does not affect multiplayer rooms or rankings.

## Behavioral invariants

The same UTC date must produce the same challenge ordering for a given application dataset. A completed challenge for the current date must not be replayable through the normal route. The final answer must be included in the saved score even though React state updates are asynchronous. Sharing must never claim success when neither Web Share nor clipboard fallback is available.

## Failure boundaries

If browser storage is unavailable, the challenge remains playable in memory and the user must not be told that persistence succeeded. If sharing fails, a truthful unavailable message is shown. No failure in the daily route may navigate into `/game`, mutate `GameStateContext`, or write to Firebase.

## Verification requirements

The smoke contract must assert the route, Lobby entry point, deterministic date selection, device-only persistence language, non-authoritative boundary language, and final-answer scoring expression. A production build and a browser interaction pass remain required before the feature can be marked READY.
