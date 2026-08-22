# تقرير Premium UX — Competitive Lobby Readiness

**المؤلف:** Manus AI  
**التاريخ:** 19 أغسطس 2026  
**الحالة:** PASS WITH MINOR RISKS للدفعة المحددة، مع بقاء production release غير معتمد بسبب build blocker.

## الملخص التنفيذي

تم تنفيذ دفعة Premium UX mobile-first داخل واجهة الـ Competitive Lobby في NEON GUESS. الهدف لم يكن إضافة زخرفة بصرية منفصلة، بل جعل قرار اللاعب التالي أوضح، وجعل واجهة إنشاء/انضمام الغرفة أكثر قابلية للمس، وإظهار حالة الجاهزية والعمليات غير المتزامنة بطريقة فورية ومفهومة.

الإصلاح بقي محصورًا في طبقة projection والتفاعل داخل `src/pages/CompetitiveModePage.jsx`، مع توسيع عقد الاختبار في `scripts/qa-smoke.mjs`. لم يتم تغيير `CompetitiveModeContext.jsx` أو `competitiveFirebase.js` أو `teamBattleEngine.js`، ولم يتم تغيير room writes أو team assignment أو scoring أو round transitions أو private targets.

## المشكلة قبل التغيير

كانت واجهة Competitive Lobby تعرض أفعال Create Room وJoin Room وStart Match، لكنها لم تقدم شريط جاهزية واضحًا لمسار Team Battle، وكانت بعض الحقول والأزرار تعتمد على placeholder أو styling عام بدل اسم دلالي وحالة tactile/busy موحدة. كما بقيت قابلية فهم حالة `4/4` مقابل المقاعد المطلوبة موزعة بين نصوص متفرقة.

## التغيير المنفذ

تمت إضافة شريط `MATCH READINESS` لمسار Team Battle فقط. يعرض الشريط عدد المقاعد الحالية، ويغير النص من عدد اللاعبين المطلوبين إلى رسالة جاهزية واضحة عندما يصبح الفريق كاملًا. الشريط يستخدم `aria-live="polite"` كي تصل التغييرات الديناميكية إلى التقنيات المساعدة دون مقاطعة مزعجة.

تم رفع جودة اللمس والكيبورد في حقول اسم اللاعب، الفئة، وكود الغرفة عبر `min-h-11` و`touch-feedback` وfocus-visible ring، مع أسماء دلالية للحقول. كما أصبحت أفعال Create وJoin وStart وLeave أزرارًا صريحة من `type="button"`، وتعرض `aria-busy` متوافقًا مع `pendingAction` الحالي. هذا يحسن feedback من غير إضافة state جديد أو تغيير في `run()` أو handlers.

تم إصلاح artifact إغلاق JSX malformed في waiting-room header، وأضيفت حواجز smoke تمنع عودة الخطأ وتثبت وجود readiness strip وحالات busy وtouch utilities.

## مصفوفة الحماية

| النظام | القرار |
|---|---|
| Firebase room writes | لم يُمس |
| Competitive context | لم يُمس |
| Team Battle engine | لم يُمس |
| Team assignment / joinOrder | لم يُمس في هذه الدفعة |
| Scoring and round transitions | لم تُمس |
| Routes and navigation | لم تُمس |
| Authentication and persistence | لم تُمس |

## أدلة التحقق

| البوابة | النتيجة | الدلالة |
|---|---|---|
| Deterministic smoke suite | **PASS — `QA_EXIT=0`** | عقود Multiplayer السابقة وUX الجديدة موجودة بالمصدر |
| Static UX markers | **SOURCE VERIFIED** | readiness، `aria-live`، `aria-busy`، وtouch utilities مضافة |
| Malformed JSX guard | **PROTECTED** | smoke assertion يمنع artifact السابق |
| Runtime route probe | **INCONCLUSIVE / TIMEOUT** | جلسة Vite لم تُكمل كل المسارات في المهلة؛ لا يُعامل ذلك كنجاح |
| Production build | **BLOCKED — exit 1** | blocker بيئي مستمر؛ لا يوجد artifact |
| Firebase live test | **NOT VERIFIED** | يحتاج عميلين/أربعة عملاء في جلسة حية |
| Responsive viewport matrix | **NOT VERIFIED** | لم يتم تشغيل متصفح فعلي بأحجام متعددة |

## الحكم الهندسي

> الدفعة ناجحة كتحسين UX محدود ومحمى، لكنها ليست دليلًا على جاهزية release الكاملة.

الحالة الصحيحة هي **PASS WITH MINOR RISKS** على مستوى التغيير نفسه. أما حالة الإصدار العام فتظل **BLOCKED** حتى ينجح production build في بيئة Node/Vite مستقرة، ثم يتم تنفيذ تحقق Browser/mobile فعلي واختبار Firebase متعدد العملاء لمسار Team Battle.

## المخاطر المتبقية وخطوة الإصدار التالية

المشكلة الأعلى أولوية خارج نطاق هذه الدفعة هي استمرار فشل build مع `exit 1` في البيئة المرفقة. كما أن timeout في route probe يمنع اعتبار runtime navigation متحققًا بالكامل، رغم نجاح smoke source gate السابق.

قبل إعلان READY، يجب تشغيل `npm.cmd run build` في بيئة Node سليمة، ثم فحص `/team-battle` على viewport صغير وقياسي وتابلت، ثم تنفيذ سيناريو أربعة لاعبين يشمل join order، امتلاء المقاعد، رفض اللاعب الخامس، reconnect، بداية المباراة، الجولات الثلاث، والنتيجة النهائية.

## المراجع

[1]: https://m3.material.io/foundations/designing/structure — Material Design 3: touch targets and structure.  
[2]: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html — W3C WCAG target-size guidance.  
[3]: https://developer.apple.com/design/human-interface-guidelines/motion — Apple motion guidance.  
[4]: https://developer.apple.com/design/human-interface-guidelines/accessibility — Apple accessibility guidance.
