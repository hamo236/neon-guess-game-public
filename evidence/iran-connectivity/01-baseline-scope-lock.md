# Iran Connectivity Incident — Baseline and Scope Lock

Date: 2026-08-25

## Work surface

- Approved repository: `hamo236/neon-guess-test`
- Approved local path: `/home/ubuntu/neon_guess_test`
- Baseline commit: `ee9a5f71f0db2430a8dbed019a6e2714a57fbe4e`
- Branch: `main`
- Test repository visibility: private

## Protection lock

The following are protected and must not be modified, deleted, reset, force-pushed, or published to:

- `hamo236/neon-guess-game-public`
- `hamo236/neon-guess-game-pages`
- production GitHub Pages deployment
- production Firebase Rules, data, rooms, or targets
- existing 1v1, 2v2, and Four-player gameplay contracts

## User-reported incident

A player connecting from Iran receives Firebase Auth `auth/network-request-failed` while attempting to join a 2v2 room. The same application works for other users. The affected player reportedly tried mobile data and one VPN without success.

## Expected behavior

The player should be able to complete anonymous Firebase authentication and then join the existing 2v2 room without changing gameplay, target assignment, target privacy, scoring, rounds, or room authority.

## Confirmed baseline observations

- `src/firebase/auth.js` calls `signInAnonymously(auth)` and uses a shared `authPromise` to avoid concurrent initialization.
- `src/firebase/config.js` initializes Firebase Auth and Realtime Database from public client configuration.
- `CompetitiveModeContext.jsx` waits for `initAuth()` before room creation/join actions.
- The local test checkout has both `origin` pointing to `hamo236/neon-guess-game-public.git` and `test` pointing to `hamo236/neon-guess-test.git`. No push operation is authorized to `origin`; this local remote configuration is a safety finding that must be isolated before any future write command.
- Working tree was clean before this evidence file was created.

## Evidence status

- Source identity: `SOURCE VERIFIED`
- Test repository identity: `SOURCE VERIFIED`
- Production repository untouched by this pass: `NOT VERIFIED` beyond read-only GitHub metadata and no authorized production push
- Iranian device reproduction: `NOT VERIFIED`
- Root cause: `NOT VERIFIED`; network restriction remains a hypothesis until endpoint-level device evidence exists

## Allowlisted investigation area

Initial inspection only: authentication initialization, Firebase configuration, connection-state diagnostics, relevant error rendering, and tests/build scripts. No gameplay, target, scoring, room schema, Firebase Rules, chat, or protected-mode changes are authorized.

## Stop conditions

Stop and report if the first failing layer cannot be identified, if a proposed change requires a new backend/relay, if a Firebase Rule or production configuration change is needed, or if any command could write to a production remote.

## Rollback boundary

Any source patch must be limited to explicitly allowlisted test-repository files, committed on a test-only branch, and revertible without touching production remotes or Firebase data.
