import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const TopAppBar = ({ toggleDrawer, drawerOpen = false }) => {
  const location = useLocation();
  const isGame = location.pathname === '/game';
  const isResults = location.pathname === '/results';

  if (isGame) {
    return (
      <header className="relative z-20 flex justify-between items-center px-container-margin h-16 bg-white/5 backdrop-blur-xl border-b border-white/10 shrink-0 mt-safe">
        <div className="flex items-center gap-gutter">
          <div className="flex flex-col items-center">
            <span className="font-label-caps text-label-caps text-primary">YOU</span>
            <span className="font-stats-num text-stats-num text-on-surface">12</span>
          </div>
          <div className="h-8 w-px bg-white/20"></div>
          <div className="flex flex-col items-center">
            <span className="font-label-caps text-label-caps text-on-surface-variant">OPP</span>
            <span className="font-stats-num text-stats-num text-on-surface-variant">08</span>
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <h1 className="font-headline-sm text-headline-sm text-primary neon-text-glow">ROUND 1/3</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-fixed animate-pulse-neon">timer</span>
          <span className="font-stats-num text-stats-num text-primary-fixed animate-pulse-neon">01:45</span>
        </div>
      </header>
    );
  }

  return (
    <header className={`${isResults ? 'fixed' : 'fixed hidden md:flex'} top-0 w-full z-50 bg-slate-950/70 backdrop-blur-xl border-b border-white/15 shadow-lg shadow-cyan-950/10 flex justify-between items-center px-container-margin h-16 transition-colors duration-200`}>
      <button
        type="button"
        onClick={toggleDrawer}
        aria-label={drawerOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={drawerOpen}
        title={drawerOpen ? 'Close navigation' : 'Open navigation'}
        className="touch-feedback text-on-surface-variant hover:bg-cyan-300/10 hover:text-primary-fixed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed/70 transition-colors active:scale-95 duration-150 p-2 rounded-full flex items-center justify-center"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>
      <h1 className="font-display-lg text-display-lg text-primary-fixed uppercase tracking-tighter neon-text-glow drop-shadow-[0_0_16px_rgba(125,244,255,0.24)]">NEON GUESS</h1>
      <Link
        to="/admin"
        aria-label="Open admin gateway"
        title="Admin gateway"
        className="touch-feedback text-on-surface-variant hover:bg-cyan-300/10 hover:text-primary-fixed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed/70 transition-colors active:scale-95 duration-150 p-2 rounded-full flex items-center justify-center"
      >
        <span className="material-symbols-outlined">lock</span>
      </Link>
    </header>
  );
};

export default TopAppBar;
