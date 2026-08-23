import assert from 'node:assert/strict';
import {
  TOURNAMENT_MATCH_IDS,
  TOURNAMENT_ROUND_COUNT,
  TOURNAMENT_REVEAL_MS,
  createTournamentState,
  startMatch,
  recordMatchGuess,
  completeTournamentRound,
  advanceTournamentRound,
  finishMatch,
  startNextTournamentMatches,
} from '../src/modes/tournamentEngine.js';
import { MODE_PHASES, createModePlayer } from '../src/modes/modeTypes.js';

const players = ['p1', 'p2', 'p3', 'p4'].map((id, index) => createModePlayer({ id, name: `Player ${index + 1}`, isHost: index === 0 }));
const targetMap = (ids, round) => Object.fromEntries(ids.map((id, index) => [id, { id: `${id}-target-${round}`, name: `${id} target ${round}`, image: `/target-${id}-${round}.png` }]));

function playRound(state, matchId, round) {
  const ids = state.matches[matchId].playerIds;
  let next = startMatch(state, matchId, targetMap(ids, round));
  next = recordMatchGuess(next, matchId, ids[0], next.matches[matchId].targets[ids[1]].id);
  next = recordMatchGuess(next, matchId, ids[1], next.matches[matchId].targets[ids[0]].id);
  next = completeTournamentRound(next, matchId);
  assert.equal(next.matches[matchId].status, 'round_result');
  assert.equal(next.matches[matchId].phase, MODE_PHASES.ROUND_RESULT);
  assert.equal(next.matches[matchId].roundNumber, round);
  assert.equal(next.matches[matchId].result.revealSnapshot.length, 2);
  assert.ok(next.matches[matchId].revealEndTimestamp >= next.matches[matchId].result.completedAt + TOURNAMENT_REVEAL_MS - 5);
  return next;
}

let state = createTournamentState({ tournamentId: 't1', roomId: '123', players, category: 'football', hostId: 'p1' });
for (const matchId of [TOURNAMENT_MATCH_IDS.SEMI_A, TOURNAMENT_MATCH_IDS.SEMI_B]) {
  for (let round = 1; round <= TOURNAMENT_ROUND_COUNT; round += 1) {
    state = playRound(state, matchId, round);
    if (round < TOURNAMENT_ROUND_COUNT) {
      const ids = state.matches[matchId].playerIds;
      state = advanceTournamentRound(state, matchId, targetMap(ids, round + 1));
      assert.equal(state.matches[matchId].status, 'playing');
      assert.equal(state.matches[matchId].roundNumber, round + 1);
    } else {
      const match = state.matches[matchId];
      const winner = match.playerIds[0];
      state = finishMatch({ ...state, matches: { ...state.matches, [matchId]: { ...match, status: 'playing', phase: MODE_PHASES.PLAYING } } }, matchId, winner);
    }
  }
}
assert.equal(state.phase, MODE_PHASES.TRANSITION);
assert.deepEqual(state.matches.final.playerIds, ['p1', 'p3']);
assert.deepEqual(state.matches.consolation.playerIds, ['p2', 'p4']);
assert.ok(state.transitionEndTimestamp > Date.now());

state = startNextTournamentMatches(state, {
  [TOURNAMENT_MATCH_IDS.FINAL]: targetMap(state.matches.final.playerIds, 1),
  [TOURNAMENT_MATCH_IDS.CONSOLATION]: targetMap(state.matches.consolation.playerIds, 1),
});
assert.equal(state.phase, MODE_PHASES.PLAYING);
assert.equal(state.matches.final.status, 'playing');
assert.equal(state.matches.consolation.status, 'playing');

for (const matchId of [TOURNAMENT_MATCH_IDS.FINAL, TOURNAMENT_MATCH_IDS.CONSOLATION]) {
  for (let round = 1; round <= TOURNAMENT_ROUND_COUNT; round += 1) {
    state = playRound(state, matchId, round);
    if (round < TOURNAMENT_ROUND_COUNT) {
      const ids = state.matches[matchId].playerIds;
      state = advanceTournamentRound(state, matchId, targetMap(ids, round + 1));
    } else {
      const match = state.matches[matchId];
      const winner = match.playerIds[0];
      state = finishMatch({ ...state, matches: { ...state.matches, [matchId]: { ...match, status: 'playing', phase: MODE_PHASES.PLAYING } } }, matchId, winner);
    }
  }
}
assert.equal(state.phase, MODE_PHASES.RESULTS);
assert.equal(state.status, 'finished');
assert.deepEqual([state.winnerId, state.secondPlaceId, state.thirdPlaceId, state.fourthPlaceId], ['p1', 'p3', 'p2', 'p4']);
assert.equal(state.matches.final.roundNumber, TOURNAMENT_ROUND_COUNT);
assert.equal(state.matches.consolation.roundNumber, TOURNAMENT_ROUND_COUNT);
assert.equal(state.matches.final.status, 'finished');
assert.equal(state.matches.consolation.status, 'finished');

console.log('tournament-lifecycle: PASS');
console.log('Tournament semifinals, final, and third-place match each complete exactly three rounds with reveal states and bracket progression.');
