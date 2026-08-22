import React from 'react';

const DEFAULT_MODES = [
  { id: 'one_v_one', label: '1v1', caption: 'Guess Who', icon: 'swords' },
  { id: 'team_battle', label: '2v2', caption: 'Team Battle', icon: 'groups' },
  { id: 'tournament', label: 'Four', caption: 'Tournament', icon: 'diversity_3' },
];

/**
 * Presentation-only mode rail. Navigation and active-room safety remain owned
 * by the parent page so this component cannot change room authority or state.
 */
export default function ModeSwitcher({ activeMode, onSelect, roomActive = false, modes = DEFAULT_MODES }) {
  return (
    <section className="ng-mode-switcher rounded-2xl border border-white/10 bg-black/15 p-2 sm:p-2.5" aria-label="Switch game mode">
      <div className="flex items-center justify-between gap-3 px-2 pb-2">
        <div>
          <p className="font-label-caps text-label-caps text-primary-fixed">PLAY PATH</p>
          <p className="mt-0.5 text-xs text-on-surface-variant">Choose a room type before setup.</p>
        </div>
        <span className="material-symbols-outlined text-primary-fixed/70" aria-hidden="true">tune</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5" role="tablist" aria-label="Game modes">
        {modes.map((item) => {
          const isActive = item.id === activeMode;
          const isBlocked = roomActive && !isActive;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-disabled={isBlocked}
              disabled={isBlocked}
              onClick={() => onSelect?.(item.id)}
              className={`ng-mode-switcher__option touch-feedback min-h-14 min-w-0 rounded-xl border px-1.5 py-2 text-center transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dim motion-reduce:transition-none ${
                isActive
                  ? 'border-primary-fixed/60 bg-primary-fixed/15 text-primary-fixed shadow-[0_0_18px_rgba(125,244,255,0.16)]'
                  : isBlocked
                    ? 'cursor-not-allowed border-white/5 bg-white/[0.02] text-on-surface-variant/40'
                    : 'border-white/10 bg-white/[0.025] text-on-surface-variant hover:border-secondary-fixed/50 hover:bg-secondary-fixed/10 hover:text-secondary-fixed'
              }`}
              title={isBlocked ? 'Leave the active room before switching modes' : `${item.label} ${item.caption}`}
            >
              <span className="material-symbols-outlined block text-[19px]" aria-hidden="true">{item.icon}</span>
              <span className="mt-1 block truncate font-label-caps text-[10px] tracking-[0.12em]">{item.label}</span>
              <span className="block truncate text-[9px] leading-3 opacity-70">{item.caption}</span>
            </button>
          );
        })}
      </div>
      {roomActive && <p className="mt-2 px-1 text-[10px] leading-4 text-warning" role="note">Leave the active room before switching mode.</p>}
    </section>
  );
}
