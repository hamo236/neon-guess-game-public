# Prompt تنفيذ احترافي — إضافة Voice Room إلى NEON GUESS

انسخ النص التالي كاملًا وأرسله إلى AI المنفذ:

---

أنت الآن تعمل كمهندس برمجيات Senior ومسؤول عن تنفيذ ميزة صوتية داخل مشروع **NEON GUESS**. استخدم مهارات:

- `autonomous-bug-to-engineering`
- `neon-guess-developer-mind`
- `neon-guess-master-engineering`
- `neon-guess-firebase-engineering`
- `neon-guess-autonomous-production-debugger`
- `neon-guess-visual-evolution-orchestrator`
- `review-animations`

المطلوب هو **تنفيذ Voice Room صوتي حقيقي داخل الموقع**، وليس مجرد واجهة شكلية أو زر Mute لا ينقل الصوت. يجب أن يسمع اللاعبون بعضهم فعليًا عبر الإنترنت باستخدام WebRTC Audio، مع استخدام Firebase الحالي كقناة Signaling فقط لتبادل بيانات بدء الاتصال، وليس لنقل الصوت نفسه.

## 1. الهدف المنتجِي

أضف داخل شاشة اللعب، بجانب منطقة الـChat الحالية، لوحة صغيرة وأنيقة باسم **Voice Room**. يجب أن يستطيع اللاعب:

- الضغط على `Start Voice Call` لإنشاء مكالمة داخل سياق اللعب الحالي.
- رؤية حالة وجود مكالمة فعالة.
- الضغط على `Join Call` للانضمام إليها.
- السماح للمتصفح باستخدام الميكروفون بعد إجراء Start أو Join صريح فقط.
- التحدث وسماع الآخرين صوتيًا بعد الاتصال الحقيقي.
- الضغط على `Mute Microphone` لكتم صوته مع بقائه داخل المكالمة.
- الضغط على `Unmute Microphone` لإعادة إرسال صوته.
- الضغط على `Mute Incoming Audio` لكتم الأصوات التي يسمعها محليًا من دون مغادرة المكالمة.
- الضغط على `Leave Call` للخروج وإيقاف الميكروفون والاتصالات.
- رؤية أسماء المشاركين وحالتهم: Joined، Mic On، Mic Muted، Reconnecting، أو Left.

لا تجعل أي لاعب ينضم تلقائيًا إلى المكالمة، ولا تشغّل الميكروفون قبل موافقة المستخدم الصريحة من المتصفح.

## 2. قواعد كل Mode

### 1v1

تكون المكالمة متاحة للاعبين الموجودين في نفس Room، ويستطيع اللاعبان فقط الانضمام وسماع بعضهما. إذا بدأ أحدهما الاتصال، يظهر للآخر زر `Join Call`. اللاعب الذي لا يضغط Join لا يملك MediaStream فعالًا ولا يسمع الآخرين.

### 2v2 Team Battle

في 2v2، يجب أن تكون المكالمة المشتركة متاحة للأربعة المشاركين في نفس المباراة. إذا بدأ لاعب واحد المكالمة، يرى باقي اللاعبين الثلاثة الحالة وزر `Join Call`. بعد الانضمام يسمع كل لاعب المشاركين الآخرين الموجودين في المكالمة، وليس أعضاء فريقه فقط. اللاعب الذي لا ينضم لا يسمع شيئًا ولا يرسل ميكروفونًا.

### Four

في Four يجب ربط المكالمة بالمباراة الحالية، وليس بالغرفة العامة فقط. يجب تطبيق العزل الآتي حرفيًا:

- Semifinal A منفصل تمامًا عن Semifinal B.
- Final منفصل تمامًا عن Third Place.
- اللاعبون يسمعون فقط اللاعب أو اللاعبين الموجودين في نفس المباراة الحالية التي يلعبونها.
- عند انتقال اللاعبين من مرحلة إلى أخرى، تنتهي قناة المرحلة القديمة ويُنشأ سياق جديد.
- ممنوع أن يحمل Refresh أو transition أي اتصال صوتي قديم إلى مباراة جديدة.

لا تغيّر قواعد Four أو طريقة توزيع اللاعبين أو الـbracket؛ أضف طبقة الصوت فوقها فقط.

### Daily

لا تضف Voice Room إلى Daily في هذه المرحلة إلا إذا أثبت فحص المشروع أن هناك سياق Multiplayer واضحًا ومطلوبًا لها. إذا لم يكن ذلك مؤكدًا، اترك Daily كما هي وسجّل القرار في التقرير.

## 3. ممنوعات صارمة

قبل التعديل أنشئ Scope Lock:

```text
Target = Optional audio-only Voice Room beside existing chat.
Protected = All gameplay rules, scoring, rounds, target privacy, room ownership,
authentication, navigation, chat behavior, GameStateContext,
CompetitiveModeContext, match progression, bracket logic, Daily mode,
existing Firebase authority, and deployment behavior.
```

ممنوع منعًا باتًا:

- تغيير طريقة اللعب أو القواعد أو النقاط أو الجولات.
- تغيير مصدر الحقيقة authoritative state في Firebase.
- نقل منطق المباراة إلى Voice Room.
- استبدال GameStateContext أو CompetitiveModeContext.
- تغيير Room ownership أو Host migration.
- تغيير Target privacy أو player assignment.
- جعل Firebase ينقل الصوت أو تخزين Audio data فيه.
- إنشاء قراءة أو كتابة Firebase عامة لتسهيل التنفيذ.
- رفع `.env` أو Service Account أو private key أو أي secret إلى GitHub.
- إضافة Auto-Join أو تشغيل الميكروفون بلا إذن.
- الادعاء بأن المكالمة تعمل قبل اختبار الصوت الحقيقي.
- تنفيذ إعادة تصميم عامة للموقع خارج الجزء الخاص بالـVoice Room.

إذا احتجت تغييرًا في نظام محمي، توقف وسجّل السبب والأدلة قبل التنفيذ.

## 4. افحص المشروع أولًا قبل أي تعديل

لا تبدأ بكتابة الكود مباشرة. افحص:

1. `AGENTS.md` في المشروع والمجلدات الأب.
2. `package.json` وملفات Vite وGitHub Pages.
3. Firebase initialization وAnonymous Auth.
4. `database.rules.json`.
5. `src/context/GameStateContext.jsx`.
6. `src/context/CompetitiveModeContext.jsx`.
7. صفحات Lobby و1v1 و2v2 وFour وResults.
8. مكان الـChat الحالي ومكونات الرسائل.
9. كل منتج ومستهلك لـ`roomId` و`matchId` و`teamId` و`players` و`phase` و`round`.
10. كل مسارات Firebase الموجودة حاليًا.
11. أي تقارير في `docs/` و`evidence/`، وخصوصًا:
    - `docs/VOICE-ROOM-RESEARCH-AND-IMPLEMENTATION-PLAN.md`
    - `evidence/voice-room-research-findings.md`
    - `NEON_GUESS_ENGLISH_INTRODUCTION.md`
    - تقارير QA وFirebase وFour و2v2.

تتبع دورة البيانات الفعلية:

```text
User Action
→ UI Handler
→ Context/Store Action
→ Authoritative Room or Match State
→ Firebase Read/Write/Listener
→ State Merge
→ Rendered Screen
```

لا تفترض أسماء الملفات أو الحقول. استخدم الأسماء الموجودة فعليًا في المشروع.

قبل التعديل، اكتب تقريرًا داخليًا يحدد: ما الذي ستغيره، ولماذا، وما الذي لن تغيره، وما هو خطر التغيير، وكيف يمكن التراجع عنه.

## 5. التصميم الهندسي المطلوب

أنشئ Voice Room كـSidecar مستقل عن Gameplay. يجب أن يقرأ سياق الغرفة والمباراة من الحالة authoritative، لكنه لا يكتب أي نتيجة لعب أو نقاط أو انتقال مباراة.

أنشئ Adapter أو Pure Function تستخرج من الحالة الحالية:

```text
eligible
voiceScopeId
mode
roomId
matchId
teamId if applicable
permittedParticipantIds
scopeVersion
callInstanceId
```

القواعد:

- `voiceScopeId` يجب أن يكون مختلفًا بين Rooms ومباريات Four المختلفة.
- لا تعتمد على String يرسله العميل وحده كدليل صلاحية.
- يجب التحقق من العضوية من الحالة authoritative وقواعد Firebase.
- عند تغير scope أو match أو phase، أغلق الاتصال القديم قبل تشغيل الجديد.
- استخدم `callInstanceId` جديدًا لكل Start Call حتى لا تختلط بيانات اتصال قديم بحديث.

## 6. Local Voice State Machine

افصل حالة الصوت عن حالة اللعبة. استخدم حالات واضحة مثل:

```text
DISABLED
AVAILABLE
STARTING
JOINING
CONNECTED_MIC_ON
CONNECTED_MIC_MUTED
CONNECTED_LISTENING_MUTED
RECONNECTING
FAILED
ENDED
```

كل انتقال يجب أن يكون له سبب وتنظيف واضح. عالج على الأقل:

- Start Call.
- Join Call.
- Permission Granted.
- Permission Denied.
- Leave Call.
- Room Leave.
- Match End.
- Match Transition.
- Refresh.
- Component Unmount.
- Network Lost.
- Network Restored.
- ICE Failed.
- Remote Participant Left.

عند النهاية أو الفشل يجب:

- إغلاق كل `RTCPeerConnection`.
- إيقاف كل `MediaStreamTrack` محلي.
- إزالة Audio elements.
- إلغاء Firebase listeners.
- إلغاء timers.
- منع callbacks القديمة من تعديل Call جديد.
- تنظيف signaling data المؤقتة حسب قواعد المشروع.

## 7. WebRTC Implementation

استخدم Browser-native WebRTC Audio في MVP ما لم يثبت فحص المشروع أن هناك مانعًا حقيقيًا.

لكل Remote Participant أنشئ Peer Connection مستقلة. في 2v2 قد يصل كل مشارك إلى ثلاث اتصالات Peer-to-Peer، وهذا مقبول لأن حجم الغرفة أربعة فقط. لا تصمم Mesh عامة لأعداد كبيرة.

استخدم:

- `getUserMedia({ audio: true })` بعد Start أو Join فقط.
- `RTCPeerConnection`.
- `addTrack`.
- `ontrack`.
- `onicecandidate`.
- `onnegotiationneeded`.
- `connectionstatechange`.
- `iceconnectionstatechange`.
- `setLocalDescription` و`setRemoteDescription`.
- Trickle ICE.
- STUN configuration كبداية.

طبّق Perfect Negotiation أو طريقة deterministic مكافئة لكل زوج من اللاعبين. يجب أن يكون لكل Peer Pair دور `polite` و`impolite` ثابت، مثل UID ordering أو join ordering. لا تستخدم Caller عالميًا واحدًا لكل الغرفة.

عند ICE failure، اعرض Reconnecting وحاول ICE restart بطريقة محدودة. لا تدخل في Loop لا نهائي. بعد عدد محاولات محدد، اعرض Failed مع زر Retry من دون تعطيل اللعبة.

## 8. Firebase Signaling

Firebase ينقل signaling metadata فقط:

- Call presence.
- Call instance metadata.
- Offers.
- Answers.
- ICE candidates.
- Participant ephemeral state.

لا تخزن الصوت.

استخدم Namespace منفصلًا وواضحًا، مثل مفهوم:

```text
voiceCalls/{voiceScopeId}/{callInstanceId}/...
```

لكن لا تعتمد هذا المسار حرفيًا قبل فحص قواعد المشروع. يجب أن تتبع convention الحالي.

كل signaling record يجب أن يتحقق من:

- Firebase Auth identity.
- Room membership.
- Active match membership عند Four.
- `voiceScopeId`.
- `callInstanceId`.
- Sender وrecipient عند الحاجة.
- نوع وطول البيانات.
- انتهاء صلاحية البيانات القديمة.

استخدم push keys للـICE candidates بدل الكتابة فوق قيمة مشتركة. استخدم listeners للبيانات الجديدة فقط.

استخدم `onDisconnect` لتنظيف حضور اللاعب عند قطع الاتصال، لكن لا تعتمد عليه وحده؛ نفّذ cleanup عاديًا عند Leave وUnmount أيضًا.

لا تضف Rules عامة مثل `.read: true` أو `.write: true`. اختبر القراءة والكتابة المسموحة والمرفوضة، وراجع تأثير cascade في Firebase Rules.

## 9. واجهة المستخدم والتصميم

ضع Voice Room بجانب Chat في مكان صغير واضح، ولا تغطِّ:

- صورة الهدف.
- المؤقت.
- أزرار التخمين.
- نتيجة الجولة.
- أزرار التنقل المهمة.

استخدم حالات مرئية بسيطة:

```text
No call
Call available
Joining
Connected
Mic muted
Incoming audio muted
Reconnecting
Call ended
Permission denied
```

الأزرار المطلوبة:

```text
Start Voice Call
Join Call
Mute Microphone
Unmute Microphone
Mute Incoming Audio
Unmute Incoming Audio
Leave Call
Retry Connection
```

لا تستخدم حركة مبالغًا فيها. يجب أن تكون الحركة قصيرة وهادئة، وأن تحترم `prefers-reduced-motion`. الأزرار يجب أن تكون قابلة للوصول من لوحة المفاتيح، لها labels واضحة، وحالات focus مرئية.

لا تعرض مؤشر “يتكلم الآن” إلا إذا طُبّق Voice Activity Detection واختُبر فعلًا. في MVP اكتفِ بحالات Joined وMic On وMic Muted.

## 10. الأمان والخصوصية

الميكروفون لا يبدأ إلا بعد إجراء واضح من اللاعب وموافقة المتصفح. لا تسجل الصوت، ولا تخزنه، ولا ترسله إلى خدمة خارجية في MVP.

اعزل القنوات حسب authoritative membership. لاعب خارج الغرفة أو خارج المباراة يجب أن يفشل في قراءة signaling أو الكتابة فيه حتى لو عرف `voiceScopeId`.

تحقق من أن اللاعب الذي لا يضغط Join:

- لا يملك MediaStream.
- لا يسمع Audio remote.
- لا يدخل في peer connections.

أضف رسائل خطأ مفهومة بالعربية أو وفق لغة المشروع، مثل:

- Microphone permission denied.
- No microphone found.
- Connection failed.
- Call ended.
- You are not eligible for this call.
- Reconnecting.

## 11. خطة التنفيذ المرحلية الإلزامية

### المرحلة الأولى: Contract وScope Adapter

نفّذ الـadapter وحالات الصوت والأنواع/العقود فقط. لا تغيّر Gameplay. اختبر أن 1v1 و2v2 وFour ينتجون scope صحيحًا، وأن Semifinal A/B وFinal/Third Place منفصلون.

### المرحلة الثانية: 1v1 MVP

نفّذ Start وJoin وreal audio وMute Microphone وMute Incoming Audio وLeave. اختبر على متصفحين وجهازين قبل أي توسعة.

### المرحلة الثالثة: 2v2

وسّع نفس الطبقة لأربعة مشاركين في قناة واحدة. اختبر الدخول المتأخر، المغادرة، mute الفردي، وعدم الانضمام.

### المرحلة الرابعة: Four Match Isolation

أضف match-scoped channels واختبر Semifinal A/B وFinal/Third Place. اختبر transition وrefresh ومنع cross-hearing.

### المرحلة الخامسة: Resilience وUX

أضف Reconnecting وRetry، وpermission errors، وmobile behavior، وbackground/foreground handling، وaccessibility، وreduced motion.

### المرحلة السادسة: Rules وRegression وDeployment

اختبر Firebase Rules، ثم اختبارات Gameplay، ثم build، ثم browser، ثم multi-client، ثم افحص diff كاملًا وانشر فقط بعد نجاح بوابة QA.

لا تنتقل من مرحلة إلى التالية إذا فشلت السابقة.

## 12. ما يجب اختباره فعليًا

نجاح `npm run build` وحده غير كافٍ. يجب تسجيل مستوى الدليل لكل اختبار:

```text
SOURCE VERIFIED
ENGINE TEST VERIFIED
BUILD VERIFIED
LIVE FIREBASE VERIFIED
LIVE BROWSER VERIFIED
FOUR-CLIENT VERIFIED
NOT VERIFIED
BLOCKED BY ENVIRONMENT
```

اختبر:

| الاختبار | النتيجة المطلوبة |
|---|---|
| 1v1 Start/Join | اللاعبان يسمعان بعضهما فعلًا |
| 1v1 No Join | لا صوت ولا mic track للاعب غير المنضم |
| Mic Mute | الطرف الآخر لا يسمع اللاعب المكتوم |
| Incoming Mute | اللاعب لا يسمع الآخرين لكنه يبقى داخل المكالمة |
| Leave | إغلاق peer connections وإيقاف الميكروفون |
| Permission Denied | اللعبة والـChat يستمران دون Voice |
| 2v2 Four Clients | الأربعة يسمعون المشاركين المنضمين فقط |
| 2v2 Late Join | اللاعب المتأخر يدخل من دون كسر اتصالات الآخرين |
| Four A/B | لا يوجد cross-hearing بين المباراتين |
| Four Final/Third | القناتان منفصلتان |
| Refresh | لا تنتقل مكالمة قديمة إلى سياق جديد |
| Network Loss | Reconnecting ثم Retry أو Failed من دون كسر اللعبة |
| Firebase Denial | outsider لا يقرأ signaling |
| Mobile | إذن الميكروفون والصوت يعملان على الأجهزة المدعومة |
| Regression | 1v1 و2v2 وFour وDaily وChat والـGameplay تعمل كما كانت |

إذا لم تتوفر أربعة أجهزة أو شبكة دولية، اذكر `NOT VERIFIED` أو `BLOCKED BY ENVIRONMENT` بوضوح، ولا تدّعِ نجاحًا كاملًا.

## 13. إدارة المخاطر

إذا ظهر أن STUN وحده لا يكفي على بعض الشبكات، لا تغيّر Gameplay. سجّل الفشل أولًا، ثم اقترح TURN كمرحلة مستقلة. لا تضف Token أو خدمة خارجية إلا إذا ثبتت الحاجة وبعد موافقة المستخدم.

إذا فشل WebRTC، أبقِ Chat واللعبة يعملان. Voice Room يجب أن يكون feature optional لا يجعل الصفحة تفشل أو تظهر شاشة بيضاء.

إذا ظهرت مشكلة في Firebase Rules، لا توسّع الصلاحيات. اعزل namespace، أصلح العضوية والتحقق، واختبر denial cases.

إذا حدثت مشكلة في Four أو transitions، أوقف التوسع، أغلق scope القديم، وراجع match identity وcallInstanceId بدل إضافة patch عشوائي.

إذا تطلب الحل تعديلًا في `GameStateContext` أو `CompetitiveModeContext`، اجعل التعديل minimal وموثقًا، وتحقق أنه لا يغير أي gameplay transition.

## 14. معايير قبول الميزة

لا تعتبر Voice Room جاهزًا إلا إذا:

- الصوت حقيقي ومسموع، وليس مجرد Connected label.
- لا يعمل الميكروفون قبل Start/Join وAllow.
- Mute Microphone يمنع إرسال صوت اللاعب.
- Mute Incoming Audio يمنع السماع محليًا من دون مغادرة.
- اللاعب غير المنضم لا يسمع ولا يرسل.
- 1v1 يعمل بين جهازين وشبكتين مختلفتين إن أمكن.
- 2v2 يعمل لأربعة مشاركين.
- Four يمنع اختلاط A/B وFinal/Third Place.
- Refresh وLeave وtransition تنظف الاتصال القديم.
- Firebase Rules تمنع outsider.
- فشل Voice لا يكسر Chat أو Gameplay.
- التصميم يعمل على الهاتف ولا يغطي شاشة اللعب.
- لا توجد أسرار خاصة في repository أو bundle.

## 15. التقرير النهائي المطلوب من AI المنفذ

بعد التنفيذ، لا تقل فقط “تم”. أرسل تقريرًا بالعربية يتضمن:

1. ما الذي فُحص.
2. ما الملفات التي تغيرت ولماذا.
3. ما الذي تم تنفيذه في 1v1 و2v2 وFour.
4. ما الذي لم يُنفذ ولماذا.
5. كيف تم عزل القنوات.
6. كيف تم حماية Firebase.
7. الاختبارات الفعلية ونتائجها مع labels الدليل.
8. هل تم اختبار الصوت الحقيقي على جهازين أو أربعة.
9. هل احتجنا Token أو TURN أو خدمة خارجية.
10. أي مخاطر ما زالت موجودة.
11. خطوات تجربة المستخدم على الهاتف.
12. قرار الحالة: `READY` أو `CONDITIONAL` أو `BLOCKED` أو `NOT READY`.

إذا فشل اختبار أو ظهرت مشكلة، لا تخفها ولا تعلن النجاح. اعمل targeted investigation، أصلح السبب، ثم أعد التحقق.

ابدأ الآن بالمرحلة الأولى فقط: فحص المشروع وكتابة تقرير الأدلة وScope Lock. لا تعدّل الكود قبل إنهاء الفحص وتحديد الملفات والعقود التي ستتغير. بعد ذلك نفّذ المراحل بالترتيب، مع توقف آمن بعد كل مرحلة إذا ظهرت مخاطرة أو فشل في الاختبار.

---

## الملفات المرجعية التي يجب قراءتها قبل التنفيذ

```text
docs/VOICE-ROOM-RESEARCH-AND-IMPLEMENTATION-PLAN.md
evidence/voice-room-research-findings.md
NEON_GUESS_ENGLISH_INTRODUCTION.md
src/context/GameStateContext.jsx
src/context/CompetitiveModeContext.jsx
src/firebase/
database.rules.json
docs/
evidence/
```

## ملاحظة للمستخدم

هذا الـPrompt يطلب من AI أن يبدأ بالفحص ثم التنفيذ المرحلي، وليس أن يضيف زرًا شكليًا بسرعة. لا ترسل Prompt آخر معه يطلب منه تجاوز الفحص أو تغيير Gameplay. أنت ستحتاج فقط إلى تجربة الميزة على هاتفين أو أكثر عندما يصل التنفيذ إلى مرحلة الاختبار الحقيقي.
