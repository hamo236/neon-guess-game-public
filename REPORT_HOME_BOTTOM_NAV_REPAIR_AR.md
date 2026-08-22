# تقرير إصلاح Home وBottom Navigation

## المشكلة المرصودة
كانت صفحة Home تعرض أجزاء تخص إعداد الغرفة وإدارتها مثل Room Status وCreate/Join وRoom setup وLobby، رغم أن المطلوب أن تكون Home بوابة مختصرة لا تعرض هذه الكتل. كذلك كان التنقل بين Four و2v2 غير موحد بصريًا، إذ ظهر ModeSwitcher كشريط جانبي/بطاقة داخل بعض الصفحات، مع وجود احتمال لشريط محلي إضافي في حالات النتائج.

## السبب المثبت من المصدر
كان `LobbyPage` يرسم كتلة Home وبنية الغرفة ضمن نفس الصفحة دون عزل كامل يعتمد على المسار. كما أن `CompetitiveModePage` كان يحتوي على `BottomNavBar` محلي في حالات النتائج، بينما كان `App.jsx` يرسم شريطًا عامًا على المسارات التنافسية. وكان `ModeSwitcher` موجودًا داخل `LobbyPage` كعنصر جانبي بدل الاعتماد على شريط التنقل السفلي المشترك.

## الإصلاح المنفذ
أضيف شرط عرض يعتمد على `location.pathname` بحيث تُخفى كتلة Room Status وRecovery وRoom setup وLobby وCreate/Join من Home فقط. وتبقى هذه الكتل ظاهرة في 1v1 وFour و2v2، لأن صفحات اللعب تحتاجها فعليًا.

أزيل `ModeSwitcher` الجانبي من `LobbyPage`، وأزيل الشريط المحلي المكرر من `CompetitiveModePage`. أصبح `BottomNavBar` العام في `App.jsx` هو نقطة التنقل الموحدة، ويظهر على Home و1v1 وFour و2v2، بينما يبقى مخفيًا عن `/game` و`/admin` كما كان مقررًا.

## ما لم يتغير
لم تتغير Firebase أو handlers أو routes أو effects أو state ownership أو room lifecycle أو authentication أو scoring أو timers أو rounds أو reveal أو target privacy أو Team Battle logic. لم تتم إضافة dependency أو تغيير configuration.

## مراجعة الحركة
لم تتم إضافة حركة جديدة. التغيير يعتمد على composition وconditional rendering للواجهة فقط. عناصر التنقل الموجودة مسبقًا تحتفظ بحركتها الحالية؛ ولم تُستخدم الحركة لإخفاء حالة أو تغيير سلوك.

## التحقق
تمت مراجعة `App.jsx` و`LobbyPage.jsx` و`CompetitiveModePage.jsx` ومطابقة شروط العرض. استجاب الخادم الحي بـHTTP 200 للمسارات `/` و`/tournament` و`/one-v-one`. محاولة build من Windows انتهت بخروج غير ناجح وسجل فارغ، لذلك لا تُعد BUILD VERIFIED. كما أن الفحص البصري الآلي تعذر بسبب تأخر جلسة المتصفح.

## الحالة
**CONDITIONAL / NEEDS USER VISUAL TEST**. التعديل موجود في النسخة النشطة، لكن يلزم تحديث قسري للصفحة ثم فحص Home و1v1 وFour و2v2 على الجهاز الفعلي.

## خطوات التحقق اليدوي
افتح `http://192.168.1.9:5173/` ثم نفذ تحديثًا قسريًا. يجب أن تظهر Home بدون Room Status وCreate/Join وLobby، مع ظهور بطاقات الأنماط وشريط Home/1v1/Four/2v2 أسفل الشاشة. افتح بعدها `/one-v-one` و`/tournament` و`/team-battle` وتأكد من ظهور شريط التنقل السفلي نفسه وعدم ظهور بطاقة ModeSwitcher جانبية.

## قرار النطاق
**NO CONSTITUTION CHANGE.** هذا patch presentation-only مع فصل عرض Home عن واجهات الغرف وتوحيد مصدر Bottom Navigation.
