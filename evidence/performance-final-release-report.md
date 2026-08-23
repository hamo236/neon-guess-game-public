# NEON GUESS — Final Non-GPU Performance Release Report

## Executive conclusion

A second non-GPU performance pass was implemented and verified. The visual identity was preserved: the strongest shared Tournament surface still reports `backdrop-filter: blur(20px)` and its existing neon shadow remains present. The optimization targets the cost of repeated work rather than removing the visual effect.

The final patch is CSS-only in `src/index.css`. No gameplay, Firebase, scoring, round, tournament, voice, authentication, or route files changed.

## Implemented scope

The patch narrows broad transitions so the browser does not animate blur, shadow, filter, or layout-related properties through `transition: all`. Existing interactive primitives now limit transitions to `transform`, `opacity`, `background-color`, `border-color`, and `color`. Broad compositor hints were removed from the shared interaction primitives with `will-change: auto`; no GPU-specific optimization was added.

The blur and glow values remain visually strong. The final runtime inspection reported `blur(20px)` on `.glass-panel-heavy`, the original large shadow, and `will-change: auto`. This confirms that the visual effect was not removed as part of the performance pass.

## Before/after evidence

| Measurement | Earlier baseline | Final preview | Interpretation |
|---|---:|---:|---|
| Tournament DOM nodes | 75 | 69 | Smaller current lobby render in the fresh preview |
| Runtime resources | 52 | 10 | Fresh preview request set is smaller and cached independently; not a direct network benchmark |
| CSS transfer in runtime profile | 148,828 bytes | 24,965 bytes | Fresh preview served compressed/negotiated asset; compare only as runtime transfer evidence |
| JS transfer in runtime profile | 295,638 bytes | 185,151 bytes | Fresh preview loaded the route with fewer requested chunks |
| Long tasks in profile | 0 | 0 | No long task observed during the tested initial route load |
| Production build time | baseline not recorded | 1.85s | Build completed successfully |
| Final CSS file size | previous build varied by hash | 159,729 bytes | CSS remained within the same order of magnitude; quality was not removed |

The runtime measurements are evidence of the tested route, not a promise of a fixed percentage improvement on every device. A real device profile is still the strongest confirmation for touch scrolling and interaction latency.

## Regression and safety checks

`npm test` passed. The production build passed and generated the GitHub Pages fallback. `git diff --check` passed. The final diff contains only `src/index.css`; protected gameplay, state, Firebase, voice, and route files are untouched.

The final commit is `971ffcd` with message `perf: preserve neon effects while narrowing motion costs`. It was pushed successfully to the `main` branch. The corresponding GitHub Pages run was queued at the time of the final status check.

## What was deliberately not changed

No GPU-specific feature was added. No blur strength was reduced in the final patch. No game rules, target privacy, round transitions, scoring, tournament bracket, Firebase listeners, voice room behavior, or navigation behavior were altered.

## Release status

The local rebuilt artifact is verified. The deployment workflow for commit `971ffcd` was queued; the previous performance deployment was successful. The public release should be considered **CONDITIONAL READY** until that specific workflow completes and a physical mobile device confirms smooth touch scrolling and button response.

## References

[1]: https://react.dev/reference/react/useMemo "React useMemo reference"
[2]: https://web.dev/articles/animations-guide "web.dev: Animations guide"
[3]: https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter "MDN: backdrop-filter"
[4]: https://web.dev/articles/inp "web.dev: Interaction to Next Paint"
[5]: https://firebase.google.com/docs/database/web/read-and-write "Firebase Realtime Database read and write data"

The report is based on the project baseline and the saved runtime console output under `evidence/`.
