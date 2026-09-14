import { Logo } from './Logo.jsx';

const HIGHLIGHTS = [
  'Open your investment account online in minutes',
  'Choose from funds matched to your risk appetite',
  'Track your portfolio performance in real time',
];

/**
 * Two-panel shell for the signed-out screens.
 *
 * The brand panel is hidden below `lg` so a phone gives the full width to the
 * form rather than to decoration.
 */
export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-dvh">
      <aside className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden bg-brand-950 p-10 lg:flex">
        <div
          className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-brand-700/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-accent-600/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative">
          <Logo onDark />
        </div>

        <div className="relative">
          <h2 className="text-3xl leading-tight font-bold text-white">
            Invest with clarity,
            <br />
            from the first rupee.
          </h2>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex gap-3 text-sm text-brand-100">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-accent-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m5 12.5 4.5 4.5L19 7.5" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-brand-300">
          Investments are subject to market risk. Past performance does not guarantee future
          returns.
        </p>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p>}

          <div className="mt-7">{children}</div>

          {footer && <div className="mt-7 text-center text-sm text-slate-600">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
