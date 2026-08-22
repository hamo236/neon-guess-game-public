# ENG-UIUX-ACCESSIBILITY-MVP Contract

## Scope
Improve semantic interaction states in `src/pages/LobbyPage.jsx`: lobby mode tabs, game-mode toggles, category buttons, and the create-room name field.

## Out of scope
No changes to Firebase paths, room creation/join/start actions, reducers, session storage, scoring, game modes, routes, or authoritative multiplayer state.

## Player problem
The Lobby controls look interactive but do not consistently expose selected state to assistive technology and keyboard users. Some controls also rely on implicit button behavior and the create-room input lacks an explicit accessible name.

## Implementation
Add semantic button types, `role="tablist"`/`role="tab"` with `aria-selected`, `aria-pressed` for toggle controls, `aria-label` for the host-name input, and preserve all existing callbacks and disabled guards.

## Invariants
The same handlers, state variables, routes, validation, pending guards, Firebase behavior, and visual layout must remain unchanged. This is a projection/accessibility-only slice.

## Acceptance
Source contains the semantic states and no protected handler body is changed. `npm test` passes. `npm run build` is attempted and classified truthfully. Existing smoke contracts remain green.

## Rollback
Revert only the semantic attributes and `type="button"` additions in `LobbyPage.jsx`; no data or runtime rollback is required.
