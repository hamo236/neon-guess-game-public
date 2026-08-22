# Original 3–4 Impostor Implementation Report

## Scope and outcome

The approved implementation passes were applied to the original connected desktop project at `stitch_neon_guess_master`. The implementation was restricted to the original 3–4 Impostor path. The Tournament, Team Battle, Competitive Mode, game data, image paths, and protected architecture were not intentionally modified.

The implementation now carries explicit match and round identity, uses Firebase UID-owned player records and action channels, supports transaction-guarded room capacity and round resolution, preserves immutable target snapshots for results, exposes four-player roster information in the social gameplay board, and includes Firebase rules for ownership and immutable round artifacts.

## Pass-by-pass record

| Pass | Implementation | Exact files changed | Evidence level | Status |
|---|---|---|---|---|
| 1. Identity and room capacity | Added transaction support and transaction-safe room creation/join behavior. Existing player IDs reconnect without resetting room state; new identities are rejected once capacity is reached or play has started. | `src/firebase/database.js`, `src/firebase/roomService.js` | Static code inspection; production build passed. | Implemented |
| 2. Round identity and private targets | Added `matchId`, `roundId`, `roundTargets`, and target-readiness metadata. Stale or incomplete target snapshots are rejected. Four-player target ownership follows stable player order rather than array/card position. | `src/game/gameEngine.js`, `src/firebase/gameSync.js`, `src/context/GameStateContext.jsx`, `src/firebase/roomService.js` | Deterministic four-player contract test passed. | Implemented |
| 3. Independent UID-owned actions | Added an idempotent action channel keyed by `roundId` and actor UID. Original 3–4 confirmations route through this channel; 1v1 retains the legacy action path. | `src/firebase/gameSync.js`, `src/context/GameStateContext.jsx` | Deterministic resolution contract and build passed; live concurrent Firebase writes not executed. | Implemented, live concurrency pending |
| 4. Atomic resolution and scoring | Added active-round checks and transaction-guarded round commits. Duplicate resolution is ignored after `roundResult` exists. The result records the confirmer, resolved player, points, and exact revealed target snapshots. | `src/game/gameEngine.js`, `src/firebase/gameSync.js` | Deterministic idempotency assertion passed; production build passed. | Implemented |
| 5. Four-player results and standings | Added immutable `roundResults` history and deterministic standings data. Results retain the target each player was actually trying to guess. | `src/game/gameEngine.js`, `src/firebase/gameSync.js`, `src/context/GameStateContext.jsx` | Deterministic four-player target/reveal/standings contract passed. | Implemented |
| 6. Refresh, disconnect, and reconnect | Reconnect remains identity-preserving. Room updates now attach the private-target listener when a client transitions into an active round, including clients that joined in lobby or refreshed before play. A duplicate UID declaration introduced during this pass was found and removed; the subsequent production build passed. | `src/context/GameStateContext.jsx`, `src/firebase/roomService.js` | Static inspection; local dev server returned HTTP 200. Real refresh/disconnect/reconnect across clients was not completed. | Implemented, live lifecycle pending |
| 7. Firebase security | Added rules for create-only room roots, UID-owned private targets, UID-owned round actions, host-controlled round identity and resolution fields, and immutable per-round result records. | `database.rules.json` | JSON parse validation passed. Rules were not deployed or exercised against the live Firebase project in this environment. | Implemented, deployment pending |
| 8. UI integration | Added a four-player roster projection to the existing social gameplay board while leaving the 1v1 layout path unchanged. Existing reveal/results components continue to project by authoritative player ID and target snapshot. | `src/pages/GameBoardPage.jsx` | Production build passed; browser interaction was not completed against the desktop server. | Implemented, live UI pending |
| 9. Full QA | Ran deterministic contracts, protected 1v1 regression, rules parsing, production build, local HTTP probe, and listening-port inspection. | `pass2-5-contract.test.mjs`, `protected-regression.test.mjs`, `todo.md` | See test table below. | Partially complete because four-client Firebase QA was unavailable |

## Tests and commands

| Test or command | Result | Evidence |
|---|---:|---|
| `node pass2-5-contract.test.mjs` | PASS | Printed `PASS2_5_CONTRACT=0`; verified four-player cyclic mapping, exact reveal mapping for all four players, score update, duplicate-resolution idempotency, and final standings. |
| `node protected-regression.test.mjs` | PASS | Printed `PROTECTED_1V1_REGRESSION=0`; verified two-player target inversion, scoring, and result target snapshots. |
| `node -e "JSON.parse(...database.rules.json...)"` | PASS | Rules JSON parsed successfully. |
| `npm.cmd run build` | PASS | Printed `BUILD_EXIT=0`. |
| `npm.cmd run check` | NOT AVAILABLE | The project has no `check` script in `package.json`; this is a project-command limitation, not a reported TypeScript failure. |
| `GET http://127.0.0.1:5176/` | PASS | Returned HTTP 200 with 1,611 bytes of HTML from the existing Vite server. |
| Listening ports | OBSERVED | Ports 5173, 5174, 5175, and 5176 were listening on `0.0.0.0`. |
| Four independent real clients against Firebase | NOT COMPLETED | No claim is made. The connected browser control was unavailable, and no real four-device Firebase flow was executed. |

## Protected-system status

The deterministic 1v1 regression passed. The implementation did not change the Tournament or Team Battle provider/service files, game-data files, or image assets. A repository-level Git diff audit was not available because the connected project directory is not a Git working tree; protected-file status is therefore based on the exact edit operations performed and targeted regression coverage rather than a commit diff.

## Remaining risks

The principal remaining risk is live Firebase behavior. The rules have been written and parsed but not deployed or exercised against the configured Firebase instance. The following still require real-client verification: four simultaneous joins, fifth-player rejection, private target visibility between clients, concurrent action writes, duplicate action delivery, refresh during an active round, disconnect/reconnect listener reattachment, host migration, timeout/non-submission behavior, and final results rendering on all four clients.

The local server is reachable from the connected desktop at `http://127.0.0.1:5176/`, but the sandbox browser could not control the desktop’s browser session. Therefore, no claim is made that the full lobby → start → target delivery → guessing → results flow was manually completed with four real clients.

## Final protected-scope statement

No changes were intentionally made to 1v1 rules beyond preserving and regression-testing the existing two-player semantics. Tournament, Team Battle, Competitive Mode, existing game data, image paths, and protected shared architecture were kept outside the implementation scope. The implementation is buildable and deterministic-testable, but live Firebase deployment and four-client QA remain required before treating the architecture as production-verified.
