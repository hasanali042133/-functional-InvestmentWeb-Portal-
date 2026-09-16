import { cn } from '@/lib/cn.js';

/**
 * How long the current code is still good for.
 *
 * Driven by the server's own `expiresAt` rather than a duration counted down on
 * the client, so a slow page load or a backgrounded tab cannot leave the ring
 * claiming time the code does not actually have.
 *
 * The ring turns amber inside the last ten seconds — the point at which it is
 * worth waiting for a new code rather than starting to type.
 */
export function CountdownRing({ remaining, total, size = 56 }) {
  const safeTotal = total > 0 ? total : 1;
  const progress = Math.min(1, Math.max(0, remaining / safeTotal));

  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const isExpired = remaining <= 0;
  const isUrgent = !isExpired && remaining <= 10;

  const colour = isExpired
    ? 'var(--color-loss)'
    : isUrgent
      ? '#d97706'
      : 'var(--color-brand-600)';

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="timer"
      aria-live="off"
      aria-label={
        isExpired ? 'Code has expired' : `Code expires in ${remaining} seconds`
      }
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-slate-200)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colour}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          // Only the sweep animates. Colour changes are a state change, not a
          // motion, so they land immediately.
          style={{ transition: 'stroke-dashoffset 0.5s linear' }}
        />
      </svg>

      <span
        className={cn(
          'tabular absolute inset-0 flex items-center justify-center text-sm font-bold',
          isExpired ? 'text-loss' : isUrgent ? 'text-amber-600' : 'text-slate-900',
        )}
      >
        {isExpired ? '0' : remaining}
      </span>
    </div>
  );
}
