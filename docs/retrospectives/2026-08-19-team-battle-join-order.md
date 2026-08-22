# Retrospective — Team Battle Join Order

**Date:** 2026-08-19  
**Subsystem:** Competitive Team Battle / Firebase room membership  
**Confidence:** High for the confirmed source defect; live Firebase behavior remains unverified.

## Symptom

The Team Battle lobby preview and Team Battle start path treated the order returned by `Object.values(state.players)` as the team seating order.

## Established root cause

Competitive player records had no persisted `joinOrder`. Firebase object-key enumeration was therefore used as an implicit ordering mechanism. That violates the NEON GUESS multiplayer invariant that identity and state transitions must not depend on object order, tab order, or local array position.

## Wrong assumption to avoid

A UI statement such as “grouped by join order” is not evidence that join order exists. A passing shell probe or smoke test that only checks markup also cannot prove team assignment correctness.

## Successful intervention

Persist `joinOrder` at the Firebase room boundary: host `1`, then the next monotonic value inside the join transaction. Sort Team Battle players by the persisted value before engine state creation and in the read-only lobby projection. Keep legacy modes and team engine rules unchanged.

## Verification

`npm.cmd test` passed with `QA_EXIT=0`. The Team Battle SPA shell returned HTTP 200. A static second pass confirmed the Firebase write, context sorting, and UI sorting. Production build remains blocked by the existing Node/Vite environment issue, and four-client Firebase behavior remains unverified.

## Regression-prevention rule

Any feature that assigns multiplayer seats, teams, brackets, or turns must identify and persist its ordering/identity field before adding a UI projection. Never use `Object.values`, display order, local array position, or tab order as authoritative multiplayer ordering. Add a smoke assertion for both the persisted writer and every consumer that derives gameplay state from it.

## Next-session diagnostic heuristic

If players report inconsistent teams after reconnect or simultaneous joins, inspect persisted membership ordering and transaction semantics before changing the UI or engine scoring. Compare the room payload, provider input, engine assignment, and UI projection in that order.
