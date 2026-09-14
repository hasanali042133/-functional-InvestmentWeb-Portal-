import { StatusBadge } from '@/components/ui/Badge.jsx';
import { EmptyState } from '@/components/ui/States.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { formatCurrency, formatDate } from '@/lib/format.js';

/**
 * Transaction history.
 *
 * Below `sm` the table becomes a stack of cards rather than a grid squeezed
 * sideways — a five-column table on a 375px screen is unreadable, and horizontal
 * scrolling hides the amount, which is the column people look at.
 */
export function TransactionsTable({ transactions = [], showReference = true, emptyAction }) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions yet"
        description="Once you make your first investment it will appear here."
        action={emptyAction ?? <Button to="/products">Browse funds</Button>}
      />
    );
  }

  return (
    <>
      <div className="hidden sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500">
              {showReference && <th className="px-5 py-3 font-medium">Transaction ID</th>}
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 text-right font-medium">Amount</th>
              <th className="px-5 py-3 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-slate-50/70">
                {showReference && (
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-700">
                    {transaction.txnRef}
                  </td>
                )}
                <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">
                  {formatDate(transaction.createdAt)}
                </td>
                <td className="px-5 py-3.5 font-medium text-slate-900">
                  {transaction.productName}
                </td>
                <td className="px-5 py-3.5 text-slate-600">
                  {transaction.type === 'INVESTMENT' ? 'Investment' : 'Redemption'}
                </td>
                <td className="tabular px-5 py-3.5 text-right font-semibold text-slate-900">
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <StatusBadge status={transaction.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-slate-100 sm:hidden">
        {transactions.map((transaction) => (
          <li key={transaction.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
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
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
