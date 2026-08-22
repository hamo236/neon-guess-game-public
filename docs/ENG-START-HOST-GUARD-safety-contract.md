# Safety Contract: Host-Authoritative Start Game

## User outcome
Prevent a non-host Firebase client from starting a room through a direct or stale UI action, while preserving the existing host start flow.

## Confirmed repository evidence
`GameStateContext.jsx` guards `beginRound` and `resetMatch` with `isHost`, but `startGame` currently calls `engineEnterPreview`, dispatches `START_GAME`, and writes `syncEnterPreview` without the equivalent Firebase host guard. `LobbyPage.jsx` disables Start Game for non-host clients, but UI gating is not an authority boundary.

## Minimal implementation
Add the same host-authority guard to the `startGame` action. For Firebase rooms, a non-host call throws a clear error and performs no local dispatch and no Firebase write. Local-only mode remains unchanged.

## Files allowed to change
- `src/context/GameStateContext.jsx`: startGame guard only.
- `src/pages/LobbyPage.jsx`: only if required to surface the error; expected to remain unchanged because its existing start handler already catches errors.
- `scripts/qa-smoke.mjs`: add a source contract assertion for the guarded start action.
- This contract and a final report.

## Protected systems
Game engine phase transitions, Firebase room schema, room/match/round identifiers, target assignment, scoring, listeners, host migration, authentication, navigation, and all existing 1v1/social/tournament gameplay behavior.

## Authority and invariants
Firebase room state is authoritative. Only the host may initiate the preview transition in a configured Firebase room. A rejected non-host call must not dispatch local `START_GAME`, must not call `syncEnterPreview`, and must not create a second source of truth. Local-only mode retains existing behavior.

## Acceptance
Source inspection confirms the guard runs before engine transition, dispatch, and sync. Smoke test confirms the guard contract remains present. Existing invite, timeline, rematch, dead-link, and host-reset checks still pass. Build and live multiplayer verification are reported separately and never inferred from source checks.

## Rollback
Remove the guard and its smoke assertion only if evidence shows the authority model intentionally changed. No schema migration or data cleanup is required.
