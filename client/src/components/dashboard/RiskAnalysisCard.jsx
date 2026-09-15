import { Card, CardBody, CardHeader } from '@/components/ui/Card.jsx';
import { RiskGauge } from '@/components/charts/RiskGauge.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Skeleton, ErrorState } from '@/components/ui/States.jsx';
import { formatNumber, formatPercent } from '@/lib/format.js';
import { cn } from '@/lib/cn.js';

const RISK_LABEL = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' };

const BAR_COLOUR = {
  LOW: 'bg-emerald-400',
  MEDIUM: 'bg-amber-400',
  HIGH: 'bg-rose-400',
};

/**
 * What the alignment actually means to the customer.
 *
 * Carrying more risk than you signed up for is the case worth flagging, so it
 * is the one that gets a warning tone; holding back is a choice, not a problem.
 */
const ALIGNMENT = {
  ALIGNED: {
    tone: 'success',
    label: 'On profile',
    message: (profile) => `Your holdings match the ${RISK_LABEL[profile]} risk profile you chose.`,
  },
  ABOVE: {
    tone: 'warning',
    label: 'Above profile',
    message: (profile) =>
      `Your holdings carry more risk than the ${RISK_LABEL[profile]} profile you chose.`,
  },
  BELOW: {
    tone: 'brand',
    label: 'Below profile',
    message: (profile) =>
      `Your holdings are more cautious than the ${RISK_LABEL[profile]} profile you chose.`,
  },
};

export function RiskAnalysisCard({ risk, isLoading, error, onRetry }) {
  const alignment = risk?.alignment ? ALIGNMENT[risk.alignment] : null;

  return (
    <Card className="min-w-0">
      <CardHeader
        title="Risk analysis"
        description="Your funds weighted by what each is worth today."
        action={
          alignment ? (
            <Badge tone={alignment.tone} className="shrink-0">
              {alignment.label}
            </Badge>
          ) : null
        }
      />

      <CardBody>
        {isLoading && <Skeleton className="mx-auto h-40 w-64" />}

        {!isLoading && error && <ErrorState error={error} onRetry={onRetry} />}

        {!isLoading && !error && risk?.score === null && (
          <p className="py-6 text-center text-sm text-slate-500">
            Invest in a fund and your risk profile will be measured here.
          </p>
        )}

        {!isLoading && !error && risk?.score !== null && risk && (
          <>
            <RiskGauge score={risk.score} level={risk.level} />

            <p className="mt-4 text-center">
              <span className="tabular text-2xl font-bold text-slate-900">
                {formatNumber(risk.score, 2)}
              </span>
              <span className="ml-1 text-sm font-medium text-slate-500">/ 3.00</span>
            </p>

            {alignment && (
              <p className="mt-1.5 text-center text-sm text-slate-600">
                {alignment.message(risk.statedProfile)}
              </p>
            )}

            <dl className="mt-5 space-y-2.5 border-t border-slate-200/80 pt-4">
              {risk.breakdown.map((entry) => (
                <div key={entry.riskLevel} className="flex items-center gap-3">
                  <dt className="w-16 shrink-0 text-xs font-medium text-slate-500">
                    {RISK_LABEL[entry.riskLevel]}
                  </dt>
                  <dd className="flex min-w-0 flex-1 items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn('h-full rounded-full', BAR_COLOUR[entry.riskLevel])}
                        style={{ width: `${entry.sharePct}%` }}
                      />
                    </div>
                    <span className="tabular w-12 shrink-0 text-right text-xs font-semibold text-slate-700">
                      {formatPercent(entry.sharePct, { signed: false, decimals: 1 })}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </CardBody>
    </Card>
  );
}
