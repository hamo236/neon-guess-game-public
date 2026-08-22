# Incident: 2v2 copied room code rejected

## Observed symptom

A second, third, or fourth player pastes the host’s copied 2v2 code and receives `Room is missing, full, closed, or no longer accepting new players.`

## Confirmed source findings

The competitive Firebase adapter referenced `db`, `ref`, `onDisconnect`, `onValue`, `remove`, and `update` without importing the active `db` from `src/firebase/config.js` and without importing the modular database functions. This made the 2v2 adapter’s room reference and join path unreliable at runtime.

The working 1v1 room service uses the shared `src/firebase/database.js` exports, performs a pre-read with `get(roomRef)`, normalizes the code to uppercase, distinguishes not-found/full/in-progress/reconnect cases, and then performs a guarded transaction. The 2v2 adapter previously used only a transaction and collapsed all failed conditions into one generic message.

The 2v2 provider does normalize the submitted code to uppercase and uses the `team_battle` mode key. The adapter maps that key to the `teamRooms` namespace, so host and join callers are intended to use the same path. The UI join field is visible and passes the entered value to `actions.joinRoom`.

## Applied repair

The adapter now imports the Firebase database instance and all modular functions it uses. Its join path now normalizes and validates the exact code, reads the room before the transaction, supports identity-preserving reconnects, admits only new players while `status` and `phase` are both `lobby`, calculates `joinOrder`, and returns truthful errors for missing, full, started, removed, or race-conflict conditions.

## Protected boundaries

No Firebase schema root, team assignment, target assignment, scoring, round transition, or 1v1 room service code was changed. The 2v2 namespace remains `teamRooms/{ROOM_CODE}` and the tournament namespace remains `tournamentRooms/{ROOM_CODE}`.
