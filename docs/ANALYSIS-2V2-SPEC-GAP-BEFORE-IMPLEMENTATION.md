# تحليل فجوة مواصفات 2v2 قبل التنفيذ

## Current Architecture

يستخدم الوضع التنافسي الجديد `CompetitiveModeContext.jsx` كطبقة lifecycle، و`competitiveFirebase.js` كـ adapter لـ Firebase Realtime Database، و`teamBattleEngine.js` كمنطق نقي للفِرق والأهداف والتأكيد والنتائج. مسار الغرفة مستقل عن 1v1 ويستخدم namespace `teamRooms/{roomId}`. الحالة العامة تُنظَّف قبل كتابتها، بينما الأهداف الخاصة تُكتب في `private/{playerId}/{matchId}/target`.

## Existing Multiplayer Flow

ينشئ الـHost غرفة في حالة `lobby`، وينضم اللاعبون عبر transaction مع `joinOrder`، ثم يراقب الجميع الغرفة من Firebase. عند وجود أربعة لاعبين يستطيع الـHost بدء الوضع. حاليًا يبدأ توزيع الفرق من ترتيب الدخول داخل `createTeamBattleState`: اللاعبان الأول والثاني في Team A واللاعبان الثالث والرابع في Team B.

## Existing Target Flow

يُنشأ هدفان للفريقين في بداية الجولة، ويُنسخ الهدف نفسه إلى اللاعبين المنتمين للفريق. توجد subscription خاصة لكل لاعب، لكن public match state ما زال يحتفظ بتفاصيل داخلية يحتاج التدقيق في serialization. التحقق من round وmatch موجود في listener الخاص بالهدف.

## Existing Firebase Flow

`mutateCompetitiveState` يستخدم `runTransaction` على الغرفة، و`writeCompetitiveState` يكتب snapshot عامًا sanitized، و`writeCompetitiveTarget` يكتب target خاصًا لكل لاعب. هذا يسمح بإضافة guards وidempotency دون إنشاء state system منافس. لكن نقل الفرق يدويًا غير موجود، وبدء المباراة يتحقق حاليًا من عدد اللاعبين فقط لا من 2+2 authoritative.

## What 2v2 Can Reuse

يمكن إعادة استخدام room lifecycle، reconnect/presence، host authorization في provider، `runTransaction`، target private paths، countdowns القائمة على timestamps، ونمط 1v1 للـround result. يجب الإبقاء على scoring وtarget-selection الموجودين بدل اختراع نظام جديد.

## What Must Be Added or Corrected

يجب إضافة تحقق authoritative من `players === 4` و`teamA.length === 2` و`teamB.length === 2` قبل Start. المواصفات تطلب seats وتحكمًا يدويًا قبل البداية، بينما الكود الحالي يعرض join-order preview فقط ولا يملك mutation لتغيير الفريق. لذلك يلزم إضافة seat/team transaction مع منع 3v1 والـduplicate player والسباق على المقعد.

يجب ضبط target privacy بدقة: الهدف الذي يحاول الفريق تخمينه لا يجب أن يظهر له. public state يجب ألا يحتوي على `match.targets` أو `teamTargets` أو أي snapshot قبل نهاية الجولة. target الخاص يكون مربوطًا بـ`roomId`, `gameInstanceId`/`matchId`, `roundId`/`roundNumber`, `teamId`, و`targetId`.

يجب فصل نجاح التخمين عن موافقة الفريق. الفريق الذي حاول التخمين يسجل نجاح التخمين وفق game interaction القائمة، ثم الفريق الذي يملك الهدف المخمَّن هو الذي يضغط لاعباه الاثنين `Guess Correct` لتأكيد النتيجة. التأكيد idempotent ومربوط بالـplayer/team/match/round، ولا يُسمح للفريق الآخر بإغلاق الجولة.

يجب أن تُحفظ نتيجة الجولة في authoritative snapshot قبل إنشاء أهداف الجولة التالية. نتيجة الجولة تحتاج `gameInstanceId`, `roundId`, `teamA`, `teamB`, `teamATarget`, `teamBTarget`, و`completedAt` وفق صلاحيات العرض؛ لا يجوز استخدام target جديد أو local state قديم في reveal. نافذة reveal خمسة ثوانٍ تعتمد على `revealEndTimestamp`، وبعدها ينتقل الـHost وحده للجولة التالية.

## Potential Conflicts

أكبر خطر هو أن current `finishTeamRound` يحسب player stats من `match.targets` العام الذي يتم حذفه أثناء persistence؛ لذلك يجب عدم الاعتماد على public state لنتيجة الهدف. خطر آخر أن `advanceTeam` يولد target من `state.roundNumber * 2` بدون game instance مستقل، ما قد يسبب stale state عند retry داخل نفس الغرفة. كذلك تعرض صفحة 2v2 حاليًا `TargetCard` للهدف الخاص، وهذا يجب أن يكون متوافقًا مع قاعدة الإخفاء: اللاعب لا يرى هدف الفريق الذي يحاول تخمينه، بينما يمكنه رؤية هدف فريقه فقط إذا كان ذلك هو سلوك اللعبة المقصود لتأكيد الخصم، لا كهدفٍ للتخمين.

## Files Likely Affected

الملفات الأساسية: `src/modes/teamBattleEngine.js`, `src/context/CompetitiveModeContext.jsx`, `src/firebase/competitiveFirebase.js`, `src/pages/CompetitiveModePage.jsx`, و`scripts/qa-team-battle-engine.mjs`. قد يلزم فحص `src/firebase/roomService.js` كمرجع فقط، ولا ينبغي تعديله إلا بسبب مثبت.

## Implementation Plan

أولًا، نضيف contract نقيًا للفرق والمقاعد وvalidation، ثم mutation transaction لتبديل مقعد قبل اللعب. ثانيًا، نضيف game instance وround snapshot fields مع الحفاظ على schema الحالية قدر الإمكان. ثالثًا، نفصل private target writes عن public result serialization ونربط كل write/listener بالسياق الكامل. رابعًا، نطبق team-owned two-player confirmation، ثم finish idempotency وscore calculation من snapshot authoritative. خامسًا، نعيد صياغة UI لتعرض Team A/Team B والمقاعد والحالات بدل شبكة صور غير مطلوبة، ونستخدم reveal لمدة خمسة ثوانٍ من snapshot الجولة المنتهية مع عدم كشف target للاعب الخطأ.

## Testing Plan

سيتم تشغيل deterministic engine tests للـ2v2: أربعة لاعبين، 2+2، رفض 3v1، confirmation للاعب واحد، confirmation للاعب الثاني، رفض الفريق الخطأ، reset بين الجولات، game-instance isolation، وidempotency. سيتم تشغيل source-contract وJSX checks، ثم محاولة build حقيقي. سيتم توثيق أي اختبار Firebase حي أو four-client غير متاح على أنه `NOT VERIFIED` دون ادعاء النجاح. ستتم مقارنة الملفات المحمية 1v1 وTournament بعد التغيير والتأكد من عدم تغييرها إلا إذا ثبت سبب تقني.

## قرار قبل التنفيذ

التغيير يجب أن يبقى scoped إلى Team Battle. لا يجوز تنفيذ seat switching أو reveal public قبل تثبيت schema transaction وprivacy guards. المصدر النهائي للحقيقة هو Firebase transaction والاختبارات deterministic، وليس ترتيب React المحلي أو شكل الواجهة.
