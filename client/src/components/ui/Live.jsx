import { useEffect, useState } from 'react';
import { formatNumber } from '@/lib/format.js';
import { cn } from '@/lib/cn.js';

/** Pulsing dot that marks a figure as refreshing on its own. */
export function LiveDot({ label = 'Live', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium text-slate-500',
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="live-dot absolute inline-flex h-full w-full rounded-full bg-accent-500" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-600" />
      </span>
      {label}
    </span>
  );
}

/**
 * A number that reacts when it changes: an arrow for the direction and a brief
 * tint behind it.
 *
 * The previous value is tracked in state and compared during render rather than
 * in an effect, so the flash is painted in the same pass that shows the new
 * number instead of one frame later.
 */
export function LivePrice({ value, decimals = 4, className }) {
  const [previous, setPrevious] = useState(value);
  const [direction, setDirection] = useState(null);

  if (value !== previous) {
    setDirection(value > previous ? 'up' : 'down');
    setPrevious(value);
  }

  // Clearing the tint is a timer, which is exactly what an effect is for.
  useEffect(() => {
    if (!direction) return undefined;
    const id = setTimeout(() => setDirection(null), 1100);
    return () => clearTimeout(id);
  }, [direction, value]);

  const isUp = direction === 'up';

  return (
    <span
      className={cn(
        'tabular inline-flex items-center gap-1 rounded px-1 transition-colors',
        direction === 'up' && 'flash-gain text-gain',
        direction === 'down' && 'flash-loss text-loss',
        className,
      )}
    >
      {formatNumber(value, decimals)}
      {direction ? (
        <span aria-hidden="true" className="text-[0.7em] leading-none">
          {isUp ? '▲' : '▼'}
        </span>
      ) : null}
      {direction ? (
        <span className="sr-only">{isUp ? 'price rose' : 'price fell'}</span>
      ) : null}
    </span>
  );
}
