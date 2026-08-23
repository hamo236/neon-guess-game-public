import fs from 'node:fs';
import assert from 'node:assert/strict';

const page = fs.readFileSync(new URL('../src/pages/CompetitiveModePage.jsx', import.meta.url), 'utf8');
const context = fs.readFileSync(new URL('../src/context/CompetitiveModeContext.jsx', import.meta.url), 'utf8');
const gameplayStart = page.indexOf('function TournamentGameplay');
const gameplayEnd = page.indexOf('function TournamentBoard', gameplayStart);
assert.ok(gameplayStart >= 0 && gameplayEnd > gameplayStart, 'TournamentGameplay must remain a discoverable route component');
const gameplay = page.slice(gameplayStart, gameplayEnd);

assert.doesNotMatch(gameplay, /GuessGrid|GUESS BOARD|Choose one card|choose one card/i, 'Tournament Four gameplay must not render card-selection UI');
assert.match(gameplay, /TargetCard target=\{target\} ready=\{actions\.targetReady\} mode="opponent"/, 'Tournament Four must render the assigned opponent target');
assert.match(gameplay, /GUESS CORRECT/, 'Tournament Four must keep the natural Guess Correct action');
assert.match(gameplay, /actions\.recordGuess\(target\.targetId\)/, 'Guess Correct must submit the projected opponent target through the existing authoritative action');
assert.match(gameplay, /Confirm that \{opponentName\} guessed your target correctly/, 'The action must communicate the defender-confirmation flow');
assert.match(context, /const opponentId = match\.playerIds\.find\(\(id\) => id !== playerId\)/, 'Tournament private target projection must resolve the opponent');
assert.match(context, /const opponentTarget = opponentId \? match\.targets\?\.\[opponentId\] : null/, 'Tournament private target projection must use the opponent target');
assert.match(context, /targetOwnerId: opponentId/, 'Private target must retain its owner for auditability');

console.log('tournament-natural-guess-flow: PASS');
console.log('Tournament Four renders one opponent target and Guess Correct; card-selection UI is absent from the live gameplay component.');
