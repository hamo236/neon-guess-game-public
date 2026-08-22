# Original 3–4 Impostor Knockout Bracket Fix

## Scope

Implemented the approved four-player 1v1 knockout bracket inside the existing original social-mode path. The implementation was kept isolated from 1v1, Tournament, Team Battle, Competitive Mode, game data, image paths, and protected shared architecture.

## Root cause

The original 3–4 path derived opponents from array order using `(currentIndex + 1) % activeIds.length`, stored actions under a room-wide round/player shape, and resolved one global room round. The board therefore displayed different opponents depending on array order, and one correct guess could advance or project results for unrelated players. The results page also sorted only shared scores and had no authoritative tournament placement source.

## Implementation

### 1. Authoritative bracket creation

`src/game/gameEngine.js` now creates `semifinal_1` and `semifinal_2` from stable player IDs when four social players enter preview. It persists `bracket`, `playerAssignments`, `matchResults`, and `standings` in the game state. Each player receives a stable `matchId`, `opponentPlayerId`, and stage.

### 2. Match-scoped targets and actions

Four-player display targets are selected from `playerAssignments[playerId].opponentPlayerId`, while own targets remain UID-owned private data. Firebase actions are stored at `actions/{roundId}/{matchId}/{actorId}` and include the match ID. Duplicate writes remain transaction-guarded.

### 3. Independent match resolution

`resolveKnockoutMatch` resolves only the submitted match. A semifinal result does not advance the other semifinal. Once both semifinals resolve, the engine creates `final` and `third_place` matches and changes to preview for the next round. Once both placement matches resolve, it creates authoritative 1st–4th standings and enters results.

### 4. Firebase transaction and rules alignment

`syncResolveKnockoutMatch` uses a room transaction keyed by the active `roundId` and refuses to overwrite an existing `matchResults[matchId]`. Firebase rules now authorize the nested match-scoped action path and host-owned bracket, assignment, match-result, and standings fields.

### 5. UI projection

`GameBoardPage.jsx` now uses the persisted assignment for the visible opponent in 3–4 mode while retaining the legacy opponent fallback for 1v1. `GameResultsPage.jsx` uses authoritative standings for completed social brackets and preserves score sorting for other modes.

## Exact files changed in this pass

| File | Change |
|---|---|
| `src/game/gameEngine.js` | Bracket creation, match assignments, match-scoped resolution, final/third-place progression, standings state |
| `src/firebase/roomService.js` | Initial bracket/assignment/result/standings fields in room schema |
| `src/firebase/gameSync.js` | Bracket metadata sync, match-scoped action path, idempotent match-resolution transaction |
| `src/context/GameStateContext.jsx` | Bracket state merge, match-scoped host action processing, assignment-based confirmation |
| `src/pages/GameBoardPage.jsx` | Assignment-based 3–4 opponent projection |
| `src/pages/GameResultsPage.jsx` | Authoritative final standings projection |
| `database.rules.json` | Match-scoped action authorization and host-owned bracket metadata rules |
| `knockout-bracket-contract.test.mjs` | Deterministic bracket, progression, idempotency, and standings contract |
| `todo.md` | Pass checklist status |
| `BRACKET_FIX_IMPLEMENTATION_REPORT.md` | This report |

## Verification evidence

| Check | Evidence |
|---|---|
| Bracket pairing and opponent assignment | `ENGINE TEST VERIFIED` — `knockout-bracket-contract.test.mjs` passed with `BRACKET_EXIT=0` |
| Match-scoped resolution and idempotency | `ENGINE TEST VERIFIED` — new contract passed |
| Final and third-place progression | `ENGINE TEST VERIFIED` — new contract passed |
| Four-player final standings | `ENGINE TEST VERIFIED` — new contract passed |
| Existing Pass 2–5 deterministic contracts | `ENGINE TEST VERIFIED` — `PASS2_5_EXIT=0` |
| Protected 1v1 regression | `ENGINE TEST VERIFIED` — `PROTECTED_EXIT=0` |
| Firebase rules syntax | `SOURCE VERIFIED` — `JSON.parse(database.rules.json)` passed with `RULES_EXIT=0` |
| Production build | `BUILD VERIFIED` — `npm.cmd run build` passed with `BUILD_EXIT=0` |
| Four real clients / live bracket flow | `NOT VERIFIED` |
| Live Firebase deployment and four-UID bracket flow | `BLOCKED BY ENVIRONMENT` — the available desktop bridge does not provide a reliable four-client interactive browser session or confirmed rules deployment command |

## Protected-system status

No changes were made to Tournament, Team Battle, Competitive Mode, game data, image paths, or the protected shared architecture. The 1v1 path remains on its existing opponent derivation and legacy confirmation/resolution branch; its deterministic regression contract passed.

## Remaining risks

Live Firebase verification remains outstanding for the actual bracket path: four independent browser UIDs, fifth-player rejection, reconnect restoration, private-target isolation, simultaneous action arrival, browser refresh during each stage, and actual final UI rendering. The rules file parses locally but has not been deployed or emulator-validated in this pass. These are explicitly not claimed as verified.
