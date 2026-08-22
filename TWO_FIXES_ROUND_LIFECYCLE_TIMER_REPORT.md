# Two-Fix Repair Report — Original 3–4 Impostor Mode

## Scope

Only the two defects reported in the latest manual test were addressed:

1. A fresh four-player social game could reuse stale finals-stage bracket metadata instead of starting the three-stage lifecycle at Round 1 semifinals.
2. The five-second finals/third-place transition countdown was not reliably driven by a shared authoritative timestamp and could appear frozen or fail to complete.

No pairing, scoring, Firebase identity architecture, 1v1, Tournament, Team Battle, Competitive Mode, game data, image paths, routing, or refresh/reconnect architecture was changed.

## Root causes

| Defect | Confirmed cause | Minimal correction |
|---|---|---|
| Fresh room appears to show Final/Third Place immediately | `enterPreview()` seeded a bracket only when `!state.bracket`. If a stale finals bracket was present in the local/provider state, the lobby-to-preview transition preserved it. | `enterPreview()` now rebuilds the four-player social bracket only for the initial lobby/`round === 1` entry. Later preview transitions preserve the authoritative finals bracket. The existing join-seat pairing remains unchanged: Player 1 ↔ Player 4 and Player 2 ↔ Player 3. |
| Five-second number does not decrement or transition does not complete | The transition UI used a local decrementing variable and did not calculate remaining time from a persisted synchronized end timestamp. React rerenders and client timing could make it appear stuck or diverge between clients. | `GameBoardPage.jsx` now reads `transitionEndsAt`, calculates `Math.ceil((transitionEndsAt - Date.now()) / 1000)`, ticks at 250 ms for visible second changes, and lets the host perform the guarded `beginRound()` only when the authoritative timestamp reaches zero. A stable room/round/timestamp key prevents rerenders from restarting the same transition. |

## Required lifecycle after the repair

```text
LOBBY
  ↓
ROUND 1 / SEMIFINALS
  ├─ SF1: Player 1 ↔ Player 4
  └─ SF2: Player 2 ↔ Player 3
  ↓ both authoritative results
AUTHORITATIVE 5-SECOND TRANSITION
  ↓
ROUND 2
  ├─ FINAL: Winner SF1 ↔ Winner SF2
  └─ THIRD PLACE: Loser SF1 ↔ Loser SF2
  ↓ both authoritative results
ROUND 3 / FINAL RESULTS
  └─ UID-keyed 1st, 2nd, 3rd, 4th standings
```

Finishing one semifinal does not create the final. Finishing one Round 2 match does not create standings. The pre-existing engine resolver remains responsible for those gates; this patch only stops stale initial bracket projection and makes the existing transition window visible and authoritative.

## Files changed for these two defects

| File | Change |
|---|---|
| `src/game/gameEngine.js` | Rebuilds the initial four-player social bracket on lobby/Round 1 entry so stale finals metadata cannot appear as a fresh game. Existing three-stage resolver and join-seat pairing are preserved. |
| `src/pages/GameBoardPage.jsx` | Uses persisted `transitionEndsAt` for the visible countdown and automatic host transition; stabilizes the transition key across rerenders. |
| `knockout-bracket-contract.test.mjs` | Adds focused assertions for fresh semifinal start, transition timestamp duration, visible 5→4→3→2→1→0 calculation, Round 3 results, and stale finals metadata rejection. |
| `todo.md` | Records the two requested defects and verification checklist. |

## Verification

| Check | Result | Evidence |
|---|---|---|
| Fresh four-player entry is Round 1 / semifinals | Passed deterministic assertion, including stale-finals fixture | **ENGINE TEST VERIFIED** |
| Both semifinals required before Round 2 | Existing knockout contract passed | **ENGINE TEST VERIFIED** |
| Round 2 contains Final and Third Place independently | Existing knockout contract passed | **ENGINE TEST VERIFIED** |
| Both Round 2 matches required before standings | Existing knockout contract passed | **ENGINE TEST VERIFIED** |
| Transition timestamp is five seconds | `transitionEndsAt - transitionStartedAt === 5000` | **ENGINE TEST VERIFIED** |
| Countdown reaches 5, 4, 3, 2, 1, 0 from authoritative timestamp | Focused deterministic assertion passed | **ENGINE TEST VERIFIED** |
| Protected 1v1 behavior | `protected-regression.test.mjs` passed | **ENGINE TEST VERIFIED** |
| Production build | Earlier direct build after the timestamp patch returned `BUILD_EXIT=0`. The later combined desktop wrapper produced an unrelated “system cannot find the file specified” capture failure; deterministic contracts still passed after the final stale-bracket patch. | **BUILD VERIFIED** for the successful direct build; latest wrapper retry **BLOCKED BY ENVIRONMENT** |
| Live Firebase/four-client verification of this latest patch | Not run in this pass | **NOT VERIFIED** |

## Manual verification required

Please test with four independent clients and record the following exact sequence:

1. Create a fresh 3–4 Impostor room and confirm the first screen is Round 1 Semifinals, not Final/Third Place.
2. Confirm SF1 is Player 1 ↔ Player 4 and SF2 is Player 2 ↔ Player 3.
3. Resolve only one semifinal and confirm the other remains playable and no Final appears.
4. Resolve the second semifinal and confirm the transition visibly displays 5, 4, 3, 2, 1, 0.
5. Confirm all clients enter Round 2 automatically without a button.
6. Resolve Final and Third Place independently in either order.
7. Confirm the final results page appears only after both are complete and displays all four UID-keyed standings.

This report does not claim live or four-device verification for the latest two-fix patch.


## Follow-up correction from Pasted Content 34

A deterministic contract exposed one remaining lifecycle defect: when both Round 2 matches completed, the resolver entered `RESULTS` but retained `round: 2`. The smallest isolated correction sets the authoritative knockout result state to `round: 3` at the same point that final standings are persisted. This restores the explicit three-stage contract without changing 1v1 progression.

The reported `intervalId` temporal-dead-zone was also fixed in `src/pages/GameBoardPage.jsx` by establishing interval setup before callback cleanup references and preserving deterministic cleanup. The authoritative `transitionStartedAt` / `transitionEndsAt` window remains the source for the visible 5→4→3→2→1→0 countdown.

Final focused results after the follow-up correction:

| Check | Result |
|---|---|
| Knockout bracket and Round 3 completion | `KNOCKOUT_BRACKET_CONTRACT_PASS` |
| Four-player target/result contract | `PASS2_5_CONTRACT=0` |
| Protected 1v1 regression | `PROTECTED_1V1_REGRESSION=0` |
| Final production-build probe | **NOT VERIFIED / BLOCKED BY ENVIRONMENT**: desktop wrapper timed out and produced an empty log; no source error was emitted. |

The final manual handoff remains unchanged: test four independent clients through fresh Round 1, both Round 2 matches, and Round 3 results. No browser gameplay verification is claimed for this follow-up.
