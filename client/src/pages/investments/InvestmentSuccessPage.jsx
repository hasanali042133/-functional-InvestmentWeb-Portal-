import { Navigate, useLocation } from 'react-router-dom';
import { Card, CardBody } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { StatusBadge } from '@/components/ui/Badge.jsx';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format.js';

export default function InvestmentSuccessPage() {
  const { state } = useLocation();

  // Reached directly, with no investment to report.
  if (!state?.transaction) return <Navigate to="/portfolio" replace />;

  const { transaction, investment, productName } = state;

  const rows = [
    { label: 'Transaction ID', value: transaction.txnRef, mono: true },
    { label: 'Product', value: productName },
    { label: 'Amount', value: formatCurrency(transaction.amount, { precise: true }) },
    { label: 'Units purchased', value: formatNumber(investment?.units, 4) },
    { label: 'Unit price', value: formatNumber(investment?.navAtPurchase, 4) },
    { label: 'Type', value: 'Investment' },
    { label: 'Date', value: formatDateTime(transaction.createdAt) },
  ];

  return (
    <div className="mx-auto max-w-lg py-6">
      <Card>
        <CardBody className="px-6 py-8">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg
                className="h-8 w-8 text-emerald-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
            </div>

            <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
              Investment successful
            </h1>
            <p className="mt-2 text-slate-600">
              Your investment in {productName} has been recorded.
            </p>
          </div>

          <dl className="mt-8 divide-y divide-slate-100 rounded-lg ring-1 ring-slate-200 ring-inset">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="text-sm text-slate-500">{row.label}</dt>
                <dd
                  className={
                    row.mono
                      ? 'font-mono text-sm font-semibold text-slate-900'
                      : 'tabular text-sm font-semibold text-slate-900'
                  }
                >
                  {row.value}
                </dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-slate-500">Status</dt>
              <dd>
                <StatusBadge status={transaction.status} />
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" fullWidth to="/portfolio">
              View portfolio
            </Button>
            <Button size="lg" variant="secondary" fullWidth to="/products">
              Invest again
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
