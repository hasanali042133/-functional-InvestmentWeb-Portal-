import { Link, useParams } from 'react-router-dom';
import { useApi } from '@/hooks/useApi.js';
import { useAccountStatus } from '@/hooks/useAccountStatus.js';
import * as productsApi from '@/api/products.api.js';
import { Card, CardBody, CardHeader } from '@/components/ui/Card.jsx';
import { RiskBadge } from '@/components/ui/Badge.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Alert } from '@/components/ui/Alert.jsx';
import { Skeleton, ErrorState } from '@/components/ui/States.jsx';
import { NavChart } from '@/components/charts/NavChart.jsx';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format.js';
import { cn } from '@/lib/cn.js';

function Stat({ label, value, tone = 'default' }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd
        className={cn(
          'tabular mt-1 text-lg font-bold',
          tone === 'gain' && 'text-gain',
          tone === 'loss' && 'text-loss',
          tone === 'default' && 'text-slate-900',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Card>
        <div className="p-5">
          <Skeleton className="h-72 w-full" />
        </div>
      </Card>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const { data, error, isLoading, refetch } = useApi(() => productsApi.getProduct(id), [id]);
  const account = useAccountStatus();
  const product = data?.product;

  if (isLoading) return <DetailSkeleton />;

  if (error) {
    return (
      <Card>
        <ErrorState error={error} onRetry={refetch} />
        <div className="px-5 pb-5">
          <Button variant="secondary" to="/products">
            Back to products
          </Button>
        </div>
      </Card>
    );
  }

  const performance = product.performance ?? {};
  const isUp = (performance.changePct ?? 0) >= 0;

  return (
    <>
      <Link
        to="/products"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 12H5m6 6-6-6 6-6" />
        </svg>
        All products
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{product.name}</h1>
            <RiskBadge level={product.riskLevel} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {product.category} · Unit price{' '}
            <span className="tabular font-semibold text-slate-900">
              {formatNumber(product.currentNav, 4)}
            </span>
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs font-medium text-slate-500">
            Last {performance.periodDays ?? 0} days
          </p>
          <p className={cn('tabular text-2xl font-bold', isUp ? 'text-gain' : 'text-loss')}>
            {formatPercent(performance.changePct)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Price history"
              description="Daily net asset value per unit, from this fund's own record."
            />
            <CardBody className="pl-2">
              <NavChart data={product.navHistory} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="About this fund" />
            <CardBody>
              <p className="text-sm leading-relaxed text-slate-700">{product.description}</p>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Performance" />
            <CardBody>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
                <Stat
                  label="7 days"
                  value={formatPercent(performance.changePct7d)}
                  tone={(performance.changePct7d ?? 0) >= 0 ? 'gain' : 'loss'}
                />
                <Stat
                  label="30 days"
                  value={formatPercent(performance.changePct30d)}
                  tone={(performance.changePct30d ?? 0) >= 0 ? 'gain' : 'loss'}
                />
                <Stat label="Period high" value={formatNumber(performance.highestNav, 2)} />
                <Stat label="Period low" value={formatNumber(performance.lowestNav, 2)} />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Key facts" />
            <CardBody>
              <dl className="space-y-5">
                <Stat
                  label="Expected return"
                  value={`${formatPercent(product.expectedReturnPct, { signed: false })} p.a.`}
                  tone="gain"
                />
                <Stat
                  label="Minimum investment"
                  value={formatCurrency(product.minInvestment)}
                />
                <Stat label="Risk level" value={product.riskLevel.toLowerCase()} />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-4">
              {account.isApproved ? (
                <Button size="lg" fullWidth to={`/products/${product.id}/invest`}>
                  Invest in this fund
                </Button>
              ) : (
                <>
                  <Button size="lg" fullWidth disabled>
                    Invest in this fund
                  </Button>
                  <Alert variant="info">
                    Investing opens once your account opening application has been approved.
                    <div className="mt-3">
                      <Button size="sm" variant="secondary" to="/account/opening">
                        {account.status === 'DRAFT'
                          ? 'Continue account opening'
                          : 'Open your account'}
                      </Button>
                    </div>
                  </Alert>
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <p className="mt-8 text-xs leading-relaxed text-slate-500">
        Past performance is not a reliable indicator of future results. The value of investments can
        fall as well as rise.
      </p>
    </>
  );
}
