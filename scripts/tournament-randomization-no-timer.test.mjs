import assert from 'node:assert/strict';
import fs from 'node:fs';
import { targetMapForTournament } from '../src/modes/tournamentTargetPlan.js';
import { TOURNAMENT_MATCH_IDS, tournamentTargetOffset } from '../src/modes/tournamentEngine.js';

const semifinalAPlayers = ['p1', 'p2'];
const semifinalBPlayers = ['p3', 'p4'];
const roomOne = '123:1700000000000';
const roomTwo = '456:1700000000000';
const roomOneRetry = '123:1700000001000';
const targetIds = (targetMap) => Object.values(targetMap).map((target) => target.targetId);
const fourAssignments = (roomSeed) => [
  ...[1, 2, 3].map((roundNumber) => targetMapForTournament('football', semifinalAPlayers, { roomSeed, offset: tournamentTargetOffset(TOURNAMENT_MATCH_IDS.SEMI_A, roundNumber) })),
  ...[1, 2, 3].map((roundNumber) => targetMapForTournament('football', semifinalBPlayers, { roomSeed, offset: tournamentTargetOffset(TOURNAMENT_MATCH_IDS.SEMI_B, roundNumber) })),
  targetMapForTournament('football', ['p1', 'p3'], { roomSeed, offset: tournamentTargetOffset(TOURNAMENT_MATCH_IDS.FINAL, 1) }),
  targetMapForTournament('football', ['p2', 'p4'], { roomSeed, offset: tournamentTargetOffset(TOURNAMENT_MATCH_IDS.CONSOLATION, 1) }),
];

const firstRoomAssignments = fourAssignments(roomOne);
const secondRoomAssignments = fourAssignments(roomTwo);
assert.deepEqual(
  firstRoomAssignments[0],
  targetMapForTournament('football', semifinalAPlayers, { roomSeed: roomOne, offset: tournamentTargetOffset(TOURNAMENT_MATCH_IDS.SEMI_A, 1) }),
  'the same room seed must reproduce the same target map for every client',
);
assert.notDeepEqual(firstRoomAssignments[0], secondRoomAssignments[0], 'different rooms must not receive the same fixed target map');
assert.notDeepEqual(firstRoomAssignments[0], fourAssignments(roomOneRetry)[0], 'a retry in the same room must receive a fresh target sequence');
assert.notDeepEqual(
  firstRoomAssignments.flatMap(targetIds),
  secondRoomAssignments.flatMap(targetIds),
  'different rooms must receive different target sequences across Four branches and rounds',
);
const sportsA = targetMapForTournament('sports', semifinalAPlayers, { roomSeed: roomOne, offset: tournamentTargetOffset(TOURNAMENT_MATCH_IDS.SEMI_A, 2) });
const sportsB = targetMapForTournament('sports', semifinalBPlayers, { roomSeed: roomOne, offset: tournamentTargetOffset(TOURNAMENT_MATCH_IDS.SEMI_B, 2) });
assert.notEqual(sportsA.p1.targetId, sportsA.p2.targetId, 'Sports semifinal players must receive different targets');
assert.notDeepEqual(sportsA, sportsB, 'Sports semifinal branches must not collapse to one target map');
firstRoomAssignments.forEach((assignment) => {
  const ids = targetIds(assignment);
  assert.equal(new Set(ids).size, ids.length, 'each Four match must assign different targets to its two players');
});

const context = fs.readFileSync(new URL('../src/context/CompetitiveModeContext.jsx', import.meta.url), 'utf8');
const engine = fs.readFileSync(new URL('../src/modes/tournamentEngine.js', import.meta.url), 'utf8');
const page = fs.readFileSync(new URL('../src/pages/CompetitiveModePage.jsx', import.meta.url), 'utf8');
const gameplayStart = page.indexOf('function TournamentGameplay');
const gameplayEnd = page.indexOf('function TournamentBoard', gameplayStart);
const gameplay = page.slice(gameplayStart, gameplayEnd);
assert.match(context, /playingMatches\.filter\(\(match\) => \{[\s\S]*const hasConfirmation = match\.playerIds\.some\(\(id\) => Boolean\(match\.guesses\?\.\[id\]\)\)/, 'Four resolution must remain action-driven');
assert.doesNotMatch(context, /roundEndTimestamp/, 'Four context must not retain a gameplay deadline');
assert.doesNotMatch(engine, /roundEndTimestamp/, 'Four engine state must not create or clear a gameplay deadline');
assert.doesNotMatch(gameplay, /TIME LEFT|roundEndTimestamp|useCountdown\(/i, 'Four gameplay must not render or consume Time Left');
assert.match(gameplay, /disabled=\{confirmed \|\| !actions\.targetReady \|\| !actions\.canMutateCompetitive\}/, 'removing Time Left must not change the existing target-ready or authority gates');

console.log('tournament-randomization-no-timer: PASS');
console.log('Four target sequences vary by room, remain deterministic within a room, preserve bracket separation, and contain no gameplay Time Left deadline.');
