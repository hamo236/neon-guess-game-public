import assert from 'node:assert/strict';
import {
  TEAM_IDS,
  createTeamBattleState,
  getRequiredConfirmationTeams,
  confirmTeamRound,
  finishTeamRound,
  advanceTeamRound,
} from '../src/modes/teamBattleEngine.js';

const players = [
  { id: 'a1', name: 'A1', joinOrder: 1 },
  { id: 'a2', name: 'A2', joinOrder: 2 },
  { id: 'b1', name: 'B1', joinOrder: 3 },
  { id: 'b2', name: 'B2', joinOrder: 4 },
];
const assignments = {
  [TEAM_IDS.A]: { teamId: TEAM_IDS.A, playerIds: ['a1', 'a2'] },
  [TEAM_IDS.B]: { teamId: TEAM_IDS.B, playerIds: ['b1', 'b2'] },
};
const target = { id: 'target-1', targetId: 'target-1', name: 'Target 1', image: '/target-1.png' };
const base = () => createTeamBattleState({ teamRoomId: 'QA-ROOM', players, category: 'animals', hostId: 'a1', teamAssignments: assignments });
const withCorrectGuess = (state, guessingPlayerId, opponentTeamId) => ({
  ...state,
  match: {
    ...state.match,
    guesses: {
      [guessingPlayerId]: { playerId: guessingPlayerId, targetId: target.id, correct: true, opponentTeamId, matchId: state.match.matchId, roundNumber: state.roundNumber },
    },
  },
});
const confirm = (state, playerId) => confirmTeamRound(state, playerId, 1000, { targetSnapshot: target });

let state = base();
assert.deepEqual(getRequiredConfirmationTeams(state), [], 'No correct guess must produce no required team');
assert.deepEqual(confirm(state, 'a1'), state, 'Unknown required team must fail closed without a synchronized owned-target snapshot');
const ownedTarget = { ...target, teamId: TEAM_IDS.A };
state = confirmTeamRound(state, 'a1', 1000, { targetSnapshot: ownedTarget });
assert.equal(state.match.confirmationTeamIds[0], TEAM_IDS.A, 'A synchronized owned-target snapshot must establish the defending team for the real UI confirmation path');
assert.equal(Object.keys(state.match.confirmations[TEAM_IDS.A]).length, 1, 'Real confirmation path must persist the first teammate confirmation without a legacy guess record');
state = base();

state = withCorrectGuess(state, 'a1', TEAM_IDS.B); // Team A guessed Team B target.
assert.deepEqual(getRequiredConfirmationTeams(state), [TEAM_IDS.B], 'Team B must be the only required team');
assert.deepEqual(confirm(state, 'a1'), state, 'The guessing team must not be allowed to confirm');
assert.deepEqual(confirmTeamRound(state, 'b1', 1000), state, 'Missing private target must fail closed');
assert.deepEqual(confirmTeamRound(state, 'b1', 1000, { targetSnapshot: { id: target.id }, }), state, 'Incomplete target snapshot must fail closed');
state = confirm(state, 'b1');
assert.equal(state.match.confirmations[TEAM_IDS.B].b1.roundNumber, 1, 'First distinct defender confirmation must persist');
assert.equal(Object.keys(state.match.confirmations[TEAM_IDS.B]).length, 1, 'First confirmation must be 1/2');
const cancelled = confirm(state, 'b1');
assert.equal(cancelled.match.confirmations[TEAM_IDS.B]?.b1, undefined, 'The confirming player must be able to withdraw only their own pending confirmation');
assert.equal(cancelled.match.confirmationTeamId, TEAM_IDS.B, 'Withdrawing a pending confirmation must preserve the valid team requirement while removing only the player confirmation');
state = confirm(cancelled, 'b1');
assert.equal(Object.keys(state.match.confirmations[TEAM_IDS.B]).length, 1, 'The player can confirm again after cancelling');
const duplicate = confirm(state, 'b1');
assert.equal(duplicate.match.confirmations[TEAM_IDS.B]?.b1, undefined, 'A second click toggles the same player confirmation off');
state = confirm(duplicate, 'b1');
state = confirm(state, 'b2');
assert.equal(Object.keys(state.match.confirmations[TEAM_IDS.B]).length, 2, 'Second distinct defender must produce 2/2');
const round1 = finishTeamRound(state, TEAM_IDS.A, { targetSnapshot: target });
assert.equal(round1.status, 'round_result', '2/2 must enter round_result');
assert.equal(round1.phase, 'round_result', '2/2 must enter the reveal phase');
assert.ok(round1.match.revealEndTimestamp > Date.now(), 'Reveal timestamp must be in the future');
const round2 = advanceTeamRound(round1, { a1: target, a2: target, b1: target, b2: target });
assert.equal(round2.roundNumber, 2, 'Reveal expiry must advance to Round 2');
assert.equal(round2.match.matchId, 'QA-ROOM_match_2', 'Round 2 must receive a new match id');

state = withCorrectGuess(base(), 'b1', TEAM_IDS.A); // Team B guessed Team A target.
assert.deepEqual(getRequiredConfirmationTeams(state), [TEAM_IDS.A], 'Team A must be the only required team in the reverse direction');
state = confirm(state, 'a1');
state = confirm(state, 'a2');
assert.equal(Object.keys(state.match.confirmations[TEAM_IDS.A]).length, 2, 'Reverse direction must also complete 2/2');
const round3 = finishTeamRound(state, TEAM_IDS.B, { targetSnapshot: target });
assert.equal(round3.status, 'round_result', 'Round 2-style completion must enter reveal');
const finalState = finishTeamRound({ ...round3, roundNumber: 3, match: { ...round3.match, roundNumber: 3, matchId: 'QA-ROOM_match_3', status: 'playing', phase: 'playing', confirmations: { [TEAM_IDS.A]: { a1: { matchId: 'QA-ROOM_match_3', roundNumber: 3 }, a2: { matchId: 'QA-ROOM_match_3', roundNumber: 3 } } }, guesses: { b1: { playerId: 'b1', targetId: target.id, correct: true, opponentTeamId: TEAM_IDS.A, matchId: 'QA-ROOM_match_3', roundNumber: 3 } }, confirmationTeamIds: [TEAM_IDS.A], confirmationTeamId: TEAM_IDS.A } }, TEAM_IDS.B, { targetSnapshot: target });
assert.equal(finalState.phase, 'results', 'Round 3 must enter final results');
assert.ok(finalState.finalResult?.winningTeamId, 'Final results must include a winner');
assert.notEqual(finalState.roundNumber, 4, 'No Round 4 may be created');

console.log('qa-guessed-correct-repair: PASS');
