# 2v2 Leave and Reconnect Audit

## Scope
Repair Team Battle Leave/Disconnect UX and saved-room recovery in `CompetitiveModeContext.jsx` and the competitive page. Keep Team Battle engine rules, targets, rounds, confirmations, Firebase authorization, 1v1, and Tournament behavior unchanged.

## Confirmed risks

| ID | Symptom | Root cause | Safe repair |
|---|---|---|---|
| ENG-LEAVE-01 | A saved room can be rejoined without explicit consent after a normal revisit. | `recovery.status === pending` automatically calls `retrySessionRecovery()`. | Auto-recover only when the saved session was persisted during an active match; otherwise show explicit Yes/No consent. |
| ENG-LEAVE-02 | The system cannot distinguish refresh recovery from an intentional Leave. | Session stores room identity but not whether an active match existed. | Persist `resumeAfterRefresh` from authoritative room snapshots; `leave()` still clears the session before leaving the route. |
| ENG-LEAVE-03 | Leave semantics need to remain authority-safe. | Host room deletion and guest player removal are different Firebase operations. | Preserve host-only room deletion and guest-only self-removal; do not grant arbitrary clients room-root deletion. |

## Invariants

- Leave clears the local session and local room state.
- Host Leave closes the room for all subscribed clients; guest Leave removes only that guest.
- Active-match refresh may recover automatically only if the persisted session explicitly records an active match.
- Lobby/old-room recovery requires an explicit Yes or No.
- No changes to targets, rounds, scoring, confirmations, or protected Firebase rules.

## Acceptance

- Source contract detects consent-gated pending recovery.
- Source contract detects active-match-only auto-recovery marker.
- Leave remains a semantic button with pending guard and error feedback.
- UI, smoke, build, and live route checks pass where available.
