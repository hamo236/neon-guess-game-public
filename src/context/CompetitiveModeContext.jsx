import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_META, getItemsByCategory } from '../data/gameData.js';
import { initAuth } from '../firebase/auth.js';
import { isFirebaseConfigured } from '../firebase/config.js';
import { createCompetitiveRoom, joinCompetitiveRoom, leaveCompetitiveRoom, mutateCompetitiveState, submitTournamentGuess, removeCompetitivePlayer, setCompetitiveTeam, subscribeCompetitiveConnection, subscribeCompetitiveRoom, subscribeCompetitiveTarget, writeCompetitiveState, writeCompetitiveTarget } from '../firebase/competitiveFirebase.js';
import { COMPETITIVE_MODES, MODE_PHASES, createModePlayer, createStableId, clone } from '../modes/modeTypes.js';
import { createTournamentState, finishMatch, recordMatchGuess, completeTournamentRound, advanceTournamentRound as advanceTournamentRoundState, startMatch, startNextTournamentMatches, TOURNAMENT_MATCH_IDS } from '../modes/tournamentEngine.js';
import { assignTeamTargets, createTeamBattleState, finishTeamRound, advanceTeamRound, confirmTeamRound, areAllRequiredTeamConfirmationsComplete, getRequiredConfirmationTeams, validateTeamAssignments, TEAM_IDS } from '../modes/teamBattleEngine.js';
import { targetMapForTeams } from '../modes/teamBattleTargetPlan.js';
import { generateRoomCode, normalizeRoomCode } from '../game/roomManager.js';

const CompetitiveModeContext = createContext(null);
const sessionKey = (mode) => `neon_guess_${mode}_session`;

function readSession(mode) { try { return JSON.parse(localStorage.getItem(sessionKey(mode)) || 'null'); } catch { return null; } }
const GENERATED_PLAYER_NAMES = new Set(['NeonPlayer', 'CyberPlayer_01', 'Player']);
function manualPlayerName(value) { const name = String(value || '').trim(); return GENERATED_PLAYER_NAMES.has(name) ? '' : name; }
function saveSession(mode, value) { try { localStorage.setItem(sessionKey(mode), JSON.stringify(value)); } catch { /* local-only fallback */ } }
function clearSession(mode) { try { localStorage.removeItem(sessionKey(mode)); } catch { /* no-op */ } }
function makeRoomId() { return generateRoomCode(); }
function targetMapForPlayers(category, playerIds, offset = 0) {
  const items = getItemsByCategory(category) || [];
  if (items.length < playerIds.length) throw new Error('Selected category does not have enough targets.');
  return Object.fromEntries(playerIds.map((id, index) => [id, { ...items[(index + offset) % items.length], playerId: id, targetId: items[(index + offset) % items.length].id }]));
}
function getPlayerTeam(state, playerId) { return Object.values(state.teams || {}).find((team) => team.playerIds.includes(playerId)); }
function classifyRecoveryFailure(error) {
  const message = error?.message || 'We could not restore the active room.';
  if (/not found|removed from this room|already started|room is full/i.test(message)) return { status: 'terminal', message };
  if (/authenticated|identity/i.test(message)) return { status: 'identity-error', message: 'We could not verify your saved player identity for this room.' };
  return { status: 'retryable-error', message };
}
function getActiveMatch(state, playerId) { return Object.values(state.matches || {}).find((match) => match.status === 'playing' && match.playerIds.includes(playerId)); }
function getTargetSpec(state, mode, playerId) {
  if (!state) return null;
  if (mode === COMPETITIVE_MODES.TOURNAMENT) {
    const match = Object.values(state.matches || {}).find((candidate) => ['playing', 'round_result'].includes(candidate.status) && candidate.playerIds?.includes(playerId));
    return match ? { matchId: match.matchId, roundNumber: match.roundNumber } : null;
  }
  const match = state.match?.status === 'playing' ? state.match : null;
  return match ? { matchId: match.matchId, roundNumber: match.roundNumber || state.roundNumber } : null;
}
async function writePrivateTargets(mode, roomId, state) {
  const writes = [];
  if (mode === COMPETITIVE_MODES.TOURNAMENT) {
    Object.values(state.matches || {}).filter((match) => ['playing', 'round_result'].includes(match.status)).forEach((match) => match.playerIds.forEach((playerId) => {
      if (match.status === 'round_result') {
        writes.push(writeCompetitiveTarget({ mode, roomId, matchId: match.matchId, playerId, target: { id: `reveal-${match.matchId}-${match.roundNumber}`, targetId: `reveal-${match.matchId}-${match.roundNumber}`, matchId: match.matchId, roundNumber: match.roundNumber, targetReady: true, revealSnapshot: clone(match.result?.revealSnapshot || []) } }));
        return;
      }
      const opponentId = match.playerIds.find((id) => id !== playerId);
      const baseOffset = match.matchId === TOURNAMENT_MATCH_IDS.SEMI_B ? 3 : match.matchId === TOURNAMENT_MATCH_IDS.FINAL ? 6 : match.matchId === TOURNAMENT_MATCH_IDS.CONSOLATION ? 9 : 0;
      const roundOffset = baseOffset + Math.max(0, (Number(match.roundNumber) - 1) * 2);
      const deterministicTargets = match.targets && Object.keys(match.targets).length === 2 ? match.targets : targetMapForPlayers(state.category, match.playerIds, roundOffset);
      const opponentTarget = opponentId ? deterministicTargets?.[opponentId] : null;
      if (opponentTarget) writes.push(writeCompetitiveTarget({ mode, roomId, matchId: match.matchId, playerId, target: { ...opponentTarget, playerId, targetOwnerId: opponentId, roundNumber: match.roundNumber } }));
    }));
  } else if (state.match?.status === 'playing') {
    state.playerIds.forEach((playerId) => {
      const ownTarget = state.match.targets?.[playerId];
      const ownTeamId = state.teamByPlayer?.[playerId];
      const opponentTeamId = ownTeamId === TEAM_IDS.A ? TEAM_IDS.B : TEAM_IDS.A;
      const opponentTarget = state.match.teamTargets?.[opponentTeamId];
      if (ownTarget && opponentTarget) writes.push(writeCompetitiveTarget({ mode, roomId, matchId: state.match.matchId, playerId, target: { ...clone(opponentTarget), playerId, teamId: opponentTeamId, targetOwnerTeamId: opponentTeamId, ownedTarget: { ...clone(ownTarget), playerId, teamId: ownTeamId, targetOwnerTeamId: ownTeamId }, roundNumber: state.match.roundNumber || state.roundNumber } }));
    });
  }
  await Promise.all(writes);
}

export function CompetitiveModeProvider({ mode, children }) {
  const session = readSession(mode);
  const [state, setState] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [playerId, setPlayerId] = useState(() => session?.playerId || null);
  const [playerName, setPlayerName] = useState(() => manualPlayerName(session?.playerName));
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [privateTarget, setPrivateTarget] = useState(null);
  const [targetReady, setTargetReady] = useState(false);
  const [recovery, setRecovery] = useState(() => session?.roomId ? { status: 'pending', roomId: session.roomId, message: '' } : { status: 'idle', roomId: '', message: '' });
  const [connectionState, setConnectionState] = useState(() => isFirebaseConfigured ? 'connecting' : 'offline-local');
  const canMutateCompetitive = !isFirebaseConfigured || connectionState === 'connected' || connectionState === 'recovered';
  const connectionOnlineRef = useRef(null);
  const awaitingFreshSnapshotRef = useRef(Boolean(isFirebaseConfigured));
  const recoveryAttemptedRef = useRef(false);
  const teamResolutionInFlightRef = useRef(false);
  const teamAdvanceInFlightRef = useRef(false);
  const teamStartInFlightRef = useRef(false);
  const tournamentResolutionInFlightRef = useRef(new Set());
  const tournamentAdvanceInFlightRef = useRef(new Set());
  const tournamentBracketAdvanceInFlightRef = useRef(false);

  useEffect(() => {
    let active = true;
    try {
      Promise.resolve(initAuth()).then((user) => {
        if (!active) return;
        if (user?.uid) setPlayerId(user.uid);
        else if (!isFirebaseConfigured) setPlayerId((current) => current || session?.playerId || createStableId('player'));
        else setError('Firebase authentication is not available. Please reload and try again.');
      }).catch((authError) => {
        if (active) setError(authError?.message || 'Firebase authentication failed.');
      });
    } catch (authError) {
      if (active) setError(authError?.message || 'Firebase authentication failed.');
    }
    return () => { active = false; };
  }, [session?.playerId]);

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    return subscribeCompetitiveConnection({
      onConnection: (online) => {
        connectionOnlineRef.current = online;
        if (online === false) {
          awaitingFreshSnapshotRef.current = Boolean(roomId);
          setConnectionState(roomId ? 'reconnecting' : 'connecting');
          return;
        }
        if (online === true) {
          awaitingFreshSnapshotRef.current = Boolean(roomId);
          setConnectionState(roomId ? 'reconnecting' : 'connected');
        }
      },
      onError: (e) => { setError(e?.message || 'Realtime connection status unavailable.'); setConnectionState('error'); },
    });
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return undefined;
    setStatus('connecting');
    return subscribeCompetitiveRoom({ mode, roomId, onState: (next) => {
      const teamBattlePlayerLeft = mode === COMPETITIVE_MODES.TEAM_BATTLE && next?.phase !== MODE_PHASES.LOBBY && Object.keys(next?.leftPlayers || {}).length > 0;
      if (!next || next.removedPlayers?.[playerId] || teamBattlePlayerLeft) {
        clearSession(mode); setRoomId(''); setState(null); setPrivateTarget(null); setTargetReady(false); setStatus('closed'); setConnectionState(isFirebaseConfigured ? 'error' : 'offline-local'); return;
      }
      const activeMatch = Boolean(next.match?.status === 'playing' || Object.values(next.matches || {}).some((match) => match?.status === 'playing' && match.playerIds?.includes(playerId)));
      saveSession(mode, { roomId, playerId, playerName, resumeAfterRefresh: activeMatch });
      setState(next); setStatus('ready');
      if (!isFirebaseConfigured) setConnectionState('offline-local');
      else if (connectionOnlineRef.current === true || connectionOnlineRef.current === null) {
        const wasWaitingForFreshSnapshot = awaitingFreshSnapshotRef.current;
        awaitingFreshSnapshotRef.current = false;
        setConnectionState(wasWaitingForFreshSnapshot ? 'recovered' : 'connected');
      }
    }, onError: (e) => { setError(e?.message || 'Firebase connection error.'); setStatus('error'); setConnectionState('error'); } });
  }, [mode, roomId, playerId, playerName]);

  useEffect(() => {
    if (connectionState !== 'recovered') return undefined;
    const timeoutId = window.setTimeout(() => setConnectionState((current) => current === 'recovered' ? 'connected' : current), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [connectionState]);

  const targetSpec = useMemo(() => getTargetSpec(state, mode, playerId), [state, mode, playerId]);
  useEffect(() => {
    setPrivateTarget(null); setTargetReady(false);
    if (!roomId || !targetSpec) return undefined;
    const expectedRound = Number(targetSpec.roundNumber);
    return subscribeCompetitiveTarget({ mode, roomId, matchId: targetSpec.matchId, playerId, onTarget: (target) => {
      if (!target || target.playerId !== playerId || target.matchId !== targetSpec.matchId || Number(target.roundNumber) !== expectedRound || !target.targetReady) return;
      setPrivateTarget(target); setTargetReady(true);
    }, onError: (e) => { setError(e?.message || 'Target synchronization error.'); } });
  }, [mode, roomId, playerId, targetSpec?.matchId, targetSpec?.roundNumber]);

  useEffect(() => {
    if (![COMPETITIVE_MODES.TOURNAMENT, COMPETITIVE_MODES.TEAM_BATTLE].includes(mode) || !roomId || !state || !canMutateCompetitive || state.hostId !== playerId) return undefined;
    const hasTargetLifecycle = mode === COMPETITIVE_MODES.TOURNAMENT
      ? Object.values(state.matches || {}).some((match) => ['playing', 'round_result'].includes(match.status))
      : state.match?.status === 'playing';
    if (!hasTargetLifecycle) return undefined;
    writePrivateTargets(mode, roomId, state).catch((targetError) => setError(targetError?.message || 'Competitive target synchronization error.'));
    return undefined;
  }, [mode, roomId, playerId, state, canMutateCompetitive]);

  const retrySessionRecovery = useCallback(async () => {
    if (roomId || recoveryAttemptedRef.current) return;
    const saved = readSession(mode);
    if (!saved?.roomId || saved.playerId !== playerId) {
      if (saved?.roomId) setRecovery({ status: 'identity-error', roomId: saved.roomId, message: 'We could not verify your saved player identity for this room.' });
      return;
    }
    recoveryAttemptedRef.current = true;
    setRecovery({ status: 'restoring', roomId: saved.roomId, message: '' });
    try {
      const recoveredName = manualPlayerName(saved.playerName) || manualPlayerName(playerName); if (!recoveredName) throw new Error('Enter your name before restoring this room.'); const player = createModePlayer({ id: playerId, name: recoveredName });
      const { room } = await joinCompetitiveRoom({ mode, roomId: saved.roomId, player });
      setPlayerName(manualPlayerName(room.players?.[playerId]?.name) || recoveredName);
      setRecovery({ status: 'restored', roomId: saved.roomId, message: '' });
      setRoomId(String(saved.roomId).trim().toUpperCase());
    } catch (err) {
      const failure = classifyRecoveryFailure(err);
      if (failure.status === 'terminal') clearSession(mode);
      setRecovery({ status: failure.status, roomId: saved.roomId, message: failure.message });
      recoveryAttemptedRef.current = false;
    }
  }, [mode, playerId, playerName, roomId]);
  useEffect(() => {
    if (!roomId && recovery.status === 'pending' && session?.resumeAfterRefresh === true && !recoveryAttemptedRef.current) retrySessionRecovery();
  }, [roomId, recovery.status, retrySessionRecovery]);
  const createRoom = useCallback(async (category) => { if (!playerId) throw new Error('Authenticating player identity. Please try again in a moment.'); const trimmedName = playerName.trim(); if (!trimmedName) throw new Error('Enter your name before creating a room.'); setError(''); const player = createModePlayer({ id: playerId, name: trimmedName, isHost: true }); const id = makeRoomId(mode); await createCompetitiveRoom({ mode, roomId: id, player, category }); saveSession(mode, { roomId: id, playerId, playerName: trimmedName, resumeAfterRefresh: false }); setRecovery({ status: 'idle', roomId: '', message: '' }); setRoomId(id); }, [mode, playerId, playerName]);
  const joinRoom = useCallback(async (requestedId) => { if (!playerId) throw new Error('Authenticating player identity. Please try again in a moment.'); const trimmedName = playerName.trim(); if (!trimmedName) throw new Error('Enter your name before joining a room.'); setError(''); const normalized = normalizeRoomCode(requestedId); const player = createModePlayer({ id: playerId, name: trimmedName }); await joinCompetitiveRoom({ mode, roomId: normalized, player }); saveSession(mode, { roomId: normalized, playerId, playerName: trimmedName, resumeAfterRefresh: false }); setRecovery({ status: 'idle', roomId: '', message: '' }); setRoomId(normalized); }, [mode, playerId, playerName]);

  const startMode = useCallback(async (category) => {
    if (!state || state.hostId !== playerId) throw new Error('Only the host can start this mode.');
    if (mode === COMPETITIVE_MODES.TEAM_BATTLE) {
      const isLobbyStart = state.phase === MODE_PHASES.LOBBY && state.status === 'lobby';
      const isFinishedRematch = state.phase === MODE_PHASES.RESULTS && state.status === 'finished';
      if (!isLobbyStart && !isFinishedRematch) throw new Error('Team Battle rematch is available only after the match finishes.');
      if (teamStartInFlightRef.current) throw new Error('Team Battle rematch is already starting.');
      teamStartInFlightRef.current = true;
    }
    try {
      const rawPlayers = Object.values(state.players || {});
    const players = mode === COMPETITIVE_MODES.TEAM_BATTLE
      ? [...rawPlayers].sort((a, b) => (Number(a.joinOrder) || 999) - (Number(b.joinOrder) || 999))
      : rawPlayers;
    if (players.length !== 4) throw new Error('Exactly four players are required.');
    let next;
    if (mode === COMPETITIVE_MODES.TOURNAMENT) {
      next = createTournamentState({ tournamentId: roomId, roomId, players, category, hostId: playerId });
      next = startMatch(next, TOURNAMENT_MATCH_IDS.SEMI_A, targetMapForPlayers(category, next.matches[TOURNAMENT_MATCH_IDS.SEMI_A].playerIds, 0));
      next = startMatch(next, TOURNAMENT_MATCH_IDS.SEMI_B, targetMapForPlayers(category, next.matches[TOURNAMENT_MATCH_IDS.SEMI_B].playerIds, 3));
    } else {
      const lobbyAssignments = state.teams || undefined;
      if (!validateTeamAssignments(lobbyAssignments, players.map((player) => player.id))) throw new Error('Both teams must have exactly two players before the host can start.');
      const teamState = createTeamBattleState({ teamRoomId: roomId, players, category, hostId: playerId, teamAssignments: lobbyAssignments });
      next = assignTeamTargets(teamState, targetMapForTeams(category, teamState.teams, { roomSeed: `${teamState.teamRoomId}:${teamState.createdAt}`, roundNumber: teamState.roundNumber }));
    }
      await writeCompetitiveState({ mode, roomId, state: next });
      await writePrivateTargets(mode, roomId, next);
    } finally {
      if (mode === COMPETITIVE_MODES.TEAM_BATTLE) teamStartInFlightRef.current = false;
    }
  }, [mode, playerId, roomId, state]);

  const recordGuess = useCallback(async (targetId) => {
    if (!state) return;
    if (mode === COMPETITIVE_MODES.TOURNAMENT) {
      const active = getActiveMatch(state, playerId);
      if (!active || !targetId || !targetReady || !canMutateCompetitive) return;
      if (isFirebaseConfigured) {
        await submitTournamentGuess({ roomId, matchId: active.matchId, playerId, roundNumber: active.roundNumber });
        return;
      }
    }
    await mutateCompetitiveState({ mode, roomId, mutate: (current) => {
      if (mode === COMPETITIVE_MODES.TOURNAMENT) { const active = getActiveMatch(current, playerId); if (!active) return current; const guessed = recordMatchGuess(current, active.matchId, playerId, targetId); const updated = guessed.matches?.[active.matchId]; return updated?.playerIds?.every((id) => updated.guesses?.[id]) ? completeTournamentRound(guessed, active.matchId) : guessed; }
      const team = getPlayerTeam(current, playerId); const opponentTeam = Object.values(current.teams || {}).find((candidate) => candidate.teamId !== team?.teamId);
      if (!team || !opponentTeam || current.match?.status !== 'playing' || current.match.guesses?.[playerId]) return current;
      const currentRoundNumber = Number(current.match.roundNumber || current.roundNumber);
      const privateTargetMatchesRound = privateTarget?.matchId === current.match.matchId && Number(privateTarget?.roundNumber) === currentRoundNumber;
      if (!targetReady || !privateTarget || !privateTargetMatchesRound) return current;
      const privateOpponentTargetId = privateTarget.targetId || privateTarget.id;
      const correct = Boolean(privateOpponentTargetId && privateOpponentTargetId === targetId);
      const guessedTargetOwnerTeamId = correct ? opponentTeam.teamId : null;
      return { ...current, match: { ...current.match, confirmationTeamId: current.match.confirmationTeamId || guessedTargetOwnerTeamId, guesses: { ...(current.match.guesses || {}), [playerId]: { playerId, targetId, correct, targetOwnerId: correct ? opponentTeam.playerIds[0] : null, opponentTeamId: guessedTargetOwnerTeamId, timestamp: Date.now() } } }, updatedAt: Date.now() };
    }});
  }, [mode, playerId, roomId, state, privateTarget]);

  const resolveTournamentMatch = useCallback(async (matchId) => {
    if (!state || !canMutateCompetitive) return null;
    const next = await mutateCompetitiveState({ mode, roomId, mutate: (current) => {
      const match = current.matches?.[matchId];
      if (!match || match.status !== 'playing') return current;
      let resolved = current;
      const currentMatch = resolved.matches?.[matchId];
      const protectedTargets = currentMatch?.targets && Object.keys(currentMatch.targets).length === 2
        ? currentMatch.targets
        : targetMapForPlayers(resolved.category, currentMatch.playerIds, Math.max(0, (Number(currentMatch.roundNumber) - 1) * 2));
      resolved = { ...resolved, matches: { ...resolved.matches, [matchId]: { ...currentMatch, targets: protectedTargets } } };
      match.playerIds.filter((id) => !match.guesses?.[id]).forEach((id) => { resolved = recordMatchGuess(resolved, matchId, id, '__timeout__'); });
      const completedMatch = resolved.matches?.[matchId];
      const scores = { ...(completedMatch?.scores || {}) };
      const playerStats = { ...(resolved.playerStats || {}) };
      completedMatch.playerIds.forEach((id) => {
        const guess = completedMatch.guesses?.[id];
        if (!guess?.correct) return;
        scores[id] = (scores[id] || 0) + 1;
        const existing = playerStats[id] || { playerId: id, score: 0, guesses: 0, correctGuesses: 0, roundHistory: [], reward: null };
        playerStats[id] = { ...existing, score: (existing.score || 0) + 1, guesses: existing.guesses || 0, correctGuesses: (existing.correctGuesses || 0) + 1 };
      });
      resolved = { ...resolved, playerStats, matches: { ...resolved.matches, [matchId]: { ...completedMatch, scores } } };
      return completeTournamentRound(resolved, matchId);
    } });
    return next;
  }, [mode, playerId, roomId, state, canMutateCompetitive]);

  const advanceTournamentRound = useCallback(async (matchId) => {
    if (!state || !canMutateCompetitive) return null;
    const next = await mutateCompetitiveState({ mode, roomId, mutate: (current) => {
      const match = current.matches?.[matchId];
      if (!match || match.status !== 'round_result') return current;
      if (match.roundNumber < 3) {
        const targets = targetMapForPlayers(current.category, match.playerIds, match.roundNumber * 2);
        return advanceTournamentRoundState(current, matchId, targets);
      }
      const [first, second] = match.playerIds;
      const firstScore = match.scores?.[first] || 0;
      const secondScore = match.scores?.[second] || 0;
      const playingState = { ...current, matches: { ...current.matches, [matchId]: { ...match, status: 'playing', phase: MODE_PHASES.PLAYING } } };
      return finishMatch(playingState, matchId, firstScore >= secondScore ? first : second, { message: `${current.players[firstScore >= secondScore ? first : second]?.name || 'Player'} advances.` });
    } });
    if (next) await writePrivateTargets(mode, roomId, next);
  }, [mode, playerId, roomId, state, canMutateCompetitive]);

  const advanceTournament = useCallback(async () => {
    if (!state || state.phase !== MODE_PHASES.TRANSITION || !canMutateCompetitive) return null;
    const next = await mutateCompetitiveState({ mode, roomId, mutate: (current) => {
      if (current.phase !== MODE_PHASES.TRANSITION) return current;
      const finalIds = current.matches[TOURNAMENT_MATCH_IDS.FINAL].playerIds; const consolationIds = current.matches[TOURNAMENT_MATCH_IDS.CONSOLATION].playerIds;
      return startNextTournamentMatches(current, { [TOURNAMENT_MATCH_IDS.FINAL]: targetMapForPlayers(current.category, finalIds, current.roundNumber + 5), [TOURNAMENT_MATCH_IDS.CONSOLATION]: targetMapForPlayers(current.category, consolationIds, current.roundNumber + 8) });
    }});
    if (next) await writePrivateTargets(mode, roomId, next);
  }, [mode, playerId, roomId, state, canMutateCompetitive]);

  const confirmTeamGuess = useCallback(async () => {
    if (!state || mode !== COMPETITIVE_MODES.TEAM_BATTLE || state.match?.status !== 'playing' || !state.match?.matchId) return;
    const team = getPlayerTeam(state, playerId);
    const currentRoundNumber = Number(state.match.roundNumber || state.roundNumber);
    const ownedTarget = privateTarget?.ownedTarget || state.match?.targets?.[playerId] || null;
    const targetMatchesCurrentRound = privateTarget?.matchId === state.match.matchId && Number(privateTarget?.roundNumber) === currentRoundNumber;
    const fallbackTargetMatchesCurrentRound = !privateTarget?.ownedTarget && Number(state.match?.roundNumber || state.roundNumber) === currentRoundNumber;
    if (!team?.teamId || !targetReady || !ownedTarget?.id || (!targetMatchesCurrentRound && !fallbackTargetMatchesCurrentRound)) return;
    const targetSnapshot = { id: ownedTarget.id, targetId: ownedTarget.targetId || ownedTarget.id, name: ownedTarget.name, image: ownedTarget.image, teamId: team.teamId };
    await mutateCompetitiveState({ mode, roomId, mutate: (current) => confirmTeamRound(current, playerId, Date.now(), { targetSnapshot }) });
  }, [mode, playerId, roomId, state, privateTarget, targetReady]);

  const resolveTeamRound = useCallback(async () => {
    if (!state || state.match?.status !== 'playing' || !canMutateCompetitive) return;
    await mutateCompetitiveState({ mode, roomId, mutate: (current) => {
      if (current.match?.status !== 'playing' || !areAllRequiredTeamConfirmationsComplete(current)) return current;
      const guesses = Object.values(current.match?.guesses || {});
      const confirmingTeamIds = getRequiredConfirmationTeams(current);
      if (confirmingTeamIds.length === 0) return current;
      const confirmationSnapshots = Object.fromEntries(confirmingTeamIds.map((teamId) => {
        const confirmation = Object.values(current.match?.confirmations?.[teamId] || {}).find((entry) => entry?.roundNumber === current.roundNumber && entry?.matchId === current.match?.matchId && entry?.targetSnapshot);
        return [teamId, confirmation?.targetSnapshot || null];
      }).filter(([, snapshot]) => snapshot));
      const privateSnapshots = {};
      if (privateTarget?.teamId && privateTarget?.name) privateSnapshots[privateTarget.teamId] = { id: privateTarget.id, targetId: privateTarget.targetId || privateTarget.id, name: privateTarget.name, image: privateTarget.image, teamId: privateTarget.teamId };
      if (privateTarget?.ownedTarget?.teamId && privateTarget.ownedTarget?.name) privateSnapshots[privateTarget.ownedTarget.teamId] = { id: privateTarget.ownedTarget.id, targetId: privateTarget.ownedTarget.targetId || privateTarget.ownedTarget.id, name: privateTarget.ownedTarget.name, image: privateTarget.ownedTarget.image, teamId: privateTarget.ownedTarget.teamId };
      const targetSnapshots = { ...privateSnapshots, ...confirmationSnapshots };
      const winningTeamIds = confirmingTeamIds.map((teamId) => teamId === TEAM_IDS.A ? TEAM_IDS.B : TEAM_IDS.A);
      const points = { [TEAM_IDS.A]: winningTeamIds.includes(TEAM_IDS.A) ? 1 : 0, [TEAM_IDS.B]: winningTeamIds.includes(TEAM_IDS.B) ? 1 : 0 };
      return finishTeamRound(current, winningTeamIds, { points, guesses, targetSnapshots, winningTeamIds });
    }});
  }, [mode, playerId, roomId, state, privateTarget, canMutateCompetitive]);

  const advanceTeam = useCallback(async () => {
    if (!state || state.status !== 'round_result' || !canMutateCompetitive) return;
    const next = await mutateCompetitiveState({ mode, roomId, mutate: (current) => {
      if (current.status !== 'round_result') return current;
      const roomSeed = `${current.teamRoomId}:${current.createdAt}`;
      const nextRoundNumber = Number(current.roundNumber) + 1;
      const targetMap = targetMapForTeams(current.category, current.teams, { roomSeed, roundNumber: nextRoundNumber });
      return advanceTeamRound(current, targetMap);
    }});
    if (next) {
      const nextTargetMap = targetMapForTeams(next.category, next.teams, { roomSeed: `${next.teamRoomId}:${next.createdAt}`, roundNumber: next.roundNumber });
      const teamTargets = Object.fromEntries(Object.values(next.teams || {}).map((team) => [team.teamId, nextTargetMap[team.playerIds[0]]]).filter(([, target]) => target));
      await writePrivateTargets(mode, roomId, { ...next, match: { ...next.match, targets: nextTargetMap, teamTargets } });
    }
  }, [mode, playerId, roomId, state, canMutateCompetitive]);

  useEffect(() => {
    if (mode !== COMPETITIVE_MODES.TEAM_BATTLE || !state || !canMutateCompetitive || state.match?.status !== 'playing' || !areAllRequiredTeamConfirmationsComplete(state) || teamResolutionInFlightRef.current) return undefined;
    teamResolutionInFlightRef.current = true;
    resolveTeamRound().catch((resolutionError) => setError(resolutionError?.message || 'Team Battle round resolution failed.')).finally(() => { teamResolutionInFlightRef.current = false; });
    return undefined;
  }, [mode, playerId, state, resolveTeamRound, canMutateCompetitive]);

  useEffect(() => {
    if (mode !== COMPETITIVE_MODES.TEAM_BATTLE || !state || !canMutateCompetitive || state.status !== 'round_result' || !state.match?.revealEndTimestamp || teamAdvanceInFlightRef.current) return undefined;
    const remaining = state.match.revealEndTimestamp - Date.now();
    const runAdvance = () => {
      if (teamAdvanceInFlightRef.current) return;
      teamAdvanceInFlightRef.current = true;
      advanceTeam().catch((advanceError) => setError(advanceError?.message || 'Team Battle round advance failed.')).finally(() => { teamAdvanceInFlightRef.current = false; });
    };
    if (remaining > 0) {
      const timerId = window.setTimeout(runAdvance, remaining + 10);
      return () => window.clearTimeout(timerId);
    }
    runAdvance();
    return undefined;
  }, [mode, playerId, state, advanceTeam]);

  useEffect(() => {
    if (mode !== COMPETITIVE_MODES.TOURNAMENT || !state || !canMutateCompetitive || state.hostId !== playerId) return undefined;
    const playingMatches = Object.values(state.matches || {}).filter((match) => match.status === 'playing' && match.playerIds?.length === 2);
    const dueMatches = playingMatches.filter((match) => {
      const hasConfirmation = match.playerIds.some((id) => Boolean(match.guesses?.[id]));
      const timedOut = Number.isFinite(Number(match.roundEndTimestamp)) && Number(match.roundEndTimestamp) <= Date.now();
      return hasConfirmation || timedOut;
    });
    dueMatches.forEach((match) => {
      if (tournamentResolutionInFlightRef.current.has(match.matchId)) return;
      tournamentResolutionInFlightRef.current.add(match.matchId);
      resolveTournamentMatch(match.matchId).catch((resolutionError) => setError(resolutionError?.message || 'Tournament round resolution failed.')).finally(() => tournamentResolutionInFlightRef.current.delete(match.matchId));
    });
    const nextDeadline = playingMatches.map((match) => Number(match.roundEndTimestamp)).filter((timestamp) => Number.isFinite(timestamp) && timestamp > Date.now()).sort((a, b) => a - b)[0];
    if (!nextDeadline) return undefined;
    const timerId = window.setTimeout(() => setState((current) => current ? { ...current } : current), Math.max(0, nextDeadline - Date.now()) + 10);
    return () => window.clearTimeout(timerId);
  }, [mode, state, canMutateCompetitive, resolveTournamentMatch]);

  useEffect(() => {
    if (mode !== COMPETITIVE_MODES.TOURNAMENT || !state || !canMutateCompetitive || state.hostId !== playerId) return undefined;
    const revealMatches = Object.values(state.matches || {}).filter((match) => match.status === 'round_result' && Number.isFinite(Number(match.revealEndTimestamp)));
    const dueMatches = revealMatches.filter((match) => Number(match.revealEndTimestamp) <= Date.now());
    dueMatches.forEach((match) => {
      if (tournamentAdvanceInFlightRef.current.has(match.matchId)) return;
      tournamentAdvanceInFlightRef.current.add(match.matchId);
      advanceTournamentRound(match.matchId).catch((advanceError) => setError(advanceError?.message || 'Tournament round advance failed.')).finally(() => tournamentAdvanceInFlightRef.current.delete(match.matchId));
    });
    const nextDeadline = revealMatches.map((match) => Number(match.revealEndTimestamp)).filter((timestamp) => timestamp > Date.now()).sort((a, b) => a - b)[0];
    if (!nextDeadline) return undefined;
    const timerId = window.setTimeout(() => setState((current) => current ? { ...current } : current), Math.max(0, nextDeadline - Date.now()) + 10);
    return () => window.clearTimeout(timerId);
  }, [mode, state, canMutateCompetitive, advanceTournamentRound]);

  useEffect(() => {
    if (mode !== COMPETITIVE_MODES.TOURNAMENT || !state || !canMutateCompetitive || state.phase !== MODE_PHASES.TRANSITION || !state.transitionEndTimestamp || tournamentBracketAdvanceInFlightRef.current) return undefined;
    const remaining = Number(state.transitionEndTimestamp) - Date.now();
    const runAdvance = () => {
      if (tournamentBracketAdvanceInFlightRef.current) return;
      tournamentBracketAdvanceInFlightRef.current = true;
      advanceTournament().catch((advanceError) => setError(advanceError?.message || 'Tournament bracket advance failed.')).finally(() => { tournamentBracketAdvanceInFlightRef.current = false; });
    };
    if (remaining > 0) {
      const timerId = window.setTimeout(runAdvance, remaining + 10);
      return () => window.clearTimeout(timerId);
    }
    runAdvance();
    return undefined;
  }, [mode, state, canMutateCompetitive, advanceTournament]);

  const changeTeam = useCallback(async (teamId) => { if (!state || mode !== COMPETITIVE_MODES.TEAM_BATTLE || state.phase !== 'lobby') return; await setCompetitiveTeam({ mode, roomId, playerId, teamId }); }, [mode, roomId, playerId, state]);

  const removePlayer = useCallback(async (targetPlayerId) => { if (!state || state.hostId !== playerId || targetPlayerId === playerId) throw new Error('Only the host can remove another player.'); await removeCompetitivePlayer({ mode, roomId, playerId: targetPlayerId }); }, [mode, playerId, roomId, state]);
  const leave = useCallback(async () => { const current = state; try { if (current && roomId) await leaveCompetitiveRoom({ mode, roomId, playerId, isHost: current.hostId === playerId }); } finally { clearSession(mode); setRoomId(''); setState(null); setPrivateTarget(null); setTargetReady(false); setRecovery({ status: 'idle', roomId: '', message: '' }); awaitingFreshSnapshotRef.current = Boolean(isFirebaseConfigured); setConnectionState(isFirebaseConfigured ? 'connecting' : 'offline-local'); recoveryAttemptedRef.current = false; } }, [mode, playerId, roomId, state]);
  const clearSessionRecovery = useCallback(() => { clearSession(mode); setRecovery({ status: 'idle', roomId: '', message: '' }); recoveryAttemptedRef.current = false; }, [mode]);
  const value = useMemo(() => ({ mode, state, roomId, playerId, playerName, setPlayerName, status, error, recovery, connectionState, canMutateCompetitive, retrySessionRecovery, clearSessionRecovery, privateTarget, targetReady, createRoom, joinRoom, startMode, recordGuess, resolveTournamentMatch, advanceTournament, advanceTournamentRound, resolveTeamRound, advanceTeam, confirmTeamGuess, changeTeam, removePlayer, leave, CATEGORY_META, MODE_PHASES, TEAM_IDS, TOURNAMENT_MATCH_IDS }), [mode, state, roomId, playerId, playerName, status, error, recovery, connectionState, canMutateCompetitive, retrySessionRecovery, clearSessionRecovery, privateTarget, targetReady, createRoom, joinRoom, startMode, recordGuess, resolveTournamentMatch, advanceTournament, advanceTournamentRound, resolveTeamRound, advanceTeam, confirmTeamGuess, changeTeam, removePlayer, leave]);
  return <CompetitiveModeContext.Provider value={value}>{children}</CompetitiveModeContext.Provider>;
}

export function useCompetitiveMode() { const value = useContext(CompetitiveModeContext); if (!value) throw new Error('useCompetitiveMode must be used inside CompetitiveModeProvider'); return value; }
