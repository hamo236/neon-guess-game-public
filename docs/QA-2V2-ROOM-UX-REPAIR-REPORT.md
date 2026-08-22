# تقرير إصلاح وتجربة 2v2 Team Battle

## النطاق

تم إصلاح تجربة غرفة **2v2 Team Battle** في `CompetitiveModePage.jsx` مع الحفاظ على منطق Firebase والـ authoritative state الموجودين في `CompetitiveModeContext.jsx` و`competitiveFirebase.js` و`teamBattleEngine.js`.

## القرار

**CONDITIONAL — صالح للاختبار الداخلي، وليس اعتماد إصدار نهائي بعد.**

السبب هو أن فحوص المنطق وParsing للـ JSX نجحت، لكن تشغيل Vite build الكامل وFour-client live Firebase verification لم يكتمل بسبب قيود workspace المرفق وتنفيذ binaries من mounted filesystem.

## ما تم تنفيذه

أصبحت غرفة الانتظار تعرض بطاقة واضحة بعنوان **ROOM CODE**، مع الكود بشكل كبير وقابل للقراءة، وزري **COPY** و**SHARE**. النسخ يستخدم Clipboard API مع fallback آمن، والمشاركة تستخدم Web Share API عند توفرها ثم تعود للنسخ عند عدم توفرها.

أصبح للمستخدمين توجيه مباشر: أرسل الكود إلى بقية الفريق، ثم يختار اللاعب الآخر **Join Room** ويلصق الكود. خانة الانضمام ظاهرة في شاشة الدخول كما كانت، مع تحويل الكود إلى uppercase وتعطيل زر الانضمام عندما تكون الخانة فارغة.

أضيفت شاشة **TARGET REVEAL** بعد كل جولة، وتعرض الهدف authoritative الخاص بكل فريق، مع أسماء الزميلين اللذين يشتركان فيه. تعتمد الشاشة على `match.result.targets` الذي ينتجه محرك Team Battle، ولا تنشئ مصدر حقيقة جديدًا في الواجهة. أضيف العرض أيضًا إلى النتيجة النهائية.

## Verification Matrix

| Gate | Status | Evidence |
| --- | --- | --- |
| 2v2 team split and shared targets | PASS | `node scripts/qa-team-battle-engine.mjs` returned: `Team Battle engine QA passed: 4-player split and shared team targets are authoritative.` |
| JSX syntax | PASS | Babel parser check returned `JSX_PARSE_PASS`. |
| Room code persistence contract | SOURCE VERIFIED | Existing room lifecycle and Firebase adapter were reviewed before UI edits. |
| Round result target source | SOURCE VERIFIED | Reveal uses `state.match.result.targets`, produced by `finishTeamRound`. |
| Build | NOT VERIFIED | `vite` execution was blocked by `Permission denied` on the mounted workspace; direct Vite execution then exceeded the environment timeout. |
| Four-client Firebase flow | NOT VERIFIED | No four independent authenticated browser clients were available in this pass. |
| 1v1 and Tournament regression | NOT VERIFIED | Protected modes were not live-exercised in this environment; edits were scoped to the shared competitive page and existing 2v2 projection. |

## Protected invariants reviewed

The implementation does not change team assignment, target assignment, score writes, round IDs, Firebase listeners, or host authority. Team A and Team B remain based on join order, and the reveal is a projection of the already authoritative round result. The existing three-round transition and host-controlled advancement remain in the context and engine.

## Remaining risks and required user test

قبل اعتماد الإصدار، يجب تشغيل build من داخل بيئة المشروع الأصلية ثم تجربة أربعة عملاء مستقلين: Host creates room, Players 2–4 join using the visible code, Host starts only at 4/4, teammates see the same private target, opposing teams see different targets, each round ends with the revealed Team A/Team B targets, and round 3 ends in final results without duplicate scoring.

يجب أيضًا تجربة copy وshare على الهاتف، وإعادة تحميل عميل داخل غرفة lobby، ومحاولة إدخال code خاطئ، ثم إجراء smoke test سريع لـ 1v1 وTournament للتأكد من عدم وجود regression.

## Rollback / containment

إذا ظهر خلل في الواجهة، يمكن التراجع عن تغييرات `RoomCodeCard` و`TeamRevealTargets` في `src/pages/CompetitiveModePage.jsx` فقط. لم تُجرَ تغييرات إضافية على schema أو Firebase rules في هذه الدفعة.
