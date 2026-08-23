# تقرير استراتيجية تسريع NEON GUESS بدون تقليل الإضافات أو دقة اللعب

**نوع التقرير:** بحث وتحليل فقط — لا توجد تعديلات أو إضافات تنفيذية في هذه الدورة.

## الخلاصة التنفيذية

يمكن جعل NEON GUESS أسرع وأكثر سلاسة من غير حذف Voice Room أو Four أو 2v2 أو المؤثرات الأساسية أو تغيير قواعد اللعب. الاتجاه الصحيح ليس تقليل المحتوى، بل تقليل العمل غير الضروري الذي يقوم به المتصفح أثناء التحميل والحركة والتفاعل.

السرعة لها ثلاثة أجزاء مختلفة:

| الجزء | معناه | ما يجب فعله |
|---|---|---|
| سرعة الفتح | الوقت من فتح الرابط حتى ظهور الشاشة | تحميل ما يلزم للشاشة الحالية أولًا، وتأجيل غير الضروري |
| سرعة التفاعل | سرعة استجابة الزر والـJoin والـGuess | تقليل إعادة التصيير والعمل داخل event handlers |
| سلاسة الحركة | ثبات الإطارات أثناء التمرير والانتقالات | تقليل paint وlayout وblur وshadow، واستخدام transform وopacity |

لا يوجد سبب هندسي لتقليل دقة اللعبة. **الدقة والـauthoritative state تبقى في Firebase والـcontexts والـgame engines، بينما التحسين يكون في طريقة العرض، جدولة العمل، الصور، الاشتراكات، والـCSS.**

## الوضع الذي نعرفه عن المشروع

من الفحوص السابقة للمشروع ظهر أن:

| القياس | القيمة السابقة | معناه |
|---|---:|---|
| Main JavaScript asset | 639,427 bytes | ليس صغيرًا جدًا، ويستحق code splitting وفحص imports |
| أكبر lazy gameplay chunk | 87,685 bytes | قابل للتحسين لاحقًا إذا ثبت أنه يؤثر في route startup |
| CSS asset | نحو 159 KB | تحسين الحجم ممكن، لكن الشكوى الحالية أقرب إلى الرسم من الحجم فقط |
| DOM في Tournament Lobby | 75 عنصرًا | ليس رقمًا ضخمًا، لذلك لا يكفي وحده لتفسير الثقل |
| Long Tasks في التحميل المحلي الأول | 0 مسجلة | لا يثبت أن كل الحركة سريعة؛ يوجه التحقيق إلى paint أو rerender أثناء التفاعل |
| visual-effect elements في السطح المفحوص | 6 | blur وshadow المتراكمان قد يظهر أثرهما على الهاتف |

هذه قياسات محلية وليست قياسًا ميدانيًا على هاتف المستخدم. لذلك لا يصح اختراع نسبة تحسن قبل تسجيل Production Performance على جهاز بطيء أو مع CPU throttling.

## أهم الأسباب المحتملة للثقل

### 1. تكلفة الرسم البصري

تأثيرات `backdrop-filter: blur`، والـglow، والـbox-shadow الكبيرة، والطبقات الشفافة تعطي هوية neon جيدة، لكنها قد تجعل كل إطار أغلى، خصوصًا عندما تتراكب مع Voice Room ثابتة أو Panels كثيرة.

التحسين الصحيح هو تقليل مساحة وعدد العناصر التي تستخدم هذه التأثيرات، لا حذف التصميم. يمكن إبقاء glow الرئيسي في العناوين والأزرار المهمة، واستبدال التأثيرات المتكررة في كل بطاقة بلون شفاف أو gradient ثابت.

### 2. حركات تسبب Layout أو Paint

الحركة على `top`, `left`, `width`, `height`, `margin`, أو `filter` قد تسبب layout أو paint متكررًا. الأفضل أن تكون حركة الظهور والانتقال على `transform` و`opacity` فقط. هذا يتفق مع شرح web.dev لمسار البكسل: JavaScript ثم Style ثم Layout ثم Paint ثم Composite؛ وكلما أمكن الوصول إلى Composite فقط كانت الحركة أرخص [2].

### 3. إعادة تصيير واسعة في React

أي state يتغير في component كبير قد يعيد تصيير شجرة أكبر من اللازم. هذا مهم في شاشة اللعب لأن Firebase وtimer وvoice presence قد تتغير بالتزامن.

الحل ليس وضع `useMemo` و`memo` في كل مكان. توصي React بالقياس أولًا، ثم استخدام memoization عندما تكون العملية مكلفة فعلًا أو عندما يمرر component memoized قيمة مستقرة [1]. الأولوية هي فصل state المحلي عن state العام، وتقسيم الشاشة إلى مناطق مستقلة، ومنع انتقال object/function جديد بلا حاجة.

### 4. Listeners أوسع من المطلوب

إذا كان listener يستمع إلى room كاملة بدل مسار match أو round أو voice scope المطلوب، فقد يسبب قراءات وتحديثات وإعادة تصيير كثيرة. توصي Firebase بوضع listeners في أعمق مسار ممكن، وإزالتها عندما لا تعود ضرورية، واستخدام queries تحد القراءة [4].

هذا لا يعني تغيير Firebase schema أو اللعب الآن. يعني فقط في مرحلة التنفيذ المستقبلية فحص كل listener، وتوثيق مالكه ودورة حياته، والتأكد من أن listener الخاص بالـvoice لا يعيد تصيير GameBoard، وأن listener الخاص بالـchat لا يعيد بناء Tournament bracket.

### 5. الصور والأصول

الصور الكبيرة أو غير المضغوطة قد تجعل الإحساس بالسرعة ضعيفًا حتى لو كان JavaScript سريعًا. المطلوب ليس تقليل عدد الشخصيات أو الفئات، بل:

| المشكلة | الحل الآمن |
|---|---|
| صورة أكبر من مساحة عرضها | توليد نسخ بأحجام مناسبة واستخدام `srcset` أو `sizes` |
| PNG لصورة فوتوغرافية | استخدام WebP أو AVIF عند دعم المسار مع fallback |
| صور خارج الشاشة تحمل مبكرًا | `loading="lazy"` للصور غير الظاهرة أولًا |
| صورة بدون أبعاد ثابتة | تحديد `width` و`height` أو `aspect-ratio` لمنع layout shift |
| إعادة تحميل الصورة | الحفاظ على URL ثابت وcache headers مناسبة |

لا ينبغي ضغط الصور إلى درجة تقلل وضوح Target؛ يتم ضبط الجودة حسب مساحة العرض الفعلية، مع الاحتفاظ بالأصل عند الحاجة.

### 6. Bundle وبدء التشغيل

الـmain bundle السابق حوالي 639 KB، لذلك يجب تحليل dependency graph قبل حذف أي مكتبة. التحسينات الآمنة المحتملة هي lazy loading لمسارات لا يحتاجها المستخدم في أول شاشة، مثل Tournament وVoice UI عند الحاجة فقط، والتأكد من أن مكتبة مستخدمة في route واحد لا تدخل Home bundle.

لا يجب تقسيم `gameEngine`, أو `roomManager`, أو contracts المشتركة بطريقة تؤدي إلى نسختين من نفس المنطق. الهدف هو تقليل وقت تحميل route، وليس نقل core إلى تحميل متأخر يسبب تأخيرًا عند بدء الجولة.

### 7. Timer وanimation loops

الـcountdown والـvoice indicators والـpresence قد تستخدم timers. يجب التأكد أن كل timer يُغلق عند unmount، وأنه لا يوجد timer لكل بطاقة أو لكل لاعب عندما يكفي timer واحد للمرحلة الحالية.

لا يجب تغيير توقيت اللعبة أو مدة كشف الخمسة ثوانٍ. التحسين يكون في طريقة رسم countdown، مثل تحديث عنصر واحد أو استخدام CSS animation للحركة البصرية، مع بقاء authoritative transition في state الحالي.

## الخطة المقترحة قبل أي تنفيذ

### المرحلة الأولى: القياس الحقيقي

يتم تسجيل Production build على Chrome Desktop وAndroid متوسط مع CPU throttling، في أربع سيناريوهات ثابتة: فتح Home، دخول Lobby، الانتقال إلى GameBoard، والحركة أثناء Voice Room أو countdown. يتم حفظ trace لكل سيناريو.

المقاييس الأساسية هي LCP للتحميل، INP للتفاعل، CLS للثبات، عدد dropped frames أثناء gesture، مدة React render، ووقت Paint/Layout/Composite. تعتبر INP عند 200ms أو أقل جيدة، بينما 200–500ms تحتاج تحسينًا وأكثر من 500ms ضعيفة عند percentile 75 [3].

### المرحلة الثانية: فصل نوع المشكلة

| إذا ظهر في trace | الأولوية |
|---|---|
| Long Task JavaScript | فحص handlers وeffects والحسابات وdependency imports |
| React render طويل | Profiler وReact Performance tracks لتحديد component والـprops المتغيرة |
| Paint/Composite طويل | blur وshadow وfilter وطبقات الشفافية والحركة |
| Layout متكرر | قياسات DOM أثناء الحركة أو خصائص top/left/height |
| Network بطيء | الصور، lazy chunks، cache، وحجم Firebase reads |
| Firebase updates كثيرة | listener scope، unsubscribe، duplicate subscriptions |

React Performance tracks تعرض update وrender وcommit وeffects على Timeline، لكنها متاحة في development أو profiling builds، وليس production العادي [5]. لذلك نقيس production لسلوك المستخدم، ونستخدم profiling build لتحديد component المسؤول، مع عدم نشر profiling build للمستخدمين.

### المرحلة الثالثة: تحسينات آمنة مرتبة

1. تقليل تكلفة blur وshadow في الأسطح المتكررة، مع إبقاء الهوية البصرية في العناصر المهمة.
2. تحويل الحركات المتبقية إلى `transform` و`opacity` فقط حيث لا يغير ذلك الإحساس أو الوظيفة.
3. تثبيت أبعاد الصور وتحسين formats وlazy loading خارج الشاشة.
4. فصل الـVoice Room والـchat والـpresence عن إعادة تصيير لوحة اللعب عندما لا تتغير بيانات اللعب.
5. ضبط listeners وإغلاقها عند navigation أو خروج room، من غير تغيير paths أو authority.
6. lazy-load للمسارات الثقيلة، مع preload فقط للمسار المتوقع بعد اختيار المستخدم.
7. إضافة performance budgets تمنع تضخم JS/CSS والصور في المستقبل.

### المرحلة الرابعة: التحقق بعد كل تغيير

كل تغيير يجب أن يمر بهذه البوابة:

| البوابة | المطلوب |
|---|---|
| Gameplay | نفس rounds والـscoring والـtarget privacy والـbracket |
| Multiplayer | نفس room join وrefresh وreconnect وLeave |
| Voice | استمرار lifecycle وعدم فصل المكالمة عند تغيير الجولة |
| Visual | نفس الهوية والوضوح والـtouch targets |
| Performance | trace أفضل أو تكلفة أقل مثبتة |
| Release | build وtests وroute smoke وdesktop/mobile review |

إذا تحسن رقم واحد وساء INP أو ظهرت مشكلة في Firebase، يتم رفض التغيير. **لا توجد فائدة من موقع أسرع إذا أصبحت نتيجة اللعبة غير دقيقة أو انقطعت المكالمة.**

## أشياء لا أنصح بها

لا أنصح بحذف animations كلها، أو إزالة Voice Room، أو تقليل جودة صور Targets بشكل واضح، أو تعطيل Firebase listeners عشوائيًا، أو إضافة `will-change` إلى كل العناصر، أو وضع `useMemo` في كل component، أو تحويل كل شيء إلى global cache، أو تغيير game engine من أجل تحسين بصري.

تحذر MDN من استخدام `will-change` كحل عام؛ وضعه على عناصر كثيرة قد يزيد استهلاك الذاكرة وكلفة compositing [6]. كما تؤكد React أن `useMemo` optimization وليست ضمانًا للصحة، ولا ينبغي أن تكون بديلًا عن إصلاح سبب إعادة التصيير [1].

## القرار الهندسي المقترح

أفضل اتجاه لـNEON GUESS هو **Performance without feature loss**:

> نحافظ على كل المحتوى والإضافات، ونقلل العمل الذي لا يراه اللاعب أو لا يحتاجه في اللحظة الحالية.

الترتيب الأفضل هو: القياس، ثم إصلاح paint، ثم إصلاح React render، ثم listener scope، ثم الصور والـbundle. لا نبدأ بتغيير Firebase أو game core لأن الشكوى الحالية تتعلق بالسلاسة، ولأن القياسات السابقة أشارت إلى تكلفة رسم محتملة أكثر من خطأ في منطق اللعبة.

## ما الذي يمكن اعتباره نجاحًا؟

لا نستخدم عبارة “سريع جدًا” دون رقم. معيار النجاح المقترح هو:

- INP ميداني لا يتجاوز 200ms في التفاعل الأساسي عند percentile 75.
- عدم وجود jank واضح أثناء التمرير أو فتح Voice Room على هاتف متوسط.
- انخفاض dropped frames في نفس trace قبل/بعد.
- عدم زيادة LCP أو CLS بسبب التحسين.
- عدم تغير bundle أو network downloads سلبًا دون سبب مقبول.
- مرور جميع اختبارات gameplay وFirebase وvoice وFour/Tournament.

الأرقام الدقيقة baseline/after يجب تسجيلها من نفس الجهاز ونفس السيناريو، لأن نتيجة sandbox لا تمثل كل الهواتف.

## الخلاصة للمستخدم

الموقع لا يحتاج حذف إضافاته. نحتاج أن نجعل كل شاشة تحمل فقط ما تحتاجه، وأن نمنع الأجزاء غير المتغيرة من إعادة الرسم، وأن نقلل تكلفة الـblur والـglow، وأن نحرك العناصر بطريقة يفهمها المتصفح بكفاءة، وأن نقرأ من Firebase المسار المطلوب فقط، وأن نحسن الصور والـchunks دون المساس بجودة Target.

هذه دورة معلومات فقط. **لم يتم تعديل أو إضافة أي شيء بناءً على هذا التقرير.**

## References

[1] [React — useMemo](https://react.dev/reference/react/useMemo)

[2] [web.dev — Rendering performance](https://web.dev/articles/rendering-performance)

[3] [web.dev — Interaction to Next Paint (INP)](https://web.dev/articles/inp)

[4] [Firebase — Optimize Database Performance](https://firebase.google.com/docs/database/usage/optimize)

[5] [React — Performance tracks](https://react.dev/reference/dev-tools/react-performance-tracks)

[6] [MDN — will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/will-change)
