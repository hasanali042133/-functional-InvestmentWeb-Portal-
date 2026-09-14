import { cn } from '@/lib/cn.js';

/**
 * Progress through the account opening form.
 *
 * On a phone the full rail does not fit, so it collapses to a bar plus
 * "Step 2 of 6" — which is the part that actually answers "how much is left?".
 */
export function StepIndicator({ steps, currentIndex }) {
  const percent = Math.round(((currentIndex + 1) / steps.length) * 100);

  return (
    <div className="mb-8">
      <div className="sm:hidden">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-slate-900">{steps[currentIndex].title}</p>
          <p className="text-xs text-slate-500">
            Step {currentIndex + 1} of {steps.length}
          </p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-brand-600 transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ol className="hidden sm:flex sm:items-center">
        {steps.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li key={step.key} className={cn('flex items-center', index < steps.length - 1 && 'flex-1')}>
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                    isDone && 'bg-brand-700 text-white',
                    isCurrent && 'bg-brand-700 text-white ring-4 ring-brand-100',
                    !isDone && !isCurrent && 'bg-slate-200 text-slate-500',
                  )}
                >
                  {isDone ? (
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    'hidden text-sm font-medium lg:block',
                    isCurrent ? 'text-slate-900' : 'text-slate-500',
                  )}
                >
                  {step.title}
                </span>
              </div>

              {index < steps.length - 1 && (
                <span
                  className={cn(
                    'mx-3 h-0.5 flex-1 rounded-full transition-colors',
                    isDone ? 'bg-brand-700' : 'bg-slate-200',
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
