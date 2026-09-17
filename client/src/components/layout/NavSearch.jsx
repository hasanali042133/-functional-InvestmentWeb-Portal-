import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as productsApi from '@/api/products.api.js';
import { useApi } from '@/hooks/useApi.js';
import { formatNumber } from '@/lib/format.js';
import { cn } from '@/lib/cn.js';
import { Spinner } from '@/components/ui/Spinner.jsx';

const RISK_LABEL = { LOW: 'Low risk', MEDIUM: 'Medium risk', HIGH: 'High risk' };

const RISK_DOT = {
  LOW: 'bg-emerald-400',
  MEDIUM: 'bg-amber-400',
  HIGH: 'bg-rose-400',
};

/**
 * Finds a fund from anywhere in the app.
 *
 * Matches the name and the category, so "equity" reaches the Growth Fund and
 * "money" reaches the Money Market Fund — people look for what a fund *is* at
 * least as often as what it is called.
 *
 * The list is fetched once when the shell mounts and filtered in the browser.
 * With a catalogue this size a round trip per keystroke would cost more than it
 * could possibly save.
 */
export function NavSearch({ className }) {
  const navigate = useNavigate();
  const { data, isLoading } = useApi(() => productsApi.listProducts(), []);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef(null);

  const products = data?.products ?? [];

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];

    return products
      .filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          product.category.toLowerCase().includes(term),
      )
      .slice(0, 6);
  }, [products, query]);

  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isOpen]);

  const open = (product) => {
    setQuery('');
    setIsOpen(false);
    navigate(`/products/${product.id}`);
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (!matches.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted((index) => (index + 1) % matches.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((index) => (index - 1 + matches.length) % matches.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      open(matches[highlighted]);
    }
  };

  const showResults = isOpen && query.trim().length > 0;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <span
        className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-slate-400"
        aria-hidden="true"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </span>

      <input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search funds or categories"
        aria-label="Search funds"
        role="combobox"
        aria-expanded={showResults}
        aria-controls="nav-search-results"
        aria-autocomplete="list"
        className="h-10 w-full rounded-full bg-slate-100 pr-4 pl-10 text-sm text-slate-900 ring-1 ring-slate-200/70 ring-inset placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-600 focus:outline-none"
      />

      {showResults && (
        <ul
          id="nav-search-results"
          role="listbox"
          className="animate-drop absolute z-40 mt-2 w-full overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-slate-200"
        >
          {isLoading ? (
            /* Until the catalogue arrives nothing can match, and saying so
               would be a lie about the funds rather than the truth about the
               request. */
            <li className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-500">
              <Spinner size="sm" className="text-brand-700" />
              Loading funds…
            </li>
          ) : matches.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-500">
              Nothing matches “{query.trim()}”.
            </li>
          ) : (
            matches.map((product, index) => (
              <li key={product.id} role="option" aria-selected={index === highlighted}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => open(product)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    index === highlighted ? 'bg-brand-50' : 'hover:bg-slate-50',
                  )}
                >
                  <span
                    className={cn('h-2 w-2 shrink-0 rounded-full', RISK_DOT[product.riskLevel])}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">
                      {product.name}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {product.category} · {RISK_LABEL[product.riskLevel]}
                    </span>
                  </span>
                  <span className="tabular shrink-0 text-xs font-semibold text-slate-600">
                    {formatNumber(product.currentNav, 4)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
