import assert from 'node:assert/strict';
import { sanitizePublicState } from '../src/firebase/competitiveFirebase.js';
import { MODE_PHASES } from '../src/modes/modeTypes.js';

const state = {
  category: 'football',
  matches: {
    semi_a: {
      matchId: 'semi_a',
      status: 'round_result',
      phase: MODE_PHASES.ROUND_RESULT,
      roundNumber: 1,
      targets: {
        p1: { id: 'private-p1', name: 'Private P1' },
        p2: { id: 'private-p2', name: 'Private P2' },
      },
      result: {
        roundNumber: 1,
        targets: {
          p1: { id: 'private-p1' },
          p2: { id: 'private-p2' },
        },
        revealSnapshot: [
          { playerId: 'p1', target: { id: 'private-p1', name: 'Target P1' } },
          { playerId: 'p2', target: { id: 'private-p2', name: 'Target P2' } },
        ],
      },
    },
  },
};

const safe = sanitizePublicState(state);
const safeMatch = safe.matches.semi_a;
assert.equal(safeMatch.targets, undefined, 'live protected targets must stay out of public state');
assert.equal(safeMatch.result.targets, undefined, 'raw result target map must stay out of public state');
assert.equal(safeMatch.result.revealSnapshot.length, 2, 'round-result reveal snapshot must remain available');
assert.equal(safeMatch.result.revealSnapshot[0].target.name, 'Target P1');
assert.equal(safeMatch.result.revealSnapshot[1].target.name, 'Target P2');

console.log('tournament-target-continuity: PASS');
console.log('Reveal snapshots survive public sanitization while live target maps remain protected.');
