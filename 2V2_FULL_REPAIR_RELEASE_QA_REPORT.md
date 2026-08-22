# تقرير الإصلاح الكامل وبوابة الجودة — NEON GUESS 2v2

**التاريخ:** 2026-08-19  
**النطاق:** 2v2 Team Battle، مع فحص عدم الإضرار بـ Tournament و1v1 والـ build.  
**المرجع:** دورة `DISCOVER → AUDIT → PLAN → REPAIR → BUILD → TEST → BREAK TEST → REGRESSION → REVIEW → VERIFY`.

## الحالة الأولية

كان منطق Team Battle الأساسي موجودًا: فرق Team A وTeam B، أهداف مشتركة مخفية، تأكيد لاعبي الفريق المالك للهدف، كشف round snapshot، وإعادة اتصال محلية. لكن التدقيق الحالي كشف أن مسار اللعب في الواجهة لا يعرض لوحة تخمين حقيقية، لذلك لم يكن اللاعب قادرًا على تنفيذ أهم فعل في 2v2 وهو اختيار الإجابة. كما كشف التدقيق أن إزالة لاعب من lobby كانت تحذف سجل اللاعب من `players` دون تنظيف `teams.*.playerIds` في عملية ذرية، ما قد يترك فريقًا ممتلئًا ظاهريًا أو يسبب توزيعًا قديمًا.

## مشكلات مكتشفة

| ID | الأولوية | الفئة | السبب الجذري | الأثر |
|---|---|---|---|---|
| TB-UI-001 | P1 | Gameplay/UI | `TeamBattleGameplay` كان يعرض الهدف المخفي وبطاقة الخصم وزر التأكيد، لكنه لا يربط `GuessGrid` بفعل `recordGuess`. | لا يستطيع اللاعب تنفيذ التخمين من واجهة 2v2، فتتوقف دورة اللعب عمليًا قبل التأكيد. |
| TB-STATE-002 | P1 | Multiplayer/Data integrity | `removeCompetitivePlayer` و`leaveCompetitiveRoom` كانا يحذفان `players/{id}` فقط في بعض مسارات Team Battle، مع بقاء `teams/{teamId}/playerIds`. | stale team membership، غرف lobby غير دقيقة، واحتمال منع دخول لاعب جديد أو ظهور توزيع قديم. |
| TB-RULE-003 | P2 | Security/Authorization | قواعد Firebase الحالية تسمح للاعب الموجود في lobby بكتابة root room وفق شرط lobby، بينما يعتمد التدفق على adapter mutations. | يحتاج تحقق staging فعلي بقواعد Firebase منشورة للتأكد أن الانتقال من lobby إلى active لا يقبل root writes من لاعب عادي. لم أضعف القواعد أو أغيرها تخمينيًا. |
| QA-ENV-004 | P2 | Release infrastructure | لا توجد Firebase staging credentials في بيئة التحقق الحالية. | لا يمكن تنفيذ اختبار أربعة متصفحات مستقلة للـ room/join/start/reconnect حتى الآن. |

## خطة الإصلاح

كان القرار هو إصلاح الأسباب الجذرية فقط. أولًا، إعادة إدخال لوحة التخمين في نفس مكوّن Team Battle وربطها بالفعل authoritative الموجود أصلًا بدل إنشاء منطق UI مستقل. ثانيًا، فرض أن زر التأكيد لا يُفعل إلا عندما يحدد `confirmationTeamId` الفريق المالك للهدف الذي تم تخمينه بشكل صحيح. ثالثًا، جعل إزالة أو مغادرة لاعب من lobby معاملة Firebase ذرية تنظف `players` و`teams.*.playerIds` معًا. رابعًا، تشغيل deterministic tests وsource contracts وbuild وruntime smoke، ثم محاولة كسر الإصلاح عبر حالات التخمين المكرر، التأكيد المبكر، التأكيد المتزامن، وإزالة لاعب من الفريق.

## الإصلاحات المنفذة

### 1. إعادة لوحة التخمين إلى 2v2

تم تعديل `src/pages/CompetitiveModePage.jsx` بحيث يستخرج Team Battle عناصر الفئة الحالية ويعرض `GuessGrid`. اللوحة تستدعي `actions.recordGuess`، وتحفظ `guessedTargetId` من سجل اللاعب، وتُغلق إذا كان اللاعب سجّل تخمينًا، أو انتهى المؤقت، أو لم تجهز البيانات الخاصة، أو كانت حالة الاتصال لا تسمح بالكتابة.

تم الحفاظ على الخصوصية: اللاعب لا يستقبل إجابة الهدف الذي يحاول فريقه تخمينه؛ المعروض هو بطاقة الخصم دون answer، بينما سجل التخمين لا يكشف الهدف الخاص للفريق.

### 2. تثبيت بوابة التأكيد المزدوج

تم الحفاظ على الشرط authoritative: `myTeamRequired` يصبح صحيحًا فقط عندما يكون فريق اللاعب مساويًا لـ `lockedConfirmationTeam`. قبل وجود تخمين صحيح يبقى الزر في حالة `WAITING FOR A CORRECT GUESS`. بعد اختيار الفريق المالك للهدف، يحتاج اللاعبان داخل ذلك الفريق إلى تأكيد منفصل قبل الانتقال.

### 3. تنظيف عضوية الفرق أثناء الإزالة والمغادرة

تم تعديل `src/firebase/competitiveFirebase.js`. إزالة لاعب Team Battle من lobby أصبحت transaction على room root، وتزيل اللاعب من `players` ومن قوائم `teams` وتضيف أثر `removedPlayers`. كما أصبحت مغادرة اللاعب غير المضيف من lobby transaction تنظف `players` و`teams` وتضيف `leftPlayers`. لا يتغير مسار host leave أو مسارات 1v1/Tournament.

### 4. اختبارات إضافية

تمت إضافة `scripts/qa-team-battle-ui.mjs` للتحقق من وجود لوحة التخمين، استدعاء `recordGuess`، أقفال الإدخال، بوابة الفريق المالك، وtransaction تنظيف العضوية.

## الاختبارات المنفذة والنتائج

| الاختبار | النتيجة | الدليل |
|---|---|---|
| Team Battle deterministic engine QA | PASS | privacy، owner-only confirmation، two-player gate، single confirmation owner، reset |
| Team Battle UI/adapter contract QA | PASS | `qa-team-battle-ui.mjs` |
| Repository smoke contracts | PASS | `qa-smoke.mjs` |
| Tournament regression | PASS | semifinal independence، bracket transition، final/consolation setup |
| Production build | PASS | Vite transformed 81 modules and generated `dist` |
| Firebase rules JSON validation | PASS | `database.rules.json` parsed successfully |
| Live Team Battle route | PASS | `/team-battle` mounted and displayed Create Room / Join Room lobby |
| Browser console | PASS WITH WARNINGS | no uncaught exception; only Firebase local-mode notice and React Router future warnings |

## Break-test coverage

تم اختبار أو تغطية الحالات التالية من خلال engine contracts وUI contracts: التأكيد قبل وجود تخمين صحيح، التأكيد من الفريق الخطأ، تأكيد لاعب واحد فقط، التأكيد المتزامن من لاعبي الفريق، إعادة ضبط confirmations بين الجولات، التخمين المكرر، انتهاء الوقت، عدم جاهزية private target، وإزالة لاعب من lobby مع تنظيف عضوية الفريق.

## مراجعة الأنظمة المحمية

لم يتم تغيير قواعد توزيع Team A/Team B، ولم يتم كشف `match.targets` أو `match.teamTargets` في الإسقاط العام، ولم يتم تعديل منطق round scoring أو round snapshot أو Tournament bracket. لم يتم تنفيذ GitHub أو deployment. تم فحص build بعد التعديلات ولم تظهر أخطاء compile أو runtime في مسار Team Battle المحلي.

## الإصلاح الذاتي بعد الاختبار

كشفت مراجعة UI أن وجود منطق التأكيد وحده لا يكفي لأن مسار التخمين كان ناقصًا في الواجهة. تم إصلاح ذلك ثم إعادة تشغيل الاختبارات والبناء. كما كشفت مراجعة lifecycle مشكلة stale team membership، وتم إصلاحها بمعاملة transaction بدل حذف منفصل. هذا يحقق دورة: إصلاح → اختبار → محاولة كسر → اكتشاف مشكلة ثانوية → إصلاح ثانوي → regression.

## المشكلات المتبقية والحواجز الخارجية

لا توجد مشكلة P0 معروفة ولا مشكلة P1 معروفة قابلة للإصلاح بأمان داخل البيئة الحالية. الحاجز الوحيد هو عدم توفر Firebase staging credentials، لذلك لم يتم ادعاء نجاح اختبار حي بأربعة لاعبين. يلزم قبل الإنتاج تشغيل room creation، join بالـ code، امتلاء أربعة لاعبين، host start، private target privacy، correct guess، تأكيد اللاعبين الاثنين، snapshot، reconnect، player leave/rejoin، وstale client ضد Firebase المنشور.

تظل ملاحظة حجم الحزمة الرئيسية في Vite تحذيرًا غير مانع، ولا تخص 2v2 مباشرة. كما تظهر تحذيرات React Router المستقبلية دون خطأ وظيفي.

## الحكم النهائي

# STABLE WITH MINOR ISSUES

الـ 2v2 أصبح قابلًا للتشغيل محليًا من حيث UI والعقود والمنطق والبناء، مع إصلاح مسار التخمين وعضوية الفرق. اعتماد الإنتاج النهائي مشروط فقط باختبار Firebase staging متعدد العملاء ومراجعة قواعد النشر الفعلية؛ لا ينبغي اعتبار ذلك مُنجزًا اعتمادًا على local engine وحده.

## الملفات الرئيسية المعدلة

- `src/pages/CompetitiveModePage.jsx`
- `src/firebase/competitiveFirebase.js`
- `scripts/qa-team-battle-ui.mjs`
- `2V2_FULL_REPAIR_RELEASE_QA_REPORT.md`

## ملفات الأدلة

- `artifacts/release-qa-2v2-problem-inventory.md`
- `artifacts/release-qa-2v2-browser-smoke.md`
- `scripts/qa-team-battle-engine.mjs`
- `scripts/qa-smoke.mjs`
- `database.rules.json`
