import { GAME_PHASES, confirmOpponentGuessed } from './src/game/gameEngine.js';

const ids = ['p1', 'p2', 'p3', 'p4'];
const players = ids.map((id, index) => ({ id, name: `Player ${index + 1}` }));
const targets = Object.fromEntries(ids.map((id, index) => [id, { id: `target-${index + 1}`, name: `Target ${index + 1}`, image: `/target-${index + 1}.png` }]));
const displayTargets = {
  p1: targets.p2,
  p2: targets.p3,
  p3: targets.p4,
  p4: targets.p1,
};
const state = {
  phase: GAME_PHASES.PLAYING,
  players,
  round: 1,
  totalRounds: 3,
  targets,
  roundTargets: targets,
  displayTargets,
  scores: Object.fromEntries(ids.map((id) => [id, 0])),
  roundResult: null,
};

const first = confirmOpponentGuessed(state, { confirmerId: 'p2', guessedPlayerId: 'p1' });
if (first.roundResult?.winnerId !== 'p1') throw new Error('Winner identity was not preserved');
if (first.scores.p1 !== 1 || first.scores.p2 !== 0) throw new Error('Score was not assigned to the authoritative guessed player');
if (Object.keys(first.roundResult.revealedTargets ?? {}).sort().join(',') !== ids.join(',')) throw new Error('Reveal snapshot does not contain all four players');
if (first.roundResult.revealedTargets.p1?.id !== 'target-2') throw new Error('Player 1 display target is not Player 2\'s authoritative target');
if (first.roundResult.revealedTargets.p4?.id !== 'target-1') throw new Error('Cyclic Player 4 target mapping is incorrect');

const duplicate = confirmOpponentGuessed(first, { confirmerId: 'p2', guessedPlayerId: 'p1' });
if (duplicate !== first) throw new Error('Duplicate confirmation was not rejected as an idempotent no-op');
if (duplicate.scores.p1 !== 1) throw new Error('Duplicate confirmation changed the score');

console.log('ORIGINAL_34_QA_PASS');
console.log(JSON.stringify({ winnerId: first.roundResult.winnerId, revealedPlayers: Object.keys(first.roundResult.revealedTargets).length, scores: first.scores }));
