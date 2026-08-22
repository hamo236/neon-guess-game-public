# Safety Contract: Post-Round Social Reactions

## Feature
Add a lightweight post-round reaction moment to `GameResultsPage` with four quick reactions: GG, Rematch, Wow, and Close.

## Purpose / user problem
Results currently end in standings and navigation controls. A fast, low-friction reaction gives the player a small moment of expression and closure without adding chat friction or changing match authority.

## Repository evidence
`GameResultsPage.jsx` already owns the round/final results projection, standings, action error feedback, and rematch/leave controls. The requested insertion point is inside the existing results card before navigation controls.

## Research evidence
The selected pattern is the evidence-first workflow's recommended non-authoritative post-round social moment. This slice intentionally avoids a new multiplayer data contract until a live product signal justifies it.

## Files and symbols inspected
- `src/pages/GameResultsPage.jsx`
- `src/context/GameStateContext.jsx` (authoritative state boundary from existing project context)
- `src/components/game/MatchTimeline.jsx`
- `package.json`
- `scripts/qa-smoke.mjs`

## Files allowed to change
- `src/pages/GameResultsPage.jsx`
- `src/context/GameStateContext.jsx`, only to expose the already-enforced non-host reset rejection as a user-facing error required by the existing smoke contract.
- This safety contract and an optional retrospective artifact.

## Protected files and systems
Firebase writes/listeners, room/match/round state, scoring, voting, target privacy, rematch authorization semantics, navigation routes, tournament branches, and existing chat history are protected and must not change. The existing host guard may only gain its explicit rejection message; it must not gain a new write or change authority.

## Data affected
Only component-local reaction state and a short-lived local UI acknowledgement. No Firebase path, database schema, player profile, score, vote, chat, or match data is affected.

## Firebase paths or operations affected
None.

## State affected
Local React state only: selected reaction and acknowledgement label. It is reset when the results component unmounts or the user chooses another reaction.

## Rounds / matches / rooms / modes affected
The UI is available on the existing round/final results screen for all modes. It does not alter any mode-specific state or progression.

## Direct impact
One new presentational section and one local click handler in `GameResultsPage.jsx`, plus a one-line user-facing rejection message in the existing `resetMatch` guard so the already-rejected action is observable.

## Indirect impact
Improves emotional closure and may create a future product signal, but has no authority or synchronization impact.

## Potential regressions
Layout crowding on small screens, accidental duplicate buttons, accidental mutation of authoritative state, and interaction overlap with rematch/leave controls.

## Potential race, stale-state, mobile, performance, or AI-agent risks
No network race exists because the feature performs no asynchronous or Firebase operation. Mobile risk is limited to button wrapping and touch target size. The reaction choice must never be interpreted as a vote or game action.

## Prevention plan
Use semantic buttons with accessible labels, local state only, a bounded four-item list, no new dependency, no context action, and no writes. Keep the section visually separate from rematch/leave controls.

## Rollback plan
Remove the reaction state, handler, and section from `GameResultsPage.jsx`; no migration or data cleanup is required.

## Verification plan
Run source smoke checks, `npm test`, and `npm run build`. Inspect the complete diff. Confirm there are no new imports, Firebase calls, context actions, schema changes, or protected-file edits. Runtime and multi-client behavior remain subject to user/browser verification.

## Open questions
Whether reactions should later be shared across clients is intentionally deferred until a product experiment defines moderation, persistence, rate limiting, and authoritative ownership requirements.
