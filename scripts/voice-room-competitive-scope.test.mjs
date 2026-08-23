import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/pages/CompetitiveModePage.jsx', import.meta.url), 'utf8');

assert.match(source, /function getTournamentVoiceMatch\(state, playerId\)/);
assert.match(source, /match\.playerIds\?\.includes\(playerId\)/);
assert.match(source, /\['pending', 'playing', 'finished'\]\.includes\(match\.status\)/);
assert.match(source, /\['final', 'consolation', 'semi_a', 'semi_b'\]/);
assert.match(source, /getTournamentVoiceMatch\(state, actions\.playerId\)/);
assert.match(source, /scopeId=\{activeVoiceMatch\?\.matchId \|\| 'team'\}/);

console.log('voice-room-competitive-scope: PASS');
