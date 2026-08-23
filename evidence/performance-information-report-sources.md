# مصادر تقرير تسريع NEON GUESS

## React

React Performance tracks: https://react.dev/reference/dev-tools/react-performance-tracks

React useMemo: https://react.dev/reference/react/useMemo

القاعدة: القياس أولًا، وعدم إضافة memoization بشكل عشوائي؛ تستخدم فقط عندما توجد تكلفة محسوبة أو إعادة render قابلة للقياس.

## Browser rendering

Rendering performance: https://web.dev/articles/rendering-performance

High-performance CSS animations: https://web.dev/articles/animations-guide

Core Web Vitals guidance: https://web.dev/articles/top-cwv

القاعدة: الحركة الأفضل تعتمد على transform وopacity، مع تقليل layout وpaint المتكرر. يتم القياس على production build وباستخدام Performance panel.

## Firebase

Realtime Database performance optimization: https://firebase.google.com/docs/database/usage/optimize

القاعدة: تقليل حجم القراءة، تضييق نطاق listeners، تجنب الاشتراكات الواسعة، وتصميم القراءة حول المسار المطلوب بدل تحميل room كاملة عند كل تغيير، مع عدم تغيير authoritative state أو الخصوصية.

## MDN

will-change: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/will-change

القاعدة: will-change ليس حلًا عامًا؛ استخدامه على عناصر كثيرة قد يزيد الذاكرة وكلفة compositing.

## Responsiveness

INP: https://web.dev/articles/inp

المعيار العام: INP عند 200ms أو أقل جيد، من 200 إلى 500 يحتاج تحسينًا، وأكثر من 500 ضعيف، وفق percentile 75.
