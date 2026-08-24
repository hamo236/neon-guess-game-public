export const COMPETITIVE_MODES = {
  TOURNAMENT: 'tournament',
  TEAM_BATTLE: 'team_battle',
};

export const MODE_PHASES = {
  LOBBY: 'lobby',
  SEMI_FINALS: 'semi_finals',
  TRANSITION: 'transition',
  FINAL: 'final',
  CONSOLATION: 'consolation',
  PLAYING: 'playing',
  RESULTS: 'results',
  ROUND_RESULT: 'round_result',
};

export const createModePlayer = ({ id, name, avatar = null, isHost = false }) => ({
  id,
  name,
  avatar,
  isHost,
  connected: true,
  score: 0,
});

export const createStableId = (prefix = 'p') => {
  const suffix = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replaceAll('-', '').slice(0, 10)
    : Math.random().toString(36).slice(2, 12);
  return `${prefix}_${suffix}`;
};

export const clone = (value) => {
  if (value === undefined || value === null) return value;
  const serialized = JSON.stringify(value);
  return serialized === undefined ? value : JSON.parse(serialized);
};
