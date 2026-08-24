import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const modes = [
  {
    id: '1v1',
    icon: 'swords',
    title: { en: '1 vs 1', ar: 'واحد ضد واحد' },
    tone: 'primary',
    intro: {
      en: 'A focused duel for two players. Every round is a direct mind game.',
      ar: 'مواجهة مباشرة بين لاعبين. كل جولة هي تحدٍ ذهني مباشر.',
    },
    create: {
      en: [
        'Choose 1V1 from the mode buttons at the bottom of the screen.',
        'Type your name in the name field. Names are never filled automatically.',
        'Choose the game type, then select Create Room.',
        'Copy the 3-digit room code and share it with your opponent.',
      ],
      ar: [
        'اختر 1V1 من أزرار أوضاع اللعب الموجودة أسفل الشاشة.',
        'اكتب اسمك في خانة الاسم. لا تتم كتابة الأسماء تلقائيًا أبدًا.',
        'اختر نوع اللعبة، ثم اضغط على إنشاء غرفة.',
        'انسخ رمز الغرفة المكوّن من 3 أرقام وشاركه مع منافسك.',
      ],
    },
    join: {
      en: [
        'Choose 1V1, then select Join Room.',
        'Enter the 3-digit room code shared by the host.',
        'Type your own name before joining the room.',
        'Select Join Room to enter the duel.',
      ],
      ar: [
        'اختر 1V1، ثم اضغط على الانضمام إلى غرفة.',
        'أدخل رمز الغرفة المكوّن من 3 أرقام الذي شاركه المضيف.',
        'اكتب اسمك قبل الانضمام إلى الغرفة.',
        'اضغط على الانضمام إلى غرفة للدخول إلى المواجهة.',
      ],
    },
    play: {
      en: 'When both players are ready, the host starts the match. In each round, you see the target your opponent must guess and confirm whether your opponent guessed correctly. After the short reveal, the next round starts. The player with the strongest result wins the duel. 🧠',
      ar: 'عندما يصبح اللاعبان جاهزين، يبدأ المضيف المباراة. في كل جولة، ترى الهدف الذي يجب على منافسك تخمينه، ثم تؤكد ما إذا كان منافسك قد خمّنه بشكل صحيح. بعد الكشف القصير، تبدأ الجولة التالية. يفوز بالمواجهة اللاعب صاحب أفضل نتيجة. 🧠',
    },
  },
  {
    id: '2v2',
    icon: 'groups',
    title: { en: '2 vs 2', ar: '2 ضد 2' },
    tone: 'secondary',
    intro: {
      en: 'Build two balanced teams and coordinate your guesses across synchronized rounds.',
      ar: 'كوّن فريقين متوازنين ونسّقوا تخميناتكم خلال الجولات المتزامنة.',
    },
    create: {
      en: [
        'Choose 2V2 from the mode buttons at the bottom of the screen.',
        'Type your name manually, choose the game type, and select Create Room.',
        'Copy the 3-digit room code and send it to three friends.',
        'Wait for four players, then review the team assignment preview.',
      ],
      ar: [
        'اختر 2V2 من أزرار أوضاع اللعب الموجودة أسفل الشاشة.',
        'اكتب اسمك يدويًا، واختر نوع اللعبة، ثم اضغط على إنشاء غرفة.',
        'انسخ رمز الغرفة المكوّن من 3 أرقام وأرسله إلى ثلاثة أصدقاء.',
        'انتظر أربعة لاعبين، ثم راجع معاينة توزيع الفرق.',
      ],
    },
    join: {
      en: [
        'Choose 2V2, then select Join Room.',
        'Enter the 3-digit room code.',
        'Type your name in the name field before joining.',
        'Select Join Room and choose your team when the lobby is ready.',
      ],
      ar: [
        'اختر 2V2، ثم اضغط على الانضمام إلى غرفة.',
        'أدخل رمز الغرفة المكوّن من 3 أرقام.',
        'اكتب اسمك في خانة الاسم قبل الانضمام.',
        'اضغط على الانضمام إلى غرفة واختر فريقك عندما تصبح الردهة جاهزة.',
      ],
    },
    play: {
      en: 'Each team has two players and shares a target. The teams play through synchronized rounds, confirm the required guesses, and collect points together. The team with the best total score wins the Team Battle. 🤝',
      ar: 'يتكوّن كل فريق من لاعبين ويتشارك هدفًا واحدًا. تلعب الفرق خلال جولات متزامنة، وتؤكد التخمينات المطلوبة، وتجمع النقاط معًا. يفوز بمعركة الفرق الفريق صاحب أفضل مجموع نقاط. 🤝',
    },
  },
  {
    id: 'four',
    icon: 'diversity_3',
    title: { en: '4 Players', ar: '4 لاعبين' },
    tone: 'tertiary',
    intro: {
      en: 'Four players enter one room and are paired into a complete tournament bracket.',
      ar: 'يدخل أربعة لاعبين إلى غرفة واحدة ويتم تقسيمهم إلى جدول بطولة كامل.',
    },
    create: {
      en: [
        'Choose Four from the mode buttons at the bottom of the screen.',
        'Type your name manually and choose the game type.',
        'Select Create Room, then copy the 3-digit room code.',
        'Share the code with the other three players.',
      ],
      ar: [
        'اختر Four من أزرار أوضاع اللعب الموجودة أسفل الشاشة.',
        'اكتب اسمك يدويًا واختر نوع اللعبة.',
        'اضغط على إنشاء غرفة، ثم انسخ رمز الغرفة المكوّن من 3 أرقام.',
        'شارك الرمز مع اللاعبين الثلاثة الآخرين.',
      ],
    },
    join: {
      en: [
        'Choose Four, then select Join Room.',
        'Enter the 3-digit room code from the host.',
        'Every player must type a name before joining.',
        'Select Join Room and wait until all four seats are ready.',
      ],
      ar: [
        'اختر Four، ثم اضغط على الانضمام إلى غرفة.',
        'أدخل رمز الغرفة المكوّن من 3 أرقام الذي أرسله المضيف.',
        'يجب على كل لاعب كتابة اسمه قبل الانضمام.',
        'اضغط على الانضمام إلى غرفة وانتظر حتى تصبح المقاعد الأربعة جاهزة.',
      ],
    },
    play: {
      en: 'The bracket begins with Semi-Final A and Semi-Final B. Each match uses the natural single-target guessing flow: one visible target, then Guess Correct confirmation. Winners meet in the Final for 1st and 2nd place. The two losing players or teams will play against each other to determine the 3rd and 4th places. 🏆',
      ar: 'يبدأ جدول البطولة بنصف النهائي A ونصف النهائي B. تستخدم كل مباراة طريقة التخمين الطبيعية بهدف واحد ظاهر، ثم تأكيد التخمين الصحيح. يلتقي الفائزون في النهائي لتحديد المركزين الأول والثاني. ويلعب اللاعبان أو الفريقان الخاسران ضد بعضهما لتحديد المركزين الثالث والرابع. 🏆',
    },
  },
];

const gameTypes = [
  { emoji: '⚽', title: { en: 'Football Player', ar: 'لاعب كرة قدم' }, description: { en: 'Guess famous football players.', ar: 'خَمّن لاعبي كرة القدم المشهورين.' } },
  { emoji: '🎨', title: { en: 'Cartoon Character', ar: 'شخصية كرتونية' }, description: { en: 'Guess well-known cartoon characters.', ar: 'خَمّن الشخصيات الكرتونية المعروفة.' } },
  { emoji: '🏀', title: { en: 'Sports Type', ar: 'نوع الرياضة' }, description: { en: 'Guess different sports and athletic disciplines.', ar: 'خَمّن الرياضات والتخصصات الرياضية المختلفة.' } },
  { emoji: '🐾', title: { en: 'Animals', ar: 'الحيوانات' }, description: { en: 'Guess animals from around the world.', ar: 'خَمّن الحيوانات من جميع أنحاء العالم.' } },
];

function StepList({ items }) {
  return (
    <ol className="space-y-2.5">
      {items.map((item, index) => (
        <li key={item} className="flex items-start gap-3 text-sm leading-6 text-on-surface-variant">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary-fixed/30 bg-primary-fixed/10 font-stats-num text-[11px] text-primary-fixed">{index + 1}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

const HowToPlayPage = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const isArabic = language === 'ar';
  const text = (value) => (typeof value === 'string' ? value : value[language]);

  return (
    <main className="ng-page-shell ng-page-shell--narrow flex-1 w-full max-w-5xl mx-auto px-container-margin pt-24 pb-32 md:pt-32 relative z-10">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div dir={isArabic ? 'rtl' : 'ltr'} className={isArabic ? 'text-right' : 'text-left'}>
          <p className="font-label-caps text-label-caps text-primary-fixed">{isArabic ? 'دليل اللاعب · غرفة الاستعداد' : 'PLAYER GUIDE · READY ROOM'}</p>
          <h1 className="mt-2 font-display-lg text-display-lg text-white">{isArabic ? 'طريقة اللعب' : 'HOW TO PLAY'}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">{isArabic ? 'اختر وضع اللعب، وادعُ أصدقاءك، واقرأ الهدف. يشرح هذا الدليل السريع طريقة كل غرفة في NEON GUESS.' : 'Pick a mode, invite your friends, and read the target. This quick guide explains every room flow in NEON GUESS.'}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => setLanguage(isArabic ? 'en' : 'ar')} className="ng-interactive min-h-11 rounded-lg border border-primary-fixed/30 px-3 font-label-caps text-[10px] tracking-[0.12em] text-primary-fixed hover:bg-primary-fixed/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed/70" aria-label={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}>
            {isArabic ? 'English' : 'العربية'}
          </button>
          <button type="button" onClick={() => navigate('/')} aria-label={isArabic ? 'العودة إلى الردهة' : 'Back to lobby'} className="ng-interactive rounded-lg border border-white/15 p-2 text-on-surface-variant hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed/70">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </header>

      <section className="glass-panel-2 mb-6 rounded-2xl border border-secondary-fixed/25 p-5 sm:p-6" aria-labelledby="mode-navigation-title">
        <div className="flex items-start gap-3" dir={isArabic ? 'rtl' : 'ltr'}>
          <span className="material-symbols-outlined text-secondary-fixed" aria-hidden="true">touch_app</span>
          <div className={isArabic ? 'text-right' : 'text-left'}>
            <h2 id="mode-navigation-title" className="font-headline-md text-headline-md text-white">{isArabic ? 'ابدأ من الشريط السفلي' : 'Start at the bottom bar'}</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">{isArabic ? <>توجد خيارات الأوضاع بجانب بعضها في أسفل الشاشة: <strong className="text-white">1V1</strong> و<strong className="text-white">Four</strong> و<strong className="text-white">2v2</strong>. اضغط على أحدها لفتح ردهة غرفة ذلك الوضع.</> : <>The mode options sit next to each other at the bottom of the screen: <strong className="text-white">1V1</strong>, <strong className="text-white">Four</strong>, and <strong className="text-white">2v2</strong>. Tap one to open that mode’s room lobby.</>}</p>
          </div>
        </div>
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-3" aria-labelledby="game-types-title">
        <div className="sm:col-span-3" dir={isArabic ? 'rtl' : 'ltr'}>
          <h2 id="game-types-title" className={`font-headline-md text-headline-md text-white ${isArabic ? 'text-right' : 'text-left'}`}>{isArabic ? 'اختر نوع اللعبة' : 'Choose your game type'}</h2>
          <p className={`mt-1 text-sm text-on-surface-variant ${isArabic ? 'text-right' : 'text-left'}`}>{isArabic ? 'تحدد الفئة الشيء الذي ستتعرف عليه أثناء المباراة.' : 'The category controls what you will identify during the match.'}</p>
        </div>
        {gameTypes.map((gameType) => (
          <article key={gameType.title.en} className="glass-panel-1 rounded-xl border border-white/10 p-4" dir={isArabic ? 'rtl' : 'ltr'}>
            <div className="text-2xl" aria-hidden="true">{gameType.emoji}</div>
            <h3 className={`mt-2 font-headline-sm text-white ${isArabic ? 'text-right' : 'text-left'}`}>{text(gameType.title)}</h3>
            <p className={`mt-1 text-xs leading-5 text-on-surface-variant ${isArabic ? 'text-right' : 'text-left'}`}>{text(gameType.description)}</p>
          </article>
        ))}
      </section>

      <div className="space-y-5">
        {modes.map((mode) => (
          <section key={mode.id} className={`glass-panel-2 rounded-2xl border p-5 sm:p-6 ${mode.tone === 'secondary' ? 'border-secondary-fixed/30' : mode.tone === 'tertiary' ? 'border-fuchsia-300/25' : 'border-primary-fixed/30'}`} aria-labelledby={`how-to-${mode.id}`}>
            <div className="flex items-start gap-3" dir={isArabic ? 'rtl' : 'ltr'}>
              <span className={`material-symbols-outlined mt-0.5 ${mode.tone === 'secondary' ? 'text-secondary-fixed' : mode.tone === 'tertiary' ? 'text-fuchsia-300' : 'text-primary-fixed'}`} aria-hidden="true">{mode.icon}</span>
              <div className={`min-w-0 flex-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                <h2 id={`how-to-${mode.id}`} className="font-headline-lg text-headline-lg text-white">{text(mode.title)}</h2>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">{text(mode.intro)}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2" dir={isArabic ? 'rtl' : 'ltr'}>
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                <h3 className={`font-label-caps text-label-caps text-primary-fixed ${isArabic ? 'text-right' : 'text-left'}`}>{isArabic ? 'طريقة إنشاء غرفة' : 'HOW TO CREATE A ROOM'}</h3>
                <div className="mt-3"><StepList items={mode.create[language]} /></div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                <h3 className={`font-label-caps text-label-caps text-secondary-fixed ${isArabic ? 'text-right' : 'text-left'}`}>{isArabic ? 'طريقة الانضمام إلى غرفة' : 'HOW TO JOIN A ROOM'}</h3>
                <div className="mt-3"><StepList items={mode.join[language]} /></div>
              </div>
            </div>
            <div className={`mt-4 rounded-xl border border-primary-fixed/15 bg-primary-fixed/[0.045] p-4 ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
              <h3 className="font-label-caps text-label-caps text-primary-fixed">{isArabic ? 'كيف تعمل المباراة' : 'HOW THE MATCH WORKS'}</h3>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">{text(mode.play)}</p>
            </div>
          </section>
        ))}
      </div>

      <button type="button" onClick={() => navigate('/')} className="ng-interactive mt-6 min-h-11 w-full rounded-lg border border-primary-fixed/40 px-4 py-3 font-label-caps text-label-caps text-primary-fixed hover:bg-primary-fixed/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed/70">{isArabic ? 'العودة إلى الردهة' : 'BACK TO LOBBY'}</button>
    </main>
  );
};

export default HowToPlayPage;
