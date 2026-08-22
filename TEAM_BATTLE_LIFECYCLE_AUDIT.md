# 2v2 Team Battle Lifecycle Audit

## Scope lock

**Target:** authoritative 2v2 team gameplay lifecycle: assignment, target ownership, target privacy, correct-guess confirmation, round resolution, three-round progression, scoring, reveal, reconnect, and stale-state handling.

**Protected:** 1v1, Tournament, Social/Competitive namespaces, authentication, room creation/joining, existing target security, and unrelated UI.

## Confirmed findings

| Finding | Evidence | Impact |
|---|---|---|
| Team Battle public root rejects non-host writes after the room starts. | `database.rules.json` `teamRooms/$roomId/.write` only permits non-host writes while `status` and `phase` are `lobby`. | `recordGuess()` and `confirmTeamGuess()` use room-root transactions, so a real non-host Firebase client cannot submit gameplay state after start. **Release-blocking.** |
| Removing Guess Board removed the only path that created `match.guesses` and `confirmationTeamId`. | `CompetitiveModePage.jsx` no longer calls `actions.recordGuess()` inside `TeamBattleGameplay`; `confirmTeamGuess()` only calls `confirmTeamRound()`, which rejects when no required confirmation team exists. | The visible confirmation button is a dead end in the simplified UI. **Release-blocking.** |
| Confirmation ownership is modeled as one locked team. | `teamBattleEngine.js` and `qa-team-battle-engine.mjs` use singular `confirmationTeamId` and explicitly reject the other team after the first team is selected. | Simultaneous correct guesses by both teams are not represented; the requested “both teams play” behavior is incomplete. **High risk.** |
| Targets are assigned once per team and private payloads carry both opponent target and an `ownedTarget` snapshot. | `assignTeamTargets()` and `writePrivateTargets()` in the engine/context. | The intended cross-view target direction is structurally present; this remains protected during repair. |
| Round transition is host-resolved and score is cumulative. | `resolveTeamRound()` calls `finishTeamRound()`, and `advanceTeamRound()` increments the round. | Host-only resolution can remain, but it must consume the new per-team confirmation state atomically. |

## Repair plan

1. Add a dedicated, narrowly scoped Firebase write for a player’s own Team Battle confirmation under `match.confirmations/{teamId}/{uid}`. Keep the public room root protected; do not broaden root permissions.
2. Add Firebase validation for authenticated player identity, team membership, active match, current round, and matching `matchId`.
3. Change `confirmTeamGuess()` to write the current player’s confirmation directly, without requiring a removed Guess Board or local `match.guesses` mutation.
4. Change the pure engine to derive one or more confirmation teams from persisted confirmations, allow simultaneous team confirmations, and resolve only when every declared confirmation team has both players.
5. Score each opposing team whose target was confirmed, preserve cumulative team/player history, and retain a deterministic final winner/tie policy.
6. Update the Team Battle UI projection and deterministic contracts to assert the new path while leaving Tournament’s GuessGrid and timer behavior unchanged.
7. Run source checks, focused engine/UI tests, protected Tournament/1v1 checks, build, and local runtime checks. Live four-client Firebase verification remains a separate gate if staging credentials are unavailable.

## Evidence labels

The rule mismatch and dead-end are **SOURCE VERIFIED**. The current deterministic engine test is **ENGINE TEST VERIFIED** for the old single-owner contract, but it is also insufficient for the requested simultaneous-team behavior. Live Firebase four-client behavior is **NOT VERIFIED** until the repaired rule and write path are exercised with four authenticated clients.
