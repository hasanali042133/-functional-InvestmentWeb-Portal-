import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/Badge.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format.js';
import { cn } from '@/lib/cn.js';

function Row({ label, children, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-sm text-slate-500">{label}</dt>
      <dd
        className={cn(
          'min-w-0 text-right text-sm font-medium text-slate-900',
          mono ? 'font-mono text-xs' : 'tabular',
        )}
      >
        {children}
      </dd>
    </div>
  );
}

/**
 * Everything recorded against one transaction.
 *
 * Worth a panel rather than extra table columns: units and the price they were
 * bought at are what answer "what did this money actually buy?", but they are
 * reference figures people look up occasionally, not something to scan a list
 * by.
 */
export function TransactionDetailDialog({ transaction, onClose }) {
  useEffect(() => {
    if (!transaction) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    // Stop the list behind the panel from scrolling under it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [transaction, onClose]);

  if (!transaction) return null;

  const isInvestment = transaction.type === 'INVESTMENT';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-dialog-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="animate-rise w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-5 py-4">
          <div className="min-w-0">
            <h2 id="transaction-dialog-title" className="text-base font-bold text-slate-900">
              {isInvestment ? 'Investment' : 'Redemption'}
            </h2>
            <p className="mt-0.5 truncate text-sm text-slate-500">{transaction.productName}</p>
          </div>
          <StatusBadge status={transaction.status} />
        </div>

        <div className="px-5 py-5">
          <p className="tabular text-center text-3xl font-bold text-slate-900">
            {formatCurrency(transaction.amount, { precise: true })}
          </p>

          <dl className="mt-5 divide-y divide-slate-100 border-t border-slate-200/80 pt-1">
            <Row label="Reference" mono>
              {transaction.txnRef}
            </Row>

            <Row label="Date">{formatDateTime(transaction.createdAt)}</Row>

            {transaction.units !== null && transaction.units !== undefined && (
              <>
                <Row label="Units received">{formatNumber(transaction.units, 6)}</Row>
                <Row label="Unit price paid">{formatNumber(transaction.navAtPurchase, 4)}</Row>
              </>
            )}

            <Row label="Fund">
              <Link
                to={`/products/${transaction.productId}`}
                className="text-brand-700 hover:text-brand-800 font-semibold"
              >
                {transaction.productName}
              </Link>
            </Row>
          </dl>

          {transaction.units !== null && transaction.units !== undefined && (
            // The arithmetic, spelled out. A customer checking a figure should
            // not have to work out where it came from.
            <p className="mt-4 rounded-lg bg-slate-50 px-3.5 py-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-200/70 ring-inset">
              {formatCurrency(transaction.amount)} ÷{' '}
              {formatNumber(transaction.navAtPurchase, 4)} ={' '}
              {formatNumber(transaction.units, 6)} units. Their value today moves with the
              fund&rsquo;s price.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200/80 px-5 py-4">
          <Button variant="secondary" onClick={onClose} autoFocus>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
