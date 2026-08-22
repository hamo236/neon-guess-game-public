# NEON GUESS — 2v2 Team Battle Stabilization Report

## Release decision

**Conditional Ready.** The authoritative transition repair is implemented and the pure three-round contract passes deterministically. The remaining limitation is environmental: the connected Windows project shell currently does not return from Node commands, so a full Vite build and live Firebase browser run could not be completed from this session.

## Root cause identified

The confirmation button was writing directly to a separate Firebase path through `writeTeamBattleConfirmation`. The provider’s authoritative resolver, however, evaluates the public room snapshot (`match.confirmations`, `confirmationTeamId`, and round-scoped metadata) inside `mutateCompetitiveState`. This created two independent write paths. A teammate confirmation could exist in the private adapter path while the host resolver did not receive a single atomic public-state mutation containing the complete confirmation set and target snapshot.

The result was a valid-looking button interaction without a reliable transition from `playing` to `round_result`.

## Repair implemented

`CompetitiveModeContext.jsx` now records each `Guess Correct` action through `mutateCompetitiveState`, using the pure `confirmTeamRound` engine function. The mutation is round-scoped and match-scoped, is idempotent per player, preserves the defending team’s target snapshot, and becomes visible to the host resolver through the same authoritative public state that drives resolution.

The existing provider effects remain the single transition owner:

1. When both defending teammates have confirmed the current match and round, the host resolves the round through `finishTeamRound`.
2. `finishTeamRound` enters `round_result` and sets `match.revealEndTimestamp` to five seconds in the future.
3. When the timestamp expires, the host calls `advanceTeamRound` and writes the next round’s private opponent-target projections.
4. After round three, `finishTeamRound` enters `results`, marks the match finished, calculates team scores, selects the winner, and assigns player rewards.

The visual contract was not changed: the current lobby, room code, target privacy projection, compact Team Battle interface, removed timer, and removed guess board remain intact.

## Verification evidence

The new `scripts/qa-team-battle-flow.mjs` test simulates all three rounds and asserts the following deterministic contract:

| Contract | Result |
|---|---|
| First teammate confirmation does not resolve | Passed |
| Second teammate confirmation completes the defending-team gate | Passed |
| Round resolution enters `round_result` | Passed |
| Reveal timestamp is created for the five-second reveal | Passed |
| Round two and round three become playable after advancement | Passed |
| Final phase becomes `results` after round three | Passed |
| Winning team score reaches three in the deterministic scenario | Passed |
| Final winner is calculated and exposed | Passed |
| Round history contains three completed rounds | Passed |

The sandbox-side equivalent of this full flow completed successfully with the message `sandbox Team Battle flow contract passed`. The existing UI/adapter QA script remains registered in the new package script `test:team-battle` beside the new pure-flow regression test.

## Environment blocker

The connected Windows host contains multiple active Node processes and the remote shell does not return from even minimal Node commands in the current session. Consequently, `npm run test:team-battle`, `npm run build`, and an end-to-end browser/Firebase run could not be truthfully marked as executed here. This is an execution-environment blocker, not a reported application assertion failure.

Recommended final verification on the Windows project directory:

```bash
npm run test:team-battle
npm run build
npm run dev -- --host 0.0.0.0 --port 5181
```

Then perform one live four-player check: complete a correct guess, click `Guess Correct` with both defending teammates, observe the five-second reveal, repeat through round three, and confirm the final winner screen and cumulative scores.


## Pass 2 — Four-player authorization hardening

A second source audit found one remaining authoritative gap: the UI disabled the confirmation button for the non-defending team, but the pure engine accepted a direct confirmation call from any player. That was unsafe because a client could bypass the UI and join or create the confirmation gate.

The engine now rejects a confirmation when the actor’s team is not one of the current required confirmation teams, or when the persisted `confirmationTeamId` belongs to another team. This keeps the UI rule and authoritative state rule aligned.

The Team Battle UI was also tightened so `myTeamRequired` is true only when the current player belongs to the persisted defending/confirmation team. The button therefore reflects the same authority rule as the engine.

The updated project regression test includes a round-scoped assertion that a non-defending player’s confirmation is a no-op. A clean sandbox copy of the edited engine and test ran successfully:

```text
Team Battle 3-round flow QA passed: dual confirmation gate, 5s reveal state, round advancement, and final winner are deterministic.
```

The real Windows-host command `npm run test:team-battle` was attempted through the connected desktop session but remained blocked because the remote Node command did not return. This is recorded as `BLOCKED BY ENVIRONMENT`; it is not treated as a passing live project command.

## Updated release decision

**CONDITIONAL.** The authoritative engine contract and three-round state machine are source- and engine-test verified, including unauthorized-confirmation rejection. Live Firebase synchronization, browser behavior, and four independent clients remain not verified in this session because of the Windows Node execution blocker.


## Comprehensive QA and Repair Pass

### Scope

This pass reviewed the Team Battle engine, CompetitiveModeContext provider, CompetitiveModePage UI, Firebase competitive adapter, privacy sanitization, confirmation authorization, reveal projection, leave behavior, and all focused QA contracts. Protected behavior remained unchanged: room creation/joining, room codes, four-player capacity, team target privacy during play, the compact Team Battle UI, and the three-round game contract.

### Defects found and repaired

1. The UI/adapter contract test still asserted the deprecated `writeTeamBattleConfirmation` direct-write path even though the provider had moved to the atomic `mutateCompetitiveState` plus `confirmTeamRound` path. This created a false QA failure. The test now verifies the current authoritative mutation contract.

2. The round result engine did not explicitly populate the `targets` map consumed by the existing two-team reveal component. The engine now derives `roundResult.targets` for every player in each team from the completed round’s reveal snapshots. This makes the Round Result screen able to render both Team A and Team B targets deterministically.

3. The host resolver could only recover target snapshots from confirmation entries, while public-state sanitization intentionally removes those private snapshots. The resolver now combines the host’s already-synchronized private target projection with any round-scoped confirmation snapshots before calling `finishTeamRound`. Targets remain private during `playing` and are persisted only in the `round_result` reveal payload.

4. Firebase sanitization used object properties assigned to `undefined` to hide private target fields. That is unsafe for Realtime Database transactions because undefined values can be rejected or serialized inconsistently. Sanitization now removes private fields structurally using object rest destructuring. The playing `roundSnapshot` keeps non-sensitive round metadata while omitting its target.

5. The focused UI contract test did not require the two-team reveal data path. It now asserts the presence of `TeamRevealTargets` and the per-team result target lookup.

### Verification evidence

The clean sandbox verification copy passed:

```text
Team Battle 3-round flow QA passed: dual confirmation gate, 5s reveal state, round advancement, and final winner are deterministic.
Team Battle UI/adapter contract QA passed: opposing target projection, compact dual confirmation, atomic public-state mutation, removed timer/guess board, privacy sanitization, roster names, Leave control, hierarchy, and touch targets are present.
Team Battle JavaScript syntax checks passed.
```

The deterministic flow covers four players, two teams, unauthorized confirmation rejection, the two-player confirmation gate, round result state, five-second reveal semantics, Round 2 and Round 3 advancement, cumulative scoring, and final winner calculation.

### Environment status

A broad project-wide smoke copy from the Windows-mounted tree stalled during filesystem copying and was stopped. This is an environment/mount performance blocker, not evidence of a source failure. The focused clean-copy tests and syntax checks completed successfully. A real Vite production build and live four-browser Firebase session remain unverified in this sandbox because the Windows-mounted project has mixed host dependencies and the connected Windows command session has previously hung on Node commands.

### Release decision

**Conditional Ready.** The audited Team Battle source contracts and deterministic transition behavior pass after the repairs. Before production release, run `npm run test:team-battle` and the Vite build from a native Windows terminal after reinstalling dependencies in that Windows project directory, then perform a live four-client room test covering reconnect, Leave, all six confirmation clicks, three reveals, and final results.


## Pass 3 — Missing-contract audit without gameplay changes

### Gap identified

The authoritative resolver can receive a sanitized public state in which the current team target has been removed for privacy. In that case, `finishTeamRound` could correctly resolve the round and display the reveal, but the per-player `playerStats.roundHistory` target field could remain null even though the target was known to the authoritative host through the reveal snapshot.

This was a data-linkage gap, not a change to scoring or gameplay rules. It could make later result/history consumers incomplete.

### Minimal repair

`src/modes/teamBattleEngine.js` now uses the authoritative `revealTargets[playerId]` as the first source for each completed player-history target, while retaining the old current-state target as a fallback for non-sanitized pure states. No round timing, team assignment, confirmation rule, score rule, target privacy rule, or UI behavior was changed.

### Verification

The updated clean-copy flow regression passed after the repair:

```text
Team Battle 3-round flow QA passed: dual confirmation gate, 5s reveal state, round advancement, and final winner are deterministic.
```

The regression now additionally asserts that the completed target remains in player history for each round. The UI/adapter contract and JavaScript syntax checks also passed:

```text
Team Battle UI/adapter contract QA passed: opposing target projection, compact dual confirmation, atomic public-state mutation, removed timer/guess board, privacy sanitization, roster names, Leave control, hierarchy, and touch targets are present.
Team Battle syntax checks passed.
```

### Protected systems

No gameplay system was changed. The lobby, room joining, team assignment, target projection, confirmation gate, three-round sequence, five-second reveal, scoring, final results, Leave control, and compact 2v2 interface remain protected. No new feature was added.

### Current status

**SOURCE VERIFIED + ENGINE TEST VERIFIED + UI CONTRACT VERIFIED.** The live Firebase/browser/four-client check and native Windows production build remain `NOT VERIFIED / BLOCKED BY ENVIRONMENT` because the connected Windows Node session and mounted project environment do not reliably return from Node/build commands.


## Pass 4 — Historical problem review and final targeted repair

### Historical issue tracks reviewed

The 2v2 implementation history contained several distinct issue tracks rather than one single Firebase failure:

| Track | Observed failure | Root cause or status | Resolution |
|---|---|---|---|
| Development server | `Unexpected token <`, stale page, connection refused, old project opening | Vite served an incorrect/raw JSX path and multiple project copies/processes existed | Vite configuration and project-path selection were hardened; remaining host process issues are environmental |
| Firebase SDK | Modular SDK error such as `db._checkNotDeleted is not a function` | Mixed/incorrect Firebase API usage and host dependency state | Team Battle adapter uses the modular API path; live host rebuild remains environment-blocked |
| Target privacy | Players could be exposed to their own target through broad public state | Private targets and public state were not separated strictly enough | Playing public state sanitizes target payloads; player-specific target projection is used |
| Guess Board/timer UI | Old cards and countdown remained in Team Battle | UI still contained the former guessing presentation | Removed from the Team Battle contract; focused UI QA protects the removal |
| Confirmation button | Button looked disabled or did not cause progression | Confirmation was written to a separate Firebase path while resolver watched public state | Atomic `mutateCompetitiveState` + `confirmTeamRound` path is authoritative |
| Authorization | A client could bypass the disabled UI and submit as the wrong team | Pure engine did not enforce the UI’s defending-team restriction | Engine rejects unauthorized confirmations |
| Reveal targets | Reveal mounted without guaranteed targets for both teams | Result payload did not consistently populate the targets consumed by the reveal UI | `roundResult.targets` and host snapshot merge now provide both team targets |
| Firebase sanitization | Undefined private fields could be written or serialized inconsistently | Sanitizer hid fields by assigning `undefined` | Private fields are structurally deleted |
| Round history | Completed round target metadata could disappear after privacy sanitization | History did not always use authoritative reveal snapshots | History now prefers `revealTargets` and preserves completed target linkage |
| Stale target guess | A guess could be submitted before the current round’s private target arrived, or against an old round target | Handler used the local target ID without validating readiness and round identity | Handler now requires `targetReady`, matching `matchId`, and matching `roundNumber` |
| Round progression | No transition after two confirmations or no five-second reveal | Resolver/advance effects were not reliably connected to the same authoritative state | Provider owns idempotent resolve and reveal-expiry advancement |
| Leave/recovery | Leave/disconnect and refresh recovery had conflicting expectations | Room membership, left markers, saved session, and recovery were not treated as separate paths | Leave clears session and current membership; refresh recovery uses saved identity and explicit recovery state |

### Final repair in this pass

The last confirmed gap was not a new gameplay rule. `recordGuess` could calculate a guess from a missing or stale `privateTarget` before the current round’s target subscription had converged. The handler now performs all of the following checks inside the authoritative mutation path:

1. The current player belongs to a valid team and the match is playing.
2. The player has not already guessed this round.
3. The private target is ready.
4. The target belongs to the current match.
5. The target round number equals the authoritative current round.

If any check fails, the mutation returns the unchanged state. This prevents a false incorrect guess and preserves the existing gameplay system.

### Final programmed verification

A clean sandbox verification copy was completed after the repair. The dependency copy initially exposed a missing shared `modeTypes.js` file; that was corrected only in the temporary verification copy, not in production. The final run passed:

```text
Team Battle 3-round flow QA passed: dual confirmation gate, 5s reveal state, round advancement, and final winner are deterministic.
Team Battle UI/adapter contract QA passed: opposing target projection, compact dual confirmation, atomic public-state mutation, removed timer/guess board, privacy sanitization, roster names, Leave control, hierarchy, and touch targets are present.
Team Battle final focused verification passed.
```

The flow test covers four players, two teams, unauthorized confirmation rejection, stale/round-scoped history linkage, dual confirmation, reveal timing, rounds two and three, cumulative scoring, and final winner calculation. The UI contract test covers target projection, confirmation authorization, provider-owned transitions, privacy sanitization, roster names, Leave, touch targets, removed timer, and removed Guess Board.

### Final evidence status

| Evidence level | Status |
|---|---|
| Current source inspection | `SOURCE VERIFIED` |
| Pure Team Battle engine | `ENGINE TEST VERIFIED` |
| UI/adapter contract | `ENGINE TEST VERIFIED` |
| JavaScript syntax in clean verification copy | `SOURCE VERIFIED` / check passed |
| Vite production build | `NOT VERIFIED` |
| Live Firebase synchronization | `NOT VERIFIED` |
| Live browser behavior | `NOT VERIFIED` |
| Four independent clients | `NOT VERIFIED` |
| Windows-host Node/build execution | `BLOCKED BY ENVIRONMENT` |

### Final engineering decision

**CONDITIONAL READY, with the known source-level gaps repaired.** The current evidence does not justify claiming that the game is completely production-ready because the live Firebase/browser/four-client run and native Windows build were not completed in this session. No remaining source-level 2v2 defect was identified by the focused audit and deterministic checks. The remaining risk is runtime/environment verification, not an unverified assertion presented as a fix.


## Release QA Guard — Full 2v2 code and data-path audit

### Scope lock

This audit covered the Team Battle engine, CompetitiveModeContext provider, CompetitiveModePage, competitiveFirebase adapter, public and private Firebase paths, room creation/join/reconnect/leave, team assignment and switching, target projection, guess recording, confirmation authorization, host resolution, reveal expiry, round history, scoring, final results, QA scripts, package scripts, and the recent stale-target repair.

The protected gameplay contract remained unchanged: Team A versus Team B; four players; each team guesses the opponent target without seeing its own target; both defending teammates must confirm; three rounds; five-second reveal between rounds; cumulative score; final winner; no timer or Guess Board in Team Battle.

### Additional confirmed defect repaired

The adapter still exported a legacy `writeTeamBattleConfirmation` function that wrote directly to `teamRooms/.../match/confirmations/...`. The current provider no longer used it, but leaving it exported preserved a competing database contract and made it possible for future code to bypass the authoritative atomic mutation path. The function was removed from `competitiveFirebase.js`, and the UI/adapter contract test now fails if the legacy writer returns.

### Verification matrix

| Gate | Status | Evidence |
|---|---|---|
| Intent | PASS | Current implementation matches the protected 2v2 contract |
| Source | PASS | Engine, provider, page, adapter, and tests inspected |
| Scope | PASS | Only Team Battle lifecycle and QA contract files were changed |
| Syntax | PASS | Node syntax checks passed in clean verification copy |
| Deterministic logic | PASS | Three-round flow, dual confirmation, authorization, reveal, scoring, final winner passed |
| UI/adapter integration | PASS | Current public-state mutation, target privacy, reveal targets, Leave, roster, and removed legacy path passed |
| Firebase live runtime | NOT VERIFIED | No live four-client Firebase session was available |
| Browser runtime | NOT VERIFIED | Windows-host Node/dev runtime remained unavailable or stalled |
| Production build | NOT VERIFIED | Native Windows build could not be completed in the connected environment |
| Multiplayer four-client | NOT VERIFIED | Source contract is checked, but four independent live clients were not observed |
| Adjacent modes | NOT VERIFIED | Full smoke suite was blocked by the same host/filesystem execution limitation |
| Release hygiene | PASS (source scope) | No secrets or unrelated production files were introduced in this pass |

### Final focused test output

```text
Team Battle 3-round flow QA passed: dual confirmation gate, 5s reveal state, round advancement, and final winner are deterministic.
Team Battle UI/adapter contract QA passed: opposing target projection, compact dual confirmation, atomic public-state mutation, removed timer/guess board, privacy sanitization, roster names, Leave control, hierarchy, and touch targets are present.
Team Battle release-focused verification passed.
```

### Release decision

**CONDITIONAL.** The source-level Team Battle system has passed the strongest focused checks available and the competing legacy confirmation path has been removed. It must not be labeled fully release-ready yet because live Firebase synchronization, the browser runtime, native Windows build, and four independent clients remain `NOT VERIFIED` or `BLOCKED`.

### Required next release gate

From a clean native Windows terminal in the active project copy, reinstall dependencies in that same copy, run `npm run build`, run `npm run test:team-battle`, start Vite, and exercise four independent identities through room creation, join, target projection, both confirmations, reveal, rounds two and three, final results, refresh, reconnect, and Leave. Only after those observations pass should the decision be upgraded from `CONDITIONAL` to `READY`.


## Incident Review: `roundHistory.0.guesses` and inactive Guess Correct

### Confirmed Firebase root cause

The reported transaction error was real. The public-state sanitizer previously rebuilt every `roundHistory` entry with `guesses: safeGuesses`, even when the original result did not contain a `guesses` field. In that case `safeGuesses` was `undefined`, and Realtime Database rejected the transaction at `roundHistory.0.guesses`.

The sanitizer now removes the old `guesses` field from the result and adds it only when a valid guesses object exists. This prevents undefined values from entering Firebase while preserving valid historical guesses.

### Confirmed Guess Correct flow

The button is intentionally enabled only for the defending team recorded in `confirmationTeamId`, and only while the client is connected/recovered. A player from the guessing team must not be able to confirm. The action path is:

`button -> confirmTeamGuess -> mutateCompetitiveState -> confirmTeamRound -> Firebase transaction -> host resolver -> finishTeamRound -> round_result -> 5s reveal -> advanceTeam`.

The prior Firebase transaction failure occurred during the transition transaction, so the confirmation could be written but the resolver/advance transaction could not commit. That made the button appear ineffective because the round remained unchanged. The primary repair is the sanitizer fix, not a change to the game rule.

### Verification

JavaScript syntax checks passed for the edited adapter, engine, and regression script. The dependency-free Team Battle incident regression passed for dual confirmation, unauthorized confirmation rejection, reveal progression, final result, target history, and the legacy missing-guesses scenario. The full adapter-import test remains blocked in the clean sandbox because the isolated copy has no installed Firebase package; this is an environment/dependency limitation, not a source assertion of failure.

Live Firebase and four-phone browser verification remain required before a full READY release decision.


## Pass 5 — Guess Correct live-host resilience repair

### Incident

A live report showed that both players could press `Guess Correct` but the match remained in Round 1. The previous provider allowed only the host tab to execute `resolveTeamRound` and `advanceTeam`. If the host phone was backgrounded, sleeping, reconnecting, or had a stale listener, the confirmations could be persisted while no active client completed the transition.

### Repair

The provider now allows any connected Team Battle client to request round resolution and reveal advancement. Firebase transaction guards remain authoritative: current match status, confirmation completeness, reveal status, and idempotent in-flight guards prevent duplicate resolution or double advancement. No gameplay rule changed, and the page still does not own transitions.

The UI/adapter regression now asserts that resolution and advancement do not contain a live-host-only guard. The clean verification copy passed the pure incident regression, the UI/adapter contract, and JavaScript syntax checks after this repair.

Live Firebase/browser verification remains a separate release gate because the connected Windows Node environment does not reliably complete native build or browser-session commands.


## Pass 5 — Recurring route load failure

A fresh audit of the Enter Team Battle path found a concrete startup regression behind the generic `This game screen could not load` boundary. React APIs were used without a valid import in the application entry chain: `src/main.jsx` uses `React.StrictMode`, `src/App.jsx` uses `React.Component`, `lazy`, `Suspense`, and `useState`, and `src/pages/CompetitiveModePage.jsx` uses React hooks. These missing symbols can throw before the Team Battle provider mounts, making the error look like a connection failure even when Firebase is not the cause.

The three files now have one valid React import each, and duplicate imports introduced during repair were removed. The Team Battle gameplay contract was not changed. Native Windows build and browser execution remain required for final release verification because the connected host Node command is still environment-blocked.


## Final Verification Pass — Recurring Load Screen

A fresh inspection confirmed that the recurring Enter Team Battle load screen was caused by missing or duplicated React imports in the active route chain. The repaired files now have one valid import block each: `src/main.jsx` includes React for `React.StrictMode`; `src/App.jsx` includes React, lazy, Suspense, and state support; `src/pages/CompetitiveModePage.jsx` includes the hooks it uses; and `src/context/CompetitiveModeContext.jsx` includes createContext, useContext, and its hooks. The dependency-free incident regression passed after these repairs. Native Vite/browser execution remains environment-blocked and is not claimed as passed.



## Pass 6 — Historical audit follow-up and reveal-contract repair

### Audit objective

This pass re-reviewed the full historical issue inventory and traced the current Team Battle lifecycle across the engine, provider, Firebase adapter, UI, and focused QA scripts. The protected contract remained unchanged: four players, Team A versus Team B, opponent-only target visibility during play, defending-team dual confirmation, three rounds, a five-second reveal, cumulative team scoring, final results, and the existing room/lobby/Leave flow.

### Confirmed gap found

The engine and provider already produced `roundResult.targets` for both teams, and the page already defined a `TeamRevealTargets` component capable of displaying both completed-round targets. However, the `TeamResult` render path only mounted the single-target `TeamRoundSnapshotReveal` component. Therefore, the source contract for both-team reveal data existed, but the actual round-result screen did not consistently render both Team A and Team B target cards.

This was a UI integration gap, not a Firebase or gameplay-rule failure. It could make the five-second reveal appear incomplete even when the authoritative state contained both targets.

The same screen also displayed a stale sentence telling non-host players to wait for the host to start the next round, despite the provider having already been repaired to allow any connected client to request the Firebase-guarded transition. That text was misleading and contradicted the current resilience design.

### Repair implemented

`CompetitiveModePage.jsx` now renders `TeamRevealTargets` inside `TeamResult`, so the round-result phase visibly exposes the completed target for each team using the authoritative `result.targets` map. The obsolete host-only wording was replaced with a synchronized-transition message.

`qa-team-battle-ui.mjs` now fails if the both-team reveal component is defined but not rendered, and it protects the synchronized-transition wording from regressing into a host-only claim.

No team assignment, target privacy, confirmation authorization, scoring, round timing, Firebase path, room behavior, or final-result calculation was changed.

### Verification status

The source edits were inspected after modification. The Windows-host `node --version` and `npm run test:team-battle` commands did not return usable output in this session, confirming the previously recorded host execution blocker. A second attempt to create a sandbox copy through the mounted Windows filesystem also stalled during the filesystem operation and was stopped; this is recorded as an environment limitation rather than a test pass or application failure.

The focused deterministic and UI tests remain available in the project and should be run from a native Windows terminal after dependencies are installed in the active project copy.

### Updated decision

**CONDITIONAL READY — source-level reveal integration repaired.** The previous source-level gap is fixed, but the release cannot be upgraded to fully READY without a successful native Windows build, focused test command, live Firebase synchronization, and a four-client browser walkthrough.

### Required release gate

From the active native Windows project directory, run:

```bash
npm install
npm run test:team-battle
npm run build
npm run dev -- --host 0.0.0.0 --port 5181
```

Then verify with four independent identities: create and join one room, confirm both team rosters and names, start the match, verify opponent-only targets, perform the correct-guess flow, click `Guess Correct` with both defending teammates, observe both Team A and Team B targets during the five-second reveal, repeat through Round 3, confirm final scores and winner, refresh during play, reconnect, and test Leave/Disconnect behavior.


## Pass 7 — End-to-end debugging culture and Print-driven repair contract

### Objective

The debugger skill was upgraded so a Print, screenshot, console error, or report about one control is treated as an incident in a connected system rather than as a local UI defect. The new rule is mandatory: before editing, reconstruct the complete feature architecture and trace the reported point through every upstream and downstream dependency.

### Engineering method added

The new `references/end-to-end-system-mapping.md` protocol requires a redacted vertical map covering the route entry, rendered phase and control, event handler, Provider action, pure engine decision, identity and authorization guards, Firebase transaction, sanitizer, listener and snapshot merge, automatic transition resolver, next-phase initializer, downstream render, recovery, and cleanup. Every layer must be classified as `IMPLEMENTED`, `BROKEN`, `MISSING`, `NOT VERIFIED`, or `BLOCKED`.

The protocol uses a building-style search model. A defect reported on one floor cannot be repaired by inspecting that floor alone; the investigator follows the foundation, stairs, columns, and downstream floors to find the first broken connection. This is specifically intended to prevent partial repairs such as changing the `Guess Correct` button while leaving the Firebase writer, listener, reveal timer, or next-round initializer disconnected.

### Automatic-flow contract

Every automatic transition must identify its trigger, authority, preconditions, atomic write, idempotency guard, observer, next-phase initializer, rendered outcome, recovery behavior, and cleanup path. The 2v2 path is therefore checked as one chain:

```text
Room Entry → Team Assignment → Ready Check → Playing
→ Target Projection → Guess Correct → Team Authorization
→ Dual Confirmation → Firebase Transaction → Round Result
→ Five-Second Reveal → Next Round → Round 2 → Round 3
→ Final Results → Rematch or Exit
```

A changed button state, a successful function return, or a new screen on one client is not closure evidence. Closure requires authoritative state, listener convergence, automatic downstream transition, correct render, and relevant recovery paths.

### Firebase evidence contract

For each Print-driven action, the skill now requires recording the public snapshot, authorized private snapshot, exact mutation path, proposed mutation, sanitized mutation, resulting snapshots per client, unauthorized or stale-write guard, privacy boundary, and listener that triggers the next phase. This directly covers the previously observed `undefined` failure in `roundHistory`, competing confirmation writers, stale round writes, and host-dependent transitions.

### Reusable artifacts

A reusable `templates/END_TO_END_SYSTEM_MAP.md` was added. The master repair command now requires this map before editing and requires the complete vertical slice to be re-run after repair. The main `SKILL.md` references the protocol in the mandatory TRACE, REPAIR, and REPORT phases.

### Skill validation

The updated skill passed the official skill validation check. The main skill remains within the prescribed size limit at 305 lines, and both the end-to-end protocol and the system-map template are present and non-empty.

### Project audit status after this addition

The available source and clean-copy deterministic evidence remains consistent with the earlier report: the Team Battle engine covers dual confirmation, five-second reveal semantics, three rounds, cumulative scoring, final winner calculation, stale-target protection, privacy sanitization, and unauthorized-confirmation rejection. The active Windows project package identity was readable, but multiple attempts to inspect or execute deeper Windows project commands either stalled or were corrupted by the remote shell's path/quoting behavior. Therefore native Vite build, live browser behavior, live Firebase synchronization, and four-client testing remain `NOT VERIFIED` / `BLOCKED BY ENVIRONMENT` rather than being reported as passed.

### Updated release decision

**CONDITIONAL.** The engineering method is now strengthened against partial, surface-level repairs, and the source-level Team Battle evidence remains coherent. The release decision cannot be upgraded to `READY` until the native Windows project runs the focused Team Battle tests and production build, followed by a live four-client Firebase walkthrough covering confirmation, reveal, all three rounds, Results, refresh, reconnect, and Leave.


## Pass 8 — Node-and-edge contract for the complete 2v2 graph

### New engineering rule

The autonomous debugger now models Team Battle as a directed graph of authoritative nodes and guarded edges. A node is not considered complete because a component renders; its entry condition, required state, authority, guard, public/private payload, outgoing edges, observer, cleanup, recovery, and evidence must be present. An edge is not complete because a function returns; it must identify its trigger, actor identity, authorization, preconditions, authoritative write, idempotency behavior, listener, next-node initializer, and invalid-edge behavior.

### Complete node graph added

The contract now names the complete lifecycle: `ROOM_ENTRY`, `TEAM_ASSIGNMENT`, `READY_CHECK`, `ROUND_PLAYING`, `TARGET_READY`, `GUESS_RECORDED`, `CONFIRMATION_PENDING`, `FIRST_TEAMMATE_CONFIRMED`, `DUAL_CONFIRMATION_COMPLETE`, `ROUND_RESOLUTION_TRANSACTION`, `ROUND_RESULT_REVEAL`, `REVEAL_TIMER_PENDING`, `NEXT_ROUND_INITIALIZATION`, `FINAL_RESULTS`, `REMATCH_INITIALIZATION`, `ROOM_EXIT`, `REFRESH_REHYDRATION`, and `RECONNECT_RECOVERY`.

The graph explicitly prevents a repair from jumping over a missing connection. For example, `ROUND_RESULT_REVEAL` may reach `NEXT_ROUND_INITIALIZATION` only for Rounds 1 and 2 after a valid five-second expiry. After Round 3 it must reach `FINAL_RESULTS`, and no edge to Round 4 exists.

### Guess Correct node chain

The contract explicitly connects the action as follows:

```text
GUESS_CORRECT_CLICK
→ ACTOR_ID_AND_TEAM_VALIDATION
→ CURRENT_MATCH_ROUND_VALIDATION
→ FIRST_OR_DUPLICATE_CONFIRMATION_CHECK
→ CONFIRMATION_WRITE
→ LISTENER_CONVERGENCE
→ WAIT_FOR_SECOND_DISTINCT_TEAMMATE_ID
→ DUAL_CONFIRMATION_GUARD
→ ATOMIC_RESOLUTION
→ ROUND_RESULT_REVEAL
```

The first teammate writes `confirmations[teamId][playerId1]` with the current `matchId` and `roundNumber`. A repeated click by the same ID is idempotent and cannot satisfy the gate. The second confirmation must come from a distinct `playerId2`, belong to the same authorized defending team, and carry the same match and round identity. Only then may the authoritative resolver commit one result, one score update, one reveal identity, and one five-second expiry marker. The committed reveal is then observed by all clients, and its expiry may initialize the next valid node.

### Reusable artifact

Added `templates/TEAM_BATTLE_NODE_EDGE_MAP.md`, which provides incident metadata, node matrix, edge matrix, dual-ID proof table, first-broken-edge section, and complete-path verification gates.

### Validation

The official skill validator passed. The node contract and template are present and non-empty, and the main skill references the node contract in the mandatory trace, Team Battle audit, and reusable-resource sections.

### Status

This is a debugging and verification capability upgrade. It does not alter Team Battle gameplay rules, team assignment, target privacy, confirmation requirements, round count, reveal duration, scoring, results, or rematch behavior. The project release status remains **CONDITIONAL** because live Windows build, browser, Firebase, and four-client gates are still not verified.


## Pass 9 — Unified operating system for the complete Skill

### Objective

The accumulated references and contracts are now connected through one stateful operating system. They are no longer a flat collection of instructions that may be consulted in an arbitrary order.

### Mandatory state path

```text
S0 INTAKE → S1 IDENTITY_AND_SCOPE → S2 KNOWLEDGE_BASELINE
→ S3 EVIDENCE_COLLECTION → S4 SYSTEM_MAP → S5 NODE_EDGE_TRACE
→ S6 ROOT_CAUSE_GATE → S7 REPAIR_PLAN → S8 SCOPED_EDIT
→ S9 LOCAL_PROOF → S10 INTEGRATION_PROOF → S11 RUNTIME_PROOF
→ S12 RELEASE_DECISION → S13 MEMORY_AND_REPORT
```

A state may return backward when information is missing, but it may not be skipped. Each state has an entry condition, required artifact, exit gate, and return route. This makes the Skill behave like a controlled system: it knows what it currently knows, what it does not know, which reference or evidence provider can answer the gap, and what must be updated after the answer is obtained.

### Knowledge registry and return loop

The new `knowledge_registry` records known facts, assumptions, unknowns, evidence needed, selected references, findings returned from those references, and blocked gates. For example, if the authorization rule is unclear, the workflow returns to the Gameplay Constitution. If the 2v2 transition connection is unclear, it returns to the Team Battle node contract. If the Firebase boundary is unclear, it returns to the Firebase state-boundary reference or a live snapshot provider. After retrieval, the relevant system map, node map, and gate status must be updated before execution continues.

### Preservation rule

Existing capabilities are preserved and linked rather than deleted: EGRP, Gameplay Constitution, Manus 1.6 Lite profile, engineering memory, hidden-risk audit, Firebase contract, end-to-end system map, node-edge contract, master repair command, escalation protocol, and release gates all remain available through the routed operating system.

### Validation

The official skill validator passed. The unified operating-system reference exists, the `knowledge_registry` and `S0 INTAKE` routing are referenced by `SKILL.md`, and the main skill remains below the authoring limit at 325 lines.

### Release status

This is a workflow and debugging-capability upgrade only. No 2v2 gameplay rule was changed. The project release decision remains **CONDITIONAL** because native Windows build, live browser, live Firebase, and four-client runtime gates remain unverified.


## Pass 5 — Guess Correct required-team edge repair

### Confirmed first divergence

The authoritative Team Battle engine computed a set of required confirmation teams from correct guesses, but `confirmTeamRound()` still rejected a player whenever their team differed from the legacy single `match.confirmationTeamId`. The UI also considered only the first confirmation-team ID. This created a concrete dead edge: a valid required team could be visible in the state but unable to enter the confirmation chain.

### Scoped repair

The engine now authorizes a confirmation when the actor team is included in the authoritative required-team set and still enforces the existing player, team, match, round, and duplicate-confirmation guards. The legacy single-team rejection was removed; no gameplay rule was changed.

The UI now derives eligible confirmation teams from persisted confirmation IDs, the legacy confirmation ID, current-round confirmations, and correct guesses recorded in the authoritative match state. It enables the button only for a two-player team that is currently required, while preserving the existing `hasConfirmed` and `canMutateCompetitive` gates.

The deterministic Team Battle QA flow now includes a regression case in which both teams have required confirmations. It verifies that the first team reaches completion but the match still waits for the other required team, and that the full set completes only after distinct teammate IDs from both teams confirm.

### Verification matrix

| Check | Result | Evidence |
|---|---|---|
| Pure engine dual-required-team confirmation | **TEST VERIFIED** | Temporary deterministic test passed: both teams completed only through distinct teammate IDs. |
| UI and engine static contract | **TEST VERIFIED** | Static regression check passed; multi-team guard is present and legacy single-team rejection is absent. |
| Existing Team Battle QA command | **BLOCKED** | Windows project path resolution/command execution returned no usable test output; no successful npm result was claimed. |
| Vite build | **NOT VERIFIED / BLOCKED** | Windows Node/Vite execution remains unavailable in this environment. |
| Browser and four-client Firebase | **NOT VERIFIED / BLOCKED** | Requires a responsive native runtime and live Firebase room. |
| Protected gameplay constitution | **SOURCE VERIFIED** | Three rounds, distinct teammate confirmations, target privacy, five-second reveal, scoring, results, and no-host-only transition ownership were preserved. |

### Release decision

The source-level defect has been repaired and focused deterministic evidence passes. The release status remains **CONDITIONAL** until the Windows build, browser load, live Firebase transaction, synchronized five-second reveal, and four-client Team Battle scenario are verified in a responsive native environment.


## Guess Correct 0/2 Confirmation Repair Pass

### Incident evidence
The live UI reached the Team Battle gameplay screen and rendered `TEAM A GUESSED CORRECT` with `0/2 CONFIRMED`. This proves the route-load failure was no longer the first blocker and that the public room state contained a correct guess. Source tracing showed that the confirmation button remains disabled whenever `actions.canMutateCompetitive` is false, even after a valid room snapshot has been received.

### Confirmed divergence
`CompetitiveModeContext` initialized `canMutateCompetitive` from a connection-state flag. The room listener could successfully deliver an authoritative room snapshot before the separate connection listener had emitted `online === true`. In that window, the provider set the game state to ready but left `connectionState` at `connecting`, so the UI showed the confirmation card and `0/2` state while the button was falsely non-writable.

### Scoped repair
When Firebase is configured and a valid room snapshot is received while `connectionOnlineRef.current` is still `null`, the provider now treats that snapshot as the first successful realtime handshake and sets the connection state to `connected` or `recovered` according to the existing freshness logic. This does not bypass Firebase errors, reconnecting state, player identity, team membership, the two-player requirement, or the distinct-ID guard.

### Verification
The focused static regression passed. It confirms that the room-snapshot readiness repair exists, that `canMutateCompetitive` retains its connected/recovered gate, that the UI retains the team/duplicate/mutation guards, and that the engine retains the required-team and 2/2 distinct-player checks. The Windows Vite server also returned HTTP 200 after the repair. The sandbox deterministic Firebase-import test timed out because the mounted Firebase module keeps an open runtime handle; it produced no assertion failure and was terminated. Live four-client Firebase progression remains not verified in this environment.

### Release classification
CONDITIONAL: source repair and static checks pass; live four-client confirmation, five-second reveal, round-two/three transitions, and final results still require browser verification on the Windows host.

## End of Guess Correct 0/2 Repair Pass



## Fail-Closed Guess Correct Repair — Executed from Antigravity Plan

The active source was compared against Antigravity's proposed repair. Two concrete gaps remained. In `teamBattleEngine.js`, `confirmTeamRound` used a conditional rejection that did not reject an empty required-team list. In `CompetitiveModePage.jsx`, `myTeamRequired` did not require a non-empty authoritative required-team list. Both gaps were repaired without changing the 2v2 rules: empty or missing metadata now blocks confirmation, and only a valid two-player team included in the required list can confirm.

A focused regression script was added at `scripts/qa-guessed-correct-repair.mjs`. It verifies no-guess fail-closed behavior, Team A guessing Team B target, Team B-only authorization, distinct teammate IDs, duplicate confirmation rejection, reverse-direction Team B to Team A authorization, round-result entry, future reveal timestamp, Round 2 transition, Round 3 final results, winner presence, and the no-Round-4 invariant.

Evidence from the active Windows project: `node scripts/qa-guessed-correct-repair.mjs` returned `QA_EXIT=0`; the existing `npm run test:team-battle` returned `TEAM_QA_EXIT=0`. A production build attempt timed out without output and is therefore not marked as passed. Live four-client Firebase verification remains a separate unverified gate.

Release status after this pass remains **CONDITIONAL** until native Windows build and four-client Firebase verification prove `0/2 -> 1/2 -> 2/2 -> 5-second Reveal -> Round 2 -> Round 3 -> Results` on independent clients.


## 1v1 Reference Adaptation Repair — 2026-08-20

The 1v1 Guess Correct lifecycle was compared against Team Battle before modification. The reusable pattern is the separation of UI eligibility, an authoritative confirmation action, pure-engine state transition, Firebase/public-state convergence, reveal timestamp creation, and automatic next-phase advancement. The incompatible 1v1 assumption is single-player confirmation; Team Battle retains its required two distinct teammate IDs and required defending team guard.

The Team Battle engine now preserves a confirmer's `targetSnapshot` in the authoritative confirmation record when supplied. This aligns the confirmation-to-reveal handoff with the 1v1 lifecycle while preserving Team Battle privacy and dual-confirmation rules. Deterministic verification passed for both guess directions, wrong-team rejection, first confirmation at 1/2, duplicate-ID rejection, second distinct teammate at 2/2, round result, five-second reveal timestamp, Round 2 transition, three-round final results, and prohibition of Round 4.

Evidence artifact: `/home/ubuntu/team_battle_1v1_reference_test.mjs`.

Runtime status remains conditional until live four-client Firebase verification is completed.


## Pass 10 — Fail-closed confirmation readiness repair — 2026-08-20

### Confirmed defect

A remaining edge existed between the public correct-guess state and the private target subscription. The Team Battle confirmation UI and provider could reach the confirmation action while the current private target was not yet ready, or while its match/round identity was stale. The pure engine accepted a confirmation with a missing or incomplete target snapshot. This could allow a `1/2` or `2/2` confirmation to be written without a renderable authoritative reveal snapshot.

### Scoped repair

The Team Battle engine now rejects confirmation unless the target snapshot contains both a target identity and a target name. The provider now requires `targetReady`, a current private target, a matching `matchId`, and a matching current round before creating the snapshot or entering the Firebase transaction. The UI button now remains disabled until the same target-readiness gate is satisfied. Team assignment, target privacy, dual confirmation, round count, reveal timing, scoring, and transition authority were not changed.

### Verification

The new negative cases passed: no private target and incomplete target snapshot both fail closed. The existing positive flow passed for both guess directions, wrong-team rejection, distinct teammate IDs, duplicate protection, round result, five-second reveal timestamp, Round 2, Round 3 final results, winner presence, and no Round 4. The UI/adapter contract passed with the new readiness assertion. The broader Team Battle flow command remained blocked by the mounted-filesystem timeout when executed as a combined command; this is not treated as an application failure because the focused patched flow and UI contract both returned exit code 0.

### Status

Source-level confirmation readiness is repaired and focused verification is passing. Native production build, live Firebase synchronization, browser runtime, and four-client testing remain required before upgrading the release decision from **CONDITIONAL** to **READY**.


## Pass 11 — Full 2v2 audit: confirmation deadlock identified and repaired — 2026-08-20

### SOURCE VERIFIED defect

The Team Battle page no longer renders the legacy GuessGrid or calls `recordGuess`; its live gameplay path presents the synchronized opponent target and the `Guess Correct` confirmation control. However, the control's `myTeamRequired` condition depended only on an existing `match.guesses.correct` or prior confirmation-team marker. A fresh Round 1 therefore had a circular gate: the confirmation could not be clicked until a correct guess existed, while the current UI had no action that could create that guess. The engine also rejected a first confirmation when no required team had yet been established.

### Repair

The authoritative engine now derives the initial defending/confirming team from a valid synchronized owned-target snapshot when no legacy guess record exists. It still rejects missing or incomplete snapshots, unknown teams, wrong-team actors, duplicate confirmations, stale round IDs, and wrong match IDs. The UI now allows the button only when the player belongs to a valid two-player team and the synchronized owned target belongs to that same team; connection, target readiness, and duplicate-confirmation guards remain active.

### Regression evidence

`qa-guessed-correct-repair.mjs` passed, including the newly added real-UI-path case: no legacy guess record plus valid owned-target snapshot creates the first confirmation, while no snapshot still fails closed. The reverse direction, both teammates, duplicate protection, reveal, next round, Round 3 final results, and no Round 4 assertions also passed. `qa-team-battle-ui.mjs` passed with the updated contract. `qa-smoke.mjs` passed. The broader `qa-team-battle-flow.mjs` did not return within the 25-second mounted-filesystem timeout; it is classified **BLOCKED**, not failed. This is consistent with the known Windows-mounted execution issue.

### Protected-contract review

The repair records **NO CONSTITUTION CHANGE**. It preserves exactly two teams, stable assignments, target privacy, two-player confirmation, three rounds, five-second reveal, cumulative scoring, host-independent guarded transitions, refresh/Leave separation, and cross-mode boundaries. No direct Firebase writer was introduced.

### Current decision

Source-level and focused/adjacent contract evidence is passing. Native build, browser route runtime, live Firebase transaction behavior, and four-client synchronization remain **NOT VERIFIED/BLOCKED** by the Windows mounted execution environment. Release status remains **CONDITIONAL**, not READY.


## Release QA Guard — Latest correction audit — 2026-08-20

### Confirmed audit result

The active Team Battle confirmation path was re-traced from the UI through `confirmTeamGuess`, `mutateCompetitiveState`, `confirmTeamRound`, the Firebase sanitizer, the resolver, `finishTeamRound`, the five-second reveal, and `advanceTeamRound`. The current owned-target-first confirmation repair is internally consistent: `writePrivateTargets` stores the opponent target at the top level and the player's owned target in `ownedTarget`; `confirmTeamGuess` validates target readiness, match identity, and round identity, then supplies the owned target snapshot with the player's team ID; `confirmTeamRound` uses that snapshot to establish the defending team when no legacy guess record exists.

The suspected next-round private-target risk was investigated and is not a source defect: although `mutateCompetitiveState` returns sanitized public state, `advanceTeam` deterministically regenerates the next-round `targetMap` from the new round/category/team assignment before invoking `writePrivateTargets`. No direct writer or gameplay-rule change was needed.

### Verification

`qa-guessed-correct-repair.mjs` passed. `qa-team-battle-ui.mjs` passed. `qa-smoke.mjs` passed. Dependency-free syntax checks passed for `teamBattleEngine.js`, `qa-guessed-correct-repair.mjs`, `qa-team-battle-flow.mjs`, `qa-team-battle-ui.mjs`, and `qa-smoke.mjs`.

The mounted copy's broader `qa-team-battle-flow.mjs` reached a 20-second timeout because it imports the Firebase adapter through the slow Windows-mounted environment; it produced no assertion failure and is classified `BLOCKED BY ENVIRONMENT`. An earlier clean-copy attempt was incomplete and failed with `ERR_MODULE_NOT_FOUND` for the copied Firebase module, so it is not evidence against the production source and is classified `NOT VERIFIED`.

### Release decision

**CONDITIONAL.** No additional source-level release-critical defect was confirmed in this pass. Focused engine/UI/smoke checks pass. Native Windows Vite build, live browser route, live Firebase transactions, and four independent clients remain `NOT VERIFIED`/`BLOCKED`; they must not be reported as passed.

## Smoothness Audit and Correction Plan — 2026-08-20

### Scope
Reviewed the protected 2v2 lifecycle from room entry and team roster presentation through target readiness, Guess Correct, dual confirmation, round result/reveal, next-round initialization, final result, Leave, refresh/recovery, disconnect indicators, and closed-room behavior. The gameplay constitution and node-edge contract were used as acceptance criteria. No gameplay rule amendment was authorized or made.

### Confirmed smoothness gaps

1. **Closed-room feedback gap:** `status === 'closed'` with no active state returned directly to the lobby without explaining that the active room or match had ended. This was a user-facing lifecycle gap, not an authority defect.
2. **Visible text corruption:** the Team Battle page contained mojibake separators and ellipsis glyphs in connection, room, target, round, result, and Leave labels. This degraded readability and made the flow appear unstable when the underlying state was valid.
3. **Redundant reveal card:** the round result rendered the authoritative two-team reveal and an additional single-target snapshot card. The extra card was removed from the result composition to make the reveal state unambiguous while retaining the required two-team reveal.

### Minimal repair applied

`src/pages/CompetitiveModePage.jsx` now shows an assertive closed-room message when no active state exists, uses readable separators and ellipses in the affected Team Battle labels, replaces the corrupted trophy glyph with the existing Material Symbols icon, repairs the PlayerList JSX expression, and renders one clear two-team reveal block per completed round. Team assignment, target privacy, Guess Correct authority, dual-ID confirmation, round count, reveal timing, scoring, Firebase mutation paths, and Leave/Refresh semantics were not changed.

### Verification status

The combined focused and broad scripts were started from the Windows-mounted path but did not return within the bounded timeout. A separate focused run also did not return within its bounded timeout. This is classified as **BLOCKED BY ENVIRONMENT / NOT VERIFIED**, not as an assertion failure. The edit itself requires a Native Windows Vite build or a local clean copy with dependencies to fully verify JSX compilation and browser rendering.

### Planned QA gates

Run `npm run build` from a native Windows terminal; load the Team Battle route; create and join a four-player room; verify team assignment and opponent-only target visibility; execute all three rounds with two distinct confirmer IDs; observe the five-second reveal and synchronized next round; test refresh, reconnect, intentional Leave, and closed-room messaging; then run the existing 1v1 and project smoke regressions. Acceptance remains **CONDITIONAL** until these runtime gates return results.

**Constitution check: NO CONSTITUTION CHANGE.**

**Correction plan status: UI smoothness repairs applied; runtime/build gates remain pending due to the mounted Windows execution blocker.**

## End Smoothness Audit



## Release QA Correction Pass — Recovery Markup and Smoothness Contracts

**Scope:** Apply the approved smoothness plan without changing the Team Battle gameplay constitution.

### Confirmed defect repaired
The page contained malformed recovery JSX in the `restoring` state:

```text
Restoring room </strong>...ecovery.roomId}</strong>â€¦
```

This was a real visible/runtime-risk defect because the recovery status could render corrupted markup and an invalid room identifier. It was repaired to:

```jsx
Restoring room <strong>{recovery.roomId}</strong>...
```

The remaining approved Team Battle readability issues were also normalized: loading labels, player-count separator, and synchronized-transition copy. A duplicated period in the transition message was removed.

### QA contract corrections
The UI contract now asserts the readable transition copy and the explicit closed-room message. The connection-recovery contract now asserts the repaired hyphenated status messages and valid restoring-room markup.

### Evidence
- `qa-team-battle-ui.mjs`: PASS.
- `qa-connection-recovery.mjs`: PASS.
- `qa-guessed-correct-repair.mjs`: PASS.
- `qa-smoke.mjs`: PASS.
- Broad `qa-team-battle-flow.mjs` run from the mounted filesystem exceeded the bounded execution window; no assertion failure was returned before the environment timeout. This remains an environment blocker, not a confirmed gameplay failure.

### Protected-rule audit
No changes were made to team assignment, target privacy, dual confirmation, Firebase authority, reveal duration, three-round structure, scoring, Leave semantics, or 1v1 gameplay rules.

**Status:** Source correction verified by focused and smoke contracts. Production Build, live browser route, live Firebase, and four-client synchronization remain CONDITIONAL until executed from a responsive Native Windows environment.


## Round 3 Final Results and Master Controls Audit — 2026-08-20

### Confirmed defect
The Team Battle page previously routed only `round_result` into `TeamResult`. The authoritative engine correctly returns `status: 'finished'`, `phase: 'results'`, `match.status: 'finished'`, and `finalResult` after Round 3, but the page-level branch did not mount a final-results component for that status. This made the final score screen unreachable after the third round.

### Scoped repair
`CompetitiveModePage.jsx` now routes both `round_result` and `finished` states through `TeamResult`. The finished branch mounts `FinalTeamResult` and renders the authoritative winner, team scores, player results, and final actions.

The room master is the only player who receives the rematch preferences and Rematch action. The selection is limited to the first three existing `CATEGORY_META` options and calls the existing authoritative `startMode(selectedCategory)` method, which requires `state.hostId === playerId`, exactly four players, valid teams, and rewrites synchronized public/private state. Non-host players see a waiting message and cannot select a type or start a rematch. Dashboard and Leave are available to all players; Leave uses the existing authoritative leave action and then returns to `/`.

### Protected rules
No change was made to target privacy, dual confirmation, team assignment, three-round structure, reveal timing, scoring, Firebase authority, or the 1v1 mode.

### Evidence
`qa-team-battle-ui.mjs`: PASS after updating its contract for both `round_result` and `finished` routing, final-result rendering, host-only controls, and Dashboard/Leave presence.
`qa-guessed-correct-repair.mjs`: PASS.
The broad lifecycle runner remains environment-blocked when executed from the Windows-mounted filesystem and must be rerun from a responsive native Windows project directory for live four-client/Firebase verification.

### Release status
Source-level final-screen routing and permission contracts are repaired and focused checks pass. Release remains CONDITIONAL pending native Windows Vite build, browser route test, live Firebase transaction verification, and four-client Round 3/rematch test.


## Release QA Gate — Round 3 final-results repair

Focused source contracts remain passing after the final-results routing and master-only action repair:

```text
Team Battle UI/adapter contract QA passed
qa-guessed-correct-repair: PASS
```

The real project build was attempted with `npm run build` from the mounted project directory. Vite returned `sh: 1: vite: Permission denied` with exit code 126. This is classified as `BLOCKED BY ENVIRONMENT / DEPENDENCY INSTALLATION`, not as a source assertion pass or a successful build. The next valid gate is to reinstall dependencies from a native Windows terminal in the active project directory and rerun `npm run build` there.

Release decision remains `CONDITIONAL`; no claim of production readiness is made from the focused tests alone.


## Rematch Hardening Correction — 2026-08-20

### Confirmed defect addressed
The smoothness audit identified a P2 hardening gap in the Team Battle rematch path: the Provider needed an authoritative finished/results-phase guard and an in-flight idempotency guard so a repeated Master click could not start duplicate rematches or start a rematch from an active/non-finished state.

### Repair
`CompetitiveModeContext.jsx` now guards Team Battle rematch with the authoritative finished/results state and `teamStartInFlightRef`. Duplicate starts are rejected while the first start is in flight. `CompetitiveModePage.jsx` now mirrors the finished/results guard through `isFinishedResults` and disables the Rematch control outside that state or while an action is pending. Host-only category selection and Rematch permissions remain intact.

### Evidence
- `qa-team-battle-ui.mjs`: PASS.
- `qa-guessed-correct-repair.mjs`: PASS.
- Syntax checks for the focused MJS contracts: PASS.
- `qa-team-battle-flow.mjs`: exit 124 after the bounded timeout on the Windows-mounted project path; no assertion output was emitted, so this is classified as an environment/harness blocker, not a logic pass.

### Protected-system check
No changes were made to team assignment, target privacy, Guess Correct authorization, dual confirmation, Reveal timing, three-round structure, scoring, Firebase authority, or 1v1 behavior. Release status remains CONDITIONAL until production build and live four-client Firebase gates run from a responsive native Windows environment.

## Reversible Team Confirmation Audit — 2026-08-20

### Requested behavior
A player may press the current Team Battle Guess Correct control again to withdraw only their own current-round confirmation before the teammate completes the required pair. A completed 2/2 pair remains immutable and cannot be cancelled by either player after resolution is eligible.

### Implementation
- `teamBattleEngine.confirmTeamRound` now acts as an authoritative per-player toggle: a current pending confirmation is deleted on the second click; a completed pair returns state unchanged.
- The engine preserves the valid required team derived from the correct guess while removing only the current player's confirmation.
- `CompetitiveModeContext.confirmTeamGuess` continues to use the existing atomic public-state mutation and current private-target/match/round guards.
- `CompetitiveModePage` now labels a current player's own confirmation as `CANCEL CONFIRMATION - n/2`, uses an undo icon, and disables cancellation once `confirmedIds.length === 2`.
- No player can remove another player's confirmation; no change was made to team assignment, target privacy, scoring, dual confirmation, Reveal, round count, or 1v1 behavior.

### Verification evidence
- `qa-guessed-correct-repair.mjs`: PASS, including cancel, reconfirm, second toggle, distinct teammate completion, Reveal, Round 2, reverse direction, Round 3 results, and no Round 4.
- `qa-team-battle-ui.mjs`: PASS after updating the contract for the intentional toggle predicate.
- Syntax checks for the focused regression scripts: PASS.
- Broad mounted-filesystem flow harness: timed out after the bounded limit; no assertion failure was emitted before timeout. Classified as environment/harness blocked, not a logic pass.

### Release classification
The reversible confirmation change is conditionally verified by deterministic engine and UI contracts. Native production build, live Firebase, and four independent clients remain required before a READY release decision.

## Fresh Room-Scoped Targets Audit and Repair — 2026-08-20

### Confirmed defect
Team Battle target generation used fixed deterministic offsets. Because the input sequence/category remained stable, a newly created room or rematch could receive the same Team A and Team B targets in Round 1, Round 2, and Round 3. This violated the required room freshness invariant while preserving the existing within-room round pattern.

### Repair
Extracted target generation into `src/modes/teamBattleTargetPlan.js`. The planner now sorts category items deterministically by a room-scoped seed derived from `teamRoomId:createdAt`, selects two distinct targets per round, advances by two items per round, and maps each target privately to the players of its owning team. The Provider uses this planner at room start and every Team Battle round advance. Same room seed converges across clients; a new room/rematch seed produces a new sequence.

### Regression evidence
`qa-team-battle-target-freshness.mjs` PASS: all three supported categories, three rounds, distinct Team A/Team B targets, six distinct targets across the three-round room sequence, same-seed deterministic convergence, different-room sequence variation, and team-scoped player mapping. Syntax checks for the new planner and regression PASS.

### Protected rules review
No changes to team assignment, target privacy projection, dual confirmation, Guess Correct toggle, Reveal duration, scoring, round count, results, Rematch permissions, or 1v1 behavior. The change is limited to target sequence generation and persistence inputs.

### Remaining gates
Live Firebase write/read convergence, production build, and four-client browser testing remain dependent on a responsive Native Windows execution path. Current source-level target-freshness status: VERIFIED by deterministic regression; release status remains CONDITIONAL until live gates pass.
