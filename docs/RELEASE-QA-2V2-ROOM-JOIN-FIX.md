# تقرير التحقيق والإصلاح النهائي: فشل دخول غرفة 2v2 بالكود

## الملخص التنفيذي

كان الكود الذي يظهر للـ Host موجودًا في الواجهة، لكن مسار الانضمام في 2v2 لم يكن مطابقًا لمسار الغرفة العامل في 1v1. التحقيق أثبت أن `competitiveFirebase.js` كان يستخدم `db` وبعض دوال Firebase Realtime Database من غير استيرادها من مصدر Firebase الفعلي. كما أن مسار 2v2 كان يختزل حالات الغرفة المختلفة في رسالة واحدة عامة، بدل التأكد أولًا من وجود الغرفة في namespace الصحيح ثم التفريق بين الغرفة غير الموجودة، الممتلئة، المغلقة، أو التي تسمح بإعادة اتصال لاعب سابق.

تم إصلاح المسار دون تغيير قواعد توزيع الفرق أو الأهداف أو التسجيل أو الجولات. القرار الحالي هو **CONDITIONAL**: الإصلاح مطبق، وفحوص المصدر والمنطق نجحت، لكن اختبار Firebase الحي بأربعة أجهزة وبناء Vite الكامل لم يتم اعتمادهما كاختبار ناجح من هذه البيئة، لذلك لا يجوز وصف الإصدار بأنه جاهز للإنتاج قبل اختبار الجهازين أو الأربعة عملاء فعليًا.

## نطاق التحقيق

السيناريو محل التحقيق هو: Host يفتح **2v2 Team Battle**، ينشئ Room، ينسخ الكود الظاهر، ثم يضع لاعب ثانٍ أو ثالث أو رابع الكود في خانة **Join Room**. السلوك المتوقع هو العثور على نفس الغرفة في Firebase، إضافة هوية اللاعب بترتيب دخول جديد، ثم ظهور اللاعب في Lobby عند كل العملاء.

تمت حماية 1v1 وTournament من أي تغيير في schema أو namespace أو منطق اللعب. الإصلاح محصور في adapter الخاص بالغرف التنافسية ومسار الانضمام المتصل به.

## المشاكل المؤكدة

| ID | العرض | السبب المؤكد | الإصلاح | الدليل | الحالة |
| --- | --- | --- | --- | --- | --- |
| ENG-2V2-01 | الكود المنسوخ ينتج رسالة فشل عامة عند محاولة الدخول | adapter كان يشير إلى `db` و`ref` و`onValue` و`onDisconnect` و`remove` و`update` دون استيراد Firebase الفعلي والدوال modular اللازمة | إضافة `db` من `src/firebase/config.js` وإضافة جميع دوال Firebase المستخدمة من `firebase/database` | القراءة المباشرة للـ adapter أظهرت الاستيرادات الناقصة؛ فحص المصدر بعد الإصلاح نجح | تم الإصلاح |
| ENG-2V2-02 | لا يوجد إثبات واضح هل الغرفة موجودة أم ممتلئة أم بدأت | مسار 2v2 كان يعتمد على transaction فقط ويحوّل كل حالات عدم الإضافة إلى رسالة واحدة | إضافة pre-read باستخدام `get`, normalization للكود، وفصل أخطاء not found/full/started/removed/race | المسار الجديد يطابق مبدأ `reconnectOrJoinFirebaseRoom` العامل في 1v1 | تم الإصلاح |
| ENG-2V2-03 | إعادة الاتصال للاعب سبق أن دخل الغرفة ليست واضحة | مسار 2v2 القديم كان يقيد الدخول على lobby قبل إتمام التمييز بين لاعب سابق ولاعب جديد | السماح بإعادة الاتصال identity-preserving في أي phase، مع استمرار منع الهوية الجديدة بعد بدء اللعب | مقارنة مباشرة مع roomService.js الخاص بـ 1v1 | تم الإصلاح |

## تدفق الحالة بعد الإصلاح

```text
Join Room input
  → trim + uppercase
  → roomRef(team_battle, code)
  → get(teamRooms/code)
  → not found / removed / started / full validation
  → guarded runTransaction
  → existing player reconnect OR new player with next joinOrder
  → setupPresence
  → provider subscribes to the same teamRooms/code path
  → Lobby projection updates on all clients
```

الـ Host واللاعبون يستخدمون الآن نفس المفتاح `team_battle` ونفس namespace `teamRooms/{ROOM_CODE}`. التغيير لا ينقل الغرفة إلى namespace 1v1 ولا ينشئ نسخة ثانية من الغرفة في الواجهة.

## ما تم تنفيذه

تم إصلاح import contract في `src/firebase/competitiveFirebase.js` بإضافة `db` من `src/firebase/config.js` واستيراد دوال Firebase modular المستخدمة فعليًا.

تم إعادة بناء `joinCompetitiveRoom` ليقوم بتطبيع الكود، والتحقق من وجود الغرفة قبل transaction، واكتشاف `removedPlayers`, ودعم reconnect للاعب الذي له نفس identity، ومنع اللاعب الجديد إذا كانت الغرفة بدأت أو وصلت إلى أربعة لاعبين، وحساب `joinOrder` من الحالة authoritative بدل الاعتماد على ترتيب محلي.

تم الإبقاء على إنشاء الغرفة في نفس المسار الموجود: `createCompetitiveRoom` يكتب الغرفة في `teamRooms/{roomId}` مع `status: lobby`, `phase: lobby`, `hostId`, واللاعب الأول. وبذلك يصبح الكود الظاهر في بطاقة Room Code هو المفتاح الحقيقي الذي يقرأه مسار الانضمام، وليس مجرد نص للعرض.

## مصفوفة التحقق

| البوابة | الأمر أو السيناريو | النتيجة | حدود الدليل |
| --- | --- | --- | --- |
| Source contract | فحص `competitiveFirebase.js`, `CompetitiveModeContext.jsx`, و`CompetitiveModePage.jsx` | **PASS** — `2V2_ROOM_SOURCE_CONTRACT_PASS` | يثبت صحة contracts والاستيرادات، ولا يثبت اتصال Firebase حيًا |
| Team Battle deterministic logic | `node scripts/qa-team-battle-engine.mjs` | **PASS** — `Team Battle engine QA passed: 4-player split and shared team targets are authoritative.` | يغطي team split وshared targets، وليس شبكة Firebase |
| JSX parsing | Babel parser على الملفات المعدلة | **PASS** في الفحص السابق، وأعيد تضمينه ضمن source contract check | لا يغطي bundling أو runtime |
| 1v1 reference comparison | مقارنة `roomService.js` و`GameStateContext.jsx` مع adapter 2v2 | **SOURCE VERIFIED** | مسار 1v1 نفسه لم يُعد تشغيله على جهاز حي في هذه الدفعة |
| Exact namespace | `COMPETITIVE_MODES.TEAM_BATTLE = team_battle` و`ROOTS.team_battle = teamRooms` | **SOURCE VERIFIED** | يحتاج قراءة فعلية من Firebase للتأكد من أن الـ Host الحالي كتب في هذا المسار |
| Production build | `npm run build` | **NOT VERIFIED** | workspace المرفق منع تنفيذ Vite binary، ومحاولة تشغيل Vite مباشرة تجاوزت timeout؛ هذا قيد بيئة وليس نتيجة نجاح build |
| Live Firebase two-client test | Host + Player 2 | **NOT VERIFIED** | لم يتوفر اختبار متصفح حي مستقل موثق في هذه الدفعة |
| Live Firebase four-client test | Host + Players 2–4 | **NOT VERIFIED** | مطلوب قبل اعتماد الإصدار |
| 1v1/Tournament regression | إنشاء/انضمام/بدء مسارات الحماية | **NOT VERIFIED** | لم يتم تشغيل runtime regression كامل بعد الإصلاح |

## الأنظمة المحمية

لم يتم تغيير `roomService.js` أو schema الغرف العامة الخاصة بـ 1v1/Social. لم يتم تغيير `teamBattleEngine.js` أو توزيع Team A وTeam B أو قواعد shared targets أو scoring أو reveal أو الثلاث جولات. لم يتم تغيير `tournamentRooms` أو منطق Tournament. كما لم تتم إضافة مصدر حقيقة محلي جديد للغرفة؛ الواجهة ما زالت projection من state القادم من Firebase.

## ما لم يتم إثباته بعد

لم يتم إثبات أن نسخة التطبيق التي يفتحها الهاتف الثاني تحتوي على نفس Firebase environment variables الخاصة بنسخة الـ Host. إذا كان الهاتفان يدخلان إلى deployments مختلفة أو أحدهما يستخدم build قديمًا، فحتى الإصلاح الصحيح لن يقرأ نفس Firebase project. لذلك يجب التأكد من أن الرابط نفسه، وFirebase project نفسه، و`VITE_FIREBASE_DATABASE_URL` نفسه مستخدمون على الأجهزة الأربعة.

لم يتم إثبات live reconnect وrace behavior بأربعة عملاء. يجب تجربة دخول اللاعبين في ترتيب 1 ثم 2 ثم 3 ثم 4، ثم إعادة تحميل لاعب، ثم محاولة لاعب خامس، ثم محاولة الانضمام بعد ضغط Host على Start.

## الاختبار المطلوب قبل الإصدار

يجب تشغيل Host وPlayer 2 من نفس deployment، ثم التأكد من أن بطاقة Host تعرض code مثل `B-XXXXX` وأن Player 2 يضع نفس الحروف في خانة Join Room. بعد نجاح دخول Player 2 يجب تكرار ذلك للاعبين 3 و4 حتى تظهر `4/4 SEATS` عند الجميع. بعد ذلك يضغط Host Start، ويتأكد اللاعبون من Team A = joinOrder 1 و2 وTeam B = joinOrder 3 و4، ثم يتأكد كل زميلين من رؤية target واحد، وبعد كل جولة يظهر reveal الصحيح وتُحسب النقاط مرة واحدة.

يجب اختبار code خاطئ، code لغرفة بدأت، غرفة ممتلئة، إعادة تحميل لاعب موجود، وضغط Join مرتين بسرعة. النتائج المقبولة هي رسائل دقيقة، وعدم إضافة duplicate player، وعدم فقدان الغرفة، وعدم خلط target أو round.

## الاحتواء والتراجع

إذا ظهر خلل بعد النشر، يمكن التراجع عن التعديل في `src/firebase/competitiveFirebase.js` وحده، مع إبقاء واجهة Room Code كما هي. لا توجد migration أو إعادة كتابة schema مطلوبة. لا يجب حذف `teamRooms` من Firebase كحل تجريبي، لأن ذلك قد يزيل غرفًا صحيحة ويخفي المشكلة الحقيقية.

## قرار الإصدار

**CONDITIONAL — الإصلاح مطبق وقابل للاختبار الداخلي، لكنه ليس READY للإنتاج بعد.** السبب المحدد هو أن source contract والفحص الحتمي نجحا، بينما build الكامل وruntime Firebase verification بأربعة عملاء واختبارات regression لـ1v1 وTournament ما زالت غير موثقة. إذا نجح اختبار الأجهزة الأربعة من نفس deployment مع ظهور اللاعبين في `teamRooms/{ROOM_CODE}` واستمرار الجولات الثلاث، يمكن ترقية القرار إلى **READY** بعد إعادة تشغيل build الفعلي.
