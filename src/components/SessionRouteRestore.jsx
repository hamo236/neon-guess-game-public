import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameContext } from '../context/GameStateContext';

/**
 * After reconnect restores roomCode + phase from Firebase, navigate to the
 * correct route so refresh lands on the active screen — not always the lobby.
 */
export default function SessionRouteRestore() {
  const { state, GAME_PHASES, fbStatus, isFirebaseConfigured } = useGameContext();
  const navigate = useNavigate();
  const location = useLocation();
  const lastRoutedPhaseRef = useRef(null);

  useEffect(() => {
    if (!state.roomCode) return;
    if (isFirebaseConfigured && fbStatus !== 'ready') return;
    if (lastRoutedPhaseRef.current === state.phase) return;

    const { phase } = state;

    if (phase === GAME_PHASES.PREVIEW || phase === GAME_PHASES.PLAYING) {
      if (location.pathname !== '/game') {
        lastRoutedPhaseRef.current = phase;
        navigate('/game', { replace: true });
      }
    } else if (
      phase === GAME_PHASES.ROUND_END ||
      phase === GAME_PHASES.RESULTS ||
      phase === GAME_PHASES.VOTING
    ) {
      if (location.pathname !== '/results') {
        lastRoutedPhaseRef.current = phase;
        navigate('/results', { replace: true });
      }
    } else if (phase === GAME_PHASES.LOBBY) {
      lastRoutedPhaseRef.current = phase;
      const lobbyPath = state.mode === '1v1' ? '/one-v-one' : '/';
      if (location.pathname !== lobbyPath) {
        navigate(lobbyPath, { replace: true });
      }
    }
  }, [
    state.roomCode,
    state.phase,
    state.mode,
    fbStatus,
    isFirebaseConfigured,
    location.pathname,
    navigate,
    GAME_PHASES,
  ]);

  return null;
}
