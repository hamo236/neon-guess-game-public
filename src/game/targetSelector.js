/**
 * targetSelector.js
 * Pure utility for selecting non-repeating targets across rounds.
 */

import { getItemsByCategory } from '../data/gameData.js';

/**
 * Select N unique targets from a category, excluding already-used IDs.
 * Returns the selected items, or fewer if the category is exhausted.
 *
 * @param {string} category     - CATEGORIES constant
 * @param {string[]} usedIds    - Array of item IDs already used this match
 * @param {number} count        - How many targets to pick
 * @returns {{ selected: Item[], remaining: Item[] }}
 */
export function selectTargets(category, usedIds, count) {
  const all = getItemsByCategory(category);
  const available = all.filter((item) => !usedIds.includes(item.id));

  if (available.length === 0) {
    console.warn('[targetSelector] Category exhausted — no unused targets left.');
    return { selected: [], remaining: [] };
  }

  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);
  const remaining = shuffled.slice(count);
  return { selected, remaining };
}

/**
 * Pick exactly one target per player ensuring uniqueness within the same pick.
 *
 * @param {string} category   - CATEGORIES constant
 * @param {string[]} usedIds  - IDs already used this match (all previous rounds)
 * @param {number} playerCount
 * @returns {Item[]} - Array of length playerCount (may be shorter if exhausted)
 */
export function assignTargetsToPlayers(category, usedIds, playerCount) {
  const { selected } = selectTargets(category, usedIds, playerCount);
  return selected;
}
