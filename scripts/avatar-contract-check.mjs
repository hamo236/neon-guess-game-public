import { getPlayerAvatar, getRosterAvatarIndex } from '../src/ui/playerAvatars.js';

const players = ['alpha', 'bravo', 'charlie', 'delta'];
const indices = players.map((id) => getRosterAvatarIndex(players, id));
const sources = players.map((id) => getPlayerAvatar(id));
if (new Set(indices).size !== players.length) {
  throw new Error(`Avatar collision in test roster: ${indices.join(',')}`);
}
if (!sources.every((src) => src.startsWith('data:image/svg+xml;charset=UTF-8,'))) {
  throw new Error('Avatar output is not local SVG data.');
}
console.log(`Avatar contract passed: ${indices.join(',')} unique local SVG avatars.`);
