import { useTheme } from '@/hooks/useTheme.js';
import { cn } from '@/lib/cn.js';

const SunIcon = () => (
  <svg
    className="h-[18px] w-[18px]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

const MoonIcon = () => (
  <svg
    className="h-[18px] w-[18px]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

const OPTIONS = [
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
];

/**
 * Light and dark as two controls rather than one that flips.
 *
 * A single toggle has to choose between showing the theme in force and the one
 * it would switch to, and whichever it picks, half the people reading it guess
 * wrong. Two buttons with the current one filled leaves nothing to infer.
 *
 * Marked up as a radio group, because that is what it is: two options, one of
 * them chosen.
 */
export function ThemeToggle({ className }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        'flex items-center gap-0.5 rounded-full bg-slate-100 p-0.5 ring-1 ring-slate-200/70 ring-inset',
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const isActive = theme === value;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${label} mode`}
            title={`${label} mode`}
            onClick={() => setTheme(value)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200',
              isActive
                ? 'bg-brand-700 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}
