# Voice Room Scope Lock — NEON GUESS

Date: 2026-08-23
Status: INSPECTION / NO FEATURE CODE CHANGED

## Target

Implement an optional audio-only Voice Room sidecar beside the existing chat for multiplayer gameplay, using browser-native WebRTC for media and the existing Firebase Realtime Database only for scoped signaling metadata.

## Requested mode behavior

- 1v1: one scoped call for the two room players.
- 2v2 Team Battle: one match-scoped call for all four players; only explicitly joined participants send/receive audio.
- Four/Social knockout: separate call scopes for Semifinal A and Semifinal B, then separate scopes for Final and Third Place. Old call instances must not survive match or phase transitions.
- Daily: excluded unless repository inspection proves a multiplayer context; current request does not authorize adding Voice Room to Daily by assumption.

## Protected systems

Gameplay rules, scoring, rounds, reveal/countdown behavior, target privacy, room creation/joining, host and reconnect semantics, authentication, navigation, chat behavior, GameStateContext authority, CompetitiveModeContext authority, match/bracket progression, Daily behavior, existing Firebase namespaces and mutations, deployment configuration, and secrets.

## Current repository identity

- Project: `/home/ubuntu/neon_guess_publish`
- Branch: `main`
- HEAD: `e5bf346 content: remove Nico Schlotterbeck from football catalog`
- Remote branch: `origin/main`
- Working tree already contains untracked user/session documentation files, including the Voice Room research and execution prompt. These pre-existing untracked files must not be deleted or overwritten.
- No relevant project `AGENTS.md` was found in the project or its parent directory.

## Source-verified architecture observations

1. The project is React/Vite with Firebase 12, React 18, React Router, Tailwind, Framer Motion, and Lucide.
2. `GameStateContext.jsx` is the central classic/social multiplayer bridge. It receives Firebase room and message updates, owns classic game state projection, and exposes `sendChatMessage`.
3. `CompetitiveModeContext.jsx` is the authority/projection layer for Tournament and Team Battle modes, including room state, match/team information, target setup, and lifecycle actions.
4. `src/pages/GameBoardPage.jsx` renders active classic gameplay and has explicit Four/Social knockout branches. `src/pages/CompetitiveModePage.jsx` renders competitive gameplay and must be inspected separately before choosing the UI insertion point.
5. Existing Firebase rules define room membership checks for players and messages. There is no verified Voice Room namespace or signaling contract yet.
6. Existing Social/Four state has bracket match identity and independent Semifinal/Final/Third Place match structures. The Voice Room must consume these identities and never mutate them.
7. Daily has its own page/utility path and remains protected from automatic Voice Room addition.

## Initial risk findings

- A Firebase signaling namespace and rules are missing or not yet verified; adding permissive rules would be unsafe.
- WebRTC needs per-peer lifecycle management, explicit microphone permission, cleanup, reconnect handling, stale-call guards, and deterministic negotiation roles.
- Four requires match-scoped identity rather than room-only identity to prevent cross-hearing between bracket branches.
- 2v2 requires a single room/match call for up to four explicitly joined participants, not team-only channels.
- The existing chat and gameplay contexts are protected; any required context change must be minimal, contract-traced, and regression-tested.
- Actual multi-device audio cannot be proven from source inspection or a build alone.
- STUN-only connectivity is not guaranteed on every NAT/mobile network; TURN remains a separately gated fallback, not an assumption.

## Planned implementation boundary

The first implementation boundary is a reusable isolated Voice Room service/hook plus a presentation component beside existing chat. It may read authoritative room/match/team/player identity, but it must not write gameplay state, scores, rounds, targets, brackets, host state, or chat messages.

Potential files are not approved until source tracing is complete. Candidate areas include a new `src/voice/` or `src/services/voice/` module, a new presentational Voice Room component, the existing gameplay page(s), a narrowly scoped Firebase signaling adapter, and `database.rules.json` only if a secure isolated namespace is proven necessary. No dependency, environment, configuration, or gameplay file is approved yet.

## Verification gates

The feature cannot be called ready without separate evidence for source, focused tests, build, browser, Firebase rules, two-client audio, four-client 2v2 audio, Four A/B isolation, Final/Third isolation, refresh/leave cleanup, permission denial, network recovery, and gameplay/chat regression. Missing physical clients or network conditions must be labeled `NOT VERIFIED` or `BLOCKED BY ENVIRONMENT`.

## Current decision

Proceed to deeper source tracing and a minimal implementation plan. Do not edit feature code until the context/page/signaling/rules contract is fully mapped and the allowed file list is recorded.
