# Premium UX Safety Contract — Competitive Lobby Readiness

## Feature

Mobile-first premium readiness cues and interaction polish for the isolated Competitive Lobby, with special attention to Team Battle entry.

## Purpose / user problem

Players can create or join a room, but the next action and room readiness are currently communicated mostly through compact text and standard controls. On phones, this increases scanning effort and makes async states less tactile than the rest of the NEON GUESS visual language.

## Repository evidence

`src/pages/CompetitiveModePage.jsx` owns the isolated competitive lobby, already exposes `pendingAction`, `players`, `roomId`, `status`, and the Team Slot Preview, and already routes all mutations through `useCompetitiveMode()` actions. The enhancement can therefore remain a projection and interaction-layer change.

## Research evidence

Material and WCAG guidance support sufficiently large, separated touch targets. Apple motion/accessibility guidance supports motion as feedback rather than decoration and requires reduced-motion respect. See `docs/research/premium-ux-evidence-2026-08-19.md`.

## Files allowed to change

- `src/pages/CompetitiveModePage.jsx`
- `scripts/qa-smoke.mjs`
- this contract and the implementation report/retrospective

## Protected systems

Do not modify `CompetitiveModeContext.jsx`, `competitiveFirebase.js`, `teamBattleEngine.js`, Firebase paths, room schema, team assignment, scoring, round transitions, private targets, auth, or unrelated modes.

## MVP changes

Add a compact readiness strip in the waiting room, make create/join inputs semantically named and touch-safe, make primary actions explicitly button controls with busy state, and improve the leave/remove interactions with tactile/focus utility classes. Keep all existing handlers and `run()` orchestration unchanged.

## Non-goals

No new room write, no new state source, no automatic team assignment, no navigation redesign, no animated background, and no build/toolchain changes.

## Verification plan

1. Extend deterministic smoke assertions for readiness copy, `aria-busy`, semantic inputs, and the unchanged action calls.
2. Run `npm.cmd test`.
3. Run Vite route probe for `/team-battle` and all declared routes if available.
4. Attempt `npm.cmd run build` and classify the result independently.
5. Perform a second-pass static review for protected-file changes and malformed JSX.

## Rollback / stop condition

If the smoke contract or route probe fails, revert only the UI projection and smoke assertions. Stop immediately if implementation requires changing competitive Firebase or engine files.
