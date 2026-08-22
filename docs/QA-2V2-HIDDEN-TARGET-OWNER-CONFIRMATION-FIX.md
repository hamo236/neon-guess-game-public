# تقرير إصلاح قاعدة 2v2: الهدف المخفي وتأكيد مالك الهدف

## الملخص التنفيذي

تم تصحيح قاعدة Team Battle بناءً على التوضيح الأخير. كل فريق يملك هدفًا مشتركًا لا يظهر في الحالة العامة للغرفة. الفريق المقابل هو الذي يحاول تخمين هذا الهدف. عندما ينجح التخمين، يقوم لاعبا الفريق الذي يملك الهدف بالضغط على تأكيد النجاح. الضغط الأول يثبت `confirmationTeamId`، والضغط الثاني من زميل الفريق نفسه يكمل البوابة. لا تنتقل الجولة قبل التأكيدين، ولا يستطيع الفريق الآخر الاستيلاء على بوابة التأكيد بعد تثبيتها.

حالة الإصدار: **CONDITIONAL**. فحوص المصدر والمحرك وJSX نجحت، لكن اختبار Firebase الحي بأربعة عملاء وBuild كامل على workspace المرفق ما زالا غير متاحين بسبب قيود البيئة السابقة.

## المشكلة المؤكدة

| المعرّف | العرض | السبب | الإصلاح | الدليل | الحالة |
| --- | --- | --- | --- | --- | --- |
| ENG-2V2-PRIVACY | كان يمكن لواجهة 2v2 عرض بطاقة هدف الفريق المقابل، كما كانت شاشة النتيجة تحتوي على Target Reveal | إسقاط UI كان يقرأ target من public match state، و`writeCompetitiveState` كان يكتب `match.targets` و`teamTargets` إلى المسار العام | حذف عرض الهدف المقابل، وإزالة reveal من نتيجة الجولة، وتنقية الحالة العامة قبل `set` وداخل transaction، مع الإبقاء على private per-player target paths | JSX_PARSE_PASS، ومراجعة adapter | SOURCE VERIFIED |
| ENG-2V2-CONFIRM | كان الانتقال يتطلب تأكيدات الأربعة أو كان يسمح بمنطق غير مطابق لقاعدة اللعب | المحرك كان يستخدم `areAllTeamConfirmationsComplete` لكل الفريقين بلا ربط بمالك الهدف الذي تم تخمينه | إضافة `confirmationTeamId` لكل جولة. أول لاعب من الفريق المالك يثبت الفريق، واللاعب الثاني من الفريق نفسه يكمل التأكيد. الفريق الآخر يُرفض بعد تثبيت البوابة | deterministic Team Battle QA | TEST VERIFIED |
| ENG-2V2-ROUND-RESET | احتمال انتقال confirmation قديم إلى الجولة الجديدة | reset كان لا يثبت دائمًا هوية فريق التأكيد الواحد | تصفير `confirmationTeamId` و`confirmations` عند `assignTeamTargets` لكل round جديد | test coverage | TEST VERIFIED |

## السلوك الصحيح بعد الإصلاح

الفريق A يرى هدفه الخاص فقط من خلال مسار private، ولا يرى هدف Team B. Team B يرى هدفه الخاص فقط، ولا يرى هدف Team A. الشاشة العامة تعرض حالة الجولة، الفريقين، المؤقت، وحالة التحقق، لكنها لا تعرض target الخاص بالفريق المقابل.

عندما يضغط لاعب من الفريق الذي يملك الهدف على `CONFIRMS OPPONENT GUESSED CORRECT`، تُكتب العملية عبر Firebase transaction. يصبح `confirmationTeamId` هو فريقه. يظهر له ولزميله `1/2`، ويُرفض زر الفريق الآخر أو يصبح في حالة انتظار. بعد ضغط اللاعب الثاني من الفريق نفسه تصبح الحالة `2/2`، ويقوم الـhost فقط بتشغيل `resolveTeamRound` authoritative. الفائز بالجولة هو الفريق المقابل الذي نجح في تخمين الهدف، وليس الفريق الذي ضغط التأكيد.

## الملفات المعدلة

تم تعديل الملفات التالية فقط ضمن نطاق 2v2 والاختبار:

- `src/modes/teamBattleEngine.js`
- `src/context/CompetitiveModeContext.jsx`
- `src/firebase/competitiveFirebase.js`
- `src/pages/CompetitiveModePage.jsx`
- `scripts/qa-team-battle-engine.mjs`

لم يتم تعديل مسارات 1v1 أو Tournament.

## مصفوفة التحقق

| البوابة | الأمر أو السيناريو | النتيجة | القيد |
| --- | --- | --- | --- |
| Engine contract | `node scripts/qa-team-battle-engine.mjs` | PASS: shared targets، owner-only confirmations، two-player gate، single owner، reset | لا يوجد |
| Existing source contract | `node /home/ubuntu/verify-2v2-room.mjs` | `2V2_ROOM_SOURCE_CONTRACT_PASS` | لا يوجد |
| JSX syntax | `node /home/ubuntu/check-jsx.mjs` | `JSX_PARSE_PASS` | لا يثبت runtime |
| Public target privacy | مراجعة `sanitizePublicState` وإزالة opponent target/reveal من page | SOURCE VERIFIED | يحتاج Firebase حي للتحقق من قواعد القراءة |
| Vite production build | build من mounted workspace | NOT VERIFIED | Vite واجه قيد executable/permission وعلقت المحاولة المباشرة |
| Firebase أربعة عملاء | Host + 3 players، ثلاث جولات | NOT VERIFIED | يحتاج deployment أو runtime Firebase حي |
| 1v1/Tournament runtime | تشغيل regression كامل | NOT VERIFIED | التعديل محصور بالمصادر، لكن runtime الكامل لم يُشغّل |

## الأنظمة المحمية

لم يتم تغيير توزيع Team A وTeam B، ولا shared target assignment، ولا room namespace، ولا room-code join contract، ولا 1v1، ولا Tournament. التعديل يخص public state serialization، Team Battle confirmation state، وواجهة Team Battle فقط.

## المخاطر المتبقية

التحقق الحي يجب أن يؤكد أن Firebase Rules تمنع قراءة `private/{playerId}` للاعب آخر، لأن تنقية public state تمنع التسريب من مسار الحالة لكن قواعد Firebase هي طبقة الحماية النهائية. كما يجب اختبار أن أول confirmation من Team A يمنع Team B من الكتابة، وأن refresh لا يفقد `confirmationTeamId` أو confirmation الأول، وأن الجولة الثالثة تنتهي دون كشف الأهداف.

## قرار الإصدار

**CONDITIONAL — NEEDS FOUR-CLIENT FIREBASE VERIFICATION.** الإصلاح يطابق قاعدة اللعب المصححة، وفحص المحرك، وفحص مصدر الغرفة، وفحص JSX نجحت. لا يمكن إعلان READY قبل تجربة Host وأربعة عملاء فعليين على نفس deployment مع هدف مخفي، confirmation أول وثانٍ من الفريق المالك، محاولة تأكيد من الفريق الآخر، refresh، reconnect، والجولات الثلاث.
