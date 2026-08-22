# تقرير تحقيق وإصلاح ظهور قالب 2v2 في شاشة 1v1

**المشروع النشط:** `H:\neon_game`  
**الملف الأساسي:** `src/pages/LobbyPage.jsx`  
**النطاق:** واجهة العرض فقط، دون تعديل Gameplay Constitution أو Firebase authority.

## الخلاصة التنفيذية

ثبت التحقيق أن مسار `/one-v-one` يستخدم `LobbyPage` فعلًا، وأن الملف الجذري في `H:\neon_game\src\pages\LobbyPage.jsx` يحتوي على التعديل السابق. لكن التعديل السابق لم يكن نقلًا كاملًا لقالب المرجع؛ كان يعتمد أساسًا على تغيير نصوص وclasses، كما أن selector CSS المضاف كان يستهدف `.ng-lobby-command-card`، بينما العنصر الفعلي يستخدم `.premium-command-card`. لذلك كانت طبقة الشكل الجديدة غير مؤثرة بصريًا.

## الأدلة التي تم التحقق منها

| المجال | النتيجة |
|---|---|
| خادم التطوير | المنفذ 5173 كان يستمع من العملية 13464 |
| route | `src/App.jsx` يربط `/one-v-one` بـ`LobbyPage` |
| شرط 1v1 | `isOneVOneRoute` يعتمد على `location.pathname === '/one-v-one'`، و`isOneVOneLobby` يصبح صحيحًا عند غياب room نشطة |
| Firebase | لم يتغير أي service أو transaction أو subscription |
| callbacks | `handleCreateRoom`, `handleJoinRoom`, `handleStartGame` بقيت كما هي |
| build قبل الإصلاح | نجح مرة في بيئة Windows، لكن npm لم يطبع سجلًا مفيدًا |
| HTTP route | `GET /one-v-one?mode=1v1` أعاد `HTTP/1.1 200 OK` |
| browser QA | تعذر التحقق البصري الآلي لأن جلسة المتصفح أعادت خطأ تأخير، لذلك لا أدعي نجاح screenshot QA |

## السبب الجذري

السبب ليس غياب route؛ فالـroute موجود ويعرض `LobbyPage`. السبب البصري هو أن التعديل السابق لم يطابق بنية المرجع بما يكفي، وفوق ذلك كان selector CSS الرئيسي غير مطابق للـclass الفعلي. النتيجة أن الصفحة كانت تحصل على بعض النصوص الجديدة، لكن لا تحصل على المعالجة البصرية المتوقعة من قالب 2v2.

## الإصلاح المنفذ

تم تنفيذ الإصلاح في `LobbyPage.jsx` بإضافة عنوان 1v1 بحجم display واضح، وإضافة حقل Category داخل بطاقة إعداد 1v1 قبل إنشاء الغرفة، مع استخدام `actions.setCategory` الموجود أصلًا. هذا يجعل بنية 1v1 أقرب فعليًا إلى المرجع: عنوان كبير، سياق اللعب، إعدادات الغرفة، ثم مسار Create/Join.

تم تصحيح selector في `index.css` من selector غير موجود إلى:

```css
.ng-1v1-reference-lobby.premium-command-card
```

كما أضيفت قواعد mobile صريحة للشاشة الصغيرة دون إدخال animation جديدة.

## خطة التنفيذ التي اتُّبعت

أولًا تم تثبيت النسخة التي يقدّمها الخادم، ثم تمت مقارنة route وrender branch بين 2v2 و1v1. بعد ذلك تم تحديد أن التعديل السابق presentation-only لكنه غير مكتمل وغير مربوط بالـclass الصحيح. نُفذ patch محدود في الملفين المذكورين، ثم تم إجراء source audit وHTTP check. آخر خطوة build خرجت بحالة فشل صامتة من npm/Vite دون سجل، ولذلك بقيت حالة الإصدار مشروطة حتى ينجح build مرئي في بيئة المستخدم.

## حدود الحماية

> **NO CONSTITUTION CHANGE.**

لم تُمس قواعد الجولات، scoring، target privacy، room lifecycle، Firebase transactions، أو authority. تمت إضافة عنصر عرض Category فقط، وهو يستعمل state وaction موجودين أصلًا.

## الحالة النهائية

**CONDITIONAL — الإصلاح البرمجي موجود في النسخة الجذرية، وroute يعيد 200، لكن التحقق البصري النهائي وbuild المرئي محجوبان بعائق بيئي في جلسة Windows/المتصفح.**

لرؤية التغيير، يجب تحديث صفحة `http://192.168.1.9:5173/one-v-one?mode=1v1` تحديثًا قسريًا بعد التأكد من أن خادم Vite يعمل من `H:\neon_game` وليس من مجلد احتياطي آخر.
