# NEON GUESS — Lobby Visual Evolution Decision Record

## Run

**Mode:** DESIGN_AND_IMPLEMENT / FRONTEND_IMPLEMENTATION

**Addition batch:** 1–3 of the approved visual cycle

**Target:** Mobile-first Lobby surfaces for 1v1, Four Player Tournament, and 2v2 Team Battle.

**Primary player job:** Choose a mode, configure or join a room, and understand the next action without returning to Home.

**Expected next state:** Existing create/join/start callbacks continue to produce the same existing room and game states.

**Must remain hidden:** Target data, reveal state, scoring internals, Firebase authority, round state, and any multiplayer state not already projected by the current UI.

## Protected contract

The patch may change presentation-only JSX wrappers, copy, classes, and local CSS. It must not change Firebase reads/writes/transactions/listeners, room lifecycle, authentication, routes' outcomes, game rules, rounds, timers, reveal transitions, scoring, target privacy, team assignment, callbacks, effects, loading/disabled truth, or synchronization guards.

Control traces remain unchanged:

- `Create Room -> handleCreateRoom -> hostName/category validation -> actions.createRoom -> existing Firebase/context flow`
- `Join Room -> handleJoinRoom -> joinCode/joinName validation -> actions.joinRoom -> existing Firebase/context flow`
- `Start Game -> handleStartGame -> existing player/category validation -> actions.startGame -> existing navigation`
- `Mode navigation -> existing navigate/setMode/leave confirmation behavior`

## Product-specific visual language

The selected direction uses the existing NEON GUESS world: dark glass room surfaces, cyan primary actions, violet secondary actions, compact uppercase telemetry labels, squad/room vocabulary, and clear state capsules. The visual signature is a **mode rail** that reads like a tactical loadout selector rather than a generic tab bar.

Tokens remain within the existing project conventions:

- Cyan: primary action, active mode, connected/ready state.
- Violet: secondary action, alternate mode, invite/join emphasis.
- White/grey: structure and supporting copy.
- Red: error only; never decorative.
- Black glass: depth and grouping without adding new assets.

Typography roles remain existing display/headline/body/label/stat tokens. No external dependency or asset is added.

## Three visual directions compared

| Direction | Description | Strength | Risk | Decision |
|---|---|---|---|---|
| A — Compact tactical rail | A compact three-mode rail placed after the lobby header, with an active cyan/violet state and one-line helper text. | Best scanability at 320–390px; reinforces mode identity; keeps Create/Join as the primary task. | Requires careful wrapping on narrow screens. | **Selected** |
| B — Large mode cards | Three stacked cards with icons, descriptions, and large tap areas. | Very discoverable and visually expressive. | Pushes room setup below the fold; duplicates Home; too heavy for frequent switching. | Rejected |
| C — Segmented control only | A minimal three-option tab control with no contextual helper text. | Smallest footprint and easiest implementation. | Makes modes less distinct; loses the product-specific room/squad context; weaker for first-time users. | Rejected |

## Why Direction A wins

Direction A preserves the Four/2v2 room setup grammar while making mode switching visible inside each lobby. It uses progressive disclosure: mode choice is available, but Daily Drop and duplicate promotional content do not compete with room creation. It also preserves a clear greyscale hierarchy: mode identity first, room task second, status and roster third, start action last.

## State projection matrix

| Element | Idle | Focus/pressed | Disabled/loading | Error/waiting | Protected source |
|---|---|---|---|---|---|
| Mode rail | Current route/mode highlighted | Existing button focus/active treatment | Existing active-room protection remains | No new local truth | Existing route/context state |
| Daily Drop | Hidden only in 1v1 lobby | N/A | N/A | N/A | Existing Home/other surfaces unchanged |
| Create/Join | Existing handlers and disabled conditions | Existing focus/pressed behavior | Existing `isCreating`/`isJoining`/Firebase checks | Existing error copy | Existing LobbyPage state/actions |
| Category | Existing selected category | Existing `aria-pressed` and focus | Existing `canModifyLobby` | Existing validation | Existing context category |
| Room status/roster | Existing connection and players | No callback change | Existing recovery/disabled behavior | Existing Firebase/error projection | Existing context/Firebase |

## Motion contract

No new animation is required for the first batch. Existing transitions are retained or narrowed where touched. Any new mode-rail feedback uses transform/opacity-compatible transitions under 300ms, `ease-out`, and existing `motion-reduce` behavior. No `transition-all`, layout animation, keyframes, or new motion source is introduced.

## Responsive contract

At 320–390px, the mode rail wraps or uses equal-width options without horizontal overflow. Every option keeps a minimum touch target of 44px height. Room setup fields stack naturally. The bottom global navigation remains untouched for the shared lobby; competitive lobbies receive the same visual mode rail without replacing their protected room actions.

## Allowed files for this batch

- `src/pages/LobbyPage.jsx`
- `src/pages/CompetitiveModePage.jsx` only for presentation insertion if the existing lobby render boundary permits it without changing context, callbacks, effects, or route outcomes.
- `src/components/layout/ModeSwitcher.jsx` as a new presentation-only component if necessary.
- `src/index.css` only for narrowly scoped presentation classes and reduced-motion/responsive rules.

No context, Firebase, game, router configuration, package, environment, or server files may be edited.

## Non-goals

This batch does not change game rules, round count, five-second target logic, scoring, target privacy, team assignment, Firebase schema/transactions, room capacity, route ownership, authentication, or active-room lifecycle.

## Verification gates

- Build succeeds.
- Changed-file audit contains only allowlisted frontend presentation files.
- No protected callback, state, effect, Firebase, or route outcome changes.
- Daily Drop is absent only from the 1v1 lobby presentation.
- Mode rail is present in 1v1, Four, and 2v2 lobby/setup surfaces.
- 1v1 remains exactly two-player in existing validation.
- 320px, 360px, and 390px layouts do not overflow.
- Focus and reduced-motion behavior remain available.
- Motion review reports no new motion block.

## Rollback boundary

Revert only the files in the allowlist and this record if the build, visual layout, or contract audit fails. Do not touch protected context/Firebase files.


# Home Mode Gateway — Addition Batch 4–6

## الهدف

**السياق:** Home على الهاتف يعرض هوية 1v1 بطريقة تنافس اختيار الوضع، ثم يضع Category بصريًا في نفس المساحة العامة رغم أن Category إعداد لاحق للغرفة.  
**المهمة الأساسية:** اختيار نوع اللعبة أولًا، ثم الدخول إلى Lobby صغير ومفهوم، وبعد ذلك اختيار Category ضمن إعداد الغرفة.  
**المسار المتوقع:** Home mode card → صفحة/Lobby الوضع المختار → Create Room أو Join Room → Category داخل الـLobby كما يفرض التدفق الحالي.  
**ما يجب أن يبقى مخفيًا:** target، reveal، scoring، round state، Firebase authority، وأي حالة لا تعرضها الواجهة الحالية.

## الاتجاهات الثلاثة

| الاتجاه | الوصف | القرار |
|---|---|---|
| A — بطاقة 1v1 مستقلة مطابقة لبطاقة 2v2 | بطاقة compact ذات icon، اسم الوضع، وصف قصير، شارات `2 players` و`Private duel`، وزر دخول واضح. تُعرض على Home فقط، بينما يبقى Category داخل Lobby. | **مختار**؛ أوضح على 320–390px ويطابق grammar الموقع الحالي. |
| B — 1v1 داخل Select Category مع إخفاء الصور فقط | إبقاء القسم الحالي واستبدال صور Category بعنوان 1v1 أو زر واحد. | مرفوض؛ يترك العلاقة المفاهيمية الخاطئة بين mode وcategory ويحتفظ بقسم زائد. |
| C — بطاقة 1v1 كبيرة مستقلة مع hero بصري جديد | إنشاء Hero مشابه لواجهة تسويقية كبيرة ثم زر انتقال. | مرفوض؛ يكرر مشكلة Home الحالية ويؤخر Create/Join، كما يبتعد عن تصميم Four و2v2 الصغير. |

## الدفعة الحالية من ثلاث إضافات

1. إضافة بطاقة Home مستقلة لـ1v1 تشبه بطاقة 2v2 وتستخدم مسار التنقل الحالي `/one-v-one`.
2. إخفاء قسم `Select Category` من عرض Home عندما يكون السياق 1v1، دون حذف `CATEGORY_META` أو تغيير `actions.setCategory` أو validation.
3. إبقاء واجهة 1v1 داخل Lobby compact، مع عرض هوية الوضع وCreate/Join فقط في أعلى المسار، وإزالة أي تكرار بصري للـCategory من بوابة Home.

## العقد المحمية

لا تغيير في route outcome، `navigate` callback، `actions.setMode`، `actions.setCategory`، `handleCreateRoom`، `handleJoinRoom`، room lifecycle، Firebase، room capacity، أو state ownership. التعديل مسموح فقط في render conditions، wrappers، copy، classes، وpresentation composition.

## عقد الحركة والاستجابة

لا تُضاف حركة جديدة للبطاقة أو القسم. الانتقال بين Home وLobby يظل انتقال route الحالي. الأزرار تحافظ على `touch-feedback` الموجود، ولا نضيف `transition-all` أو transform جديدًا. عند 320–390px تتكدس البطاقة عموديًا، ويحافظ زر الدخول على عرض كامل وارتفاع لمس مناسب.

## بوابات التحقق

يجب أن يثبت الفحص أن Home يعرض بطاقة 1v1 مستقلة، وأن Category لا تظهر في Home الخاص بـ1v1، وأن Category لا تزال متاحة داخل إعداد الغرفة الحالي، وأن الضغط على البطاقة يصل إلى `/one-v-one`، وأن build ينجح، وأن ملفات Firebase/context لم تتغير.


# Home + 1v1 Scale Pass — Addition Batch 7–9

## قرار التنفيذ

**المشكلة المرئية:** Home يكرر Room Status كبيرًا ورسالة `Create or join a room first`، بينما 1v1 يكرر بطاقة تعريفية منفصلة عن غرفة الإعداد ويعرض نصوصًا أطول من حاجة شاشة الهاتف.

**الوظيفة الأساسية:** على Home يختار اللاعب الوضع بسرعة؛ داخل 1v1 ينشئ أو ينضم إلى غرفة ثنائية دون بطاقة تعريفية زائدة أو ازدحام بصري.

**الاتجاه المختار:** Compact command surface؛ تُحافظ Home على بطاقات الأوضاع، ويُعرض الاتصال في capsule سفلية مختصرة، ويُحذف header التعريفي الزائد داخل 1v1، بينما يبقى Create/Join switch والـhandlers كما هما. في Lobby يصبح العنوان `LBY` بصريًا فقط مع إبقاء معنى اللاعبين والـroom واضحًا.

**اتجاهان مرفوضان:** (1) إخفاء Room Status بالكامل، لأنه يلغي إشارة الاتصال المفيدة. (2) نقل Room Status إلى نافذة أو tooltip، لأنه يضيف اكتشافًا ضعيفًا وحركة/تفاعلًا غير ضروريين على الهاتف.

## نطاق وحماية

المسموح: `src/pages/LobbyPage.jsx` و`docs/design-decision-record.md` فقط؛ تعديل JSX presentation wrappers وcopy وTailwind classes وشروط العرض غير المالكة للحالة. غير المسموح: callbacks، effects، state setters، routes، Firebase/context، room lifecycle، category validation، gameplay، scoring، rounds، target privacy، أو disabled/loading truth.

**Control trace محفوظ:** Create Room → `handleCreateRoom` → `actions.createRoom`؛ Join Room → `handleJoinRoom` → `actions.joinRoom`؛ Start Game → `handleStartGame` → `actions.startGame`؛ mode rail → `handleModeRailSelect`.

## State projection and responsive contract

Room Status يحتفظ بحالات ready/error/connecting/local/recovery من نفس المصادر الحالية، لكن في capsule مضغوطة. رسائل الخطأ والاستعادة لا تُحذف. `Create or join a room first` يُزال من Home idle فقط لأنه تكرار بصري؛ لا يتغير شرط Start Game. 1v1 يحتفظ بحالات idle/loading/waiting/error والحد الدقيق للاعبين، وتُزال فقط الجملة التوضيحية الزائدة.

على 320–390px لا يحدث overflow أفقي؛ أزرار Create/Join تبقى equal-width بارتفاع لمس لا يقل عن 44px؛ الحقول تظل stacked؛ Room Status يلتف نصه داخل capsule؛ لا تُضاف حركة جديدة.

**Motion handoff:** لا motion diff مقصود. الانتقالات الموجودة لا تُعاد صياغتها ولا تُوسّع إلى `transition-all` جديد. `MOTION_SOURCE_VERIFIED`; runtime motion review remains pending until build/browser review.

## بوابات القبول

Build succeeds; changed source remains presentation-only; Home no longer shows the large status stack or idle room-entry beacon; 1v1 no longer shows the decorative entry header or long 1v1 join note; 1v1 route, create/join callbacks, category placement, and exact-two-player validation remain source-identical; mobile widths 320/360/390 have no horizontal overflow; constitution result is `NO CONSTITUTION CHANGE`.

**Rollback:** revert only the LobbyPage presentation diff and this record if build, contract audit, or responsive review fails.


## Visual Evolution — 1v1 adopts the 2v2 entry composition

**Player context:** لاعب هاتف يريد فتح غرفة 1v1 أو الانضمام إليها بأقل تردد. **Primary job:** إدخال الاسم/الكود ثم اختيار Create أو Join. **Expected next state:** نفس callbacks الحالية تفتح الغرفة أو تنضم إليها؛ لا يتغير أي state owner. **Must remain hidden:** تفاصيل الهدف، الجولات، scoring، وFirebase authoritative state.

**Compared directions:**

| Direction | Description | Decision |
|---|---|---|
| A — Reference transfer | نقل grammar الخاصة بالصورة: eyebrow/status، عنوان mode كبير، بطاقة إعداد واحدة، inputs متتابعة، ثم `SELECT AN ENTRY ROUTE` مع Create/Join | **Selected**؛ أقرب لما طلبه المستخدم، واضح على 320–390px، ويستعمل بنية controls الحالية |
| B — Duel split-screen | وضع Create وJoin في عمودين متجاورين مع لوحة 1v1 مقابلة | Rejected؛ يضغط الحقول على الهاتف ويخالف أولوية mobile-first |
| C — Compact command rail | شريط أفقي شديد الاختصار مع drawer للحقول | Rejected؛ يخفي مدخلات أساسية ويزيد تكلفة التفاعل ولا يطابق المرجع |

**Implementation contract:** allowlisted presentation-only JSX/Tailwind in `src/pages/LobbyPage.jsx` and existing visual tokens only. Preserve `handleCreateRoom`, `handleJoinRoom`, `handleStartGame`, `actions.createRoom`, `actions.joinRoom`, mode/category handlers, routes, effects, listeners, disabled/loading truth, and all Firebase/gameplay behavior. No new dependency, no new state, no callback reorder or duplication. Motion review scope is limited to existing CSS transitions; no new animation is introduced.

**Selected visual mapping:** `2v2 TEAM BATTLE` → `1V1 GUESS WHO`; `FOUR PLAYER MODE` → `1V1 DUEL MODE`; `Four connected players` → `Two players`; `squad/team` → `rival/duel`; `Types of Sports` remains the existing category source; Room Code and Create/Join controls retain their existing handlers.

**Verification gates:** source trace of protected callbacks, no Firebase diff, responsive overflow review at 320/360/390px, focus-visible controls, reduced-motion preservation, and motion review limited to the changed presentation diff.


## Visual Evolution — Mobile lobby simplification (2026-08-22)

### Intent
تبسيط واجهات 1v1 وFour و2v2 على عرض الهاتف، والاكتفاء باسم النمط ووصف قصير قبل الدخول، مع اعتماد نفس التسلسل المرئي في Create/Join وWaiting Room بدل نسخ منطق جديد إلى 1v1.

### Approved presentation changes
- اختصار النص العلوي إلى اسم النمط ووصف من سطر واحد.
- حذف helper copy الزائد داخل إعداد الغرفة، مع إبقاء labels اللازمة للإتاحة والحقول المطلوبة للتدفق.
- تصغير Host Name وCreate Room وJoin Room بصريًا عبر القالب المشترك.
- عدم عرض Lobby ككتلة كبيرة مستقلة؛ استخدام عنوان Waiting Room المختصر بعد إنشاء الغرفة.
- تطبيق نفس hierarchy المرئي على 1v1 مع اختلاف الاسم والسعة فقط.

### Protected boundaries
لا تعديل على handlers أو Firebase mutations أو room entry/code flow أو route intent أو player/round/scoring/target rules. لا إضافة motion جديدة؛ الترانزيشنات الموجودة تبقى كما هي مع احترام prefers-reduced-motion.

### Verification contract
الفحص المطلوب: source audit، build، ثم مراجعة 320/360/390px للـHome و1v1 وFour و2v2، والتأكد من أن إنشاء الغرفة والانضمام والـWaiting Room لا تتغير دلالتها.

### Constitution status
NO CONSTITUTION CHANGE.


# Result + Round Transition Clarity — Addition Batch 33–35

## Mode and scope lock

**Mode:** DESIGN_AND_IMPLEMENT / FRONTEND_IMPLEMENTATION.

**Player context:** لاعب على هاتف 320–390px أنهى جولة ويريد أن يفهم خلال ثانية واحدة: من فاز، ماذا حدث في هذه الجولة، ومتى تبدأ الجولة التالية. **Primary job:** قراءة النتيجة الأساسية ثم انتظار الانتقال المتزامن دون تشتيت. **Expected next state:** نفس phase/state transition وFirebase-authoritative advance الحاليان. **Must remain hidden:** أي target أو reveal لا يقدمه المصدر الحالي، وأي scoring أو synchronization internals غير المعروضة حاليًا.

**Protected:** `actions.advanceRound`, `actions.resetMatch`, `actions.leaveRoom`, `actions.resolveVoting`, countdown timestamp calculation, host-only advance condition, Firebase reads/writes/listeners/transactions, round count, scoring, winner computation, team assignment, target privacy, routes, callbacks, effects, and disabled/loading truth.

**Allowlisted presentation files:** `src/pages/GameResultsPage.jsx`, `src/pages/CompetitiveModePage.jsx`, `src/components/game/RoundRevealPanel.jsx`, `src/index.css`, and this record only. No context, Firebase, game engine, router, package, or configuration edits.

## Evidence from current repository

| Surface | Current source projection | Visual issue addressed |
|---|---|---|
| 1v1 / shared results | `GameResultsPage.jsx` lines 228–332 | The main winner/result, target reveal, countdown, reactions, standings, and actions compete as equal-weight blocks. |
| 2v2 and Four round result | `CompetitiveModePage.jsx` `TeamResult` | Team winner is present, but scoreboard, target reveal, all-player rows, and transition copy are stacked without a single compact focal hierarchy. |
| 2v2 and Four final result | `CompetitiveModePage.jsx` `FinalTeamResult` | Final winner is readable, but the winner cue and score hierarchy can be more immediate on mobile. |
| Shared target reveal | `RoundRevealPanel.jsx` | Generic English explanatory copy is repeated and visually heavy, especially when the result already states the outcome. |
| Shared motion | `index.css` `.ng-transition-beacon` and existing reduced-motion rules | The beacon is reusable, but needs a calmer, shared result/transition visual language rather than additional decorative motion. |

## Three visual directions compared

| Direction | Composition | Mobile behavior | Motion/accessibility | Decision |
|---|---|---|---|---|
| A — Winner-first command card | One compact hero row for winner/team and score context, then a quiet secondary reveal/standings stack, with a single shared transition beacon. | Keeps the essential answer above the fold; secondary details wrap below. | Uses existing state projection; no new timers or animations; reduced-motion safe. | **Selected** |
| B — Full-screen celebration | Large winner artwork, glow, confetti-like pulses, and a dominant countdown. | High visual impact but pushes round details below the fold and risks distraction between frequent rounds. | More motion and sensory load; rejected for repeated 5-second use. | Rejected |
| C — Dense dashboard grid | Equal cards for winner, reveal, score, reactions, and countdown. | Information-rich but forces scanning and creates cramped 320px layouts. | More borders and competing emphasis; weak result comprehension. | Rejected |

## Selected visual contract

The selected system is **Winner-first / Transition-second / Details-on-demand**. The first visual layer states `ROUND RESULT` or `MATCH COMPLETE`, the winning name/team, and the relevant score/points already present in state. The second layer is one calm `NEXT ROUND` beacon using the existing countdown value and existing `role=status` semantics. Reveal, reactions, chat, and standings remain available below as secondary information; no data is removed from the current state projection unless it is redundant copy.

The visual language uses existing NEON GUESS tokens: cyan for primary active/ready signals, violet for secondary result emphasis, white/grey for structure, and red only for errors. No new dependency or asset is added. The countdown is a determinate status signal, not a celebration: no pulsing scale, no looping keyframes, and no movement that competes with the winner. The design follows W3C guidance to eliminate unnecessary motion and honor `prefers-reduced-motion` [1] [2], uses a consistent progress/status treatment inspired by Material 3 progress indicators [3], and applies progressive disclosure so secondary result detail does not compete with the primary answer [4].

## State projection and motion contract

The winner name/team, points, standings, round number, reveal data, and countdown remain direct projections of existing state/props. No local source of truth is introduced. Existing `setInterval`, timestamp math, host guard, and actions remain source-identical. Any CSS transition added is limited to `transform`/`opacity` or existing color/border properties, stays below 300ms, uses `ease-out`, is gated for fine pointers where hover is involved, and has a reduced-motion fallback. The five-second wait itself is not animated; only its visual progress/status presentation may change.

## Verification contract

Build must pass. Changed files must remain within the allowlist. Source audit must show unchanged callbacks, effects, timestamp math, winner/score calculations, Firebase operations, routes, and state ownership. The result hierarchy must remain readable at 320px, 360px, and 390px without horizontal overflow. `role=status` and `aria-live` remain present for transition status. The motion review must find no new feel-breaking motion, and reduced-motion CSS must remain effective. Runtime visual review is required before claiming READY.

## References

[1]: https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html "W3C Understanding SC 2.3.3: Animation from Interactions"
[2]: https://www.w3.org/WAI/WCAG22/Techniques/css/C39 "W3C Technique C39: prefers-reduced-motion"
[3]: https://m3.material.io/components/progress-indicators/overview "Material Design 3: Progress indicators"
[4]: https://www.nngroup.com/articles/progressive-disclosure/ "Nielsen Norman Group: Progressive Disclosure"


# Result + Transition — Addition Batch 36–38

## Mode and scope

**Mode:** DESIGN_AND_IMPLEMENT. **Target:** shared Result/Transition visual language for 1v1, 2v2, and Four. **Player job:** identify the winner immediately, understand that the next round is synchronized, and inspect reveal details only when needed. **Allowed file:** `src/index.css` plus this record. **Protected:** all state, callbacks, timers, scoring, winner computation, reveal timing, Firebase operations, routes, effects, and disabled/loading truth remain untouched.

## Three completed additions

| Addition | Player problem | Presentation change | Motion/accessibility behavior |
|---|---|---|---|
| 36 — Winner identity rail | The winner card could blend into the surrounding neon surface at narrow widths. | Added a thin cyan-to-violet identity rail to `.ng-winner-card`, while keeping the existing winner name, avatar, and score projection unchanged. | No new animation; decorative pseudo-element is pointer-inert and does not affect focus order. |
| 37 — Calm transition rail | The five-second transition needed a clearer status boundary without becoming a celebration. | Added a quiet horizontal status gradient and a 2px bottom rail to `.ng-result-transition`. | No looping keyframe, scale, or timer change; the existing countdown and `role=status` remain authoritative. |
| 38 — Secondary reveal rhythm | Target-reveal cards needed clearer grouping and less scan noise on 320–390px screens. | Added a minimum readable card height, restrained hover treatment for fine pointers only, and clearer uppercase grouping. | Transition is limited to border/background color at 180ms ease-out; disabled under `prefers-reduced-motion`; no layout property is animated. |

## Design review

The selected direction remains Winner-first / Transition-second / Details-on-demand. A celebration-heavy direction was rejected because the transition repeats frequently and would compete with the winner. A dense equal-card dashboard was rejected because it increases scanning cost on small screens. The three additions use existing NEON GUESS color tokens and preserve the product's command-card language.

## Verification contract

Required gates: changed-file scope audit; protected-contract audit; build; 320/360/390px overflow and wrapping review; focus and reduced-motion review; motion source review; and runtime screenshot review when the development server is accessible. A silent or timed-out command is not treated as a pass. No Gameplay Constitution change.


# Result Roadmap Batch 39–41

**Mode:** AUTONOMOUS_CONTINUATION / DESIGN_AND_IMPLEMENT. **Target:** shared 1v1 Result surface in `GameResultsPage.jsx`, with the same shared CSS language available to the existing Result presentation. **Protected:** countdown source, round transition effect, winner computation, standings order and points, callbacks, Firebase, routes, and disabled/loading truth.

| Addition | Player problem | Implementation | Preserved contract |
|---|---|---|---|
| 39 — Countdown progress projection | The five-second wait had a clear number but no quiet sense of remaining time. | Added `data-countdown={revealSecondsLeft}` to the existing transition wrapper and a CSS-only 5–0 progress projection. | The existing `revealSecondsLeft` remains the only source; no timer, effect, callback, or round action changed. |
| 40 — Mobile standings lane | Standings rows needed a stable presentation hook for compact mobile treatment. | Added `ng-standings-board` and `ng-standing-row` presentation classes only. | Player order, score values, winner projection, and standings computation are unchanged. |
| 41 — Result action focus lane | Keyboard users needed a stronger focus boundary around Exit, Dashboard, Play Again, and existing Result controls. | Added `focus-visible` outline/halo styling and 320–390px minimum-height/padding tuning to the existing action rail. | Existing buttons, callbacks, disabled state, loading text, and navigation outcomes remain unchanged. |

## Motion handoff and review

The only new motion is the progress rail's `width` transition, which is a state-projection decoration tied to the existing five-second countdown. It is 180ms, `ease-out`, non-looping, interruptible through CSS retargeting, and disabled under `prefers-reduced-motion`. The focus lane uses no new animated property. The current source review found no new `transition: all`, `scale(0)`, `ease-in`, ungated hover motion, keyframes, or layout animation in this batch. Runtime motion verification remains pending.

## Verification status

The changed-file audit was attempted on the connected Windows project. Output confirmed the active files and showed the existing protected logic in context, but the shell operation timed out while the existing build log remained empty. Therefore build and runtime checks are not treated as passes. No Firebase/gameplay changes were made in the patch. Rollback boundary: revert the `Addition 39–41` entries in `GameResultsPage.jsx` and the corresponding CSS blocks in `src/index.css`.


# Autonomous Continuation Batch 42–44

**Mode:** AUTONOMOUS_CONTINUATION. **Target:** shared Result presentation surface in `GameResultsPage.jsx` and its CSS. **Player job:** understand standings, error/waiting state, and action availability quickly on a 320–390px screen. **Protected:** scoring, standings computation/order, timers, reveal transitions, callbacks, disabled/loading truth, navigation, Firebase, room lifecycle, multiplayer synchronization, and target privacy.

| Addition | Player problem | Implementation | State and control trace preserved |
|---|---|---|---|
| 42 — Compact Standings Lane | Long names and generous row spacing reduced scan speed on narrow screens. | Added mobile-only density rules for `ng-standings-board` and `ng-standing-row`, including ellipsis for long names. | Existing `standings.map`, `player.id`, `player.pts`, and winner ordering remain unchanged. |
| 43 — Result State Rails | Error and automatic-advance messages were visually close to ordinary secondary copy. | Added `ng-result-alert` and `ng-result-waiting` presentation hooks and restrained rails/backgrounds. | Existing `actionError`, `role=alert`, host/config branch, message copy, and automatic advance behavior remain unchanged. |
| 44 — Waiting/Loading Action Signal | Disabled and pending actions needed clearer visual affordance on mobile. | Added dashed disabled treatment and a small current-color status dot to existing disabled buttons. | Existing buttons, callbacks, disabled predicates, pending text, and navigation outcomes remain unchanged. |

## Motion handoff and review

Batch 42 contains no motion. Batch 43 contains no motion. Batch 44 contains no new transition or keyframe; the `filter` change is static for the disabled state and is removed under reduced motion. No hover motion was added. The motion purpose is therefore limited to preserving the existing action truth visually, not introducing a new animated state.

## Verification and rollback

Source-level verification: presentation hooks and CSS selectors only; no state owner, callback, effect, listener, Firebase call, timer, route, scoring expression, or data flow was changed. `prefers-reduced-motion` remains honored for the disabled action treatment. Runtime, build, screenshot, keyboard, and content-wrapping evidence remain pending if the Windows process does not return a clear exit code. Rollback boundary is the `Addition 42–44` blocks in `src/index.css` plus the two presentation class additions in `GameResultsPage.jsx`.


## Addition 45 — 1v1 Visual Parity with 2v2/Four Room Entry

**Date:** 2026-08-22

**Decision:** Align the 1v1 room-entry and waiting-room presentation with the established 2v2/Four command-card language. The 1v1 branch now uses the same Create/Join placement, room header wording, compact mode badge, rounded surfaces, input sizing, action sizing, waiting-room card density, and mobile radius treatment. Only the mode identity remains different: `1V1`, `1v1 Guess Who`, two-player capacity, and the existing 1v1 category/control rules.

**Protected boundary:** No changes to `handleCreateRoom`, `handleJoinRoom`, `handleStartGame`, `actions.*`, Firebase listeners/transactions, player limits, category state, room phase, navigation outcomes, scoring, timers, or winner logic. The JSX changes are presentation wording/placement only; the CSS changes are scoped to `.ng-1v1-reference-lobby` and `.ng-1v1-waiting-column`.

**Motion review:** No new keyframes or layout animation were introduced. Existing transitions remain bounded; reduced-motion disables the scoped transitions. The 1v1 visual parity layer is APPROVED at source level.

**Verification limitation:** The Windows build command did not return a clear completion result because the attached shell session entered an incomplete PowerShell command state. Runtime screenshots at 320–390px remain required before declaring release readiness.


## Auto Mode — 1v1 True Competitive Parity (Additions 157–166)

### Mode and target

AUTONOMOUS EXECUTION was authorized after the DESIGN_ONLY audit. The target was the 1v1 room-entry and waiting-room visual surface in `LobbyPage.jsx`, using the established Competitive Scale from 2v2/Four as the reference.

### Visual gaps addressed

The previous 1v1 screen was not perceived as matching 2v2/Four because CSS-only overrides could not replace its different DOM composition. This pass establishes one scoped visual system for the existing 1v1 nodes: compact room header, segmented Create/Join control, category and identity fields, primary actions, join context, and waiting-room/player rows. The visual changes are scoped to `.ng-1v1-reference-lobby` and `.ng-1v1-waiting-column`.

### Ten visual improvements

The pass covers a compact 1v1 shell, unified surface tokens, a restrained segmented control, a room launch header, a compact 1V1 mode badge, aligned category/identity cards, shared input sizing, consistent primary and secondary buttons, a compact join context, and a matching waiting-room surface/player-row treatment. Mobile rules force full-width actions and preserve the 48px-scale interaction area.

### Protected boundary

No React state, Firebase operation, room action, callback, timer, route, navigation outcome, scoring rule, category data, or player validation rule was intentionally changed. The implementation is presentation-only CSS scoped to the existing 1v1 markup. `vite build` returned `EXIT_CODE=0` after the Auto Mode pass.

### Motion and accessibility contract

The pass uses only short transitions on transform, colors, borders, and shadows. There are no new keyframes, no `transition: all`, and no layout animation. Hover elevation is limited to pointer-capable interaction patterns, and `prefers-reduced-motion` disables the new transitions and hover transform. Inputs and buttons retain visible focus rings and minimum mobile hit heights.

### Verification status

Build passed. Runtime screenshot verification at 320px, 360px, and 390px remains a separate gate because the connected browser session did not provide a reliable rendered capture in this run. Release status is CONDITIONAL until those runtime captures confirm no overflow or unexpected cascade conflict.


## Auto Mode — Home Scale Continuation (Additions 167–169)

### Scope

This pass continues Auto Mode on the Home mode gateway. It is presentation-only and scoped to the existing `ng-home-gateway`, `premium-2v2-hero`, and `premium-1v1-hero` surfaces.

### Visual additions

Addition 167 establishes equal card rhythm for the 2v2 and 1v1 entry cards: shared padding, radius, surface gradient, shadow, icon tile proportion, and compact spacing. Addition 168 improves mobile copy hierarchy with balanced text wrapping, quieter kicker labels, and smaller feature pills so descriptions do not dominate the action. Addition 169 unifies the entry buttons with the site's compact action language: consistent height, radius, letter spacing, shadow, hover lift for pointer-capable devices, and reduced-motion fallback.

### Protected systems

No navigation handler, route, state, mode selection, Firebase operation, callback, scoring rule, timer, or room lifecycle was changed. Existing button actions remain the source of truth.

### Motion review

The only new motion is a 180ms ease-out hover lift and color/shadow transition on the two existing Home entry buttons. It is disabled by `prefers-reduced-motion` and is not applied as a mobile-only interaction. No keyframes, layout animation, or `transition: all` were introduced.

### Verification

The clean Windows build command returned `BUILD_EXIT=0`. Runtime screenshots at 320px, 360px, and 390px remain a separate visual gate because the connected browser capture was not available in this pass.


## Auto Mode — Home Interaction Clarity Continuation (Additions 170–172)

### Target and player job

The target is the existing Home mode gateway cards and their entry controls. The player's job is to compare the available modes quickly, understand the selected action, and enter the chosen room flow without visual friction.

### Direction decision

Three directions were considered. (A) stronger neon decoration was rejected because the cards already carry enough accent and the action hierarchy would weaken. (B) animated card choreography was rejected because Home is a high-frequency navigation surface and motion would add distraction without explaining state. (C) calm interaction clarity was selected: explicit focus-visible treatment, pointer-gated hover, and a clearer card/action relationship on narrow screens.

### Planned visual additions

Addition 170 will gate Home hover elevation to fine pointers and add explicit focus-visible treatment to the existing entry buttons. Addition 171 will establish a clearer action lane on mobile so the button remains visually attached to its mode card without relying on hover. Addition 172 will improve the card's responsive rhythm and prevent long labels or pills from creating horizontal overflow.

### Implementation contract

Allowed files: `src/index.css` and the design decision record. No JSX, state, callbacks, navigation, routes, Firebase, room lifecycle, timers, scoring, or mode-selection logic will be changed. Existing button DOM and handlers remain untouched. No new keyframes, dependencies, or local state are permitted.

### Motion contract

Only the existing 180ms interaction transition may remain. Hover motion must be gated with `@media (hover: hover) and (pointer: fine)`. Focus-visible is static emphasis. `prefers-reduced-motion` must remove transform and transition. No layout properties may animate.

### Verification gates

Check CSS syntax through the project build, inspect the diff scope, run the animation review against the changed motion only, and separately report runtime viewport verification if available.


## Auto Mode — Home Interaction Clarity (Additions 170–172)

### Implemented scope

This pass refined the existing Home 1v1 and 2v2 entry cards without changing their DOM, labels, handlers, or routes. The target was interaction clarity rather than additional decoration.

Addition 170 adds a static `:focus-visible` lane and neutralizes the earlier broad hover elevation as a default, so keyboard focus is explicit and touch devices do not inherit pointer-only affordances. Addition 171 creates a stable action lane: the existing entry button remains attached to the mode card, fills the available action width, and wraps text safely without depending on hover. Addition 172 adds narrow-screen overflow protection for headings, descriptions, and pills and slightly tightens the mobile action rhythm.

### Motion review

The only allowed motion remains the existing bounded 180ms transition. Hover elevation is now gated by `@media (hover: hover) and (pointer: fine)`. Focus-visible styling is static. No keyframes, layout animation, `transition: all`, timer, or state source was introduced. `prefers-reduced-motion: reduce` removes transition and transform.

### Protected-system audit

Only `src/index.css` and this record were changed in this pass. No React state, JSX, Firebase listener/transaction, scoring, timer, room lifecycle, callback, route, navigation outcome, or mode-selection logic was changed.

### Verification

The Windows project build completed with `BUILD_EXIT=0`. Runtime screenshots at 320px, 360px, and 390px remain a separate visual gate and were not claimed as verified in this pass.

### Status

Source-level motion review: APPROVED. Build: PASSED. Release readiness: CONDITIONAL pending runtime viewport review.


## Auto Mode — Home Scale Continuation / Additions 173–175

تم تنفيذ دفعة عرضية جديدة على بطاقات Home الخاصة بـ1v1 و2v2 فقط.

| Addition | Decision | Protected boundary |
|---|---|---|
| 173 — Mode Identity Rail | إضافة شريط هوية جانبي هادئ يربط البطاقة بلغة NEON GUESS البصرية دون زخرفة زائدة | لا تغيير في markup أو copy أو navigation |
| 174 — Stable Mode Identity Block | تثبيت محاذاة الأيقونة والعنوان والـkicker ومنع تمدد المحتوى الطويل | لا تغيير في state أو handlers أو routes |
| 175 — Compact Mobile Rhythm | تحسين المسافات وحجم الوصف وارتفاع زر الدخول عند الشاشات الضيقة | لا تغيير في button behavior أو responsive logic خارج CSS |

### Motion review

لا توجد keyframes جديدة ولا `transition: all` ولا layout animation. أي تفاعل محدود بانتقالات CSS قصيرة، ويعمل hover فقط ضمن قواعد المؤشر الدقيق. تم الحفاظ على `prefers-reduced-motion: reduce` لإلغاء الانتقالات والتحويلات.

### Verification

- `BUILD_EXIT=0` عبر `npm.cmd run build` على نسخة Windows الفعلية.
- التغيير محصور في `src/index.css` لهذا الدفعة.
- لم يتم تغيير Firebase أو scoring أو timers أو rounds أو callbacks أو routes أو navigation outcomes.
- runtime screenshot verification على 320px/360px/390px لم تُنفذ في هذه الدورة؛ لذلك الحالة تبقى `CONDITIONAL` حتى تتم مراجعة المتصفح الفعلية.


## Auto Mode — Home Scale Continuation / Additions 176–178

### الهدف والاتجاه المختار

استكمال تحسين بطاقات Home الخاصة بـ1v1 و2v2 من خلال اتجاه **Compact signal + stable action**: جعل إشارات الوضع قابلة للالتفاف، فصل مسار الدخول بصريًا دون إضافة طبقة جديدة، والحفاظ على استجابة الضغط واضحة من دون حركة تخطيطية. الاتجاه البديل المرفوض هو إضافة شارات أو بطاقات جديدة؛ لأنه يزيد كثافة Home ويكرر هوية الوضع الموجودة بالفعل.

### الإضافات

| Addition | التنفيذ | السبب | الحد المحمي |
|---|---|---|---|
| **176 — Metadata rhythm** | تحسين التفاف الـpills وتثبيت عرضها داخل بطاقة الوضع حتى لا تسبب النصوص الطويلة overflow على 320–390px. | يحافظ على قابلية القراءة ويمنع انكسار بطاقة Home. | CSS فقط؛ لا تغيير في copy أو state أو markup. |
| **177 — Action separation** | إضافة فصل بصري هادئ أعلى زر الدخول مع focus-visible أوضح. | يربط الزر بمحتوى البطاقة ويجعل قرار الدخول مفهومًا دون زخرفة إضافية. | نفس الزر وhandler وroute outcome كما هي. |
| **178 — Tactile state** | ضبط حالة الضغط إلى transform وfilter فقط، مع بقاء الحركة قصيرة وإلغاء الحركة عند reduced motion. | يعطي تأكيدًا لمسيًا واضحًا على الهاتف دون تحريك layout. | لا تغيير في disabled/loading أو callbacks أو navigation. |

### عقد الحركة والوصول

لا توجد keyframes جديدة أو `transition: all` أو حركة لخصائص layout. الحركة الجديدة/المحددة محصورة في `transform` و`filter` ضمن مدة الانتقالات الموجودة، وتظل حالة hover محكومة بالقواعد السابقة للأجهزة ذات المؤشر الدقيق. `:focus-visible` ثابت وواضح، و`prefers-reduced-motion: reduce` يلغي transform/filter/transition.

### التحقق المخطط

المسموح تعديلهما في هذه الدفعة هما `src/index.css` و`docs/design-decision-record.md` فقط. يجب تشغيل build، تدقيق نطاق الملفات، مراجعة motion source، وفحص 320px و360px و390px إن أمكن. لا تُعد هذه الدفعة إثباتًا لصحة Firebase أو multiplayer؛ تلك الأنظمة خارج نطاق التعديل.

### Rollback boundary

إزالة كتلة CSS الخاصة بالإضافات 176–178 وهذه الفقرة فقط عند فشل build أو ظهور overflow أو تدهور focus/interaction. لا يُلمس أي ملف من ملفات state أو Firebase أو gameplay.


### نتائج التنفيذ الفعلية — Additions 176–178

تم تشغيل `npm.cmd run build` من المسار الفعلي على Windows، وكانت النتيجة `BUILD_EXIT=0`. أظهر تدقيق CSS عدم وجود `transition: all` في الملف، وعدم إضافة `@keyframes` داخل كتلة هذه الدفعة. كما بقيت التعديلات محصورة في `src/index.css` و`docs/design-decision-record.md`؛ أداة Git لم تعتبر المجلد مستودعًا، لذلك لم يُستخدم Git كدليل على نطاق التغيير.

**MOTION_SOURCE_VERIFIED:** نعم. **MOTION_REVIEW_APPROVED:** نعم على مستوى المصدر؛ الخصائص المتحركة محصورة في transform/filter/transition الموجودة، مع reduced-motion. **MOTION_RUNTIME_VERIFIED:** لا، لم تُلتقط لقطات runtime من المتصفح في هذه الدفعة. **GAMEPLAY_FIREBASE_SCORING_UNCHANGED:** نعم وفق نطاق الملفات والتدقيق النصي المتاح. **الحالة:** `CONDITIONAL` إلى حين فحص بصري runtime على 320px و360px و390px.


## Auto Mode — Room Feedback Scale / Additions 179–181

### القرار

استهداف فجوة غير مكررة في واجهات Lobby وCompetitive: حالات التنبيه والاستعادة والاتصال كانت تظهر كصناديق منفصلة، بينما زر Leave يحتاج وزنًا بصريًا ثانويًا، وإشارات الحالة تحتاج لغة telemetry هادئة. تم اختيار اتجاه **Calm room telemetry** بدل إضافة badges أو motion جديدة؛ لأن مصدر الحقيقة موجود أصلًا في `role`, `aria-live`, و`aria-busy` ولا يجوز إنشاء state محلي جديد.

| Addition | التنفيذ | الهدف | الحماية |
|---|---|---|---|
| **179 — Feedback stack** | توحيد شكل ومسافات عناصر `alert/status/dialog` داخل shell مع wrapping آمن. | قراءة الأخطاء والاستعادة والانتظار كمنظومة واحدة. | لا تغيير في الرسائل أو شروط العرض أو live regions. |
| **180 — Exit control** | ضبط زر Leave ليكون ثانويًا ومضغوطًا مع touch target مناسب. | تقليل منافسته بصريًا مع Create/Join/Start. | نفس الزر و`aria-busy` وcallback. |
| **181 — Room telemetry edge** | إضافة مؤشر بصري ثابت لعناصر status/dialog باستخدام pseudo-element. | تقوية الإحساس بحالة النظام دون اختراع حالة اتصال جديدة. | لا قراءة أو كتابة أو تفسير جديد لحالة Firebase. |

### Motion handoff

لا توجد حركة جديدة مقصودة في 179–181. القواعد الجديدة ثابتة بصريًا، وكتلة reduced-motion تمنع أي transition موروثًا داخل الأسطح المستهدفة. لا keyframes، ولا `transition: all`، ولا layout animation، ولا تغيير في callback أو state.

### التحقق والرجوع

الملفات المسموح بها: `src/index.css` و`docs/design-decision-record.md`. بوابات التحقق: build، تدقيق CSS، فحص عدم تغيير الملفات المحمية، وفحص overflow على 320–390px. نقطة الرجوع هي حذف كتلة 179–181 وهذه الفقرة فقط.


## Auto Mode — 1v1 Room Compression / Additions 182–184

### الهدف والقرار

طلب الدورة هو تقليل الكتلة البصرية لأزرار Create Room، جعل 1v1 أقرب إلى إطار portrait بنسبة 2:3، وتقريب مسار الإنشاء/الدخول من لغة 2v2. تمت مقارنة ثلاثة اتجاهات: (أ) تصغير بصري مع إبقاء touch target، (ب) ضغط كل المحتوى داخل بطاقة ثابتة، (ج) إعادة بناء markup وhandlers. تم اختيار (أ) مع aspect-ratio محدود (ب) لأنهما أقل مخاطرة ويحافظان على markup ومسارات الغرفة. رُفض (ج) لأنه يتطلب تغيير callbacks أو state.

| Addition | التنفيذ | السبب |
|---|---|---|
| **182 — Compact primary actions** | تقليل padding والكتلة المرئية لأزرار Create/Join، مع إبقاء الحد الأدنى للمساحة التفاعلية 44px تقريبًا. | الزر كان يهيمن على شاشة الهاتف، لكن لا يجوز تحويل التصغير إلى هدف لمس صغير. يتوافق ذلك مع إرشادات WCAG 2.2 للحد الأدنى لحجم أهداف pointer input [1]. |
| **183 — 2:3 portrait frame** | تطبيق إطار 1v1 ضيق ومتمركز بنسبة `aspect-ratio: 2 / 3` على عمود الانتظار وبطاقة الإنشاء، مع حدود mobile آمنة. | يحقق الإحساس البصري المطلوب دون تغيير محتوى الغرفة أو انتقالاتها. |
| **184 — Code lane preparation** | حماية التفاف الكود وإضافة class بصري `.ng-room-code-copy` كفتحة تصميمية مستقبلية. | يحافظ على بروز الكود ويمنع overflow، لكن لا يزعم وجود Copy فعلي قبل إضافة handler صريح. |

### قرار Copy

يوجد حاليًا `handleShareInvite`؛ وهو يشارك invite عبر Web Share عند توفره، أو ينسخ نص دعوة كاملًا في fallback. هذا ليس مساويًا لزر Copy Code الذي طلبه المستخدم. لذلك لم تتم إعادة تسمية Share إلى Copy ولم تتم إضافة callback جديد داخل دورة CSS-only. إضافة `navigator.clipboard.writeText(roomCode)` مع حالة نجاح/فشل ستكون **SCOPE_EXPANSION وظيفية صغيرة** لأنها تضيف event behavior وstate projection جديدًا، ويجب تنفيذها في دورة Frontend + Engineering منفصلة بعد تأكيد النطاق.

### Motion review

| Before | After | Why |
|---|---|---|
| لا توجد حركة جديدة في الإضافات 182–184 | لا توجد حركة جديدة مقصودة | الطلب يتعلق بالحجم والنسبة والوضوح، وإضافة motion لزر Copy أو aspect-ratio لن تضيف معنى. |

**MOTION_SOURCE_VERIFIED:** نعم. **MOTION_REVIEW_APPROVED:** نعم؛ لا keyframes ولا `transition: all` ولا layout animation جديدة. **MOTION_RUNTIME_VERIFIED:** لم يتم في هذه الدورة.

### البحث المرجعي

تمت مراجعة إرشادات W3C حول Target Size. المبدأ المقتبس هو الفصل بين الحجم البصري للزر وحجم الهدف التفاعلي؛ لذلك صُغّرت الكتلة البصرية مع الحفاظ على `min-height` مناسب للهاتف [1]. لم تُنسخ شيفرة أو هوية بصرية من المصدر.

### اقتراحات مستقبلية — 10 تحسينات للبحث والتقييم فقط

1. إضافة Copy Code حقيقي مع `aria-label` وحالة نجاح/فشل واضحة، بعد اعتماد نطاق وظيفي منفصل.
2. جعل زر Copy بجانب الكود، لا داخل النص، مع حد لمس مناسب ومسافة كافية عن الكود.
3. توحيد Create وJoin في segmented action lane مستوحى من النمط الحالي في 2v2 دون تغيير handlers.
4. إضافة حالة disabled/loading بصريًا متطابقة بين 1v1 و2v2 وFour مع بقاء المصدر الحالي للحالة.
5. اختبار نسبة 2:3 على 320px و360px و390px مع أطول اسم لاعب وأطول رسالة خطأ.
6. مراجعة copy النصوص فوق النموذج لتقليلها إلى عنوان ونبذة قصيرة فقط.
7. تحسين focus-visible للحقول والأزرار مع اختبار لوحة المفاتيح وعدم الاعتماد على اللون وحده.
8. إضافة empty/error/reconnecting visual baselines للغرفة، دون إدخال state محلية.
9. اختبار RTL/العربية والإنجليزية للكود والأزرار ومنع انقلاب tracking أو اتجاه الأيقونات.
10. إجراء screenshot comparison بين 1v1 و2v2 وFour قبل اعتماد أي إعادة markup.

### التحقق والرجوع

الملفات المعدلة في هذه الدفعة: `src/index.css` و`docs/design-decision-record.md`. نقطة الرجوع هي حذف كتلة 182–184 وهذه الفقرة. لم يتم تعديل Firebase أو room creation/joining أو authentication أو routes أو scoring أو timers أو round lifecycle.

### References

[1]: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html "W3C WAI — Understanding SC 2.5.8: Target Size (Minimum)"


## Auto Mode — Room Header & Form Polish / Additions 185–187

### الاتجاه المختار

تمت مقارنة ثلاثة اتجاهات: تصغير رأس الصفحة فقط، إعادة بناء نموذج الغرفة، أو تحسين المحاذاة والالتفاف داخل البنية الحالية. تم اختيار الاتجاه الثالث لأنه يعالج القراءة على 320–390px بأقل diff، ويحافظ على مسار `Create Room` و`Join Room` كما هو. رُفضت إعادة البناء لأنها قد تمس callbacks أو state أو room lifecycle.

| Addition | التنفيذ | القيمة |
|---|---|---|
| **185 — Mobile header hierarchy** | تقليل تزاحم عنوان الوضع مع Leave على الشاشات الضيقة ودعم التفاف الاسم الطويل. | يوضح أين يوجد اللاعب دون إخفاء زر الخروج أو قص العنوان. |
| **186 — Form row alignment** | تثبيت سلوك labels والحقول داخل صفوف النموذج ومنع تمددها خارج الحاوية. | يجعل إنشاء/دخول الغرفة أقرب إلى لغة 2v2 وأكثر قابلية للمسح البصري. |
| **187 — Room code hierarchy** | إبقاء الكود هو العنصر الأقوى، مع التفاف آمن للنصوص الداعمة وتكييف حجم الكود. | يحسن مشاركة الكود وقراءته دون تغيير طريقة توليده أو دخوله. |

### Motion review

لا توجد حركة جديدة في 185–187. القواعد تعدل الحجم والالتفاف والمحاذاة فقط؛ لا keyframes، ولا `transition: all`، ولا حركة لخصائص layout. لا يوجد hover motion جديد. **MOTION_SOURCE_VERIFIED: نعم. MOTION_REVIEW_APPROVED: نعم. MOTION_RUNTIME_VERIFIED: غير منفذ.**

### الحماية

التعديلات محصورة في `src/index.css` و`docs/design-decision-record.md`. لم تتغير handlers أو state أو effects أو Firebase أو authentication أو routes أو scoring أو timers أو rounds أو room lifecycle أو navigation outcomes.

### نقطة الرجوع

حذف كتلة CSS الموسومة `ROOM HEADER & FORM POLISH / ADDITIONS 185–187` وهذه الفقرة فقط.


## Functional Micro-Expansion — 1v1 Copy Code

تم تنفيذ التوسع الوظيفي المحدود بعد موافقة المستخدم الصريحة. أضيف `copyStatus` محلي و`handleCopyRoomCode` داخل `LobbyPage.jsx`، ويظهر زر Copy فقط عندما يكون المسار `/one-v-one` ويكون `roomCode` موجودًا. النسخ يستخدم Clipboard API عند توفرها، مع fallback تقليدي، ويعرض نجاحًا أو فشلًا عبر `role="status"` و`aria-live="polite"`.

| Boundary | Result |
|---|---|
| Firebase reads/writes/transactions/listeners | لم يتغير |
| Room creation/joining/lifecycle | لم يتغير |
| Gameplay, scoring, timers, rounds, reveal | لم يتغير |
| Routes/navigation outcomes | لم تتغير |
| Existing Share Invite | بقي كما هو |
| New behavior | نسخ `roomCode` فقط في 1v1 بعد ضغط المستخدم |

### Motion review

زر Copy لا يضيف keyframes أو animation جديدة. يعتمد على النمط البصري الموجود، وhover الخاص به محصور في `@media (hover: hover) and (pointer: fine)`. لا توجد حركة لخصائص layout، و`prefers-reduced-motion` مغطى في CSS. **MOTION_SOURCE_VERIFIED: نعم. MOTION_REVIEW_APPROVED: نعم.**

### Verification

تم تشغيل `npm.cmd run build` على نسخة Windows الفعلية وكانت النتيجة `BUILD_EXIT=0`. فشل أمر `git status` برمز 128 لأن المجلد ليس Git working tree؛ وهذا لا يؤثر على نتيجة build، لكنه يعني أن تدقيق diff عبر Git غير متاح في هذا المسار. تم بدلًا منه تدقيق scope نصيًا، وظهرت الإضافات فقط في `LobbyPage.jsx` وطبقة CSS وسجل DDR.

فحص runtime الفعلي للضغط على Copy، وصلاحية Clipboard في المتصفح، ومقاسات 320px و360px و390px لم يُنفذ بعد. الحالة: **CONDITIONAL**.


## Auto Mode — 1v1 Copy Code Polish / Additions 188–190

تم تنفيذ ثلاث تحسينات عرضية حول زر Copy الذي أضيف في دورة Copy Code السابقة. حافظت الدفعة على السلوك القائم، وركزت على تماسك صف الكود، وضوح affordance، وثبات مساحة رسالة النجاح أو الفشل.

| Addition | Implementation | Protected boundary |
|---|---|---|
| **188 — Code lane** | جعل الكود والزر وحدة مرنة تمنع overflow على المقاسات الصغيرة. | لا تغيير في roomCode أو مصدره. |
| **189 — Copy affordance** | تثبيت عرض الزر، focus ring، وحالة ضغط بصرية محدودة. | لا تغيير في handler أو Clipboard behavior. |
| **190 — Stable feedback** | حجز سطر ثابت لحالة النسخ حتى لا تقفز البطاقة عند ظهور الرسالة. | لا state جديد ولا تغيير في room lifecycle. |

### Motion review

الحركة الوحيدة هي `transform: scale(0.96)` عند الضغط، وهي حركة قصيرة مرتبطة مباشرة بتغذية اللمس. لا توجد keyframes أو `transition: all` أو حركة لخصائص layout. تم الحفاظ على reduced-motion بإلغاء transform عند `prefers-reduced-motion: reduce`. **MOTION_SOURCE_VERIFIED: نعم. MOTION_REVIEW_APPROVED: نعم.**

### Verification contract

سيتم تشغيل build على نسخة Windows الفعلية، مع فحص نصي للـmarker وغياب تغييرات Firebase أو server أو configuration. فحص runtime بالمتصفح على 320px و360px و390px لم يُنفذ بعد.


## Auto Mode — Copy Status & Mobile Code Rhythm / Additions 191–193

تم تنفيذ دفعة عرضية صغيرة فوق Copy Code في 1v1، بهدف إبقاء الكود هو الأولوية البصرية، وجعل رسالة الحالة هادئة، وضمان عدم انكسار صف الكود على المقاسات الأضيق.

| Addition | Implementation | Protected boundary |
|---|---|---|
| **191 — Status tone** | تخفيف حجم ولون رسالة Copy وShare status حتى لا تنافس كود الغرفة. | لا تغيير في مصدر الحالة أو Clipboard handler. |
| **192 — Compact code row** | تثبيت محاذاة الصف وعرضه الكامل مع `min-width: 0` لمنع القص. | لا تغيير في roomCode أو actions. |
| **193 — Narrow viewport guard** | ضبط حجم الكود وزر Copy على شاشات حتى 360px مع إبقاء الزر قابلًا للمس. | لا تغيير في room lifecycle أو navigation. |

### Motion review

لا توجد حركة جديدة مقصودة؛ القواعد تضبط typography وflex sizing وalignment فقط. تم الحفاظ على `transition: none` ضمن reduced-motion، ولا توجد keyframes أو حركة لخصائص layout. **MOTION_SOURCE_VERIFIED: نعم. MOTION_REVIEW_APPROVED: نعم.**

### Verification contract

سيتم تشغيل build على نسخة Windows الفعلية وفحص marker والنطاق. فحص runtime المصور للضغط على Copy ومقاسات 320px و360px و390px ما زال غير منفذ.


## Auto Mode — Copy Code Finishing Pass / Additions 194–196

تم تنفيذ دفعة عرضية أخيرة لتحسين Copy Code في 1v1 دون إضافة سلوك أو مصدر حالة جديد.

| Addition | Implementation | Protected boundary |
|---|---|---|
| **194 — Semantic feedback contrast** | رفع قابلية قراءة رسالة الحالة مع إبقائها أهدأ من الكود الأساسي. | لا تغيير في `copyStatus` أو handler. |
| **195 — Code/action seam** | تجميع صف الكود والزر بصريًا مع الحفاظ على focus مستقل لكل عنصر. | لا تغيير في callback أو event order. |
| **196 — Localized mobile guard** | تحسين توزيع المسافات والتفاف النصوص حتى 390px عند وجود labels أو room IDs طويلة. | لا تغيير في room state أو navigation. |

### Motion review

لا توجد حركة جديدة في 194–196. القواعد تضبط اللون والمسافات و`text-wrap` وstacking فقط. لا توجد keyframes أو `transition: all` أو حركة لخصائص layout، مع بقاء reduced-motion مغطى من الطبقات السابقة. **MOTION_SOURCE_VERIFIED: نعم. MOTION_REVIEW_APPROVED: نعم.**

### Verification contract

سيتم تشغيل build على نسخة Windows الفعلية وفحص marker والنطاق. فحص runtime الحقيقي للواجهة وClipboard على 320px و360px و390px لم يُنفذ بعد.


## Auto Mode — Copy Code Accessibility Pass / Additions 197–199

تم تنفيذ ثلاث تحسينات عرضية جديدة حول Copy Code في 1v1، تركز على ثبات صف الكود، وضوح التركيز، ودعم RTL.

| Addition | Implementation | Protected boundary |
|---|---|---|
| **197 — Code baseline** | تثبيت ارتفاع السطر و`overflow-wrap` حتى لا يكسر كود طويل البطاقة. | لا تغيير في roomCode أو مصدره. |
| **198 — Focus boundary** | تحسين `focus-visible` للزر دون تحريك العناصر المجاورة. | لا تغيير في callback أو state. |
| **199 — RTL logical layout** | استخدام `row-reverse` في حاوية الكود عند `dir="rtl"` مع إبقاء ترتيب المحتوى واضحًا. | لا تغيير في Share/Copy behavior أو room lifecycle. |

### Motion review

لا توجد حركة جديدة مقصودة؛ الإضافة الخاصة بـ`transition: none` تقع داخل reduced-motion فقط. لا توجد keyframes أو `transition: all` أو حركة لخصائص layout. **MOTION_SOURCE_VERIFIED: نعم. MOTION_REVIEW_APPROVED: نعم.**

### Verification contract

سيتم تشغيل build على نسخة Windows الفعلية وفحص marker والنطاق. فحص runtime الفعلي للضغط على Copy ومقاسات 320px و360px و390px لم يُنفذ بعد.


## Auto Mode — Copy Code Final Mobile Pass / Additions 200–202

تم تنفيذ دفعة عرضية جديدة لتحسين قراءة كود الغرفة وعلاقة زر Copy به على الهاتف، دون تعديل أي سلوك.

| Addition | Implementation | Protected boundary |
|---|---|---|
| **200 — Quiet code surface** | إضافة سطح هادئ موحد لصف الكود حتى يُقرأ كعنصر واحد. | لا تغيير في roomCode أو handler. |
| **201 — Subordinate copy control** | تثبيت الحد الأدنى لمساحة زر Copy مع إبقائه ثانويًا بصريًا وأهلًا للمس. | لا تغيير في callback أو state. |
| **202 — Status wrapping** | منع رسائل الحالة الطويلة من كسر الحاوية أو دفع صف الكود خارجها. | لا تغيير في copyStatus أو room lifecycle. |

### Motion review

لا توجد حركة جديدة مقصودة. التعديلات تخص background وborder-radius وmin sizing وwrapping فقط، دون keyframes أو `transition: all` أو حركة لخصائص layout. **MOTION_SOURCE_VERIFIED: نعم. MOTION_REVIEW_APPROVED: نعم.**

### Verification contract

سيتم تشغيل build على نسخة Windows الفعلية وفحص marker والنطاق. فحص runtime الفعلي للضغط على Copy ومقاسات 320px و360px و390px لم يُنفذ بعد.


## Auto Mode — 1v1 Code Clarity Pass / Additions 203–205

تم تنفيذ دفعة عرضية جديدة لتحسين قراءة كود الغرفة في سياق 1v1، دون إضافة سلوك أو مصدر حالة جديد.

| Addition | Implementation | Protected boundary |
|---|---|---|
| **203 — Numeric rhythm** | استخدام `tabular-nums` لتحسين مسح أرقام ومعرّفات الغرفة بصريًا. | لا تغيير في roomCode أو handler. |
| **204 — Restrained code edge** | إضافة حد داخلي خفيف لتمييز صف الكود عن أسطح glass المحيطة. | لا تغيير في state أو room lifecycle. |
| **205 — Long-code mobile guard** | ضبط gap وحجم النص داخل 1v1 حتى لا يضغط المعرّف الطويل زر Copy خارج الصف. | لا تغيير في callback أو navigation. |

### Motion review

لا توجد حركة جديدة مقصودة؛ القواعد تضبط typography وborder وspacing فقط. لا توجد keyframes أو `transition: all` أو حركة لخصائص layout. **MOTION_SOURCE_VERIFIED: نعم. MOTION_REVIEW_APPROVED: نعم.**

### Verification contract

سيتم تشغيل build على نسخة Windows الفعلية وفحص marker والنطاق. فحص runtime الفعلي للضغط على Copy ومقاسات 320px و360px و390px لم يُنفذ بعد.


## Auto Mode — Room Action Craft Pass / Additions 206–208

تم تنفيذ دفعة عرضية جديدة بعد مراجعة الحركة، مع تصحيح transition واسع موجود في زر Share الخاص بالغرفة عبر override CSS صريح، دون تغيير الـJSX callback أو ترتيب الأفعال.

| Addition | Implementation | Protected boundary |
|---|---|---|
| **206 — Explicit share transition** | استبدال أثر `transition-all` بصريًا بقائمة خصائص محددة: transform، color، background-color، border-color، بمدة 180ms ومنحنى ease-out مخصص. | لا تغيير في Share callback أو behavior. |
| **207 — Copy feedback motion** | انتقال قابل للمقاطعة لزر Copy على transform واللون والخلفية فقط. | لا تغيير في Clipboard handler أو copyStatus. |
| **208 — Narrow action lane** | تثبيت الحد الأدنى للمساحة على الهاتف حتى لا تنضغط أزرار Share وCopy أو تخرج من الحاوية. | لا تغيير في state أو room lifecycle. |

### Motion review

تم اكتشاف `transition-all` في class JSX لزر Share، وتمت معالجته بطبقة CSS لاحقة دون تعديل markup. الحركة الآن GPU-safe ومحددة الخصائص، أقل من 300ms، ease-out، مع reduced-motion fallback. **MOTION_SOURCE_VERIFIED: نعم. MOTION_REVIEW_APPROVED: نعم.**

### Verification contract

سيتم تشغيل build على نسخة Windows الفعلية وتدقيق marker والنطاق. فحص runtime للضغط على Copy وShare ومقاسات 320px و360px و390px لم يُنفذ بعد.


## 1v1 Reference Lobby Reset / Additions 209–211

تم تبسيط 1v1 من Create Room حتى Lobby باستخدام طبقة CSS scoped على `.ng-1v1-reference-lobby`، بهدف إزالة الإحساس العام بالواجهة غير المتجانسة وجعلها أقرب إلى لغة 2v2 وFour.

| Addition | Visual decision | Boundary |
|---|---|---|
| **209 — Decorative reset** | إخفاء الزخارف المطلقة العامة داخل 1v1 فقط، لأنها كانت تضيف ضوضاء ولا تحمل معنى للحالة. | لا تغيير في عناصر الحالة أو البيانات. |
| **210 — Mode-first lobby** | إزالة social kicker/capacity/timer chrome من 1v1 وتقديم كود الغرفة كعنصر معلوماتي هادئ. | لا تغيير في timer أو room state؛ إخفاء عرضي فقط للعناصر غير الأساسية في هذه الصفحة. |
| **211 — Shared action language** | توحيد ارتفاع وشكل ومسار أزرار Create وJoin وStart، مع transition محدد بدل transition-all. | لا تغيير في callbacks أو disabled/loading truth. |

### Design decision

تم رفض اتجاه “neon-heavy lobby” لأنه يكرر glow والدوائر والبطاقات المتراكبة ويضعف القراءة على 320–390px. تم رفض اتجاه “bare utility form” لأنه يفقد هوية NEON GUESS. تم اختيار اتجاه **quiet competitive room**: بطاقة مضغوطة، هرمية عنوان واضحة، كود بارز، وأفعال بسيطة قابلة للمس.

### Motion contract

الحركة محصورة في transform والألوان والظل والحدود، بمدة 180ms ومنحنى ease-out، مع `prefers-reduced-motion`. لا توجد keyframes، ولا حركة layout، ولا `transition: all` في overrides الجديدة.

### Protected systems

لم يتم تعديل Firebase أو room creation/joining أو authentication أو routes أو scoring أو timers أو rounds أو reveal أو Team Battle أو room lifecycle أو callbacks أو state ownership.


## 1v1 Room Shell Recomposition — Additions 212–214

**Scope:** إعادة تشكيل العرض في 1v1 من Create Room حتى Lobby/Waiting Room، مع إزالة الضوضاء البصرية وليس إزالة وظيفة اختيار الفئة.

- **212 — Category Visual Reset:** إزالة image/gradient/glow من `ng-category-spotlight` وتحويل أزرار الفئات إلى controls صغيرة. بقي `category` و`actions.setCategory` كما هما لأنهما جزء من تدفق إنشاء الغرفة.
- **213 — Form Anchor:** تخفيف أسطح إعداد وملخص الغرفة وجعل Create/Join محور الصفحة.
- **214 — Compact Lobby Surface:** منع توسع حضور اللاعبين وحالة الانتظار ومسار Start خارج سطح الغرفة على 320–390px.

**Motion contract:** لا keyframes جديدة. الانتقال محصور في transform/color/background/border بمدة 160ms وease-out، مع `prefers-reduced-motion` و`transition: none`. لا توجد حركة layout.

**Protected systems:** لم تتغير Firebase أو category state أو `actions.setCategory` أو create/join/start callbacks أو room lifecycle أو scoring أو timers أو rounds أو routes أو authentication.

**Verification status:** build مطلوب، وruntime review على 320/360/390 مطلوب قبل READY. الحالة: **CONDITIONAL**.


## Explicit 1v1 Surface Replacement — Additions 215–219

تم تنفيذ طلب الإزالة الكاملة للعناصر البصرية المحددة في واجهة 1v1:

- إخفاء قسم `Select Category` بالكامل من عرض 1v1.
- إخفاء بطاقات وصور `Cartoon Character` و`Football Players` و`Types of Sports` بالكامل.
- إخفاء كتلة `Firebase State`/status من سطح 1v1.
- إزالة الشكل القديم والفراغ غير المنظم في Lobby، واستبداله بهرمية Waiting Room مختصرة.
- تصغير Copy Code وإعادة ضبط صف الكود ليكون أبسط وأكثر ملاءمة للهاتف.
- استبدال تسمية `LBY` بصريًا إلى `WAITING ROOM`.

تم الحفاظ على `category` state و`actions.setCategory` وroomCode وCopy/Share handlers وCreate/Join/Start callbacks وFirebase authority وroom lifecycle وscoring وtimers وrounds وroutes وauthentication. نطاق CSS الجديد محصور تحت `.ng-1v1-visual-reset`، ولا يستهدف 2v2 أو Four.

Motion review: لا توجد keyframes أو layout animation؛ الانتقالات محددة للـtransform والألوان والحدود، بمدد أقل من 300ms، مع reduced-motion override. Build على نسخة Windows الفعلية: `BUILD_EXIT=0`. Runtime review على 320/360/390 واختبار Copy/Share داخل المتصفح ما زالا مطلوبين؛ الحالة `CONDITIONAL`.


# 1v1 Play Type + Layout Harmony — Addition Batch 220–222

## القرار

**السياق:** بعد إزالة صور `Select Category` من بوابة Home، بقيت واجهة إعداد 1v1 بحاجة إلى اختيار واضح ومضغوط داخل الغرفة، مع تقليل الإحساس بأن Create/Join وبيانات الغرفة أجزاء منفصلة. **المهمة الأساسية:** اختيار نوع اللعب الحالي ثم متابعة Create أو Join داخل نفس التسلسل البصري، خصوصًا على 320–390px.

**الاتجاه المختار:** Compact tactical rail. يظهر `Play type` كـfieldset صغير من ثلاثة أزرار نصية، ويعكس الزر المحدد قيمة `category` الموجودة أصلًا عبر `aria-pressed`. تم الحفاظ على ترتيب غرفة الإعداد، مع إضافة إيقاع بصري موحد لمناطق الهوية والغرفة دون تغيير مصادر الحالة.

| الإضافة | التغيير المرئي | سبب الاختيار |
|---|---|---|
| 220 | إنشاء `.ng-1v1-play-type-rail` بحاوية مختصرة ومساحة واضحة | يفصل إعداد اللعب عن Home ويمنع عودة البطاقات والصور الكبيرة |
| 221 | حالات idle/selected/focus/pressed/disabled للأزرار الموجودة | يوضح الاختيار الحالي من `category` دون مصدر حالة جديد |
| 222 | توحيد نصف قطر وظلال مناطق Create/Join/Room Created في 1v1 | يجعل المسار كتلة واحدة هادئة بدل عناصر متنافرة على الهاتف |

## الحماية

Control trace لم يتغير: `Play Type button → actions.setCategory(existing callback) → existing category state → handleCreateRoom/handleStartGame validation`. لم تتغير callbacks أو effects أو routes أو Firebase أو room lifecycle أو قواعد اللاعبين أو الجولات أو scoring أو target privacy.

## عقد الحركة

لا توجد keyframes جديدة. حركة الخيار محصورة في `transform` و`opacity`/ألوان الحدود والخلفية، بزمن 140ms وبـ`ease-out`، وتوجد حالة `prefers-reduced-motion`. لا يوجد `transition-all` جديد ولا حركة لخصائص layout. الحركة تشرح الضغط والاختيار فقط، ولا تعمل كعرض دوري.

## عقد الاستجابة والوصول

يتحول rail إلى عمود واحد افتراضيًا على الهاتف، ثم ثلاثة أعمدة من `sm` دون overflow. كل زر يحافظ على ارتفاع لمس لا يقل عن 44px تقريبًا، ويستخدم `aria-pressed` وfocus ring موجودًا. `fieldset/legend` يعطيان تسمية دلالية، والنصوص الطويلة تقص داخل الزر بدل دفع الصفحة أفقيًا.

## بوابات التحقق

يجب تشغيل build على نسخة Windows الفعلية، ومراجعة diff للتأكد من أن الملفات المعدلة هي `LobbyPage.jsx` و`index.css` وDDR فقط. يجب التأكد مصدرًا من ثبات callbacks والمنطق المحمي، ومن عدم وجود `transition-all` أو keyframes جديدة في هذه الدفعة. مراجعة runtime للمقاسات 320/360/390 تبقى منفصلة عن نجاح build.

**Rollback:** التراجع عن كتلة JSX الخاصة بالـrail، وكتلة CSS Additions 220–222، وقسم DDR الحالي فقط.


# 1v1 Entry Rhythm + Copy Affordance — Addition Batch 223–225

## الهدف والنطاق

استكمال تبسيط واجهة 1v1 على الهاتف عبر تحسين التسلسل المرئي الموجود، وليس إضافة تدفق جديد. الهدف هو أن يقرأ اللاعب Create/Join كأمر واحد، وأن يفهم هوية الغرفة بسرعة، وأن يجد Copy Code بجوار الكود دون أن يتحول إلى زر كبير أو زخرفة.

| الإضافة | التغيير | العقد المحمية |
|---|---|---|
| 223 | ضبط شريط Create/Join الموجود ليكون compact command rail بعرض متوازن على الهاتف | `setLobbyMode` والـbuttons والـdisabled/loading truth لم تتغير |
| 224 | محاذاة رأس الغرفة وتخفيف خلفيته لربط اسم المهمة بهوية الوضع | لا تغيير في mode أو room state أو النصوص authoritative |
| 225 | إعطاء `.ng-room-code-copy` مساحة لمس واضحة وحالات hover/focus/pressed صغيرة | `handleCopyRoomCode` و`copyStatus` وشرط ظهور الزر لم تتغير |

## Motion handoff

الحركة الوحيدة الجديدة مرتبطة بتفاعل Copy Code، وهو تفاعل يدوي قصير: `transform` محدود إلى `translateY/scale`، مع ألوان الحدود والخلفية، بزمن 140ms و`ease-out`. لا توجد keyframes أو `transition-all` أو حركة خصائص layout. hover بصري فقط، وحالة `prefers-reduced-motion` تلغي transform مع إبقاء feedback اللوني.

## مراجعة الحركة

| Before | After | Why |
|---|---|---|
| زر Copy Code بلا surface مرئي واضح | surface ثابت مع focus ring وpressed feedback محدود | يجعل affordance قابلة للاكتشاف دون إضافة حركة دورية |
| تفاعل hover غير مضمون على اللمس | hover لا يغيّر layout، والضغط يعتمد transform GPU-only | يحافظ على الأداء ويمنع التفاعل من دفع العناصر |

**Verdict:** `APPROVE` مصدرِيًا. لا توجد مخالفة feel-breaking أو animation على keyboard/high-frequency action أو layout animation. runtime motion verification remains pending.

## التحقق المطلوب

يجب فحص 320/360/390px، خصوصًا صف room code، والتأكد من بقاء الكود والزر ضمن العرض، ثم تشغيل build على نسخة Windows الفعلية. يجب أن يظل التغيير محصورًا في `src/index.css` وDDR، دون تعديل callbacks أو Firebase أو state ownership.

**Rollback:** إزالة كتلة CSS Additions 223–225 وهذا القسم فقط.


# 1v1 Density + Waiting Clarity — Addition Batch 226–228

## الهدف

متابعة الاتجاه الهادئ التنافسي في 1v1: تقليل تمدد عناصر الإنشاء، تحسين إيقاع label/input، وإعطاء Waiting state حدًا بصريًا واضحًا دون اختراع حالة جديدة.

| الإضافة | التغيير المرئي | سبب الاختيار |
|---|---|---|
| 226 | تقييد Host Identity وRoom Created إلى عرض أقصى 28rem مع محاذاة مركزية وأزرار 44px تقريبًا | يمنع تمدد البطاقات ويجعل عمود الإجراء مقروءًا على الهاتف |
| 227 | توحيد line-height وletter-spacing للـlabels، وتثبيت ارتفاع inputs ونصف قطرها | يخلق form rhythm واحدًا بين Create وJoin |
| 228 | إضافة status boundary هادئة لحالة الانتظار وinner highlight خفيف لصفوف اللاعبين | يوضح الانتظار دون pulse أو زخرفة دورية أو مصدر state جديد |

## الحماية

التغيير محصور في `src/index.css` وDDR. لم تتغير state ownership أو callbacks أو effects أو routes أو Firebase أو room lifecycle أو player validation أو scoring أو timers أو rounds أو reveal أو target privacy.

## Motion review

| Before | After | Why |
|---|---|---|
| CTA الحالي يحمل انتقالات عامة من JSX | الإضافات الجديدة لا تضيف `transition-all`؛ reduced-motion يحدد transitions لونية فقط | يمنع توسيع نطاق الخصائص المتحركة ويحافظ على الأداء |
| Waiting state بلا حدود دلالية كافية | حد ثابت وbackground ثابت، بلا keyframes أو transform | الحالة متكررة ولا تحتاج motion احتفاليًا |

**Verdict:** `APPROVE` مصدرِيًا. لا توجد حركة جديدة في Waiting state، ولا layout animation، ولا ease-in، ولا scale(0)، ولا hover motion جديد. runtime motion verification remains pending.

## التحقق

يجب اختبار 320/360/390px للتأكد من عدم حدوث overflow، وفحص التفاف Room Created وJoin inputs، ثم تشغيل build من Windows Terminal مع exit code واضح. لا يُعتبر timeout نجاحًا. Rollback boundary: كتلة CSS Additions 226–228 وهذا القسم فقط.


# 1v1 Control Rail + Code Balance — Addition Batch 229–231

## الهدف

استمرار تبسيط واجهة 1v1 على الهاتف عبر تحسين شريط Create/Join، تثبيت صف Room Code داخل حدود الشاشة، وتهدئة إيقاع قائمة اللاعبين في Waiting Room. التغيير عرضي فقط.

| الإضافة | التغيير المرئي | سبب الاختيار |
|---|---|---|
| 229 | تضييق سطح Create/Join، تثبيت ارتفاعه، وضبط انتقال rail إلى 180ms بمنحنى ease-out | يعطي التبديل وزنًا واضحًا دون حركة بطيئة أو سطح ضخم |
| 230 | تقييد صف Room Code والكود نفسه بـmax-width وellipsis مع الحفاظ على زر النسخ | يمنع overflow على 320px ويجمع الكود والإجراء بصريًا |
| 231 | تقليل gap بين صفوف اللاعبين وتثبيت الحد الأدنى لارتفاعها | يحافظ على scan سريع دون حذف أي لاعب أو تغيير ترتيب authoritative |

## الحماية

التعديل محصور في `src/index.css` وDDR. لم تتغير `setLobbyMode` أو `handleCopyRoomCode` أو أي callback أو state أو effect أو route أو Firebase operation أو room lifecycle أو player validation أو scoring أو timers أو rounds أو reveal أو target privacy.

## Motion review

الحركة الجديدة الوحيدة هي انتقال rail عند تبديل Create/Join، وهي حركة تشرح موضع الاختيار الحالي. تستخدم `transform` فقط، بزمن 180ms ومنحنى cubic-bezier ease-out، وهي قابلة لإعادة التوجيه عبر CSS. reduced-motion يلغيها بالكامل. لا توجد keyframes أو `transition-all` أو حركة layout أو hover motion جديدة.

**Verdict:** `APPROVE` مصدرِيًا. `MOTION_SOURCE_VERIFIED` و`MOTION_REVIEW_APPROVED`; runtime frame-by-frame remains pending.

## التحقق والرجوع

يجب مراجعة 320/360/390px، خصوصًا صف Room Code، واختبار التركيز على Create/Join وCopy Code، ثم تشغيل build من Windows Terminal مع exit code واضح. لا يُعتبر timeout نجاحًا. Rollback boundary: كتلة CSS Additions 229–231 وهذا القسم فقط.


# 1v1 Focus + Play Type Hierarchy — Addition Batch 232–234

## الهدف

رفع وضوح واجهة 1v1 دون زيادة الزخارف: جعل التركيز بلوحة المفاتيح قابلًا للرؤية، إعطاء Play Type تسلسلًا بصريًا أوضح، وحجز مسار هادئ للإجراء أسفل Waiting Room. كل التغييرات presentation-only.

| الإضافة | التغيير المرئي | سبب الاختيار |
|---|---|---|
| 232 | focus-visible موحد للأزرار والـPlay Type والحقول، مع outline مزدوج ثابت بلا حركة | يرفع قابلية الوصول ويمنع فقدان موضع التركيز على الهاتف ولوحة المفاتيح |
| 233 | تحسين label ومحاذاة خيارات Play Type داخل مجموعة متماسكة، مع centering على الشاشات حتى 390px | يوضح أن الاختيارات مجموعة تحكم واحدة بدل عناصر زخرفية منفصلة |
| 234 | توحيد عرض وارتفاع CTA داخل Waiting Room وتوفير مسافة صغيرة قبل الإجراء | يخلق نهاية بصرية مستقرة للبطاقة دون تغيير شرط أو سلوك الزر |

## الحماية

التعديل محصور في `src/index.css` وDDR. لم تتغير React state أو callbacks أو effects أو routes أو Firebase reads/writes/transactions/listeners أو room lifecycle أو authentication أو player validation أو scoring أو timers أو rounds أو reveal أو target privacy.

## Motion review

لا تضيف الدفعة أي keyframes أو transitions جديدة لازمة للتفاعل. focus-visible ثابت، وPlay Type وCTA لا يضيفان حركة؛ reduced-motion يعطل أي transition موروث من الطبقات السابقة على العناصر المستهدفة. لا توجد `transition-all` أو ease-in أو scale(0) أو حركة layout.

**Verdict:** `APPROVE` مصدرِيًا. `MOTION_SOURCE_VERIFIED` و`MOTION_REVIEW_APPROVED`; runtime motion and viewport verification remain pending.

## التحقق والرجوع

يجب فحص 320/360/390px، التأكد من عدم قص focus ring أو CTA، وتجربة tab order وRoom Code وPlay Type، ثم تشغيل build من Windows Terminal مع exit code واضح. لا يُعتبر timeout نجاحًا. Rollback boundary: كتلة CSS Additions 232–234 وهذا القسم فقط.


# 1v1 Room Card + Action Rhythm — Addition Batch 235–237

## الهدف

استمرار ضبط واجهة 1v1 لتبدو كجزء من النظام التنافسي نفسه: ضغط بطاقة Room Created، تنظيم صف Join Room، ومنع كود الغرفة في Waiting Room من منافسة العنوان على الهاتف.

| الإضافة | التغيير المرئي | سبب الاختيار |
|---|---|---|
| 235 | تقييد بطاقة Room Created إلى 28rem، توسيطها، وحماية التعليمات وحالة النسخ من قص النص | يحافظ على affordance الدعوة مع تقليل الفراغ والتمدد |
| 236 | توحيد محاذاة صف Join، منع تقلص حقول الإدخال، وتثبيت ارتفاع أزرار Join/Share | يجعل مسار الإجراء قابلًا للمسح والتنفيذ على 320–390px |
| 237 | ضبط Room Code spotlight في رأس Waiting Room بعرض أدنى ومحاذاة مركزية هادئة | يبقي العنوان والعدد أولوية بصرية ويترك الكود قابلًا للعثور |

## الحماية

التعديل محصور في `src/index.css` وDDR. لم تتغير `handleCreateRoom` أو `handleJoinRoom` أو `handleCopyRoomCode` أو `handleShareInvite` أو أي state/effect/route أو Firebase operation أو room lifecycle أو player validation أو scoring أو timers أو rounds أو reveal أو target privacy.

## Motion review

لا تضيف الدفعة أي keyframes أو transitions جديدة. جميع التغييرات ثابتة على max-width وalignment وmin-height وoverflow wrapping. لا توجد `transition-all` جديدة ولا ease-in ولا scale(0) ولا حركة خصائص layout. الحركة الموروثة لم تُعدّل، لذلك لا يوجد motion diff جديد يستدعي block.

**Verdict:** `APPROVE` مصدرِيًا. `MOTION_SOURCE_VERIFIED` و`MOTION_REVIEW_APPROVED`; runtime motion and viewport verification remain pending.

## التحقق والرجوع

يجب فحص 320/360/390px، خصوصًا بطاقة Room Created وصف Join ورأس Waiting Room، وتجربة النصوص الطويلة وfocus-visible، ثم تشغيل build من Windows Terminal مع exit code واضح. لا يُعتبر timeout نجاحًا. Rollback boundary: كتلة CSS Additions 235–237 وهذا القسم فقط.


# 1v1 Roster Rhythm + Capacity Clarity — Addition Batch 238–240

## الهدف

تحسين الجزء الأخير من Waiting Room في 1v1 ليكون أكثر هدوءًا ووضوحًا على الهاتف: تقليل المسافة بين صفوف اللاعبين، حماية أسماء اللاعبين والحالات من الانفلات، وتحويل الخانة الفارغة إلى إشارة سعة واضحة دون زخرفة زائدة.

| الإضافة | التغيير المرئي | سبب الاختيار |
|---|---|---|
| 238 | ضبط gap داخل `ng-presence-ledger` إلى إيقاع أصغر ومنع تضيق الحاوية | يجعل قائمة لاعبين 1v1 متناسبة مع المساحة المحدودة |
| 239 | منع overflow في صف اللاعب وحماية النصوص الطويلة مع إبقاء أيقونة الحالة ثابتة | يحافظ على هوية اللاعب والحالة دون كسر عرض 320–390px |
| 240 | توحيد الخانة الفارغة بارتفاع أدنى وحدود صلبة هادئة وخلفية Neon خفيفة | يوضح أن الخانة مساحة متاحة، لا بطاقة ناقصة أو عنصر زخرفي |

## الحماية

التعديل محصور في `src/index.css` وDDR. لم تتغير state أو callbacks أو effects أو routes أو Firebase operations أو room lifecycle أو authentication أو player validation أو scoring أو timers أو rounds أو reveal أو target privacy.

## Motion review

لا تضيف الدفعة keyframes أو transitions أو hover motion. جميع التغييرات ثابتة على gap وmin-width وoverflow-wrap وmin-height وborder/background. لا توجد `transition-all` جديدة ولا ease-in ولا scale(0) ولا حركة خصائص layout. الحركة الموروثة لم تُعدّل.

**Verdict:** `APPROVE` مصدرِيًا. `MOTION_SOURCE_VERIFIED` و`MOTION_REVIEW_APPROVED`; runtime motion and viewport verification remain pending.

## التحقق والرجوع

يجب فحص 320/360/390px مع اسم لاعب طويل وحالة اتصال طويلة، والتأكد من بقاء أيقونة الحالة والخانة الفارغة داخل العرض، ثم تشغيل build من Windows Terminal مع exit code واضح. لا يُعتبر timeout نجاحًا. Rollback boundary: كتلة CSS Additions 238–240 وهذا القسم فقط.


# 1v1 Invite Hierarchy + Feedback Clarity — Addition Batch 241–243

## الهدف

ضبط التسلسل البصري في حالات الانضمام وإنشاء الغرفة: إبقاء نص المساعدة ثانويًا، جعل Invite Code نقطة الارتكاز، وإعطاء رسائل الخطأ مسارًا واضحًا دون أن تزيح الإجراء الأساسي على 320–390px.

| الإضافة | التغيير المرئي | سبب الاختيار |
|---|---|---|
| 241 | تحديد عرض سياق Join Room ومنع انفلات نص المساعدة | يحافظ على هرمية المعلومة ويمنع فراغًا غير منظم |
| 242 | تثبيت Invite Code بصريًا، تصغيره عند 390px، وإعطاء Copy Code مساحة لمس مناسبة | يرفع قابلية العثور على الكود ويحافظ على الزر الصغير المطلوب |
| 243 | تحديد عرض رسالة الخطأ ودعم التفافها داخل البطاقة | يمنع الخطأ من دفع بقية الواجهة أو خلق overflow |

## الحماية

التعديل محصور في `src/index.css` وDDR. لم تتغير state أو callbacks أو effects أو routes أو Firebase operations أو room lifecycle أو authentication أو player validation أو scoring أو timers أو rounds أو reveal أو target privacy. زر Copy Code يحتفظ بالمسار الحالي دون تكرار أو تغيير callback.

## Motion review

لا تضيف الدفعة keyframes أو transitions أو hover motion. خصائصها ثابتة على max-width وoverflow وtypography وmin-height وborder/background. لا توجد `transition-all` جديدة ولا ease-in ولا scale(0) ولا حركة layout. الحركة الموروثة لم تُعدّل.

**Verdict:** `APPROVE` مصدرِيًا. `MOTION_SOURCE_VERIFIED` و`MOTION_REVIEW_APPROVED`; runtime motion and viewport verification remain pending.

## التحقق والرجوع

يجب فحص 320/360/390px مع كود غرفة طويل ورسالة خطأ طويلة ونص مساعدة طويل، والتأكد من بقاء Copy Code قابلًا للمس وعدم قص Invite Code، ثم تشغيل build من Windows Terminal مع exit code واضح. لا يُعتبر timeout نجاحًا. Rollback boundary: كتلة CSS Additions 241–243 وهذا القسم فقط.


# 1v1 Code Row + Focus Clarity — Addition Batch 244–246

## الهدف

صقل مجموعة Invite Code في 1v1 لتظهر كإجراء واحد متماسك على الهاتف: ضبط المسافة بين الكود وزر النسخ، تقليل النص الثانوي، وإظهار التركيز عند استخدام لوحة المفاتيح دون إضافة زخارف أو سلوك جديد.

| الإضافة | التغيير المرئي | سبب الاختيار |
|---|---|---|
| 244 | توحيد gap ومنع تضيق صف Room Code | يحافظ على اصطفاف الكود وزر النسخ عند 320–390px |
| 245 | تقليل حجم وارتفاع سطر الدعوة الثانوي | يرفع أولوية الكود والإجراء الأساسي دون حذف المعلومة |
| 246 | إضافة focus-visible واضح للكود والنسخ والانضمام والمشاركة | يحسن قابلية الوصول دون تغيير callback أو حالة الزر |

## الحماية

التعديل محصور في `src/index.css` وDDR. لم تتغير state أو callbacks أو effects أو routes أو Firebase operations أو room lifecycle أو authentication أو player validation أو scoring أو timers أو rounds أو reveal أو target privacy.

## Motion review

لا تضيف الدفعة keyframes أو transitions أو hover motion. focus-visible يعتمد على outline وbox-shadow ثابتين عند التركيز فقط، ولا توجد `transition-all` جديدة ولا ease-in ولا scale(0) ولا حركة خصائص layout. لا يوجد animation diff يستدعي block.

**Verdict:** `APPROVE` مصدرِيًا. `MOTION_SOURCE_VERIFIED` و`MOTION_REVIEW_APPROVED`; runtime motion and viewport verification remain pending.

## التحقق والرجوع

يجب فحص 320/360/390px مع كود غرفة طويل، وتجربة Tab حتى Copy Code وJoin وShare، والتأكد من عدم قص focus ring، ثم تشغيل build من Windows Terminal مع exit code واضح. لا يُعتبر timeout نجاحًا. Rollback boundary: كتلة CSS Additions 244–246 وهذا القسم فقط.


# 1v1 Invite Actions + Waiting Containment — Addition Batch 247–249

## الهدف

إكمال تنظيم مجموعة الدعوة والانتظار في 1v1: إعطاء حالات الضغط ملاحظة ثابتة بلا حركة، فصل الإجراء الأساسي عن Copy Code بصريًا، ومنع Waiting Room من التمدد خارج إطار الهاتف.

| الإضافة | التغيير المرئي | سبب الاختيار |
|---|---|---|
| 247 | إضافة pressed state ثابت لأزرار Copy وShare وJoin عبر background/border فقط | يعطي تأكيدًا بصريًا لحظيًا دون animation أو تغيير سلوك |
| 248 | تثبيت Copy Code كعنصر مساعد صغير ومنع Share من التمدد غير المنضبط | يحافظ على هرمية الدعوة ويمنع تنافس الإجراءات |
| 249 | منع overflow في عمود الانتظار وضبط هامش الهاتف الضيق | يحمي 320–390px من القص الأفقي |

## الحماية

التعديل محصور في `src/index.css` وDDR. لم تتغير state أو callbacks أو effects أو routes أو Firebase operations أو room lifecycle أو authentication أو player validation أو scoring أو timers أو rounds أو reveal أو target privacy.

## Motion review

لا تضيف الدفعة keyframes أو transitions أو hover motion. pressed state ثابت عبر background/border فقط؛ لا توجد `transition-all` جديدة ولا ease-in ولا scale(0) ولا حركة خصائص layout. لا توجد حركة تستدعي block، مع الحفاظ على الحركة الموروثة دون تعديل.

**Verdict:** `APPROVE` مصدرِيًا. `MOTION_SOURCE_VERIFIED` و`MOTION_REVIEW_APPROVED`; runtime motion and viewport verification remain pending.

## التحقق والرجوع

يجب فحص 320/360/390px مع الضغط الفعلي على Copy وShare وJoin، والتأكد من عدم وجود قص أفقي في Waiting Room، ثم تشغيل build من Windows Terminal مع exit code واضح. لا يُعتبر timeout نجاحًا. Rollback boundary: كتلة CSS Additions 247–249 وهذا القسم فقط.


# 1v1 Waiting Signal + Start Dock — Addition Batch 250–252

## الهدف

تحسين آخر جزء من Waiting Room في 1v1 عبر جعل رسالة الانتظار إشارة مدمجة، فصل رصيف Start Game بصريًا عن قائمة اللاعبين، وموازنة الخانة المفتوحة دون إضافة زخارف أو مصدر حالة جديد.

| الإضافة | التغيير المرئي | سبب الاختيار |
|---|---|---|
| 250 | تحويل `ng-1v1-waiting-state` إلى شارة انتظار مرنة قابلة للالتفاف | يجعل حالة 1/2 مقروءة على 320–390px |
| 251 | إضافة حد علوي هادئ لرصيف إجراءات اللوبي | يوضح انتقال العين من roster إلى Start Game |
| 252 | موازنة open slot مع صفوف اللاعبين باستخدام الحدود والخلفية الحالية | يحافظ على إيقاع واحد دون زخرفة إضافية |

## الحماية

التعديل محصور في `src/index.css` وDDR. لم تتغير state أو callbacks أو effects أو routes أو Firebase operations أو room lifecycle أو authentication أو player validation أو scoring أو timers أو rounds أو reveal أو target privacy.

## Motion review

لا تضيف الدفعة keyframes أو transitions أو hover motion. جميع القواعد ثابتة، ولا توجد `transition-all` جديدة ولا ease-in ولا scale(0) ولا حركة خصائص layout. لا توجد حركة تستدعي block.

**Verdict:** `APPROVE` مصدرِيًا. `MOTION_SOURCE_VERIFIED` و`MOTION_REVIEW_APPROVED`; runtime motion and viewport verification remain pending.

## التحقق والرجوع

يجب فحص 320/360/390px في حالة 1/2 وحالة 2/2، مع نصوص أسماء طويلة، والتأكد من بقاء زر Start واضحًا وعدم قص الحد أو الرسالة. يجب تشغيل build من Windows Terminal مع exit code واضح. لا يُعتبر timeout نجاحًا. Rollback boundary: كتلة CSS Additions 250–252 وهذا القسم فقط.


# 1v1 Roster Resilience + Host Action Clarity — Addition Batch 253–255

## الهدف

رفع تحمل قائمة لاعبي 1v1 على شاشات 320–390px عند وجود أسماء أو حالات طويلة، مع إبقاء صف اللاعب قابلًا للانكماش، ومنع زر الإزالة الخاص بالمضيف من دفع الصف خارج العرض.

| الإضافة | التغيير المرئي | سبب الاختيار |
|---|---|---|
| 253 | جعل صف اللاعب داخل Waiting Room shrink-safe مع `min-width: 0` ومحاذاة مستقرة | يمنع تمدد الصف عند ضغط المحتوى على الهاتف |
| 254 | دعم التفاف اسم اللاعب وحالة roster داخل العمود دون قص أفقي | يحافظ على قابلية القراءة مع النصوص الطويلة |
| 255 | تحديد الحد الأقصى لعرض زر إزالة اللاعب وتقليله عند 390px | يحافظ على مساحة الاسم والصورة ولا يغير صلاحية الزر |

## الحماية

التعديل محصور في `src/index.css` وDDR. لم تتغير state أو callbacks أو effects أو routes أو Firebase operations أو room lifecycle أو authentication أو player validation أو scoring أو timers أو rounds أو reveal أو target privacy أو disabled/loading truth.

## Motion review

لا تضيف الدفعة keyframes أو transitions أو hover motion. القواعد الجديدة خاصة بالانكماش، الالتفاف، الحدود، والمسافات. طبقة reduced-motion تمنع أي transition موروث داخل النطاق، ولا توجد `transition-all` جديدة أو ease-in أو scale(0) أو حركة خصائص layout.

**Verdict:** `APPROVE` مصدرِيًا. `MOTION_SOURCE_VERIFIED` و`MOTION_REVIEW_APPROVED`; runtime motion and viewport verification remain pending.

## التحقق والرجوع

يجب فحص 320/360/390px مع اسم لاعب طويل وحالة طويلة وظهور زر إزالة اللاعب، والتأكد من عدم قص الصف أو زر Start. يجب تشغيل Vite build من Windows Terminal مع exit code واضح؛ timeout ليس نجاحًا. Rollback boundary: كتلة CSS Additions 253–255 وهذا القسم فقط.


# 1v1 Header Anchor + Presence Signals — Addition Batch 256–258

## الهدف

تحسين وضوح رأس Waiting Room وقائمة اللاعبين على 320–390px عبر تثبيت Room Code كمرساة مستقلة، حماية حجم avatar، والحفاظ على إشارة الاتصال كعلامة حالة ثابتة دون إضافة مصدر حالة جديد.

| الإضافة | التغيير المرئي | سبب الاختيار |
|---|---|---|
| 256 | تثبيت `ng-room-code-spotlight` بعرض مرن مستقل وحد أدنى أصغر على الهاتف | يمنع تنافس الكود مع عنوان Waiting Room ويحافظ على قابلية القراءة |
| 257 | منع avatar اللاعب من الانكماش بجانب الأسماء الطويلة | يحافظ على هوية اللاعب البصرية في الصف الضيق |
| 258 | تثبيت connection dot كإشارة حضور مرئية | يمنع ضغط مؤشر الاتصال أو فقدانه بصريًا |

## الحماية

التعديل محصور في `src/index.css` وDDR. لم تتغير state أو callbacks أو effects أو routes أو Firebase operations أو room lifecycle أو authentication أو player validation أو scoring أو timers أو rounds أو reveal أو target privacy أو connection truth.

## Motion review

لا تضيف الدفعة keyframes أو transitions أو hover motion. القواعد الجديدة تتعلق بـflex sizing وmin-width وpadding فقط. لا توجد `transition-all` جديدة أو ease-in أو scale(0) أو حركة خصائص layout.

**Verdict:** `APPROVE` مصدرِيًا. `MOTION_SOURCE_VERIFIED` و`MOTION_REVIEW_APPROVED`; runtime motion and viewport verification remain pending.

## التحقق والرجوع

يجب فحص 320/360/390px مع عنوان وكود غرفة طويلين، اسم لاعب طويل، وحالات اتصال مختلفة، والتأكد من بقاء avatar وconnection dot وStart Game واضحين دون overflow. يجب تشغيل Vite build من Windows Terminal مع exit code واضح؛ timeout ليس نجاحًا. Rollback boundary: كتلة CSS Additions 256–258 وهذا القسم فقط.


# 1v1 Roster State Clarity — Addition Batch 259–261

## الهدف

رفع وضوح حالات Waiting Room على 320–390px من خلال حماية شارات الحالة، أيقونة الاتصال، وعلامة المقعد الفارغ من الانكماش أو التزاحم مع المحتوى الطويل.

| الإضافة | التغيير المرئي | سبب الاختيار |
|---|---|---|
| 259 | تثبيت شارة حالة اللاعب في سطر واحد مع ellipsis عند الحاجة | يمنع تمدد صفوف اللاعبين بسبب Ready أو Disconnected أو حالات أطول مستقبلًا |
| 260 | منع أيقونة الاتصال الدلالية من الانكماش | يحافظ على معنى حالة الاتصال بجانب الأسماء الطويلة |
| 261 | تثبيت مرساة المقعد الفارغ بصريًا | يحافظ على وضوح Open slot في حالة عدم اكتمال الغرفة |

## الحماية

التعديل محصور في `src/index.css` وDDR. لم تتغير state أو callbacks أو effects أو routes أو Firebase operations أو room lifecycle أو authentication أو player validation أو scoring أو timers أو rounds أو reveal أو target privacy أو connection truth.

## Motion review

لا تضيف الدفعة keyframes أو transitions أو hover motion. القواعد الجديدة تخص overflow وwhite-space وflex sizing فقط، ولا تستخدم `transition-all` أو ease-in أو scale(0) أو حركة خصائص layout.

**Verdict:** `APPROVE` مصدرِيًا. `MOTION_SOURCE_VERIFIED` و`MOTION_REVIEW_APPROVED`; `MOTION_RUNTIME_VERIFIED` وviewport verification remain pending.

## التحقق والرجوع

يجب فحص 320/360/390px مع أسماء لاعبين وحالات طويلة، وحالة disconnected، وopen slot، والتأكد من بقاء أيقونات الحالة واضحة بلا overflow. يجب تشغيل Vite build من Windows Terminal مع exit code واضح؛ timeout ليس نجاحًا. Rollback boundary: كتلة CSS Additions 259–261 وهذا القسم فقط.


## Visual Evolution Additions 262–264 — Waiting Room density and action clarity

**Scope:** Presentation-only CSS refinements for the existing 1v1 Waiting Room at 320–390px. No JSX, state, callback, Firebase, multiplayer, authentication, route, round, score, timer, or effect changes.

**262 — Even roster rhythm:** tightened the existing presence ledger gap and bottom rhythm so player rows and the empty seat read as one compact stack without enlarging the lobby.

**263 — Invite code hierarchy:** constrained the existing room-code value to a single safe line with ellipsis and calmer letter spacing so it remains an anchor without competing with the WAITING ROOM heading.

**264 — Compact start gate note:** constrained the existing start requirement/status note to a readable measure and aligned it with the Start Game dock, especially on narrow screens.

**Motion review:** APPROVE source-side. No keyframes, no new hover motion, no layout animation, no `transition-all`, and no scale/rotation effects were introduced. The added reduced-motion block disables transitions for the targeted surfaces.

**Protected contracts:** Gameplay Constitution preserved. Existing player mapping, room code rendering, start gating, `handleStartGame`, `handleRemovePlayer`, Firebase authority, and round transitions were not edited.

**Verification debt:** Windows Vite build exit code and runtime screenshots at 320/360/390px remain unverified when the host command returns only a timeout. A timeout is not treated as a pass.


## Additions 265–267 — 1v1 roster hierarchy and action-dock clarity

**Scope:** Presentation-only CSS refinement for the 1v1 Waiting Room at 320–390px. No JSX, state, callbacks, Firebase, multiplayer, gameplay, routes, auth, round, scoring, timer, or target-privacy changes.

**Addition 265 — Player content centering:** the player name/status cluster remains vertically centered beside fixed avatar and status controls while preserving `min-width: 0`.

**Addition 266 — Empty-seat hierarchy:** the open-seat copy receives stable two-level line-height and safe wrapping so the empty state remains legible without widening the card.

**Addition 267 — Action-dock containment:** the final action area and its button remain shrink-safe; at widths up to 390px the action button uses the available width without introducing horizontal overflow.

**Motion review:** `MOTION_SOURCE_VERIFIED`; no new keyframes, transitions, transforms, scale, layout animation, or hover motion were introduced. The rules preserve the existing reduced-motion boundary. `MOTION_REVIEW_APPROVED` for the presentation-only diff.

**Verification:** source review completed. Runtime screenshots at 320/360/390px and a completed Windows Vite exit code remain unverified; timeout is not treated as success. Release status: `CONDITIONAL`.

**Protected-system check:** no protected gameplay or Firebase surface was edited.


## Additions 268–270 — 1v1 connection and error-state refinement

**Mode:** DESIGN_AND_IMPLEMENT

**Target:** 1v1 Lobby connection capsule and error frame, with the same presentation-safe treatment retained for the shared lobby surface.

**Player context and primary job:** لاعب هاتف يحتاج أن يميّز بسرعة بين حالة الاتصال ورسالة الخطأ ثم يعرف أن غرفة 1v1 ما زالت قابلة للاستخدام. لا توجد حاجة لقراءة telemetry طويلة أو تفاصيل تقنية داخل المسار الأساسي.

**Selected direction:** Signal-first compact frames. ستبقى الحالة الدلالية الحالية كما هي، لكن تُقسّم بصريًا إلى marker ثابت، label قصير، ورسالة قابلة للالتفاف. تم رفض (A) حذف النص التقني بالكامل لأنه يخفي سبب الفشل، و(B) تحويل الخطأ إلى toast لأنه قد يختفي قبل قراءته ويضعف الوصول على الهاتف.

| Addition | Visual change | Reason |
|---|---|---|
| 268 | ضبط connection capsule على شبكة داخلية shrink-safe مع marker وlabel ثابتين ورسالة مرنة | يمنع تمدد الكبسولة أو دفع label خارج 320–390px |
| 269 | جعل lobby error frame يملك حدًا داخليًا مرئيًا ومساحة نص مرنة دون قص أفقي | يرفع قابلية قراءة أخطاء 1v1 الطويلة مع الحفاظ على role=alert |
| 270 | توحيد الإيقاع العمودي بين capsules/error frame وتقليل التكرار البصري | يجعل الحالات المتتابعة تُقرأ كطبقة حالة واحدة دون إضافة مصدر حالة أو حركة |

**Allowed files:** `src/index.css` and this DDR only. JSX, callbacks, state, effects, routes, Firebase, room lifecycle, authentication, disabled/loading truth, gameplay, scoring, rounds, reveal, target privacy, and synchronization remain protected and untouched.

**Control and state trace:** Existing status projection → existing `fbStatus`/`fbError` branches → existing capsule/error markup → no new state or callback. The patch changes only CSS presentation.

**Responsive contract:** At 320px, 360px, and 390px, marker and labels remain visible, long Firebase/error text wraps within the card, and no horizontal overflow or focus clipping is introduced.

**Motion contract:** No new motion. Existing transitions remain bounded by the existing rules; the new selectors do not animate layout properties, do not use `transition-all`, ease-in, scale(0), keyframes, or hover motion. Reduced-motion rules remain respected.

**Verification gates:** source diff audit limited to allowlisted presentation files; no protected-system drift; CSS syntax/build attempt; runtime review at 320/360/390px and focused error/connection states when the host is available. Windows build timeout remains unverified and is never treated as a pass.

**Rollback boundary:** revert only the Additions 268–270 CSS block and this DDR section.

**Status before runtime verification:** CONDITIONAL.

## Motion review handoff — Additions 268–270

The diff contains presentation-only sizing, wrapping, spacing, and containment rules. Motion purpose is none; no new animated property or trigger is introduced. Source review must confirm no motion block. Runtime motion and viewport review remain separate gates.

## Negative gate

No protected gameplay or Firebase surface was edited in this cycle.


## Additions 271–273 — Results hierarchy and round-transition clarity

**Mode:** DESIGN_AND_IMPLEMENT

**Target:** شاشة النتائج المشتركة `GameResultsPage.jsx`، وبالتحديد بطاقة النتيجة، بطاقة الفائز، وشريط الانتقال بين الجولات.

**Player context and primary job:** لاعب هاتف يريد أن يفهم فورًا من الفائز، ماذا تعني النتيجة الحالية، ومتى تبدأ الجولة التالية، دون أن تضيع هذه الإشارات وسط Category أو Quick reaction أو standings.

**Evidence-based findings:** المصدر الحالي يضع عدة أسطح متساوية الوزن داخل `ng-result-shell`، ويعرض اسم الفائز وTOTAL داخل صف مرن، ويضع countdown الانتقال أسفل reveal. الاستنتاج التصميمي هو أن شاشة الهاتف تحتاج ثلاث طبقات واضحة: نتيجة أساسية، مكافأة/نقاط، ثم حالة الانتقال؛ دون تغيير ترتيب DOM أو أي مصدر حالة.

### Three directions compared

| Direction | Composition | Mobile/comprehension trade-off | Decision |
|---|---|---|---|
| A — Winner-first command stack | يثبت بطاقة الفائز كمرساة، يحمي الاسم والنقاط من الانكماش، ويحوّل countdown إلى شريط حالة واضح | أعلى وضوح وأقل مخاطرة، مع الحفاظ على كل المحتوى الحالي | **Selected** |
| B — Split scoreboard | يقسم النتيجة إلى عمودين للفائز والـstandings | يضغط الأسماء والأزرار عند 320px ويغيّر grammar الشاشة | Rejected |
| C — Countdown hero | يجعل العد التنازلي هو العنصر الأكبر ويؤخر فهم الفائز | يرفع الإلحاح لكنه يخلط بين result وnext-round state | Rejected |

**Selected design gates:** greyscale hierarchy = winner/result first, supporting score second, next-round signal third, secondary tools last. Content-stress test covers long winner names and 320px. State-truthfulness passes because all styling projects existing `winner`, `visibleRoundResult`, `isRoundEnd`, and `revealSecondsLeft` without adding state.

**Allowed files:** `src/index.css` and this DDR section only. No JSX, callbacks, state, effects, routes, Firebase, timers, scoring, round transitions, reveal logic, target privacy, or disabled/loading truth changes.

**Motion contract:** No new motion. Existing `animate-fade-in-up`, button transitions, and countdown behavior remain untouched. New rules use containment, sizing, wrapping, and static visual hierarchy only; no `transition-all`, keyframes, ease-in, layout animation, or new transform.

**Responsive contract:** At 320px, 360px, and 390px the winner name, points, status label, countdown, and action rail remain readable without horizontal overflow. Focus rings remain visible because no overflow rule is applied to interactive ancestors.

**Verification gates:** changed-file audit, CSS/source review, protected-contract negative gate, build with explicit exit code, runtime review on result states at 320/360/390px, long winner name, tie, round-end countdown, final result, disabled Play Again, and action error.

**Rollback boundary:** revert the Additions 271–273 CSS block and this DDR section only.

**Status before runtime verification:** CONDITIONAL.


## Additions 274–276 — Mobile navigation dock clarity and motion discipline

**Mode:** DESIGN_AND_IMPLEMENT

**Target:** `src/components/layout/BottomNavBar.jsx`، شريط التنقل السفلي على عرض الهاتف فقط.

**Player context and primary job:** اللاعب يريد الانتقال بسرعة بين Home و1V1 وFour و2v2، مع معرفة الصفحة الحالية دون أن يغطي الشريط محتوى الصفحة أو يشعر بحركة مبالغ فيها عند التبديل.

**Repository evidence:** رابط كل عنصر يستخدم `touch-feedback` و`active:scale-90` و`transition-all duration-200`. هذا يجعل تفاعلًا عالي التكرار يستخدم حركة scale كبيرة نسبيًا، كما أن الشريط نفسه لا يملك غلافًا بصريًا يحمل signature واضحًا أو يضمن فصلًا بصريًا ثابتًا عن المحتوى.

### Three directions compared

| Direction | Composition | Mobile/comprehension trade-off | Decision |
|---|---|---|---|
| A — Quiet command dock | حركة ضغط صغيرة ومحددة الخصائص، dock مرتفع قليلًا، وactive marker ثابت أسفل العنصر | أسرع مسح بصري وأقل تشتيت، مع أقل تغيير في سلوك الرابط | **Selected** |
| B — Floating pill dock | شريط عائم مستدير مع gap أكبر بين العناصر | جميل بصريًا لكنه يقلل المساحة عند 320px ويزيد احتمال حجب المحتوى | Rejected |
| C — Icon-only rail | إزالة أسماء العناصر والإبقاء على الأيقونات | يوفر مساحة لكنه يضعف الفهم خصوصًا في Four و2v2 ويضر قابلية الاكتشاف | Rejected |

**Implementation contract:** تعديل classes والعرض فقط. Trace remains unchanged: `Link → onClick → (pendingItem/showLeaveDialog أو setMode/navigate) → existing context actions/navigation`. لا يتم تغيير callback أو state أو route أو disabled/loading truth.

**Allowed files:** `src/components/layout/BottomNavBar.jsx`, `src/index.css`, and this DDR section only. No Firebase, game state, effects, APIs, configuration, dependencies, or server changes.

**Three additions:** 274) replace broad `transition-all` and large active scale with bounded color/filter/shadow motion and a subtle press scale; 275) add a named mobile dock surface with safe-area-aware padding and a contained top edge; 276) add a static active marker and state-specific surface so current mode is recognized without relying on glow alone.

**Motion contract:** Press feedback is deliberate but frequent, so it stays short and small; only transform/opacity-adjacent visual properties are animated, no layout properties. No new keyframes. Reduced motion removes transform and transitions. Hover behavior remains limited to fine pointers through existing utility behavior.

**Responsive contract:** At 320px, 360px, and 390px, four equal nav items retain readable labels, no horizontal overflow is introduced, focus rings remain visible, and the dock respects `env(safe-area-inset-bottom)`.

**Verification gates:** changed-file scope audit, JSX handler diff review, CSS/source review, motion review with file:line, build with explicit exit code, runtime at 320/360/390px across Home/1v1/Four/2v2, keyboard focus, active press, reduced motion, active room leave dialog, and navigation outcomes.

**Rollback boundary:** revert the BottomNavBar class-only changes, the Batch 274–276 CSS block, and this DDR section.

**Status before runtime verification:** CONDITIONAL.

## Auto Mode Batch 277â€“279 â€” 1v1 command surface on mobile

- **Mode:** `DESIGN_AND_IMPLEMENT`
- **Current target:** 1v1 Create Room / Join Room form surface and its field/action rhythm.
- **Evidence:** Repository inspection found the dedicated `ng-1v1-visual-reset` root, shared `ng-lobby-mobile-actions`, and `ng-lobby-input-guidance` classes. External references: [W3C WCAG 2.2 Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), which recommends at least 24أ—24 CSS pixels for pointer targets subject to spacing exceptions; [Apple HIG Layout](https://developer.apple.com/design/human-interface-guidelines/layout), which emphasizes adaptable layouts, safe areas, text-size changes, and previewing small and large layouts. Material Design 3 density guidance was used directionally only; no code or assets were copied.
- **Direction comparison:** (A) dense two-column form: rejected because it compresses labels and code entry at 320px; (B) full-width stacked form with oversized CTAs: rejected because it increases scroll and weakens hierarchy; (C) compact command surface with shrink-safe fields and a measured action: selected for comprehension, accessibility, performance, and rollback simplicity.
- **Addition 277:** presentation-only alignment and shrink safety for the create/join action group.
- **Addition 278:** presentation-only compact CTA sizing, radius, and explicitly scoped transition properties for 1v1.
- **Addition 279:** presentation-only wrapping and width protection for field labels and guidance text.
- **Protected contract:** no changes to JSX handlers, state, effects, routes, callbacks, Firebase, room creation/join lifecycle, game rules, scoring, timers, rounds, reveal, authentication, or disabled/loading truth.
- **Motion review:** `APPROVE` at source level. No keyframes or layout animation; CTA transition is limited to color/background/border/shadow/transform, 150ms, and removed under `prefers-reduced-motion`.
- **Verification gates:** source review complete; runtime at 320/360/390 and build exit code remain pending.
- **Rollback:** remove the Batch 277â€“279 CSS block and this DDR section only.

## Auto Mode Batch 280â€“282 â€” 1v1 recovery and leave confirmation

- **Mode:** `DESIGN_AND_IMPLEMENT`
- **Target:** Active-match recovery card and leave-room confirmation dialog as the two remaining high-friction 1v1 safety surfaces.
- **Repository evidence:** `ActiveMatchRecoveryCard.jsx` is a projection-only component with restoring, retryable-error, terminal, and identity-error variants. `RoomLeaveDialog.jsx` contains the existing confirm/cancel buttons and pending/error projection. No domain logic was required for the visual improvement.
- **Research adaptation:** mobile-first hierarchy, resilient text wrapping, clear action grouping, and preserved target size were adapted from the previously recorded W3C and Apple guidance. The product signature remains the NEON glass command surface with cyan/semantic accents, not a generic modal or banner.
- **Direction comparison:** (A) add more status copy: rejected because it increases cognitive load; (B) use a full-screen alert card: rejected because it obscures room context; (C) compact recovery command surface plus focused leave-confirmation panel: selected for clarity, reversibility, and small-screen resilience.
- **Addition 280:** recovery card identity and long-copy containment.
- **Addition 281:** recovery action cluster sizing and bounded transition properties.
- **Addition 282:** leave dialog backdrop/panel focus treatment and resilient title/error copy.
- **Protected contract:** callbacks, state, effects, routes, room lifecycle, Firebase, authentication, navigation outcomes, disabled/loading truth, gameplay, scoring, timers, rounds, reveal, and target privacy remain unchanged.
- **Motion review:** `APPROVE` at source level. New motion is bounded to a 150ms transition on existing recovery buttons; dialog treatment is static, and `prefers-reduced-motion` removes the recovery transition.
- **Verification gates:** source review complete; Windows build remains blocked by the Node installation error; runtime mobile review remains pending.
- **Rollback:** revert only the new dialog class names, Batch 280â€“282 CSS block, and this DDR section.
