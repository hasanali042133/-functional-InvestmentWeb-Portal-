import { Card } from '@/components/ui/Card.jsx';
import { Skeleton } from '@/components/ui/States.jsx';
import { LiveDot } from '@/components/ui/Live.jsx';
import { formatCurrency, formatPercent } from '@/lib/format.js';
import { cn } from '@/lib/cn.js';

/**
 * The headline figure, with the numbers that explain it grouped underneath.
 *
 * One reading dominates — what the portfolio is worth right now — because that
 * is the question somebody opens the dashboard to answer. Cost, count and
 * spending power are the context for it, so they sit inside the same card at a
 * smaller size rather than competing as four equal tiles.
 */
export function PortfolioHero({ summary, holdingCount = 0, isLoading }) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="mt-3 h-10 w-64" />
        <Skeleton className="mt-6 h-16 w-full" />
      </Card>
    );
  }

  const invested = summary?.totalInvested ?? 0;
  const gain = summary?.totalGain ?? 0;
  const hasInvestments = invested > 0;
  const isUp = gain >= 0;

  const tiles = [
    { label: 'Total invested', value: formatCurrency(invested) },
    {
      label: 'Investments',
      value: summary?.investmentCount ?? 0,
      hint: hasInvestments
        ? `Across ${holdingCount} fund${holdingCount === 1 ? '' : 's'}`
        : 'None yet',
    },
    { label: 'Available to invest', value: formatCurrency(summary?.availableBalance) },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Current portfolio value
          </p>
          {hasInvestments && <LiveDot label="Live prices" />}
        </div>

        <p className="tabular mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
          {formatCurrency(summary?.currentValue)}
        </p>

        {hasInvestments && (
          <p
            className={cn(
              'tabular mt-1.5 flex items-center gap-1.5 text-sm font-semibold',
              isUp ? 'text-gain' : 'text-loss',
            )}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {isUp ? (
                <path d="M12 19V5m0 0-6 6m6-6 6 6" />
              ) : (
                <path d="M12 5v14m0 0 6-6m-6 6-6-6" />
              )}
            </svg>
            {formatCurrency(gain)}
            <span className="text-slate-400">·</span>
            {formatPercent(summary?.gainPct)}
            <span className="font-medium text-slate-500">against what you put in</span>
          </p>
        )}
      </div>

      {/* Hairline dividers rather than gaps, so the three read as one strip of
          context belonging to the figure above them. */}
      <dl className="grid grid-cols-1 gap-px border-t border-slate-200/80 bg-slate-200/70 sm:grid-cols-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="bg-white px-6 py-4">
            <dt className="text-xs font-medium text-slate-500">{tile.label}</dt>
            <dd className="tabular mt-1 text-lg font-bold text-slate-900">{tile.value}</dd>
            {tile.hint && <p className="mt-0.5 text-xs text-slate-500">{tile.hint}</p>}
          </div>
        ))}
      </dl>
    </Card>
  );
}
