import assert from 'node:assert/strict';
import fs from 'node:fs';
import { clone } from '../src/modes/modeTypes.js';

assert.equal(clone(undefined), undefined, 'clone must preserve undefined without parsing it');
assert.equal(clone(null), null, 'clone must preserve null');
assert.deepEqual(clone({ nested: { value: 1 } }), { nested: { value: 1 } }, 'clone must still deep-copy JSON data');

const context = fs.readFileSync(new URL('../src/context/CompetitiveModeContext.jsx', import.meta.url), 'utf8');
assert.match(context, /async function writePrivateTargets\(mode, roomId, state, writerPlayerId = null\)/, 'target writes must support player-scoped synchronization');
assert.match(context, /playerId === writerPlayerId/, 'non-host target writes must be limited to the authenticated player');
assert.doesNotMatch(context, /mode !== COMPETITIVE_MODES\.TOURNAMENT \|\| !state \|\| !canMutateCompetitive \|\| state\.hostId !== playerId/, 'Four lifecycle effects must not require the host tab');
assert.match(context, /mode === COMPETITIVE_MODES\.TEAM_BATTLE && state\.hostId !== playerId/, 'Team Battle target lifecycle must retain its existing host-only contract');

console.log('tournament-runtime-contract: PASS');
console.log('Undefined-safe clone and host-independent Four-player lifecycle contracts are covered.');

