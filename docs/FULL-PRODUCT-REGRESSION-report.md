# تقرير تدقيق الانحدارات الشامل — NEON GUESS

## الملخص التنفيذي

أُجري تدقيق شامل لمسارات NEON GUESS بعد إضافة Active Match Recovery. شمل التدقيق المسارات الأساسية، Lobby، Game، Results، session recovery، والأنماط التنافسية المعزولة Tournament وTeam Battle.

اكتشف التدقيق مشكلة مؤكدة في الأنماط التنافسية: أزرار إنشاء الغرفة والانضمام وبدء المباراة والمغادرة وإزالة لاعب لم تكن محمية بحالة pending مشتركة على مستوى الصفحة. كان ذلك يسمح بنقرات متكررة وإرسال عمليات async متوازية، كما أن رسالة الفشل لم تكن تحمل دور وصول واضحًا.

تم إصلاح المشكلة دون تعديل نموذج Firebase أو قواعد النقاط أو انتقالات الجولات authoritative.

## الإصلاح المنفذ

أُضيف `pendingAction` داخل `CompetitiveModePage` مع runner مركزي يمنع أي عملية جديدة أثناء وجود عملية سابقة، ويعيد الحالة في `finally` حتى بعد الفشل. رُبطت الحالة بأزرار Create Room وJoin Room وStart Match وLeave وRemove Player، مع feedback نصي واضح مثل `Creating…` و`Joining…` و`STARTING…` و`Leaving…` و`REMOVING…`.

كما أضيف `role="alert"` و`aria-live="polite"` إلى رسالة فشل الأنماط التنافسية. وتم توسيع `qa-smoke.mjs` بعقود تمنع إزالة هذه الحماية أو فصل pending state عن قائمة اللاعبين.

> الإصلاح يحمي تكرار الطلبات في واجهة الأنماط التنافسية، لكنه لا يدّعي إثبات صحة Firebase متعدد العملاء دون اختبار حي.

## مصفوفة التحقق

| البوابة | النتيجة | الدليل |
|---|---|---|
| فحص routes وentry points | PASS | App وLobby وGame وResults وTournament وTeam Battle تمت مراجعتها |
| dead-link scan | PASS | لا توجد نتائج `href="#"` في source |
| existing smoke contracts | PASS | العقود السابقة ما زالت ناجحة |
| competitive pending-action contracts | PASS | أضيفت assertions إلى `qa-smoke.mjs` |
| `npm test` | PASS | `EXIT:0` على Windows |
| `npm run build` | PASS | `EXIT:0` على Windows |
| Windows runtime probe | PASS | `HTTP:200` من `http://127.0.0.1:5200/` |
| Browser visual interaction | NOT VERIFIED | المتصفح المعزول لا يصل إلى localhost الخاص بجهاز Windows |
| Firebase multi-client synchronization | NOT VERIFIED | يحتاج عميلين حقيقيين واتصال Firebase فعليًا |
| host migration and reconnect race | NOT VERIFIED | لم يتم تشغيل سيناريو حي متعدد العملاء |

## الأنظمة المحمية

لم يتم تغيير authoritative schema، ولا مسارات Firebase الخاصة بالغرف، ولا scoring، ولا bracket progression، ولا target privacy، ولا صلاحيات المضيف داخل `CompetitiveModeContext`. التعديل محصور في منع تكرار عمليات الواجهة وإظهار حالة العملية والفشل.

## المخاطر المتبقية

الخطر الرئيسي المتبقي هو أن build والاختبار المحليين لا يثبتان وحدهما صحة السباق بين عدة عملاء. يجب اختبار إنشاء غرفة، انضمام أربعة لاعبين، بدء المباراة، النقر المتكرر على Start وLeave وRemove، ثم الانتقال عبر الجولات والنتائج مع اتصال Firebase حقيقي.

## قرار الجودة

**QA Status: PASS WITH SCOPED FIXES**

**Release Decision: CONDITIONAL**

المنتج يمر بوابات source، smoke، build، وWindows runtime. لا يمكن إعلان READY قبل إكمال اختبار Firebase متعدد العملاء واختبار المتصفح البصري على الجهاز الفعلي.

## اختبار الاعتماد النهائي المطلوب

يجب فتح عميلين أو أربعة على Windows، إنشاء غرفة Tournament أو Team Battle، تنفيذ النقرات المتكررة على العمليات المحمية، التحقق من ظهور حالة pending مرة واحدة، ثم تعطيل الشبكة وإعادتها أثناء join/leave/start. يجب التأكد من أن كل عميل يرى نفس المرحلة وأن Firebase هو المصدر الوحيد للحالة authoritative.

## الملفات المعدلة

- `src/pages/CompetitiveModePage.jsx`
- `scripts/qa-smoke.mjs`

## الملفات المرجعية

- `src/context/CompetitiveModeContext.jsx`
- `src/pages/LobbyPage.jsx`
- `src/components/ActiveMatchRecoveryCard.jsx`
- `src/context/GameStateContext.jsx`
