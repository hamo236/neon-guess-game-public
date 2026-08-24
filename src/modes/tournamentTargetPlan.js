import { getItemsByCategory } from '../data/gameData.js';

function stableTargetHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededShuffle(items, seed) {
  const shuffled = [...items];
  let state = stableTargetHash(seed) || 0x9e3779b9;
  const nextRandom = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(nextRandom() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function targetMapForTournament(category, playerIds, { roomSeed = 'default', offset = 0 } = {}) {
  const items = getItemsByCategory(category) || [];
  if (items.length < playerIds.length) throw new Error('Selected category does not have enough targets.');
  const orderedItems = seededShuffle(items, `${roomSeed}:${category}`);
  return Object.fromEntries(playerIds.map((id, index) => {
    const target = orderedItems[(index + offset) % orderedItems.length];
    return [id, { ...target, playerId: id, targetId: target.id }];
  }));
}
