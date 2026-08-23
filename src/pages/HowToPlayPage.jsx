import { useNavigate } from 'react-router-dom';

const modes = [
  {
    id: '1v1',
    icon: 'swords',
    title: '1 vs 1',
    tone: 'primary',
    intro: 'A focused duel for two players. Every round is a direct mind game.',
    create: [
      'Choose 1V1 from the mode buttons at the bottom of the screen.',
      'Type your name in the name field. Names are never filled automatically.',
      'Choose the game type, then select Create Room.',
      'Copy the 3-digit room code and share it with your opponent.',
    ],
    join: [
      'Choose 1V1, then select Join Room.',
      'Enter the 3-digit room code shared by the host.',
      'Type your own name before joining the room.',
      'Select Join Room to enter the duel.',
    ],
    play: 'When both players are ready, the host starts the match. In each round, you see the target your opponent must guess and confirm whether your opponent guessed correctly. After the short reveal, the next round starts. The player with the strongest result wins the duel. 🧠',
  },
  {
    id: '2v2',
    icon: 'groups',
    title: '2 vs 2',
    tone: 'secondary',
    intro: 'Build two balanced teams and coordinate your guesses across synchronized rounds.',
    create: [
      'Choose 2V2 from the mode buttons at the bottom of the screen.',
      'Type your name manually, choose the game type, and select Create Room.',
      'Copy the 3-digit room code and send it to three friends.',
      'Wait for four players, then review the team assignment preview.',
    ],
    join: [
      'Choose 2V2, then select Join Room.',
      'Enter the 3-digit room code.',
      'Type your name in the name field before joining.',
      'Select Join Room and choose your team when the lobby is ready.',
    ],
    play: 'Each team has two players and shares a target. The teams play through synchronized rounds, confirm the required guesses, and collect points together. The team with the best total score wins the Team Battle. 🤝',
  },
  {
    id: 'four',
    icon: 'diversity_3',
    title: '4 Players',
    tone: 'tertiary',
    intro: 'Four players enter one room and are paired into a complete tournament bracket.',
    create: [
      'Choose Four from the mode buttons at the bottom of the screen.',
      'Type your name manually and choose the game type.',
      'Select Create Room, then copy the 3-digit room code.',
      'Share the code with the other three players.',
    ],
    join: [
      'Choose Four, then select Join Room.',
      'Enter the 3-digit room code from the host.',
      'Every player must type a name before joining.',
      'Select Join Room and wait until all four seats are ready.',
    ],
    play: 'The bracket begins with Semi-Final A and Semi-Final B. Each match uses the natural single-target guessing flow: one visible target, then Guess Correct confirmation. Winners meet in the Final for 1st and 2nd place. The two losing players or teams will play against each other to determine the 3rd and 4th places. 🏆',
  },
];

const gameTypes = [
  ['⚽', 'Football Player', 'Guess famous football players.'],
  ['🎨', 'Cartoon Character', 'Guess well-known cartoon characters.'],
  ['🏀', 'Sports Type', 'Guess different sports and athletic disciplines.'],
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

  return (
    <main className="ng-page-shell ng-page-shell--narrow flex-1 w-full max-w-5xl mx-auto px-container-margin pt-24 pb-32 md:pt-32 relative z-10">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-label-caps text-label-caps text-primary-fixed">PLAYER GUIDE · READY ROOM</p>
          <h1 className="mt-2 font-display-lg text-display-lg text-white">HOW TO PLAY</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">Pick a mode, invite your friends, and read the target. This quick guide explains every room flow in NEON GUESS.</p>
        </div>
        <button type="button" onClick={() => navigate('/')} aria-label="Back to lobby" className="ng-interactive shrink-0 rounded-lg border border-white/15 p-2 text-on-surface-variant hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed/70">
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      <section className="glass-panel-2 mb-6 rounded-2xl border border-secondary-fixed/25 p-5 sm:p-6" aria-labelledby="mode-navigation-title">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-secondary-fixed" aria-hidden="true">touch_app</span>
          <div>
            <h2 id="mode-navigation-title" className="font-headline-md text-headline-md text-white">Start at the bottom bar</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">The mode options sit next to each other at the bottom of the screen: <strong className="text-white">1V1</strong>, <strong className="text-white">Four</strong>, and <strong className="text-white">2v2</strong>. Tap one to open that mode’s room lobby.</p>
          </div>
        </div>
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-3" aria-labelledby="game-types-title">
        <div className="sm:col-span-3">
          <h2 id="game-types-title" className="font-headline-md text-headline-md text-white">Choose your game type</h2>
          <p className="mt-1 text-sm text-on-surface-variant">The category controls what you will identify during the match.</p>
        </div>
        {gameTypes.map(([emoji, title, description]) => (
          <article key={title} className="glass-panel-1 rounded-xl border border-white/10 p-4">
            <div className="text-2xl" aria-hidden="true">{emoji}</div>
            <h3 className="mt-2 font-headline-sm text-white">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-on-surface-variant">{description}</p>
          </article>
        ))}
      </section>

      <div className="space-y-5">
        {modes.map((mode) => (
          <section key={mode.id} className={`glass-panel-2 rounded-2xl border p-5 sm:p-6 ${mode.tone === 'secondary' ? 'border-secondary-fixed/30' : mode.tone === 'tertiary' ? 'border-fuchsia-300/25' : 'border-primary-fixed/30'}`} aria-labelledby={`how-to-${mode.id}`}>
            <div className="flex items-start gap-3">
              <span className={`material-symbols-outlined mt-0.5 ${mode.tone === 'secondary' ? 'text-secondary-fixed' : mode.tone === 'tertiary' ? 'text-fuchsia-300' : 'text-primary-fixed'}`} aria-hidden="true">{mode.icon}</span>
              <div className="min-w-0 flex-1">
                <h2 id={`how-to-${mode.id}`} className="font-headline-lg text-headline-lg text-white">{mode.title}</h2>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">{mode.intro}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                <h3 className="font-label-caps text-label-caps text-primary-fixed">HOW TO CREATE A ROOM</h3>
                <div className="mt-3"><StepList items={mode.create} /></div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                <h3 className="font-label-caps text-label-caps text-secondary-fixed">HOW TO JOIN A ROOM</h3>
                <div className="mt-3"><StepList items={mode.join} /></div>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-primary-fixed/15 bg-primary-fixed/[0.045] p-4">
              <h3 className="font-label-caps text-label-caps text-primary-fixed">HOW THE MATCH WORKS</h3>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">{mode.play}</p>
            </div>
          </section>
        ))}
      </div>

      <button type="button" onClick={() => navigate('/')} className="ng-interactive mt-6 min-h-11 w-full rounded-lg border border-primary-fixed/40 px-4 py-3 font-label-caps text-label-caps text-primary-fixed hover:bg-primary-fixed/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed/70">BACK TO LOBBY</button>
    </main>
  );
};

export default HowToPlayPage;

