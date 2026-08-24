import assert from 'node:assert/strict';
import { ALL_ITEMS, CATEGORIES, getItemsByCategory } from '../src/data/gameData.js';
import { TEAM_IDS } from '../src/modes/teamBattleEngine.js';
import { targetIdsForRound, targetMapForTeams } from '../src/modes/teamBattleTargetPlan.js';

const expectedCategoryCounts = {
  [CATEGORIES.FOOTBALL]: 28,
  [CATEGORIES.SPORTS]: 19,
  [CATEGORIES.CARTOONS]: 21,
  [CATEGORIES.ANIMALS]: 25,
};

assert.equal(new Set(ALL_ITEMS.map((item) => item.id)).size, ALL_ITEMS.length, 'Catalog item IDs must be unique');
assert.equal(new Set(ALL_ITEMS.map((item) => item.image)).size, ALL_ITEMS.length, 'Catalog image paths must be unique');
assert.equal(ALL_ITEMS.some((item) => item.id === 's20' || item.image.includes('ice-hockey')), false, 'Ice Hockey must remain excluded from the catalog');
for (const item of ALL_ITEMS) {
  assert.match(item.image, /^\/images\/(football|sports|cartoons|animals)\/.+\.jpg$/, `${item.id}: runtime image path is invalid`);
}
for (const [category, expectedCount] of Object.entries(expectedCategoryCounts)) {
  assert.equal(getItemsByCategory(category).length, expectedCount, `${category}: catalog count mismatch`);
}

const teams = {
  [TEAM_IDS.A]: { teamId: TEAM_IDS.A, playerIds: ['p1', 'p2'] },
  [TEAM_IDS.B]: { teamId: TEAM_IDS.B, playerIds: ['p3', 'p4'] },
};

for (const category of Object.values(CATEGORIES)) {
  const firstRoomRounds = [1, 2, 3].map((roundNumber) => targetIdsForRound(category, teams, { roomSeed: 'room-alpha:created-1', roundNumber }));
  const secondRoomRounds = [1, 2, 3].map((roundNumber) => targetIdsForRound(category, teams, { roomSeed: 'room-beta:created-2', roundNumber }));

  for (const roundTargets of firstRoomRounds) {
    assert.ok(roundTargets[TEAM_IDS.A], `${category}: Team A target is missing`);
    assert.ok(roundTargets[TEAM_IDS.B], `${category}: Team B target is missing`);
    assert.notEqual(roundTargets[TEAM_IDS.A], roundTargets[TEAM_IDS.B], `${category}: Team A/B targets must differ`);
  }

  const firstRoomSequence = firstRoomRounds.flatMap((roundTargets) => [roundTargets[TEAM_IDS.A], roundTargets[TEAM_IDS.B]]);
  assert.equal(new Set(firstRoomSequence).size, 6, `${category}: all six room targets must differ across three rounds`);
  assert.deepEqual(firstRoomRounds[0], targetIdsForRound(category, teams, { roomSeed: 'room-alpha:created-1', roundNumber: 1 }), `${category}: same room seed must converge deterministically`);
  assert.notDeepEqual(firstRoomRounds, secondRoomRounds, `${category}: a new room must receive a new target sequence`);

  const map = targetMapForTeams(category, teams, { roomSeed: 'room-alpha:created-1', roundNumber: 1 });
  assert.equal(map.p1.teamId, TEAM_IDS.A);
  assert.equal(map.p3.teamId, TEAM_IDS.B);

  const roomMixSignatures = new Set();
  let mixedRoomCount = 0;
  for (let roomNumber = 1; roomNumber <= 200; roomNumber += 1) {
    const roomRounds = [1, 2, 3].map((roundNumber) => targetIdsForRound(category, teams, { roomSeed: `mix-room-${roomNumber}`, roundNumber }));
    const selectedIds = roomRounds.flatMap((roundTargets) => [roundTargets[TEAM_IDS.A], roundTargets[TEAM_IDS.B]]);
    const legacyCount = selectedIds.filter((id) => Number(id.slice(1)) <= 15).length;
    const signature = `${legacyCount}/${selectedIds.length - legacyCount}`;
    roomMixSignatures.add(signature);
    if (legacyCount > 0 && legacyCount < selectedIds.length) mixedRoomCount += 1;
  }
  assert.ok(roomMixSignatures.size > 1, `${category}: room seeds must produce varied legacy/new target mixes`);
  assert.ok(mixedRoomCount > 0, `${category}: at least one room must mix legacy and newly added targets`);
}

console.log('PASS: fresh room-scoped target sequences for all 4 categories, 3 rounds, both teams, deterministic convergence, and privacy-compatible per-player mapping.');
