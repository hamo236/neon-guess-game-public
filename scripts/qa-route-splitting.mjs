import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

const requiredContracts = [
  ['React.lazy imports noncritical routes', /const\s+GameBoardPage\s*=\s*lazy\(\(\)\s*=>\s*import\('\.\/pages\/GameBoardPage'\)\)/],
  ['Team Battle remains a lazy route', /const\s+TeamBattlePage\s*=\s*lazy\(\(\)\s*=>\s*import\('\.\/pages\/TeamBattlePage'\)\)/],
  ['Suspense protects lazy routes', /<Suspense\s+fallback=\{<RouteLoadingFallback\s*\/>\}>/],
  ['Accessible fallback announces loading', /aria-live="polite"[\s\S]*aria-busy="true"/],
  ['Direct Team Battle route is preserved', /<Route\s+path="\/team-battle"\s+element=\{<TeamBattlePage\s*\/>\}\s*\/>/],
  ['Direct Tournament route is preserved', /<Route\s+path="\/tournament"\s+element=\{<TournamentPage\s*\/>\}\s*\/>/],
];

const failures = requiredContracts
  .filter(([, pattern]) => !pattern.test(app))
  .map(([name]) => name);

if (failures.length > 0) {
  console.error(`Route splitting checks failed: ${failures.join(', ')}`);
  process.exit(1);
}

console.log(`Route splitting checks passed: ${requiredContracts.length} contracts.`);
