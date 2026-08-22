# تقرير تنفيذ وتدقيق وضع 2v2 Team Battle

**المشروع:** NEON GUESS  
**نوع الدفعة:** 2v2 Team Battle — bounded MVP / UX clarity pass  
**الحالة:** **CONDITIONAL**  
**المؤلف:** Manus AI  
**التاريخ:** 19 أغسطس 2026

## الملخص التنفيذي

أثبت فحص المصدر أن وضع 2v2 الحقيقي كان موجودًا بالفعل داخل مسار تنافسي معزول، وليس مجرد بطاقة واجهة أو محاكاة محلية. المسار يستخدم `CompetitiveModeContext` للمزامنة، و`teamBattleEngine` لإدارة الفرق والجولات والنتيجة، و`competitiveFirebase` لعزل غرف `team_battle` وحماية الأهداف الخاصة. لذلك لم يتم إنشاء معمارية ثانية أو إدخال Team Battle داخل الـ legacy `GameStateContext`.

الفجوة المؤكدة كانت في تجربة الـ lobby: اللاعبون كانوا يظهرون في قائمة مسطحة مع عدّاد `/4` دون رؤية واضحة لمكاني Team A وTeam B. تم تنفيذ تحسين UI محدود يعرض بطاقتي فريق، مقعدين لكل فريق، حالة كل مقعد، وشرحًا صريحًا أن العرض مبني على ترتيب الانضمام وأن المحرك الحالي يظل صاحب القرار عند بدء المباراة.

> القرار الهندسي: **إعادة استخدام المسار الحقيقي الموجود + تحسين الإسقاط البصري فقط**، بدل اختراع نظام 2v2 جديد أو تعديل Firebase.

## الأدلة المعمارية

| النظام | الدليل | القرار |
|---|---|---|
| Provider | `src/context/CompetitiveModeContext.jsx` | ينشئ/ينضم للغرفة، يشترك في الحالة والهدف الخاص، ويقيد start/resolve على المضيف |
| Engine | `src/modes/teamBattleEngine.js` | يفرض أربعة لاعبين، ينشئ فريقين من لاعبين، يحسب ثلاث جولات ونتيجة نهائية |
| Firebase | `src/firebase/competitiveFirebase.js` | يستخدم `teamRooms`، سقف أربعة لاعبين، mutations transactional، وأهدافًا خاصة لكل لاعب |
| UI | `src/pages/CompetitiveModePage.jsx` | يعرض lobby واللعب والنتائج؛ أضيفت معاينة team slots للـ Team Battle فقط |

## التغيير المنفذ

تم تغيير `src/pages/CompetitiveModePage.jsx` فقط على مستوى العرض بإضافة `TeamSlotPreview`. يستخدم المكوّن قائمة `players` الحالية لعرض أول مقعدين في Team A والمقعدين التاليين في Team B، ويعرض `Open slot` للمقاعد الفارغة و`READY` أو `OFFLINE` للاعب الموجود.

لم يتم تعديل `CompetitiveModeContext.jsx` أو `teamBattleEngine.js` أو `competitiveFirebase.js`. لم تتم إضافة writes، ولم يتغير room schema أو private target paths أو scoring أو round transitions. كما أضيفت assertions إلى `scripts/qa-smoke.mjs` لحماية وجود المعاينة، اسمها القابل للوصول، عزلها عن Team Battle، ورسالة ترتيب الانضمام.

## التحقق

| البوابة | النتيجة | مستوى الدليل |
|---|---|---|
| `npm.cmd test` | **PASS — `QA_EXIT=0`** | ENGINE/CONTRACT TEST VERIFIED |
| Vite SPA shell على `/team-battle` | **HTTP 200** | RUNTIME SHELL VERIFIED |
| مراجعة الملفات المحمية | لم تتغير | SOURCE VERIFIED |
| Production build | **exit 1** | BLOCKED BY ENVIRONMENT / existing Node tooling blocker |
| Firebase live room | لم يُنفذ | NOT VERIFIED |
| عميلان أو أربعة عملاء | لم يُنفذ | NOT VERIFIED |
| اختبار شاشة/موبايل فعلي | لم يُنفذ | NOT VERIFIED |

## تقييم الأنظمة المحمية

| النظام المحمي | النتيجة |
|---|---|
| Firebase authoritative state | محفوظ؛ لا توجد كتابة جديدة من المعاينة |
| Private targets | محفوظة؛ لم تتغير مسارات أو اشتراكات الأهداف |
| Team assignment authority | محفوظة؛ `createTeamBattleState` يظل المصدر الفعلي عند البدء |
| Three-round scoring | محفوظة؛ لم يتغير `finishTeamRound` أو `advanceTeamRound` |
| Legacy 1v1/Social | لم يتم لمس `GameStateContext` أو `gameEngine` |
| Tournament | لم يتم تغيير tournament engine أو its UI behavior |

## المخاطر المتبقية

المعاينة البصرية ليست إثباتًا لمزامنة 2v2 الحية. ترتيب العرض يطابق منطق المحرك الحالي عند بدء الغرفة، لكنه لا يثبت سلوك السباق بين أربعة عملاء أو reconnect أو Firebase rules. كذلك ما زال production build محجوبًا بسبب مشكلة بيئة Node/Vite السابقة، لذلك لا يوجد artifact إنتاج يمكن اعتماده.

## القرار

هذه الدفعة **مقبولة كتحسين UX محدود ومحمية المصدر**، لكنها ليست جاهزة للإصدار الإنتاجي الكامل. التصنيف الصحيح هو **CONDITIONAL** للأسباب التالية:

1. Smoke suite نجحت.
2. مسار `/team-battle` استجاب من SPA shell.
3. التغيير لم يقترب من authoritative multiplayer code.
4. Production build ما زال فاشلًا بيئيًا.
5. لم يتم تنفيذ اختبار Firebase متعدد العملاء.

## الخطوة التالية المقيدة

الدفعة التالية يجب أن تكون QA حيًا فقط: تشغيل build في بيئة Node مستقرة، ثم اختبار إنشاء غرفة Team Battle، انضمام أربعة UIDs، منع اللاعب الخامس، بدء المضيف، وصول target خاص لكل لاعب، تسجيل التخمين، انتهاء الجولة، الانتقال إلى الجولة الثانية، وحساب النتيجة النهائية بعد الجولة الثالثة. لا ينبغي توسيع النطاق إلى تغيير قواعد الفرق قبل نجاح هذا السيناريو.

## المراجع

[1]: `src/context/CompetitiveModeContext.jsx` — competitive room lifecycle and authoritative actions.  
[2]: `src/modes/teamBattleEngine.js` — 2v2 state model, teams, rounds, scoring, and rewards.  
[3]: `src/firebase/competitiveFirebase.js` — isolated Firebase namespace, room cap, transactions, and private targets.  
[4]: `src/pages/CompetitiveModePage.jsx` — competitive lobby and Team Battle projection.  
[5]: `scripts/qa-smoke.mjs` — deterministic regression contract.
