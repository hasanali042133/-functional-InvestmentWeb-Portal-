import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card.jsx';
import { RiskBadge } from '@/components/ui/Badge.jsx';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format.js';

// The stripe repeats the risk badge as colour alone, so a column of cards can
// be scanned as a risk ladder without reading a word.
const RISK_STRIPE = {
  LOW: 'bg-emerald-400',
  MEDIUM: 'bg-amber-400',
  HIGH: 'bg-rose-400',
};

export function ProductCard({ product }) {
  return (
    <Card className="card-lift group relative flex h-full flex-col overflow-hidden">
      <span
        aria-hidden="true"
        className={`h-1 w-full ${RISK_STRIPE[product.riskLevel] ?? 'bg-slate-300'}`}
      />

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

        <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-200/80 pt-4">
          <div>
            <dt className="text-xs font-medium text-slate-500">Unit price</dt>
            <dd className="tabular mt-0.5 text-base font-bold text-slate-900">
              {formatNumber(product.currentNav, 4)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Return</dt>
            <dd className="tabular text-gain mt-0.5 text-base font-bold">
              {formatPercent(product.expectedReturnPct, { signed: false })}
              <span className="ml-1 text-xs font-medium text-slate-500">p.a.</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Minimum</dt>
            <dd className="tabular mt-0.5 text-base font-bold text-slate-900">
              {formatCurrency(product.minInvestment)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="border-t border-slate-200/80 px-5 py-3.5">
        {/*
          The link is stretched over the whole card, so anywhere on it is
          clickable while the accessible name stays on this one control rather
          than being duplicated across the card.
        */}
        <Link
          to={`/products/${product.id}`}
          className="text-brand-700 group-hover:text-brand-800 inline-flex items-center gap-1.5 text-sm font-semibold after:absolute after:inset-0 after:content-['']"
        >
          View details
          <svg
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
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
