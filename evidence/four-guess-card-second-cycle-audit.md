# NEON GUESS — Four Guess Card Second-Cycle Audit

## Scope

This is an independent second-cycle audit after the user reported that Guess Card might still be present. The audit covers the deployed Four/Tournament route, source, lazy-loaded JavaScript chunks, target projection, and the public browser entry route.

## Direct answer

The old **multi-card Guess Card / GuessGrid selection UI is not present in the current deployed Tournament gameplay chunk**. The user’s concern was valid during the first audit because the previous release really did contain `GuessGrid` in `TournamentGameplay`. That defect was repaired in commit `cff4678`.

A single **TargetCard-style panel** still exists intentionally. It contains one opponent target and is not the old Guess Card: it has no selectable grid, no multiple options, and no card-selection handler.

## Evidence

### 1. Source-level gameplay block

The actual Tournament entry path is `CompetitiveModePage.jsx` → `TournamentGameplay`. The current `TournamentGameplay` block contains:

- `TargetCard target={target} ready={actions.targetReady} mode="opponent"`;
- one `GUESS CORRECT` action;
- `actions.recordGuess(target.targetId)`;
- no `GuessGrid`;
- no `GUESS BOARD`;
- no `Choose one card`;
- no `ROUND TARGET GUIDE`.

The focused regression `scripts/tournament-natural-guess-flow.test.mjs` checks these exact constraints and passed.

### 2. Logic and private-target projection

`CompetitiveModeContext.jsx` resolves the opponent with `match.playerIds.find(id => id !== playerId)` and writes the opponent target into the viewer’s private projection while preserving `targetOwnerId`. This means the natural UI receives one opponent target instead of a list of selectable cards. The authoritative `recordGuess` action remains the submission path.

### 3. Built local artifact

The local production build completed successfully. A targeted scan of the built `CompetitiveModePage` chunk found no `GuessGrid`, `GUESS BOARD`, `Choose one card`, or related card-selection marker.

### 4. Public deployed artifact

GitHub Actions completed successfully for commit `cff4678`. Every JavaScript chunk referenced by the deployed page was audited. The deployed `CompetitiveModePage-Mh7Kx0ki.js` returned HTTP 200 and showed:

| Marker | Count |
|---|---:|
| `GuessGrid` | 0 |
| `GUESS BOARD` | 0 |
| `Choose one card` | 0 |
| `ROUND TARGET GUIDE` | 0 |
| `Target Guide` | 0 |
| `Guess Card` | 0 |
| `GUESS CORRECT` | 2 |
| `Confirm that` | 1 |
| `targetOwnerId` | 4 |

The surviving `GUESS CORRECT`, `Confirm that`, and `targetOwnerId` markers are the intended natural opponent-target flow.

### 5. Public browser route

The deployed URL `/neon-guess-game-public/tournament` loaded successfully in Chromium and rendered the `4-PLAYER TOURNAMENT` entry surface without a runtime error. The lobby does not show a Guess Card. A four-client live match was not simulated because one browser session cannot provide four independent Firebase identities.

## Why the user may still feel that a card exists

The intended replacement still uses a `TargetCard` visual panel because the game needs to show the opponent’s image and target. Therefore, a player may see one large target panel that looks card-shaped. That is different from the removed Guess Card system:

| Old Guess Card | Current intended TargetCard |
|---|---|
| Multiple selectable images/options | One opponent target |
| `GuessGrid` | No grid |
| `Choose one card` | `GUESS CORRECT` |
| Player selects an item | Player confirms the opponent’s guess |
| Generated from a category list | Read from the private opponent-target projection |

## QA decision

**Source:** PASS.

**Logic:** PASS.

**Local build:** PASS.

**Deployed bundle:** PASS.

**Public browser route:** PASS for route load and lobby surface.

**Four-client live Firebase match:** NOT VERIFIED.

**Final release decision:** CONDITIONAL. The removed multi-card Guess Card is absent from the deployed code and bundle. The only remaining unverified item is the complete four-player live match visual and synchronization path. If the user still sees multiple cards after a hard refresh, the most likely explanations are a stale browser cache, opening a different mode/route, or identifying the intentional single TargetCard as the old Guess Card; a screenshot or exact route would distinguish those immediately.
