import { assignTeamTargets, createTeamBattleState, confirmTeamRound, areAllRequiredTeamConfirmationsComplete, finishTeamRound, advanceTeamRound } from '../src/modes/teamBattleEngine.js';

const players = [1, 2, 3, 4].map((index) => ({ id: `p${index}`, name: `Player ${index}`, joinOrder: index }));
const initial = createTeamBattleState({ teamRoomId: 'B-QA2V2', players, category: 'sports', hostId: 'p1' });
if (initial.teams.team_a.playerIds.join(',') !== 'p1,p2') throw new Error('Team A must contain the first two join-order players.');
if (initial.teams.team_b.playerIds.join(',') !== 'p3,p4') throw new Error('Team B must contain the last two join-order players.');

const state = assignTeamTargets(initial, {
  p1: { id: 'target-a', name: 'A' }, p2: { id: 'target-a', name: 'A' },
  p3: { id: 'target-b', name: 'B' }, p4: { id: 'target-b', name: 'B' },
});
if (state.match.targets.p1.targetId !== 'target-a' || state.match.targets.p2.targetId !== 'target-a') throw new Error('Team A players must share target A.');
if (state.match.targets.p3.targetId !== 'target-b' || state.match.targets.p4.targetId !== 'target-b') throw new Error('Team B players must share target B.');
if (state.match.teamTargets.team_a.targetId !== 'target-a' || state.match.teamTargets.team_b.targetId !== 'target-b') throw new Error('Team target projection is not authoritative.');

let oneTeam = confirmTeamRound(state, 'p3', 1000, { targetSnapshot: { id: 'target-a', targetId: 'target-a', name: 'A', image: '/a.png', teamId: 'team_b' } });
if (areAllRequiredTeamConfirmationsComplete(oneTeam)) throw new Error('One teammate confirmation must not resolve the team.');
oneTeam = confirmTeamRound(oneTeam, 'p4', 1001, { targetSnapshot: { id: 'target-a', targetId: 'target-a', name: 'A', image: '/a.png', teamId: 'team_b' } });
if (!areAllRequiredTeamConfirmationsComplete(oneTeam)) throw new Error('Both defending teammates must confirm.');
const oneTeamResult = finishTeamRound(oneTeam, 'team_a', { guesses: {} });
if (oneTeamResult.status !== 'round_result' || oneTeamResult.teams.team_a.score !== 1 || oneTeamResult.teams.team_b.score !== 0) throw new Error('Single confirmed opponent target must award one point to the guessing team.');
if (oneTeamResult.match.result.revealSnapshot?.target?.name !== 'A') throw new Error('Round result must preserve the confirmed target title for reveal.');
const next = advanceTeamRound(oneTeamResult, { p1: { id: 'next-a' }, p2: { id: 'next-a' }, p3: { id: 'next-b' }, p4: { id: 'next-b' } });
if (Object.values(next.match.confirmations.team_a).length !== 0 || Object.values(next.match.confirmations.team_b).length !== 0 || next.match.confirmationTeamIds.length !== 0) throw new Error('Confirmations must reset for the next round.');

const simultaneousSeed = { ...state, match: { ...state.match, guesses: {
  p1: { playerId: 'p1', targetId: 'target-b', correct: true, opponentTeamId: 'team_b', targetOwnerId: 'p3' },
  p3: { playerId: 'p3', targetId: 'target-a', correct: true, opponentTeamId: 'team_a', targetOwnerId: 'p1' },
} } };
let simultaneous = confirmTeamRound(simultaneousSeed, 'p1', 2000, { targetSnapshot: { id: 'target-b', targetId: 'target-b', name: 'B', teamId: 'team_a' } });
simultaneous = confirmTeamRound(simultaneous, 'p2', 2001, { targetSnapshot: { id: 'target-b', targetId: 'target-b', name: 'B', teamId: 'team_a' } });
simultaneous = confirmTeamRound(simultaneous, 'p3', 2002, { targetSnapshot: { id: 'target-a', targetId: 'target-a', name: 'A', teamId: 'team_b' } });
simultaneous = confirmTeamRound(simultaneous, 'p4', 2003, { targetSnapshot: { id: 'target-a', targetId: 'target-a', name: 'A', teamId: 'team_b' } });
if (!areAllRequiredTeamConfirmationsComplete(simultaneous)) throw new Error('Both teams must be able to complete their two-player confirmations.');
const simultaneousResult = finishTeamRound(simultaneous, ['team_a', 'team_b'], { guesses: simultaneous.match.guesses, winningTeamIds: ['team_a', 'team_b'] });
if (simultaneousResult.teams.team_a.score !== 1 || simultaneousResult.teams.team_b.score !== 1) throw new Error('Simultaneous correct team guesses must score both teams.');
if (simultaneousResult.match.result.winningTeamIds.join(',') !== 'team_a,team_b') throw new Error('Simultaneous result must preserve both scoring teams.');

console.log('Team Battle lifecycle QA passed: ordered teams, shared targets, two-player confirmations, simultaneous confirmations, scoring, and round reset.');
