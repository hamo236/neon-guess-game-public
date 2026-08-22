# Engineering and QA Report

## Executive summary

تم تنفيذ نسخة MVP من **Active Match Recovery Card / Rejoin Active Match** داخل Lobby في NEON GUESS. الميزة تعرض حالة استرجاع الجلسة المحفوظة، وتستخدم مسار `reconnectOrJoinFirebaseRoom` الحالي فقط، مع أزرار إعادة المحاولة أو بدء غرفة جديدة عند الحاجة.

التغيير لا يضيف مصدرًا ثانيًا للحقيقة ولا يكتب إلى Firebase مباشرة من البطاقة. القرار الحالي هو **CONDITIONAL** لأن smoke test وbuild وruntime المتصفح لم يتم إثبات نجاحها في هذه الجولة بسبب مشكلة في جلسة Windows المرفقة وغياب سيرفر يمكن الوصول إليه من متصفح sandbox.

## Confirmed issues

| ID | Symptom | Root cause | Fix | Evidence | Status |
|---|---|---|---|---|---|
| ENG-RECOVERY-01 | Auto-rejoin failure كان يمسح sessionStorage بصمت ويعيد المستخدم للـLobby بلا تفسير أو retry | Catch داخل `GameStateContext` كان يسجل warning فقط ثم يستدعي `clearSession()` | تمت إضافة recovery state، وتصنيف terminal/retryable/identity failures، ورسائل واضحة وإعادة محاولة | Source inspection | Implemented, runtime not verified |
| ENG-RECOVERY-02 | لا يوجد user-facing card يوضح أن هناك مباراة محفوظة يمكن استرجاعها | الحالة لم تكن مكشوفة من provider إلى Lobby | تمت إضافة `ActiveMatchRecoveryCard` وربطها بالـLobby | Source inspection | Implemented, browser not verified |
| ENG-RECOVERY-03 | مسار الاسترجاع يحتاج إلى حماية من إعادة إنشاء room أو تغيير match state | خطر تصميمي عند إضافة retry منفصل | retry يعيد استدعاء service authority نفسها، ولا توجد أي كتابة room أو score أو round من البطاقة | Safety contract and source review | Implemented by design |

## Product improvement

المشكلة التي يعالجها التغيير هي فقدان وضوح الجلسة بعد refresh أو انقطاع اتصال. عندما توجد session محفوظة، يعرض الـLobby رقم الغرفة وحالة `RESTORING ACTIVE MATCH`. عند الفشل القابل لإعادة المحاولة يظهر `TRY AGAIN`. عند انتهاء صلاحية الغرفة أو رفض الهوية يظهر `START NEW ROOM`، ويؤدي ذلك إلى مسح session المحلية فقط وتصفير نموذج Lobby المحلي.

لا تتدخل البطاقة في host migration أو admission rules أو scoring أو round progression. `roomService.js` يظل مسؤولًا عن وجود الغرفة، والهوية، والـphase، والسعة، وقواعد إعادة الاتصال.

## Files changed

| File | Change |
|---|---|
| `src/context/GameStateContext.jsx` | Added recovery state, failure classification, guarded retry, dismiss action, and provider exposure. |
| `src/components/ActiveMatchRecoveryCard.jsx` | Added accessible UI projection for restoring, retryable, terminal, and identity states. |
| `src/pages/LobbyPage.jsx` | Added the recovery card beside existing Firebase status and wired retry/dismiss actions. |
| `scripts/qa-smoke.mjs` | Added deterministic contracts for the recovery component, provider actions, and Lobby insertion. |
| `docs/ENG-ACTIVE-MATCH-RECOVERY-safety-contract.md` | Added scope, authority, invariants, acceptance, and rollback contract. |

## Verification matrix

| Gate | Command or scenario | Result | Limitation |
|---|---|---|---|
| Project inspection | Read package scripts, room service, context, Lobby, existing recovery banner | **SOURCE VERIFIED** | None for inspected files |
| Safety boundary review | Confirmed card does not import Firebase or write room state | **SOURCE VERIFIED** | No live Firebase trace in this round |
| Smoke test | `npm test` / `node scripts/qa-smoke.mjs` on attached Windows project | **NOT VERIFIED** | Attached shell stayed in an interactive continuation state and did not return command output |
| Production build | `npm run build` | **NOT VERIFIED** | Not rerun after this change because the same Windows shell execution path was not returning reliable output |
| Browser runtime | `http://127.0.0.1:5200/` from sandbox browser | **BLOCKED BY ENVIRONMENT** | The server runs on attached Windows; sandbox browser received `ERR_CONNECTION_REFUSED` |
| Firebase reconnect | Existing player refresh/rejoin, retryable network failure, terminal room failure | **NOT VERIFIED** | Requires live Firebase and a real browser/client session |
| Multiplayer regression | Two-client host/non-host flow | **NOT VERIFIED** | Requires live multi-client environment |
| Diff hygiene | `git diff --check` | **BLOCKED BY REPOSITORY STATE** | Attached directory is not recognized as a Git working tree |

## Protected systems

لم يتم تعديل `roomService.js` أو قواعد admission، ولم تتم إضافة schema أو Firebase path جديد. لم يتم تغيير game engine، scoring، round IDs، match IDs، host migration، player identity، target privacy، أو listener ownership. البطاقة UI projection فقط، والـprovider يعيد استخدام خدمة reconnect الموجودة.

## Remaining risks and next actions

يجب تشغيل smoke test وproduction build من Windows الأصلية مع command منفصل بعد التأكد من أن جلسة PowerShell ليست في continuation mode. بعد ذلك يجب فتح التطبيق من نفس الجهاز، اختبار refresh أثناء lobby وpreview وplaying وresults، ومحاولة retry مع إيقاف الشبكة ثم إعادتها. وأخيرًا يلزم اختبار عميلين للتأكد من أن returning player يعاود الدخول من غير reset أو duplicate player.

## Release decision

**CONDITIONAL.** الكود المطلوب تم تغييره ضمن نطاق محدود، وعقد السلامة ومراجعة المصدر مكتملان. لكن لا يمكن إعلان READY لأن الاختبار المحدد، build بعد التغيير، browser runtime، وFirebase multi-client لم تُثبت في هذه الجولة. لا يوجد دليل حالي على فساد authoritative state، لكن ذلك يظل بحاجة إلى اختبار حي قبل الإصدار.
