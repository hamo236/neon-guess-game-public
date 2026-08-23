import React from 'react';
import { useVoiceRoom } from '../../hooks/useVoiceRoom.js';

const statusCopy = {
  'requesting-microphone': 'Requesting microphone…',
  waiting: 'Voice call is open',
  joining: 'Joining voice call…',
  connected: 'Voice call connected',
  error: 'Voice call needs attention',
};

export default function VoiceRoomPanel({ roomType, roomId, scopeId = 'room', playerId, displayName, eligibleParticipantIds, label = 'VOICE ROOM' }) {
  const voice = useVoiceRoom({ roomType, roomId, scopeId, playerId, displayName, eligibleParticipantIds });
  const participantCount = Object.keys(voice.participants || {}).length;
  const hasCall = Boolean(voice.currentCall);

  if (!roomId || !playerId) return null;

  return (
    <section className="rounded-xl border border-primary-fixed/20 bg-primary-fixed/[0.045] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.12)]" aria-label={label}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${voice.joined ? 'bg-primary-fixed animate-pulse' : 'bg-white/35'}`} aria-hidden="true" />
            <span className="font-label-caps text-[10px] tracking-[0.14em] text-primary-fixed">{label}</span>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant" aria-live="polite">
            {voice.error || (voice.status !== 'idle' ? (statusCopy[voice.status] || 'Voice room ready') : hasCall ? `Call available · ${participantCount} joined` : 'Optional audio call')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!voice.joined && !hasCall && <button type="button" onClick={voice.startCall} className="touch-feedback min-h-10 rounded-lg bg-primary-fixed px-3 py-2 text-xs font-semibold text-on-primary-fixed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed">Start call</button>}
          {!voice.joined && hasCall && <button type="button" onClick={voice.joinCall} className="touch-feedback min-h-10 rounded-lg bg-primary-fixed px-3 py-2 text-xs font-semibold text-on-primary-fixed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed">Join call</button>}
          {voice.joined && <>
            <button type="button" onClick={voice.toggleMute} className="touch-feedback min-h-10 rounded-lg border border-white/15 px-3 py-2 text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed" aria-pressed={voice.isMuted}>{voice.isMuted ? 'Unmute mic' : 'Mute mic'}</button>
            <button type="button" onClick={voice.toggleOutputMute} className="touch-feedback min-h-10 rounded-lg border border-white/15 px-3 py-2 text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed" aria-pressed={voice.isOutputMuted}>{voice.isOutputMuted ? 'Hear call' : 'Mute call'}</button>
            <button type="button" onClick={voice.leaveCall} className="touch-feedback min-h-10 rounded-lg border border-error/40 px-3 py-2 text-xs text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error">Leave call</button>
          </>}
        </div>
      </div>
    </section>
  );
}
