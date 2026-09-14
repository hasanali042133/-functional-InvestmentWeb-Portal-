import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn.js';
import { Spinner } from './Spinner.jsx';

const VARIANTS = {
  primary:
    'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 disabled:bg-brand-300 shadow-sm',
  secondary:
    'bg-white text-slate-800 ring-1 ring-slate-300 ring-inset hover:bg-slate-50 active:bg-slate-100 disabled:text-slate-400',
  accent: 'bg-accent-600 text-white hover:bg-accent-500 active:bg-accent-600 disabled:bg-accent-400/50 shadow-sm',
  ghost: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200 disabled:text-slate-400',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 disabled:bg-rose-300',
};

const SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

const base =
  'inline-flex items-center justify-center rounded-lg font-semibold transition-colors ' +
  'disabled:cursor-not-allowed select-none';

/**
 * One button for the whole app.
 *
 * `loading` keeps the button mounted and its width stable while a request is in
 * flight, so the layout does not jump, and blocks repeat submissions.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className,
  children,
  to,
  ...props
}) {
  const classes = cn(base, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className);

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
