import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const board = fs.readFileSync(new URL('../src/pages/GameBoardPage.jsx', import.meta.url), 'utf8');
const competitive = fs.readFileSync(new URL('../src/pages/CompetitiveModePage.jsx', import.meta.url), 'utf8');
const panel = fs.readFileSync(new URL('../src/components/game/VoiceRoomPanel.jsx', import.meta.url), 'utf8');

assert.match(app, /function PersistentClassicVoiceRoom\(\)/);
assert.match(app, /<PersistentClassicVoiceRoom \/>/);
assert.match(app, /key=\{`\$\{voiceRoomId\}:\$\{voiceScopeId\}`\}/);
assert.doesNotMatch(board, /<VoiceRoomPanel/);
assert.match(competitive, /state\?\.match \?/);
assert.match(competitive, /function getTournamentVoiceMatch\(state, playerId\)/);
assert.match(competitive, /\['pending', 'playing', 'finished'\]\.includes\(match\.status\)/);
assert.match(panel, /compact = false/);
assert.match(panel, /phone_in_talk/);
assert.match(panel, /label="Join voice call"/);
console.log('Voice lifecycle regression checks passed.');
