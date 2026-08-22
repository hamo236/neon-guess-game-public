# Automatic 3–4 Impostor Knockout Progression Repair

## Root cause

The authoritative engine already created the Final and Third-Place matches after both semifinals resolved. It persisted `bracket.stage = 'finals'`, both UID-based match assignments, `round = 2`, and `phase = PREVIEW`. The remaining defect was in `GameBoardPage.jsx`: every preview phase exposed a host-only **Start Round** button and waited for `actions.beginRound()`. The newly persisted Round 2 preview therefore stopped at a manual gate instead of automatically entering the next stage.

A second, related defect risk was identified during implementation: the transition effect depended on the whole `actions` object. Normal provider rerenders could recreate that object and restart the countdown, postponing automatic entry indefinitely. The final patch stores the current `beginRound` callback in a ref so the five-second timer is stable while still using the latest callback.

## Minimal repair

Only the original social 3–4 gameplay board was changed. When the state is a four-player social game in `PREVIEW`, with `round > 1` and the authoritative bracket stage `finals`, the board now renders a short existing-style transition screen showing:

- `SEMIFINALS COMPLETE`
- the authoritative Final participants from `bracket.matches.final.playerA/playerB`
- the authoritative Third-Place participants from `bracket.matches.third_place.playerA/playerB`
- a five-second automatic continuation message

After the countdown, only the Firebase host calls `actions.beginRound()`. Firebase then persists the new Round 2 `roundId`, targets, and `PLAYING` phase for all clients. The original Round 1 preview remains unchanged, so the host still explicitly starts the initial game. The 1v1 preview and all unrelated modes remain unchanged.

The resolver and engine were not rewritten because they already enforce the required authority: both semifinal results are required, winner/loser IDs come from persisted match results, Final and Third Place are created from those UIDs, and the two Round 2 matches resolve independently.

## Files changed

| File | Change |
|---|---|
| `src/pages/GameBoardPage.jsx` | Added the isolated Round 2 knockout transition screen, authoritative Final/Third-Place matchup projection, five-second host-controlled automatic `beginRound`, and a stable callback ref so rerenders do not restart the countdown. |
| `todo.md` | Recorded and marked the pasted progression requirements complete. |
| `AUTOMATIC_KNOCKOUT_PROGRESSION_REPAIR_REPORT.md` | This report. |

No Tournament, Team Battle, Competitive Mode, 1v1, Firebase namespace, game data, image path, routing, or refresh/reconnect source was modified.

## Tests executed

| Test | Result | Evidence |
|---|---|---|
| `node knockout-bracket-contract.test.mjs` | `KNOCKOUT_BRACKET_CONTRACT_PASS` | **ENGINE TEST VERIFIED** |
| `node pass2-5-contract.test.mjs` | `PASS2_5_CONTRACT=0` | **ENGINE TEST VERIFIED** |
| `node protected-regression.test.mjs` | `PROTECTED_1V1_REGRESSION=0` | **ENGINE TEST VERIFIED** |
| Production build through `cmd.exe /d /c "npm.cmd run build"` | `BUILD_EXIT:0` | **BUILD VERIFIED** |
| Direct Vite build attempt | Returned without compiler output; the explicit npm.cmd run above is the authoritative successful build result. | **BUILD VERIFIED** |

The knockout contract covers the relevant state-level progression: independent semifinal resolution, both-results gating, UID-based Final and Third-Place assignments, independent Round 2 resolution, idempotency, stale-round rejection, score ownership, and final standings. The UI timer and transition branch were source-reviewed for the exact `PREVIEW → automatic beginRound` path.

## Protected-system status

**Protected systems remain unchanged:** 1v1 gameplay passed its regression contract; Tournament, Team Battle, Competitive Mode, game data, image paths, routing, and refresh/reconnect/session restoration were not modified. Retry Game remains available only in the existing final-results flow or as the existing non-final Quit path; it is not used to advance the knockout bracket and is not exposed as the Round 2 transition mechanism.

## Remaining risks and manual handoff

Browser/live-player QA was intentionally not performed, per the supplied requirements. The user should manually verify with four clients that both clients in each Round 2 match see the announcement, the host starts the next round automatically after approximately five seconds, a refresh during the announcement preserves the persisted `finals` bracket, Final and Third Place remain independent, and final standings appear only after both matches resolve.

Evidence labels: **SOURCE VERIFIED**, **ENGINE TEST VERIFIED**, **BUILD VERIFIED**, **NOT VERIFIED** for browser/live-player behavior. No **FOUR-DEVICE VERIFIED** or **LIVE FIREBASE VERIFIED** claim is made for this task.
