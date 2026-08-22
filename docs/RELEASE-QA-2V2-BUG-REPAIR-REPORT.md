# Release / QA Guard Report — 2v2 Bug Repair

## Scope

تمت مراجعة وإصلاح مسار 2v2 Team Battle بعد طلب تشغيل release-QA على المشاكل المتبقية في target privacy، guess correctness، confirmation ownership، round snapshot، وFirebase state.

## Decision

**CONDITIONAL — NOT READY FOR PRODUCTION RELEASE**.

السبب ليس فشل الاختبارات المركزة؛ السبب أن build الإنتاج الكامل واختبار Firebase الحي بأربعة عملاء لم يتمكنا من التحقق داخل بيئة workspace الحالية. يسمح القرار باختبار داخلي محدود بعد نشر rules والكود، لكنه لا يساوي اعتماد الإصدار.

## Executive Summary

تم اكتشاف bug مهم في مسار التخمين: بعد إزالة targets من public room state، ظل `recordGuess` يبحث عن الهدف في `current.match.targets`. هذا يجعل التخمين الصحيح يُحسب خطأ أو لا يُحسب، لأن public state لم يعد يحتوي target الخاص. تم إصلاحه ليقارن `targetId` مع `privateTarget.targetId` الذي يصل إلى اللاعب من المسار الخاص الخاص بالـ2v2، ثم يثبت `confirmationTeamId` للفريق صاحب الهدف الذي تم تخمينه.

هذا الإصلاح يحافظ على الخصوصية: اللاعب لا يحتاج أن يحصل على target الفريق الذي يحاول تخمينه من public Firebase state، والـconfirmation لا ينتقل للفريق الخطأ.

كما تم التأكد من أن round snapshot لا يتكون بعد confirmation الأول؛ لا يُجمّد إلا بعد تأكيد اللاعب الثاني من نفس الفريق. هذا يمنع كشف الهدف أو بدء النتيجة مبكرًا.

## Root Cause and Fix

| البوابة | قبل الإصلاح | الإصلاح |
| --- | --- | --- |
| Correct guess source | قراءة `current.match.targets` العام | مقارنة مع `privateTarget.targetId` |
| Confirmation owner | قد لا يُثبت من guess الحقيقي | تثبيت `confirmationTeamId` على team صاحب target المنافس |
| Target privacy | public targets تم تنظيفها بالفعل | تم الحفاظ على private target projection |
| First confirmation | كان يجب ألا يكشف snapshot | snapshot يبقى `null` بعد أول لاعب |
| Second confirmation | يجب أن يفتح resolve فقط | snapshot يُنشأ بعد اكتمال لاعبي الفريق |

## Verification Matrix

| Gate | Result | Evidence |
| --- | --- | --- |
| Intent | PASS | المسار الآن يطابق قاعدة: فريق يخمن target الفريق الآخر، ومالكو الهدف يؤكدون من خلال لاعبيهم الاثنين |
| Source contract | PASS | `2V2_ROOM_SOURCE_CONTRACT_PASS` |
| Deterministic engine | PASS | `Team Battle privacy QA passed: shared hidden targets, owner-only confirmations, two-player gate, single confirmation owner, and reset.` |
| First-confirmation privacy | PASS | الاختبار يرفض إنشاء snapshot بعد لاعب واحد |
| Second-confirmation snapshot | PASS | الاختبار يثبت snapshot بعد تأكيد لاعبي الفريق الاثنين |
| RTDB rules JSON | PASS | `RTDB_RULES_JSON_PASS` |
| JSX syntax | PASS | `JSX_PARSE_PASS` |
| Public target privacy | SOURCE VERIFIED | public sanitizer وprivate namespace موجودان في المسار المعدل |
| Firebase live | NOT VERIFIED | لا يوجد اختبار حي بأربعة clients داخل هذه الدورة |
| Full production build | NOT VERIFIED | mounted workspace منع تشغيل Vite reliably بسبب permission/latency limitation |
| 1v1/Tournament runtime | NOT VERIFIED | التغيير scoped لمسار Team Battle، لكن runtime regression لم يُشغّل |

## Protected Systems

لم يتم تغيير قواعد 1v1 أو Tournament عمدًا. تم الحفاظ على private target path الخاص بالـTournament مع فصل `teamBattlePrivateTargets`. وتمت مراجعة أن Team Battle فقط يستخدم `confirmationTeamId` وprivate opponent payload الجديد.

## Remaining Risks

الخطر release-critical المتبقي هو عدم تنفيذ deployment verification. يجب نشر `database.rules.json` الفعلي، ثم تشغيل Host وPlayers 2–4 من أربعة browsers مستقلة. يجب إثبات أن اللاعب الذي يخمن لا يرى target المنافس، وأن مالكي target يستطيعون التأكيد بترتيب مختلف، وأن confirmation المكرر لا يضيف نقطة ثانية، وأن refresh/reconnect لا يخلط match أو round.

كما يجب التحقق من أن بطاقة `OPPONENT TARGET` مطابقة للتجربة المرغوبة في deployment الفعلي، لأن source verification لا يساوي اختبار UX حي.

## Required Next Gate

قبل إعلان READY، نفّذ الاختبارات التالية على نفس deployment:

| Test | Expected |
| --- | --- |
| Host creates room | Room code persists and shows 1/4 |
| Players 2–4 join by code | Seats become 4/4 and teams remain 2v2 |
| Host starts with 3 players | Start is rejected |
| Player guesses using private opponent target | Correctness resolves from private target path |
| Owner teammate 1 confirms | State remains playing; no snapshot |
| Owner teammate 2 confirms | One snapshot, one resolution, one point |
| Opposite team confirms | Rejected after owner is locked |
| Refresh/reconnect | Same player identity and round context are restored |
| Rounds 2 and 3 | Targets and confirmations are isolated per round |
| 1v1 and Tournament smoke | Existing flows remain usable |

## Rollback / Containment

إذا فشل اختبار deployment، لا تعتمد الإصدار. أوقف Start للـ2v2 أو ارجع ملفات `CompetitiveModeContext.jsx` و`teamBattleEngine.js` و`competitiveFirebase.js` و`CompetitiveModePage.jsx` و`database.rules.json` إلى النسخة السابقة، مع عدم تعديل 1v1 أو Tournament أثناء rollback.

## Final Status Language

**الكود اتعدل:** نعم.

**الاختبارات المركزة نجحت:** نعم، بالأسماء والنتائج الواردة أعلاه.

**السلوك اتأكد حيًا:** لا، ليس بأربعة عملاء على Firebase deployment.

**جاهز للإصدار:** لا. القرار الصحيح حاليًا هو **CONDITIONAL** إلى أن ينجح اختبار live four-client Firebase.
