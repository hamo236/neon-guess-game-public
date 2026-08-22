import assert from 'node:assert/strict';
import {
  buildInitialState,
  initRoom,
  playerJoined,
  beginPlayingFromPreview,
  confirmOpponentGuessed,
  GAME_MODES,
  GAME_PHASES,
} from './src/game/gameEngine.js';

const p1 = { id: 'one', name: 'One', avatar: null };
const p2 = { id: 'two', name: 'Two', avatar: null };
let state = initRoom(buildInitialState(), {
  roomCode: '1V1Q',
  matchId: '1V1Q:fixed',
  hostPlayer: p1,
  mode: GAME_MODES.ONE_V_ONE,
  category: 'cartoons',
});
state = playerJoined(state, p2);
state = { ...state, phase: GAME_PHASES.PREVIEW };
state = beginPlayingFromPreview(state);
assert.equal(Object.keys(state.targets).length, 2);
assert.equal(state.displayTargets.one.id, state.targets.two.id);
assert.equal(state.displayTargets.two.id, state.targets.one.id);
const resolved = confirmOpponentGuessed(state, { confirmerId: 'one', guessedPlayerId: 'two' });
assert.equal(resolved.scores.two, 1);
assert.equal(resolved.roundResult.revealedTargets.one.id, state.targets.two.id);
assert.equal(resolved.roundResult.revealedTargets.two.id, state.targets.one.id);
console.log('PROTECTED_1V1_REGRESSION=0');
