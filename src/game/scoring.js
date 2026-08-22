/**
 * scoring.js
 * Pure scoring rules for both game modes.
 *
 * MODE A — 1v1 Guess Who:
 *   Correct guess  → +1 point to guesser.
 *   Incorrect guess → 0 points; guessed card is eliminated.
 *
 * MODE B — Social Deduction / Impostor (3–4 players):
 *   At timer expiry or unanimous vote:
 *     - The player whose secret target was voted on by the most players: +2 pts (found)
 *     - Any voter who correctly identified the "impostor" target: +1 pt bonus
 *     - The "impostor" player who survived (not voted out): +3 pts
 *   Note: In local mock mode the "impostor" role is simply the player whose target
 *         differs from the category hint the most — deterministic, not random.
 *   For simplicity, we use:
 *     - Correct final vote on a target → +2 pts to voter
 *     - Target owner survives (not voted) → +3 pts
 */

export const GAME_MODES = {
  ONE_V_ONE: '1v1',
  SOCIAL: 'social',
};

/**
 * Score a guess in 1v1 mode.
 * @param {boolean} correct
 * @returns {{ points: number, message: string }}
 */
export function score1v1Guess(correct) {
  return correct
    ? { points: 1, message: '+1 Point! Correct guess!' }
    : { points: 0, message: 'Wrong guess. Card eliminated.' };
}

/**
 * Calculate final per-player scores at end of social deduction round.
 * Votes: Array of { voterId, targetId }
 * Players: Array of { id, targetId }
 *
 * Rules (documented):
 *  - Each player who votes for the plurality-voted target: +2 pts
 *  - The player who owns the most-voted target loses 0 pts (they are "found")
 *  - Any player whose target was NOT voted for at all: +3 pts (survived)
 *
 * @param {Array<{voterId: string, targetId: string}>} votes
 * @param {Array<{id: string, targetId: string}>} players
 * @returns {Object<string, number>} - map playerId → points earned this round
 */
export function scoreSocialRound(votes, players) {
  const tally = {};
  votes.forEach(({ targetId }) => {
    tally[targetId] = (tally[targetId] || 0) + 1;
  });

  // Find most-voted target
  let maxVotes = 0;
  let topTarget = null;
  for (const [tid, count] of Object.entries(tally)) {
    if (count > maxVotes) {
      maxVotes = count;
      topTarget = tid;
    }
  }

  const pointsMap = {};
  players.forEach((p) => { pointsMap[p.id] = 0; });

  if (!topTarget) return pointsMap; // no votes cast

  // Voters who voted for the top target each get +2
  votes.forEach(({ voterId, targetId }) => {
    if (targetId === topTarget) {
      pointsMap[voterId] = (pointsMap[voterId] || 0) + 2;
    }
  });

  // Player(s) whose target was NOT the most-voted get +3 (survived)
  players.forEach((p) => {
    const votesAgainstMe = tally[p.targetId] || 0;
    if (votesAgainstMe === 0) {
      pointsMap[p.id] = (pointsMap[p.id] || 0) + 3;
    }
  });

  return pointsMap;
}

/**
 * Determine match winner from cumulative scores.
 * @param {Object<string, number>} scores - playerId → total points
 * @param {Array<{id: string, name: string}>} players
 * @returns {{ winnerId: string|null, winnerName: string, isTie: boolean }}
 */
export function determineWinner(scores, players) {
  let max = -1;
  let winnerId = null;
  let tie = false;

  for (const [pid, pts] of Object.entries(scores)) {
    if (pts > max) {
      max = pts;
      winnerId = pid;
      tie = false;
    } else if (pts === max) {
      tie = true;
    }
  }

  const winner = players.find((p) => p.id === winnerId);
  return {
    winnerId: tie ? null : winnerId,
    winnerName: tie ? 'Tie!' : (winner?.name ?? 'Unknown'),
    isTie: tie,
  };
}
