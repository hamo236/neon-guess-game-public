# NEON GUESS — 2v2 Team Battle Release-QA Report

**Audit date:** 19 August 2026  
**Scope:** 2v2 Team Battle release guard, adjacent Tournament regression, local runtime verification, transaction safety, target privacy, synchronized confirmations, and route recovery.

## Executive decision

> **CONDITIONAL READY — staging verification required before production release.**

The deterministic logic, UI contracts, Firebase adapter contracts, smoke checks, Tournament regression checks, production build, and local route mounts all pass. The remaining release gate is a real Firebase staging run with four independent clients. Local runtime verification correctly reports **Firebase not configured**, so it cannot prove cross-device persistence, security-rule enforcement, reconnect recovery, or four-player round synchronization.

## Repairs completed in this release-QA pass

| Area | Defect/risk | Repair | Evidence |
|---|---|---|---|
| Team Battle lobby removal | A stale or uncommitted `runTransaction` could be treated as a successful removal, creating host-start races and inconsistent lobby membership. | Capture the transaction result and require `result.committed` plus confirmation that the player is absent before resolving success. | `src/firebase/competitiveFirebase.js`; 6 repair contracts pass |
| Team Battle leave | A stale client could report a successful leave after the room changed underneath it. | Capture the transaction result and reject uncommitted/stale removals with a controlled error. | `src/firebase/competitiveFirebase.js`; adapter contract pass |
| Route recovery | The error boundary could retain an error screen after navigation to a healthy route. | Pass `location.pathname` as the boundary reset key and clear the error on key change. | `src/App.jsx`; live Team Battle and Tournament routes mount |
| QA harness | The new repair-contract script initially selected its source file using a fragile regex-name heuristic. | Make every assertion explicitly bind to its intended source (`competitiveFirebase.js` or `App.jsx`). | `scripts/qa-problem-repair.mjs`; repair QA passes |

## Automated verification evidence

The following command sequence was run against a synchronized Linux verification copy of the working tree:

```text
node scripts/qa-problem-repair.mjs
node scripts/qa-team-battle-ui.mjs
node scripts/qa-team-battle-engine.mjs
node scripts/qa-smoke.mjs
node /home/ubuntu/tournament-regression.mjs
npm run build
```

Results:

| Check | Result |
|---|---|
| Repair contracts | PASS — 6 contracts |
| Team Battle UI/adapter contracts | PASS — gameplay wiring, owner-only confirmation, atomic cleanup, hierarchy, touch targets |
| Team Battle privacy/engine contracts | PASS — shared hidden targets, owner-only confirmations, two-player gate, single confirmation owner, reset |
| General smoke checks | PASS — invite, timeline, rematch, host guards, gameplay async guards, recovery projection, competitive guards, daily drop, dead-link contracts |
| Tournament regression | PASS — independent semifinals, authoritative bracket transition, paired next matches |
| Production build | PASS — Vite build completed successfully |

The production build emitted two non-blocking warnings: Firebase database code is both statically and dynamically imported, and the main bundle remains above the 500 kB advisory threshold. These are performance follow-ups, not release-blocking correctness failures for this audit.

## Live local-runtime verification

A fresh Vite runtime was started on `http://localhost:4178` using the repaired source. The following routes were opened:

| Route | Observation |
|---|---|
| `/team-battle` | Mounted successfully. Lobby displayed `2v2 TEAM BATTLE`, player-name input, category selector, room-code input, Create Room, and Join Room controls. No uncaught exception appeared in the browser console. Clicking Create Room correctly surfaced `Firebase not configured` in local-engine mode rather than crashing. |
| `/tournament` | Mounted successfully with its independent `4-PLAYER TOURNAMENT` lobby. No uncaught exception appeared in the browser console. |

The only console warnings were expected React Router future-flag notices and the expected local-mode Firebase configuration notice.

## Protected gameplay rules verified

The release contracts continue to enforce the required game model:

1. **Team assignment:** Team A is players 1–2 by authoritative join order; Team B is players 3–4.
2. **Shared targets:** Each opposing team sees/owns one shared target relationship through the authoritative state model; a player does not receive the target they are meant to guess.
3. **Privacy:** Target data is scoped to the owning player/team path and is not exposed as a public room field.
4. **Two-player confirmation gate:** A round transition requires confirmations from both teammates of the team that is validating the opponent’s successful guess.
5. **Authoritative progression:** Confirmation, scoring, round advancement, and cleanup are persisted through Firebase state transitions rather than UI-only state.
6. **Snapshot reveal:** The completed round snapshot remains available for the configured five-second reveal before progression.
7. **Recovery:** Reconnect/auto-rejoin state and connection-status UX remain covered by the existing recovery contracts.
8. **Regression boundary:** Tournament behavior remains covered by independent-semifinal and authoritative-bracket regression tests; 1v1-related smoke contracts remain passing.

## Required staging gate before production

Deploy the current source and rules to a non-production Firebase project, then run a four-client matrix using separate browser profiles/devices:

| Scenario | Required observation |
|---|---|
| Create and join | Host creates a room, copies a real room code, and three independent clients join using that code. All four players appear in the correct lobby slots. |
| Team switch race | Two clients attempt simultaneous team switches. The resulting membership is authoritative, capacity-safe, and identical across all clients. |
| Start race | Host presses Start while another client joins/leaves. Start succeeds only with four valid players and cannot resurrect a removed/stale player. |
| Privacy | Each client inspects its rendered state and Firebase-readable paths. No player can read the target assigned to the team they must guess. |
| Confirmation gate | One validator confirms: round does not advance. The second validator confirms: the authoritative round transition occurs once on every client. |
| Stale reconnect | Disconnect a client during confirmation or transition, reconnect it, and verify it rejoins the current room/round without replaying an old confirmation. |
| Snapshot and score | Confirm the five-second snapshot, score update, round increment, and reset are identical across all four clients. |
| Tournament smoke | Run a four-player Tournament room after the Team Battle run and verify that semifinal and bracket state remain independent. |
| Rules audit | Use Firebase Emulator or staging rules evaluation to confirm public-room access is limited to intended fields and private-target paths are player-scoped. |

## Final status

**Status: CONDITIONAL READY.** No additional local code repair was required after the final contract and runtime checks. Promote to **READY** only after the staging matrix above passes with captured evidence from four independent clients and the deployed `database.rules.json`.

## Files changed or added in this audit

- `src/firebase/competitiveFirebase.js` — transaction-result guards for Team Battle removal/leave.
- `src/App.jsx` — navigation-aware `RouteErrorBoundary` reset behavior.
- `scripts/qa-problem-repair.mjs` — explicit source-bound repair contracts.
- `RELEASE_QA_2V2_TEAM_BATTLE.md` — this report.

No GitHub operation or repository publication was performed.
