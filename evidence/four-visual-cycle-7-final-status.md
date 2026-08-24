# Four-player Visual Evolution Cycle 7 — Final Status

## Release

Cycle 7 is **READY** and published on `main` in commit `80c7a88` (`Improve four-player mobile voice controls`) for `hamo236/neon-guess-game-public`.

Public route: https://hamo236.github.io/neon-guess-game-public/tournament

GitHub Pages workflow: https://github.com/hamo236/neon-guess-game-public/actions/runs/32683375658

The workflow completed successfully. GitHub reported only the existing Node.js 20 action deprecation annotation; it did not fail the build or deployment.

## Scope proof

The implementation diff contains one source path, `src/index.css`, plus Cycle 7 documentation. No JSX, context, hook, mode, Firebase, rule, configuration, dependency, route, lobby, 1v1, or 2v2 logic file changed. The implementation is scoped under `.ng-tournament-shell .voice-room-panel` and uses only existing classes, attributes, and responsive media queries.

## Five presentation improvements shipped

1. A Four-only Match Voice Capsule frame now gives the existing panel a stable in-flow glass surface with restrained cyan/magenta edge treatment.
2. The existing `MATCH VOICE` / `TEAM VOICE` identity label remains visible and readable on phones rather than becoming icon-only.
3. Existing voice icon controls receive a larger 2.75rem minimum touch/visual area, with a compact short-landscape override, while their handlers and states are unchanged.
4. Existing `aria-pressed`, disabled, and focus-visible attributes receive clearer CSS-only affordances.
5. Short-height landscape density and reduced-motion behavior are explicitly scoped to the voice capsule; no new animation is introduced.

## Verification

| Gate | Result | Evidence |
| --- | --- | --- |
| `git diff --check` | PASS | Completed without output before commit |
| Full smoke QA | PASS | `npm test` — invite, timeline, rematch, host guards, recovery, competitive, daily drop, and dead-link contracts |
| Team Battle QA | PASS | `npm run test:team-battle` — flow, UI/adapter, and target freshness |
| Production build | PASS | `npm run build`; Vite build and SPA fallback completed |
| Protected scope audit | PASS | Only `src/index.css` was an implementation change |
| Local route | PASS | `/neon-guess-game-public/tournament` rendered the Four-player lobby |
| Local overflow | PASS | `document.documentElement.scrollWidth > document.documentElement.clientWidth` returned `false` |
| Local CSS | PASS | Source stylesheet contained the Cycle 7 marker and scoped selectors/rules |
| Public route | PASS | Public tournament route rendered Four-player lobby after deployment |
| Public CSS | PASS | Live hashed CSS contained the Four-only voice scope, button sizing selector, landscape rule, and reduced-motion rule |
| Motion review | APPROVED | No new animation; existing transitions remain bounded and reduced motion disables them for the scoped capsule |
| Pages workflow | PASS | Run `32683375658` succeeded |

The production CSS minifier removes comments, so the literal `Cycle 7` comment is not expected in the public hashed bundle. The public proof therefore checks the compiled selectors and behavior rules, which were present in `assets/index-CT8RN8XR.css`.

## Constraints and limits

The browser audit verified the public tournament lobby and stylesheet at the available browser viewport and confirmed no horizontal overflow. It did not create an authenticated multiplayer room or force a live voice call, so direct rendered inspection of an active connected/muted voice panel is not claimed. The call lifecycle, audio behavior, participant scope, match identity, Firebase synchronization, gameplay, rounds, targets, timers, scoring, 1v1, and 2v2 were not changed.

## References

[1]: https://www.w3.org/TR/WCAG22/ "Web Content Accessibility Guidelines (WCAG) 2.2"
[2]: https://m3.material.io/components/icon-buttons/overview "Material Design 3 — Icon buttons"
[3]: https://m3.material.io/foundations/designing/structure "Material Design 3 — Structure and touch targets"
[4]: https://emilkowal.ski/ui/great-animations "Great Animations"
