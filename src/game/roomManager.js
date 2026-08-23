/**
 * roomManager.js
 * Local room / lobby management utilities.
 * No Firebase — pure local state helpers.
 */

export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;

/**
 * Generate a short numeric room code.
 * The range starts at 100 so every newly-created room code has exactly 3 digits.
 */
export function generateRoomCode() {
  return String(Math.floor(100 + Math.random() * 900));
}

/**
 * Normalize and validate the public room-code contract.
 * Room codes are intentionally numeric and exactly three digits.
 */
export function normalizeRoomCode(value) {
  const normalized = String(value ?? '').trim();
  if (!/^\d{3}$/.test(normalized)) {
    throw new Error('Room code must be exactly 3 digits.');
  }
  return normalized;
}

/**
 * Build a default mock player object.
 */
export function createPlayer({ id, name, isHost = false }) {
  return {
    id,
    name,
    isHost,
    status: isHost ? 'Host' : 'Ready',
    score: 0,
    avatar: `https://lh3.googleusercontent.com/aida-public/AB6AXuAkTuApbyfmM3ZTGxnHI8re5LGZdO_buGYgwjPmksNb4ZwvBcGpGb77Idl9YApiAxUsElUyZLh90OE3o_qVqSlsdF2x5WRTkcIHed0m7YWgIkw151QrWnWwrtGF-4IyUQ-Up4Dc2bArN-f-9QiJlMgnCPG79ezgwkqgghiVlB-wsV-RPzSbUdv2Ev0uOOr0rumRa7-K4LLCb61d5gR9k1V1PKi-lTmOHdgMH1Qn_hGX4CRHznrYV4o0YQ`,
  };
}

/**
 * Add a mock player to the room if under the limit.
 * Returns { ok: boolean, error?: string, players: Player[] }
 */
export function addMockPlayer(players, name) {
  if (players.length >= MAX_PLAYERS) {
    return { ok: false, error: `Maximum ${MAX_PLAYERS} players allowed.`, players };
  }
  const id = `player_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const newPlayer = createPlayer({ id, name, isHost: false });
  return { ok: true, players: [...players, newPlayer] };
}

/**
 * Remove a player by ID.
 */
export function removePlayer(players, playerId) {
  return players.filter((p) => p.id !== playerId);
}

/**
 * Check if the room can start.
 */
export function canStartGame(players) {
  return players.length >= MIN_PLAYERS && players.length <= MAX_PLAYERS;
}
