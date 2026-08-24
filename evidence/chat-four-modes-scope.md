# Chat feature scope and protection contract

## Requested outcome
Add a shared mobile-first chat panel to active 1v1, 2v2, and Four competitive rooms. The panel supports sending short text messages and long-press drag resizing vertically.

## Protected behavior
The feature must not modify targets, guesses, confirmations, scoring, round transitions, match/bracket state, room capacity, private target paths, voice scope, or mode-specific gameplay actions.

## Architecture decision
Reuse the existing room identity and Firebase authentication, but store chat messages under a separate `messages` child of each competitive room namespace. Subscribe to that child independently instead of including messages in the authoritative gameplay state snapshot. Sending uses an atomic child write with a generated message key and sanitized payload. UI state for draft, pending send, error, and panel height remains local React state; panel height is persisted locally per mode.

## Interaction contract
The resize handle is keyboard accessible and supports pointer/touch drag after pointer down. Height is clamped to a mobile-safe range. Chat is rendered only when a competitive room exists, including lobby and active/results states, but sending is disabled outside active gameplay or when no room is connected.

## Verification contract
Source checks must prove only chat files/context/page wiring changed. Tests must cover message payload validation, mode namespace isolation, height bounds, and no gameplay action imports/calls from the chat component. Build and existing 1v1/2v2/Four regression gates must pass. Live browser verification can verify panel rendering and local resize; real multi-client Firebase chat delivery is NOT VERIFIED unless performed with independent clients.
