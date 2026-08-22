# 3–4 Impostor Match Transition + Guess Correct Repair Report

Date: 2026-08-16

## Root Cause

The knockout resolver correctly stored a resolved semifinal under `matchResults[matchId]`, but `syncResolveKnockoutMatch` also published that match’s `roundResult`, `revealEndTimestamp`, `phase`, `status`, and round-transition fields at the room root. The room listener then merged those global fields into every client. As a result, a player in the unrelated semifinal could inherit a room-wide result/lock even though their own `matchId` had not resolved. This was the source of the stale `Round locked — redirecting…` behavior and the disabled `Guess Correct` action seen during live observation.

A secondary projection mismatch allowed the Results heading to read `roundResult.message` instead of the already-derived player-scoped `visibleRoundResult.message`.

## Minimal Changes

| File | Change |
|---|---|
| `src/firebase/gameSync.js` | In `syncResolveKnockoutMatch`, detect a four-player Social knockout room and preserve room-wide `phase: playing`, `status: playing`, `round`, `roundId`, timer, and empty global reveal/result fields while still writing the resolved match to `matchResults[matchId]`, updating scores, bracket, assignments, and standings. Legacy 1v1/non-knockout behavior remains unchanged. |
| `src/pages/GameResultsPage.jsx` | Use `visibleRoundResult.message` for the non-final Results heading so a player-scoped match result cannot display a stale room-wide message. |
| `knockout-bracket-contract.test.mjs` | Fixed the temporary deterministic harness import and updated its pairing expectation to the approved Player 1↔4 and Player 2↔3 bracket. |
| `todo.md` | Added the confirmed transition/Guess Correct repair checklist. |
| `MATCH_TRANSITION_REPAIR_REPORT.md` | This report. |

## Verification

| Check | Evidence |
|---|---|
| Production build | `BUILD VERIFIED` — `BUILD_EXIT=0` |
| Existing Pass 2–5 contract | `ENGINE TEST VERIFIED` — `PASS2_5_EXIT=0` |
| Protected 1v1 regression | `ENGINE TEST VERIFIED` — `PROTECTED_EXIT=0` |
| Knockout bracket contract | `ENGINE TEST VERIFIED` — `KNOCKOUT_EXIT=0` |
| Firebase rules JSON parse | `SOURCE VERIFIED` — `RULES_EXIT=0` |
| Local Vite server response | `BUILD VERIFIED` — `SERVER_HTTP=200` |
| Protected systems | `SOURCE VERIFIED` — no changes to Tournament, Team Battle, Competitive Mode, game data, or image paths. The legacy 1v1 branch in `gameSync.js` remains on its existing room-wide behavior. |

## Live Client Evidence

`FOUR-DEVICE VERIFIED` is **not claimed**. The connected desktop exposed four CDP endpoints, but only clients 9331 and 9334 were reachable during the post-patch inspection; clients 9332 and 9333 returned `TypeError: fetch failed`. The two reachable clients were both already at `/results` for room `RKWJ`, with the Results page rendering successfully. This confirms real-client runtime reachability and result rendering for those two clients, but it does not prove the required four-client independent-semifinal scenario.

The earlier observation before this repair showed the concrete failure: clients 9331 and 9334 were on the game board, both displayed `Round locked — redirecting…`, and their Guess Correct buttons were disabled while they were in different opponent views. That observation was the basis for the minimal Firebase room-root lock repair.

## Not Verified / Blocked by Environment

The following remain `NOT VERIFIED` or `BLOCKED BY ENVIRONMENT`: a clean four-client room with all four UIDs joined after the patch; independent Guess Correct submissions in both semifinals; near-simultaneous and duplicate submissions; live Firebase transaction inspection during both semifinal resolutions; refresh/disconnect/reconnect during the repaired transition; final/third-place progression in four real browsers; and deployed rules behavior against the live Firebase environment.

No new application-source issue was isolated after the patch. The deterministic contracts and build provide engine/build evidence, while the available browser evidence is partial and is not promoted to four-device verification.
