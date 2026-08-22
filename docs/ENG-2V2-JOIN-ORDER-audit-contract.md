# ENG-2V2: Preserve Join Order for Team Assignment

## Symptom

The Team Battle UI explains that Team A and Team B are grouped by join order, but competitive player objects do not carry a persisted `joinOrder`. The engine receives `Object.values(state.players)` and assigns the first two enumerated objects to Team A and the next two to Team B.

## Root cause

`createModePlayer` has no join-order field, and `createCompetitiveRoom`/`joinCompetitiveRoom` append player objects without a persistent ordinal. JavaScript/Firebase object-key enumeration is not a valid authority for player seat or team placement.

## Impact

The same four authenticated players can see or receive different team grouping after synchronization, reconnect, or key-order changes. This is a Multiplayer correctness risk, not merely a cosmetic issue.

## Minimal repair

Add a persisted `joinOrder` at the competitive Firebase room boundary. The host receives `joinOrder: 1`; each accepted new player receives the next monotonic order inside the same transaction. Existing player rejoin keeps its stored value. Before Team Battle state creation, sort players by `joinOrder`, with a deterministic fallback only for legacy records that lack it. The lobby preview uses the same persisted ordering.

## Protected boundaries

Do not change legacy `GameStateContext`, 1v1/Social, Tournament engine behavior, Firebase roots, private target paths, scoring, round transitions, or authentication. The Team Battle engine remains the authority for `teamByPlayer`; this repair only makes its input order authoritative and stable.

## Acceptance

The smoke contract must assert join-order writes and consumer sorting. `npm.cmd test` must pass. The source review must confirm that Team Battle creation and preview do not use raw Firebase object order. Production build and live four-client synchronization remain separate evidence gates.
