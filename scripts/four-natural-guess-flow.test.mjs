import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../src/pages/GameBoardPage.jsx', import.meta.url), 'utf8');

assert.match(source, /isFourPlayerSocial \?\s*\(/, 'Four must keep its dedicated target presentation branch');
assert.match(source, /aria-label=\{`Opponent target:/, 'Four must show the assigned opponent target');
assert.match(source, /GUESS CORRECT/, 'Four must keep the natural Guess Correct action');
assert.match(source, /!isFourPlayerSocial && \(\s*<div className="w-full glass-panel/, 'Score matchup card must be excluded from Four');
assert.doesNotMatch(source, /ROUND TARGET GUIDE/, 'Four must not show the removed target guide card');
assert.doesNotMatch(source, /Four-player roster/, 'Four must not show the removed roster card presentation');
assert.doesNotMatch(source, /GuessGrid/, 'Four game board must not render a card-selection GuessGrid');
assert.match(source, /matchResult \|\| matchRevealActive/, 'Four round lock/reveal protection must remain intact');
assert.match(source, /activeMatchRoundResult\?\.revealedTargets/, 'Four reveal must keep prior-match target reveal data');

console.log('four-natural-guess-flow: PASS');
console.log('Four renders one assigned opponent target + Guess Correct and excludes the extra matchup card/roster/GuessGrid.');
console.log('Round lock, match result, and reveal guards remain present.');
