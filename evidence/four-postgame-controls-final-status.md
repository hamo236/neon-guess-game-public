# Four-player Post-Tournament Controls — Final Status

Date: 2026-08-24
Repository: `hamo236/neon-guess-game-public`
Scope: Four-player Tournament only, with protected 1v1 and 2v2 behavior.

## Requested behavior and implementation

After the Final and Third Place matches have completed, every participant still receives the complete placement ledger: Champion, 2nd Place, 3rd Place, and 4th Place. The room creator is identified from the Firebase-authoritative `hostId` and receives a host-only control deck.

The host control deck provides a category selector and a `RETRY GAME` action. Retry rebuilds the same four-player tournament in the same room using the selected category, recreates both Semi-Final branches, regenerates private targets, and keeps the same host and roster. It does not alter tournament rules, scoring, timers, target privacy, or match progression algorithms.

All participants receive `RETURN TO LOBBY`, which uses the existing authoritative leave action. `CHOOSE ANOTHER MODE` performs the same leave operation and then navigates to the mode selection home route. The page-level pending-action guard disables the controls during asynchronous work and prevents duplicate submissions.

## Refresh continuity

Competitive session persistence now keeps `resumeAfterRefresh` enabled for Four-player states after the lobby, including finished results. The existing recovery effect therefore restores a saved Four-player room after refresh. Team Battle retains its previous behavior: its existing `activeMatch`-based persistence condition remains unchanged.

## Leave semantics

For Four-player Tournament rooms, leaving by any participant removes the tournament room and its private-target subtree. This is intentional: a single departure must not leave the opponent or other participants inside a stale match. Every connected client observes the room removal, clears its local session, and returns to the Tournament lobby surface. Host leave continues to use the same removal behavior.

## Files changed

| File | Change | Protected scope |
|---|---|---|
| `src/pages/CompetitiveModePage.jsx` | Host-only final-result controls, category selection, retry/lobby/mode actions, and mobile-friendly action wiring | Four-player render branch only |
| `src/context/CompetitiveModeContext.jsx` | Four-player `resetTournament`; Four-only refresh persistence; exported action | Shared provider with explicit mode guards; 2v2 persistence preserved |
| `src/firebase/competitiveFirebase.js` | Four-only room removal when any participant leaves | 1v1 and 2v2 leave branches unchanged |
| `src/index.css` | Scoped final-results control-deck styling, phone stacking, focus, landscape, and reduced-motion rules | `.ng-tournament-final-results*` only |

## Reference and safeguards

The existing 1v1 results flow was used as the behavioral reference for play-again, leave, and navigation semantics. No 1v1 source file was changed. No Firebase rules were changed. No tournament engine, target assignment, target privacy, scoring, timer, round transition, or bracket code was changed.

## Verification

- `npm run build`: PASS.
- `npm test`: PASS; smoke contracts passed for invite, timeline, rematch, host guards, gameplay async guards, recovery projection, competitive guards, daily drop, and dead-link contracts.
- `npm run test:team-battle`: PASS; flow, UI, adapter, and target freshness checks passed.
- `git diff --check`: PASS.
- Source audit: PASS; retry is guarded by tournament mode and `hostId`; leave removal is guarded by `mode === 'tournament'`; the 2v2 `activeMatch` session condition remains intact.

A live four-player room was not created during this verification pass, so this report does not claim an end-to-end Firebase multi-device execution of the new retry and departure flow. The implementation was verified by production compilation, existing smoke contracts, source-level guard checks, and protected-mode regression checks. A real four-player acceptance pass should exercise: host retry with same category, host retry with a different category, refresh on the finished screen, non-host leave, and simultaneous lobby return on the remaining device.

## Release decision

**CONDITIONAL READY for deployment.** The code is buildable and protected-scope checks pass. The remaining gate is a real multi-device acceptance test in a Firebase-configured environment for the new post-game controls and paired-exit behavior.
