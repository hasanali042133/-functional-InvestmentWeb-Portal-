import { cn } from '@/lib/cn.js';
import { Button } from './Button.jsx';
import { Alert } from './Alert.jsx';

/** Placeholder block shown while content loads, sized like the content it replaces. */
export function Skeleton({ className }) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-md bg-slate-200/70', className)}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/60 to-transparent"
        style={{ animation: 'shimmer 1.6s infinite' }}
      />
    </div>
  );
}

/** Shown when a list is legitimately empty — not an error, just nothing yet. */
export function EmptyState({ title, description, action, icon }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="bg-brand-50 text-brand-500 ring-brand-100 mb-4 flex h-14 w-14 items-center justify-center rounded-full ring-8">
        {icon ?? (
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 7h18M3 12h18M3 17h10" />
          </svg>
        )}
      </div>
      <p className="text-base font-semibold text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Shown when a request failed, with a way to try again. */
export function ErrorState({ error, onRetry }) {
  return (
    <div className="p-5">
      <Alert variant="error" title="Could not load this section">
        {error?.message ?? 'Something went wrong.'}
        {onRetry && (
          <div className="mt-3">
            <Button size="sm" variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          </div>
        )}
      </Alert>
    </div>
  );
}
