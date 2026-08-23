import assert from 'node:assert/strict';
import fs from 'node:fs';

const context = fs.readFileSync(new URL('../src/context/CompetitiveModeContext.jsx', import.meta.url), 'utf8');
const firebase = fs.readFileSync(new URL('../src/firebase/competitiveFirebase.js', import.meta.url), 'utf8');
const engine = fs.readFileSync(new URL('../src/modes/tournamentEngine.js', import.meta.url), 'utf8');
const rules = fs.readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8');

assert.match(context, /submitTournamentGuess\(\{ roomId, matchId: active\.matchId, playerId, roundNumber: active\.roundNumber \}\)/, 'Tournament Guess Correct must use the scoped player confirmation writer');
assert.match(context, /const hasConfirmation = match\.playerIds\.some\(\(id\) => Boolean\(match\.guesses\?\.\[id\]\)\)/, 'One valid opponent confirmation must be sufficient to trigger the Tournament round resolver, matching 1v1');
assert.match(context, /const protectedTargets = currentMatch\?\.targets[\s\S]*targetMapForPlayers\(resolved\.category, currentMatch\.playerIds/, 'Host resolution must reconstruct protected targets inside the authoritative transaction when public state is sanitized');
assert.match(firebase, /matches\/\$\{matchId\}\/guesses\/\$\{playerId\}/, 'Scoped Tournament guess writer must target only the submitting player');
assert.match(engine, /playerMap: Object\.fromEntries\(playerIds\.map\(\(id\) => \[id, true\]\)\)/, 'Tournament matches must expose an explicit participant map for rules validation');
assert.match(rules, /"matches": \{[\s\S]*"guesses": \{[\s\S]*data\.parent\(\)\.parent\(\)\.child\('playerMap'\)\.child\(auth\.uid\)\.val\(\) === true/, 'Tournament rules must permit only a participant to write their own active-match guess');
assert.match(rules, /newData\.child\('roundNumber'\)\.val\(\) === data\.parent\(\)\.parent\(\)\.child\('roundNumber'\)\.val\(\)/, 'Tournament guess writes must be restricted to the current round');

console.log('tournament-firebase-confirmation: PASS');
console.log('Non-host Tournament confirmations use a participant-scoped Firebase path with active-match and current-round validation.');
