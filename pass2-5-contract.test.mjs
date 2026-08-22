import assert from 'node:assert/strict';
import {
  buildInitialState,
  initRoom,
  playerJoined,
  beginPlayingFromPreview,
  confirmOpponentGuessed,
  advanceRound,
  GAME_MODES,
  GAME_PHASES,
} from './src/game/gameEngine.js';

const players = ['p1', 'p2', 'p3', 'p4'].map((id, index) => ({
  id,
  name: `Player ${index + 1}`,
  avatar: null,
}));

let state = initRoom(buildInitialState(), {
  roomCode: 'QA01',
  matchId: 'QA01:match:fixed',
  hostPlayer: players[0],
  mode: GAME_MODES.SOCIAL,
  category: 'cartoons',
});
for (const player of players.slice(1)) state = playerJoined(state, player);
assert.equal(state.players.length, 4);

state = {
  ...state,
  phase: GAME_PHASES.PREVIEW,
  playerAssignments: Object.fromEntries(players.map((player, index) => [player.id, {
    opponentPlayerId: players[(index + 1) % players.length].id,
  }])),
};
state = beginPlayingFromPreview(state);
assert.equal(state.phase, GAME_PHASES.PLAYING);
assert.equal(state.roundId, 'QA01:match:fixed:round:1');
assert.deepEqual(Object.keys(state.targets).sort(), players.map((p) => p.id).sort());

for (let i = 0; i < players.length; i += 1) {
  const playerId = players[i].id;
  const expectedTargetId = state.targets[players[(i + 1) % players.length].id].id;
  assert.equal(state.displayTargets[playerId].id, expectedTargetId, `cyclic target for ${playerId}`);
}

const result = confirmOpponentGuessed(state, { confirmerId: 'p1', guessedPlayerId: 'p2' });
assert.equal(result.phase, GAME_PHASES.ROUND_END);
assert.equal(result.roundResult.roundId, state.roundId);
assert.equal(Object.keys(result.roundResult.revealedTargets).length, 4);
for (const player of players) {
  assert.equal(result.roundResult.revealedTargets[player.id].id, state.displayTargets[player.id].id);
}
assert.equal(result.scores.p2, 1);
assert.strictEqual(confirmOpponentGuessed(result, { confirmerId: 'p3', guessedPlayerId: 'p4' }), result);

const final = advanceRound({ ...result, round: result.totalRounds });
assert.equal(final.phase, GAME_PHASES.RESULTS);
assert.equal(final.roundResult.final, true);
assert.equal(final.roundResult.standings[0].id, 'p2');
assert.equal(final.roundResult.roundResults[state.roundId].revealedTargets.p1.id, state.displayTargets.p1.id);

console.log('PASS2_5_CONTRACT=0');
