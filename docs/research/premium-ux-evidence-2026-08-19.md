# Premium UX Evidence — 2026-08-19

## Research Evidence

The Material Design guidance surfaced in the search results recommends touch targets around 7–10 mm and treats the full responsive area, not only the visual icon, as the target. The W3C WCAG target-size guidance and Material accessibility guidance both support avoiding tiny or crowded interactive controls. Apple’s Human Interface Guidelines describe motion as a way to communicate status, feedback, and instruction, while accessibility guidance requires that motion not reduce usability.

## Inference

For NEON GUESS, the highest-value safe UX work is not decorative animation. It is making the next action obvious, enlarging and spacing the most-used controls on mobile, and providing immediate pressed/loading/error feedback while preserving the existing async handlers.

## Recommendation

Select a bounded MVP around the Lobby and Team Battle entry surfaces: standardize mobile touch targets, strengthen focus/pressed states, preserve reduced-motion behavior, and add clear pending feedback only where existing state already exposes it. Avoid changing room writes, team assignment, scoring, or Firebase listeners.

## Sources

[1]: https://m3.material.io/foundations/designing/structure — Material Design 3 structure and touch-target guidance.  
[2]: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html — W3C target-size guidance.  
[3]: https://developer.apple.com/design/human-interface-guidelines/motion — Apple motion guidance.  
[4]: https://developer.apple.com/design/human-interface-guidelines/accessibility — Apple accessibility guidance.
