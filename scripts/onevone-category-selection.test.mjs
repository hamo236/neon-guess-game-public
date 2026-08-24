import fs from 'node:fs';
import assert from 'node:assert/strict';

const lobby = fs.readFileSync(new URL('../src/pages/LobbyPage.jsx', import.meta.url), 'utf8');
const context = fs.readFileSync(new URL('../src/context/GameStateContext.jsx', import.meta.url), 'utf8');

assert.match(
  lobby,
  /<select value=\{category\} onChange=\{\(e\) => actions\.setCategory\(e\.target\.value\)\}/,
  'The dedicated 1v1 category selector must update the authoritative context action.'
);
assert.match(
  lobby,
  /if \(!category\) \{ setError\('Please select a category first\.'\); return; \}/,
  'Create Room must continue to reject only an actually empty category.'
);
assert.match(
  context,
  /setCategory: useCallback\(async \(category\) => \{/,
  'GameStateContext must expose the category mutation used by the 1v1 selector.'
);

console.log('1v1 category-selection regression contract passed');
