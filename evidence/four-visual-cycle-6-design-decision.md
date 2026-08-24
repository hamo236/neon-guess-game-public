# Four-player Visual Evolution Cycle 6 — Recovery Signal Rail

## Mode and scope

Mode: DESIGN_AND_IMPLEMENT. Target: existing Four-player recovery, connection, saved-room, and error/status surfaces inside the tournament shell, phone first. The attachment `pasted_content_12.txt` repeats the master mobile-first presentation-only prompt and explicitly permits the next five-item visual cycle; it does not authorize gameplay or data changes.

Active repository baseline: `472c5f6` (`Improve four-player mobile final results visuals`). Prior visual cycles cover lobby, active round/reveal, bracket, transition/waiting, and final results. Cycle 5's handoff ranked resilient waiting/error/reconnect communication as the next unresolved family.

## Evidence-based problem

The existing Four-player page renders recovery and error surfaces using generic utility classes directly in JSX. The surfaces already have semantic roles and existing controls, but they lack one coherent tournament-specific signal rail: dialog/status/alert surfaces do not share a stable mobile hierarchy, action groups can wrap inconsistently, and short-height landscape can waste vertical space. The safe opportunity is to improve presentation through scoped CSS selectors under `.ng-tournament-shell`, preserving all existing markup semantics and callbacks.

## Research adopted

1. W3C WCAG 2.2 (Recommendation, 12 Dec 2024): content should be perceivable, operable, understandable, and robust; status changes should remain programmatically determinable. Source: https://www.w3.org/TR/WCAG22/
2. W3C Guidance on Applying WCAG 2.2 to Mobile (Group Draft Note, 6 May 2025): mobile guidance highlights reflow, target size, focus, and status-message considerations. Source: https://www.w3.org/TR/wcag2mobile-22/
3. Emil Kowalski, Great Animations: purposeful, fast UI motion; usually under 300ms, ease-out, transform/opacity where motion exists, with reduced-motion support. Source: https://emilkowal.ski/ui/great-animations
4. Material Design 3: adaptive components, typography, shape, and motion should support usable, expressive products. Source: https://m3.material.io/

The adaptation is deliberately CSS-only and scoped to existing Four-player presentation. No external code, asset, dependency, state, or branding is copied.

## Three directions considered

1. **Floating incident toasts:** rejected because transient overlays can obscure legal actions and compete with the active match.
2. **Dense diagnostic console:** rejected because technical detail increases scan cost on a phone and is not the player's primary task.
3. **Recovery Signal Rail:** selected because persistent, semantic surfaces stay in document flow, preserve existing alert/status/dialog roles, keep the next legal action visible, and fit the Neon Match Console through restrained cyan/amber/red edge signals.

## Exactly five improvements

1. Scope all Four recovery/status/alert/dialog surfaces into a consistent mobile signal rail with stable padding, wrapping, and border hierarchy.
2. Give recovery action groups a resilient one-column phone layout and a safe compact landscape layout without changing button semantics or disabled conditions.
3. Improve semantic differentiation between restoring/status, retryable warning, identity/terminal error, and generic alert using existing roles and text only.
4. Add resilient long-content rules for room IDs, messages, and inline controls so unusual content cannot cause horizontal overflow.
5. Add a short-height landscape and reduced-motion treatment using only presentation properties; no new animation is introduced.

## Protected contract

Preserve every callback, prop, state branch, rendered value, timer, disabled/loading condition, Firebase operation, target/branch visibility rule, room lifecycle, navigation outcome, route, and semantic role. Do not edit contexts, engines, adapters, rules, configuration, dependencies, or protected modes. Do not add local sources of truth. Rollback boundary: revert the Cycle 6 CSS-only commit if any protected, responsive, accessibility, build, or scope gate fails.

## Allowlist

- `src/index.css` only for implementation.
- This evidence file and verification records are observation/documentation only.

## Verification gates

Run `git diff --check`, changed-file scope audit, full smoke QA, Four contracts, 1v1 contract, Team Battle QA, production build, and inspect the CSS markers. Runtime phone screenshot verification is required if the local app can be opened; otherwise report it as not verified rather than infer it from the build. Motion status is `MOTION_SOURCE_VERIFIED`; no new animation is introduced, so no motion review block is expected.

Author: Manus AI
Date: 2026-08-24
Recorded before implementation.

## References

[1]: https://www.w3.org/TR/WCAG22/ "Web Content Accessibility Guidelines (WCAG) 2.2"
[2]: https://www.w3.org/TR/wcag2mobile-22/ "Guidance on Applying WCAG 2.2 to Mobile Applications"
[3]: https://emilkowal.ski/ui/great-animations "Great Animations"
[4]: https://m3.material.io/ "Material Design 3"
