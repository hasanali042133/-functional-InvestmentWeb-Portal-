import { cn } from '@/lib/cn.js';

const SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-9 w-9 border-[3px]',
};

export function Spinner({ size = 'md', className, label = 'Loading' }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block animate-spin rounded-full border-current border-r-transparent align-[-0.125em]',
        SIZES[size],
        className,
      )}
    />
  );
}

/** Fills the available space — used while a route's data loads. */
export function LoadingSection({ label = 'Loading' }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-slate-400">
      <Spinner size="lg" label={label} />
      <p className="text-sm">{label}…</p>
    </div>
  );
}
