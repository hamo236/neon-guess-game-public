# NEON GUESS Performance Cycle Report

## Executive result

The first performance pass was completed as a deliberately isolated frontend change. The project’s gameplay, scoring, round transitions, Firebase adapters, voice lifecycle, target privacy, and routes were not modified. The change targets shared visual rendering cost, which is the safest layer for the reported sluggish scrolling and movement.

The current source is commit `cff4678` plus one uncommitted CSS-only optimization. The production build completed successfully, the full smoke QA passed, and the Team Battle QA chain passed.

## Baseline evidence

The production bundle before the pass contained a 639,427-byte main JavaScript asset and a 159,335-byte CSS asset. The largest lazy gameplay chunk was 87,685 bytes. The Tournament lobby runtime showed 75 DOM nodes, 52 resource entries in the development profile, and 6 elements with computed visual effects on the inspected surface. The development profile showed no recorded long tasks during initial load, so the complaint is more consistent with paint/compositing cost during movement or interaction than with a single startup task. Production measurements remain the authoritative next step because development mode includes Vite/HMR overhead.

## Research basis

React’s official guidance recommends measuring first, using `useMemo` only for noticeably expensive calculations or stable values passed to memoized children, and testing production builds rather than assuming development timings. web.dev recommends limiting animation to `transform` and `opacity`, avoiding layout/paint-triggering properties, and using DevTools recordings and dropped-frame checks. MDN warns that `will-change` is a last resort and that applying it broadly can increase memory and rendering work. web.dev’s INP guidance treats <=200 ms at the 75th percentile as good responsiveness, 200–500 ms as needing improvement, and >500 ms as poor.

## Diagnosis

The shared CSS uses multiple glass primitives with `backdrop-filter: blur(12px)` and `blur(20px)`, elevated shadows, glow shadows, broad `transition-all` utilities, and interaction effects. Backdrop blur and large shadows are paint/compositing costs that can become noticeable on mobile or lower-power devices, especially when several panels overlap or when a fixed voice panel is present. The existing CSS also already contains reduced-motion rules, so this pass preserves that accessibility contract.

The profile did not justify changing React state, Firebase listeners, timers, WebRTC, or game engine code. The measured source diff therefore remains limited to `src/index.css`.

## Implemented change

The shared visual primitives now use CSS variables for blur and shadow intensity. Desktop defaults reduce standard glass blur from 12px to 8px and heavy glass blur from 20px to 14px. Surface and elevated shadows were reduced modestly while retaining the neon hierarchy. On screens at or below 640px, the variables reduce blur to 4px and 8px and use smaller shadows. This preserves the visual language while lowering the amount of backdrop sampling and shadow painting on mobile devices.

No broad `will-change` addition was introduced. No `transition-all` sweep was performed. No gameplay component or state contract was changed.

## QA evidence

| Check | Result |
|---|---|
| `npm test` smoke suite | PASS |
| Team Battle QA chain | PASS |
| Production build | PASS |
| `git diff --check` | PASS |
| Protected context/Firebase/game/voice/page files changed | None |
| Main JavaScript asset size | 639,427 bytes, unchanged |
| Competitive gameplay chunk | 87,685 bytes, unchanged |
| CSS asset | 159,758 bytes after variable/minification changes |
| Local Tournament route loads | PASS |
| Runtime DOM smoke profile | PASS; 75 nodes, no initial long tasks recorded |

The CSS asset grew slightly because the new variables and mobile override are explicit; this pass is aimed at runtime paint/compositing cost, not bundle-size reduction. The JS and gameplay chunks are unchanged.

## Release decision

**CONDITIONAL READY for a frontend performance canary.** The change is low risk and isolated, and all available regression checks pass. A real-user or throttled-device performance conclusion cannot be claimed from the sandbox alone. The most useful next field check is a hard refresh on a mobile device, then repeated navigation, scrolling, lobby input, and match-panel interaction. If the device still feels heavy, the next evidence-led target should be a DevTools Performance recording of the exact gesture; only then should specific React subtrees or remaining glow effects be changed.

## References

[1] React — `useMemo`: https://react.dev/reference/react/useMemo

[2] web.dev — How to create high-performance CSS animations: https://web.dev/articles/animations-guide

[3] MDN — `will-change` CSS property: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/will-change

[4] web.dev — Interaction to Next Paint (INP): https://web.dev/articles/inp
