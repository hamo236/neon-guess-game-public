import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const adapter = fs.readFileSync(path.join(root, 'src/firebase/competitiveFirebase.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');

const required = [
  [adapter, 'Team Battle removal captures transaction result', /const result = await runTransaction\(target, \(current\) =>/],
  [adapter, 'Team Battle removal rejects uncommitted/stale result', /if \(!result\.committed \|\| next\?\.players\?\.\[playerId\]\)/],
  [adapter, 'Team Battle leave captures transaction result', /const result = await runTransaction\(target, \(current\) =>[\s\S]*?leftPlayers:/],
  [adapter, 'Team Battle leave rejects stale result', /Leaving the lobby was rejected because the match changed/],
  [app, 'Route boundary receives navigation reset key', /<RouteErrorBoundary resetKey=\{location\.pathname\}>/],
  [app, 'Route boundary clears error on route change', /componentDidUpdate\(previousProps\)[\s\S]*?previousProps\.resetKey !== this\.props\.resetKey/],
];

const failures = required.filter(([source, , pattern]) => !pattern.test(source));
if (failures.length) {
  console.error('FAIL');
  failures.forEach(([, label]) => console.error(`- ${label}`));
  process.exit(1);
}
console.log(`PASS: ${required.length} repair contracts`);
