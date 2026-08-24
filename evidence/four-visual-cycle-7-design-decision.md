# Four-player Visual Evolution Cycle 7 — Match Voice Capsule

## Mode and target

Mode: `DESIGN_AND_IMPLEMENT`. Cycle: 7. Selected surface: the existing Four-player `VoiceRoomPanel` presentation rail shown above the active tournament content. The player's primary task is to understand that match-scoped voice is available or active, then reach the existing microphone, output, join, start, and leave controls without searching or mis-tapping on a phone.

The prompt in `pasted_content_13.txt` is a presentation-only mandate and does not authorize gameplay, data, or multiplayer behavior changes. Cycle 6 already covered recovery and error rails; this cycle selects the distinct match-voice surface because it currently compresses to an icon-only strip on mobile, uses 36px icon buttons, and offers little visual grouping between voice identity and control state. These are presentation findings from the existing `VoiceRoomPanel.jsx` markup, not claims about call correctness.

## Research adopted

1. W3C WCAG 2.2 provides the accessibility baseline for operable controls, visible focus, status communication, and target size. Source: https://www.w3.org/TR/WCAG22/. The adaptation is to preserve existing `aria-label`, `aria-pressed`, live-region, and disabled semantics while increasing visual/touch clarity with CSS only.
2. Material Design 3 icon-button guidance treats icon buttons as compact supplementary actions and its structure guidance uses a 48dp touch-target convention. Sources: https://m3.material.io/components/icon-buttons/overview and https://m3.material.io/foundations/designing/structure. The adaptation is to give the existing 36px visual icons a larger Four-only hit area without changing handlers.
3. Emil Kowalski's animation guidance favors purposeful, fast, GPU-friendly motion and reduced-motion support. Source: https://emilkowal.ski/ui/great-animations. The adaptation is to keep the existing transition bounded and add no new animation; reduced motion disables the existing transition in this scoped surface.

No external code, branding, assets, dependencies, or layouts are copied.

## Three directions considered

1. **Floating voice dock:** rejected because an overlay could obscure the legal game action, intercept taps, and compete with the active guessing surface.
2. **Diagnostic audio console:** rejected because technical status detail increases scan cost and makes a social game feel like a settings panel.
3. **Match Voice Capsule:** selected because it stays in document flow, exposes the existing label and status icon as one compact identity rail, enlarges controls for one-handed use, and uses restrained cyan/green/rose state accents already present in the component.

The selected direction passes the swap, context-removal, token, squint, transfer, state-truthfulness, and anti-AI-pattern tests: it remains recognizably a social guessing match even when decoration is removed, and it does not infer or invent connection state.

## Exactly five presentation-only improvements

1. Give the existing voice panel a Four-only capsule frame with stable minimum width, contrast, and compact vertical rhythm.
2. Keep the existing `MATCH VOICE` / `TEAM VOICE` label visible and readable on phones instead of relying on the icon alone.
3. Increase the visual/touch area of every existing voice icon button to a comfortable phone size while retaining the exact button, handler, disabled expression, `aria-label`, and `aria-pressed` behavior.
4. Add clear CSS-only focus, pressed, disabled, and grouped-control affordances using existing attributes and states; no local state is introduced.
5. Add short-height landscape density and reduced-motion rules without adding animation or changing call timing.

## Protected contract and allowlist

Allowlisted implementation file: `src/index.css` only. Evidence files are documentation. Protected nodes include every `VoiceRoomPanel` callback and hook, `useVoiceRoom`, room/match scope identity, eligible participant IDs, Firebase reads/writes/listeners, audio behavior, mute/output state, call lifecycle, navigation, gameplay, targets, rounds, scoring, timers, reveal privacy, 1v1, and 2v2.

No JSX, context, hook, state, effect, callback, route, configuration, dependency, Firebase, or rule change is permitted. The patch must remain scoped under `.ng-tournament-shell .voice-room-panel`. Rollback boundary: revert the Cycle 7 CSS-only commit if any protected, mobile, accessibility, motion, or build gate fails.

## Verification gates

Run `git diff --check`, changed-file scope audit, smoke tests, Team Battle tests, production build, CSS marker inspection, public deployment verification, and a browser audit at the public tournament route. Record the active route, viewport, overflow result, loaded stylesheet evidence, and the limitation that an authenticated/active voice call is not created during passive verification unless a safe test room is available.

Author: Manus AI
Date: 2026-08-24
Recorded before implementation.

## References

[1]: https://www.w3.org/TR/WCAG22/ "Web Content Accessibility Guidelines (WCAG) 2.2"
[2]: https://m3.material.io/components/icon-buttons/overview "Material Design 3 — Icon buttons"
[3]: https://m3.material.io/foundations/designing/structure "Material Design 3 — Structure and touch targets"
[4]: https://emilkowal.ski/ui/great-animations "Great Animations"
