import { cn } from '@/lib/cn.js';

export function Logo({ className, onDark = false }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg',
          onDark ? 'bg-white/10' : 'bg-brand-900',
        )}
      >
        <svg
          className="h-5 w-5 text-accent-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 17 9.5 10l3.5 3.6L20 6" />
          <circle cx="20" cy="6" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span
        className={cn(
          'text-[15px] font-bold tracking-tight',
          onDark ? 'text-white' : 'text-slate-900',
        )}
      >
        Investment Portal
      </span>
    </span>
  );
}
