# NEON GUESS Content Expansion Research Notes

## Scope
Research only. No code, data, image, Firebase, or deployment changes are authorized in this phase.

## Source 1
Source: https://firebase.google.com/docs/remote-config
Type: Official Firebase documentation
Date accessed: 2026-08-23
Claim or observed pattern: Firebase Remote Config can change client behavior and appearance without requiring users to download an app update. It supports in-app defaults, remote overrides, segmentation, rollouts, A/B testing, and real-time fetching. Firebase explicitly warns not to store confidential data in Remote Config because end users can access values available to their app instance. For larger structured data, Firebase points to Firestore, Realtime Database, or Cloud Storage depending on the need.
Limitations / possible bias: Documentation describes capabilities, not this project's current data contracts or gameplay authority.
How it relates to this project: Remote Config is suitable for feature flags, category visibility, rollout percentage, and difficulty toggles; it is not by itself the best canonical catalog for many player/animal/job records or images.
Decision: Adopt for controlled rollout/enablement flags; defer as primary content catalog.

## Source 2
Source: https://docs.github.com/en/actions/get-started/understand-github-actions
Type: Official GitHub documentation
Date accessed: 2026-08-23
Claim or observed pattern: GitHub Actions automates CI/CD using workflows triggered by pushes, pull requests, schedules, manual dispatch, or other events. Workflows contain jobs and steps running on fresh runners; tests can run before deployment.
Limitations / possible bias: General workflow documentation; does not validate the repository's current workflow.
How it relates to this project: A one-command content workflow can validate data, verify image references, build, run protected gameplay regression tests, and deploy only after passing.
Decision: Adopt as the future content publication gate.

## Source 3
Source: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
Type: Official GitHub documentation
Date accessed: 2026-08-23
Claim or observed pattern: Workflows are YAML files in `.github/workflows`; they can be triggered on pushes, pull requests, manually, or on schedules, and can use branch/path filters and job dependencies.
Limitations / possible bias: Syntax reference is broad and does not prescribe the project's content schema.
How it relates to this project: A dedicated content workflow can run only when `content/` or catalog files change, while deployment remains gated by tests.
Decision: Adopt path-filtered workflow design; do not mix content generation with gameplay runtime writes.

## Source 4
Source: https://vite.dev/guide/assets
Type: Official Vite documentation
Date accessed: 2026-08-23
Claim or observed pattern: Vite recommends importing assets when possible because they enter the build asset graph and receive resolved production URLs. The `public` directory preserves exact names and copies files to the dist root; those assets are referenced with root-absolute paths. Vite also supports `new URL(..., import.meta.url)` for statically analyzable asset paths.
Limitations / possible bias: Applies to Vite asset handling; the project's existing GitHub Pages base-path resolver must still be respected.
How it relates to this project: A scalable catalog should use stable asset references through one resolver or imported assets, with a validation script preventing broken base paths.
Decision: Keep a single asset resolver and add content validation before publication; do not scatter raw `/images` paths.

## Repository evidence
- Project is a React/Vite/Firebase game deployed to GitHub Pages under `/neon-guess-game-public/`.
- Current catalog is in `src/data/gameData.js` and currently contains category metadata plus item records for football, sports, and cartoons.
- Current lobby selection maps over `CATEGORY_META`; adding a type can be made data-driven if the category record contract is expanded.
- Current images are served from `public/images` and already require the shared Vite base resolver for GitHub Pages.
- `package.json` already includes image-path and protected Team Battle QA scripts.
- Protected systems: target selection, round/match progression, scoring, Firebase authority/synchronization, room lifecycle, privacy mapping, and existing mode behavior.

## Required distinction
Research evidence = statements directly supported by the sources or repository.
Inference = conclusions that follow from those facts but are not directly proven.
Recommendation = proposed architecture for a future implementation, not an executed change.

## Image sourcing and licensing research

### Wikimedia Commons
Sources: https://commons.wikimedia.org/wiki/Commons:Licensing and https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia
Observed pattern: Commons accepts free content and reuse depends on the individual file license. Some licenses require attribution and/or share-alike. A catalog should store author, source URL, license, and attribution text for every asset.
Decision: Good for openly licensed public-domain or Creative Commons assets when provenance metadata is stored; not a zero-maintenance source.

### Openverse
Sources: https://openverse.org/ and https://api.openverse.org/
Observed pattern: Openverse searches openly licensed and public-domain media and provides an API-oriented discovery route.
Decision: Useful as a discovery/import pipeline, but downloaded assets should be copied into the repository and verified rather than hotlinked at runtime.

### Unsplash
Source: https://unsplash.com/license
Observed pattern: Unsplash permits broad free use under its license, including commercial and noncommercial use, but the license and content-specific constraints should still be reviewed.
Decision: Suitable mainly for generic animals, jobs, or objects; less suitable for identifiable public figures because image rights, trademark, and editorial context can remain relevant even if the image license permits reuse.

## Research inference
Using names alone is operationally robust but visually weaker: the game becomes a text quiz rather than a visual recognition game. Using only remote image URLs is visually strong but brittle because of CORS, hotlinking, changed URLs, rate limits, and license/provenance drift. The recommended compromise is local, optimized images with a text fallback rendered only when an asset fails, while keeping the canonical item name separate from the presentation asset.
