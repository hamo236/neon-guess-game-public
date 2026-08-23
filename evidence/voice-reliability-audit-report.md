# تقرير تدقيق موثوقية المكالمة الصوتية في NEON GUESS

**نوع الدورة:** بحث وتدقيق فقط — لم يتم تعديل أي ملف أو تنفيذ إصلاح.

## 1. الحكم التنفيذي

المكالمة الصوتية **موجودة فعليًا ومبنية على WebRTC وFirebase**، وليست واجهة شكلية فقط. فالمشروع ينشئ `RTCPeerConnection`، يطلب الميكروفون، يرسل SDP وICE candidates عبر Firebase، ينشئ عناصر صوت بعيدة، ويزيل الـpeer والـaudio عند المغادرة.

لكن لا يمكن اعتمادها كـ"خالية من المشاكل" بنسبة 100% من الأدلة الحالية. يوجد مساران مثبتان يعملان في الظروف المعتادة، وعدة مخاطر موثقة قد تظهر على شبكات أو متصفحات معينة. أهم خطر إنتاجي هو أن الإعداد يحتوي على STUN عام فقط ولا يحتوي على TURN relay؛ لذلك قد تفشل المكالمة بين بعض شبكات NAT الصارمة أو الجدران النارية رغم سلامة الكود. WebRTC يعتمد على ICE candidates، وSTUN وحده لا يضمن الاتصال في كل الشبكات [1] [2].

## 2. ما تم إثباته من الكود

| الوظيفة | الدليل الحالي | التقييم |
|---|---|---|
| طلب الميكروفون | `getUserMedia({ audio: true, video: false })` | موجود |
| إنشاء اتصال P2P | `new RTCPeerConnection(rtcConfig)` | موجود |
| إرسال الصوت المحلي | `stream.getTracks().forEach(track => peer.addTrack(...))` | موجود |
| إرسال SDP | offer/answer عبر `writeVoiceSignal` | موجود |
| تسلسل SDP | `toJSON()` ثم تطبيع type/sdp | محمي باختبار |
| استقبال ICE | queue حتى وجود `remoteDescription` | موجود |
| استقبال الصوت | `peer.ontrack` وربطه بعنصر audio | موجود |
| كتم الميكروفون | `track.enabled = false/true` | موجود |
| كتم صوت الآخرين | `audio.muted` | موجود |
| مغادرة المكالمة | إزالة participant وإغلاق peers وإيقاف tracks | موجود |
| استمرار اللوحة بين routes | `PersistentClassicVoiceRoom` أعلى Router | موجود |
| Four match isolation | `roomCode:matchId` وeligible opponent IDs | موجود في Classic Four |
| Tournament path host | يحتاج مراجعة مستقلة لمسار Competitive host | ليس نفس host الكلاسيكي |

## 3. المخاطر التقنية المؤكدة أو المحتملة

### 3.1 عدم وجود TURN — خطر إنتاجي مرتفع

الإعداد الحالي هو:

```js
const rtcConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};
```

لا يوجد TURN server. STUN يساعد في اكتشاف العنوان العام، لكن بعض شبكات الشركات والجامعات والهواتف وCGNAT تمنع اتصال P2P المباشر. عندها يحتاج WebRTC إلى TURN كمسار relay [1] [2]. هذا لا يعني أن المكالمة ستفشل دائمًا، لكنه يمنع ضمان العمل الدولي على كل الشبكات.

**درجة الخطر:** مرتفعة في الشبكات المقيدة، منخفضة في الشبكات المنزلية العادية.

### 3.2 التفاوض ليس Perfect Negotiation

اختيار صاحب الـoffer يتم بهذه القاعدة:

```js
const shouldOffer = String(playerId) < String(remoteId);
```

هذه القاعدة تمنع غالبًا أن يرسل الطرفان offer في الوقت نفسه، لكنها ليست تطبيقًا كاملًا لنمط Perfect Negotiation الذي يتعامل مع offer collision وrollback وpolite/impolite roles [3]. إذا حدث reconnect أو تغيّر سريع في المشاركين أو تكرر إنشاء peer، يمكن أن يظهر `signalingState` غير مستقر ويتم تجاهل offer.

**درجة الخطر:** متوسطة، خاصة أثناء reconnect أو دخول أطراف متقاربة زمنيًا.

### 3.3 عدم وجود مسار واضح لـ ICE restart أو recovery

الكود يتعامل مع `connectionState` عندما تكون `failed` أو `closed`، ويزيل الـpeer، ويضع الحالة `connected` عند نجاح الاتصال. لكنه لا يراقب `iceConnectionState` بالتفصيل، ولا يرسل ICE restart عند `disconnected` أو `failed` [4]. النتيجة المحتملة هي أن المكالمة تتوقف بعد تغيير الشبكة من Wi-Fi إلى mobile data أو بعد نوم الهاتف، من دون إعادة تفاوض تلقائية.

**درجة الخطر:** متوسطة إلى مرتفعة على الهواتف والشبكات المتغيرة.

### 3.4 رفض تشغيل الصوت يتم ابتلاعه

عند وصول الصوت:

```js
audio.play().catch(() => {});
```

إذا منع المتصفح التشغيل التلقائي أو احتاج إلى user gesture، يتم تجاهل الخطأ ولا تظهر للمستخدم إشارة واضحة بأن الصوت لم يبدأ. `getUserMedia` نفسه يتطلب HTTPS أو localhost وإذنًا صريحًا [5]، كما أن تشغيل الصوت البعيد قد يتأثر بسياسات autoplay.

**درجة الخطر:** متوسطة، وتظهر غالبًا كـ"دخلت المكالمة لكن لا أسمع".

### 3.5 إشارات Firebase لا يظهر لها تنظيف دائم

الإشارات تُكتب بمفاتيح push داخل:

`voiceCalls/{callId}/signals/{senderId}/{receiverId}`

والـclient يمنع تكرار المعالجة داخل الذاكرة باستخدام `seenSignalsRef`. لكن لا يظهر في adapter تنظيف للإشارات القديمة بعد معالجتها، ولا job server-side لحذفها. كما أن المكالمة تحتوي `expiresAt`، لكن الانتهاء يتم تفسيره في client بواسطة عمر 30 دقيقة، وليس عبر حذف Firebase مؤكد.

**درجة الخطر:** منخفض على الصوت الفوري، ومتوسط على تضخم البيانات وتكرار قراءة signaling بمرور الوقت.

### 3.6 قراءة بيانات voiceCalls أوسع من الحاجة

في `database.rules.json`، توجد صلاحية `.read` على مستوى `voiceCalls/{callId}` لكل لاعب داخل الغرفة. هذا يعني أن لاعب الغرفة قد يقرأ بيانات المكالمة كاملة، بما فيها `eligible` و`participants` وsignal paths التي تقع تحت call node، حتى لو كان client لا يعالج إلا المشاركين المؤهلين. الكتابة على signal receiver مقيدة بالـeligible، لكن صلاحية القراءة الأب لا تتبع أقل صلاحية ممكنة.

**درجة الخطر:** متوسط من ناحية الخصوصية وعزل البيانات، وليس دليلًا على أن الصوت يصل إلى مباراة أخرى؛ العزل المنطقي في client يعتمد على `roomId` و`scopeId` وeligible IDs.

### 3.7 تنظيف المكالمة عند الخروج يعتمد على lifecycle

عند المغادرة، يتم حذف participant وإيقاف tracks وإغلاق peers. عند إغلاق التبويب أو فقدان الشبكة، يعتمد participant cleanup على `onDisconnect`. لكن حذف call نفسه لا يظهر كعملية صريحة عند خروج آخر مشارك؛ لذلك قد تبقى مكالمات مفتوحة حتى تنتهي مهلة client العمرية.

في Four الكلاسيكي، تغيير match يغير `voiceRoomId` إلى `${roomCode}:${matchId}`، وهذا يعزل Semi-Final A وB والنهائي. هذا مثبت للمسار الكلاسيكي. أما ضمان انتقال Tournament الكامل فيحتاج اختبارًا حيًا لكل انتقال bracket لأن الـhost الدائم في `App.jsx` مخصص لـclassic modes، بينما Competitive routes لها wiring مختلف.

## 4. ما تم فحصه في Four والعزل

في `App.jsx`:

```jsx
const voiceRoomId = isFourPlayerSocial && voiceScopeId !== 'room'
  ? `${state.roomCode}:${voiceScopeId}`
  : state.roomCode;
```

كما أن المشاركين المؤهلين في Four أثناء match هم اللاعب والخصم فقط. هذا يمنع أن تنضم مكالمة Semi-Final A تلقائيًا إلى Semi-Final B في المسار الذي يستخدم هذا host.

في Competitive context، يتم إنشاء private target لكل لاعب من Target الخصم داخل `matchId`، لكن voice lifecycle ليس مثبتًا بنفس الاختبارات الشاملة لكل انتقال Tournament. لذلك لا ينبغي خلط دليل عزل target مع دليل عزل الصوت؛ كل منهما يحتاج contract مستقل.

## 5. حالة الاختبارات الموجودة

| الاختبار | ما يثبته | حدود الدليل |
|---|---|---|
| `voice-room-sdp-contract.test.mjs` | تطبيع offer/answer ورفض SDP غير صالح | لا يثبت اتصال شبكة حقيقي |
| `voice-room-lifecycle.test.mjs` | host دائم، panel، join، وعدم وضع panel داخل GameBoard | لا يثبت audio end-to-end |
| `voice-room-competitive-scope.test.mjs` | scope وactive match wiring | لا يثبت عزل شبكة حي |
| اختبارات room/game العامة | عدم كسر gameplay contracts | لا تختبر NAT/autoplay/mic devices |

لا يوجد حاليًا اختبار آلي يشغل طرفين WebRTC حقيقيين عبر Firebase، أو يحاكي TURN/NAT، أو يغير الشبكة أثناء المكالمة، أو يثبت أن الصوت المسموع يخرج من السماعة في Chrome/Safari/iOS/Android.

## 6. مصفوفة المخاطر المطلوبة قبل إعلان الجاهزية الكاملة

| السيناريو | احتمال المشكلة | هل هو مثبت أنه سليم؟ | الاختبار المطلوب |
|---|---:|---|---|
| جهازان على Wi-Fi منزلي | منخفض | جزئيًا من التجربة السابقة | مكالمة حقيقية وتسجيل connected/track |
| جهازان على شبكتين مختلفتين | متوسط | لا | اختبار دولي/شبكات مختلفة |
| شبكة شركة أو جامعة | مرتفع بدون TURN | لا | اختبار firewall/NAT أو TURN |
| رفض الميكروفون | عادي | جزئيًا | تحقق من رسالة الخطأ وإعادة المحاولة |
| Safari/iOS | متوسط | لا | اختبار permissions/autoplay |
| تبديل Wi-Fi/mobile | متوسط مرتفع | لا | اختبار ICE recovery/restart |
| دخول عدة لاعبين بسرعة | متوسط | لا | اختبار offer collision |
| انتقال Four بين matches | متوسط | جزئيًا | Semi-A/B ثم Final/third-place |
| Refresh أو إغلاق التبويب | متوسط | جزئيًا | فحص onDisconnect وعودة participant |
| آخر لاعب يغادر | منخفض وظيفيًا | لا | فحص stale call cleanup |
| لاعب من خارج eligible | منخفض منطقيًا | قواعد الكتابة جيدة، القراءة واسعة | اختبار Rules Emulator |

## 7. الخلاصة العملية

المكالمة **تعمل في الظروف العادية**، والكود يحتوي على الأساس الصحيح للصوت والمزامنة والعزل. لكن البحث لا يثبت أنها "بدون مشاكل" على جميع الشبكات والأجهزة. أكبر فجوة هي TURN، ثم recovery بعد تغير الشبكة، ثم silent autoplay failure، ثم عدم وجود Perfect Negotiation كامل.

للوصول إلى مستوى ثقة إنتاجي عالٍ دون المساس بالـgameplay، تكون الأولوية المستقبلية: إضافة TURN موثوق وآمن، إظهار حالة ICE/reconnect للمستخدم، تفعيل ICE restart، معالجة autoplay برسالة أو زر استئناف، ثم إضافة اختبارات WebRTC end-to-end وRules Emulator. هذه توصيات فقط في هذه الدورة ولم يتم تنفيذها.

> **القرار الحالي:** Voice implementation موجودة ومثبتة من ناحية البنية والعقود الأساسية، لكنها **CONDITIONAL / ليست مثبتة 100% عالميًا** بسبب قيود الشبكات والمتصفحات والاختبارات الحية غير الموجودة.

## المراجع

[1]: https://webrtc.org/getting-started/peer-connections "WebRTC.org — Peer connections"
[2]: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/iceConnectionState "MDN — RTCPeerConnection iceConnectionState"
[3]: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation "MDN — WebRTC Perfect negotiation"
[4]: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/iceconnectionstatechange_event "MDN — iceconnectionstatechange event"
[5]: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia "MDN — MediaDevices getUserMedia()"
