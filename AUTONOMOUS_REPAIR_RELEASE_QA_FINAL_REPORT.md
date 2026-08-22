# NEON GUESS — Autonomous Repair & Release-QA Final Report

**Scope:** 2v2 Team Battle stabilization, privacy, authoritative synchronization, reconnect behavior, Firebase authorization, and regression safety for 1v1/Tournament-adjacent competitive flows.

**Final gate:** **CONDITIONAL READY**. The deterministic logic, source contracts, Firebase rules JSON, Tournament regression, and Linux production build all passed. A live four-device Firebase session and deployment verification were not executed in this cycle because the project’s live environment/secrets were not available in the verification workspace; therefore the final production gate still requires one authenticated staging-room test.

## Executive Summary

The final audit found and repaired two functional issues and two release-hardening issues. The most important functional repair prevents a player from confirming a round before a correct guess has selected the target-owning team. The shared target projection now preserves the owning team identity explicitly for each player. The Firebase adapter now aligns competitive player identity with the authenticated Firebase UID, which is required for rules that authorize by `auth.uid`.

The Firebase rules were also hardened so non-host players cannot write the authoritative active Team Battle room state through the room-root permission. Legitimate lobby joins, player-scoped reconnect updates, and player-scoped leave markers remain supported. Tournament room authorization was added because the adapter uses a `tournamentRooms` namespace that was not previously covered by the supplied rules file.

## Prioritized Problem Inventory and Repairs

| Priority | Finding | Root cause | Repair | Evidence |
|---|---|---|---|---|
| P0 | Competitive player identity could diverge from Firebase authorization identity | The provider generated a local player ID even when Firebase Auth was available, while rules authorize by `auth.uid` | Provider initializes through `initAuth()` and uses the authenticated UID; local fallback remains only for unconfigured Firebase | [`CompetitiveModeContext.jsx`](src/context/CompetitiveModeContext.jsx), [`auth.js`](src/firebase/auth.js), [`config.js`](src/firebase/config.js) |
| P0 | Active-room root writes were too permissive for authenticated existing players | The `teamRooms/$roomId` root rule allowed any existing player to write the complete authoritative room object | Root writes are host-only after creation, with narrowly scoped lobby join allowance; player reconnect/leave uses child paths | [`database.rules.json`](database.rules.json), [`competitiveFirebase.js`](src/firebase/competitiveFirebase.js) |
| P1 | Premature confirmation was possible before a correct guess selected the owning team | Confirmation defaulted to the confirming player’s team when `confirmationTeamId` was empty | Confirmation now requires an explicit target-owning team derived from a correct guess; no guess means no confirmation | [`teamBattleEngine.js`](src/modes/teamBattleEngine.js), [`qa-team-battle-engine.mjs`](scripts/qa-team-battle-engine.mjs) |
| P1 | Shared per-player target projection did not explicitly preserve team identity | The team ID was carried only through the source/team projection and could be lost in the player-safe projection | Each safe target now writes `teamId: teamId` explicitly | [`teamBattleEngine.js`](src/modes/teamBattleEngine.js) |
| P1 | Tournament Firebase namespace lacked an authorization section | Adapter uses `tournamentRooms`, while rules covered `teamRooms` and legacy `rooms` only | Added authenticated room access, host-authoritative match-state writes, player-scoped reconnect/leave, and private-target rules for Tournament rooms | [`database.rules.json`](database.rules.json) |
| P2 | Smoke contract was stricter than the valid TeamSlotPreview implementation | The check expected a component invocation without the required `actions` prop | Updated the contract to recognize the actual Team Battle-only invocation with actions preserved | [`qa-smoke.mjs`](scripts/qa-smoke.mjs), [`CompetitiveModePage.jsx`](src/pages/CompetitiveModePage.jsx) |

## Verified Product Invariants

The Team Battle engine now enforces the required gameplay model: players 1–2 and 3–4 are assigned by persisted join order; each team shares one target; a team guesses the target shown to the opposing team; target answers are not exposed through public competitive state; only the target-owning team can confirm a correct guess; both teammates must confirm for the round to resolve; the frozen reveal is created only after both confirmations; and confirmations reset on the next round. These invariants are exercised by the deterministic engine suite.

The provider’s public-state projection removes `match.targets` and `match.teamTargets` before Firebase writes, while private target data is subscribed through per-player paths. The Team Battle UI masks the opponent answer and exposes only the intended target card and synchronized confirmation control. These boundaries were preserved during the final repair pass.

## Verification Results

| Check | Result | Evidence |
|---|---:|---|
| Team Battle deterministic privacy/confirmation suite | **PASS** | `Team Battle privacy QA passed: shared hidden targets, owner-only confirmations, two-player gate, single confirmation owner, and reset.` |
| New premature-confirmation break test | **PASS** | Included in `scripts/qa-team-battle-engine.mjs`; confirmation is rejected before a correct guess exists |
| Source smoke contracts | **PASS** | `QA smoke checks passed: invite, timeline, rematch, host-guards, gameplay async guards, recovery projection, competitive guards, daily drop, and dead-link contracts are present.` |
| Tournament regression | **PASS** | Independent semifinals, bracket transition, final/consolation pairing, and paired next-match start passed in `/home/ubuntu/tournament-regression.mjs` |
| Firebase rules JSON parse | **PASS** | `Firebase rules JSON valid` |
| Production Vite build | **PASS** | 81 modules transformed; build completed successfully in the Linux-compatible verification workspace |
| Existing build warnings | **NON-BLOCKING** | Firebase dynamic/static import chunking warning and a large JavaScript chunk warning remain; they do not prevent build output |

The attached desktop’s Windows-mounted `node_modules` could not execute the Vite shim because of executable-bit and platform-specific optional Rollup dependency behavior. The build was therefore rerun from a clean Linux-compatible dependency installation using the current source snapshot, which produced `dist` successfully. This is an environment limitation, not a source compilation failure.

## Break-Test Coverage

The final break cycle covered one teammate confirming alone, both required teammates confirming, confirmation from the wrong team, confirmation before any correct guess, simultaneous correct guesses, confirmation-owner locking, round snapshot timing, confirmation reset, and Tournament bracket transitions. The repaired engine passed the complete deterministic suite after the additional break cases were added.

The source-contract suite also re-audited privacy masking, join-order sorting, transactional join order, modular Firebase child references, host guards, duplicate-action guards, recovery controls, accessible async feedback, mobile touch targets, and dead-link regressions. It passed without failures.

## Remaining Release Gates

The release is not marked unconditionally ready because two operational checks require a configured staging environment. First, deploy the updated `database.rules.json` and verify that an unauthenticated client cannot read or write competitive rooms, a non-host authenticated player cannot mutate active authoritative state, and a player can still join a lobby, reconnect after refresh, leave, and receive only their own private target. Second, execute a four-device or four-browser staging match through all three Team Battle rounds, including simultaneous confirmations and a stale-client refresh during the round-result reveal.

The production build retains a large main JavaScript chunk of approximately 712 kB before gzip and reports Firebase dynamic/static import chunking warnings. These are performance follow-ups rather than release blockers for functional correctness, but code-splitting competitive routes and consolidating Firebase import boundaries should be scheduled before a high-traffic launch.

## Final Decision

**Status: CONDITIONAL READY.** The repaired source is internally consistent and passes all available deterministic, contract, regression, rules-parse, and production-build checks. The remaining condition is live staging verification of Firebase rules and four-player synchronization. No GitHub deployment or repository operation was performed in this cycle.

## References

[1]: src/context/CompetitiveModeContext.jsx "Competitive provider and authenticated identity initialization"
[2]: src/modes/teamBattleEngine.js "Authoritative Team Battle state machine"
[3]: src/firebase/competitiveFirebase.js "Competitive Firebase adapter and reconnect paths"
[4]: database.rules.json "Firebase Realtime Database authorization rules"
[5]: src/pages/CompetitiveModePage.jsx "Team Battle lobby and gameplay projection"
[6]: scripts/qa-team-battle-engine.mjs "Deterministic Team Battle and break-test suite"
[7]: scripts/qa-smoke.mjs "Repository source-contract smoke suite"
