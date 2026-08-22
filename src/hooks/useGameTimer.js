/**
 * useGameTimer.js
 * Reusable timer hook.
 * - Counts down from `initialSeconds` to 0.
 * - Calls `onTick(secondsLeft)` every second.
 * - Calls `onExpire()` when 0 is reached.
 * - Cleans up the interval on unmount or when stopped.
 */

import { useEffect, useRef } from 'react';

/**
 * @param {object} opts
 * @param {boolean}  opts.running      - Whether the timer should be ticking
 * @param {number}   opts.seconds      - Current seconds value (from state)
 * @param {function} opts.onTick       - Called every second: (newSeconds) => void
 * @param {function} opts.onExpire     - Called when seconds hit 0
 */
export function useGameTimer({ running, seconds, onTick, onExpire }) {
  const onTickRef = useRef(onTick);
  const onExpireRef = useRef(onExpire);

  // Keep refs fresh so interval captures latest callbacks without re-creating
  useEffect(() => { onTickRef.current = onTick; }, [onTick]);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      onExpireRef.current?.();
      return;
    }

    const interval = setInterval(() => {
      const next = Math.max(0, seconds - 1);
      onTickRef.current?.(next);
      if (next === 0) {
        onExpireRef.current?.();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [running, seconds]);
}

/**
 * Format seconds → "MM:SS"
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
