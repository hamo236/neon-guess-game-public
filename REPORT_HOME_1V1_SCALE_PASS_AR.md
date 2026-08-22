# تقرير تنفيذ وتحقق — تبسيط Home و1v1

## القرار

تم تنفيذ التعديل في النسخة النشطة التي تحمل هوية المشروع `stitch_neon_guess_master` داخل المسار المرتبط بالـalias `H:\neon_game`. نطاق التنفيذ بصري فقط، مع الالتزام بقفل Gameplay Constitution.

## ما تم تنفيذه

| السطح | التعديل | النتيجة المقصودة |
|---|---|---|
| Home / Room Status | تحويل كتلة الحالة الكبيرة إلى capsule مضغوطة، وإعطاؤها `order-last` لتظهر في الأسفل ضمن تخطيط الصفحة | إبقاء إشارة Firebase والـrecovery مع تقليل الازدحام |
| Home idle | إخفاء beacon النصي `Create or join a room first` من Home فقط عبر شرط عرض presentation-only | إزالة الرسالة المكررة دون تغيير شرط Start Game أو room lifecycle |
| 1v1 entry | حذف بطاقة `ng-1v1-entry-header` التعريفية الزائدة من route 1v1 | جعل صفحة 1v1 أقرب إلى grammar الخاصة بـFour و2v2 |
| 1v1 Lobby | استبدال كلمة Lobby المرئية بالاختصار `LBY` مع إبقاء `aria-label` وبيانات اللاعبين | تقليل الارتفاع البصري على الهاتف |
| 1v1 roster | عرض السعة `2` في عداد اللاعبين عندما يكون الوضع 1v1 بدل استخدام سعة Four العامة | جعل الإسقاط البصري مطابقًا لعقد 1v1 الموجود أصلًا |
| 1v1 Join | إزالة الملاحظة التكرارية `Guess Who room...` فقط | إبقاء الاسم والكود وزر Join كما هي مع تقليل النص |

## العقد المحمي

لم تتغير الدوال `handleCreateRoom` أو `handleJoinRoom` أو `handleStartGame`، ولم تتغير `actions.createRoom` أو `actions.joinRoom` أو `actions.startGame` أو `actions.setMode` أو `actions.setCategory`. لم تُلمس Firebase/context أو routes أو effects أو loading/disabled truth أو room lifecycle أو category validation أو gameplay أو rounds أو scoring أو target privacy.

النتيجة: **NO CONSTITUTION CHANGE**.

## الأدلة المنفذة

| البوابة | الحالة | الدليل |
|---|---|---|
| هوية المشروع | TEST VERIFIED | `package.json` يعرّف المشروع باسم `stitch_neon_guess_master`، والمسار الجذري النشط هو alias `H:\neon_game` |
| نطاق الملفات | SOURCE VERIFIED | التعديل البرمجي في `src/pages/LobbyPage.jsx`، والتوثيق في `docs/design-decision-record.md` وهذا التقرير |
| callbacks والحالة المحمية | SOURCE VERIFIED | استعلام المصدر أظهر مسارات create/join/start/setMode كما هي، ولم يُضف أي writer أو listener |
| Home status | SOURCE VERIFIED | `ng-status-stack order-last` موجود، وكتلة الحالة ما زالت تستخدم `fbStatus` و`fbError` و`recovery` الحالية |
| Home idle beacon | SOURCE VERIFIED | الشرط أصبح `!roomCreated && !isOneVOneLobby`، لذلك لا يظهر في Home ولا يُحذف من التدفق الداخلي بعد إنشاء الغرفة |
| 1v1 simplification | SOURCE VERIFIED | بطاقة `ng-1v1-entry-header` وشرح `ng-1v1-join-context` لم يعودا موجودين، بينما create/join controls باقية |
| motion | SOURCE VERIFIED | لم تُضف حركة جديدة؛ `transition-all` الظاهر في الملف موجود في عناصر سابقة ولم يكن جزءًا من التعديل المقصود |
| build | BLOCKED / NOT VERIFIED | `npm run build` وVite المباشر انتهيا دون سجل usable من بيئة Windows المتصلة، مع غياب output واضح؛ لم أعتبر ذلك نجاحًا |
| browser mobile review | NOT VERIFIED | المعاينة المحلية لم تُفتح عبر الجلسة المتصلة ضمن المهلة المتاحة، لذلك لا أدعي تحققًا بصريًا runtime |

## مخاطر متبقية

الخطر المتبقي بصري فقط: يلزم تشغيل build ومعاينة حقيقية على 320px و360px و390px من بيئة المستخدم للتأكد من التفاف نص حالة الاتصال وعدم وجود overflow. لا توجد من الأدلة المصدرية إشارة إلى تغيير في السلطة أو منطق Firebase.

## الحكم

الحالة الحالية: **CONDITIONAL**، وليست READY، لأن build وruntime mobile visual review لم يثبتا. الكود المعدل محدود presentation-only، لكن بوابة الإصدار لا تُغلق دون تشغيل `npm run build` ناجحًا ومعاينة Home و`/one-v-one` على المقاسات المطلوبة.

## نقطة الرجوع

نقطة الرجوع هي diff العرض في `src/pages/LobbyPage.jsx` مع سجل القرار في `docs/design-decision-record.md`. لا ينبغي إعادة ضبط أو حذف ملفات أخرى.
