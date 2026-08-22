# Release / QA Guard Report

## Scope

هذا التدقيق يراجع تنفيذ **Active Match Recovery Card / Rejoin Active Match** في NEON GUESS بعد التنفيذ السابق، وفق مبدأ: audit → discover → diagnose → repair → verify → second-pass review.

النطاق شمل `GameStateContext.jsx`، `LobbyPage.jsx`، `ActiveMatchRecoveryCard.jsx`، `scripts/qa-smoke.mjs`، عقد السلامة، ومسار Vite المحلي. الأنظمة المحمية هي room authority، player identity، Firebase listeners، scoring، round/match progression، host authorization، وsession persistence.

## Decision

# **CONDITIONAL**

الميزة والإصلاح الإضافي قابلان للاختبار الداخلي المحدود. لا يصح إعلانها READY للإنتاج قبل تحقق حي من Firebase متعدد العملاء وسلوك refresh/reconnect داخل المتصفح.

## Executive Summary

المراجعة اكتشفت مشكلة حقيقية متوسطة الخطورة: زر `TRY AGAIN` كان يستدعي `retryAutoRejoin` من الواجهة، لكن action لم يكن يملك guard مستقلًا ضد استدعاءين متزامنين. في حالة نقرات سريعة أو event duplicate، كان من الممكن إطلاق محاولتي reconnect قبل اكتمال الأولى.

تم إصلاح السبب الجذري بإضافة `rejoinAttemptedRef.current` إلى guard داخل provider action نفسه، وليس في الواجهة فقط. كما أُضيف deterministic regression assertion في `qa-smoke.mjs` لمنع إزالة الحماية مستقبلًا.

## Original feature

الغرض الأصلي هو عرض جلسة المباراة المحفوظة للمستخدم بعد refresh أو انقطاع اتصال، مع حالات restoring وretryable وterminal وidentity، وإتاحة retry أو بدء غرفة جديدة دون إنشاء مصدر authoritative ثانٍ.

## Issues discovered and repairs

| Severity | Location | Root cause | Impact | Repair | Status |
|---|---|---|---|---|---|
| MEDIUM | `GameStateContext.jsx:retryAutoRejoin` | Manual retry لم يكن محميًا من duplicate invocation عند حدود الواجهة | قد تحدث محاولتا reconnect أو listener attach متقاربتان | إضافة `rejoinAttemptedRef.current` إلى guard قبل قراءة session أو استدعاء service | **FIXED** |
| LOW | Verification environment | جلسة Windows التفاعلية لا تعرض output كاملًا دائمًا | صعوبة قراءة تفاصيل الاختبار، رغم إمكانية التقاط exit status | استخدمنا `cmd /c` والتقطنا exit status صراحة، وسجلنا حدود runtime المتعدد | **CONTAINED** |
| MEDIUM | Live Firebase / browser | لم يتم تشغيل عميلين مستقلين أو إثبات refresh/reconnect داخل browser | لا يمكن تأكيد lifecycle الكامل من static source وحده | لم يتم اختلاق النتيجة؛ بقي قرار الإصدار CONDITIONAL | **OPEN VERIFICATION** |

## Root-cause trace

```text
SYMPTOM
Rapid TRY AGAIN clicks can overlap recovery calls.
↓
TRACE
Lobby button → ActiveMatchRecoveryCard.onRetry → actions.retrySessionRecovery → retryAutoRejoin.
↓
ROOT CAUSE
The provider action relied on UI state and did not independently reject a second in-flight call.
↓
FIX
Guard retryAutoRejoin with rejoinAttemptedRef.current before any session read or Firebase service call.
↓
TEST
qa-smoke.mjs asserts the duplicate-attempt guard; npm test returned EXIT:0.
```

## Verification Matrix

| Gate | Evidence | Result |
|---|---|---|
| Intent | Recovery card, retry, dismiss, and existing reconnect authority remain present | **PASS** |
| Source | Provider guard, classified states, Lobby projection, and safety contract reviewed | **PASS** |
| Scope | No new Firebase schema/path; no score, round, match, target, or host rule changes | **PASS** |
| Syntax / deterministic contracts | `npm.cmd test` via Windows project returned `EXIT:0` | **PASS** |
| Production build | `npm.cmd run build` via Windows project returned `EXIT:0` | **PASS** |
| Runtime server | `curl.exe http://127.0.0.1:5200/` returned `HTTP:200` | **PASS** |
| Browser behavior | Sandbox browser cannot reach Windows localhost; no visual interaction evidence | **NOT VERIFIED** |
| Firebase authority and writes | Source review only; no live trace | **SOURCE VERIFIED / LIVE NOT VERIFIED** |
| Multiplayer clients | No independent Clients A/B test | **NOT VERIFIED** |
| Refresh / reconnect | No live browser scenario completed | **NOT VERIFIED** |
| Regression | Existing smoke contracts cover invite, timeline, rematch, host guards, gameplay async guards, recovery, and dead links | **PASS (deterministic only)** |
| Git hygiene | Attached folder is not recognized as a Git working tree | **BLOCKED** |

## Protected systems checked

لم يتم تعديل `roomService.js` أو Firebase schema، ولم تتم إضافة كتابة جديدة من UI إلى room state. لم يتم تعديل scoring أو target privacy أو round IDs أو match IDs أو host migration أو branch progression. البطاقة projection فقط، وretry يعود إلى `reconnectOrJoinFirebaseRoom` عبر provider.

## Second-pass review

بعد إصلاح race، تمت مراجعة دورة retry مرة ثانية. الـguard يعمل قبل `loadSession()` وقبل `reconnectOrJoinFirebaseRoom()`. عند نجاح العملية يبقى المسار authoritative عبر `FB_ROOM_SYNC` والـlistener attach. عند الخطأ يتم عرض الحالة، وتُعاد قابلية المحاولة فقط بعد انتهاء العملية. terminal failures تمسح session المحلية، بينما retryable failures تحتفظ بها.

## Remaining risks

الخطر المتبقي ليس مثبتًا كخلل في المصدر، لكنه غير قابل للحسم دون runtime حي: duplicate Firebase listeners، سلوك returning player عند تغيّر phase أثناء reconnect، وتوافق session identity مع Client B. كذلك لا يوجد Git diff artifact في المجلد المرفق، لذلك تم الاعتماد على source inspection والملفات المعدلة بدل مراجعة commit diff.

## Required user tests before release

يجب اختبار refresh في Lobby وPreview وPlaying وResults، إيقاف الشبكة ثم الضغط المتكرر على `TRY AGAIN`، استعادة الشبكة، terminal room deletion، player identity mismatch، وبدء غرفة جديدة بعد dismiss. بعد ذلك يجب تشغيل Host وNon-host على عميلين مستقلين والتأكد من عدم إنشاء لاعب مكرر أو reset للجولة أو تغيير النقاط.

## Rollback / containment

للتراجع، أزل import/render الخاص بـ`ActiveMatchRecoveryCard` وأفعال recovery من provider، مع إبقاء service reconnect الأصلية كما هي. Guard duplicate retry يمكن إبقاؤه مستقلًا لأنه حماية عامة ولا يغيّر authoritative semantics.

## Final status

**PASS WITH MINOR RISKS** للتغيير البرمجي المحدود والاختبارات deterministic.

**Release decision: CONDITIONAL** بسبب عدم إثبات LIVE BROWSER وLIVE FIREBASE وFOUR-CLIENT verification.
