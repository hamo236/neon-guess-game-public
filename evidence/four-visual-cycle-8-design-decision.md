# Four-player Visual Evolution Cycle 8 — Design Decision

## Mode and target

Mode: `DESIGN_AND_IMPLEMENT` with `/review-animations` as a motion-only reviewer.

Addition: Cycle 8.

Selected surface: **Four-player session command rail** — the existing Four-only header, Leave control, connection indicator, voice capsule adjacency, and saved-room recovery surfaces.

Primary player task: understand the current tournament session and safely identify the available exit/recovery action on a phone without confusing it with gameplay controls.

Evidence-based problem: after the post-tournament control release, the Four shell has the correct controls and lifecycle, but the top session controls still rely on generic utility classes. On a phone, the tournament identity, connection state, voice surface, leave action, and recovery notices do not yet read as one calm command rail. The issue is presentation hierarchy and density, not missing behavior.

## Three directions considered

| Direction | Strength | Rejected because |
| --- | --- | --- |
| A. Floating neon utility strip | Strong product signature and compactness | Risks turning connection and Leave into decorative chrome; weak reading order on narrow phones |
| B. Session command rail — selected | Establishes identity first, connection/recovery second, safe exit third; adapts to one-column phone flow and preserves existing semantics | Requires a small presentation wrapper/class addition |
| C. Full-screen control drawer | Maximum discoverability for rare actions | Adds an interaction surface and would require new open/close state, outside visual-only scope |

Direction B is selected because it improves comprehension without inventing state, changing callbacks, or introducing a new interaction boundary.

## Five improvements

1. Add a Four-only shell class to the existing header row so tournament identity and the existing Leave button become a coherent phone command rail.
2. Give the existing Leave button a clear secondary-danger treatment, full-width phone behavior, and safe-area-aware spacing while preserving its exact handler and disabled expression.
3. Add visual grouping around the existing connection indicator and voice/recovery sequence through a presentational wrapper only; no state or callback changes.
4. Improve long room IDs, recovery messages, and connection labels with resilient wrapping and readable line length without horizontal overflow.
5. Add short-landscape density and focus/reduced-motion safeguards for the command rail, with no new motion and no semantic-state inference.

## Protected contract

Protected callbacks, props, state, effects, routes, Firebase reads/writes/listeners, room lifecycle, navigation outcomes, loading/disabled truth, target privacy, rounds, timers, scoring, bracket state, 1v1, and 2v2 remain unchanged. The implementation may add presentational class names and wrappers only. Allowed files: `src/pages/CompetitiveModePage.jsx` for presentation-only class/wrapper additions and `src/index.css` for scoped styling.

Non-goals: no new menu, no new local state, no new retry behavior, no new connection semantics, no gameplay changes, no changes to the postgame callbacks, and no dependencies.

## Motion contract

No new animation is required. Existing transitions remain bounded and any scoped movement is avoided. The review must confirm no `transition: all`, no layout-property animation, no ungated hover motion, and reduced-motion safety.

## Verification gates

Source/diff scope audit; protected-node search; `git diff --check`; full smoke tests; Team Battle tests; production build; local Four route; phone-width CSS/media query checks at 320/375/430 and 667x375 where available; overflow check; focus and reduced-motion source checks; public deployment marker after GitHub Pages completes.

## Rollback boundary

Rollback only the Cycle 8 commit(s), leaving prior Cycle 7 and post-tournament releases intact.

## References

[1]: https://www.w3.org/TR/WCAG22/ "Web Content Accessibility Guidelines 2.2"
[2]: https://m3.material.io/foundations/designing/structure "Material Design 3 — Structure"
[3]: https://m3.material.io/components/icon-buttons/overview "Material Design 3 — Icon buttons"
[4]: https://emilkowal.ski/ui/great-animations "Great Animations"

The adaptation uses existing semantic controls and state projections only; no external code, branding, or dependency is copied.
