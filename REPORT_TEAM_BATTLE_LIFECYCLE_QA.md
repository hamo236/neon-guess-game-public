# تقرير مراجعة وإصلاح منطق لعب 2v2 Team Battle

## القرار التنفيذي

**الحالة: Conditional Ready.** تم اكتشاف وإصلاح خلل جوهري في مسار اللعب الحقيقي، وليس مجرد خلل واجهة: لاعبو Firebase غير المضيفين لم تكن لديهم صلاحية كتابة تأكيدات الجولة بعد بدء الغرفة، كما أن إزالة Guess Board أزالت المسار الوحيد الذي كان ينشئ `match.guesses` و`confirmationTeamId`. بعد الإصلاح أصبح زر `TEAM A/B GUESSED CORRECT` يكتب تأكيد اللاعب مباشرة في مسار آمن ومحدد، مع بقاء حل الجولة وانتقالها تحت تحكم المضيف وبالحالة authoritative من Firebase.

يبقى اختبار staging بأربعة عملاء authenticated هو البوابة الأخيرة قبل اعتماد `READY` للإنتاج؛ الاختبارات الحالية deterministic/static ومحلية، ولا تثبت وحدها سلوك أربعة أجهزة فعلية مع قواعد Firebase المنشورة.

## النظام الصحيح بعد الإصلاح

| المرحلة | السلوك authoritative |
|---|---|
| إنشاء الغرفة | المضيف ينشئ `teamRooms/{roomId}`، ويتم حفظ اللاعبين مع `joinOrder`. |
| توزيع الفرق | اللاعبان 1 و2 حسب `joinOrder` في Team A، واللاعبان 3 و4 في Team B، مع تحقق أن كل فريق يحوي لاعبين بالضبط. |
| اختيار الأهداف | لكل فريق Target واحد مشترك في الجولة. Team A يحاول تخمين Target الخاص بـ Team B، والعكس. |
| الخصوصية | الهدف الخاص لا يُحفظ في public room state. لكل لاعب private payload يحتوي هدف الفريق المنافس فقط، مع `ownedTarget` داخلي للاستخدام عند الحاجة. وتم منع تسرب الأهداف من `roundHistory` وpublic guesses. |
| التأكيد | كل لاعب يكتب تأكيده فقط في `match/confirmations/{teamId}/{uid}`. القاعدة تتحقق من هوية اللاعب، عضويته في الفريق، المباراة النشطة، رقم الجولة، و`matchId`. |
| بوابة اللاعبين | لا يتم اعتبار الفريق مؤكدًا إلا بعد تأكيد لاعبيه الاثنين في الجولة والمباراة نفسيهما. |
| حل الجولة | المضيف فقط يستدعي resolver بعد اكتمال كل فرق التأكيد المطلوبة. لا يستطيع لاعب عادي تعديل public match state. |
| النقاط | الفريق الذي خمّن Target الفريق المنافس يحصل على نقطة. إذا أكدت الفرقان نجاح التخمين في نفس الجولة، تُحفظ النتيجة ويُضاف لكل فريق نقطة. |
| كشف النتيجة | بعد اكتمال التأكيد تحفظ نتيجة الجولة وsnapshot للكشف بعد الإغلاق، ثم ينتظر الجميع انتقالًا متزامنًا. |
| الجولة التالية | `advanceTeamRound()` يزيد رقم الجولة، يغير `matchId`، يعيد الأهداف، ويمسح confirmations و`confirmationTeamIds` لمنع stale-state. بعد الجولة الثالثة ينتقل النظام إلى النتيجة النهائية. |

## المشاكل التي تم تأكيدها

| المشكلة | الدليل | درجة الخطورة | الإصلاح |
|---|---|---:|---|
| اللاعب غير المضيف لا يستطيع كتابة gameplay state بعد بدء المباراة. | قاعدة `teamRooms/$roomId/.write` كانت تسمح بالكتابة لغير المضيف فقط أثناء lobby، بينما `recordGuess()` و`confirmTeamGuess()` يستخدمان transaction على جذر الغرفة. | P0 | إضافة child write ضيق لتأكيد اللاعب فقط تحت `match/confirmations/{teamId}/{uid}`، دون فتح root writes. |
| زر التأكيد أصبح dead end بعد حذف Guess Board. | Team Battle لم يعد يستدعي `recordGuess()`، بينما `confirmTeamRound()` كان يحتاج `confirmationTeamId` ناتجًا من guesses. | P0 | `confirmTeamGuess()` أصبح يكتب التأكيد المباشر الآمن؛ لم يعد يعتمد على Guess Board أو state محلي غير authoritative. |
| المنطق كان يقفل الجولة على فريق تأكيد واحد فقط. | `confirmationTeamId` المفرد والاختبار القديم كان يرفض الفريق الآخر بعد اختيار الأول. | High | دعم `confirmationTeamIds` واستخراج فرق التأكيد من persisted confirmations، مع تغطية simultaneous confirmations وإضافة نقاط لكل فريق مؤكد عند اللزوم. |
| خطر تسريب الأهداف من تاريخ الجولات. | `finishTeamRound()` كان يضع `match.targets` داخل `roundHistory`. | P0 Privacy | `sanitizePublicState()` يمسح targets وteamTargets ويزيل target IDs من guesses ويزيل completed target من public round history، مع إبقاء revealSnapshot فقط في مرحلة النتيجة المقصودة. |
| احتمال انتقال تأكيدات قديمة إلى الجولة التالية. | reset كان يمسح confirmations لكنه لم يملك الحقل الجديد. | High | إضافة reset لـ `confirmationTeamIds` عند الإنشاء، assign، والانتقال للجولة التالية. |

## الملفات المعدلة

تم تعديل `teamBattleEngine.js`، و`CompetitiveModeContext.jsx`، و`competitiveFirebase.js`، و`database.rules.json`، وتحديث `qa-team-battle-engine.mjs` و`qa-team-battle-ui.mjs`. كما تم حفظ خطة التحقيق التفصيلية في `TEAM_BATTLE_LIFECYCLE_AUDIT.md`.

## التحقق المنفذ

| التحقق | النتيجة |
|---|---|
| Team Battle lifecycle contract | PASS، exit code 0 |
| Ordered team assignment and shared targets | PASS |
| Two-player confirmation gate | PASS |
| Simultaneous confirmation and dual scoring | PASS |
| Confirmation reset between rounds | PASS |
| Simplified UI contract | PASS، exit code 0 |
| Target/privacy sanitization contract | PASS |
| Repository smoke checks | PASS، exit code 0 |
| Production build | PASS، exit code 0 |
| Firebase four-client staging test | NOT RUN؛ يحتاج credentials وبيئة staging منشورة |

## حدود التحقق المتبقية

الاختبارات الحالية تثبت منطق المحرك، شكل payload، الحواجز الساكنة، وصلاحية build. لكنها لا تثبت وحدها أن قواعد Firebase المنشورة في مشروع staging تقبل كتابة اللاعب غير المضيف وترفض الكتابات غير القانونية في أربع جلسات حقيقية. يجب تنفيذ سيناريو واحد بأربعة متصفحات: إنشاء الغرفة، دخول ثلاثة لاعبين بالكود، تبديل الفرق قبل start، بدء المضيف، ظهور Target المنافس فقط، تأكيد اللاعب الأول، بقاء الجولة، تأكيد اللاعب الثاني، انتقال الجميع، إعادة الاتصال أثناء transition، ثم تكرار ذلك حتى الجولة الثالثة.

## الخلاصة

المشكلة لم تكن في الجولة أو الصورة فقط؛ كانت في عقد الصلاحيات بين UI وFirebase. الإصلاح الحالي يحافظ على الخصوصية، يعيد مسار التأكيد الحقيقي بعد حذف Guess Board، يمنع اللاعبين العاديين من تعديل الجذر العام، ويمنع stale confirmations من عبور الجولات. بعد نجاح اختبار staging بأربعة لاعبين وقواعد منشورة، يمكن نقل الحالة من **Conditional Ready** إلى **READY**.
