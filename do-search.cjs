const fs = require('fs');
const path = require('path');

const terms = [
  'Guess Correct',
  'confirmTeamGuess',
  'confirmTeamRound',
  'confirmationTeamId',
  'confirmationTeamIds',
  'confirmations',
  'requiredTeams',
  'canMutateCompetitive',
  'round_result',
  'revealEndTimestamp',
  'advanceTeamRound',
  'finishTeamRound',
  'subscribeCompetitiveRoom',
  'mutateCompetitiveState'
];

const results = [];

function searchDir(dir) {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    return;
  }
  for (const file of files) {
    const full = path.join(dir, file);
    let stat;
    try {
      stat = fs.statSync(full);
    } catch(e) {
      continue;
    }
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        searchDir(full);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.mjs') || file.endsWith('.json') || file.endsWith('.md')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        terms.forEach(term => {
          if (line.includes(term)) {
            results.push(`${full}:${idx + 1}: [${term}] ${line.trim()}`);
          }
        });
      });
    }
  }
}

searchDir('h:/neon_game');
fs.writeFileSync('h:/neon_game/search-results.txt', results.join('\n'), 'utf8');
