# Release / QA Guard Report — 2v2 Join-Order Repair

**المشروع:** NEON GUESS  
**النطاق:** Full-product regression and release gate after Team Battle `joinOrder` repair  
**التاريخ:** 19 أغسطس 2026  
**القرار:** **BLOCKED**

## Scope

الدفعة قيد المراجعة تصلح ترتيب لاعبي Team Battle عبر `joinOrder` محفوظ داخل transaction، وتستخدم نفس الترتيب في Team Battle engine input وفي Team Slot Preview. النطاق المتأثر هو Team Battle competitive room lifecycle، مع فحص تراجعي لكل routes المعلنة والـ smoke contracts المتاحة.

الأنظمة المحمية هي 1v1/Social، Tournament، `GameStateContext`، Team Battle scoring وround transitions، private targets، Firebase namespaces، authentication/session recovery، والـ routes غير المتأثرة.

## Decision

**BLOCKED**.

القرار ناتج عن release stop condition مؤكدة: production build يفشل بالأمر الحقيقي `npm.cmd run build` مع `exit 1`. هذا يمنع إنشاء release artifact موثوق. الإصلاح نفسه لا يحمل فشلًا مثبتًا في الاختبارات المتاحة، ولذلك لا يتم تصنيفه `NOT READY` بسبب logic regression؛ لكنه أيضًا لا يمكن أن يكون `READY` أو `CONDITIONAL release-ready` طالما build gate محجوب.

## Executive Summary

الاختبار الحتمي نجح، وجميع routes المعلنة أعادت HTTP 200 من SPA shell، كما اجتاز المصدر assertions الخاصة بـ join order والعزل. لم تتوفر جلسة Firebase حية بأربعة عملاء، ولم يتوفر Browser/device matrix في هذه الجولة. والأهم أن production build فشل، وهو مانع إصدار مستقل حتى مع نجاح smoke وroute probes.

## Verification Matrix

| Gate | Command / scenario | Result | Evidence label | Limitation |
|---|---|---|---|---|
| Intent | Team Battle seats must remain stable and preview must match engine input | PASS | SOURCE VERIFIED | Live client agreement not proven |
| Scope | Route/script/file inventory and protected-boundary review | PASS | SOURCE VERIFIED | No Git repository metadata available in attached root |
| Syntax / deterministic contracts | `npm.cmd test` | PASS — `QA_EXIT=0` | TEST VERIFIED | Contract-level, not live Firebase |
| Production build | `npm.cmd run build` | FAIL — exit 1 | BLOCKED BY ENVIRONMENT | Existing Node/Vite tooling blocker; no artifact |
| Runtime shell | Vite dev server + `/`, `/game`, `/results`, `/admin`, `/tournament`, `/team-battle`, `/daily` | PASS — all HTTP 200 | RUNTIME CHECK VERIFIED | Shell reachability, not page interaction |
| New Team Battle projection | `/team-battle` route probe and source assertions | PASS | SOURCE VERIFIED / RUNTIME CHECK VERIFIED | No authenticated lobby interaction |
| Firebase authority | Inspect writer, transaction, listener, and consumer path | PASS at source level | SOURCE VERIFIED | No live database session |
| Multiplayer | Two/four independent clients, simultaneous joins, reconnect, duplicate actions | NOT VERIFIED | NOT VERIFIED | Requires live clients and Firebase |
| Responsive UX | Small mobile, normal mobile, tablet, desktop | NOT VERIFIED | NOT VERIFIED | No browser/device matrix run |
| Error/recovery | Invalid room, full room, refresh/reconnect, navigation during pending join | SOURCE PARTIAL | SOURCE VERIFIED | Runtime failure injection not executed |
| Regression | Smoke contracts for Lobby, recovery, results, gameplay async guards, competitive, daily | PASS | TEST VERIFIED | Does not replace end-to-end flows |
| Performance | Render/network/memory sanity | NOT VERIFIED | NOT VERIFIED | No profiling session |
| Release hygiene | Secret scan / artifact review | PARTIAL | SOURCE VERIFIED | Build artifact unavailable |

## Evidence

The actual project exposes seven declared routes: `/`, `/game`, `/results`, `/admin`, `/tournament`, `/team-battle`, and `/daily`. The available scripts are `test`, `dev`, and `build`; there is no separate lint, typecheck, or E2E script in `package.json`.

The smoke suite passed after adding guards for persisted competitive host order, transactional next order, Team Battle sorting, and UI sorting. The runtime route probe returned 200 for all seven routes. The build command returned exit 1; the project has a known prior environment symptom documented as `Could not determine Node.js install directory`, and the current wrapper output does not produce a deployable artifact.

## Failures, Regressions, and Risks

The release-blocking failure is the production build gate. It is currently classified as an environment/tooling blocker rather than a confirmed Team Battle source regression because deterministic contracts and runtime shell probes remain successful, and the known baseline has the same Node/Vite failure family.

No protected-mode regression was observed in the available source and smoke checks. However, source inspection cannot prove the following: Firebase transaction behavior under simultaneous joins, a fifth-player rejection in a live room, reconnect preservation of `joinOrder`, private target delivery, round progression, or final scoring across four clients.

## Protected Systems Checked

The review preserved `GameStateContext`, legacy 1v1/Social mode, Tournament state, Team Battle engine scoring and transitions, private target paths, Firebase namespace boundaries, authentication/session restoration, and unrelated routes. No new Firebase root, security rule, schema branch outside competitive rooms, or client-side authority was introduced.

## What Was Not Verified

A live browser flow was not run, so accessibility, mobile overflow, touch behavior, focus order, and actual authenticated lobby interaction remain unverified. Live Firebase and four-client synchronization were not run. Production compilation and artifact generation are blocked.

## Required Fixes or User Tests

The next required gate is to run the build in a stable Node/Vite environment and obtain a deployable artifact. After that, execute one live four-client Team Battle scenario covering host creation, players B/C/D joining, simultaneous or near-simultaneous join ordering, fifth-player rejection, host start, target privacy, reconnect, three-round progression, and final scoring.

## Rollback / Containment

Containment is straightforward: keep the `joinOrder` repair and Team Slot Preview behind the isolated competitive Team Battle path, or revert the three changed source files plus smoke assertions if live QA reveals a contract mismatch. Do not ship a build produced from the current environment because no artifact was generated.

## Next Release Gate

**Repair or replace the Node/Vite build environment, rerun `npm.cmd run build`, then run live four-client Firebase verification.** Until both gates pass, the project remains **BLOCKED** for production release.
