import { Card } from '@/components/ui/Card.jsx';
import { Skeleton } from '@/components/ui/States.jsx';
import { formatPercent } from '@/lib/format.js';
import { cn } from '@/lib/cn.js';

const TONES = {
  brand: 'bg-brand-50 text-brand-600',
  accent: 'bg-accent-500/10 text-accent-600',
  gain: 'bg-gain-soft text-gain',
  neutral: 'bg-slate-100 text-slate-500',
};

const VALUE_TONES = {
  gain: 'text-gain',
  loss: 'text-loss',
  default: 'text-slate-900',
};

/** A headline figure, optionally with the change that puts it in context. */
export function StatCard({
  label,
  value,
  changePct,
  hint,
  icon,
  tone = 'neutral',
  valueTone = 'default',
  badge,
  isLoading,
}) {
  const hasChange = changePct !== null && changePct !== undefined;
  const isUp = (changePct ?? 0) >= 0;

  if (isLoading) {
    return (
      <Card className="p-5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="mt-3 h-7 w-32" />
        <Skeleton className="mt-3 h-3.5 w-16" />
      </Card>
    );
  }

  return (
    <Card className="p-5 transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-xs font-medium text-slate-500">{label}</p>

        {icon ? (
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              TONES[tone] ?? TONES.neutral,
            )}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {icon}
            </svg>
          </span>
        ) : null}
      </div>

      <p
        className={cn(
          'tabular mt-1.5 truncate text-xl font-bold sm:text-2xl',
          VALUE_TONES[valueTone] ?? VALUE_TONES.default,
        )}
        title={typeof value === 'string' ? value : undefined}
      >
        {value}
      </p>

      {hasChange && (
        <p
          className={cn(
            'tabular mt-1.5 flex items-center gap-1 text-sm font-semibold',
            isUp ? 'text-gain' : 'text-loss',
          )}
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {isUp ? <path d="M12 19V5m0 0-6 6m6-6 6 6" /> : <path d="M12 5v14m0 0 6-6m-6 6-6-6" />}
          </svg>
          {formatPercent(changePct)}
        </p>
      )}

      {!hasChange && hint && <p className="mt-1.5 text-sm text-slate-500">{hint}</p>}

      {badge ? <div className="mt-2.5">{badge}</div> : null}
    </Card>
  );
}
