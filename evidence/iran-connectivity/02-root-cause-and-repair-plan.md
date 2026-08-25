# Iran Connectivity Incident — Root Cause Gate and Minimal Repair Plan

## Root-cause gate

The first application divergence is the rejection of `signInAnonymously(auth)` in `src/firebase/auth.js`. `CompetitiveModeContext.jsx` does not assign a Firebase player ID when that promise rejects, and both `createRoom` and `joinRoom` stop before calling `createCompetitiveRoom` or `joinCompetitiveRoom`. Therefore the reported 2v2 failure occurs before room reads, room transactions, target reads, target writes, scoring, or round transitions.

The current evidence rejects an app-wide Firebase configuration failure and a confirmed Firebase-wide outage: the public client configuration identifies one consistent Firebase project, independent endpoint checks previously reached Firebase services, and other users can use the same deployment. The Iranian network hypothesis remains high-probability but not device-proven because no endpoint test has yet been captured from the affected Iranian device. The report must retain this distinction.

## Rejected or unproven hypotheses

| Hypothesis | Status | Reason |
|---|---|---|
| 2v2 room transaction or target privacy bug causes the Auth error | Rejected for this symptom | Room code is not reached until Auth resolves. |
| Wrong public Firebase config in the test source | Not supported by current evidence | Config is internally consistent and matches the known project. |
| Global Firebase outage | Not supported by current evidence | Other users succeed and prior status/endpoint checks did not show a general outage. |
| Firebase is definitely blocked for every Iranian network | Unproven | The affected device has not supplied endpoint-level measurements. |
| Long polling alone fixes anonymous Auth | Rejected as a general remedy | Long polling concerns Realtime Database transport; the first failure is Auth. |

## Allowlisted patch

The patch may touch only authentication diagnostics/retry and the competitive-mode error surface in the test repository. It may add a bounded retry with exponential backoff and jitter, preserve the existing shared promise behavior, classify likely network failures without exposing tokens or configuration secrets, and expose an explicit user-triggered retry. It may add static tests for error classification and retry behavior plus a manual device protocol.

The patch must not change Firebase Rules, Firebase project settings, database schema, room mutation functions, target assignment, target privacy, scoring, phases, timers, chat, voice, 1v1, tournament, or Four-player gameplay. It must not add a proxy, relay, service account, or alternate backend in this pass.

## Proof targets

1. The Auth path retries at most a bounded number of times and eventually returns the original error if the network remains unavailable.
2. A successful existing session is reused without another sign-in.
3. A user-triggered retry clears the stale Auth error and can re-run initialization safely.
4. No room Firebase function is called before a Firebase UID exists.
5. Build and existing QA scripts pass.
6. The original production repository and Firebase configuration remain untouched.
7. Iranian-device runtime remains `NOT VERIFIED` until the affected player tests the test deployment.

## Stop conditions

Stop before patching if the change requires bypassing Firebase Auth, storing credentials in the client, weakening Rules, changing the room schema, or routing private targets through a new server. Such a change requires a separate architecture and security review.
