# تقرير تطبيق قالب 2v2 على شاشة 1v1

## النتيجة

تم تطبيق اتجاه **Reference transfer** على شاشة 1v1 في `src/pages/LobbyPage.jsx`. أصبحت شاشة 1v1 تستخدم نفس لغة الشاشة الظاهرة في المرجع: عنوان حالة علوي، عنوان كبير للـmode، surface واحدة لإعداد الغرفة، هوية mode مختصرة، ثم مسار واضح لـCreate Room وJoin Room.

## التغييرات المرئية

| المرجع 2v2 | النسخة 1v1 |
|---|---|
| `ISOLATED MULTIPLAYER MODE · idle` | نفس الإشارة مع سياق 1v1 |
| `2v2 TEAM BATTLE` | `1V1 GUESS WHO` |
| `PLAY WITH FOUR` | `PLAY WITH ONE RIVAL` |
| `FOUR PLAYER MODE` | `1V1 DUEL MODE` |
| `Four connected players` | `Two players` |
| `SELECT AN ENTRY ROUTE` | نفس label فوق Create/Join |
| squad/team copy | rival/duel copy |

تمت إزالة hero بطاقة 1v1 الكبيرة المكررة من داخل الـlobby حتى لا تظهر شاشة تعريفية قبل نموذج الغرفة. نموذج الاسم، category، room code، Create، Join، حالة loading، وroom-created state بقيت في نفس البنية الحالية.

## الحماية الوظيفية

لم تتغير `handleCreateRoom` أو `handleJoinRoom` أو `handleStartGame`. كما بقيت استدعاءات `actions.createRoom` و`actions.joinRoom` و`actions.startGame` و`actions.setMode` و`actions.setCategory` موجودة كما هي. لم تتغير Firebase reads/writes/transactions/listeners أو routes أو effects أو room lifecycle أو scoring أو rounds أو target privacy.

**الحكم الدستوري: NO CONSTITUTION CHANGE.**

## مراجعة الحركة

التعديل لم يضف animation جديدة. الـtransition المستخدم في rail Create/Join كان موجودًا مسبقًا، لذلك لا يوجد motion diff جديد يحتاج إلى block. لا توجد تغييرات في callbacks أو state لدعم الشكل.

| البوابة | الحالة | الدليل |
|---|---|---|
| Reference mapping | SOURCE VERIFIED | النصوص الجديدة موجودة في `LobbyPage.jsx` داخل render الخاص بالـ1v1 |
| Protected callback trace | SOURCE VERIFIED | create/join/start/mode/category paths ما زالت موجودة |
| Firebase/gameplay unchanged | SOURCE VERIFIED | التغيير محصور في JSX classes/copy/render presentation branches |
| Motion review | APPROVE / NO NEW MOTION | لم تتم إضافة حركة؛ transitions الحالية بقيت كما كانت |
| Mobile runtime at 320–390px | NOT VERIFIED | المعاينة المتصلة لم تُنفذ بنجاح بسبب تأخر جلسة المتصفح |
| Build | NOT VERIFIED | بيئة Windows السابقة أنهت Node/Vite دون output usable، لذلك لا أعتبر ذلك نجاحًا |

## حالة الإصدار

الحالة **CONDITIONAL** وليست READY حتى يتم فتح `/one-v-one` فعليًا على 320px و360px و390px، واختبار Create وJoin والـfocus والـdisabled/loading، ثم تشغيل `npm run build` بناتج واضح.
