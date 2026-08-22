# خطة تحسين واجهة 2v2 Team Battle

## الهدف

رفع جودة المظهر والوضوح البصري في 2v2 Team Battle، مع منع أي تغيير في قواعد اللعب، أهداف الفرق، ترتيب الجولات، التأكيد الثنائي، التسجيل، Firebase، أو أنماط 1v1 وTournament.

## دليل المستودع

واجهة 2v2 الحالية موجودة في `src/pages/CompetitiveModePage.jsx`. المكونات المرئية المباشرة هي `TeamSlotPreview` و`TeamBattleIdentity` و`TargetCard` و`TeamBattleGameplay` و`TeamScoreboard`. مسار الحالة والأفعال يأتي من `useCompetitiveMode`. لذلك ستكون التغييرات محصورة في العرض والتنسيق داخل الصفحة، ولن نعدل `teamBattleEngine.js` أو `competitiveFirebase.js` أو `database.rules.json`.

## دليل البحث

تدعم إرشادات Material Design استخدام مساحة لمس لا تقل عن 48dp للأفعال الأساسية، مع فصل المساحة التفاعلية عن حجم الأيقونة المرئي [1]. وتدعم ممارسات UX للألعاب مبدأ تقليل العناصر غير الضرورية وإبراز الإجراء الأهم في اللحظة الحالية [2]. النتيجة العملية للمشروع هي: هوية الفريق في بطاقة صغيرة، الهدف المنافس في بطاقة بصرية أكبر، وزر التأكيد كإجراء أساسي واضح، مع تقليل النصوص الثانوية.

## القرار التصميمي

سيتم اعتماد هرم بصري من ثلاث طبقات: شريط جولة صغير ومتماسك، بطاقة هوية الفريق الحالي وأسماء لاعبيه، ثم بطاقة هدف الفريق المنافس مع صورة كبيرة، ثم زر تأكيد بعرض كامل. سيتم تحسين الألوان والحدود والفراغات والتباين والاستجابة للموبايل، دون إضافة عداد أو Guess Board أو أي تفاعل جديد.

## حدود الأمان

| النطاق | القرار |
|---|---|
| ملفات مسموح تعديلها | `src/pages/CompetitiveModePage.jsx`، وعقود UI فقط إذا احتاجت لتثبيت التصميم. |
| ملفات محمية | `src/modes/teamBattleEngine.js`، `src/context/CompetitiveModeContext.jsx`، `src/firebase/competitiveFirebase.js`، `database.rules.json`. |
| منطق محمي | target ownership/privacy، confirmationTeamId، تأكيد لاعبي الفريقين، scoring، round advancement، reconnect، Tournament، 1v1. |
| التغييرات المسموحة | className، ترتيب عرض العناصر، نصوص قصيرة غير مؤثرة، aria labels، حالات بصرية مشتقة من الحالة الموجودة. |
| التغييرات الممنوعة | أي action جديد، أي Firebase write/read، تعديل state shape، تعديل round أو score، إظهار هدف الفريق نفسه. |

## معايير القبول

يجب أن تظهر الشاشة بشكل أفضل على الهاتف، وأن تظل أسماء لاعبي الفريق الحالي والهدف المنافس وزر التأكيد واضحة. يجب أن تبقى الأزرار الأساسية بارتفاع لمس مريح لا يقل عن 48px تقريبًا، مع focus ring وaria labels. يجب ألا يظهر Guess Board أو timer في Team Battle، ويجب أن يبقى Tournament محتفظًا بـ GuessGrid والمؤقت الخاص به. يجب أن تنجح UI contract وsmoke وbuild، وأن يفتح `/team-battle` دون أخطاء جديدة.

## خطة التنفيذ

1. تعديل presentation-only في `TeamBattleIdentity` و`TargetCard` و`TeamBattleGameplay` و`TeamSlotPreview` لتقوية التسلسل البصري والتباين والفراغات.
2. عدم لمس أي action أو hook أو adapter أو engine.
3. تحديث عقد UI فقط إذا كان الاختبار يعتمد على class أو نص قديم.
4. تشغيل UI contract وsmoke وproduction build.
5. فتح route محليًا ومراجعة Console.
6. إجراء regression static check للتأكد من بقاء Tournament و1v1 خارج نطاق التعديل.

## مراجع

[1]: https://m3.material.io/foundations/designing/structure "Material Design 3 — Structure and touch targets"
[2]: https://www.gameuidatabase.com/ "Game UI Database — reference patterns for game interface hierarchy"
