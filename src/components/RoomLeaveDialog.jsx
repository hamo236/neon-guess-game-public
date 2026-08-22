const RoomLeaveDialog = ({
  title = 'Are you sure you want to leave the room?',
  onConfirm,
  onCancel,
  isPending = false,
  error = '',
}) => (
  <div className="ng-1v1-leave-dialog fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true" aria-labelledby="leave-room-title">
    <div className="ng-1v1-leave-dialog__panel glass-panel-heavy w-full max-w-md rounded-xl p-6 border border-white/20">
      <h2 id="leave-room-title" className="font-headline-md text-headline-md text-on-surface text-center mb-6">
        {title}
      </h2>
      {error && (
        <p className="mb-4 text-center font-body-sm text-body-sm text-error" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          disabled={isPending}
          className="flex-1 rounded-lg bg-error px-4 py-3 font-label-caps text-label-caps text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'LEAVINGâ€¦' : 'YES'}
        </button>
        <button
          onClick={onCancel}
          disabled={isPending}
          className="flex-1 rounded-lg border border-white/20 px-4 py-3 font-label-caps text-label-caps text-on-surface disabled:opacity-50 disabled:cursor-not-allowed"
        >
          NO
        </button>
      </div>
    </div>
  </div>
);

export default RoomLeaveDialog;

