import assert from 'node:assert/strict';
import {
  createTournamentState,
  finishMatch,
  completeTournamentRound,
  TOURNAMENT_MATCH_IDS,
} from '../src/modes/tournamentEngine.js';
import { MODE_PHASES } from '../src/modes/modeTypes.js';

const players = [1, 2, 3, 4].map((id) => ({ id: `p${id}`, name: `P${id}` }));

function playingMatch(matchId, playerIds) {
  return {
    matchId,
    playerIds,
    playerMap: Object.fromEntries(playerIds.map((id) => [id, true])),
    status: 'playing',
    roundNumber: 3,
    phase: MODE_PHASES.PLAYING,
    scores: undefined,
    targets: undefined,
    guesses: undefined,
    result: null,
    roundEndTimestamp: null,
    revealEndTimestamp: null,
  };
}

let base = createTournamentState({ tournamentId: 't', roomId: 'r', players, category: 'cartoon', hostId: 'p1' });
base = {
  ...base,
  phase: MODE_PHASES.PLAYING,
  matches: {
    ...base.matches,
    [TOURNAMENT_MATCH_IDS.SEMI_A]: { ...base.matches[TOURNAMENT_MATCH_IDS.SEMI_A], status: 'finished', result: { winnerId: 'p1', loserId: 'p2' } },
    [TOURNAMENT_MATCH_IDS.SEMI_B]: { ...base.matches[TOURNAMENT_MATCH_IDS.SEMI_B], status: 'finished', result: { winnerId: 'p3', loserId: 'p4' } },
    [TOURNAMENT_MATCH_IDS.FINAL]: playingMatch(TOURNAMENT_MATCH_IDS.FINAL, ['p1', 'p3']),
    [TOURNAMENT_MATCH_IDS.CONSOLATION]: playingMatch(TOURNAMENT_MATCH_IDS.CONSOLATION, ['p2', 'p4']),
  },
};

const afterFinal = finishMatch(base, TOURNAMENT_MATCH_IDS.FINAL, 'p1');
assert.equal(afterFinal.status, 'final_pending_consolation');
assert.equal(afterFinal.phase, MODE_PHASES.PLAYING, 'the consolation match must remain playable after Final finishes first');
assert.equal(afterFinal.matches[TOURNAMENT_MATCH_IDS.CONSOLATION].status, 'playing');

const afterConsolation = finishMatch(afterFinal, TOURNAMENT_MATCH_IDS.CONSOLATION, 'p2');
assert.equal(afterConsolation.status, 'finished');
assert.equal(afterConsolation.phase, MODE_PHASES.RESULTS);
assert.deepEqual(
  [afterConsolation.winnerId, afterConsolation.secondPlaceId, afterConsolation.thirdPlaceId, afterConsolation.fourthPlaceId],
  ['p1', 'p3', 'p2', 'p4'],
);

assert.doesNotThrow(() => finishMatch(base, TOURNAMENT_MATCH_IDS.FINAL, 'p1'), 'missing maps must not reach JSON.parse as undefined');

const malformed = {
  ...base,
  matches: {
    ...base.matches,
    [TOURNAMENT_MATCH_IDS.SEMI_A]: { ...base.matches[TOURNAMENT_MATCH_IDS.SEMI_A], status: 'finished', result: undefined },
    [TOURNAMENT_MATCH_IDS.SEMI_B]: { ...base.matches[TOURNAMENT_MATCH_IDS.SEMI_B], status: 'playing', guesses: { p3: { playerId: 'p3', targetId: 'p4', correct: true }, p4: { playerId: 'p4', targetId: 'p3', correct: true } } },
  },
};
assert.throws(
  () => finishMatch(malformed, TOURNAMENT_MATCH_IDS.SEMI_B, 'p3'),
  /both semifinal winners and losers are required/,
  'malformed semifinal results must block bracket creation',
);

const roundState = {
  ...base,
  matches: { ...base.matches, [TOURNAMENT_MATCH_IDS.FINAL]: playingMatch(TOURNAMENT_MATCH_IDS.FINAL, ['p1', 'p3']) },
};
assert.doesNotThrow(() => completeTournamentRound(roundState, TOURNAMENT_MATCH_IDS.FINAL), 'missing round maps must be normalized before JSON cloning');

console.log('tournament-json-progression: PASS');
console.log('Undefined-safe match finalization and final-first consolation progression are covered.');
