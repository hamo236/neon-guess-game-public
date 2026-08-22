# Original 3–4 Impostor Live QA + Repair Report

## Executive status

The completed implementation was subjected to the available live Firebase and runtime checks. The local Vite server responded successfully, the deterministic four-player engine contract and protected 1v1 regression remained passing before and after the QA harness work, and the configured Firebase environment accepted anonymous authentication and real room writes for the host plus three additional anonymous Firebase UIDs.

**Four-device verification was not completed and is not claimed.** The connected browser-control environment was unavailable, and the live harness could not complete the full Firebase sequence reliably through the desktop terminal bridge. No application-source architecture repair was made during this QA phase because no confirmed application defect was isolated from a completed live client flow.

## Evidence matrix

| QA requirement | Status | Evidence and limitation |
|---|---|---|
| Firebase configuration present | `SOURCE VERIFIED` | The project contains the expected Firebase environment keys and `src/firebase/config.js` reads them. |
| Rules deployment against Firebase | `BLOCKED BY ENVIRONMENT` | The Firebase CLI is not installed on the connected desktop. `database.rules.json` parses locally, but the rules were not deployed or validated by Firebase Rules Simulator. |
| Host creates room | `LIVE FIREBASE VERIFIED` | The live harness created a real room using anonymous Firebase authentication and a generated QA room code. |
| Players 2–4 join the same room | `LIVE FIREBASE VERIFIED` | The persisted harness evidence recorded successful joins for three additional anonymous UIDs. |
| Fifth new UID rejected | `NOT VERIFIED` | The first harness run recorded the transaction as committed even though the callback returned the unchanged full room. The harness assertion was corrected to inspect authoritative post-transaction player state, but the corrected run stalled through the desktop terminal bridge before producing refreshed evidence. |
| Same-UID reconnect without duplicate | `NOT VERIFIED` | The corrected live harness did not complete far enough to persist this result. Deterministic room-service logic was inspected previously, but that is not live Firebase evidence. |
| Private target isolation | `NOT VERIFIED` | The live harness did not persist a completed result for this check. Rules were not deployed from the local `database.rules.json`, so the current server rules cannot be assumed to match the implementation. |
| Four independent actions | `NOT VERIFIED` | No completed live result was persisted. The deterministic engine/action contract remains passing locally. |
| Near-simultaneous actions | `NOT VERIFIED` | No four-client live timing test was completed. |
| Duplicate action idempotency | `ENGINE TEST VERIFIED` | The deterministic contract asserts that a second resolution attempt leaves the already-resolved state unchanged. Live Firebase action idempotency remains unverified. |
| Atomic resolution | `ENGINE TEST VERIFIED` | The deterministic contract verifies active-round resolution and duplicate-resolution protection. Live Firebase transaction behavior remains unverified. |
| Four-player results | `ENGINE TEST VERIFIED` | The deterministic contract verifies four revealed target snapshots and standings. Live Firebase result projection remains unverified. |
| Next-round target/listener update | `SOURCE VERIFIED` | The room listener now attaches the private-target subscription when an active phase is received, including a client that joined in lobby or refreshed before play. No live multi-client round transition was completed. |
| Refresh during lobby/gameplay/submission/results | `NOT VERIFIED` | No controlled browser session was available for real refresh checks. |
| Disconnect/reconnect restoration | `NOT VERIFIED` | No controlled browser session or completed live client harness sequence was available. |
| Timeout/non-submission | `ENGINE TEST VERIFIED` | Local deterministic engine behavior and idempotent round-resolution paths were tested; live Firebase timeout propagation was not. |
| Final standings contain four players | `ENGINE TEST VERIFIED` | The four-player deterministic contract verifies standings construction. |
| Browser console/Firebase errors | `BLOCKED BY ENVIRONMENT` | The desktop browser-control session was unavailable. The local terminal could confirm HTTP reachability but not inspect the browser console or rendered Firebase errors. |
| Local development server | `BUILD VERIFIED` | `http://127.0.0.1:5176/` returned HTTP 200. Ports 5173–5176 were observed listening during QA. |
| Production build | `BUILD VERIFIED` | `npm.cmd run build` completed with exit code 0 before the live-harness attempt. |
| Protected 1v1 regression | `ENGINE TEST VERIFIED` | `protected-regression.test.mjs` passed before the live-harness attempt. No application-source patch was made afterward. |

## Trace and repair record

The only failure encountered during this phase was in the temporary live-QA harness assertion for Firebase transactions. A Realtime Database transaction may report `committed: true` when its update callback returns the unchanged current value; therefore, `committed` alone cannot prove that a fifth player was added or rejected. The harness was minimally corrected to read the authoritative room after the transaction and verify that the fifth UID was absent and the player count remained four.

The corrected harness then stalled through the Windows terminal bridge before it could persist a refreshed result file. This is a QA-harness/environment execution limitation, not evidence of an application failure. No source architecture change was made in response, and the deterministic four-player and protected 1v1 contracts remained the applicable post-checks.

## Protected-system status

The following systems were kept outside the QA repair scope: **1v1 gameplay rules, Tournament, Team Battle, Competitive Mode, game data, image paths, and protected shared architecture**. The protected 1v1 deterministic regression passed. A full repository Git diff could not be used because the connected project directory is not a Git working tree; status is based on the edit operations and targeted regression coverage.

## Required next action for completion

To complete the remaining items, a user-controlled browser session or a working Firebase Rules Simulator/CLI is required. The next live run should use four independent browser profiles with the application open at `http://127.0.0.1:5176/`, plus a fifth anonymous identity, and should capture browser console output and Firebase network errors at each phase. The local `database.rules.json` must also be deployed or loaded into the Firebase Rules Simulator before treating private-target isolation and action ownership as live verified.
