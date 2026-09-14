import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card.jsx';
import { RiskBadge } from '@/components/ui/Badge.jsx';
import { formatCurrency, formatPercent } from '@/lib/format.js';

export function ProductCard({ product }) {
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-slate-900">{product.name}</h3>
            <p className="mt-0.5 text-sm text-slate-500">{product.category}</p>
          </div>
          <RiskBadge level={product.riskLevel} />
        </div>

        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
          {product.description}
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-200/80 pt-4">
          <div>
            <dt className="text-xs font-medium text-slate-500">Expected return</dt>
            <dd className="tabular mt-0.5 text-lg font-bold text-gain">
              {formatPercent(product.expectedReturnPct, { signed: false })}
              <span className="ml-1 text-xs font-medium text-slate-500">p.a.</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Minimum</dt>
            <dd className="tabular mt-0.5 text-lg font-bold text-slate-900">
              {formatCurrency(product.minInvestment)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="border-t border-slate-200/80 px-5 py-3.5">
        <Link
          to={`/products/${product.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          View details
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
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </Link>
      </div>
    </Card>
  );
}
