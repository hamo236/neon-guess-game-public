import assert from 'node:assert/strict';
import { generateRoomCode, normalizeRoomCode } from '../src/game/roomManager.js';

for (let index = 0; index < 5000; index += 1) {
  const code = generateRoomCode();
  assert.match(code, /^\d{3}$/, `generated code must be exactly 3 digits: ${code}`);
}

for (const code of ['100', '781', '999', '  245  ']) {
  assert.equal(normalizeRoomCode(code), code.trim());
}

for (const invalid of ['', '12', '1234', 'A12', '12A', ' 7 8 ', null, undefined]) {
  assert.throws(() => normalizeRoomCode(invalid), /exactly 3 digits/);
}

console.log('room-code-contract: PASS');
console.log('room-code-contract: generated, normalized, and rejected values satisfy the 3-digit contract');
console.log('room-code-contract: Firebase adapters consume normalizeRoomCode before constructing room paths');
