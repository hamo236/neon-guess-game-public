# NEON GUESS Performance Research

## Findings

1. React's official guidance says `useMemo` caches a calculation between renders, but it should be used only when a calculation is noticeably expensive, dependencies are stable, or the value helps a memoized child. It is not a substitute for fixing impure rendering or unnecessary Effects. Production builds should be measured because development Strict Mode can execute work twice. Source: React, `useMemo` reference.

2. web.dev's animation guidance recommends using `transform` and `opacity` for movement, scaling, and visibility because other properties can trigger layout or paint. It recommends DevTools Performance recordings, FPS/dropped-frame checks, paint flashing, and sparing use of `will-change`.

3. MDN warns that `will-change` is a last resort. Applying it to large sections or too many elements can increase memory use and make performance worse. It should be limited to small elements that are about to change and removed when the change stops.

4. web.dev defines INP as a Core Web Vital for responsiveness across the page lifecycle. A good INP threshold is <=200 ms at the 75th percentile; 200–500 ms needs improvement; >500 ms is poor. Lab and field measurements differ, so a local profile is evidence of lab behavior, not real-user performance.

## Recommended project application

- Measure before editing in a production build and with CPU throttling when possible.
- Prioritize long main-thread tasks, repeated React renders, large effects/shadows/blur paints, and layout-triggering animation properties.
- Keep Firebase listeners, game state, voice lifecycle, routes, target privacy, and gameplay callbacks untouched during a frontend performance pass.
- Prefer CSS-only changes to expensive visual effects and transform/opacity motion. Do not add `will-change` broadly.
- Use memoization only where profiling identifies a stable expensive subtree; do not scatter `useMemo` or `React.memo` without evidence.

## References

- [1] React — useMemo: https://react.dev/reference/react/useMemo
- [2] web.dev — How to create high-performance CSS animations: https://web.dev/articles/animations-guide
- [3] MDN — will-change CSS property: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/will-change
- [4] web.dev — Interaction to Next Paint (INP): https://web.dev/articles/inp
