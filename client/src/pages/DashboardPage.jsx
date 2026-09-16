import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.js';
import { useApi } from '@/hooks/useApi.js';
import { cn } from '@/lib/cn.js';
import { LIVE_POLL_MS } from '@/lib/live.js';
import { LiveDot } from '@/components/ui/Live.jsx';
import { useAccountStatus } from '@/hooks/useAccountStatus.js';
import * as productsApi from '@/api/products.api.js';
import * as investmentsApi from '@/api/investments.api.js';
import { Card, CardBody, CardHeader } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { PortfolioHero } from '@/components/dashboard/PortfolioHero.jsx';
import { AccountStatusCard } from '@/components/dashboard/AccountStatusCard.jsx';
import { TransactionsTable } from '@/components/dashboard/TransactionsTable.jsx';
import { PortfolioValueChart } from '@/components/charts/PortfolioValueChart.jsx';
import { DistributionChart } from '@/components/charts/DistributionChart.jsx';
import { ProductCard } from '@/components/products/ProductCard.jsx';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States.jsx';

/** Signed in, account not yet approved — onboarding plus a look at the funds. */
function OnboardingDashboard({ status }) {
  const { data, error, isLoading, refetch } = useApi(() => productsApi.listProducts(), [], {
    pollMs: LIVE_POLL_MS,
  });
  const products = data?.products ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <AccountStatusCard status={status} />
      </div>

      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader
            title="Explore the funds"
            description="Browse what you can invest in once your account is approved."
            action={
              <Link to="/products" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                View all
              </Link>
            }
          />
          <CardBody>
            {isLoading && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Skeleton className="h-56" />
                <Skeleton className="h-56" />
              </div>
            )}
            {!isLoading && error && <ErrorState error={error} onRetry={refetch} />}
            {!isLoading && !error && (
              <div className="grid gap-5 sm:grid-cols-2">
                {products.slice(0, 2).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

/** Approved account — the real dashboard. */
function InvestorDashboard({ status }) {
  const pollLive = { pollMs: LIVE_POLL_MS };
  const portfolio = useApi(() => investmentsApi.getPortfolioSummary(), [], pollLive);
  const performance = useApi(() => investmentsApi.getPortfolioPerformance(), [], pollLive);
  const transactions = useApi(() => investmentsApi.listTransactions({ page: 1, limit: 5 }), []);

  const summary = portfolio.data;
  const holdings = summary?.holdings ?? [];
  const series = performance.data?.series ?? [];
  const granularity = performance.data?.granularity ?? 'daily';
  const [chartMode, setChartMode] = useState('value');
  const recent = transactions.data?.transactions ?? [];

  const hasInvestments = holdings.length > 0;

  return (
    <div className="space-y-6">
      <AccountStatusCard status={status} />

      <PortfolioHero
        summary={summary}
        holdingCount={holdings.length}
        isLoading={portfolio.isLoading}
      />

      {portfolio.error && (
        <Card>
          <ErrorState error={portfolio.error} onRetry={portfolio.refetch} />
        </Card>
      )}

      {!portfolio.isLoading && !portfolio.error && !hasInvestments && (
        <Card>
          <EmptyState
            title="Make your first investment"
            description="Your portfolio value, distribution and transaction history will appear here once you invest."
            action={<Button to="/products">Browse funds</Button>}
          />
        </Card>
      )}

      {hasInvestments && (
        <>
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="min-w-0 lg:col-span-3">
              <CardHeader
                title="Portfolio performance"
                description={
                  chartMode === 'return'
                    ? 'Gain against what you put in. Paying money in does not move this line.'
                    : granularity === 'intraday'
                      ? 'Valued at every price published since you invested.'
                      : 'Value of your holdings against what you put in.'
                }
                action={
                  <div className="flex shrink-0 items-center gap-3">
                    {granularity === 'intraday' && <LiveDot />}
                    <div
                      className="flex rounded-lg bg-slate-100 p-0.5"
                      role="group"
                      aria-label="Chart reading"
                    >
                      {[
                        { key: 'value', label: 'Value' },
                        { key: 'return', label: 'Return' },
                      ].map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          aria-pressed={chartMode === option.key}
                          onClick={() => setChartMode(option.key)}
                          className={cn(
                            'rounded-md px-2.5 py-1 text-xs font-medium transition',
                            chartMode === option.key
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700',
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                }
              />
              <CardBody className="pl-2">
                {performance.isLoading && <Skeleton className="h-72 w-full" />}
                {performance.error && (
                  <ErrorState error={performance.error} onRetry={performance.refetch} />
                )}
                {!performance.isLoading && !performance.error && (
                  <PortfolioValueChart data={series} granularity={granularity} mode={chartMode} />
                )}
              </CardBody>
            </Card>

            <Card className="min-w-0 lg:col-span-2">
              <CardHeader
                title="Investment distribution"
                description="Share of your portfolio by fund."
              />
              <CardBody>
                <DistributionChart holdings={holdings} />
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Recent transactions"
              action={
                <Link
                  to="/transactions"
                  className="text-sm font-semibold text-brand-700 hover:text-brand-800"
                >
                  View all
                </Link>
              }
            />
            {transactions.isLoading && (
              <div className="space-y-3 p-5">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            )}
            {transactions.error && (
              <ErrorState error={transactions.error} onRetry={transactions.refetch} />
            )}
            {!transactions.isLoading && !transactions.error && (
              <TransactionsTable transactions={recent} />
            )}
          </Card>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const account = useAccountStatus();

  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {account.isApproved
            ? 'Here is how your investments are doing.'
            : 'Finish opening your account to start investing.'}
        </p>
      </div>

      {account.isLoading && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-1" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      )}

      {!account.isLoading && account.error && (
        <Card>
          <ErrorState error={account.error} onRetry={account.refetch} />
        </Card>
      )}

      {!account.isLoading &&
        !account.error &&
        (account.isApproved ? (
          <InvestorDashboard status={account.status} />
        ) : (
          <OnboardingDashboard status={account.status} />
        ))}
    </>
  );
}
