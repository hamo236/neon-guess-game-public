import { useGameContext } from '../context/GameStateContext';

const RECOVERY_STYLE = {
  restoring: {
    icon: 'sync',
    label: 'SESSION RECOVERY',
    className: 'border-primary-fixed/40 bg-surface-container-high/95 text-primary-fixed',
  },
  error: {
    icon: 'wifi_off',
    label: 'CONNECTION NEEDS ATTENTION',
    className: 'border-error/50 bg-error/15 text-error',
  },
};

export default function ConnectionRecoveryBanner() {
  const { state, fbStatus, fbError, isFirebaseConfigured } = useGameContext();

  if (!isFirebaseConfigured || !state.roomCode || fbStatus === 'ready') return null;

  const isError = fbStatus === 'error';
  const message = isError
    ? (fbError || 'We could not restore the room connection yet.')
    : 'Restoring your room connection…';
  const style = RECOVERY_STYLE[isError ? 'error' : 'restoring'];

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live="polite"
      className={`ng-recovery-banner fixed inset-x-0 top-16 z-50 mx-auto w-[min(92vw,34rem)] overflow-hidden rounded-xl border px-4 py-3 shadow-[0_16px_50px_rgba(0,0,0,0.28)] backdrop-blur-md transition-colors duration-200 motion-reduce:transition-none sm:px-5 ${style.className}`}
    >
      <div
        aria-hidden="true"
        className="ng-recovery-banner__rail pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-70"
      />
      <div className="flex items-start gap-3 text-left">
        <span
          aria-hidden="true"
          className="material-symbols-outlined mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current/25 bg-black/15 text-[18px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {style.icon}
        </span>
        <div className="min-w-0">
          <p className="font-label-caps text-label-caps tracking-[0.14em]">
            {style.label}
          </p>
          <p className="mt-1 text-sm leading-5 text-on-surface-variant">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
