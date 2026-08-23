import { db } from './config.js';
import {
  onValue,
  onDisconnect,
  push,
  ref,
  remove,
  set,
  serverTimestamp,
} from 'firebase/database';

const ROOT_BY_ROOM_TYPE = {
  classic: 'rooms',
  teamRooms: 'teamRooms',
  'team-battle': 'teamRooms',
  tournament: 'tournamentRooms',
};

const voiceCallsPath = (roomType, roomId) =>
  `${ROOT_BY_ROOM_TYPE[roomType] || roomType}/${roomId}/voiceCalls`;

export function getVoiceCallsRef(roomType, roomId) {
  if (!db || !roomType || !roomId) return null;
  return ref(db, voiceCallsPath(roomType, roomId));
}

export function subscribeVoiceCalls(roomType, roomId, callback) {
  const callsRef = getVoiceCallsRef(roomType, roomId);
  if (!callsRef) return () => {};
  return onValue(callsRef, (snapshot) => callback(snapshot.val() || {}));
}

export async function createVoiceCall({ roomType, roomId, scopeId, hostId, eligibleParticipantIds }) {
  const callsRef = getVoiceCallsRef(roomType, roomId);
  if (!callsRef) throw new Error('Firebase is not configured.');

  const callRef = push(callsRef);
  const eligible = Object.fromEntries(
    [...new Set(eligibleParticipantIds.filter(Boolean))].map((id) => [id, true]),
  );
  const now = Date.now();

  await set(callRef, {
    hostId,
    scopeId: scopeId || 'room',
    status: 'open',
    createdAt: now,
    expiresAt: now + (30 * 60 * 1000),
    eligible,
    participants: {},
  });
  return callRef.key;
}

export async function joinVoiceCall({ roomType, roomId, callId, participantId, displayName }) {
  if (!db || !roomType || !roomId || !callId || !participantId) {
    throw new Error('Voice room identity is incomplete.');
  }

  const participantRef = ref(
    db,
    `${voiceCallsPath(roomType, roomId)}/${callId}/participants/${participantId}`,
  );

  // Register disconnect cleanup before writing presence so abrupt tab/network
  // termination does not leave a stale participant when Firebase can process it.
  await onDisconnect(participantRef).remove();
  await set(participantRef, {
    participantId,
    displayName: displayName || 'Player',
    joinedAt: Date.now(),
    active: true,
  });

  return () => remove(participantRef);
}

export async function leaveVoiceCall({ roomType, roomId, callId, participantId }) {
  if (!db || !roomType || !roomId || !callId || !participantId) return;
  const participantRef = ref(
    db,
    `${voiceCallsPath(roomType, roomId)}/${callId}/participants/${participantId}`,
  );
  await onDisconnect(participantRef).cancel().catch(() => {});
  await remove(participantRef);
}

export function subscribeVoiceSignals({ roomType, roomId, callId, receiverId, senderId }, callback) {
  if (!db || !roomType || !roomId || !callId || !receiverId || !senderId) return () => {};
  const signalRef = ref(
    db,
    `${voiceCallsPath(roomType, roomId)}/${callId}/signals/${senderId}/${receiverId}`,
  );
  return onValue(signalRef, (snapshot) => callback(snapshot.val() || {}));
}

function serializeSessionDescription(description) {
  if (!description) return null;
  const json = typeof description.toJSON === 'function'
    ? description.toJSON()
    : { type: description.type, sdp: description.sdp };
  if (!json?.type || typeof json.sdp !== 'string' || !json.sdp.trim()) return null;
  return { type: String(json.type), sdp: json.sdp };
}

export async function removeVoiceSignal({ roomType, roomId, callId, senderId, receiverId, signalId }) {
  if (!db || !roomType || !roomId || !callId || !senderId || !receiverId || !signalId) return;
  const signalRef = ref(
    db,
    `${voiceCallsPath(roomType, roomId)}/${callId}/signals/${senderId}/${receiverId}/${signalId}`,
  );
  await remove(signalRef);
}

export async function writeVoiceSignal({ roomType, roomId, callId, senderId, receiverId, signal }) {
  if (!db || !roomType || !roomId || !callId || !senderId || !receiverId || !signal) return;
  const payload = { ...signal };
  if (payload.type === 'offer' || payload.type === 'answer') {
    payload.description = serializeSessionDescription(payload.description);
    if (!payload.description) return;
  }
  const signalRef = push(
    ref(db, `${voiceCallsPath(roomType, roomId)}/${callId}/signals/${senderId}/${receiverId}`),
  );
  await onDisconnect(signalRef).remove();
  await set(signalRef, { ...payload, createdAt: serverTimestamp() });
}
