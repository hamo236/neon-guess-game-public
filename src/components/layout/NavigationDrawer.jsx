import React from 'react';
import { NavLink } from 'react-router-dom';
import { useGameContext } from '../../context/GameStateContext';

const NAV_ITEMS = [
  { label: 'Lobby', icon: 'home', path: '/' },
  { label: 'Game', icon: 'sports_esports', path: '/game' },
  { label: 'Results', icon: 'leaderboard', path: '/results' },
  { label: 'Tournament', icon: 'emoji_events', path: '/tournament' },
  { label: 'Team Battle', icon: 'groups', path: '/team-battle' },
];

const NavigationDrawer = ({ isOpen, closeDrawer }) => {
  const { myPlayer, state } = useGameContext();

  const userName = myPlayer?.name || 'Guest Player';
  const avatar = myPlayer?.avatar;

  return (
    <nav
      aria-label="Primary navigation"
      aria-hidden={!isOpen}
      className={`hidden md:flex flex-col p-stack-lg bg-surface-dim/95 backdrop-blur-3xl h-[calc(100vh-4rem)] w-80 border-r border-white/10 fixed left-0 top-16 z-40 shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="relative shrink-0">
          {avatar ? (
            <img src={avatar} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-primary-fixed" />
          ) : (
            <div className="w-12 h-12 rounded-full border-2 border-primary-fixed/60 bg-primary-fixed/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary-fixed" aria-hidden="true">person</span>
            </div>
          )}
          {state.roomCode && (
            <span
              className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-surface-dim bg-primary shadow-[0_0_12px_rgba(125,244,255,0.65)]"
              aria-label="Connected to a room"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-surface-dim" aria-hidden="true" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-headline-sm text-headline-sm text-primary-fixed truncate">{userName}</h2>
          <p className="mt-1 inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 font-label-caps text-label-caps tracking-[0.12em] text-on-surface-variant">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${state.roomCode ? 'bg-primary shadow-[0_0_8px_rgba(125,244,255,0.75)]' : 'bg-on-surface-variant/70'}`}
              aria-hidden="true"
            />
            <span className="truncate">{state.roomCode ? `Room ${state.roomCode}` : 'Ready to play'}</span>
          </p>
        </div>
      </div>

      <div className="mb-3 px-3">
        <p className="font-label-caps text-label-caps text-on-surface-variant">Navigate</p>
      </div>

      <ul className="flex flex-col gap-2" role="list">
        {NAV_ITEMS.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end={item.path === '/'}
              onClick={closeDrawer}
              className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed/70 ${
                isActive
                  ? 'bg-primary-fixed/10 text-primary-fixed border border-primary-fixed/30'
                  : 'text-on-surface-variant hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
              <span className="font-body-lg text-body-lg">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6 border-t border-white/10">
        <NavLink
          to="/admin"
          onClick={closeDrawer}
          className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed/70 ${
            isActive ? 'bg-primary-fixed/10 text-primary-fixed' : 'text-on-surface-variant hover:bg-white/5 hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined" aria-hidden="true">lock</span>
          <span className="font-body-lg text-body-lg">Admin Gateway</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default NavigationDrawer;
