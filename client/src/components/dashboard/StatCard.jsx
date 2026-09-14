import { Card } from '@/components/ui/Card.jsx';
import { Skeleton } from '@/components/ui/States.jsx';
import { formatPercent } from '@/lib/format.js';
import { cn } from '@/lib/cn.js';

/** A headline figure, optionally with the change that puts it in context. */
export function StatCard({ label, value, changePct, hint, isLoading }) {
  const hasChange = changePct !== null && changePct !== undefined;
  const isUp = (changePct ?? 0) >= 0;

  if (isLoading) {
    return (
      <Card className="p-5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="mt-3 h-7 w-32" />
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="tabular mt-1.5 text-2xl font-bold text-slate-900">{value}</p>

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
    </Card>
  );
}
