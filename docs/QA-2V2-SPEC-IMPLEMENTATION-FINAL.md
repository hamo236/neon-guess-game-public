# تقرير تنفيذ ومراجعة 2v2 Team Battle

## القرار

الحالة الحالية: **CONDITIONAL — NEEDS LIVE FOUR-CLIENT FIREBASE VERIFICATION**.

تم تنفيذ القواعد الأساسية المطلوبة في المحرك، provider، Firebase adapter، الواجهة، وقواعد RTDB داخل المستودع. نجحت الاختبارات الحتمية وفحوص source contract، لكن لا يمكن إعلان READY نهائيًا قبل تشغيل deployment فعلي بأربعة عملاء واختبار Firebase Rules والـreconnect والـrounds الثلاثة.

## القاعدة التي تم تثبيتها

الغرفة تحتوي أربعة لاعبين فقط، مع Team A وTeam B، ولكل فريق لاعبان. توزيع الدخول الافتراضي هو اللاعبان الأول والثاني في Team A، واللاعبان الثالث والرابع في Team B. التوزيع محفوظ داخل Firebase، وتغيير الفريق قبل بدء المباراة يتم عبر transaction ويمنع امتلاء الفريق أو وجود اللاعب في فريقين.

لا يستطيع الـHost بدء المباراة إلا إذا كان عدد اللاعبين أربعة، وعدد لاعبي كل فريق اثنين. اللاعب العادي لا يستطيع تشغيل Start Game. حالة الفريق والغرفة authoritative في Firebase وليست ترتيبًا محليًا في React.

## target privacy

لكل فريق target واحد مشترك، لكن اللاعب لا يرى target فريقه؛ هذا هو الهدف الذي يحاول الفريق المنافس تخمينه. كل لاعب في 2v2 يحصل عبر المسار الخاص به على target الفريق المنافس فقط، مع `ownedTarget` داخلي غير معروض للواجهة ويُستخدم فقط لبناء snapshot التحقق عند التأكيد.

تم حذف `match.targets` و`match.teamTargets` من public room state قبل الحفظ داخل Firebase. وتم نقل private targets الخاصة بـ2v2 إلى:

```text
teamBattlePrivateTargets/{roomId}/{playerId}/{matchId}/target
```

أما بيانات البطولة فبقيت في مسارها الخاص ولم تُخلط مع 2v2.

كما أضيفت قواعد RTDB للمسارين `teamRooms` و`teamBattlePrivateTargets`. قراءة target الخاص مقصورة على UID صاحب target، والكتابة مقصورة على اللاعب أو الـHost مع validation للـplayerId والـmatchId والـtargetId والـownedTarget.

## Guess Correct

زر `Guess Correct` ليس مجرد زر واجهة. عند الضغط الأول يتم تثبيت `confirmationTeamId` في Firebase، وهو الفريق الذي يملك target الذي يقول إنه تم تخمينه. يستطيع اللاعب الآخر من نفس الفريق فقط إضافة التأكيد الثاني. الضغط المتكرر idempotent، وتأكيد الفريق الآخر بعد تثبيت البوابة مرفوض.

لا يتم إنشاء target snapshot بعد التأكيد الأول. لا يتم إنشاءه إلا عندما يصبح لاعبا الفريق نفسه مؤكدين في الجولة الحالية. لذلك لا تظهر نتيجة أو target محمي أثناء اللعب قبل اكتمال التأكيدين.

## round flow وsnapshot

بعد التأكيد الثاني، يستطيع الـHost فقط تنفيذ resolve. الـengine يتحقق من اكتمال لاعبي الفريق المطلوبين، يحفظ النتيجة authoritative، يحسب النقاط مرة واحدة، ثم ينقل الحالة إلى `round_result`.

الـsnapshot المجمد يحتوي على `gameInstanceId` و`matchId` و`roundId` و`roundNumber` و`targetOwnerTeamId` وtarget الجولة المنتهية و`completedAt`. يتم عرضه في شاشة النتيجة فقط، ويبدأ countdown مدته خمس ثوانٍ قبل الجولة التالية. الجولة التالية تنشئ matchId وtargets جديدة ولا تعتمد على target الجولة السابقة.

## UI

تم الحفاظ على واجهة اللعب البسيطة: scoreboard للفريقين، بطاقة `OPPONENT TARGET` بدون كشف target الفريق الحالي، زر تأكيد واضح، وحالة teammate مثل `1/2 confirmed` و`waiting for teammate`. شاشة الـLobby تعرض Team A وTeam B والمقاعد الفارغة، Room Code، Copy/Share، وحالة المقاعد. لم يتم تطبيق شبكة الـ15 صورة داخل Team Battle gameplay.

## اختبارات ناجحة

| الاختبار | النتيجة |
| --- | --- |
| `node /home/ubuntu/verify-2v2-room.mjs` | PASS — `2V2_ROOM_SOURCE_CONTRACT_PASS` |
| `node scripts/qa-team-battle-engine.mjs` | PASS — shared hidden targets, owner-only confirmations, two-player gate, single owner, reset |
| Snapshot privacy after first confirmation | PASS — no snapshot after first teammate |
| Snapshot creation after second confirmation | PASS |
| Round reset | PASS |
| RTDB rules JSON parsing | PASS — `RTDB_RULES_JSON_PASS` |
| Full Vite production build | NOT VERIFIED — mounted workspace execution/permission limitation |
| Live Firebase four-client run | NOT VERIFIED — requires deployment and four authenticated browser sessions |

## المخاطر المتبقية قبل الإنتاج

أهم خطوة متبقية هي نشر `database.rules.json` إلى Firebase Rules الفعلية، ثم تشغيل Host وPlayers 2–4 من أربعة browsers أو أجهزة. يجب اختبار إنشاء الغرفة، join بالكود، تغيير الفريق، منع 3v1، Start disabled عند النقص، target privacy، تأكيد لاعب واحد، تأكيد اللاعب الثاني، countdown خمس ثوانٍ، الجولة الثانية والثالثة، refresh، reconnect، والضغط المكرر.

إذا كانت Firebase Rules المنشورة تختلف عن الملف الحالي، فقد يفشل private target subscription رغم نجاح الكود. لذلك لا يكفي اختبار UI محلي أو source scan لإعلان READY.

## الملفات الرئيسية المعدلة

- `src/modes/teamBattleEngine.js`
- `src/context/CompetitiveModeContext.jsx`
- `src/firebase/competitiveFirebase.js`
- `src/pages/CompetitiveModePage.jsx`
- `database.rules.json`
- `scripts/qa-team-battle-engine.mjs`
