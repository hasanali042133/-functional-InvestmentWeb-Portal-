import { forwardRef, useId, useState } from 'react';
import { cn } from '@/lib/cn.js';

// Exported so a field that has to be composed by hand — an input with a button
// beside it, say — still looks like every other control.
export const controlBase =
  'block w-full rounded-lg border-0 bg-white px-3.5 text-slate-900 shadow-sm ' +
  'ring-1 ring-slate-300 ring-inset placeholder:text-slate-400 ' +
  'focus:ring-2 focus:ring-brand-600 focus:outline-none ' +
  'disabled:bg-slate-50 disabled:text-slate-500';

export const invalidRing = 'ring-rose-400 focus:ring-rose-500';

/** Label + control + hint/error, so every field is laid out identically. */
export function Field({ label, htmlFor, error, hint, required, action, children, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || action) && (
        <div className="flex items-baseline justify-between gap-3">
          {label && (
            <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
              {label}
              {required && <span className="ml-0.5 text-rose-600">*</span>}
            </label>
          )}
          {action}
        </div>
      )}
      {children}
      {error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : (
        hint && <p className="text-sm text-slate-500">{hint}</p>
      )}
    </div>
  );
}

/** Wraps a control so a leading icon can sit inside it without being clickable. */
function WithIcon({ icon, children }) {
  if (!icon) return children;

  return (
    <div className="relative">
      <span
        className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-slate-400"
        aria-hidden="true"
      >
        {icon}
      </span>
      {children}
    </div>
  );
}

export const Input = forwardRef(function Input(
  { label, error, hint, required, className, id, type = 'text', icon, action, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field
      label={label}
      htmlFor={inputId}
      error={error}
      hint={hint}
      required={required}
      action={action}
    >
      <WithIcon icon={icon}>
        <input
          ref={ref}
          id={inputId}
          type={type}
          aria-invalid={error ? 'true' : undefined}
          className={cn(controlBase, 'h-11', icon && 'pl-10', error && invalidRing, className)}
          {...props}
        />
      </WithIcon>
    </Field>
  );
});

export const PasswordInput = forwardRef(function PasswordInput(
  { label, error, hint, required, id, icon, action, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field
      label={label}
      htmlFor={inputId}
      error={error}
      hint={hint}
      required={required}
      action={action}
    >
      <div className="relative">
        {icon && (
          <span
            className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-10 items-center justify-center text-slate-400"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? 'true' : undefined}
          className={cn(controlBase, 'h-11 pr-11', icon && 'pl-10', error && invalidRing)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-400 hover:text-slate-600"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {visible ? (
              <>
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.4 5.2A9.7 9.7 0 0 1 12 5c5 0 9 4.5 9 7a12 12 0 0 1-2.2 3.1M6.2 6.6C4 8.1 3 10.4 3 12c0 2.5 4 7 9 7a9.9 9.9 0 0 0 3.6-.7" />
              </>
            ) : (
              <>
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="2.8" />
              </>
            )}
          </svg>
        </button>
      </div>
    </Field>
  );
});

export const Select = forwardRef(function Select(
  { label, error, hint, required, id, options = [], placeholder = 'Select…', className, ...props },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <Field label={label} htmlFor={selectId} error={error} hint={hint} required={required}>
      <select
        ref={ref}
        id={selectId}
        aria-invalid={error ? 'true' : undefined}
        className={cn(controlBase, 'h-11 pr-9', error && invalidRing, className)}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
});

/**
 * A money input.
 *
 * The currency sits inside the field rather than in the label, so the customer
 * can see what unit they are typing in while they type.
 */
export const CurrencyInput = forwardRef(function CurrencyInput(
  { label, error, hint, required, id, className, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required}>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-medium text-slate-500">
          PKR
        </span>
        <input
          ref={ref}
          id={inputId}
          type="number"
          inputMode="numeric"
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            controlBase,
            'tabular h-12 pl-14 text-lg font-semibold',
            error && invalidRing,
            className,
          )}
          {...props}
        />
      </div>
    </Field>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, required, id, rows = 4, className, ...props },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <Field label={label} htmlFor={textareaId} error={error} hint={hint} required={required}>
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        className={cn(controlBase, 'resize-y py-2.5', error && invalidRing, className)}
        {...props}
      />
    </Field>
  );
});

/**
 * Radio group rendered as selectable cards.
 *
 * Used where the choice carries consequences the customer should weigh — a risk
 * profile is easier to answer honestly when each option explains itself than
 * when it is one word in a dropdown.
 */
export function RadioCardGroup({ label, name, options, value, onChange, error, hint, required, columns = 1 }) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      <div
        role="radiogroup"
        aria-label={label}
        className={cn('grid gap-3', columns === 2 && 'sm:grid-cols-2')}
      >
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer gap-3 rounded-lg border p-3.5 transition-colors',
                checked
                  ? 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-600'
                  : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand-700)]"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                {option.hint && (
                  <span className="mt-0.5 block text-sm text-slate-500">{option.hint}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </Field>
  );
}

/** Inline radio pills, for short mutually exclusive answers such as gender. */
export function RadioPills({ label, name, options, value, onChange, error, required }) {
  return (
    <Field label={label} error={error} required={required}>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                'cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                checked
                  ? 'bg-brand-700 text-white'
                  : 'bg-white text-slate-700 ring-1 ring-slate-300 ring-inset hover:bg-slate-50',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </Field>
  );
}

export const Checkbox = forwardRef(function Checkbox({ label, error, id, ...props }, ref) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <div className="space-y-1.5">
      <label htmlFor={checkboxId} className="flex cursor-pointer items-start gap-3">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'mt-0.5 h-4.5 w-4.5 shrink-0 rounded accent-[var(--color-brand-700)]',
            error && 'outline outline-2 outline-rose-400',
          )}
          {...props}
        />
        <span className="text-sm leading-relaxed text-slate-700">{label}</span>
      </label>
      {error && <p className="ml-7 text-sm text-rose-600">{error}</p>}
    </div>
  );
});
