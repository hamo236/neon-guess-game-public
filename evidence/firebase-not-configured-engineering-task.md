# Engineering Task: Restore Firebase Configuration in Production Build

## Context
NEON GUESS is a React/Vite/Firebase multiplayer game deployed to GitHub Pages from `hamo236/neon-guess-game-public`. Firebase Web configuration is read only from `import.meta.env.VITE_FIREBASE_*` during the Vite build.

## User-Reported Problem
The live game reports `Firebase not configured` when the user tries to use multiplayer functionality.

## Observed Behavior
The live HTML and JavaScript assets return HTTP 200. A redacted bundle audit found the production bundle still contains the placeholder Firebase values and the missing/placeholder warning string. The repository workflow maps seven `VITE_FIREBASE_*` values from GitHub Actions secrets, but repository secret listing is unavailable to the current GitHub token (HTTP 403). Multiple local environment files contain seven Firebase keys and have the same SHA-256 hash, while the active checkout intentionally has no `.env` file.

## Expected Behavior
The production bundle must be built with the real Firebase Web configuration so `isFirebaseConfigured` is true, Firebase Auth/Realtime Database initialize, and multiplayer room operations use the existing authoritative paths.

## Root Cause
CONFIRMED: the deployed production bundle was built without the real `VITE_FIREBASE_*` values. The source initializer is correct; the deployment build input is missing or not accessible to the workflow.

## Minimal Repair
Use the verified local `.env` as the source for the seven existing GitHub Actions repository secrets, without changing source Firebase initialization, database paths, rules, or gameplay. Re-run the existing workflow. If secret write permission is blocked, perform a one-time local build with the verified `.env` and publish `dist` to `gh-pages`, then report that workflow secret configuration remains blocked.

## Protected Systems
Do not change `src/firebase/config.js`, Firebase rules, Auth, Realtime Database paths, transactions, listeners, game engine, scoring, rounds, bracket progression, target privacy, room lifecycle, routes, or UI gameplay behavior.

## Verification Requirements
Run a local build with the verified `.env`; audit the generated bundle for absence of placeholders and presence of Firebase initialization; run focused gameplay tests; inspect the full diff; run the GitHub Actions workflow; audit the live bundle again; open the live URL and verify the runtime status. Live multiplayer room create/join remains a manual client test unless available in the browser session.
