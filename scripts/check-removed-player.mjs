import { readFileSync } from 'node:fs';

const source = readFileSync('src/data/gameData.js', 'utf8');
const removedTokens = ['Nico Schlotterbeck', 'nico-schlotterbeck', "id: 'f27'"];
const remainingFootballIds = [...source.matchAll(/id: 'f(\d+)'/g)].map((match) => match[1]);
const footballIds = remainingFootballIds.filter((id) => Number(id) >= 1 && Number(id) <= 70);

for (const token of removedTokens) {
  if (source.includes(token)) throw new Error(`Removed player regression: found ${token}`);
}

if (footballIds.length !== 68) {
  throw new Error(`Football dataset regression: expected 68 players, found ${footballIds.length}`);
}
if (!source.includes("id: 'f26'") || !source.includes("id: 'f28'")) {
  throw new Error('Football dataset regression: neighboring players f26/f28 are missing');
}

console.log('Removed-player regression passed: Nico Schlotterbeck/f27 is absent; 68 football players remain; f26 and f28 are intact.');
