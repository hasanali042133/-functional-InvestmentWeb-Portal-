import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as productsApi from '@/api/products.api.js';
import * as investmentsApi from '@/api/investments.api.js';
import { useApi } from '@/hooks/useApi.js';
import { LIVE_POLL_MS } from '@/lib/live.js';
import { investmentAmountSchema } from '@/lib/accountValidators.js';
import { Card, CardBody, CardHeader } from '@/components/ui/Card.jsx';
import { CurrencyInput } from '@/components/ui/Field.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Alert } from '@/components/ui/Alert.jsx';
import { RiskBadge } from '@/components/ui/Badge.jsx';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog.jsx';
import { LoadingSection } from '@/components/ui/Spinner.jsx';
import { ErrorState } from '@/components/ui/States.jsx';
import { formatCurrency, formatNumber } from '@/lib/format.js';

const QUICK_AMOUNTS = [25000, 50000, 100000, 250000];

export default function InvestPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // The price is live, so the quote on screen keeps up with it rather than
  // going stale while the customer is deciding how much to invest.
  const product = useApi(() => productsApi.getProduct(id), [id], { pollMs: LIVE_POLL_MS });
  const portfolio = useApi(() => investmentsApi.getPortfolioSummary(), [], {
    pollMs: LIVE_POLL_MS,
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fund = product.data?.product;
  const availableBalance = portfolio.data?.availableBalance ?? 0;

  const schema = useMemo(
    () =>
      investmentAmountSchema({
        minInvestment: fund?.minInvestment ?? 0,
        availableBalance,
      }),
    [fund?.minInvestment, availableBalance],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), mode: 'onTouched', defaultValues: { amount: '' } });

  const amount = Number(watch('amount')) || 0;

  if (product.isLoading || portfolio.isLoading) {
    return (
      <Card>
        <LoadingSection label="Loading fund details" />
      </Card>
    );
  }

  if (product.error || portfolio.error) {
    return (
      <Card>
        <ErrorState
          error={product.error ?? portfolio.error}
          onRetry={() => {
            product.refetch();
            portfolio.refetch();
          }}
        />
      </Card>
    );
  }

  const estimatedUnits = amount > 0 ? amount / fund.currentNav : 0;

  const onValid = (values) => {
    setPendingAmount(Number(values.amount));
    setSubmitError(null);
    setConfirmOpen(true);
  };

  const confirmInvestment = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const data = await investmentsApi.createInvestment({
        productId: fund.id,
        amount: pendingAmount,
      });

      navigate('/investments/success', {
        replace: true,
        state: {
          transaction: data.transaction,
          investment: data.investment,
          productName: fund.name,
        },
      });
    } catch (error) {
      setSubmitError(error.message);
      setConfirmOpen(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to={`/products/${fund.id}`}
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
        Back to {fund.name}
      </Link>

      <Card>
        <CardHeader
          title={`Invest in ${fund.name}`}
          description={`${fund.category} · Unit price ${formatNumber(fund.currentNav, 4)}`}
          action={<RiskBadge level={fund.riskLevel} />}
        />

        <form onSubmit={handleSubmit(onValid)} noValidate>
          <CardBody className="space-y-6">
            {submitError && <Alert variant="error">{submitError}</Alert>}

            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 ring-1 ring-slate-200 ring-inset">
              <span className="text-sm text-slate-600">Available to invest</span>
              <span className="tabular text-sm font-bold text-slate-900">
                {formatCurrency(availableBalance)}
              </span>
            </div>

            <div>
              <CurrencyInput
                label="How much would you like to invest?"
                required
                min={fund.minInvestment}
                step={1000}
                placeholder="Enter amount"
                hint={`Minimum ${formatCurrency(fund.minInvestment)}`}
                error={errors.amount?.message}
                {...register('amount')}
              />

              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_AMOUNTS.filter(
                  (value) => value >= fund.minInvestment && value <= availableBalance,
                ).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setValue('amount', value, { shouldValidate: true, shouldTouch: true })
                    }
                    className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-300 ring-inset hover:bg-slate-50"
                  >
                    {formatCurrency(value)}
                  </button>
                ))}
              </div>
            </div>

            {amount > 0 && !errors.amount && (
              <dl className="space-y-2.5 rounded-lg bg-brand-50/60 px-4 py-3.5 ring-1 ring-brand-100 ring-inset">
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-600">Investment amount</dt>
                  <dd className="tabular font-semibold text-slate-900">
                    {formatCurrency(amount, { precise: true })}
                  </dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-600">Unit price today</dt>
                  <dd className="tabular font-semibold text-slate-900">
                    {formatNumber(fund.currentNav, 4)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-brand-200/70 pt-2.5 text-sm">
                  <dt className="text-slate-600">Units you will receive</dt>
                  <dd className="tabular font-bold text-brand-800">
                    {formatNumber(estimatedUnits, 4)}
                  </dd>
                </div>
              </dl>
            )}

            <p className="text-xs leading-relaxed text-slate-500">
              The final number of units depends on the unit price at the time your order is
              processed. Investments can fall as well as rise in value.
            </p>
          </CardBody>

          <div className="border-t border-slate-200/80 px-5 py-4">
            <Button type="submit" size="lg" fullWidth disabled={!amount}>
              Review investment
            </Button>
          </div>
        </form>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm your investment"
        confirmLabel="Yes, invest now"
        cancelLabel="Go back"
        isBusy={isSubmitting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmInvestment}
      >
        <p>
          You are about to invest{' '}
          <span className="font-bold text-slate-900">{formatCurrency(pendingAmount)}</span> in{' '}
          <span className="font-bold text-slate-900">{fund.name}</span>.
        </p>
        <p className="mt-3">
          That buys approximately{' '}
          <span className="tabular font-semibold text-slate-900">
            {formatNumber((pendingAmount ?? 0) / fund.currentNav, 4)}
          </span>{' '}
          units at today's price of {formatNumber(fund.currentNav, 4)}.
        </p>
      </ConfirmDialog>
    </div>
  );
}
