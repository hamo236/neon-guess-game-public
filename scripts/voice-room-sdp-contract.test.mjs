import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const hook = await readFile(new URL('../src/hooks/useVoiceRoom.js', import.meta.url), 'utf8');
const adapter = await readFile(new URL('../src/firebase/voiceRoom.js', import.meta.url), 'utf8');

assert.match(hook, /offer\.toJSON\s*\?\s*offer\.toJSON\(\)/, 'offers must be serialized with toJSON when available');
assert.match(hook, /answer\.toJSON\s*\?\s*answer\.toJSON\(\)/, 'answers must be serialized with toJSON when available');
assert.match(adapter, /function serializeSessionDescription\(description\)/, 'Firebase adapter must normalize descriptions');
assert.match(adapter, /typeof json\.sdp !== 'string'/, 'Firebase adapter must reject malformed SDP');
assert.equal((hook.match(/normalizeSessionDescription\(signal\.description\)/g) || []).length, 2, 'offer and answer paths must validate descriptions');
assert.equal((hook.match(/if \(!description\) return;/g) || []).length, 2, 'malformed offer and answer signals must be ignored safely');
console.log('Voice Room SDP contract checks passed.');
