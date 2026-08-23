# NEON GUESS Voice Room — Research and Implementation Plan

**Status:** Research and design only. No gameplay, Firebase, UI, or dependency changes were made by this report.

**Audience:** The next engineering or AI agent continuing NEON GUESS.

## 1. Product decision

NEON GUESS may add an optional in-game voice room that feels like a lightweight WhatsApp-style voice call: one player starts a call, other eligible players see that a call is available and can join, participants hear one another in real time, and every participant can mute their microphone, mute incoming audio locally, or leave the call.

The first implementation should use **audio-only WebRTC** with the existing Firebase Realtime Database used only as a signaling channel. WebRTC carries the media stream; Firebase should not store or transport the audio stream. This keeps the feature additive and preserves the existing game authority.

The recommended first release is a small, reversible MVP using browser WebRTC peer connections and a scoped signaling namespace. It should start without a third-party media service. TURN fallback should be added only after real multi-network testing demonstrates that direct connectivity is insufficient.

## 2. Repository evidence and boundaries

The current project is a React/Vite application deployed to GitHub Pages. It uses Firebase Anonymous Authentication and Firebase Realtime Database. The current code has two authority contexts:

| Existing authority | Current responsibility | Voice-room rule |
|---|---|---|
| `GameStateContext.jsx` | Classic 1v1 and Social game state | Must remain authoritative for gameplay |
| `CompetitiveModeContext.jsx` | Tournament and 2v2 Team Battle state | Must remain authoritative for match/team progression |
| `src/data/gameData.js` | Canonical content and asset paths | Must not be involved in voice identity or signaling |
| `src/pages/GameBoardPage.jsx` | Active play screen, including Four match routing | Voice scope must follow its active match context |
| `src/pages/GameResultsPage.jsx` | Results, bracket transitions, Final and Third Place | Voice must leave old match scope during transitions |
| `database.rules.json` | RTDB access isolation | A separate, narrowly scoped voice namespace is required |

The current Four flow contains semifinal, final, and consolation/third-place concepts. The active Four player assignment includes a match identity, so voice scope must use the authoritative active match rather than a client-created participant list.

The current 2v2 interpretation for this proposal is **all four players in one shared voice call**. This corrects the earlier team-only interpretation: Team A and Team B can hear each other when they join the same room call.

## 3. Mode-specific voice contract

| Mode/context | Voice membership | Required scope key | Important transition rule |
|---|---|---|---|
| 1v1 | The two players in the room | `roomId` | A player who has not joined hears nothing |
| 2v2 Team Battle | Any of the four players in the active team-battle room | `roomId + activeMatchId` or the authoritative room match key | Do not infer membership from team labels; validate room membership |
| Four semifinal A | The two players assigned to semifinal A | `roomId + matchId` | Must be isolated from semifinal B |
| Four semifinal B | The two players assigned to semifinal B | `roomId + matchId` | Must be isolated from semifinal A |
| Four Final | The two Final players | `roomId + finalMatchId` | Old semifinal peers must not remain connected |
| Four Third Place | The two consolation players | `roomId + consolationMatchId` | Must be isolated from Final |
| Daily | Not included unless explicitly approved later | N/A | Do not silently add a social audio feature to Daily |

The canonical scope should be derived from the existing authoritative state. A client must never choose an arbitrary `teamId`, `matchId`, or bracket stage and gain access merely by writing that value.

## 4. Proposed user experience

The voice control should appear as a compact control attached to the existing chat area, not as a large second game surface. The primary control can be a small phone/waveform icon with the label **Voice Call** on mobile and **Start Voice Call** when space allows.

The states should be explicit:

| State | Player-facing projection | Allowed action |
|---|---|---|
| No call | `Start Voice Call` | Start a call |
| Call available | `Voice call available` + `Join` | Join without automatically opening the microphone before consent |
| Joining | `Connecting…` | Cancel/leave safely |
| Connected, microphone on | Participant list + live mic indicator | Mute, mute incoming audio, leave |
| Connected, microphone muted | `You are muted` | Unmute, mute incoming audio, leave |
| Joined but listening muted | `Listening muted` | Restore incoming audio, mute/unmute microphone |
| Call ended | `Call ended` | Start a new call if the game context is still valid |
| Permission denied | Clear explanation and browser permission guidance | Retry permission or continue with chat |
| Network failed | `Could not connect` with retry | Retry or continue without voice |
| Reconnecting | `Reconnecting…` | Keep game usable; retry connection |

The feature must distinguish two separate controls:

1. **Microphone mute:** the player remains in the call but stops sending their audio to peers.
2. **Incoming-audio mute:** the player remains joined but stops hearing other participants locally.

A player who has not pressed **Join** must have no active microphone track and must not hear the call. A player who joins but chooses to mute must remain present as a participant while their outbound audio track is disabled.

Use the label **Join Call**, not **Join Room**, because NEON GUESS already has a game-room concept and the two actions must not be confused.

## 5. Technical architecture

### 5.1 Media layer

Use `navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })` only after an explicit user action and browser permission. Create one `RTCPeerConnection` per remote participant for the mesh MVP. Attach remote audio streams to controlled audio elements and clean up every peer connection, media track, and listener on leave, unmount, room change, match change, and game completion.

A four-person mesh means each participant has up to three peer connections. That is acceptable for the first small-room version, but it is not a general-purpose large conference architecture. If NEON GUESS later supports larger rooms, an SFU such as LiveKit should be reconsidered.

### 5.2 Signaling layer

Use a new, isolated RTDB area such as:

```text
voiceRooms/{voiceScopeId}/
  status: "idle" | "available" | "ended"
  hostId: "authUid"
  createdAt: serverTimestamp
  participants/{authUid}:
    joined: true
    displayName: "..."
    micMuted: false
    joinedAt: serverTimestamp
  peers/{callerUid}/{calleeUid}/
    offer: { type, sdp }
    answer: { type, sdp }
    callerCandidates/{candidateId}: { ... }
    calleeCandidates/{candidateId}: { ... }
```

This is a conceptual contract, not an instruction to implement it unchanged. The final schema must follow the existing project conventions and Firebase rules. Signaling data should be treated as short-lived session data, not chat history. It should be removed or expired when the call ends, the match changes, or a participant disconnects.

### 5.3 Scope and authorization

`voiceScopeId` must be generated from authoritative context, for example:

```text
classic:{roomId}
team:{roomId}:{activeMatchId}
four:{roomId}:{activeMatchId}
```

The exact format is less important than the rule that the server-side database rules validate the underlying room membership, active match, and stage. Do not trust a client-supplied scope string by itself.

The voice system may read the existing room state to determine eligibility, but it must not write gameplay state. It should not modify scores, turns, targets, rounds, bracket results, team assignments, or room authority.

## 6. Security and privacy requirements

Microphone access is a high-sensitivity browser capability. The app must request it only after the player presses a clear start/join control, show a visible microphone-use state, and stop all local tracks when leaving. GitHub Pages HTTPS satisfies the secure-context requirement, but browser permission is still mandatory [3].

RTDB rules must provide member-only access to signaling. A player outside the room must not read offers, answers, candidates, participant presence, or call status. In Four, membership must be checked against the active `matchId`; in 2v2, the initial product decision is one shared four-player room call, so all four eligible room players may join but outsiders may not.

Never put API secrets, TURN permanent credentials, or a third-party media-service secret in the public Vite bundle. If TURN is later introduced, use time-limited credentials from a protected service. Firebase client configuration is not a substitute for authorization rules.

Do not record, persist, transcribe, or upload audio in the MVP. The feature is live voice only.

## 7. Connectivity and operational risks

WebRTC requires signaling plus ICE candidate exchange. STUN can help peers discover a direct route; TURN relays media when direct connectivity fails. The official WebRTC guidance states that signaling is outside the WebRTC specification and that ICE servers may be STUN or TURN [1]. Google's Firebase WebRTC codelab demonstrates using Firebase as a signaling channel for offers, answers, and ICE candidates [2].

The likely failure modes are:

| Risk | Product impact | Mitigation |
|---|---|---|
| User denies microphone permission | No outbound audio | Explain clearly; keep chat and game usable |
| No microphone/headset | No audio input | Show a useful device error; allow listening-only if possible |
| STUN-only failure behind restrictive NAT | Call does not connect | Show retry state; add TURN fallback after evidence |
| Stale offer/candidates after refresh | Wrong or failed reconnect | Scope sessions by call instance and clean stale signaling |
| Player changes match | Audio leaks across matches | Force leave and recreate scope on authoritative match change |
| Peer leaves unexpectedly | Remaining peers hear stale audio | Listen for presence and close that peer connection |
| Mobile browser suspends tab | Reconnection or silent audio | Detect connection state and expose reconnect action |
| Autoplay policy | Remote audio does not start | Start playback in response to Join and handle `play()` rejection |
| Echo/feedback | Poor conversation quality | Enable echo cancellation; recommend headphones when needed |
| Four mesh load | More CPU/bandwidth than 1v1 | Limit MVP to four participants and monitor connection state |
| Confusing mute controls | Player thinks they are private but is not | Separate mic mute from incoming-audio mute with clear labels |

## 8. Recommended implementation sequence

### Phase A — Isolated voice service

Create a dedicated voice service/hook and a small presentational panel. Do not place WebRTC negotiation logic inside `GameStateContext` or `CompetitiveModeContext`. The service should accept an authoritative voice scope and an eligibility result from the existing game context, while keeping audio connection state local to the voice feature.

### Phase B — 1v1 proof

Implement Start, Join, microphone permission, real two-way audio, microphone mute, incoming-audio mute, leave, cleanup, retry, and permission/network errors. Verify with two browsers and two networks.

### Phase C — 2v2 shared call

Reuse the service for all four eligible players under one active room/match scope. Verify that all four can hear one another, that a non-joined fourth player hears nothing, and that joining later does not reset the existing game state.

### Phase D — Four match isolation

Attach the scope to the authoritative active match. Verify Semifinal A versus Semifinal B, then Final versus Third Place. When the bracket advances, all old peer connections and signaling listeners must be closed before the new scope begins.

### Phase E — Reliability pass

Run mobile tests across Wi-Fi and cellular networks, different countries when available, background/foreground transitions, refresh/reconnect, permission denial, and simultaneous leave/join. Only after failures are observed should the project choose a TURN provider or managed SFU.

## 9. Verification contract

A successful build alone is not enough. The following evidence should be collected:

| Gate | Required evidence |
|---|---|
| Source contract | No gameplay, target privacy, scoring, routing, or authority changes |
| Build | Production build succeeds |
| Browser 1v1 | Two real clients exchange audible audio |
| Mute | Remote client stops hearing the muted sender |
| Incoming mute | Local client stops hearing others without leaving |
| Join isolation | Non-joined client has no microphone track and hears nothing |
| 2v2 | Four clients can join one shared call and hear each other |
| Four isolation | Semifinal A/B and Final/Third Place cannot cross-hear |
| Lifecycle | Leave, refresh, match transition, and end-of-game clean up connections |
| Permission | Denial produces a clear fallback and does not break the game |
| Network | At least Wi-Fi/cellular and two distinct networks are tested |
| Motion/accessibility | Focus, keyboard operation, reduced motion, and readable status states are reviewed |

The final report must distinguish `SOURCE VERIFIED`, `BUILD VERIFIED`, `LIVE BROWSER VERIFIED`, `FOUR-CLIENT VERIFIED`, `NOT VERIFIED`, and `BLOCKED BY ENVIRONMENT`. Do not claim global reliability from a single local test.

## 10. Visual and motion direction

The Voice Call control belongs beside the existing chat because both are social communication tools. It should be compact, high-contrast, and legible on mobile. Use a restrained active-call indicator rather than a permanent pulsing neon effect. A short transition may explain the change from available to connected, but repeated mic status changes should use minimal motion.

The `review-animations` gate should reject decorative motion that is frequent, slow, or distracting. Any motion should use transform and opacity, remain under 300ms unless justified, support `prefers-reduced-motion`, and preserve focus visibility. The visual evolution workflow must treat all callbacks, state ownership, routes, and Firebase operations as protected; a visual wrapper cannot change their behavior.

## 11. Non-goals for the first pass

The MVP should not add video, screen sharing, recording, transcription, public lobby calls, persistent call history, cross-room calls, automatic microphone activation, voice moderation, or a paid provider. It should not alter Daily mode unless a separate product decision explicitly approves it.

## 12. Final recommendation

Proceed only with a bounded **audio-only WebRTC MVP** after the user sends an explicit implementation prompt. Start with 1v1, then reuse the isolated service for four-person 2v2 and match-scoped Four. Keep signaling separate from gameplay authority, use explicit join consent, provide both microphone and incoming-audio mute, and treat TURN as a measured reliability upgrade rather than a hidden dependency.

The implementation should be stopped and re-scoped if it requires broad changes to Firebase authority, room lifecycle, tournament progression, target privacy, or production secrets.

## References

[1]: https://webrtc.org/getting-started/peer-connections "WebRTC: Getting started with peer connections"

[2]: https://webrtc.org/getting-started/firebase-rtc-codelab "WebRTC: Firebase + WebRTC Codelab"

[3]: https://webrtc.org/getting-started/media-devices "WebRTC: Getting started with media devices"

[4]: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia "MDN: MediaDevices.getUserMedia()"

[5]: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection "MDN: RTCPeerConnection"

[6]: https://livekit.com/pricing "LiveKit Cloud Pricing"

[7]: https://docs.livekit.io/transport/self-hosting/ "LiveKit Self-hosting Overview"

---

**Document owner:** Manus AI
**Current status:** Ready for review and conversion into an implementation prompt; no code implementation performed.


# Addendum — Detailed Execution Reference

## A. Engineering scope lock

**Target:** Add an optional audio-only Voice Room without changing the rules or authority of NEON GUESS.

**Protected:** `GameStateContext`, `CompetitiveModeContext`, round and score transitions, target privacy, player assignments, bracket progression, room ownership, authentication behavior, existing text chat behavior, Daily mode, routes, and the working deployment contract.

**Implementation policy:** The feature is a sidecar capability. It may consume authoritative room/match state and expose local voice state, but it must never become an alternate source of truth for game state.

## B. Exact implementation work sequence

The implementing AI should execute the following sequence and stop if evidence requires a redesign.

### Step 1 — Repository reconnaissance

Inspect the current branch, working tree, `AGENTS.md`, `package.json`, Firebase initialization, RTDB helper conventions, route/page composition, existing chat components, room membership shape, Four match assignment shape, 2v2 active-match shape, and deployed build configuration. Search every producer and consumer of `roomId`, `matchId`, `teamId`, `phase`, `players`, and `messages`. Record the actual current names before adding imports or paths.

### Step 2 — Contract and dependency decision

Prefer browser-native WebRTC and existing Firebase. Do not install a third-party media SDK in the MVP unless the repository evidence proves that native WebRTC cannot satisfy the bounded room sizes. If a dependency is considered, record its bundle impact, license, browser support, token requirements, and rollback path before installing it.

### Step 3 — Define the authoritative scope adapter

Add a pure adapter that derives a voice eligibility record from existing state. It should return `eligible`, `voiceScopeId`, `mode`, `roomId`, `matchId`, the permitted participant IDs, and a scope version/call nonce. It must return ineligible during lobby states that do not have a valid voice context, after leaving, and during a match transition where the old and new contexts overlap.

For 1v1, use the room identity and the two authoritative room members. For 2v2, use the active team-battle room/match identity and the four authoritative players. For Four, use the current active match identity so semifinal, Final, and Third Place cannot share a scope. Do not make Daily eligible unless a later product decision explicitly adds it.

### Step 4 — Build the local voice state machine

Keep local voice state separate from gameplay state. The minimum state machine is:

```text
DISABLED
  -> AVAILABLE
  -> STARTING
  -> JOINING
  -> CONNECTED_MIC_ON
  -> CONNECTED_MIC_MUTED
  -> CONNECTED_LISTENING_MUTED
  -> RECONNECTING
  -> FAILED
  -> ENDED
```

Every transition must have an explicit event and cleanup behavior. `leaveCall`, `scopeChanged`, `matchEnded`, `permissionDenied`, `networkFailed`, and `componentUnmounted` must close peer connections, stop local tracks, detach audio elements, unsubscribe listeners, cancel timers, and prevent late callbacks from mutating the next call instance.

### Step 5 — Implement signaling with one call instance

Create a unique `callInstanceId` for each Start Call. Store only bounded, short-lived signaling metadata. Every offer, answer, and candidate must include the call instance and the two participant identities. On receiving data, reject it when the scope, call instance, sender, recipient, or current match no longer matches.

Use push keys for candidate entries rather than overwriting a shared candidate field. Use listeners that process only new candidate children. Register `onDisconnect` cleanup for presence/signaling after the client is authorized, while retaining explicit client cleanup for normal leave. Avoid deleting a shared call object merely because one peer leaves; instead remove only that participant's ephemeral data and end the call when the authoritative lifecycle or host policy says it has ended.

### Step 6 — Implement deterministic peer negotiation

For each remote participant, create one `RTCPeerConnection`. Use a deterministic polite/impolite role or an equivalent perfect-negotiation implementation. Never allow two independent code paths to create offers for the same peer without collision handling. Handle `negotiationneeded`, `icecandidate`, `track`, `connectionstatechange`, `iceconnectionstatechange`, and remote candidate errors.

The first MVP can use a stable join order or UID ordering for role selection. The role must be per peer pair, not a single global caller flag. A participant joining a four-person call creates negotiations with each existing participant independently.

### Step 7 — Implement audio controls

Request audio only after Start or Join. Use audio constraints that enable echo cancellation, noise suppression, and automatic gain control when supported. `Mute Microphone` disables the local outbound audio track without leaving the peer connection. `Mute Incoming Audio` changes local playback volume or pauses remote audio elements without disabling the microphone track. `Leave Call` closes the local media and all peers.

Display a per-participant state based on signaling presence and actual local control state. Do not claim that another participant is speaking unless voice activity detection is actually implemented and tested; a simple joined/mic-muted indicator is safer for MVP.

### Step 8 — Integrate beside chat

Mount one reusable `VoiceCallPanel` next to the existing chat panel in the active eligible screens. It should receive a voice-scope adapter result and callbacks, not direct permission to write gameplay state. Keep it compact on mobile and avoid overlaying the target, timer, or guess controls. If the route changes to results or lobby, the panel must leave/disable according to the scope adapter.

### Step 9 — Add rules before live testing

Add a separate RTDB rules namespace only after mapping the actual room and match paths. Rules must verify authenticated identity, room membership, allowed match membership, and the permitted fields/types. Add length and type validation to display names and signaling fields. Test both allowed and denied reads/writes with the Firebase emulator or an equivalent controlled rules test. Never use a broad parent `.read` or `.write` to make the feature work quickly.

### Step 10 — Validate and publish

Run static checks, focused tests, production build, local browser tests, and then live multi-client tests. Inspect the complete diff and the generated bundle. Deploy only after the protected-game regression checklist passes. If a real-device test is unavailable, mark it `NOT VERIFIED` rather than implying production reliability.

## C. Missing pieces that the original report did not fully specify

The original report correctly defined the product direction but needed more precision in five areas. First, it needed a `callInstanceId` to prevent stale offers and candidates from crossing refreshes and bracket transitions. Second, it needed per-peer perfect negotiation because four-person joining creates several independent negotiations. Third, it needed separate definitions for microphone mute and incoming-audio mute. Fourth, it needed a concrete cleanup and `onDisconnect` policy for crashes and background suspension. Fifth, it needed a rule-test plan, because Firebase client configuration and authenticated access alone do not prove signaling isolation.

The original report also needed an explicit decision that 2v2 is one shared four-person voice call. This addendum adopts that decision. The Four mode remains match-pair scoped: semifinal A, semifinal B, Final, and Third Place are separate conversations.

## D. Failure prevention matrix

| Failure class | What can go wrong | Prevention and recovery |
|---|---|---|
| Scope leak | A player hears another match | Derive scope from authoritative active match; reject mismatched signaling; close on scope change |
| Stale signaling | Old offer connects after refresh | `callInstanceId`, timestamps, membership checks, and cleanup |
| Offer collision | `setRemoteDescription` or negotiation fails | Perfect Negotiation with deterministic polite/impolite roles |
| Ghost participant | UI says joined after browser closed | RTDB `onDisconnect`, presence timestamps, and WebRTC state reconciliation |
| Half-open peer | One remote stream remains after leave | Close the pair, remove listeners, stop tracks, clear audio elements |
| Permission failure | Game appears broken after mic denial | Isolate error; keep chat and game fully usable; provide retry guidance |
| Audio feedback | Echo or loud feedback | Echo cancellation, noise suppression, clear joined state, headset guidance |
| Autoplay block | Remote stream exists but is silent | Attach/play after Join user gesture; catch `play()` errors and show recovery |
| Mobile suspension | Audio stops when screen/background changes | Observe connection state; show reconnect; do not corrupt game state |
| Rules over-permission | Outsider reads signaling | Separate namespace; explicit member checks; emulator denial tests |
| RTDB growth | Candidate/session data accumulates | Ephemeral call paths, bounded writes, cleanup and expiration |
| Race at bracket transition | Old and new matches overlap | Scope version and transition lock; leave old before enabling new |
| Provider lock-in | MVP depends on a paid service | Native WebRTC abstraction with a replaceable transport boundary |
| Abuse | Open mic or unwanted audio | Explicit Join, explicit permission, leave/mute, no auto-join, no recording |

## E. AI execution behavior

The implementing AI must not treat this feature as a simple UI button. It should first create an internal engineering task from verified repository evidence, then apply a scope lock, inspect the complete state lifecycle, and implement the smallest isolated slice. It should never infer multiplayer correctness from the visual panel alone.

The AI should work in milestones: first the pure scope adapter and state contract, then 1v1 signaling, then 1v1 browser verification, then shared 2v2, then Four match isolation. Each milestone should have a reversible commit or clearly bounded diff. If a milestone breaks protected gameplay, it must stop, revert the smallest risky change, and investigate rather than layering patches.

The AI must distinguish `SOURCE VERIFIED` from `LIVE BROWSER VERIFIED` and `FOUR-CLIENT VERIFIED`. A successful `npm run build` proves compilation only. It does not prove microphone permission, NAT traversal, audible remote audio, Firebase rules, or tournament isolation.

The AI should report in simple Arabic to the user, while keeping the engineering task and code comments in English when that is the repository convention. It should state exactly what was changed, what was tested, what was not tested, and whether a user must test with two or four real devices.

## F. Acceptance criteria for implementation approval

The feature is not ready for production until all of the following are true:

| Area | Acceptance criterion |
|---|---|
| Real audio | Two joined users hear each other, not just see a connected label |
| Consent | No microphone track starts before explicit Start/Join and browser permission |
| Microphone mute | A muted sender is no longer audible to remote peers while remaining joined |
| Incoming mute | A listener can stop hearing others without leaving or muting their mic |
| Non-joined user | A user who does not Join has no active local mic track and hears no remote audio |
| 1v1 | Room-scoped call works across two different devices/networks |
| 2v2 | Four eligible users can join one shared call; any one may join late or leave |
| Four | A/B semifinals, Final, and Third Place cannot cross-hear |
| Lifecycle | Refresh, leave, match transition, results, and lobby clean up correctly |
| Security | Unauthorized user cannot read or write another room's signaling data |
| Resilience | Failed connection produces retry/fallback without breaking gameplay |
| Mobile | Microphone permission, audio playback, mute, and reconnect work on supported mobile browsers |
| Accessibility | Controls are keyboard reachable, labelled, visible in focus, and usable with reduced motion |
| Deployment | Same GitHub Pages URL serves the feature without exposing private secrets |

## G. Rollback boundary

The safest rollback is to remove the Voice Room panel and disable the voice service integration while leaving all existing room, chat, game, and Firebase gameplay paths unchanged. Signaling data is ephemeral, so a rollback should not require a migration of game data. Any database rules addition must be removable as one isolated namespace. No production deployment should proceed if the implementation requires rewriting existing room rules or changing authoritative match transitions.

## Updated references

[8]: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation "MDN: WebRTC perfect negotiation pattern"

[9]: https://firebase.google.com/docs/database/web/offline-capabilities "Firebase: Enabling offline capabilities in JavaScript"

[10]: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Session_lifetime "MDN: Lifetime of a WebRTC session"

[11]: https://firebase.google.com/docs/database/security "Firebase: Understand Realtime Database Security Rules"
