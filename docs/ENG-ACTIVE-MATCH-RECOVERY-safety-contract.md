# ENG-ACTIVE-MATCH-RECOVERY: Safety Contract

## Scope

Add a lobby-only Active Match Recovery Card that projects the existing saved session and exposes retry or dismiss actions for the existing `reconnectOrJoinFirebaseRoom` flow.

## Out of scope

This slice does not change room schema, scores, rounds, match IDs, host migration, Firebase listeners, player admission rules, or game-engine transitions. It does not create a second reconnect implementation.

## Authority

`src/firebase/roomService.js` remains the authority for room existence, identity-preserving reconnect, admission, capacity, and phase rules. `GameStateContext.jsx` only invokes that service and projects recovery status to the UI.

## Invariants

The feature must not create a room, reset a match, modify scores, alter round state, grant a new identity, or infer successful recovery before the room service resolves and the provider dispatches persisted room state. Retry calls must be guarded by the existing rejoin-attempt reference. Terminal failures clear the stale session; retryable failures preserve it for another attempt.

## Acceptance

The source must expose restoring, retryable-error, terminal, identity-error, restored, and dismissed states. The lobby must show the active room code, truthful status, an accessible alert/status role, a retry control for retryable failures, and a start-new-room control for terminal or identity failures. Smoke checks must protect the component, provider actions, and lobby insertion.

## Rollback

Remove the recovery card import/rendering and the recovery state/actions from the provider. The underlying reconnect service and existing room state remain unchanged and can be restored independently.
