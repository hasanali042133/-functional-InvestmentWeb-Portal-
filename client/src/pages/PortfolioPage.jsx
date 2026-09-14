import { Link } from 'react-router-dom';
import * as investmentsApi from '@/api/investments.api.js';
import { useApi } from '@/hooks/useApi.js';
import { PageHeader } from '@/components/layout/PageHeader.jsx';
import { Card, CardBody, CardHeader } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { RiskBadge } from '@/components/ui/Badge.jsx';
import { StatCard } from '@/components/dashboard/StatCard.jsx';
import { DistributionChart } from '@/components/charts/DistributionChart.jsx';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States.jsx';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format.js';
import { cn } from '@/lib/cn.js';

function HoldingsTable({ holdings }) {
  return (
    <>
      <div className="hidden sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500">
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 text-right font-medium">Units</th>
              <th className="px-5 py-3 text-right font-medium">Invested</th>
              <th className="px-5 py-3 text-right font-medium">Current value</th>
              <th className="px-5 py-3 text-right font-medium">Gain / loss</th>
              <th className="px-5 py-3 text-right font-medium">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {holdings.map((holding) => (
              <tr key={holding.productId} className="hover:bg-slate-50/70">
                <td className="px-5 py-3.5">
                  <Link
                    to={`/products/${holding.productId}`}
                    className="font-medium text-slate-900 hover:text-brand-700"
                  >
                    {holding.productName}
                  </Link>
                  <div className="mt-1">
                    <RiskBadge level={holding.riskLevel} />
                  </div>
                </td>
                <td className="tabular px-5 py-3.5 text-right text-slate-600">
                  {formatNumber(holding.units, 4)}
                </td>
                <td className="tabular px-5 py-3.5 text-right text-slate-600">
                  {formatCurrency(holding.invested)}
                </td>
                <td className="tabular px-5 py-3.5 text-right font-semibold text-slate-900">
                  {formatCurrency(holding.currentValue)}
                </td>
                <td
                  className={cn(
                    'tabular px-5 py-3.5 text-right font-semibold',
                    holding.gain >= 0 ? 'text-gain' : 'text-loss',
                  )}
                >
                  {formatCurrency(holding.gain)}
                  <span className="ml-1.5 text-xs font-medium">
                    {formatPercent(holding.gainPct)}
                  </span>
                </td>
                <td className="tabular px-5 py-3.5 text-right text-slate-600">
                  {formatPercent(holding.sharePct, { signed: false, decimals: 1 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-slate-100 sm:hidden">
        {holdings.map((holding) => (
          <li key={holding.productId} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  to={`/products/${holding.productId}`}
                  className="font-medium text-slate-900 hover:text-brand-700"
                >
                  {holding.productName}
                </Link>
                <p className="tabular mt-1 text-xs text-slate-500">
                  {formatNumber(holding.units, 4)} units ·{' '}
                  {formatPercent(holding.sharePct, { signed: false, decimals: 1 })} of portfolio
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="tabular font-semibold text-slate-900">
                  {formatCurrency(holding.currentValue)}
                </p>
                <p
                  className={cn(
                    'tabular text-xs font-semibold',
                    holding.gain >= 0 ? 'text-gain' : 'text-loss',
                  )}
                >
                  {formatCurrency(holding.gain)} ({formatPercent(holding.gainPct)})
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function PortfolioPage() {
  const { data, error, isLoading, refetch } = useApi(
    () => investmentsApi.getPortfolioSummary(),
    [],
  );

  const holdings = data?.holdings ?? [];

  return (
    <>
      <PageHeader
        title="Your portfolio"
        description="What you hold, what it cost, and what it is worth today."
        action={
          holdings.length > 0 && (
            <Button to="/products" variant="secondary">
              Invest more
            </Button>
          )
        }
      />

      {isLoading && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <StatCard key={index} isLoading />
            ))}
          </div>
          <Card className="mt-6 p-5">
            <Skeleton className="h-64 w-full" />
          </Card>
        </>
      )}

      {!isLoading && error && (
        <Card>
          <ErrorState error={error} onRetry={refetch} />
        </Card>
      )}

      {!isLoading && !error && holdings.length === 0 && (
        <Card>
          <EmptyState
            title="You have not invested yet"
            description="Once you invest in a fund, your holdings and their performance will appear here."
            action={<Button to="/products">Browse funds</Button>}
          />
        </Card>
      )}

      {!isLoading && !error && holdings.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total invested" value={formatCurrency(data.totalInvested)} />
            <StatCard
              label="Current value"
              value={formatCurrency(data.currentValue)}
              changePct={data.gainPct}
            />
            <StatCard
              label="Total gain"
              value={formatCurrency(data.totalGain)}
              hint="Since your first investment"
            />
            <StatCard
              label="Available to invest"
              value={formatCurrency(data.availableBalance)}
              hint={`${data.investmentCount} investment${data.investmentCount === 1 ? '' : 's'}`}
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader title="Your holdings" />
              <HoldingsTable holdings={holdings} />
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader
                title="Distribution"
                description="Share of your portfolio by fund"
              />
              <CardBody>
                <DistributionChart holdings={holdings} />
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
