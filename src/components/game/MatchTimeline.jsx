import React from 'react';

const MatchTimeline = ({ phase, GAME_PHASES, className = '' }) => {
  const steps = [
    { key: 'lobby', label: 'Lobby', icon: 'groups', phases: [GAME_PHASES.LOBBY] },
    { key: 'preview', label: 'Ready', icon: 'visibility', phases: [GAME_PHASES.PREVIEW] },
    { key: 'playing', label: 'Playing', icon: 'sports_esports', phases: [GAME_PHASES.PLAYING] },
    { key: 'results', label: 'Results', icon: 'emoji_events', phases: [GAME_PHASES.ROUND_END, GAME_PHASES.VOTING, GAME_PHASES.RESULTS] },
  ];

  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.phases.includes(phase)),
  );

  return (
    <nav aria-label="Match progress" className={`w-full px-container-margin py-2 sm:py-3 ${className}`}>
      <ol className="mx-auto flex w-full max-w-3xl items-center justify-between gap-0.5 sm:gap-1">
        {steps.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isComplete = index < currentIndex;
          return (
            <React.Fragment key={step.key}>
              <li className="flex min-w-0 flex-1 flex-col items-center gap-0.5 sm:gap-1">
                <span
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border text-[12px] sm:text-[14px] transition-colors ${
                    isCurrent
                      ? 'border-primary-fixed bg-primary-fixed/20 text-primary-fixed shadow-[0_0_12px_rgba(125,244,255,0.35)]'
                      : isComplete
                        ? 'border-secondary/60 bg-secondary/10 text-secondary'
                        : 'border-white/15 bg-white/5 text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                    {isComplete ? 'check' : step.icon}
                  </span>
                </span>
                <span className={`max-w-full truncate text-center text-[9px] uppercase tracking-[0.08em] sm:text-[10px] sm:tracking-wider ${isCurrent ? 'text-primary-fixed' : 'text-on-surface-variant'}`}>
                  {step.label}
                </span>
              </li>
              {index < steps.length - 1 && (
                <li aria-hidden="true" className={`mb-3 h-px flex-1 transition-colors sm:mb-4 ${index < currentIndex ? 'bg-secondary/60' : 'bg-white/10'}`} />
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

export default MatchTimeline;
