import { useEffect, useRef, useState } from 'react';

const MIN_HEIGHT = 180;
const MAX_HEIGHT = 520;
const DEFAULT_HEIGHT = 288;

export default function CompetitiveChatPanel({ messages = [], playerId, onSend, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const resizeRef = useRef(null);
  const longPressRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  const clearPress = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
    longPressRef.current = null;
    resizeRef.current = null;
  };

  const beginResize = (event) => {
    if (disabled) return;
    clearPress();
    const point = event.touches?.[0] || event;
    longPressRef.current = setTimeout(() => {
      resizeRef.current = { startY: point.clientY, startHeight: height };
    }, 260);
  };

  const moveResize = (event) => {
    if (!resizeRef.current) return;
    event.preventDefault();
    const point = event.touches?.[0] || event;
    const nextHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, resizeRef.current.startHeight - (point.clientY - resizeRef.current.startY)));
    setHeight(nextHeight);
  };

  const submit = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || disabled || isSending) return;
    setSendError('');
    setIsSending(true);
    try {
      await onSend(text);
      setDraft('');
    } catch (error) {
      setSendError(error?.message || 'Message could not be sent.');
    } finally {
      setIsSending(false);
    }
  };

  return <section className="ng-competitive-chat rounded-2xl border border-primary-fixed/25 bg-[#0c1118]/95 shadow-[0_18px_55px_rgba(0,0,0,0.3)] overflow-hidden" aria-label="Room chat">
    <button type="button" onClick={() => setOpen((value) => !value)} className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-white touch-feedback" aria-expanded={open}>
      <span className="flex items-center gap-2"><span className="material-symbols-outlined text-primary-fixed" aria-hidden="true">forum</span><span className="font-label-caps text-label-caps">ROOM CHAT</span><span className="rounded-full bg-primary-fixed/15 px-2 py-0.5 text-[10px] text-primary-fixed">{messages.length}</span></span>
      <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">{open ? 'expand_less' : 'expand_more'}</span>
    </button>
    {open && <div style={{ height }} className="flex flex-col border-t border-white/10">
      <div onTouchStart={beginResize} onTouchMove={moveResize} onTouchEnd={clearPress} onTouchCancel={clearPress} onMouseDown={beginResize} onMouseMove={moveResize} onMouseUp={clearPress} onMouseLeave={clearPress} className="flex h-5 shrink-0 cursor-ns-resize items-center justify-center touch-none" title="Long press and drag to resize chat" aria-label="Long press and drag to resize chat">
        <span className="h-1 w-12 rounded-full bg-white/25" aria-hidden="true" />
      </div>
      <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-3" aria-live="polite">
        {messages.length === 0 ? <p className="px-2 py-6 text-center text-sm text-on-surface-variant">No messages yet. Say hello.</p> : messages.map((item) => <div key={item.id} className={`flex ${item.playerId === playerId ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[88%] rounded-2xl px-3 py-2 ${item.playerId === playerId ? 'rounded-br-sm bg-primary-fixed/15 text-white' : 'rounded-bl-sm bg-white/[0.08] text-on-surface-variant'}`}><div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-fixed">{item.playerName || 'PLAYER'}</div><p className="break-words text-sm leading-5">{item.message}</p></div></div>)}
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-white/10 p-3"><input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={500} disabled={disabled || isSending} placeholder="Write a message..." aria-label="Chat message" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-on-surface-variant focus:border-primary-fixed/60" /><button type="submit" disabled={disabled || isSending || !draft.trim()} className="min-h-10 min-w-16 rounded-xl bg-primary-fixed px-3 text-sm font-bold text-on-primary-fixed disabled:opacity-40">{isSending ? 'SENDING…' : 'SEND'}</button></form>
      {sendError && <p role="alert" className="px-3 pb-3 text-xs text-error">{sendError}</p>}
    </div>}
  </section>;
}
