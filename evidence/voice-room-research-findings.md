# Voice Room Research Findings

## WebRTC official findings

- WebRTC peer connections support audio, video, and data between applications.
- Signaling is not part of the WebRTC specification; the application must provide a separate channel for offers, answers, and ICE candidates.
- ICE configuration uses STUN or TURN servers. STUN helps discover direct routes; TURN relays traffic when direct connectivity is unavailable.
- Trickle ICE reduces setup time by sending candidates as they are discovered.
- A connection must be monitored through connection-state events and cleaned up on failure or lifecycle changes.
- MDN's Perfect Negotiation pattern separates polite and impolite peer roles to handle simultaneous offers and avoid negotiation collisions. This is relevant when multiple participants join or reconnect at the same time.

## Firebase official findings

- Firebase Realtime Database Security Rules are enforced on Firebase servers for every read and write.
- Rules support `.read`, `.write`, `.validate`, and `.indexOn`.
- Authentication identifies the user, but authorization rules must independently control which authenticated user can read or write a path.
- `.validate` rules can enforce data types, required fields, length limits, and relationships with authenticated identity and other database paths.
- Rules cascade for read/write access; a broad parent permission can unintentionally grant access to child data. Voice signaling must therefore use a separate, narrow namespace and avoid broad parent grants.

## Microphone and browser findings

- `getUserMedia({audio:true})` requires explicit user permission and is available only in secure contexts such as HTTPS.
- Permission denial, missing devices, browser policy, or OS-level restrictions must be handled as normal product states, not uncaught errors.
- The feature must request the microphone only after an explicit Start/Join action, and must stop all media tracks when the call ends.

## Design consequences for NEON GUESS

- Firebase should carry signaling metadata only; it must never be treated as the audio transport.
- Perfect Negotiation or an equivalent deterministic negotiation policy is required per peer connection.
- A four-person 2v2 room has up to three peer connections per participant in a mesh MVP; this is acceptable for the bounded room size but not a general large-room solution.
- Four mode requires match-scoped voice channels so semifinal A, semifinal B, Final, and Third Place cannot cross-hear.
- The existing room and match authority must remain the source of membership. A client-supplied scope string alone is not an authorization mechanism.

## Sources

1. https://webrtc.org/getting-started/peer-connections
2. https://webrtc.org/getting-started/firebase-rtc-codelab
3. https://webrtc.org/getting-started/media-devices
4. https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation
5. https://firebase.google.com/docs/database/security
6. https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia

## Presence and disconnect findings

- Firebase Realtime Database supports server-side `onDisconnect()` operations that can update or remove presence data when a client disconnects.
- A voice participant should register disconnect cleanup after authorization succeeds, but client-side cleanup is still required for normal leave and component unmount.
- Presence should not be treated as proof that a WebRTC peer is currently audible; it is only a signaling/lifecycle hint. The media connection state must also be monitored.
- A new call instance/nonce is needed so stale signaling from a previous call or match cannot be reused after refresh or bracket transition.

## Additional source

7. https://firebase.google.com/docs/database/web/offline-capabilities
8. https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Session_lifetime
9. https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation
