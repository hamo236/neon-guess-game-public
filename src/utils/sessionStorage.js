/**
 * Persists minimal session metadata for reconnect after refresh.
 * Firebase remains the source of truth for game state.
 */

const SESSION_KEY = 'neon_guess_session';

export function saveSession({ roomCode, playerId, playerName }) {
  if (!roomCode || !playerId) return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      roomCode: roomCode.toUpperCase(),
      playerId,
      playerName: playerName || 'Player',
      savedAt: Date.now(),
    }));
  } catch {
    // sessionStorage unavailable — reconnect via manual room code still works
  }
}

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
