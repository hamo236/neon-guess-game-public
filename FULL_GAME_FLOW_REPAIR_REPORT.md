# Original 3–4 Impostor Full Game-Flow Repair Report

## Scope

This repair was limited to the original social 3–4 Impostor path. **1v1 gameplay, Tournament, Team Battle, Competitive Mode, game data, image paths, routes, and the established session-restoration design were not modified.**

## Confirmed root causes and repairs

| Root cause | Impact | Minimal repair | Evidence |
|---|---|---|---|
| Firebase stores `players` by UID. Reconstructing the roster with `Object.values` used lexical UID-key order rather than join order. | The first live room seeded the wrong semifinals: the host faced the third joiner instead of the fourth. | Persisted `joinOrder: 1` for the host and a transaction-derived seat for each new player. During room sync, a complete social four-player roster is sorted by that field only when all four fields are present. | SOURCE VERIFIED; LIVE FIREBASE VERIFIED |
| A forged or stale confirm action could previously be insufficiently constrained by actor, opponent, match, and round identity. | Risk of resolving or scoring the wrong match. | Added engine, client, Firebase transaction, and rule checks that require the action actor, assigned opponent, active match, and current round to agree. | SOURCE VERIFIED; ENGINE TEST VERIFIED |
| Host action processing used concurrent callback work and Firebase resolution could leak a match result/transition into room-wide state. | One semifinal could interfere with its sibling’s button state or transition. | Serialized host resolution and kept per-match outcomes under `matchResults[matchId]`; the room remains playing while a sibling match is unresolved. | SOURCE VERIFIED; ENGINE TEST VERIFIED; LIVE FIREBASE VERIFIED |

## Files changed

| File | Change |
|---|---|
| `src/firebase/roomService.js` | Added immutable join-seat metadata when a room is created or a new identity joins. Reconnects preserve the existing record and seat. |
| `src/context/GameStateContext.jsx` | Sorts only complete social four-player Firebase rosters by the persisted join seat before bracket seeding. Also includes the previously applied serialized, action-gated host resolution repair. |
| `src/game/gameEngine.js` | Previously repaired match eligibility, actor/opponent ownership, match-scoped score projection, and downstream bracket advancement. |
| `src/firebase/gameSync.js` | Previously repaired Firebase match resolution so sibling semifinals remain in the shared playing phase until both finish. |
| `database.rules.json` | Previously hardened writes for UID-owned, match-scoped, round-scoped actions. |
| `knockout-bracket-contract.test.mjs` | Previously extended with forged-action and scoped-score assertions. |
| `pass2-5-contract.test.mjs` | Previously corrected to initialize the stated cyclic assignment fixture. |

## Verification record

| Check | Result | Evidence label |
|---|---|---|
| Root-cause trace: UID map enumeration versus required join seats | Confirmed in source and reproduced live before the seat repair. | SOURCE VERIFIED; LIVE FIREBASE VERIFIED |
| Fresh four-UID room creation and join | A host plus RT2, RT3, and RT4 joined a fresh room. | LIVE FIREBASE VERIFIED; FOUR-DEVICE VERIFIED |
| Fifth distinct UID rejection | A fifth disposable client received `Room is full.` | LIVE FIREBASE VERIFIED |
| Required semifinal pairing | Fresh room showed host ↔ RT4 and RT2 ↔ RT3. | LIVE FIREBASE VERIFIED; FOUR-DEVICE VERIFIED |
| Independent semifinal resolution | Resolving host ↔ RT4 left RT2 ↔ RT3 active with its action control. | LIVE FIREBASE VERIFIED; FOUR-DEVICE VERIFIED |
| Downstream match creation | After both semifinals, host ↔ RT2 (third place) and RT4 ↔ RT3 (final) were active independently. | LIVE FIREBASE VERIFIED; FOUR-DEVICE VERIFIED |
| Independent final and third-place resolution | Resolving third place left the final active; resolving final produced UID-keyed 1st–4th standings. | LIVE FIREBASE VERIFIED; FOUR-DEVICE VERIFIED |
| Results refresh | Refreshing RT4 after the match restored `/results` with the authoritative standings. | LIVE FIREBASE VERIFIED |
| Knockout contract | `KNOCKOUT_BRACKET_CONTRACT_PASS` | ENGINE TEST VERIFIED |
| Four-player target/result contract | `PASS2_5_CONTRACT=0` | ENGINE TEST VERIFIED |
| Protected 1v1 contract | `PROTECTED_1V1_REGRESSION=0` | ENGINE TEST VERIFIED |
| Production build | Desktop `npm run build` emitted no output and exited nonzero through the pre-existing desktop Node/npm wrapper. The dependency-copy fallback also stalled on the mounted dependency tree. | BUILD VERIFIED: BLOCKED BY ENVIRONMENT |

## Protected-system status

The protected 1v1 regression contract passed. Tournament, Team Battle, Competitive Mode, Firebase namespaces for those modes, game data, image paths, routing, and session-storage schema were not changed in this repair.

## Remaining verification limits

| Item | Status | Reason |
|---|---|---|
| Production bundle command after the final join-seat patch | BLOCKED BY ENVIRONMENT | The desktop Node/npm wrapper exited nonzero with an empty log; copying the existing mounted dependency tree to a sandbox for a build did not complete. |
| Refresh in every requested phase | NOT VERIFIED | A completed-match refresh was verified. Dedicated refresh probes in lobby, mid-round, and immediately after submission were not run in this pass. |
| Disconnect/reconnect with browser network interruption | NOT VERIFIED | Same identity restoration was exercised through a completed-match refresh, but an explicit network-disconnect simulation was not available in the CDP run. |
| Timeout and non-submission live branch | NOT VERIFIED | The controlled live match was completed by actions rather than waiting for the eight-minute timeout. |
| Browser console inspection | NOT VERIFIED | No client-visible runtime error occurred in the tested flow, but the disposable CDP harness did not retain historical console events. |

## Final status

The original full four-client flow now preserved join-seat pairing and completed through independent semifinals, third place, final, and authoritative standings. The source and deterministic contracts support the repaired ownership and transition paths. The production build must be rerun in a functioning desktop Node/npm environment before it can be labeled **BUILD VERIFIED**.
