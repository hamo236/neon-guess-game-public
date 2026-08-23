# Research findings: preserving blur while improving smoothness

## Sources and verified findings

1. web.dev, High-performance CSS animations: https://web.dev/articles/animations-guide
   - Prefer transform/translate/scale and opacity for motion.
   - Avoid animating properties that trigger layout or paint.
   - Use DevTools Performance recordings, FPS meter, Paint Flashing, and Paint Profiler to identify the actual bottleneck.
   - Use will-change sparingly and only after evidence; remove it when the change stops.
   - Blur/shadow-like effects can be more expensive to paint than a flat color.

2. Chrome DevTools, Analyze runtime performance: https://developer.chrome.com/docs/devtools/performance
   - Profile runtime with screenshots and CPU throttling to simulate mobile hardware.
   - Inspect FPS, CPU, Main-thread flame chart, rendering, painting, forced reflows, and long tasks.
   - The goal is to reduce work, not to guess based on visual intuition.

3. React, Profiler: https://react.dev/reference/react/Profiler
   - Profiler measures render duration for a React tree.
   - actualDuration shows current render cost; baseDuration estimates unoptimized subtree cost.
   - Profiling adds overhead and should not be shipped as the normal production build.

4. MDN, backdrop-filter: https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter
   - backdrop-filter applies graphical effects to pixels behind an element.
   - Backdrop roots created by opacity/filter/mask/clip-path/will-change can change the filtering boundary.
   - will-change can alter backdrop-root behavior and must not be added broadly without testing.

## Decision-relevant conclusion

It is technically possible to preserve the visible blur/neo-glow identity while improving smoothness, but not by pretending blur is free. The safe strategy is to keep the effect visually, isolate it from frequently moving content, animate only a compositor-friendly wrapper using transform/opacity, avoid animating the blur/filter itself, reduce overlap/area rather than removing the design, and validate on throttled hardware. React rendering and Firebase listeners should only be changed when a trace proves they are the bottleneck.

## Project-specific baseline already observed

- Main JS asset about 639,427 bytes.
- Largest lazy gameplay chunk about 87,685 bytes.
- Tournament lobby DOM about 75 nodes.
- Six visual-effect elements on the inspected surface.
- No initial long tasks recorded in the local development smoke profile; this does not rule out interaction-time paint/compositing or rerender cost.

## No implementation in this research cycle

This file records external research only. No project code was changed for the present question.
