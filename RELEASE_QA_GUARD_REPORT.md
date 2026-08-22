# NEON GUESS Release / QA Guard Report

**Author:** Manus AI  
**Review date:** 2026-08-19  
**Decision:** **CONDITIONAL**

## Scope

This gate reviews the current route-level code-splitting improvement in the NEON GUESS React/Vite application. The intended outcome is a smaller initial lobby payload with safe lazy loading for noncritical routes, while preserving direct navigation and all protected multiplayer systems.

The reviewed change is limited to `src/App.jsx`, the route-splitting contract in `scripts/qa-route-splitting.mjs`, and its associated report. The reviewed scope does not change Firebase paths, auth, database rules, room mutations, Team Battle state transitions, Tournament logic, target privacy, synchronized confirmations, or deployment configuration.

The attached repair protocol was also reviewed. It requires discovery, prioritization, repair, build, deterministic testing, break testing, full regression, final code review, and explicit separation of verified versus unavailable evidence.

## Decision

### **CONDITIONAL**

The change is suitable for local and internal testing, and the available evidence supports the route-splitting implementation. It is not classified as unconditionally release-ready because real Firebase staging behavior with independent clients, four-client multiplayer verification, and multi-viewport responsive verification were not available in this environment. The project is running in local engine mode because Firebase credentials are absent.

This is not a failed implementation. It is a limited-scope release decision with named missing gates.

## Executive Summary

The implementation passed its focused route-splitting contracts, the existing source smoke suite, Team Battle deterministic QA, Tournament regression, and the production build. The live `/team-battle` route mounted successfully and displayed the 2v2 lobby. The browser console contained no application exception; it showed only the expected local Firebase configuration notice and React Router future-flag warnings.

The production build emits separate chunks for Tournament, Team Battle, Game Board, Results, Daily, Admin, and related route modules. The main chunk is approximately 600.78 kB minified and 151.81 kB gzip, down from the previous approximately 713–714 kB minified baseline. Vite still reports a main-chunk warning above 500 kB, which is a follow-up performance item rather than a route failure.

## Verification Matrix

| Gate | Status | Evidence | Guard interpretation |
|---|---|---|---|
| Intent | PASS | Route-splitting plan and `src/App.jsx` | The implementation directly addresses initial-load work without altering game rules. |
| Source | PASS | `React.lazy`, dynamic imports, `Suspense`, route error boundary | The intended loading and failure paths exist in source. |
| Scope | PASS | Scope lock and changed-file review | No Firebase, engine, room, target, or deployment system was changed. |
| Syntax / types / lint | NOT VERIFIED | No typecheck or lint script was available in the verified command surface. | Do not convert absence of scripts into a pass. |
| Route contracts | PASS | `node scripts/qa-route-splitting.mjs` | Six route-splitting contracts passed. |
| Source smoke | PASS | `npm test` → `node scripts/qa-smoke.mjs` | Existing invite, timeline, rematch, host guard, async guard, recovery, competitive guard, daily, and dead-link contracts passed. |
| Team Battle deterministic logic | PASS | `node scripts/qa-team-battle-engine.mjs` | Privacy, target ownership, two-player confirmation, single confirmation owner, and reset behavior passed. |
| Tournament regression | PASS | `node /home/ubuntu/tournament-regression.mjs` | Independent semifinals, authoritative bracket transition, and paired next matches passed. |
| Build | PASS | `npm run build` | Vite built successfully and emitted route chunks. |
| Runtime | PASS | Browser opened `http://localhost:4174/team-battle` | The 2v2 lobby mounted with name, category, room ID, Create Room, and Join Room controls. |
| Lobby / direct route UX | PASS | Browser smoke for `/team-battle`; prior smoke for `/` and `/tournament` | Direct competitive route remained reachable after lazy loading. |
| Browser console | PASS WITH WARNINGS | Console output at 2026-08-19 20:01 | No application exception. Firebase local-mode notice and React Router future warnings remain. |
| UX accessibility | PASS (focused) | Loading fallback includes `aria-live` and `aria-busy`; error boundary provides recovery action. | Full assistive-technology audit was not performed. |
| Firebase authority | SOURCE VERIFIED | Prior rules/adapter/engine audits and deterministic tests | The route change does not alter authority, paths, or mutations. |
| Live Firebase | NOT VERIFIED | Firebase config reported missing/placeholder variables | Requires staging credentials and a safe test room. |
| Multiplayer / four independent clients | NOT VERIFIED | No four-client live session available | Must be tested before production multiplayer release. |
| Protected-mode regression | PASS (deterministic/source) | Team Battle and Tournament suites | No regression was detected in the available automated coverage. |
| Responsive behavior | NOT VERIFIED | Current browser evidence was a single desktop-like viewport | Test small mobile, normal mobile, tablet, and desktop before final release. |
| Release hygiene | PASS WITH LIMITATION | No deployment operation and no secret changes observed | The attached directory is not a Git working tree, so Git diff/history could not be independently reviewed. |

## Evidence

The strongest current evidence is the combined execution output:

```text
Route splitting checks passed: 6 contracts.
QA smoke checks passed: invite, timeline, rematch, host-guards, gameplay async guards, recovery projection, competitive guards, daily drop, and dead-link contracts are present.
Team Battle privacy QA passed: shared hidden targets, owner-only confirmations, two-player gate, single confirmation owner, and reset.
Tournament regression QA passed: independent semifinals, authoritative bracket transition, and paired next matches.
✓ built in 1.26s
```

The browser route produced the expected Team Battle lobby content. The console contained no uncaught exception. The build emitted separate `TournamentPage`, `TeamBattlePage`, `GameBoardPage`, `GameResultsPage`, `DailyGuessPage`, and `AdminGateway` chunks.

## Failures, Regressions, and Risks

### Remaining medium-risk gate: live Firebase and four clients

The project reports: `Missing/placeholder env variables — running in local engine mode.` Therefore, this review did not verify real room creation, join transactions, auth identity, Firebase listener cleanup, reconnect, simultaneous client actions, or four-player synchronization in a live backend. This is the primary reason the decision is **CONDITIONAL**.

### Remaining medium-risk performance warning

The main JavaScript chunk remains above Vite’s 500 kB warning threshold. The route split is effective, but a separate bundle-analysis cycle may be warranted. Manual vendor chunking should not be added speculatively without measured dependency ownership and regression checks.

### Remaining low-risk console warnings

React Router v7 future-flag warnings appear. They are not current runtime exceptions, but they should be handled in a planned compatibility pass.

### Repository-history limitation

The attached project directory is not a Git working tree. The source files and generated evidence were reviewed, but Git history and a formal diff could not be independently inspected in this environment. This limits release-hygiene confidence but did not reveal an unsafe file or secret in the reviewed scope.

## Protected Systems Checked

The release guard specifically preserved and regression-checked the following systems:

- Team Battle target privacy and hidden answers.
- Authoritative target ownership and owner-only confirmation.
- Two-player confirmation gating before round advance.
- Team Battle reset and round isolation.
- Tournament semifinal independence, bracket transition, and paired next matches.
- Existing competitive source contracts, host guards, reconnect projection, and dead-link contracts.
- Firebase adapter and security boundaries by scope review; no related code was changed by the route-splitting feature.

## What Was Not Verified

The following statements must remain explicit:

- **LIVE FIREBASE VERIFIED:** NO.
- **FOUR-CLIENT VERIFIED:** NO.
- **MULTI-VIEWPORT VERIFIED:** NO.
- **TYPECHECK VERIFIED:** NOT AVAILABLE in the verified project scripts.
- **LINT VERIFIED:** NOT AVAILABLE in the verified project scripts.
- **GIT DIFF VERIFIED:** NO; the attached directory is not a Git repository.
- **LOCAL ROUTE RUNTIME VERIFIED:** YES for the observed Team Battle route; prior browser evidence also covered lobby and Tournament routes.
- **BUILD VERIFIED:** YES.
- **DETERMINISTIC TEAM BATTLE VERIFIED:** YES.

## Required Fixes or User Tests Before Unconditional Release

1. Configure a staging Firebase project with non-placeholder credentials and run a safe four-client matrix: host creates, players 2–4 join, host starts, both teams receive only their allowed target projection, both confirmation votes are required, round reveal occurs, refresh/reconnect restores the correct identity, and duplicate or out-of-order actions remain idempotent.
2. Repeat the route smoke test at a small mobile viewport, normal mobile viewport, tablet viewport, and desktop viewport. Confirm no overflow, clipped controls, hidden room code, or inaccessible loading/error state.
3. Re-run the exact deterministic suites and `npm run build` after any staging-only configuration or release changes.
4. Consider a separate performance cycle for the remaining main-chunk warning and the Firebase dynamic/static import warnings. Do not mix that optimization into the multiplayer release without a new regression gate.
5. Resolve React Router future warnings in a separate compatibility change or explicitly accept them with a tracked follow-up.

## Rollback / Containment

Rollback is low risk because the change is isolated to app-shell imports and route loading UI. Revert `src/App.jsx` and remove `scripts/qa-route-splitting.mjs` if necessary. No database migration, Firebase schema change, security-rule change, or user-data mutation is required for rollback.

Until the live Firebase and four-client tests pass, contain the change to local/internal testing or a staging deployment. Do not describe it as fully production-ready for the multiplayer release.

## Next Release Gate

The next gate should be a staging-only multiplayer verification with four independent clients plus multi-viewport browser checks. The desired transition is:

```text
CONDITIONAL
→ staging Firebase configured
→ four-client Team Battle verified
→ mobile/tablet/desktop verified
→ build and deterministic suites rerun
→ final diff/release artifact reviewed
→ READY or a new explicit blocker
```

## Final classification

**CONDITIONAL — approved for local/internal testing and staging validation; not yet approved for unconditional production release.**
