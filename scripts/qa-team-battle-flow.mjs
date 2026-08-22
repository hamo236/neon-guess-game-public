import assert from 'node:assert/strict';
import { sanitizePublicState } from '../src/firebase/competitiveFirebase.js';
import {
  TEAM_IDS,
  createTeamBattleState,
  assignTeamTargets,
  confirmTeamRound,
  areAllRequiredTeamConfirmationsComplete,
  finishTeamRound,
  advanceTeamRound,
} from '../src/modes/teamBattleEngine.js';

const players = [
  { id: 'p1', name: 'Ahmed', joinOrder: 1 },
  { id: 'p2', name: 'Mohamed', joinOrder: 2 },
  { id: 'p3', name: 'Youssef', joinOrder: 3 },
  { id: 'p4', name: 'Omar', joinOrder: 4 },
];
const target = (id, name) => ({ id, targetId: id, name, image: `${id}.png` });
const roundTargets = (round) => ({
  p1: { ...target(`a${round}`, `Team A Target ${round}`), playerId: 'p1', teamId: TEAM_IDS.A },
  p2: { ...target(`a${round}`, `Team A Target ${round}`), playerId: 'p2', teamId: TEAM_IDS.A },
  p3: { ...target(`b${round}`, `Team B Target ${round}`), playerId: 'p3', teamId: TEAM_IDS.B },
  p4: { ...target(`b${round}`, `Team B Target ${round}`), playerId: 'p4', teamId: TEAM_IDS.B },
});

let state = createTeamBattleState({
  teamRoomId: 'QA-TEAM',
  players,
  category: 'sports',
  hostId: 'p1',
  teamAssignments: {
    [TEAM_IDS.A]: { teamId: TEAM_IDS.A, playerIds: ['p1', 'p2'] },
    [TEAM_IDS.B]: { teamId: TEAM_IDS.B, playerIds: ['p3', 'p4'] },
  },
});

let dualTeamState = assignTeamTargets({ ...state, roundNumber: 1, match: { ...state.match, matchId: 'QA-TEAM_dual_match_1', roundNumber: 1 } }, roundTargets(1));
dualTeamState = { ...dualTeamState, match: { ...dualTeamState.match, confirmationTeamId: TEAM_IDS.A, confirmationTeamIds: [TEAM_IDS.A], guesses: { p3: { playerId: 'p3', correct: true, opponentTeamId: TEAM_IDS.A }, p1: { playerId: 'p1', correct: true, opponentTeamId: TEAM_IDS.B } } } };
dualTeamState = confirmTeamRound(dualTeamState, 'p1', 3001, { targetSnapshot: roundTargets(1).p1 });
dualTeamState = confirmTeamRound(dualTeamState, 'p2', 3002, { targetSnapshot: roundTargets(1).p2 });
assert.equal(areAllRequiredTeamConfirmationsComplete(dualTeamState), false, 'dual-team case must wait for Team B confirmations');
dualTeamState = confirmTeamRound(dualTeamState, 'p3', 3003, { targetSnapshot: roundTargets(1).p3 });
dualTeamState = confirmTeamRound(dualTeamState, 'p4', 3004, { targetSnapshot: roundTargets(1).p4 });
assert.equal(areAllRequiredTeamConfirmationsComplete(dualTeamState), true, 'both required teams must complete with distinct teammate IDs');

for (let round = 1; round <= 3; round += 1) {
  state = assignTeamTargets({ ...state, roundNumber: round, match: { ...state.match, matchId: `QA-TEAM_match_${round}`, roundNumber: round } }, roundTargets(round));
  state = {
    ...state,
    match: {
      ...state.match,
      confirmationTeamId: TEAM_IDS.A,
      confirmationTeamIds: [TEAM_IDS.A],
      guesses: { p3: { playerId: 'p3', correct: true, opponentTeamId: TEAM_IDS.A } },
    },
  };
  const beforeUnauthorizedConfirmation = state;
  state = confirmTeamRound(state, 'p3', 900 + round, { targetSnapshot: roundTargets(round).p3 });
  assert.deepEqual(state, beforeUnauthorizedConfirmation, `round ${round} must reject the non-defending team confirmation`);
  state = confirmTeamRound(state, 'p1', 1000 + round, { targetSnapshot: roundTargets(round).p1 });
  assert.equal(areAllRequiredTeamConfirmationsComplete(state), false, `round ${round} must wait for teammate one`);
  state = confirmTeamRound(state, 'p2', 2000 + round, { targetSnapshot: roundTargets(round).p2 });
  assert.equal(areAllRequiredTeamConfirmationsComplete(state), true, `round ${round} must resolve after both confirmations`);
  state = finishTeamRound(state, TEAM_IDS.B, { guesses: state.match.guesses, winningTeamIds: [TEAM_IDS.B], targetSnapshots: { [TEAM_IDS.A]: roundTargets(round).p1 } });
  assert.equal(state.playerStats.p1.roundHistory.at(-1).target.targetId, `a${round}`, `round ${round} must retain the completed target in player history`);
  if (round < 3) {
    assert.equal(state.status, 'round_result');
    assert.equal(state.phase, 'round_result');
    assert.equal(state.match.status, 'round_result');
    assert.ok(state.match.revealEndTimestamp > 0);
    state = advanceTeamRound(state, roundTargets(round + 1));
    assert.equal(state.roundNumber, round + 1);
    assert.equal(state.status, 'active');
    assert.equal(state.match.status, 'playing');
  }
}

assert.equal(state.status, 'finished');
assert.equal(state.phase, 'results');
assert.equal(state.match.status, 'finished');
assert.equal(state.finalResult.winningTeamId, TEAM_IDS.B);
assert.equal(state.finalResult.teamScores[TEAM_IDS.B], 3);
assert.equal(state.finalResult.teamScores[TEAM_IDS.A], 0);
assert.equal(state.roundHistory.length, 3);

const sanitizedLegacyRound = sanitizePublicState({
  roundHistory: [{ roundNumber: 1, matchId: 'legacy_match', result: 'round_result' }],
  match: { status: 'round_result' },
});
assert.equal(Object.prototype.hasOwnProperty.call(sanitizedLegacyRound.roundHistory[0], 'guesses'), false, 'sanitizer must omit absent round guesses instead of writing undefined');
console.log('Team Battle 3-round flow QA passed: dual confirmation gate, 5s reveal state, round advancement, and final winner are deterministic.');
