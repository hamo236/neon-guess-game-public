import assert from 'node:assert/strict';
import {
  buildInitialState,
  initRoom,
  playerJoined,
  enterPreview,
  beginPlayingFromPreview,
  resolveKnockoutMatch,
  GAME_MODES,
  GAME_PHASES,
} from './src/game/gameEngine.js';

const players = ['uid-a', 'uid-b', 'uid-c', 'uid-d'].map((id, index) => ({
  id,
  name: `Player ${index + 1}`,
  score: 0,
}));

let state = initRoom(buildInitialState(), {
  roomCode: 'BRACKETQA',
  hostPlayer: players[0],
  mode: GAME_MODES.SOCIAL,
  category: 'cartoons',
});
players.slice(1).forEach((player) => { state = playerJoined(state, player); });
state = enterPreview(state);
assert.equal(state.phase, GAME_PHASES.PREVIEW);
assert.equal(state.round, 1);
assert.equal(state.bracket.stage, 'semifinals');
assert.equal(state.bracket.matches.semifinal_1.playerA, 'uid-a');
assert.equal(state.bracket.matches.semifinal_1.playerB, 'uid-d');
assert.equal(state.bracket.matches.semifinal_2.playerA, 'uid-b');
assert.equal(state.bracket.matches.semifinal_2.playerB, 'uid-c');
assert.equal(state.playerAssignments['uid-a'].opponentPlayerId, 'uid-d');
assert.equal(state.playerAssignments['uid-c'].opponentPlayerId, 'uid-b');

state = beginPlayingFromPreview(state);
assert.equal(state.phase, GAME_PHASES.PLAYING);
const roundId = state.roundId;
const forgedOpponent = resolveKnockoutMatch(state, { matchId: 'semifinal_1', confirmerId: 'uid-a', guessedPlayerId: 'uid-b', roundId });
assert.equal(forgedOpponent, state);
const staleRound = resolveKnockoutMatch(state, { matchId: 'semifinal_1', confirmerId: 'uid-a', guessedPlayerId: 'uid-d', roundId: 'stale-round' });
assert.equal(staleRound, state);
state = resolveKnockoutMatch(state, { matchId: 'semifinal_1', confirmerId: 'uid-a', guessedPlayerId: 'uid-d' });
assert.equal(state.bracket.matches.semifinal_1.status, 'resolved');
assert.equal(state.bracket.matches.semifinal_2.status, 'active');
assert.equal(state.matchResults.semifinal_1.winnerId, 'uid-d');
assert.equal(state.scores['uid-d'], 1);
const idempotent = resolveKnockoutMatch(state, { matchId: 'semifinal_1', confirmerId: 'uid-a', guessedPlayerId: 'uid-d' });
assert.equal(idempotent.scores['uid-d'], 1);

state = resolveKnockoutMatch(state, { matchId: 'semifinal_2', confirmerId: 'uid-b', guessedPlayerId: 'uid-c' });
assert.equal(state.scores['uid-d'], 1);
assert.equal(state.scores['uid-c'], 1);
assert.equal(state.scores['uid-a'], 0);
assert.equal(state.scores['uid-b'], 0);
assert.equal(state.phase, GAME_PHASES.PREVIEW);
assert.equal(state.bracket.stage, 'finals');
assert.equal(state.bracket.matches.final.playerA, 'uid-d');
assert.equal(state.bracket.matches.final.playerB, 'uid-c');
assert.equal(state.bracket.matches.third_place.playerA, 'uid-a');
assert.equal(state.bracket.matches.third_place.playerB, 'uid-b');
assert.equal(state.round, 2);
assert.notEqual(state.roundId, roundId);
assert.equal(state.phase, GAME_PHASES.PREVIEW);
assert.ok(state.transitionStartedAt > 0);
assert.equal(state.transitionEndsAt - state.transitionStartedAt, 5000);
const countdown = [5000, 4000, 3000, 2000, 1000, 0].map((remainingMs) => Math.ceil(remainingMs / 1000));
assert.deepEqual(countdown, [5, 4, 3, 2, 1, 0]);

state = beginPlayingFromPreview(state);
state = resolveKnockoutMatch(state, { matchId: 'final', confirmerId: 'uid-d', guessedPlayerId: 'uid-c' });
assert.equal(state.bracket.matches.final.status, 'resolved');
assert.equal(state.bracket.matches.third_place.status, 'active');
state = resolveKnockoutMatch(state, { matchId: 'third_place', confirmerId: 'uid-a', guessedPlayerId: 'uid-b' });
assert.equal(state.phase, GAME_PHASES.RESULTS);
assert.equal(state.bracket.stage, 'complete');
assert.deepEqual(state.standings.map((entry) => entry.id), ['uid-c', 'uid-d', 'uid-b', 'uid-a']);
assert.equal(state.round, 3);
assert.equal(state.phase, GAME_PHASES.RESULTS);

const staleFinalsState = {
  ...state,
  phase: GAME_PHASES.LOBBY,
  round: 1,
  bracket: { stage: 'finals', matches: {} },
};
const freshStart = enterPreview(staleFinalsState);
assert.equal(freshStart.round, 1);
assert.equal(freshStart.bracket.stage, 'semifinals');
assert.equal(freshStart.bracket.matches.semifinal_1.playerA, 'uid-a');
assert.equal(freshStart.bracket.matches.semifinal_1.playerB, 'uid-d');
console.log('KNOCKOUT_BRACKET_CONTRACT_PASS');
