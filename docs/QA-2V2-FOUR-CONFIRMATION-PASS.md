# تقرير تنفيذ وQA — 2v2 Team Battle: Four-Confirmation Gate

## الهدف

تم تنفيذ التعديل المتفق عليه: **Team A وTeam B يلعبان في كل جولة**، وكل لاعب يرى هدف فريقه السري، بينما يرى هدف الفريق المنافس لتأكيد نجاح تخمينه. الانتقال من الجولة الحالية لا يحدث إلا بعد تأكيد اللاعبين الأربعة؛ أي تأكيدان من Team A وتأكيدان من Team B.

## القرار الهندسي

تم استخدام Firebase RTDB كطبقة authoritative من خلال `mutateCompetitiveState` الحالي، مع إضافة حالة confirmations داخل `state.match`. React يعرض الحالة فقط. كل confirmation يحمل `playerId` و`teamId` و`matchId` و`roundNumber` و`confirmedAt` حتى لا تُقبل إشارة قديمة من جولة سابقة أو match مختلف.

## الملفات التي تغيرت

| الملف | التغيير |
| --- | --- |
| `src/modes/teamBattleEngine.js` | إضافة `createTeamConfirmations` و`confirmTeamRound` و`getTeamConfirmationStatus` و`areAllTeamConfirmationsComplete`، وإعادة ضبط confirmations عند كل round، ومنع `finishTeamRound` قبل اكتمال confirmations الأربعة. |
| `src/context/CompetitiveModeContext.jsx` | إضافة `confirmTeamGuess` الذي يكتب من خلال transaction الحالية، وإضافة guard داخل `resolveTeamRound` يمنع host من إنهاء الجولة قبل اكتمال تأكيدات الفريقين. |
| `src/pages/CompetitiveModePage.jsx` | إزالة شبكة بطاقات التخمين من 2v2 فقط، واستبدالها ببطاقة هدف الفريق المنافس وزر `TEAM A/B GUESSED CORRECT`، مع عرض حالة كل عضو `1/2` أو `2/2`. Tournament لم يتغير في هذه الدفعة. |
| `scripts/qa-team-battle-engine.mjs` | إضافة اختبار four-confirmation، واختبار منع الانتقال بعد confirmation واحد من كل فريق، واختبار reset في الجولة التالية. |

## السلوك المتوقع

إذا ضغط لاعب من Team A على `TEAM B GUESSED CORRECT`، تُحفظ موافقته ويظهر له أن تأكيده محفوظ مع انتظار زميله. ضغط اللاعب الثاني من Team A يحول حالة Team A إلى `2/2`، لكن الجولة لا تنتقل بعد. في الوقت نفسه يحتاج Team B إلى ضغط لاعبيه الاثنين على `TEAM A GUESSED CORRECT`. بعد تسجيل confirmations الأربعة، يستطيع الـhost تنفيذ resolve authoritative، وتنتقل الغرفة إلى round result ثم الجولة التالية.

## نتائج التحقق

| مستوى الدليل | النتيجة | التفاصيل |
| --- | --- | --- |
| `ENGINE TEST VERIFIED` | YES | الاختبار مر بنجاح: توزيع الفرق، shared targets، منع finish قبل الأربع confirmations، إتمام الجولة بعد الأربع، وإعادة ضبط confirmations. |
| `SOURCE VERIFIED` | YES | `2V2_ROOM_SOURCE_CONTRACT_PASS` مر بنجاح. |
| `SYNTAX VERIFIED` | PARTIAL | فحص source contract نجح، لكن JSX runtime compilation الكامل لم يكتمل. |
| `BUILD VERIFIED` | NO | `npm run build` توقف برسالة `vite: Permission denied` من mounted workspace، ومحاولة Node المباشرة ظلت عالقة وتم إيقافها. |
| `LIVE FIREBASE VERIFIED` | NOT VERIFIED | لم يتم تشغيل أربعة عملاء حقيقيين في هذه الدفعة. |
| `FOUR-CLIENT VERIFIED` | NOT VERIFIED | يحتاج اختبارًا فعليًا من أربعة browsers/devices. |
| `1v1 / Tournament regression` | SOURCE-SCOPED | التعديل محصور في Team Battle engine/context projection، لكن regression runtime الكامل غير متاح بسبب build limitation. |

## حدود ومخاطر متبقية

الاختبار الحتمي يثبت منطق domain state، لكنه لا يثبت وحده أن أربعة متصفحات حقيقية ستصل إلى Firebase في نفس الوقت. كما أن build الكامل blocked بسبب mounted workspace وليس بسبب compiler error مثبت. لذلك حالة الإصدار هي **CONDITIONAL / NEEDS FOUR-CLIENT TEST**.

## اختبار القبول المطلوب على deployment

ينشئ الـHost غرفة 2v2، وينضم ثلاثة لاعبين، ثم يبدأ الجولة. في كل جولة يجب أن يرى اللاعب target فريقه، وبطاقة target الفريق المنافس، وزر confirmation واحد فقط، وليس شبكة الـ15 بطاقة. يضغط اللاعبان في Team A الزر فيظهر `2/2` لفريق A، لكن لا تنتقل الجولة حتى يضغط اللاعبان في Team B. بعد الضغط الرابع يجب أن يظهر round result لجميع العملاء، ثم ينتقلون معًا إلى الجولة التالية. يجب إعادة الاختبار في الجولات الثلاث، مع refresh لاعب واحد، ضغط الزر مرتين، وتأخير أحد العملاء.

## قرار الإصدار

**CONDITIONAL — الكود والمنطق تم تنفيذهما، والاختبار الحتمي نجح، لكن الاعتماد النهائي يحتاج LIVE FIREBASE وFOUR-CLIENT verification على deployment الحقيقي.**

## الدرس المسجل

القاعدة الجديدة: في Team Battle، confirmation ليست UI flag ولا event محليًا. هي action مرتبطة بـ authenticated player identity، team، match، وround، ولا يجوز للـhost أو timer إنهاء الجولة قبل اكتمال جميع confirmations المطلوبة من الفريقين.
