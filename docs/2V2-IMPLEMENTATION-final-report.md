# تقرير تنفيذ 2v2 Team Battle

## القرار المعتمد

تم اعتماد توزيع الفرق حسب `joinOrder`: Team A تضم أول لاعبين، وTeam B تضم اللاعب الثالث والرابع. يبدأ Host المباراة يدويًا بعد اكتمال أربعة لاعبين.

## الإصلاحات المنفذة

أُصلحت حدود Firebase Modular باستخدام `child(DatabaseReference, path)` بدل تمرير DatabaseReference إلى `ref`. شمل الإصلاح room paths وpresence وprivate target paths، مع الحفاظ على namespace `teamRooms` وschema الحالي.

تم تثبيت `joinOrder` داخل transaction عند إنشاء الغرفة والانضمام إليها، ثم أصبح ترتيب اللاعبين المستخدم في Team Battle هو الترتيب المحفوظ authoritative بدل الاعتماد على ترتيب مفاتيح Firebase.

تم تطبيق shared-team targets: كل لاعبي Team A يستقبلون نفس target، وكل لاعبي Team B يستقبلون target آخر. يظل التسليم في private paths لكل لاعب، بينما يبقى team projection محفوظًا داخل match state للمراجعة والـ scoring. لم تتغير آلية guess resolution الأساسية، ولا round count، ولا protected tournament behavior.

أصبح 2v2 ظاهرًا كخيار أول داخل Lobby، مع card مميز، room flow واضح، Team A/Team B slot preview، وشرح Host Start. كما تم استبدال مدخل Modes في mobile bottom navigation بمدخل مباشر `2v2` إلى `/team-battle`.

## التحقق

| البوابة | النتيجة |
|---|---|
| Deterministic smoke suite | PASS — `QA_FINAL_EXIT=0` |
| Focused Team Battle engine test | PASS — `ENGINE_FINAL_EXIT=0` |
| Production build | PASS — `BUILD_FINAL_EXIT=0` |
| Lobby route | HTTP 200 |
| Team Battle route after warm compilation | HTTP 200 |
| Tournament route | HTTP 200 |
| Daily route | HTTP 200 |
| Protected Firebase namespaces and tournament engine | لم تُكسر وفق مراجعة المصدر |
| Firebase live multi-client | غير متحقق داخل حسابات Firebase فعلية |
| أربعة متصفحات/عملاء مع reconnect وrace | غير متحقق |
| Browser/mobile visual matrix | غير متحقق كاختبار أجهزة فعلي |

## حدود الإصدار

الحالة **CONDITIONAL**. تم إصلاح blocker البناء السابق، وتم إثبات shared-target invariant وfour-player split باختبار executable، كما تم إثبات وصول المسارات. لكن لا يجوز إعلان READY قبل اختبار room حي بأربعة عملاء، والتحقق من رفض اللاعب الخامس، reconnect، duplicate start/guess، private target isolation، انتهاء الجولة، scoring، والنتيجة النهائية.

## Acceptance criteria للمرحلة الحية

1. Host ينشئ room ويظهر code صالح.
2. ثلاثة لاعبين ينضمون، وتظهر المقاعد حسب joinOrder.
3. اللاعب الخامس يُرفض دون تغيير الحالة.
4. Start لا يعمل قبل 4/4 ولا يعمل إلا من Host.
5. Team A يرى target واحدًا مشتركًا، وTeam B يرى target مختلفًا مشتركًا.
6. نجاح guess من عضو يُحسب لفريقه، ولا يمكن للاعب إرسال guess مكرر.
7. الجولة التالية تعيد إنشاء target مشترك جديد لكل فريق مع matchId وroundNumber صحيحين.
8. لا يستطيع لاعب قراءة target الفريق الآخر من private target path.
9. reconnect لا يغير الفريق أو joinOrder.
10. المباراة تنتهي بعد ثلاث جولات بنتيجة وrewards متسقة.

## الدروس

يجب أن يكون كل ترتيب مؤثر في Multiplayer محفوظًا في state authoritative، لا مستنتجًا من object enumeration. كما يجب استخدام `child` عند بناء child reference من Firebase DatabaseReference، وإضافة اختبار executable للمحرك بجانب smoke source contracts.
