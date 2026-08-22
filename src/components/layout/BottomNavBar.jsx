import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useGameContext } from '../../context/GameStateContext';
import RoomLeaveDialog from '../RoomLeaveDialog';

const BottomNavBar = ({ roomActive, onRequestLeave, onSetMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, actions, GAME_MODES } = useGameContext();
  const hasActiveRoom = roomActive ?? Boolean(state.roomCode);
  const setMode = onSetMode || actions.setMode;
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const isGame = location.pathname === '/game';
  
  if (isGame) return null; // In-game has its own chat drawer

  const handleLeaveRoom = async () => {
    setShowLeaveDialog(false);
    if (onRequestLeave) {
      await onRequestLeave();
    } else {
      await actions.leaveRoom();
    }
    const destination = pendingItem || navItems[0];
    if (destination.mode) setMode(destination.mode);
    setPendingItem(null);
    navigate(destination.path);
  };

  const navItems = [
    { name: 'Home', icon: 'home', path: '/' },
    { name: '1V1', icon: 'swords', path: '/one-v-one', mode: GAME_MODES.ONE_V_ONE },
    { name: 'Four', icon: 'diversity_3', path: '/tournament' },
    { name: '2v2', icon: 'groups', path: '/team-battle' }
  ];

  return (
    <>
    <nav aria-label="Mobile navigation" className="ng-mobile-nav-dock bg-white/5 backdrop-blur-2xl fixed bottom-0 w-full z-50 rounded-t-xl border-t border-white/10 shadow-none flex justify-around items-center h-20 pb-safe md:hidden">
      {navItems.map((item) => {
        const isActive = item.mode === GAME_MODES.ONE_V_ONE
          ? location.pathname === '/one-v-one' || (location.pathname === '/' && new URLSearchParams(location.search).get('mode') === '1v1')
          : location.pathname === item.path;
        return (
          <Link
            key={item.name}
            to={item.path}
            onClick={(event) => {
              if (hasActiveRoom) {
                event.preventDefault();
                setPendingItem(item);
                setShowLeaveDialog(true);
                return;
              }
              if (item.mode) {
                event.preventDefault();
                setMode(item.mode);
                navigate(item.path);
              }
            }}
            aria-label={item.name === 'Four' ? 'Four-player mode' : item.name}
            className={`ng-mobile-nav-link touch-feedback flex min-w-0 flex-col items-center justify-center w-1/4 min-h-11 rounded-lg px-1 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed/70 active:scale-[0.97] duration-150 transition-[color,filter,transform] ${
              isActive 
                ? 'ng-mobile-nav-link--active text-primary-fixed drop-shadow-[0_0_8px_rgba(125,244,255,0.6)]' 
                : 'text-on-surface-variant hover:text-primary-fixed-dim'
            }`}
          >
            <span className="material-symbols-outlined mb-1" style={isActive ? {fontVariationSettings: "'FILL' 1"} : {}}>
              {item.icon}
            </span>
            <span className="block max-w-full truncate text-center whitespace-nowrap font-label-caps text-label-caps text-[10px] sm:text-[12px]">{item.name}</span>
          </Link>
        );
      })}
    </nav>
    {showLeaveDialog && <RoomLeaveDialog onConfirm={handleLeaveRoom} onCancel={() => { setPendingItem(null); setShowLeaveDialog(false); }} />}
    </>
  );
};

export default BottomNavBar;
