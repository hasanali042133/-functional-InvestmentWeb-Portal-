import { useState } from 'react';
import { StatusBadge } from '@/components/ui/Badge.jsx';
import { EmptyState } from '@/components/ui/States.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { TransactionDetailDialog } from './TransactionDetailDialog.jsx';
import { formatCurrency, formatDate } from '@/lib/format.js';

/**
 * Transaction history.
 *
 * Below `sm` the table becomes a stack of cards rather than a grid squeezed
 * sideways — a five-column table on a 375px screen is unreadable, and horizontal
 * scrolling hides the amount, which is the column people look at.
 *
 * Every row opens the transaction's full record. The row is the target for a
 * pointer, and one cell is a real button so the same thing is reachable by
 * keyboard; that button stops its click propagating, so pressing it does not
 * also fire the row underneath it.
 */
export function TransactionsTable({ transactions = [], showReference = true, emptyAction }) {
  const [selected, setSelected] = useState(null);

  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions yet"
        description="Once you make your first investment it will appear here."
        action={emptyAction ?? <Button to="/products">Browse funds</Button>}
      />
    );
  }

  const openFrom = (transaction) => (event) => {
    event.stopPropagation();
    setSelected(transaction);
  };

  const triggerClasses =
    'hover:text-brand-700 focus-visible:outline-brand-600 rounded text-left focus-visible:outline-2 focus-visible:outline-offset-2';

  return (
    <>
      {/* Scrolls inside its own card rather than widening the page. */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60 text-xs tracking-wide text-slate-500 uppercase">
              {showReference && (
                <th className="px-4 py-3 font-medium whitespace-nowrap">Transaction ID</th>
              )}
              <th className="px-4 py-3 font-medium whitespace-nowrap">Date</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Product</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Type</th>
              <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Amount</th>
              <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                onClick={() => setSelected(transaction)}
                className="cursor-pointer transition-colors duration-150 hover:bg-brand-50/40"
              >
                {showReference && (
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold whitespace-nowrap text-slate-700">
                    <button
                      type="button"
                      onClick={openFrom(transaction)}
                      className={triggerClasses}
                      aria-label={`Details for transaction ${transaction.txnRef}`}
                    >
                      {transaction.txnRef}
                    </button>
                  </td>
                )}
                <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                  {formatDate(transaction.createdAt)}
                </td>
                <td className="px-4 py-3.5 font-medium whitespace-nowrap text-slate-900">
                  {showReference ? (
                    transaction.productName
                  ) : (
                    // Without the reference column this is the only cell left to
                    // carry the keyboard target.
                    <button
                      type="button"
                      onClick={openFrom(transaction)}
                      className={triggerClasses}
                      aria-label={`Details for transaction ${transaction.txnRef}`}
                    >
                      {transaction.productName}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                  {transaction.type === 'INVESTMENT' ? 'Investment' : 'Redemption'}
                </td>
                <td className="tabular px-4 py-3.5 text-right font-semibold whitespace-nowrap text-slate-900">
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <StatusBadge status={transaction.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-slate-100 sm:hidden">
        {transactions.map((transaction) => (
          <li key={transaction.id}>
            {/* One button for the whole card: on a phone the entire row is the
                target, and there is nothing else on it to press. */}
            <button
              type="button"
              onClick={() => setSelected(transaction)}
              className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-brand-50/40"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{transaction.productName}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDate(transaction.createdAt)} ·{' '}
                  {transaction.type === 'INVESTMENT' ? 'Investment' : 'Redemption'}
                </p>
                {showReference && (
                  <p className="mt-1 font-mono text-xs text-slate-400">{transaction.txnRef}</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="tabular font-semibold text-slate-900">
                  {formatCurrency(transaction.amount)}
                </p>
                <div className="mt-1.5">
                  <StatusBadge status={transaction.status} />
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <TransactionDetailDialog transaction={selected} onClose={() => setSelected(null)} />
    </>
  );
}
