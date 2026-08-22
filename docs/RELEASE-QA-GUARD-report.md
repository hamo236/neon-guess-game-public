# Release / QA Guard Report

## النطاق

المراجعة تخص مشروع **NEON GUESS** بعد دفعة Lobby Premium UI/UX وAccessibility، بما فيها إصلاح ربط labels الخاصة بـ Join Room. تم فحص مسارات التطبيق المعلنة، عقود smoke، shell runtime، الأنظمة المحمية، وقيود build الحالية.

النطاق المتوقع هو الحفاظ على تجربة Lobby وتحسين قابليتها للوصول بدون تغيير Firebase authority أو Multiplayer state. الأنظمة المحمية تشمل 1v1، Social 3–4، Tournament، Team Battle، Game Board، Results، authentication/session restoration، scoring، target privacy، room/match/round isolation، ومسارات Firebase.

## القرار

**BLOCKED**

السبب المباشر هو أن production build يفشل في البيئة المرفقة، مع وجود دليل baseline واضح: `Could not determine Node.js install directory`. وفق Release QA Guard لا يجوز وصف الإصدار بأنه جاهز عندما تكون بوابة build مطلوبة ومتعذرة، حتى مع نجاح smoke والـ runtime shell.

## الملخص التنفيذي

التعديل نفسه محدود ومفهوم، وتم إصلاح مشكلة Accessibility مؤكدة في Join Room. الاختبارات الحتمية نجحت، وجميع ملفات route target موجودة، وتم الوصول إلى SPA shell عبر Vite على كل المسارات السبعة المعلنة. لكن لم يتم إثبات production artifact، ولا live browser behavior، ولا Firebase multi-client synchronization. لذلك القرار النهائي Release-level هو **BLOCKED** وليس READY أو CONDITIONAL، لأن build gate فشل وهو release stop condition.

## Verification Matrix

| Gate | السؤال | النتيجة | الدليل أو القيد |
|---|---|---|---|
| Intent | هل يعالج التغيير هدف Lobby UX/Accessibility؟ | PASS | semantic selected states وform label associations موجودة |
| Source | هل المصدر يدعم السلوك بدون state جديد؟ | PASS | handlers وstate الحاليان محفوظان؛ لم يتغير Firebase path |
| Scope | هل التغييرات محصورة؟ | PASS | Lobby، smoke contract، docs؛ route targets لم تُحذف |
| Syntax / static | هل توجد imports أو attributes مكسورة؟ | PASS | second-pass static review: import واحد وبدون malformed class attribute |
| Deterministic tests | هل عقود المنتج الأساسية تمر؟ | PASS | `npm.cmd test` — exit 0 |
| Build | هل production build ينجح؟ | BLOCKED | `npm.cmd run build` — exit 1؛ baseline: `Could not determine Node.js install directory` |
| Runtime shell | هل SPA shell يرد على المسارات؟ | PASS | 7/7 routes returned HTTP 200 على Vite dev shell |
| Runtime behavior | هل flows تعمل فعليًا داخل Browser؟ | NOT VERIFIED | لم تُنفذ جلسة Browser تفاعلية كاملة |
| UX / responsive | هل mobile/tablet/desktop verified بصريًا؟ | NOT VERIFIED | source-level checks فقط؛ لا device matrix فعلية |
| Firebase | هل writes/listeners/security/persistence سليمة حيًا؟ | NOT VERIFIED | لا live Firebase session ضمن هذه الدفعة |
| Multiplayer | هل Clients A/B/C/D متزامنون؟ | NOT VERIFIED | لم ينفذ multi-client test |
| Regression | هل العقود المحمية ما زالت موجودة؟ | PASS | smoke contracts للـ host guards/recovery/competitive/daily/dead links تمر |
| Performance | هل الأداء مقبول في runtime؟ | NOT VERIFIED | لا profiling أو mobile performance run |
| Release hygiene | هل artifact النهائي صالح للطرح؟ | BLOCKED | build فشل، فلا يوجد artifact إنتاج مثبت |

## الأدلة

تم تشغيل `npm.cmd test` ونجح بـ exit 0. تم تشغيل `npm.cmd run build` وانتهى بـ exit 1. سجل `baseline-build.log` في المشروع يحتوي على رسالة `Could not determine Node.js install directory`، ما يثبت أن هناك blocker متعلقًا ببيئة Node وليس مجرد ادعاء غير موثق.

تم تشغيل dev server مؤقتًا على منفذ منفصل وفحص جميع المسارات المعلنة: `/`, `/game`, `/results`, `/admin`, `/tournament`, `/team-battle`، و`/daily`. النتيجة المسجلة كانت `ROUTES_OK=7 ROUTES_BAD=0 TOTAL=7`. هذا يثبت shell routing response فقط، وليس سلوك الصفحات التفاعلي أو Firebase.

## الإخفاقات والتراجعات والمخاطر

الفشل release-critical هو production build. لا يوجد في الأدلة الحالية regression مؤكد في Multiplayer أو Firebase، لكن عدم وجود regression لا يساوي live verification. المخاطر المتبقية تشمل عدم تنفيذ browser/screen-reader audit، عدم اختبار mobile viewport فعليًا، عدم تنفيذ create/join/start بين عميلين، وعدم التحقق من reconnect أو duplicate actions في بيئة Firebase حية.

## الأنظمة المحمية التي تم فحصها

تم التحقق ساكنًا من بقاء وجود `GameStateContext.jsx`، `GameBoardPage.jsx`، `GameResultsPage.jsx`، Tournament، Team Battle، Daily، SessionRouteRestore، وConnectionRecoveryBanner. كما استمرت smoke contracts الخاصة بالـ host authorization، recovery retry/dismiss، competitive pending actions، daily persistence boundary، scoring race guard، وdead-link prevention.

لم يتم تعديل room schema أو Firebase rules أو transaction logic أو reducers أو scoring أو target ownership أو match/round identifiers.

## ما لم يتم التحقق منه

لم يتم إثبات build artifact، ولم يتم فتح التطبيق في Browser تفاعلي عبر هذه البيئة، ولم يتم استخدام قارئ شاشة، ولم يتم اختبار viewport matrix، ولم يتم تشغيل live Firebase، ولم يتم تنفيذ two-client أو four-client verification. لذلك لا يجوز استخدام عبارات «جاهز للإصدار» أو «تم التأكد من Multiplayer».

## الإصلاحات أو اختبارات المستخدم المطلوبة

الخطوة التالية الوحيدة المطلوبة قبل إعادة بوابة الإصدار هي تشغيل production build في بيئة Node/Vite سليمة أو إصلاح إعداد Node الذي ينتج `Could not determine Node.js install directory`، ثم إعادة تشغيل build من نفس المشروع. بعد نجاحه يجب تنفيذ Browser/mobile smoke وtwo-client Firebase test قبل أي READY decision.

## الاحتواء والتراجع

التغيير محصور في projection/accessibility. يمكن rollback بإرجاع additions الخاصة بـ `aria-pressed` وlabel associations وbutton types، لكن لا توجد حاجة إلى rollback بيانات لأن Firebase schema وauthoritative writes لم تتغير. إلى أن يُحل build blocker، يجب احتواء الإصدار كنسخة اختبار داخلية فقط.

## بوابة الإصدار التالية

إعادة تشغيل `npm.cmd run build` بعد إصلاح بيئة Node، ثم إرفاق log ناجح. بعد ذلك فقط يُعاد تقييم قرار Release QA Guard مع live browser وmulti-client evidence.
