# Four mode live verification

Date: 2026-08-22

## Evidence

- Direct navigation to `https://hamo236.github.io/neon-guess-game-public/tournament` now loads the React Four Player Tournament screen after publishing `dist/404.html` as the GitHub Pages fallback.
- The Four route renders the room entry UI instead of GitHub Pages 404.
- Live Create Room was tested successfully from the Four screen.
- The live waiting room rendered with Firebase-connected room state, room code `T-WBNIB`, host `NeonPlayer`, and `1/4` players.
- The waiting room exposed Leave, Start Match, Copy, and Share controls.

## Diagnosis

The reported Four failure was not caused by deleting the Four mode or by tournament state logic. GitHub Pages was serving a branch without a `404.html` fallback, so the BrowserRouter deep link `/tournament` returned a Pages 404 during navigation/reload. The application shell could not mount reliably.

## Change applied

- Added `scripts/copy-pages-fallback.mjs`.
- Updated `npm run build` to copy `dist/index.html` to `dist/404.html` after Vite builds.
- Published the new Firebase-configured `dist` to the `gh-pages` branch.
- No gameplay, Firebase transaction, scoring, or synchronization logic was changed.

## Remaining manual test

Use four real devices or browser sessions: create a Four room, join with three players, press Start Match, complete both semifinals, and confirm the final and consolation match transition. The automated live check confirmed route loading and room creation, not the full four-player tournament lifecycle.
