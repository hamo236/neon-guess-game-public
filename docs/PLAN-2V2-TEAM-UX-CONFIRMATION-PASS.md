# خطة بحث وتصميم: تحسين 2v2 Team Battle بدون تنفيذ

## 1. الملخص التنفيذي

بما أن دخول الغرفة والبدء أصبحا يعملان، فإن الدفعة التالية يجب أن تركز على **وضوح التعاون** وليس إضافة زخارف أو إعادة كتابة Firebase. المشكلة الأساسية في تجربة اللعب الحالية أن واجهة 2v2 ما زالت تعرض شبكة بطاقات كبيرة، بينما الفكرة المطلوبة هي تفاعل جماعي بسيط: كل لاعب يرى هدف فريقه، يرى حالة الفريق المنافس، ثم يؤكد زرًا واضحًا أن الفريق المنافس خمّن بشكل صحيح. لا ينبغي أن ينتقل الـround بسبب لاعب واحد.

التوصية هي تنفيذ pass صغير ومحدد يتكون من مسارين مترابطين: إعادة تصميم lobby ليعرض الفرق والأدوار والاستعداد بطريقة أقوى، وإعادة تصميم gameplay إلى بطاقة هدف + زر تأكيد جماعي authoritative. يجب أن تبقى 1v1 وTournament خارج نطاق التعديل.

## 2. ما تم فحصه في المشروع

| المنطقة | الملاحظة الحالية | أثرها على القرار |
| --- | --- | --- |
| `CompetitiveModeContext.jsx` | `mutateCompetitiveState` يكتب داخل transaction، و`recordGuess` يخزن guess لكل لاعب، بينما `resolveTeamRound` لا يستمر إلا من الـHost | يمكن إضافة confirmation gate داخل نفس transaction boundary بدل إنشاء مصدر حقيقة جديد |
| `teamBattleEngine.js` | الفرق ثابتة حسب join order، والـtargets مشتركة منطقيًا لكل فريق، والنتيجة تنتقل إلى `round_result` | نحافظ على team assignment وtargets وscoring، ونضيف فقط حالة confirmation مرتبطة بالـround |
| `CompetitiveModePage.jsx` | lobby يحتوي Room Code وTeamSlotPreview، والـgameplay يعرض TargetCard وGuessGrid كبيرة | نرفع hierarchy البصرية ونستبدل GuessGrid في Team Battle فقط بلوحة opponent target وCTA واحد |
| `competitiveFirebase.js` | الغرفة والتحديثات والـprivate targets تحت `teamRooms/{roomId}`، مع transaction على كامل الغرفة | لا حاجة لتغيير top-level Firebase schema في أول pass |

## 3. بحث ودليل القرار

> “Data is synchronized in realtime to every connected client.” — Firebase Realtime Database [1]

هذا يدعم أن حالة confirmation يجب أن تُكتب في الحالة authoritative للغرفة وتظهر عبر listener، وليس في `useState` محلي. توثيق Firebase يوضح أيضًا أن `onValue()` مخصص للمراقبة المستمرة، وأن transaction مناسبة عندما تعتمد الكتابة على الحالة الحالية، بينما `update()` يغير فروعًا محددة دون استبدال بقية العقدة [2].

> “States show the interaction status of a component or UI element.” — Material 3 [3]

هذا يترجم مباشرة إلى حالات مرئية للزر: idle، pressed، confirmed، waiting for teammate، complete، وlocked. لا يكفي تغيير النص فقط؛ يجب أن يظهر الفرق باللون، الأيقونة، progress، و`aria-live` حتى يفهم اللاعب أن ضغطته سُجلت.

> “Ideally, systems should always keep users informed about what is going on, through appropriate feedback within reasonable time.” — Nielsen Norman Group [4]

لذلك ينبغي أن تعرض الواجهة دائمًا عدد التأكيدات، من أكد، ومن المتبقي، وهل الجولة تنتظر زميلًا أم تستعد للانتقال. هذا يقلل الضغط المتكرر على الزر ويجعل التأخير الشبكي مفهومًا بدل أن يبدو كأنه عطل.

### Research Evidence

الدليل المباشر من المشروع يثبت أن الحالة العامة تصل إلى جميع العملاء، وأن التحديثات تمر عبر transaction. الدليل الخارجي يثبت قيمة real-time projection، والـtransaction للكتابة المعتمدة على الحالة، والحالات المرئية والتغذية الراجعة الفورية.

### Inference

أفضل تجربة ليست أن نسمح للـHost وحده بإنهاء الجولة، وليست أن نترك كل لاعب يقرر محليًا. الحل المتوازن هو أن يكتب كل لاعب confirmation مرة واحدة، ثم تحسب transaction authoritative هل اكتمل quorum المطلوب. هذا يحافظ على العدالة ويمنع اختلاف شاشات اللاعبين.

### Recommendation

أوصي بأن يؤكد اللاعبان في **الفريق الذي يراقب الحدث** أن الفريق المنافس خمّن بشكل صحيح. مثال: Team A يرى لوحة `TEAM B · GUESSED CORRECT`. إذا ضغط لاعب Team A، تظهر `1/2 confirmed` وينتظر teammate. لا تنتقل الجولة حتى يضغط اللاعب الثاني في Team A أيضًا. ويطبق نفس المسار على Team B عندما يؤكد نتيجة تخص Team A. ولمنع انتقال أحادي الجانب، يتم فتح الحالة التي تسمح بإنهاء الجولة فقط بعد اكتمال confirmation المطلوب من الفريقين، أو بعد حسم قاعدة المنتج بأن الفريق الفائز فقط هو الذي يتطلب تأكيدًا؛ هذه نقطة يجب تثبيتها قبل التنفيذ النهائي.

## 4. تجربة الـLobby المقترحة

الـLobby يجب أن يبدو كغرفة مباراة، لا كنموذج إدخال. الترتيب المقترح هو:

| المستوى | التصميم المقترح | سبب الاختيار |
| --- | --- | --- |
| Header | `2v2 TEAM BATTLE` مع badge للحالة: `WAITING FOR SQUAD` أو `READY TO LAUNCH` | يجعل حالة النظام ظاهرة من أول نظرة |
| Team stage | بطاقتان واضحتان Team A وTeam B، وكل بطاقة فيها لاعبان، avatar أو initials، وconnection dot | يربط join order بالفرق قبل بداية اللعب |
| Room invite | Room code كبير، copy/share، وعدد المقاعد المفتوحة | يحافظ على نجاح الدفعة السابقة ويجعله أهم إجراء في lobby |
| Readiness | شريط `3/4 PLAYERS`, حالات `CONNECTED`, `WAITING`, `READY` | يوضح سبب تعطيل Start بدل زر باهت فقط |
| Host action | زر `START MATCH` كبير مع microcopy يشرح `Need 4 connected players` | CTA واحد واضح، مع feedback pressed/loading |
| Motion | دخول slot عند انضمام لاعب، pulse قصير عند اكتمال الفريق، وtransition خفيف عند start | motion يخدم state ولا يتحول إلى decoration |

يجب استخدام تباين واضح، targets لمس كبيرة، focus ring، وlabels نصية بجانب الألوان. لا يجب أن يعتمد Team A أو Team B على اللون وحده، لأن اللون وحده ليس كافيًا لإيصال الحالة لكل المستخدمين [3].

## 5. تجربة الـGameplay المقترحة

### ما يتم حذفه من Team Battle فقط

تُزال `GuessGrid` من projection الخاص بـ2v2. لا يتم حذفها من Tournament أو 1v1، ولا يتم تغيير engine الخاص بالـguess إلا إذا أثبت الاختبار أن confirmation يحتاجه.

### ما يظهر بدلًا منه

يظهر أعلى الشاشة `ROUND 1 / 3`، timer، scoreboard مضغوط، ثم بطاقة `YOUR TEAM TARGET` التي تظل private/shared حسب القاعدة الحالية. أسفلها بطاقة واحدة لهدف الفريق المنافس، مع صورة واسم الهدف الذي نحاول فهم هل تم تخمينه بشكل صحيح. تحت البطاقة يظهر CTA:

```text
TEAM B
GUESSED CORRECT
```

وبحسب هوية اللاعب، تتغير Team B إلى Team A. بعد الضغط يتحول الزر إلى:

```text
CONFIRMED · WAITING FOR TEAMMATE
1 / 2 TEAM CONFIRMATIONS
```

وعند اكتمال الزميلين:

```text
TEAM CONFIRMED
2 / 2
ADVANCING WHEN OPPONENT IS READY
```

يجب أن تكون هذه الحالات ناتجة من state القادم من Firebase، مع local pressed feedback سريع لا يدّعي اكتمال التأكيد قبل وصول listener.

## 6. الحالة authoritative المقترحة

لا نضيف مصدر حقيقة محليًا. الحالة المقترحة داخل `state.match` تكون مفهومة مثل:

```js
match: {
  matchId,
  roundNumber,
  status: 'playing',
  targets,
  guesses,
  confirmations: {
    [teamId]: {
      [playerId]: {
        playerId,
        teamId,
        roundNumber,
        confirmedAt
      }
    }
  },
  confirmationStatus: {
    team_a: { confirmedCount: 0, requiredCount: 2, complete: false },
    team_b: { confirmedCount: 0, requiredCount: 2, complete: false }
  }
}
```

هذه صيغة تصميمية وليست تعديلًا منفذًا. يجب أن يقرر implementation pass النهائي إن كان التخزين الأفضل nested under `match.confirmations` أو تحت `match.roundConfirmations[roundNumber]`. الأهم هو عدم استخدام confirmations من round سابقة، وعدم ربطها بالغرفة فقط من دون `matchId` و`roundNumber`.

### قواعد transaction

1. إذا لم تكن الجولة `playing`، لا تُقبل confirmation جديدة.
2. إذا كان `matchId` أو `roundNumber` لا يطابقان current state، ترفض الكتابة.
3. اللاعب يجب أن يكون موجودًا في `players` وأن ينتمي إلى الفريق المحدد من `teamByPlayer`.
4. الضغط المتكرر idempotent؛ لا يزيد العدد فوق 2.
5. عند اكتمال confirmation المطلوبة فقط، تصبح `complete: true`.
6. الـHost وحده يظل resolver للتسجيل النهائي في أول pass، لكن `resolveTeamRound` يجب أن يرفض التنفيذ إذا لم تكتمل بوابة confirmation.
7. `finishTeamRound` و`advanceTeamRound` لا يتغيران إلا لإزالة/تهيئة confirmation state عند حدود الجولة إذا لزم الأمر.

## 7. خريطة التأثير

| النظام | التصنيف | التأثير المتوقع |
| --- | --- | --- |
| `CompetitiveModePage.jsx` Team Battle lobby | Direct | إعادة ترتيب بصري، slots، readiness، microcopy، motion classes |
| `CompetitiveModePage.jsx` Team Battle gameplay | Direct | استبدال GuessGrid بـopponent target confirmation panel |
| `CompetitiveModeContext.jsx` | Direct | action جديدة مثل `confirmOpponentGuess`، وgate قبل resolve |
| `teamBattleEngine.js` | Direct/Controlled | pure helpers لحساب confirmation completion وتنظيف state عند round boundary |
| `competitiveFirebase.js` | Indirect | غالبًا لا يحتاج schema path جديد؛ يستخدم `mutateCompetitiveState` transaction |
| RTDB security rules | Protected unless required | يجب فحصها قبل التنفيذ؛ لا يجوز فتح write عام بلا ضرورة |
| 1v1 | Protected | لا تغيير في UI أو room/guess flow |
| Tournament | Protected | لا تغيير في grid أو match resolution |
| private targets | Protected | لا كشف target الخاص للاعبين غير المصرح لهم |
| scoring/rewards | Protected | لا احتساب نقاط إضافية من confirmation |

## 8. المخاطر وخطط الوقاية

| الخطر | كيف يحدث | الوقاية |
| --- | --- | --- |
| انتقال الجولة بعد لاعب واحد | resolver لا يتحقق من quorum | transaction gate داخل `resolveTeamRound` واختبار لاعب واحد فقط |
| استخدام confirmation من جولة قديمة | state لا يربطها بـround | تضمين `matchId` و`roundNumber` والتحقق داخل mutation |
| ضغط مزدوج أو تأخير الشبكة | زران أو retries | idempotent per player and round، مع disabled state بعد acknowledgement |
| اختلاف اللاعب عن teammate | team mapping UI منفصل عن engine | اشتقاق team من `teamByPlayer` authoritative فقط |
| تسريب target المنافس | عرض public target كامل دون سياسة | تحديد target المرئي من state الحالي، وعدم لمس private target paths |
| انتظار لا نهائي | لاعب disconnects بعد أن يضغط | إظهار disconnected status، والـHost-only recovery policy أو rejoin، دون auto-advance صامت |
| regressions في 1v1/Tournament | مشاركة component أو action بشكل واسع | branch صريح `mode === TEAM_BATTLE` واختبارات protected-mode |
| UI جميل لكنه غير واضح | زيادة gradients دون hierarchy | اختبار task completion: هل يعرف اللاعب ماذا يضغط ولماذا خلال 3 ثوانٍ؟ |

## 9. خطة التنفيذ المرحلية بعد موافقتك

### Pass A — Contract and pure logic

إضافة pure helpers في `teamBattleEngine.js` لحساب team confirmation status، وتحديد شكل reset عند بداية round جديد، وكتابة deterministic tests لحالات 0/2 و1/2 و2/2، duplicate confirmation، stale round، player خارج الفريق، وdisconnect.

### Pass B — Authoritative action

إضافة action في `CompetitiveModeContext.jsx` تكتب confirmation عبر `mutateCompetitiveState`. تعديل `resolveTeamRound` ليمنع finish إذا لم تكتمل البوابة. عدم تغيير scoring formula أو final result.

### Pass C — Gameplay projection

استبدال GuessGrid في Team Battle فقط بلوحة target المنافس وbutton confirmation، مع حالات Material-style واضحة، timer، progress، teammate name، وaria-live. الإبقاء على TeamResult وReveal الموجودين، مع التأكد أن transition لا يكرر نفسه.

### Pass D — Lobby polish

إعادة تصميم Lobby components إلى hero header، team stage، readiness rail، room invite، وhost CTA. كل التعديلات additive وقابلة للتراجع، دون تغيير lifecycle أو join contract.

### Pass E — Verification

تشغيل source/syntax/build، deterministic engine tests، ثم simulated four-client matrix أو Firebase Emulator إن كان متاحًا. اختبار refresh وdisconnect وduplicate click وtimer expiry، ثم protected 1v1/Tournament smoke checks.

## 10. معايير القبول

| المعيار | المطلوب |
| --- | --- |
| Lobby clarity | يعرف اللاعب خلال نظرة واحدة أنه في 2v2، فريقه، الفريق الآخر، عدد اللاعبين، ومن يستطيع البدء |
| Gameplay clarity | لا تظهر شبكة 15 بطاقة في Team Battle؛ يظهر target panel وزر confirmation واحد |
| Shared gate | ضغط لاعب واحد ينتج `1/2` ولا ينقل الجولة |
| Completion | ضغط الزميل الثاني ينتج `2/2` ويتيح الانتقال authoritative فقط |
| Round isolation | confirmation من round 1 لا تؤثر في round 2 أو 3 |
| Target safety | private/team target boundaries لا تتسع بالخطأ |
| Protected modes | 1v1 وTournament يعملان بنفس behavior السابق |
| Mobile quality | الزر قابل للمس، واضح، focusable، ويعرض pressed/disabled/loading state |

## 11. قرار التوقف قبل التنفيذ

هذه الوثيقة تصميم وبحث فقط، ولم يتم تعديل كود في هذه الدفعة. قبل البدء في Pass A، يلزم تثبيت تفسير زر `GUESS CORRECT`: التوصية الحالية هي أن الفريق الذي يراقب يؤكد نجاح الفريق المنافس، وأن انتقال الجولة يتطلب تأكيد اللاعبَين في كل فريق. إذا كان المقصود أن الفريق الذي خمّن هو الذي يضغط، نغير mapping النصي والـauthoritative rule قبل أي تنفيذ.

## References

[1]: https://firebase.google.com/docs/database "Firebase Realtime Database"

[2]: https://firebase.google.com/docs/database/web/read-and-write "Read and Write Data on the Web | Firebase Realtime Database"

[3]: https://m3.material.io/foundations/interaction/states "Material 3: States"

[4]: https://www.nngroup.com/articles/visibility-system-status/ "Visibility of System Status | Nielsen Norman Group"
