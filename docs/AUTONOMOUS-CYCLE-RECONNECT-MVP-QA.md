# NEON GUESS — Autonomous Product Evolution Cycle

## نطاق الدفعة

تم تنفيذ هذه الدفعة محليًا فقط داخل مشروع NEON GUESS. لم يتم تنفيذ أي إجراء متعلق بـGitHub أو النشر أو إعدادات Pages.

## الفرصة المختارة

الفرصة المختارة هي **استعادة غرفة المنافسة بعد refresh أو انقطاع الاتصال**. تم اختيارها لأنها تعالج نقطة احتكاك عالية في تجربة الغرف، وتستفيد من عقد Firebase الموجود بدل إضافة نظام جديد. البحث السابق في المشروع وفي مراجع جلسات multiplayer أظهر أن قابلية إعادة الانضمام، وضوح حالة الجلسة، ورسالة الفشل القابلة للإجراء تقلل فقدان الجلسة وتمنع اللاعب من العودة إلى شاشة إنشاء غرفة بلا تفسير.

## التنفيذ

أصبح `CompetitiveModeContext` يحفظ الجلسة المحلية للغرفة، ويؤجل الاشتراك في الغرفة عند بدء التطبيق حتى ينفذ reconnect authoritative باستخدام `joinCompetitiveRoom` بنفس `playerId` الثابت. بعد النجاح يعاد تركيب room subscription وتستمر الجلسة. عند الفشل يتم تصنيف الحالة إلى `restoring` أو `retryable-error` أو `identity-error` أو `terminal`.

أضيفت إلى الصفحة حالات مرئية قابلة للتنفيذ: رسالة استعادة الغرفة، زر Retry عند الفشل المؤقت، وزر Forget room عند فشل الهوية أو انتهاء الغرفة. وتمت إضافة الحالة terminal حتى لا يختفي فشل الغرفة المحفوظة دون تفسير.

لم يتم تغيير Firebase schema أو قواعد 2v2 أو توزيع الفرق أو الخصوصية أو scoring. كما أن create، join، leave، Tournament، وTeam Battle تستمر باستخدام عقودها الحالية.

## الإصلاح الذاتي أثناء التدقيق

اكتشف التدقيق أن الفشل النهائي قد يصنف إلى `terminal` ثم لا يظهر للمستخدم أي إجراء. تم إصلاح ذلك بإضافة رسالة واضحة وزر لمسح الغرفة المحفوظة. كما فشل أول patch ذريًا بسبب اختلاف النص المضغوط في مصفوفة dependencies؛ لم يتم ترك patch جزئي، وتمت إعادة التطبيق بتعديلات أصغر ثم فحص الملفات.

## أدلة التحقق

| Check | Result |
| --- | --- |
| Existing 2v2 source contract | PASS — `2V2_ROOM_SOURCE_CONTRACT_PASS` |
| Deterministic Team Battle privacy QA | PASS — shared hidden targets, owner-only confirmation, two-player gate, reset |
| Edited CompetitiveModePage JSX | PASS — `JSX_PARSE_PASS` against a local source copy |
| Firebase live reconnect on deployed environment | NOT VERIFIED |
| Full Vite production build | NOT VERIFIED in mounted workspace because the workspace blocks or stalls the Vite invocation |
| Runtime regression for 1v1 and Tournament | Source changes are scoped to competitive recovery, but live runtime smoke test remains required |

## Release decision

الحالة هي **CONDITIONAL**. التحسين المحلي مطبق وفحوص المصدر والمنطق وsyntax نجحت، لكن لا يجوز إعلان READY قبل تشغيل build في checkout قابل للتنفيذ وتجربة refresh/reconnect فعليًا على deployment بأربعة عملاء 2v2، ثم smoke test لـ1v1 وTournament.

## توصية التشغيل التالية

شغّل التطبيق من checkout محلي عادي، أنشئ غرفة 2v2، انضم بأربعة لاعبين، اعمل refresh للاعب واحد أثناء lobby، ثم أثناء active round. تحقق من بقاء `playerId`، عودة اللاعب إلى نفس الفريق، عدم ظهور target خاص بالفريق المقابل، وعدم تكرار player seat. بعد ذلك نفّذ نفس سيناريو refresh في 1v1 وTournament.

