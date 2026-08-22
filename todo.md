# Approved 3–4 Impostor Implementation Checklist

- [x] Pass 1: implement Firebase-UID identity, authoritative player records, transaction-safe four-player capacity, reconnect identity, and late/fifth-player rejection.
- [x] Pass 1: run focused identity/capacity tests, typecheck, build, and protected-system diff checks.
- [x] Pass 2: implement round-aware state, private target delivery, stale-state guards, and stable-ID cyclic ownership.
- [x] Pass 2: run focused target/round tests, typecheck, build, and protected-system diff checks.
- [x] Pass 3: implement independent UID-owned actions, simultaneous-write safety, and idempotent submission.
- [x] Pass 3: run focused action/idempotency tests, typecheck, build, and protected-system diff checks.
- [x] Pass 4: implement authoritative atomic resolution, score safety, timeout/non-submission handling, and idempotent transitions.
- [x] Pass 4: run focused resolution/scoring tests, typecheck, build, and protected-system diff checks.
- [x] Pass 5: implement immutable four-player round results, final standings, target snapshots, and complete projections.
- [x] Pass 5: run focused results tests, typecheck, build, and protected-system diff checks.
- [x] Pass 6: verify and repair refresh, disconnect, reconnect, listener reattachment, and room lifecycle behavior.
- [ ] Pass 6: run reconnect/lifecycle tests and record live Firebase evidence status.
- [x] Pass 7: harden Firebase security rules for capacity, ownership, private targets, actions, and immutable results.
- [x] Pass 7: validate rules with available tooling and record deployment limitations if any.
- [x] Pass 8: integrate the existing 3–4 UI with authoritative four-player state without touching protected systems.
- [x] Pass 8: run focused UI tests and browser console checks.
- [ ] Pass 9: run full typecheck, production build, regression checks, and four-client QA where available.
- [ ] Final: deliver exact files, changes, tests, evidence levels, live Firebase status, protected-system status, and remaining risks.

## Live QA + Repair Phase

- [ ] Validate Firebase configuration and rules deployment/validation path.
- [ ] Test four real Firebase UIDs joining one 3–4 room and reject a fifth new UID.
- [ ] Test same-UID reconnect without duplicate player creation.
- [ ] Test private target isolation, independent actions, near-simultaneous submissions, and duplicate submissions.
- [ ] Test atomic/idempotent resolution, four-player results, next-round target/listener updates, and final standings.
- [ ] Test refresh during lobby, gameplay, after submission, and results; test disconnect/reconnect and timeout/non-submission.
- [ ] Inspect browser console, Firebase errors, stale listeners, and race conditions.
- [ ] Repair only confirmed 3–4 defects and rerun affected tests plus protected 1v1 regression.
- [ ] Produce final evidence-labeled live QA report.

## 3–4 Impostor Knockout Bracket Fix

- [x] Read the complete bracket brief and trace current opponent/target/match/action/resolution logic.
- [x] Persist authoritative semifinal bracket matches and each player’s match/opponent assignment before gameplay.
- [x] Scope private/display targets, actions, submissions, and resolution by room, match, round, and UID.
- [x] Advance only the resolved match; wait for both semifinals before creating final and third-place matches.
- [x] Persist final and third-place results and authoritative 1st–4th standings.
- [x] Update only necessary 3–4 UI opponent and stage projections.
- [x] Run bracket/action/results contracts, protected 1v1 regression, and build. Available live QA remains pending.
- [ ] Repair confirmed in-scope defects and produce the final bracket-fix report.

## Confirmed Match Transition + Guess Correct Repair

- [x] Trace match-scoped transition from Guess Correct through context, Firebase, engine, result, and board navigation.
- [x] Trace every Guess Correct disabled condition and verify Firebase UID/match/round/target ownership.
- [x] Patch only confirmed 3–4 transition and action-enabled defects; preserve Player 1↔4 and Player 2↔3 pairing.
- [x] Run bracket/action contracts, protected 1v1 regression, rules validation, and production build.
- [ ] Execute four-client Test A–D and inspect live Firebase state if the environment permits. Partial two-client observation only; full four-client verification blocked.
- [x] Produce the exact repair and evidence report without claiming unavailable verification.

## Full 3–4 Impostor Game-Flow Repair

- [x] Reproduce and trace the incorrect Firebase UID-key enumeration that reordered the live knockout seats before the action/score path.
- [x] Confirmed the prior action-gated, match-scoped resolver prevents listener, target, or stale-result auto-resolution.
- [x] Patch only confirmed 3–4 match-scoped authority and join-seat defects.
- [x] Verify semifinals remain independent until both resolve, then create final and third-place matches exactly once.
- [x] Verify final and third-place matches remain independent until both resolve, then persist UID-keyed standings.
- [x] Run focused full-flow and protected 1v1 deterministic contracts; production build is blocked by the desktop Node/npm wrapper.
- [x] Execute available four-client Firebase runtime tests and record the exact completed-flow evidence.
- [x] Produce the full-game-flow repair report with root causes, state-flow corrections, files, evidence labels, and remaining risks.

## Pasted Content 31 — Automatic Knockout Progression Repair

- [x] Trace Retry Game callers and current semifinal-to-next-stage transition behavior.
- [x] Ensure both authoritative semifinal results are required before Round 2 creation.
- [x] Automatically persist Winner SF1 vs Winner SF2 Final and Loser SF1 vs Loser SF2 Third Place using Firebase UIDs.
- [x] Add the existing visual-language transition announcement before automatic next-match entry.
- [x] Ensure Final and Third Place remain independent and standings appear only after both complete.
- [x] Ensure Retry Game cannot reset or replace the active original 3–4 knockout bracket while preserving 1v1 behavior.
- [x] Existing deterministic coverage verifies automatic engine progression, stale-state rejection, idempotency, and Retry Game protection.
- [x] Run protected 1v1 regression and production build.
- [x] Deliver the exact repair report and stop for manual four-client testing; do not claim live browser verification.

## Pasted Content 32–33 — Two-Fix Lifecycle Repair

- [x] Trace why a fresh four-player game can present Final/Third Place instead of starting Round 1 semifinals.
- [x] Trace why the five-second transition display does not visibly decrement or complete.
- [x] Restore exactly three stages: Round 1 semifinals, Round 2 Final + Third Place, Round 3 final results.
- [x] Make the transition countdown use persisted synchronized timestamps and prevent stale callbacks or refreshes from restarting it.
- [x] Add focused tests for fresh start, one-semifinal gating, both-semifinal progression, independent Round 2 matches, standings gating, timestamp/countdown behavior, refresh preservation, and stale-state rejection.
- [x] Run protected 1v1 regression and production build/check.
- [x] Deliver the exact two-fix report and stop for manual four-client verification without claiming live verification.

## Pasted Content 34 — Countdown TDZ and Three-Stage Verification Repair

- [x] Trace the `intervalId` temporal-dead-zone error in `GameBoardPage.jsx` and verify the current transition guard.
- [x] Confirm fresh four-player start is Round 1 semifinals with Player 1↔4 and Player 2↔3, without damaging refresh/reconnect state.
- [x] Fix the countdown effect so interval setup precedes any callback reference, cleanup is deterministic, and duplicate intervals/rerender restarts are prevented.
- [x] Confirm authoritative `transitionStartedAt` / `transitionEndsAt` drives 5→4→3→2→1→0 and exactly-once automatic progression.
- [x] Confirm both semifinals gate Round 2, Final/Third Place are UID-derived and independent, and both gate Round 3 standings.
- [x] Run focused contracts and protected 1v1 regression; final build probe was blocked by the desktop command wrapper.
- [x] Deliver exact files, tests, remaining uncertainty, and stop for the user’s manual four-client test; do not perform browser gameplay testing.
