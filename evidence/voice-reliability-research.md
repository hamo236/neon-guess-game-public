# Voice Reliability Research Notes

## Sources and verified findings

1. MDN `RTCPeerConnection.iceConnectionState`: ICE states include `new`, `checking`, `connected`, `completed`, `failed`, `disconnected`, and `closed`; applications should observe `iceconnectionstatechange` to detect connectivity changes. `disconnected` can be intermittent and recover, while `failed` means candidate pairs failed to connect.
URL: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/iceConnectionState

2. MDN WebRTC Perfect Negotiation: the recommended negotiation pattern separates caller/callee roles and handles offer collisions with polite/impolite peers and ICE rollback. This prevents race conditions when both sides negotiate at the same time.
URL: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation

3. MDN `getUserMedia()`: microphone access requires a secure context such as HTTPS or localhost and explicit permission. Rejections include `NotAllowedError`, `NotFoundError`, `NotReadableError`, `OverconstrainedError`, and related cases. Permission can also be affected by Permissions Policy and browser/OS state.
URL: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia

4. WebRTC.org peer connections: signaling is separate from WebRTC and must transport SDP and ICE candidates; ICE uses STUN or TURN candidates; Trickle ICE sends candidates as they arrive and usually reduces setup delay. STUN alone does not guarantee connectivity on restrictive NAT/firewall networks; TURN is the relay fallback used by many production services.
URL: https://webrtc.org/getting-started/peer-connections

## Project-specific observations to validate

- `src/hooks/useVoiceRoom.js` currently uses one public STUN server only: `stun:stun.l.google.com:19302`; no TURN fallback is configured.
- The code uses deterministic lexicographic offer ownership (`String(playerId) < String(remoteId)`) rather than the documented perfect-negotiation collision handling.
- It handles `connectionState` values `failed` and `closed`, but does not visibly handle `iceconnectionstatechange`, `disconnected` recovery, ICE restart, or a user-facing reconnect state.
- Remote ICE candidates are queued until `remoteDescription` exists, which is correct in principle; signals are deduplicated in memory only.
- Firebase signaling uses `onValue` on each sender/receiver signal path and push keys; cleanup of signal history is not visible in the adapter.
- Participant presence uses `onDisconnect(...).remove()` and explicit remove on leave; call records remain open until filtered by a 30-minute age check, with no visible server-side expiry/close operation.
- `getUserMedia({audio:true, video:false})` is requested only when starting or joining; failures are mapped to a generic UI error.
- Remote audio elements are dynamically appended to `document.body` and `audio.play()` rejection is swallowed; autoplay/user-gesture restrictions may therefore be silent to the user.
- The voice hook is mounted persistently above routes, which helps preserve calls between rounds/navigation, but lifecycle correctness still depends on room scope, participant eligibility, and cleanup.

These notes are research evidence only. No project code was changed during the voice audit.
