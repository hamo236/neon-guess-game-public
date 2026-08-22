# NEON GUESS — Lobby Command Center UI/UX Safety Contract

## Feature
Mobile-first Lobby Command Center visual upgrade.

## Purpose / user problem
The Lobby currently presents several important entry points as visually similar glass sections. The upgrade should make the next action clearer, make the Daily Guess Drop feel like a premium quick-start path, and add tactile feedback without changing any game behavior.

## Repository evidence
The Lobby already renders the Daily Guess Drop, isolated competitive modes, Firebase status, recovery, category selection, room creation, room joining, and player controls. The current design tokens are defined in `tailwind.config.js` and `src/index.css`.

## Files and symbols inspected
- `src/pages/LobbyPage.jsx`: Lobby structure, navigation handlers, Firebase and recovery projections.
- `src/index.css`: existing glass, neon, animation, and safe-area utilities.
- `tailwind.config.js`: existing colors, typography, spacing, and cyber-grid tokens.

## Files allowed to change
- `src/pages/LobbyPage.jsx`: class names, semantic labels, and presentation-only grouping.
- `src/index.css`: isolated visual utilities and reduced-motion rules.
- This contract/report documentation.

## Protected files and systems
`GameStateContext.jsx`, Firebase room paths, room creation/join/start actions, Daily Guess Drop storage and scoring, GameBoard, Results, Tournament, Team Battle, navigation semantics, and all authoritative multiplayer state are protected.

## Data, Firebase, and state impact
No data, Firebase path, action, reducer, hook, localStorage key, route, or state variable may be changed. Direct impact is CSS and presentation markup only.

## Potential regressions
Mobile overflow, reduced contrast, hidden focus rings, small touch targets, altered click targets, accidental handler removal, layout shift, and animation discomfort.

## Prevention plan
Preserve all existing handlers and button types. Use CSS-only motion with `prefers-reduced-motion` fallback. Keep existing responsive breakpoints and safe-area padding. Add visible focus styles and minimum comfortable touch padding to upgraded controls. Verify smoke contracts, build, and source diff.

## Rollback plan
Revert the class-name changes in `LobbyPage.jsx` and the appended scoped utilities in `src/index.css`. No runtime or database rollback is required.

## Verification plan
Run `npm test`, `npm run build`, inspect the running Lobby at desktop and narrow mobile widths, verify keyboard focus and reduced-motion behavior, and confirm that all existing navigation handlers remain present.

## Open questions
Live browser visual and multi-client Firebase verification depend on the attached Windows runtime and are reported separately from source/build evidence.
