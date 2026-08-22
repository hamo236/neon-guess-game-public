# تقرير إصلاح أخطاء NEON GUESS

## المشكلة المرصودة

أظهر سجل التشغيل خطأين فعليين في مسار 2v2 Team Battle. الأول كان `ReferenceError: TeamBattleBoard is not defined` داخل `CompetitiveModePage.jsx`، ما كان يؤدي إلى سقوط مكوّن الصفحة وقيام `RouteErrorBoundary` بإعادة بناء الشجرة. الثاني كان رفضًا غير ملتقط عند تغيير الفريق برسالة `That team is full or the room has already started.`؛ الطلب كان يصل إلى Firebase ثم يخرج كـ Promise غير معالج من زر تغيير الفريق.

تحذيرات React Router الخاصة بالانتقال إلى v7 ليست سبب العطل ولم يتم تغييرها لأنها تحذيرات توافق مستقبلية وليست فشلًا في اللعب.

## السبب الجذري

كان فرع العرض النهائي يستدعي اسمًا غير موجود (`TeamBattleBoard`) بينما المكوّن الصحيح الموجود في الملف هو `TeamBattleGameplay`. لذلك كان المسار ينهار عند وصول الحالة إلى اللعب.

أما تغيير الفريق فكان يستدعي `actions.changeTeam` مباشرة من `onClick` دون المرور عبر دالة `run` التي تلتقط الأخطاء وتعرضها للمستخدم. لذلك كان رفض المعاملة المتوقع عند امتلاء الفريق أو بدء الغرفة يظهر كـ `Uncaught (in promise)`.

## الإصلاحات المنفذة

تم استبدال استدعاء `TeamBattleBoard` بالمكوّن الموجود `TeamBattleGameplay`، مع إبقاء منطق الجولة، الأهداف، التأكيد الثنائي، Firebase، وTournament دون تغيير.

تم تمرير تغيير الفريق عبر غلاف UI guarded action يستخدم `run(..., 'team')`. أصبحت أخطاء الامتلاء أو بدء الغرفة تظهر داخل رسالة خطأ مرئية مع منع التكرار أثناء الطلب بدلًا من كسر الـ Promise أو ترك خطأ غير معالج في Console. لم يتم تغيير قاعدة امتلاء الفريق أو فتح أي كتابة إضافية في Firebase؛ الرفض ما زال authoritative.

تم تحديث عقود QA القديمة لتطابق واجهة Team Battle الحالية بعد إزالة Guess Board، مع الإبقاء على تحقق الهدف المنافس، زر التأكيد، خصوصية الأهداف، وتنظيف الغرفة transactionally.

## التحقق

| البوابة | النتيجة | الدليل |
|---|---|---|
| Team Battle UI/adapter contract | PASS | تحقق من عدم وجود Guess Board والمؤقت، وجود الهدف المنافس والتأكيد authoritative، وقواعد Firebase الخاصة بالتأكيد والتنظيف. |
| Repository smoke contract | PASS | نجحت فحوصات الدعوات، الحماية، الاسترداد، المسارات التنافسية، Team Slot Preview، والتنقل. |
| Production build | PASS | `vite build` اكتمل بنجاح. ظهر فقط تحذير bundle/dynamic-import غير حاجب للإصدار. |
| Live Team Battle route | PASS | `/team-battle` فتح وأظهر شاشة إنشاء/انضمام للغرفة دون انهيار. |
| Live browser console | PASS | اختفى `TeamBattleBoard is not defined` ولم يظهر خطأ Promise جديد في فتح المسار. |
| Live Firebase / أربعة عملاء | NOT VERIFIED | البيئة المحلية تعمل بوضع local engine بسبب غياب Firebase credentials، لذلك يلزم اختبار staging بأربعة عملاء مستقلين. |

## الحالة الحالية

**FIXED for the reported local runtime crash and unhandled UI action error.** الحالة release-wise هي **CONDITIONAL** وليست READY؛ لأن التحقق الحقيقي من Firebase متعدد العملاء لم يُنفذ في هذه البيئة.

## الاختبار العملي المقترح

افتح `/team-battle`، أنشئ غرفة، ثم جرّب تغيير الفريق مع فريق ممتلئ. يجب أن تبقى الصفحة سليمة، وأن تظهر رسالة مفهومة بدل `Uncaught (in promise)`. بعد ذلك اختبر أربعة عملاء authenticated في staging: إنشاء الغرفة، الانضمام، تغيير الفرق، Start Match، تأكيد اللاعب الأول والثاني، الانتقال بين الجولات، ثم refresh/reconnect.

## الملفات الأساسية

- `src/pages/CompetitiveModePage.jsx`
- `scripts/qa-team-battle-ui.mjs`
- `scripts/qa-smoke.mjs`
- `REPORT_BUG_FIX_PASTED_CONTENT_12.md`

## قرار Release-QA

**CONDITIONAL**: الإصلاح البرمجي والتحقق المحلي ناجحان، لكن اعتماد الإنتاج يتطلب `LIVE FIREBASE VERIFIED` و`FOUR-CLIENT VERIFIED`.
