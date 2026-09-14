import { cn } from '@/lib/cn.js';

const VARIANTS = {
  error: {
    wrapper: 'bg-rose-50 text-rose-900 ring-rose-200',
    icon: 'text-rose-600',
    path: 'M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z',
  },
  success: {
    wrapper: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
    icon: 'text-emerald-600',
    path: 'm9 12 2 2 4-4m7 -1a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
  info: {
    wrapper: 'bg-brand-50 text-brand-950 ring-brand-200',
    icon: 'text-brand-600',
    path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
  warning: {
    wrapper: 'bg-amber-50 text-amber-900 ring-amber-200',
    icon: 'text-amber-600',
    path: 'M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z',
  },
};

/**
 * Inline feedback. Errors announce themselves to screen readers via
 * `role="alert"`; quieter variants do not interrupt.
 */
export function Alert({ variant = 'info', title, children, className, action }) {
  const style = VARIANTS[variant] ?? VARIANTS.info;

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-lg px-4 py-3 text-sm ring-1 ring-inset', style.wrapper, className)}
    >
      <svg
        className={cn('mt-0.5 h-5 w-5 shrink-0', style.icon)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={style.path} />
      </svg>
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5')}>{children}</div>}
      </div>
      {action}
    </div>
  );
}
