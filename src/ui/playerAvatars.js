const AVATAR_PALETTES = [
  { accent: '#7df4ff', secondary: '#645cff', glow: '#00dbe9' },
  { accent: '#ff6bd6', secondary: '#6f5cff', glow: '#ff3bbd' },
  { accent: '#b8ff6a', secondary: '#00a8a8', glow: '#8cff00' },
  { accent: '#ffd166', secondary: '#ff6b6b', glow: '#ffae00' },
  { accent: '#9b8cff', secondary: '#36e0ff', glow: '#7a5cff' },
  { accent: '#ff9f68', secondary: '#ff4f81', glow: '#ff6b35' },
  { accent: '#5ff2c2', secondary: '#3478ff', glow: '#00d49b' },
  { accent: '#e2a7ff', secondary: '#ff5c9a', glow: '#bd6cff' },
];

const HEAD_SHAPES = [
  'M32 9c12 0 22 8 22 21v10c0 12-10 21-22 21S10 52 10 40V30C10 18 20 9 32 9Z',
  'M32 8c14 0 24 10 24 24v9c0 12-11 22-24 22S8 53 8 41v-9C8 18 18 8 32 8Z',
  'M32 10c13 0 22 8 24 20l-4 14c-2 11-10 19-20 19S14 55 12 44L8 30c2-12 11-20 24-20Z',
  'M32 8c11 0 21 7 24 18l-3 19c-2 12-10 18-21 18S13 57 10 45L8 26C12 15 21 8 32 8Z',
];

function hashSeed(value) {
  const text = String(value ?? 'player');
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

export function getPlayerAvatarIndex(playerOrId) {
  const raw = typeof playerOrId === 'object' ? (playerOrId?.avatarId ?? playerOrId?.id ?? playerOrId?.name) : playerOrId;
  return hashSeed(raw) % AVATAR_PALETTES.length;
}

export function getRosterAvatarIndex(players, playerOrId) {
  const targetId = typeof playerOrId === 'object' ? playerOrId?.id : playerOrId;
  const used = new Set();
  for (const player of players || []) {
    const id = typeof player === 'object' ? player?.id : player;
    let index = getPlayerAvatarIndex(player);
    while (used.has(index) && used.size < AVATAR_PALETTES.length) index = (index + 1) % AVATAR_PALETTES.length;
    used.add(index);
    if (id === targetId) return index;
  }
  return getPlayerAvatarIndex(playerOrId);
}

export function getPlayerAvatarLabel(playerOrId, avatarIndex) {
  const index = avatarIndex ?? getPlayerAvatarIndex(playerOrId);
  return `Neon avatar ${index + 1}`;
}

export function getPlayerAvatar(playerOrId, avatarIndex) {
  const index = avatarIndex ?? getPlayerAvatarIndex(playerOrId);
  const palette = AVATAR_PALETTES[index];
  const head = HEAD_SHAPES[index % HEAD_SHAPES.length];
  const visor = index % 2 === 0
    ? `<path d="M14 34h36l-4 10H18l-4-10Z" fill="${palette.secondary}" opacity=".9"/><path d="M19 36h10M37 36h8" stroke="${palette.accent}" stroke-width="2.4" stroke-linecap="round"/>`
    : `<path d="M16 31c5-8 27-8 32 0v10H16V31Z" fill="${palette.secondary}" opacity=".9"/><path d="M21 34h7M36 34h7" stroke="${palette.accent}" stroke-width="2.4" stroke-linecap="round"/>`;
  const antenna = index % 3 === 0
    ? `<path d="M32 9V4" stroke="${palette.accent}" stroke-width="2"/><circle cx="32" cy="3.5" r="2" fill="${palette.glow}"/>`
    : `<path d="M12 24 6 19M52 24l6-5" stroke="${palette.accent}" stroke-width="2" stroke-linecap="round"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${getPlayerAvatarLabel(playerOrId)}"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#111c3c"/><stop offset="1" stop-color="#080b1d"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="1.8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect x="2" y="2" width="60" height="60" rx="18" fill="url(#bg)" stroke="${palette.glow}" stroke-opacity=".72" stroke-width="1.5"/><circle cx="13" cy="13" r="2" fill="${palette.accent}" opacity=".8"/><circle cx="51" cy="51" r="1.5" fill="${palette.secondary}" opacity=".9"/><g filter="url(#glow)">${antenna}<path d="${head}" fill="#19265a" stroke="${palette.accent}" stroke-width="1.8"/><path d="M17 50c4-7 10-10 15-10s11 3 15 10" fill="${palette.secondary}" opacity=".9" stroke="${palette.accent}" stroke-width="1.5"/>${visor}<path d="M25 48h14" stroke="${palette.accent}" stroke-width="2" stroke-linecap="round" opacity=".85"/></g></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const PLAYER_AVATAR_COUNT = AVATAR_PALETTES.length;
