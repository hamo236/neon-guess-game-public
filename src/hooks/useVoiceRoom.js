import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createVoiceCall,
  joinVoiceCall,
  leaveVoiceCall,
  subscribeVoiceCalls,
  subscribeVoiceSignals,
  writeVoiceSignal,
} from '../firebase/voiceRoom.js';

const OPEN_CALL_MAX_AGE = 30 * 60 * 1000;
const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

function getCurrentCall(calls, playerId, eligibleIds, scopeId) {
  const now = Date.now();
  const allowed = new Set(eligibleIds);
  return Object.entries(calls || {})
    .map(([id, call]) => ({ id, ...call }))
    .filter((call) => call.status === 'open' && (now - Number(call.createdAt || 0)) < OPEN_CALL_MAX_AGE)
    .filter((call) => call.scopeId === (scopeId || 'room'))
    .filter((call) => Boolean(playerId && call.eligible?.[playerId] === true))
    .filter((call) => Object.keys(call.eligible || {}).some((id) => allowed.has(id)))
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))[0] || null;
}

export function useVoiceRoom({ roomType, roomId, scopeId = 'room', playerId, displayName, eligibleParticipantIds = [], enabled = true }) {
  const [calls, setCalls] = useState({});
  const [callsLoaded, setCallsLoaded] = useState(false);
  const [callId, setCallId] = useState(null);
  const [participants, setParticipants] = useState({});
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isOutputMuted, setIsOutputMuted] = useState(false);
  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map());
  const audioElementsRef = useRef(new Map());
  const signalUnsubsRef = useRef(new Map());
  const seenSignalsRef = useRef(new Set());
  const pendingCandidatesRef = useRef(new Map());
  const cleanupParticipantRef = useRef(null);

  const eligibleIds = useMemo(
    () => [...new Set([playerId, ...eligibleParticipantIds].filter(Boolean))],
    [playerId, eligibleParticipantIds.join('|')],
  );
  const currentCall = useMemo(() => getCurrentCall(calls, playerId, eligibleIds, scopeId), [calls, playerId, eligibleIds, scopeId]);
  const joined = Boolean(callId && currentCall?.id === callId && participants[playerId]);

  const stopPeer = useCallback((remoteId) => {
    const peer = peersRef.current.get(remoteId);
    if (peer) peer.close();
    peersRef.current.delete(remoteId);
    pendingCandidatesRef.current.delete(remoteId);
    const audio = audioElementsRef.current.get(remoteId);
    if (audio) {
      audio.srcObject = null;
      audio.remove();
    }
    audioElementsRef.current.delete(remoteId);
  }, []);

  const stopAllPeers = useCallback(() => {
    [...peersRef.current.keys()].forEach(stopPeer);
    [...signalUnsubsRef.current.values()].forEach((unsubscribe) => unsubscribe());
    signalUnsubsRef.current.clear();
  }, [stopPeer]);

  const ensureLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser does not support microphone calls.');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStreamRef.current = stream;
    return stream;
  }, []);

  const sendSignal = useCallback(async (remoteId, signal) => {
    await writeVoiceSignal({ roomType, roomId, callId, senderId: playerId, receiverId: remoteId, signal });
  }, [callId, playerId, roomId, roomType]);

  const attachRemoteAudio = useCallback((remoteId, stream) => {
    let audio = audioElementsRef.current.get(remoteId);
    if (!audio) {
      audio = document.createElement('audio');
      audio.autoplay = true;
      audio.playsInline = true;
      audio.setAttribute('data-neon-voice-peer', remoteId);
      document.body.appendChild(audio);
      audioElementsRef.current.set(remoteId, audio);
    }
    audio.muted = isOutputMuted;
    audio.srcObject = stream;
    audio.play().catch(() => {});
  }, [isOutputMuted]);

  const createPeer = useCallback(async (remoteId, shouldOffer) => {
    if (!remoteId || remoteId === playerId || peersRef.current.has(remoteId)) return peersRef.current.get(remoteId);
    const stream = await ensureLocalStream();
    const peer = new RTCPeerConnection(rtcConfig);
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    peer.ontrack = (event) => attachRemoteAudio(remoteId, event.streams[0]);
    peer.onicecandidate = (event) => {
      if (event.candidate) sendSignal(remoteId, { type: 'candidate', candidate: event.candidate.toJSON() }).catch(() => {});
    };
    peer.onconnectionstatechange = () => {
      if (['failed', 'closed'].includes(peer.connectionState)) stopPeer(remoteId);
      if (peer.connectionState === 'connected') setStatus('connected');
    };
    peersRef.current.set(remoteId, peer);
    if (shouldOffer) {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await sendSignal(remoteId, { type: 'offer', description: offer });
    }
    return peer;
  }, [attachRemoteAudio, ensureLocalStream, playerId, sendSignal, stopPeer]);

  const handleSignal = useCallback(async (senderId, signalId, signal) => {
    if (!signal || seenSignalsRef.current.has(signalId)) return;
    seenSignalsRef.current.add(signalId);
    try {
      let peer = peersRef.current.get(senderId);
      if (signal.type === 'offer') {
        peer = peer || await createPeer(senderId, false);
        if (peer.signalingState !== 'stable') return;
        await peer.setRemoteDescription(signal.description);
        const pendingCandidates = pendingCandidatesRef.current.get(senderId) || [];
        for (const candidate of pendingCandidates) await peer.addIceCandidate(candidate);
        pendingCandidatesRef.current.delete(senderId);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        await sendSignal(senderId, { type: 'answer', description: answer });
      } else if (signal.type === 'answer') {
        if (!peer) return;
        await peer.setRemoteDescription(signal.description);
        const pendingCandidates = pendingCandidatesRef.current.get(senderId) || [];
        for (const candidate of pendingCandidates) await peer.addIceCandidate(candidate);
        pendingCandidatesRef.current.delete(senderId);
      } else if (signal.type === 'candidate') {
        peer = peer || await createPeer(senderId, false);
        if (peer.remoteDescription) {
          await peer.addIceCandidate(signal.candidate);
        } else {
          const pending = pendingCandidatesRef.current.get(senderId) || [];
          pending.push(signal.candidate);
          pendingCandidatesRef.current.set(senderId, pending);
        }
      }
    } catch (err) {
      setError(err?.message || 'Voice connection negotiation failed.');
      setStatus('error');
    }
  }, [createPeer, sendSignal]);

  useEffect(() => {
    if (!enabled || !roomType || !roomId || !playerId) return () => {};
    return subscribeVoiceCalls(roomType, roomId, (nextCalls) => {
      setCalls(nextCalls);
      setCallsLoaded(true);
    });
  }, [enabled, playerId, roomId, roomType]);

  useEffect(() => {
    if (!callId) {
      setParticipants({});
      return () => {};
    }
    if (!callsLoaded) return;
    const call = calls[callId];
    setParticipants(call?.participants || {});
    if (!call) {
      cleanupParticipantRef.current?.();
      cleanupParticipantRef.current = null;
      setCallId(null);
    }
  }, [callId, calls, callsLoaded]);

  useEffect(() => {
    if (!joined || !callId) return () => {};
    const remoteIds = Object.keys(participants).filter((id) => id !== playerId && eligibleIds.includes(id));
    remoteIds.forEach((remoteId) => {
      const signalKey = `${remoteId}->${playerId}`;
      if (!signalUnsubsRef.current.has(signalKey)) {
        const unsubscribe = subscribeVoiceSignals({ roomType, roomId, callId, senderId: remoteId, receiverId: playerId }, (signals) => {
          Object.entries(signals).forEach(([signalId, signal]) => handleSignal(remoteId, `${signalKey}:${signalId}`, signal));
        });
        signalUnsubsRef.current.set(signalKey, unsubscribe);
      }
      const shouldOffer = String(playerId) < String(remoteId);
      createPeer(remoteId, shouldOffer).catch((err) => { setError(err?.message || 'Could not start peer connection.'); setStatus('error'); });
    });
    [...peersRef.current.keys()].filter((id) => !remoteIds.includes(id)).forEach(stopPeer);
    [...signalUnsubsRef.current.keys()].filter((key) => !remoteIds.some((id) => key === `${id}->${playerId}`)).forEach((key) => {
      signalUnsubsRef.current.get(key)?.();
      signalUnsubsRef.current.delete(key);
    });
    return () => {};
  }, [callId, createPeer, eligibleIds, handleSignal, joined, participants, playerId, roomId, roomType, stopPeer]);

  useEffect(() => () => {
    cleanupParticipantRef.current?.();
    stopAllPeers();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    audioElementsRef.current.forEach((audio) => audio.remove());
    audioElementsRef.current.clear();
  }, [stopAllPeers]);

  const startCall = useCallback(async () => {
    setError('');
    setStatus('requesting-microphone');
    try {
      await ensureLocalStream();
      const id = await createVoiceCall({ roomType, roomId, scopeId, hostId: playerId, eligibleParticipantIds: eligibleIds });
      setCallId(id);
      cleanupParticipantRef.current = await joinVoiceCall({ roomType, roomId, callId: id, participantId: playerId, displayName });
      setStatus('waiting');
    } catch (err) {
      setStatus('error');
      setError(err?.message || 'Could not start the voice call.');
    }
  }, [displayName, eligibleIds, ensureLocalStream, playerId, roomId, roomType, scopeId]);

  const joinCall = useCallback(async () => {
    if (!currentCall) return;
    setError('');
    setStatus('requesting-microphone');
    try {
      await ensureLocalStream();
      setCallId(currentCall.id);
      cleanupParticipantRef.current = await joinVoiceCall({ roomType, roomId, callId: currentCall.id, participantId: playerId, displayName });
      setStatus('joining');
    } catch (err) {
      setStatus('error');
      setError(err?.message || 'Could not join the voice call.');
    }
  }, [currentCall, displayName, ensureLocalStream, playerId, roomId, roomType]);

  const leaveCall = useCallback(async () => {
    const leavingCallId = callId;
    cleanupParticipantRef.current?.();
    cleanupParticipantRef.current = null;
    stopAllPeers();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (leavingCallId) await leaveVoiceCall({ roomType, roomId, callId: leavingCallId, participantId: playerId });
    setCallId(null);
    setParticipants({});
    setStatus('idle');
  }, [callId, playerId, roomId, roomType, stopAllPeers]);

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !next; });
    setIsMuted(next);
  }, [isMuted]);

  const toggleOutputMute = useCallback(() => {
    const next = !isOutputMuted;
    audioElementsRef.current.forEach((audio) => { audio.muted = next; });
    setIsOutputMuted(next);
  }, [isOutputMuted]);

  return {
    currentCall,
    callId,
    participants,
    joined,
    status,
    error,
    isMuted,
    isOutputMuted,
    startCall,
    joinCall,
    leaveCall,
    toggleMute,
    toggleOutputMute,
  };
}
