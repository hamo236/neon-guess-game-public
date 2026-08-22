# تقرير ما قبل تنفيذ 2v2 Team Battle

**المشروع:** NEON GUESS  
**نوع التقرير:** Pre-Execution Diagnosis & Implementation Plan  
**الحالة:** لا يوجد تعديل كود جديد في هذه المرحلة؛ التقرير ينتظر موافقة التصميم قبل التنفيذ.  
**المؤلف:** Manus AI  
**التاريخ:** 19 أغسطس 2026

## 1. الملخص التنفيذي

المشكلة ليست أن 2v2 غير موجود تمامًا، وليست مشكلة واجهة فقط. التحقيق أثبت وجود مسار Team Battle منفصل وحقيقي، لكنه مخفي نسبيًا داخل تجربة المنتج، ويحتوي على عيب Firebase يمنع إنشاء الغرفة أو الانضمام إليها، كما أن منطق اللعب الحالي لا يطابق بالكامل تجربة 2v2 المطلوبة: اللاعبان في الفريق نفسه لا يحصلان حاليًا على هدف مشترك، بل تُنشأ أهداف خاصة لكل لاعب.

القرار الآمن هو عدم إعادة بناء Multiplayer من الصفر. الأفضل هو إصلاح طبقة Firebase أولًا، ثم جعل 2v2 وضعًا مرئيًا ومميزًا داخل Lobby، ثم توحيد منطق توزيع الفرق والأهداف على مستوى authoritative state، ثم بناء واجهة غرفة واضحة تعرض المقاعد والفريقين وحالة الجاهزية. لن يتم تنفيذ أي تعديل في هذه المرحلة قبل اعتماد قرارات التصميم المحددة في القسم الأخير.

## 2. ما الذي تم إثباته من الكود الحالي

| المجال | الدليل الحالي | النتيجة العملية |
|---|---|---|
| وجود المسار | يوجد route مستقل `/team-battle` يركّب `CompetitiveModeProvider` مع `TEAM_BATTLE` | 2v2 موجود كمسار، لكنه ليس جزءًا واضحًا من اختيار الوضع الرئيسي |
| واجهة الوصول | Lobby تعرض بطاقتي `4-PLAYER TOURNAMENT` و`2v2 TEAM BATTLE`، بينما اختيار Game Mode الأساسي يحتوي `1v1` و`3-4 (Impostor)` فقط | المستخدم قد لا يربط بين الاختيار الرئيسي وTeam Battle |
| التنقل على الهاتف | BottomNavBar تعرض Lobby وGame وStats وModes، وModes تذهب إلى `/tournament` فقط | 2v2 لا يظهر مباشرة في التنقل الأساسي للموبايل |
| غرفة Team Battle | `competitiveFirebase.js` يستخدم namespace منفصل `teamRooms` وحد أقصى أربعة لاعبين | يوجد backend مستقل، لكنه لا يعمل حاليًا بسبب خطأ reference API |
| توزيع اللاعبين | `CompetitiveModeContext` يرتب اللاعبين حسب `joinOrder` قبل إنشاء الحالة | الأساس جيد، ويجب الحفاظ عليه عند توحيد فرق 2v2 |
| توزيع الأهداف | `targetMapForPlayers` يولد هدفًا مختلفًا لكل playerId | هذا لا يطابق المطلوب: كل فريق يجب أن يشارك هدفًا واحدًا |
| التخمين | `recordGuess` يتحقق من هدف الفريق المنافس، ويسجل التخمين لكل لاعب | يمكن الحفاظ على الفكرة، مع تغيير مصدر الهدف إلى هدف الفريق المنافس المشترك |
| الجولات | Team Battle engine يدعم ثلاث جولات، scoring، round result، rewards، وfinal result | لا نحتاج محركًا جديدًا؛ نحتاج تصحيح contract الأهداف والواجهة |

## 3. سبب ظهور الخطأ `db._checkNotDeleted is not a function`

الموضع الأخطر المؤكد موجود في `src/firebase/competitiveFirebase.js` داخل `privateTargetRef`.

الكود الحالي ينشئ مرجع الغرفة بالطريقة الصحيحة:

```js
const target = roomRef(mode, roomId);
```

لكن عند النزول إلى مسار فرعي يستخدم:

```js
ref(target, `private/${playerId}/${matchId}/target`)
```

المشروع يستخدم Firebase Modular SDK `firebase@^12.17.1`. العقد الموثق للـ modular API يفرق بين إنشاء reference من `Database` باستخدام `ref(database, path)` وبين إنشاء child reference من `DatabaseReference` باستخدام `child(parentReference, path)`. التوثيق الرسمي يعرض صراحة استخدام `child(dbRef, path)` عند النزول إلى child node [1] [2].

لذلك فإن الخطأ الذي ظهر عند محاولة إنشاء أو استخدام غرفة Team Battle متوافق مباشرة مع تمرير `DatabaseReference` إلى `ref` في مكان يجب فيه استخدام `child`. هذا هو root cause الأول الذي يجب إصلاحه قبل أي اختبار Multiplayer حقيقي.

### الإصلاح المقترح

```js
import { child, runTransaction, set } from 'firebase/database';

function privateTargetRef(mode, roomId, matchId, playerId) {
  const target = roomRef(mode, roomId);
  return target ? child(target, `private/${playerId}/${matchId}/target`) : null;
}
```

هذا الإصلاح لا يغير namespace أو schema أو rules أو صلاحيات الغرفة؛ هو تصحيح لاستخدام API فقط.

## 4. لماذا لا يجد المستخدم 2v2

هناك فجوة اكتشاف واضحة في Information Architecture.

على سطح Desktop يوجد رابط مباشر في NavigationDrawer، كما أن Lobby تحتوي بطاقة انتقال. لكن الوضع لا يظهر كخيار حقيقي داخل Game Mode selector الرئيسي؛ الاختيار الأساسي يعرض 1v1 وSocial فقط. وعلى الهاتف، BottomNavBar تعرض عنصر Modes الذي يذهب إلى Tournament، ولا تعرض Team Battle كوجهة مستقلة. كذلك عند دخول `/team-battle` يتغير shell إلى `ISOLATED MULTIPLAYER MODE` وتختفي الـ global navigation، ما يجعل المسار يبدو كأنه شاشة تجريبية منفصلة بدل كونه وضعًا أساسيًا في اللعبة.

الخلاصة: المستخدم لا يفشل في العثور على ميزة مكتملة؛ هو يواجه ميزة حقيقية لكنها موضوعة في مسار منفصل، باسم عام، وبـ discoverability ضعيف، ثم تصطدم بعطل Firebase عند أول عملية فعلية.

## 5. الفجوة بين 2v2 الحالي والمطلوب

### 5.1 المطلوب المنتجّي

التجربة المطلوبة هي أن يرى اللاعب وضعًا واضحًا باسم **2v2 TEAM BATTLE** داخل Lobby، مع صورة/بطاقة مميزة، وصف مختصر، ونداء فعل مباشر مثل **PLAY 2v2**. بعد ذلك ينشئ المضيف غرفة، يشارك الكود، ويدخل ثلاثة لاعبين آخرين إلى نفس lobby. عندما يصبح العدد أربعة، يبدأ المضيف أو يبدأ النظام تلقائيًا وفق القرار المعتمد.

يجب أن يرى اللاعبون غرفة بأربع مقاعد وفريقين واضحين. يجب أن يكون تعيين الفرق deterministic وقابلًا لإعادة البناء بعد reconnect، ويجب أن يظهر لكل فريق هدف واحد مشترك. كل فريق يحاول تخمين هدف الفريق الآخر، وأي لاعب من الفريق يمكنه تسجيل التخمين وفق قواعد الجولة. بعد انتهاء الجولة، يعالج المضيف أو المسار authoritative النتيجة مرة واحدة، ثم ينتقل الجميع معًا إلى الجولة التالية.

### 5.2 الموجود حاليًا

المحرك الحالي ينشئ فريقين من أربعة لاعبين، لكنه يضع أول لاعبين في Team A والاثنين التاليين في Team B، ثم يوزع هدفًا خاصًا لكل playerId. واجهة اللعب تعرض `YOUR SECRET TARGET`، وهو نص يصف هدفًا خاصًا للاعب، وليس هدفًا مشتركًا للفريق. هذا يفسر لماذا قد يبدو 2v2 الحالي غير مطابق لفكرة الفريقين حتى لو تم إصلاح خطأ Firebase.

## 6. خطة التنفيذ المقترحة على مراحل

| المرحلة | نطاق التنفيذ | بوابة القبول |
|---|---|---|
| A. Firebase unblock | استبدال nested `ref` بـ `child` في adapter، وإضافة smoke assertion تمنع العودة | إنشاء/انضمام room لا يرمي `_checkNotDeleted` في اختبار API أو Emulator |
| B. First-class discovery | استبدال بطاقة Competitive Circuits الحالية ببطاقة 2v2 مميزة، وإضافة وصول واضح على الموبايل، مع إبقاء Tournament في مكان ثانوي واضح بدل إخفائه | اللاعب يصل إلى 2v2 من Lobby خلال نقرة واحدة على Desktop وMobile |
| C. Room UX | غرفة 2v2 تعرض 4 مقاعد، Team A/B، code، share، waiting state، وstart state | كل لاعب يرى نفس room readiness ولا توجد أزرار مضللة |
| D. Shared-team target contract | إضافة خريطة أهداف على مستوى الفريق، بحيث يحصل كل لاعبي Team A على هدف Team B والعكس، مع private writes لكل لاعب تحمل نفس targetId | هدف اللاعبَين داخل الفريق متطابق، وهدف الفريقين مختلف، ولا ينكشف target للخصم |
| E. Round authority | الحفاظ على host-authoritative transition أو إضافة idempotency guard، وتوحيد `resolveTeamRound` و`advanceTeam` حول shared targets | round 1→2→3 يحدث مرة واحدة للجميع، ولا تتكرر rewards أو transitions |
| F. QA and release | smoke، build، route probe، Emulator/Firebase أربعة عملاء، reconnect، لاعب خامس، duplicate start/guess، وresponsive browser check | لا إعلان READY قبل نجاح build وlive multiplayer matrix |

## 7. قرار تعيين الفرق المقترح

لمنع الالتباس يجب اعتماد قاعدة واحدة ومعلنة. الاقتراح الافتراضي الآمن هو:

> يتم ترتيب اللاعبين حسب `joinOrder` authoritative، ثم Team A يأخذ المقعدين 1 و2، وTeam B يأخذ المقعدين 3 و4.

هذا أبسط للمستخدم وللتنفيذ، ويمكن عرضه في Team Slot Preview. إذا كان المقصود الحرفي من المثال هو أن Team A = اللاعب 1 واللاعب 4، وTeam B = اللاعب 2 واللاعب 3، فهذا قرار تصميم مختلف ويجب اعتماده صراحة قبل التنفيذ؛ لا ينبغي استنتاجه تلقائيًا من مثال وصفي لأنه يغير preview والـ engine والـ target mapping.

## 8. التشغيل التلقائي أم Start by Host

يوجد خياران صالحان:

| الخيار | المزايا | المخاطر |
|---|---|---|
| Host presses Start | واضح، يعطي المضيف تحكمًا، وأسهل للـ QA | قد يتوقف lobby إذا غادر المضيف |
| Auto-start at 4/4 | سريع ومناسب للموبايل | يحتاج transaction/idempotency guard حتى لا يبدأ مرتين أثناء تزامن أربعة عملاء |

التوصية للـ MVP هي **Host presses Start** مع زر disabled حتى 4/4، ثم إضافة auto-start لاحقًا بعد نجاح الاختبار الحي. هذا يقلل خطر السباقات ولا يمنع أي تجربة مستقبلية.

## 9. الأخطاء السابقة وكيف نتجنبها

أول خطأ كان توسيع UI قبل تثبيت Firebase runtime contract. النتيجة كانت واجهة تشير إلى 2v2 بينما أول action حقيقي يفشل. القاعدة الجديدة: لا نعتبر mode موجودًا إلا بعد اختبار create/join/start من طبقة Firebase.

الخطأ الثاني هو اعتبار وجود route وHTTP 200 دليلًا على اكتمال Multiplayer. route probe يثبت SPA shell فقط، ولا يثبت room writes أو private targets أو reconnect. لذلك يجب فصل Evidence labels إلى `SOURCE VERIFIED` و`SHELL VERIFIED` و`LIVE MULTIPLAYER VERIFIED`.

الخطأ الثالث هو توزيع الهدف لكل لاعب مع وصف UI يوحي بالتجربة الجماعية. يجب أن يكون target contract مكتوبًا في engine tests قبل تعديل TargetCard.

الخطأ الرابع هو الاعتماد على ترتيب `Object.values(players)`؛ تم علاج هذا جزئيًا بإضافة `joinOrder`. يجب ألا نعود إلى ترتيب المفاتيح في أي consumer أو preview.

الخطأ الخامس هو وضع Team Battle بعيدًا عن mobile navigation. يجب أن يكون 2v2 visible من Lobby ومن مسار mobile واضح، مع عدم استخدام `/tournament` كبديل غامض.

## 10. Acceptance Criteria قبل إعلان 2v2 مكتملًا

لن نعلن 2v2 مكتملًا قبل تحقيق كل ما يلي:

1. بطاقة 2v2 ظاهرة في Lobby باسم واضح وصورة/visual identity مميزة.
2. زر 2v2 يصل إلى room lobby الصحيح من Desktop وMobile.
3. create room وjoin room يعملان بدون `db._checkNotDeleted`.
4. الغرفة تقبل أربعة لاعبين فقط، وتمنع الخامس برسالة مفهومة.
5. تعيين الفرق ثابت بعد reconnect ومبني على `joinOrder`.
6. كل فريق يحصل على targetId واحد مشترك، والفريق الآخر يحصل على targetId مختلف.
7. target الخاص بالفريق لا يصل إلى الخصم عبر public state أو private path غير صحيح.
8. المضيف يبدأ المباراة مرة واحدة فقط عند 4/4.
9. التخمين يسجل مرة واحدة لكل لاعب أو وفق rule معتمدة، والنتيجة authoritative.
10. الجولات الثلاث والانتقال والـ rewards تعمل بلا duplicate transition.
11. smoke وbuild وroute probe تنجح، ثم ينجح اختبار Firebase حي بأربعة عملاء.
12. responsive/browser check يثبت أن room UI مفهوم على الهاتف، مع touch targets وfocus states وreduced-motion.

## 11. نقاط الموافقة المطلوبة قبل التنفيذ

أحتاج اعتماد قرارين فقط قبل بدء الكود:

**أولًا:** هل نعتمد التوزيع الافتراضي Team A = joinOrder 1 و2، وTeam B = 3 و4، أم نطبق المثال الحرفي Team A = 1 و4 وTeam B = 2 و3؟

**ثانيًا:** هل يبدأ اللعب بزر المضيف عند اكتمال 4/4 في MVP الأول، أم تريد auto-start؟ التوصية الهندسية هي زر المضيف أولًا.

بعد اعتماد هذين القرارين، تكون دفعة التنفيذ الأولى محددة: إصلاح Firebase، ثم إظهار بطاقة 2v2، ثم shared-target contract، ثم room UX والاختبارات. لن يتم تعديل الكود قبل هذه الموافقة.

## المراجع

[1]: https://firebase.google.com/docs/database/web/read-and-write "Firebase — Read and Write Data on the Web"

[2]: https://modularfirebase.web.app/reference/database/ "Firebase Modular JavaScript SDK Database Reference"
