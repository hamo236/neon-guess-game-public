# تقرير مشاكل مشروع NEON GUESS وطريقة تحسينه

## الملخص التنفيذي

المشكلة الأساسية في المشروع لم تكن Bug واحدة. المشروع مرّ بأربع طبقات من المشاكل في الوقت نفسه: مشاكل داخل منطق اللعبة، مشاكل في Firebase والمزامنة، مشاكل في بيئة التشغيل على Windows، ومشاكل في طريقة إدارة التحقيق والتنفيذ. لذلك كان من الطبيعي أن يظهر للمستخدم زر لا يعمل أو شاشة لا تحمل، بينما السبب الحقيقي أحيانًا يكون في transaction أو import أو عملية Node عالقة، وليس في الزر نفسه.

التقييم المهني الحالي هو: **الكود الأساسي لـ 2v2 أصبح قويًا على مستوى المصدر والمنطق الحتمي، لكن المشروع لم يصل إلى READY نهائي لأن build وتشغيل المتصفح وتجربة Firebase بأربعة لاعبين لم تُثبت في البيئة الحالية**. هذا فرق مهم بين أن يكون الإصلاح مكتوبًا، وأن يكون السلوك الحقيقي قد تم رصده في لعبة حية.

> أهم درس: لا يجوز أن نعالج مشروع Multiplayer باعتباره صفحة React فقط. هو نظام موزع يتكون من UI، state machine، Firebase transactions، listeners، identity، privacy، recovery، وبيئة تشغيل. أي طبقة غير مؤكدة قد تجعل الطبقات الأخرى تبدو وكأنها فاشلة.

## 1. المشاكل التي كانت داخل المشروع نفسه

### 1.1 وجود أكثر من مسار كتابة للتأكيد

كان زر `Guess Correct` يكتب في مسار Firebase منفصل عن المسار الذي يستخدمه resolver. لذلك كان الزر يستجيب بصريًا، لكن الحالة التي ينتظرها انتقال الجولة لم تكن تصل إلى نفس المصدر authoritative. النتيجة كانت أن اللاعب يضغط، وربما تُحفظ إشارة التأكيد، لكن الجولة لا تنتقل.

الحل الصحيح كان إلغاء المسار المنافس وجعل العملية كلها تمر من خلال `mutateCompetitiveState` ثم `confirmTeamRound`. هذا يضمن أن التأكيد يدخل في نفس الحالة العامة التي يقرأها resolver.

**التحسين الدائم:** يجب أن يكون لكل حدث gameplay critical مسار كتابة واحد فقط. يجب أن توجد قاعدة QA تمنع إعادة إضافة أي writer قديم، كما تم عمله مع `writeTeamBattleConfirmation`.

### 1.2 الاعتماد على المضيف في الانتقال

في نسخة سابقة كان المضيف وحده مسؤولًا عن إنهاء الجولة والانتقال بعد الـ reveal. هذا يسبب فشلًا صامتًا إذا كان هاتف المضيف نائمًا، أو المتصفح في الخلفية، أو listener لديه متأخر، أو الاتصال لديه ضعيف.

تم تحسين ذلك بالسماح لأي Client متصل بطلب resolve أو advance، مع إبقاء Firebase transaction هو الحارس الذي يمنع التكرار والانتقال المزدوج.

**التحسين الدائم:** لا تجعل وجود تبويب واحد شرطًا لتقدم مباراة Multiplayer. اجعل كل Client قادرًا على طلب العملية، واجعل السلطة الحقيقية داخل transaction idempotent.

### 1.3 ضعف حماية المحرك ضد الفريق غير المصرح له

الواجهة كانت تعطل الزر للاعب الخطأ، لكن المحرك نفسه كان يقبل استدعاء confirmation مباشرًا. هذا خطر لأن أي عميل يستطيع تجاوز UI وإرسال mutation يدويًا.

تم إصلاح ذلك داخل `confirmTeamRound`: يتم فحص team identity، و`confirmationTeamId`، وround number، وmatch ID قبل قبول التأكيد.

**التحسين الدائم:** كل قاعدة موجودة في UI يجب أن تتكرر في authoritative engine أو transaction. تعطيل الزر ليس Authorization.

### 1.4 مشكلة target privacy

كانت بيانات الأهداف قريبة من public room state. في نظام 2v2، اللاعب يجب أن يرى هدف الخصم فقط أثناء اللعب، ولا يرى هدف فريقه إلا أثناء reveal بعد نهاية الجولة.

تم فصل private target paths عن public state، وإزالة `match.targets` و`match.teamTargets` من الحالة العامة أثناء اللعب، وتنظيف target fields من confirmations وguesses والتاريخ العام.

**التحسين الدائم:** يجب اعتبار target privacy اختبار release-critical، وليس تحسينًا شكليًا. يجب اختبار كل Client على حدة، وليس الاكتفاء بفحص شاشة لاعب واحد.

### 1.5 خطأ undefined داخل roundHistory

الخطأ:

```text
transaction failed: Data returned contains undefined in property 'roundHistory.0.guesses'
```

كان حقيقيًا. sanitizer كان يعيد بناء round result ويضع `guesses: undefined` في بعض الحالات. Firebase Realtime Database يرفض هذا النوع من البيانات داخل transaction.

تم إصلاح ذلك بالحذف البنيوي للحقل، ثم إضافته فقط عندما تكون قيمته صالحة.

**التحسين الدائم:** لا تستخدم `undefined` في أي object يذهب إلى Firebase. يجب أن توجد دالة sanitize واحدة، واختبار يمر على كل الحالات: field موجود، field فارغ، field غير موجود، وfield يحتوي null.

### 1.6 فقدان بيانات target من round history

بعد إخفاء الأهداف من public state، أصبح هناك احتمال أن يصبح target في `playerStats.roundHistory` فارغًا. تم إصلاح ذلك بجعل authoritative reveal snapshot هو المصدر الأول، مع fallback للحالة غير المنظفة.

**التحسين الدائم:** يجب فصل بيانات العرض الآني عن بيانات التاريخ. إخفاء target من public state لا يجوز أن يمسح البيانات التي يحتاجها result/history بعد انتهاء الجولة.

### 1.7 target قديم أو target غير جاهز

كان من الممكن نظريًا أن يسجل اللاعب guess قبل وصول target الحالي، أو باستخدام target تابع لجولة قديمة. تم إضافة فحص `targetReady` و`matchId` و`roundNumber` قبل قبول العملية.

**التحسين الدائم:** كل action مرتبط بجولة يجب أن يحمل ويُراجع `roomId`, `matchId`, `roundNumber`, ويفضل `roundId` واضحًا. لا تعتمد على state محلي غير مؤكد.

### 1.8 فجوة عرض الـ reveal

المحرك كان ينتج `roundResult.targets` للفريقين، والصفحة كانت تحتوي على `TeamRevealTargets`، لكن `TeamResult` لم يكن يستدعيه فعليًا. هذا مثال مهم على مشكلة “الكود موجود لكن غير مربوط”.

تم إصلاح الاستدعاء، وأصبح Round Result يعرض هدف Team A وهدف Team B.

**التحسين الدائم:** كل contract يجب أن يمر عبر السلسلة كاملة: engine output، persistence، listener، component props، ثم rendered DOM. وجود function أو state لا يثبت أن المستخدم يراه.

### 1.9 مشاكل imports ومسار تحميل الصفحة

ظهور `This game screen could not load` لم يكن دليلًا كافيًا على أن Firebase هو السبب. سلسلة React كانت تحتوي على imports ناقصة أو مكررة، مما قد يؤدي إلى فشل قبل أن يتم تركيب Provider أصلًا.

تم إصلاح imports في `main.jsx`, `App.jsx`, `CompetitiveModePage.jsx`, و`CompetitiveModeContext.jsx`.

**التحسين الدائم:** يجب أن يكون هناك smoke test لمسار route نفسه، وليس فقط اختبار engine. أي lazy route يجب اختباره من entry point إلى component mount.

### 1.10 Leave وRefresh وRecovery

كان هناك خلط بين أربعة أشياء مختلفة: اللاعب ضغط Leave عمدًا، اللاعب انقطع، الصفحة عملت refresh، واللاعب عاد إلى room محفوظة. هذه الحالات ليست واحدة.

تم فصلها جزئيًا عبر `leftPlayers`, session storage، recovery state، واشتراط snapshot حديث قبل السماح بالـ mutation. وفي Team Battle، خروج لاعب أثناء اللعب يؤدي إلى إغلاق الحالة للمشتركين بدل الاستمرار في مباراة ناقصة.

**التحسين الدائم:** يجب تعريف lifecycle table رسميًا لكل حالة: intentional leave، refresh، disconnect، reconnect، removed player، host leave، room deleted.

## 2. المشاكل التي واجهناها من Firebase وبيئة التشغيل

### 2.1 بيئة Windows لم تكن قابلة للاختبار بشكل موثوق

تمت محاولة تشغيل `node --version` و`npm run test:team-battle` وعمليات build من Windows المتصل، لكن الأوامر لم ترجع مخرجات موثوقة. كما أن نسخ المشروع عبر mounted filesystem توقف بسبب بطء أو تعليق mount.

هذا ليس دليلًا على أن الكود فشل، لكنه أيضًا ليس دليلًا على أن الكود نجح في runtime.

**الحل الأفضل:** يجب تشغيل المشروع من native Windows Terminal مباشرة، وليس عبر طبقة Linux-to-Windows أثناء release verification. يجب قتل عمليات Node/Vite القديمة، حذف dependencies المختلطة، ثم تشغيل `npm install` من نفس مجلد المشروع النشط.

### 2.2 تعدد نسخ المشروع والـ stale processes

ظهور مشروع قديم بدل النسخة المعدلة، وظهور `connection refused`، وفتح port قديم، كلها علامات على أن المشكلة ليست في source فقط؛ هناك أكثر من نسخة أو أكثر من Vite process.

**الحل الأفضل:** يجب تثبيت “Active Project Path” واحد. قبل كل اختبار:

| الإجراء | الهدف |
|---|---|
| إيقاف كل `node.exe` وVite | منع server قديم |
| تنظيف `node_modules` وlock state عند الحاجة | منع dependencies مختلطة |
| تشغيل Vite على port ثابت جديد | منع فتح مشروع قديم |
| طباعة current working directory | التأكد من النسخة الصحيحة |
| فتح URL جديد واضح | منع cache وBack-Forward confusion |

### 2.3 dependencies على Windows وLinux مختلطة

نسخ `node_modules` بين بيئات مختلفة قد يسبب executable permissions أو native package mismatch، خصوصًا مع أدوات مثل Vite وSharp. هذا يفسر لماذا قد ينجح اختبار في نسخة نظيفة ولا يعمل المشروع الحقيقي.

**الحل الأفضل:** لا تنقل `node_modules`. انقل source فقط، ثم نفذ `npm install` داخل البيئة التي ستشغل التطبيق.

### 2.4 Firebase live rules وcredentials لم يتم إثباتها

الكود يستخدم Modular Firebase API، لكن لم يتم تنفيذ أربعة Clients على Firebase الحقيقي داخل هذه الجلسة. لذلك لا توجد شهادة نهائية على rules، latency، concurrent transactions، أو سلوك disconnect الحقيقي.

**الحل الأفضل:** قبل إعلان READY يجب اختبار Firebase الحقيقي، مع حفظ log لكل Client، ومراجعة database snapshots بعد كل خطوة. لا يكفي أن ينجح pure engine.

## 3. المشاكل التي جاءت من طريقة العمل والتنفيذ

### 3.1 التحقيق بدأ أحيانًا من العرض بدل lifecycle الكامل

زر لا يعمل لا يعني تلقائيًا أن onClick مكسور. في هذه الحالة كان الزر يرسل شيئًا، لكن transition transaction كانت تفشل أو لا تصل إلى المسار الذي يراقبه resolver.

**التحسين:** كل تحقيق Multiplayer يجب أن يبدأ بهذا التتبع:

```text
click
→ UI handler
→ provider action
→ pure engine mutation
→ Firebase transaction
→ database snapshot
→ listener
→ provider state
→ rendered phase
```

يجب تحديد أول نقطة ينحرف فيها السلوك، وليس تعديل آخر نقطة فقط.

### 3.2 تغييرات كثيرة عبر محاولات متتابعة

عندما يتكرر prompt ويُعاد الإصلاح دون evidence جديد، يزيد احتمال ظهور competing paths أو تغييرات جانبية. هذا ما يجعل المشروع يدخل في حلقة: إصلاح زر، ثم كسر route، ثم إصلاح route، ثم فقدان نسخة حديثة.

**التحسين:** لكل incident يجب إنشاء issue track مستقل، مع root cause واحد مثبت، patch صغير، test خاص، ثم diff review. لا يتم فتح مسار جديد قبل إغلاق السابق أو تسجيل سبب بقائه.

### 3.3 الاختبارات كانت قوية في engine وأضعف في runtime

الاختبار الحتمي ممتاز لإثبات state machine، لكنه لا يثبت تحميل React أو Firebase rules أو أربع شاشات مستقلة. وفي المقابل، تجربة متصفح واحدة لا تثبت authority أو privacy.

**التحسين:** استخدم verification pyramid:

| المستوى | ماذا يثبت؟ |
|---|---|
| Pure engine | القواعد والحسابات والانتقالات |
| Static/UI contract | أن المكونات مربوطة وأن العناصر القديمة غير موجودة |
| Integration | provider + adapter + listener |
| Build | أن المشروع يترجم وينتج artifact |
| Browser | أن المستخدم يرى ويتفاعل |
| Four-client Firebase | أن النظام الموزع يعمل فعليًا |

لا يجوز استبدال مستوى بآخر.

### 3.4 تقارير سابقة كانت تخلط أحيانًا بين الإصلاح والتحقق

الجملة “تم الحل” قد تعني أن الكود اتعدل فقط، بينما المستخدم يفهم أن اللعبة جُربت فعلًا. هذه فجوة تواصل خطيرة.

**التحسين:** استخدم دائمًا المصطلحات التالية:

| العبارة | معناها الدقيق |
|---|---|
| الكود اتعدل | يوجد edit في الملفات |
| المصدر اتراجع | تمت قراءة وتحليل السلسلة |
| الاختبار نجح | command محدد أعاد PASS |
| السلوك اتأكد | تم رصد السلوك أثناء runtime |
| Firebase اتأكد | تمت تجربة transaction/listener الحقيقي |
| جاهز للإصدار | كل release gates المطلوبة اجتازت |

## 4. مشاكل الـ skills نفسها وكيف يمكن تحسينها

الـ skills مفيدة لأنها تمنع القفز مباشرة إلى patch، وتفرض فصل evidence عن hypothesis، وتطلب release decision صريحًا. لكن لها حدودًا عملية.

### 4.1 كثرة الـ skills قد تسبب تداخلًا

وجود autonomous bug workflow، developer mind، Firebase engineering، release QA، evidence-first، وmaster engineering يرفع جودة التفكير، لكنه قد يؤدي إلى تكرار نفس التحقيق أو تضارب في الأولويات إذا لم نحدد صاحب القرار لكل مرحلة.

**التحسين المقترح:** اجعل المسؤوليات بهذا الترتيب:

| المسؤول | الوظيفة |
|---|---|
| Autonomous Bug | ترجمة شكوى المستخدم إلى incident واضح |
| Firebase/Game Engineering | تحديد وتطبيق الإصلاح التقني |
| Evidence-First | تحديد ما هو مثبت وما هو مجرد فرضية |
| Release QA Guard | منع إعلان النجاح دون أدلة كافية |
| Developer Mind | اختيار الأولويات والتصميم، وليس إصدار حكم release |

يجب ألا تعطي كل skill خطة مختلفة للمشكلة نفسها دون دمجها في scope lock واحد.

### 4.2 الـ skill لا يستطيع تجاوز بيئة تشغيل معطلة

حتى أفضل خطة لا تستطيع إثبات build أو Firebase إذا كان Node لا يعمل أو mount معلقًا. هنا يجب ألا نكرر المحاولة إلى ما لا نهاية.

**التحسين:** بعد محاولتين أو ثلاث محاولات فاشلة من نفس النوع، يجب تحويل المشكلة من “bug في التطبيق” إلى “environment incident” وطلب تشغيل Native Windows أو تسليم log حقيقي.

### 4.3 الـ skills لا تعوض عن observability داخل التطبيق

التحليل من source جيد، لكنه يصبح أقوى بكثير إذا كان التطبيق يسجل transition IDs، round IDs، mutation result، transaction retry، connection state، وسبب تعطيل الزر.

**التحسين المقترح:** إضافة debug instrumentation غير ظاهر للمستخدم، مثل:

```text
roomId
matchId
roundNumber
connectionState
targetReady
confirmationTeamId
confirmedPlayerIds
lastMutationResult
lastTransitionTimestamp
```

ويجب تعطيله أو تقليله في production.

### 4.4 الاختبار النصي UI contract محدود

اختبار string-contract مفيد لمنع حذف عنصر أو إعادة writer قديم، لكنه لا يثبت أن JSX يركب فعليًا أو أن CSS لا يمنع الضغط أو أن Firebase يرجع البيانات بالشكل المتوقع.

**التحسين:** الاحتفاظ به كحاجز سريع، وإضافة اختبار component/runtime حقيقي عندما تصبح بيئة Node سليمة.

## 5. لو كنت مكانك، ماذا كنت سأفعل؟

لو كنت مسؤولًا عن المشروع، لن أبدأ بإضافة features جديدة. سأثبت أولًا نسخة baseline قابلة للتشغيل، ثم أتعامل مع 2v2 كمنتج له release gates واضحة.

### المرحلة الأولى: تجميد النطاق

أمنع أي تغيير في شكل الـ lobby أو room code أو target privacy أو rules. أعتبر العقد التالي immutable مؤقتًا: 4 players، Team A/B، opposing target، dual confirmation، 3 rounds، 5-second reveal، final results.

### المرحلة الثانية: تنظيف البيئة

أغلق كل Node/Vite processes على Windows، أختار نسخة مشروع واحدة، أعمل backup أو commit واضح، أحذف `node_modules` من النسخة النشطة فقط، ثم أشغل `npm install` native داخل Windows. لا أنقل `node_modules` من Linux أو من نسخة أخرى.

### المرحلة الثالثة: تشغيل الاختبارات قبل أي تعديل جديد

أشغل:

```bash
npm run test:team-battle
npm run build
```

إذا فشل test، أصلح test أو الكود بحسب evidence. إذا فشل build، لا أذهب إلى Firebase قبل إصلاح build. إذا لم يعمل Node، أوقف التحقيق البرمجي وأصلح البيئة أولًا.

### المرحلة الرابعة: إضافة test للحالة التي سببت كل incident

لكل مشكلة سابقة أضيف regression محددًا: تأكيد لاعب واحد، تأكيد اللاعب الثاني، لاعب غير مخول، reveal لكلا الفريقين، target privacy، undefined sanitizer، stale target، refresh، reconnect، leave، duplicate click، وhost sleeping.

### المرحلة الخامسة: اختبار أربعة Clients

أستخدم أربع نوافذ أو أربعة أجهزة بهويات مختلفة. أسجل جدولًا لكل خطوة:

| الخطوة | Client A | Client B | Client C | Client D |
|---|---|---|---|---|
| Lobby | Team A | Team A | Team B | Team B |
| Target أثناء اللعب | هدف Team B | هدف Team B | هدف Team A | هدف Team A |
| Confirmation | مسموح حسب الفريق المدافع | مسموح | disabled إذا غير مدافع | disabled |
| Reveal | هدفا الفريقين | هدفا الفريقين | هدفا الفريقين | هدفا الفريقين |
| Round 2/3 | نفس الحالة | نفس الحالة | نفس الحالة | نفس الحالة |

لا أقبل النجاح إذا كانت شاشة واحدة فقط صحيحة.

### المرحلة السادسة: release decision واضح

إذا نجحت source tests فقط، أسميها `SOURCE VERIFIED`. إذا نجح build، أضيف `BUILD VERIFIED`. إذا رأيت اللعبة في المتصفح، أضيف `LIVE BROWSER VERIFIED`. وإذا نجح اختبار أربعة Clients على Firebase، فقط عندها أقترب من `READY`.

## 6. أولويات التحسين

| الأولوية | الإجراء | السبب |
|---|---|---|
| P0 | إصلاح Windows Node/Vite execution والنسخة النشطة | بدونها لا يوجد build أو runtime proof |
| P0 | تنفيذ اختبار Firebase بأربعة Clients | 2v2 لا يمكن اعتماده من pure engine فقط |
| P0 | تثبيت Firebase rules وprivate paths | target privacy والسلطة أهم من الشكل |
| P1 | إضافة integration test للـ provider والadapter | يمنع وجود engine صحيح وwiring مكسور |
| P1 | إضافة observability للـ mutations والrounds | تجعل مشكلة “الزر لا يعمل” قابلة للتشخيص فورًا |
| P1 | اختبار refresh/reconnect/Leave/duplicate click | هذه أكثر الحالات التي تكسر Multiplayer |
| P2 | تنظيف النصوص المشوهة والـ encoding | يحسن الجودة، لكنه ليس blocker منطقيًا |
| P2 | تحسين الشكل والحركة | بعد تثبيت السلوك، وليس قبله |

## 7. الحكم النهائي

المشروع لم يكن فاشلًا، لكنه كان يعاني من مشكلة هندسية أساسية: **الطبقات لم تكن دائمًا مرتبطة بعقد واحد قابل للإثبات**. كان يوجد أحيانًا engine صحيح بدون UI wiring، أو UI صحيح بدون Firebase mutation، أو source معدل بدون runtime verification، أو runtime قديم من نسخة مشروع مختلفة.

أفضل تحسين من الآن فصاعدًا هو تحويل المشروع من أسلوب “نصلح المشكلة التي تظهر” إلى أسلوب **release-gated engineering**: كل تغيير يبدأ بعقد محمي، وroot cause مثبت، وpatch صغير، واختبار regression، ثم build، ثم runtime، ثم أربعة Clients، ثم قرار release.

لو كنت مكانك، لن أبدأ من الصفر ولن أغير نظام اللعب الحالي. سأحتفظ بالـ engine الحالي، وأثبت بيئة Windows، وأبني integration/live verification فوقه. إعادة البناء الكامل الآن ستعيد نفس مشاكل تكرار المسارات وفقدان الأدلة، بينما المشكلة الأكبر الحالية ليست أن فكرة 2v2 ناقصة، بل أن التشغيل الحي لم يُثبت بعد بطريقة مستقلة وقابلة للتكرار.

## الخلاصة العملية

**الكود يمكن تحسينه، وقد تم إصلاح معظم العيوب source-level. طريقة العمل تحتاج إلى تقليل التكرار وزيادة الاختبارات التكاملية. الـ skills تحتاج إلى orchestrator واحد يحدد المسؤوليات. والبيئة تحتاج إلى Native Windows clean run.**

الخطوة الصحيحة التالية ليست feature جديدة؛ بل تشغيل النسخة النشطة من Windows بشكل نظيف، تنفيذ `test:team-battle` و`build`، ثم اختبار أربعة لاعبين على Firebase الحقيقي وتسجيل النتيجة خطوة بخطوة.
