# تقرير إصلاح هندسي وضمان جودة

## الملخص التنفيذي

تم اكتشاف وإصلاح فجوة حقيقية في حدود صلاحيات Multiplayer داخل `startGame`. واجهة الـLobby كانت تمنع اللاعب غير المضيف من الضغط على زر البداية، لكن طبقة `GameStateContext` لم تكن تضع نفس الحماية داخل action نفسه. لذلك كان من الممكن نظريًا أن يستدعي عميل Firebase غير مضيف هذا action مباشرة، فينفذ انتقالًا محليًا ويحاول كتابة `syncEnterPreview`.

أُضيفت حماية host-authoritative داخل action قبل تشغيل محرك اللعبة أو dispatch أو أي كتابة إلى Firebase. عند محاولة غير المضيف في غرفة Firebase، يظهر خطأ واضح: `Only the host can start the game.` ويظل state وFirebase بدون mutation. الوضع المحلي بدون Firebase لم يتغير.

**قرار الإصدار: CONDITIONAL.** الإصلاح مطبق ومثبت باختبار smoke، لكن build الإنتاج لم يُثبت في بيئة Linux بسبب `node_modules` من Windows، كما لم يتوفر اختبار Firebase حي متعدد العملاء.

## المشكلة المؤكدة

| ID | العرض | السبب المؤكد | الإصلاح | الدليل | الحالة |
|---|---|---|---|---|---|
| ENG-START-HOST-GUARD | زر الـLobby مقفول لغير المضيف، لكن action نفسه غير محمي داخل provider | `startGame` كان يستدعي `engineEnterPreview` ثم `dispatch` ثم `syncEnterPreview` بلا فحص `isHost`، بينما `beginRound` كان محميًا | إضافة guard داخل `startGame` قبل أي mutation، مع رسالة خطأ واضحة وتحديث dependencies للـhook | SOURCE VERIFIED + SMOKE TEST VERIFIED | مطبق |

## التغيير المنفذ

تم تعديل `src/context/GameStateContext.jsx` فقط في action `startGame`. الحماية تعمل عند `isFirebaseConfigured` فقط، ولذلك لا تكسر تجربة Local Mode. كما تم تعديل `scripts/qa-smoke.mjs` لإضافة contract يمنع رجوع فجوة الصلاحيات في المستقبل.

تم إنشاء عقد السلامة في `docs/ENG-START-HOST-GUARD-safety-contract.md`، ويوضح أن Firebase هو مصدر الحقيقة، وأن اللاعب غير المضيف لا يستطيع بدء preview، وأن التعديل لا يلمس schema أو scoring أو match/round identifiers أو listeners.

## الأنظمة المحمية

لم يتم تعديل محرك اللعبة، أو `beginRound`، أو النتائج، أو التصويت، أو إعادة اللعب، أو تعيين الأهداف، أو الترتيب، أو مسارات Firebase، أو session recovery، أو host migration، أو Social 3–4، أو 1v1، أو tournament/team modes. تم إصلاح authority boundary واحدة فقط، مع الحفاظ على UI الحالي الذي يعطل زر البداية لغير المضيف.

## مصفوفة التحقق

| البوابة | الأمر أو الفحص | النتيجة | الملاحظة |
|---|---|---|---|
| SOURCE VERIFIED | مراجعة `startGame` قبل وبعد engine/dispatch/sync | PASS | guard يأتي قبل كل mutation |
| CONTRACT VERIFIED | مراجعة عقد السلامة والـscope lock | PASS | لا schema ولا Firebase migration |
| TEST VERIFIED | `npm test` | **PASS** | smoke checks نجحت: invite، timeline، rematch، start/reset guards، dead links |
| BUILD VERIFIED | `npm run build` من النسخة المرفقة | NOT VERIFIED | `vite: Permission denied` بسبب executable layout من Windows |
| BUILD DIAGNOSED | تشغيل `node node_modules/vite/bin/vite.js build` | BLOCKED BY ENVIRONMENT | Rollup يفتقد `@rollup/rollup-linux-x64-gnu` |
| CLEAN BUILD | نسخ المشروع وتثبيت dependencies نظيفة | BLOCKED / STOPPED | `npm install` لم يكتمل خلال نافذة التحقق، ولم يتم تعديل المشروع الأصلي |
| BROWSER VERIFIED | تشغيل UI والضغط من عميل غير مضيف | NOT VERIFIED | المتصفح لم يكن متاحًا في هذه الجولة |
| LIVE FIREBASE VERIFIED | غرفة Firebase حقيقية | NOT VERIFIED | يحتاج credentials واتصالًا حيًا |
| MULTI-CLIENT VERIFIED | مضيف + لاعب غير مضيف | NOT VERIFIED | لم يتم الادعاء بتنفيذه |

## لماذا الإصلاح آمن؟

الـguard موجود في طبقة action، وليس في الزر فقط. هذا يمنع تجاوز UI من خلال stale client أو direct action call. كذلك، رفض الطلب يحدث قبل `engineEnterPreview(state)` وقبل `dispatch({ type: A.START_GAME })` وقبل `syncEnterPreview(...)`، فلا يتم إنشاء state محلي مضلل ولا كتابة Firebase غير مصرح بها.

## خطة التراجع

يمكن إزالة guard ورسالة smoke assertion بدون migration أو cleanup، لأن الإصلاح لا يضيف بيانات جديدة ولا يغير schema. لا توجد حاجة لمسح غرف أو إعادة ضبط sessions.

## الاختبار المطلوب على جهاز المستخدم

افتح غرفة Firebase من جهازين. من الجهاز غير المضيف، حاول الوصول إلى زر Start Game أو استدعاء نفس المسار بعد refresh/stale UI. يجب أن يبقى state كما هو، وألا تنتقل الغرفة إلى Preview. من جهاز المضيف، يجب أن يعمل Start Game كما كان وينقل الغرفة إلى Preview. بعد ذلك أكمل Begin Round وتأكد أن الجولة لا تبدأ مرتين.

## الحالة النهائية

**CONDITIONAL — الإصلاح البرمجي مكتمل، وsmoke test ناجح، وحدود authority أصبحت صحيحة على مستوى action.** يلزم build نظيف وتشغيل اختبار Firebase متعدد العملاء قبل رفع الحالة إلى READY.
