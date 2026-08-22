# 2v2 Team Battle MVP Safety Contract

## Research Evidence

Repository evidence shows that NEON GUESS already contains a real isolated 2v2 path: `CompetitiveModeContext.jsx` owns room creation/joining, Firebase subscriptions, host-only start and round resolution; `teamBattleEngine.js` enforces exactly four players, creates two teams of two, accumulates team/player scores across three rounds, and produces a final result; `competitiveFirebase.js` isolates the `team_battle` namespace under `teamRooms`, caps rooms at four players, and stores targets under per-player private paths.

The current 2v2 lobby projection in `CompetitiveModePage.jsx` shows a count and a flat player list, but does not make the two-team/two-player structure visible before the match starts. The attached implementation brief explicitly requires clear team slots, player slots, team assignment, room status, and host controls.

## Inference

The missing team-slot preview is a user-understanding gap, not an absent multiplayer engine. Adding a local deterministic projection of the current four-player order improves clarity without creating a second team assignment source. It must not write or infer authoritative team membership during the lobby; the existing engine remains the authority when `startMode` creates `teams`.

## Recommendation

Implement a bounded UI-only 2v2 lobby preview with two labeled team cards, two slots per team, connected/offline status, and a short explanation that final assignment is locked when the host starts. Reuse the current lobby `players` array only for preview ordering and leave all provider, engine, Firebase, target, scoring, and round code unchanged.

## Scope Lock

| Area | Decision |
|---|---|
| Feature | 2v2 team-slot clarity in the isolated Team Battle lobby |
| Files allowed to change | `src/pages/CompetitiveModePage.jsx`, focused smoke contract, this report/retrospective |
| Direct impact | Competitive lobby UI projection only |
| Protected systems | `CompetitiveModeContext`, `teamBattleEngine`, `competitiveFirebase`, legacy `GameStateContext`, 1v1, Social, Tournament, scoring, target privacy, Firebase paths |
| Data affected | None; no Firebase writes or schema changes |
| Authority | Existing `createTeamBattleState` assignment remains authoritative |
| Rollback | Revert the preview component and its render call |
| Stop condition | Any need to modify team assignment, Firebase schema, or gameplay rules stops this bounded pass |

## Verification Plan

Run `npm.cmd test`, inspect the diff for protected-file changes, start Vite and probe `/team-battle`, and record that Firebase/multi-client behavior remains source-protected but not live-verified in this pass.
