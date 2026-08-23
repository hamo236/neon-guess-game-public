import { useVoiceRoom } from '../../hooks/useVoiceRoom.js';

const statusCopy = {
  'requesting-microphone': 'Requesting microphone…',
  waiting: 'Voice call is open',
  joining: 'Joining voice call…',
  reconnecting: 'Reconnecting voice call…',
  connected: 'Voice call connected',
  error: 'Voice call needs attention',
};

const statusIcon = {
  'requesting-microphone': 'mic',
  waiting: 'phone_in_talk',
  joining: 'call',
  connected: 'phone_in_talk',
  error: 'phone_disabled',
};

function IconButton({ label, icon, onClick, pressed = false, tone = 'neutral', disabled = false }) {
  const toneClass = tone === 'active'
    ? 'border-emerald-300/45 bg-emerald-300/12 text-emerald-200 hover:bg-emerald-300/20'
    : tone === 'danger'
      ? 'border-rose-300/45 bg-rose-300/10 text-rose-200 hover:bg-rose-300/18'
      : 'border-white/15 bg-white/[0.06] text-white/85 hover:bg-white/[0.12]';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`touch-feedback inline-flex h-9 w-9 items-center justify-center rounded-full border ${toneClass} transition-[transform,background-color,color,box-shadow] duration-150 ease-out motion-reduce:transition-none active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed`}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
    >
      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{icon}</span>
    </button>
  );
}

export default function VoiceRoomPanel({ roomType, roomId, scopeId = 'room', playerId, displayName, eligibleParticipantIds, label = 'VOICE ROOM', compact = false }) {
  const voice = useVoiceRoom({ roomType, roomId, scopeId, playerId, displayName, eligibleParticipantIds });
  const participantCount = Object.keys(voice.participants || {}).length;
  const hasCall = Boolean(voice.currentCall);
  const currentStatus = voice.error ? 'error' : voice.status;
  const connectionLabel = voice.error || (voice.audioPlaybackBlocked ? 'Tap the page to hear the voice call' : voice.status !== 'idle' ? (statusCopy[voice.status] || 'Voice room ready') : hasCall ? `Call available · ${participantCount} joined` : 'Optional audio call');
  const statusGlyph = statusIcon[currentStatus] || (voice.joined ? 'phone_in_talk' : 'phone');

  if (!roomId || !playerId) return null;

  return (
    <section className={`voice-room-panel rounded-2xl border border-white/12 bg-surface/92 shadow-[0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-xl ${compact ? 'px-2.5 py-2' : 'p-3'}`} aria-label={label}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2" aria-live="polite">
          <span className={`material-symbols-outlined shrink-0 text-[18px] ${voice.joined ? 'text-emerald-300' : voice.error ? 'text-rose-300' : 'text-primary-fixed'}`} aria-hidden="true">{statusGlyph}</span>
          <span className="sr-only">{label}: {connectionLabel}</span>
          <span className="hidden truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-fixed sm:inline">{label}</span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {!voice.joined && !hasCall && (
            <IconButton label="Start voice call" icon="phone_in_talk" onClick={voice.startCall} tone="active" />
          )}
          {!voice.joined && hasCall && (
            <IconButton label="Join voice call" icon="call" onClick={voice.joinCall} tone="active" />
          )}
          {voice.joined && <>
            <IconButton label={voice.isMuted ? 'Unmute microphone' : 'Mute microphone'} icon={voice.isMuted ? 'mic_off' : 'mic'} onClick={voice.toggleMute} pressed={voice.isMuted} tone={voice.isMuted ? 'danger' : 'active'} />
            <IconButton label={voice.isOutputMuted ? 'Hear voice call' : 'Mute voice call'} icon={voice.isOutputMuted ? 'volume_off' : 'volume_up'} onClick={voice.toggleOutputMute} pressed={voice.isOutputMuted} tone={voice.isOutputMuted ? 'danger' : 'active'} />
            <IconButton label="Leave voice call" icon="call_end" onClick={voice.leaveCall} tone="active" />
          </>}
        </div>
      </div>
    </section>
  );
}
