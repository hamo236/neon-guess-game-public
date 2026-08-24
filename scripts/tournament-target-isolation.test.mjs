import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createTournamentState, startMatch, advanceTournamentRound, tournamentTargetOffset, TOURNAMENT_MATCH_IDS } from '../src/modes/tournamentEngine.js';
import { MODE_PHASES } from '../src/modes/modeTypes.js';

const players = ['p1', 'p2', 'p3', 'p4'].map((id, index) => ({ id, name: id, joinOrder: index + 1 }));
const targets = (left, right) => ({
  [left]: { id: `target-${left}`, targetId: `target-${left}`, playerId: left },
  [right]: { id: `target-${right}`, targetId: `target-${right}`, playerId: right },
});

assert.equal(tournamentTargetOffset(TOURNAMENT_MATCH_IDS.SEMI_A, 1), 0);
assert.equal(tournamentTargetOffset(TOURNAMENT_MATCH_IDS.SEMI_B, 1), 3);
assert.equal(tournamentTargetOffset(TOURNAMENT_MATCH_IDS.SEMI_A, 2), 2);
assert.equal(tournamentTargetOffset(TOURNAMENT_MATCH_IDS.SEMI_B, 2), 5);
assert.equal(tournamentTargetOffset(TOURNAMENT_MATCH_IDS.FINAL, 1), 6);
assert.equal(tournamentTargetOffset(TOURNAMENT_MATCH_IDS.CONSOLATION, 1), 9);
assert.notEqual(tournamentTargetOffset(TOURNAMENT_MATCH_IDS.SEMI_A, 2), tournamentTargetOffset(TOURNAMENT_MATCH_IDS.SEMI_B, 2));
assert.notEqual(tournamentTargetOffset(TOURNAMENT_MATCH_IDS.FINAL, 2), tournamentTargetOffset(TOURNAMENT_MATCH_IDS.CONSOLATION, 2));

let state = createTournamentState({ tournamentId: 't1', roomId: 'r1', players, category: 'football', hostId: 'p1' });
state = startMatch(state, TOURNAMENT_MATCH_IDS.SEMI_A, targets('p1', 'p2'));
state = startMatch(state, TOURNAMENT_MATCH_IDS.SEMI_B, targets('p3', 'p4'));
assert.equal(state.matches.semi_a.phase, MODE_PHASES.PLAYING);
assert.equal(state.matches.semi_b.phase, MODE_PHASES.PLAYING);
const nextA = advanceTournamentRound({ ...state, matches: { ...state.matches, semi_a: { ...state.matches.semi_a, status: 'round_result', phase: MODE_PHASES.ROUND_RESULT, roundNumber: 1 } } }, TOURNAMENT_MATCH_IDS.SEMI_A, targets('p1-r2', 'p2-r2'));
const nextB = advanceTournamentRound({ ...state, matches: { ...state.matches, semi_b: { ...state.matches.semi_b, status: 'round_result', phase: MODE_PHASES.ROUND_RESULT, roundNumber: 1 } } }, TOURNAMENT_MATCH_IDS.SEMI_B, targets('p3-r2', 'p4-r2'));
assert.notDeepEqual(nextA.matches.semi_a.targets, nextB.matches.semi_b.targets, 'semifinal branches must retain distinct target maps');

const provider = fs.readFileSync(new URL('../src/context/CompetitiveModeContext.jsx', import.meta.url), 'utf8');
const page = fs.readFileSync(new URL('../src/pages/CompetitiveModePage.jsx', import.meta.url), 'utf8');
assert.match(provider, /targetMapForPlayers\(resolved\.category, currentMatch\.playerIds, tournamentTargetOffset\(matchId, currentMatch\.roundNumber\) \?\? 0\)/);
assert.match(provider, /targetMapForPlayers\(current\.category, match\.playerIds, tournamentTargetOffset\(matchId, Number\(match\.roundNumber\) \+ 1\) \?\? 0\)/);
assert.match(provider, /target: \{ \.\.\.opponentTarget, playerId, matchId: match\.matchId, targetOwnerId: opponentId/);
assert.match(provider, /const matches = Object\.values\(state\.matches \|\| \{\}\)\.filter\(\(match\) => match\.status === 'playing'/);
assert.match(provider, /return matches\.length === 1 \? matches\[0\] : null/);
assert.match(page, /const activeMatch = activeMatches\.length === 1 \? activeMatches\[0\] : null/);
assert.match(page, /MATCH STATE CONFLICT/);

console.log('tournament-target-isolation: PASS');
console.log('Branch-specific target offsets, target provenance, and fail-closed match selection are covered.');
