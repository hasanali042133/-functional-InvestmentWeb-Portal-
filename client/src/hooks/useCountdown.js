import { useEffect, useRef, useState } from 'react';

/**
 * Counts down to zero, used for the "resend code" cooldown.
 *
 * The deadline is stored as a timestamp rather than decremented every tick, so
 * the remaining time stays correct even if the tab is backgrounded and the
 * interval is throttled.
 */
export function useCountdown(initialSeconds = 0) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const deadline = useRef(Date.now() + initialSeconds * 1000);

  useEffect(() => {
    if (remaining <= 0) return undefined;

    const tick = () => {
      const left = Math.ceil((deadline.current - Date.now()) / 1000);
      setRemaining(left > 0 ? left : 0);
    };

    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [remaining]);

  const restart = (seconds) => {
    deadline.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
  };

  return { remaining, isRunning: remaining > 0, restart };
}
