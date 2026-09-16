import { Link } from 'react-router-dom';
import { Logo } from './Logo.jsx';
import { AppPreview } from './AppPreview.jsx';
import { ThemeToggle } from '@/components/ui/ThemeToggle.jsx';

const PANEL_POINTS = [
  { title: 'Approved in minutes', text: 'No paperwork, no branch visit' },
  { title: 'Prices that move', text: 'Portfolio revalues as funds do' },
];

/**
 * Shell for the signed-out screens.
 *
 * The form sits in its own card with the product beside it rather than on a
 * decorative background: somebody deciding whether to sign up should be able to
 * see what they would be signing up for.
 *
 * Below `lg` the preview is dropped entirely — on a phone the form is the only
 * thing worth the width.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  altAction,
  panelEyebrow = 'Investor workspace',
  panelTitle = 'Your portfolio, ready on the web.',
  panelText = 'Open an account, invest in funds matched to your risk appetite, and watch the value move with the market.',
}) {
  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link to="/login" aria-label="Nivesta home" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {title}
            </h1>
            {subtitle && <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p>}

            <div className="mt-6">{children}</div>

            {altAction && <div className="mt-6">{altAction}</div>}

            {footer && <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>}
          </section>

          <aside className="ring-brand-100 bg-brand-50/70 hidden rounded-2xl p-6 ring-1 ring-inset sm:p-8 lg:block">
            <p className="text-brand-700 text-xs font-semibold tracking-[0.12em] uppercase">
              {panelEyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{panelTitle}</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">{panelText}</p>

            <div className="mt-6">
              <AppPreview />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {PANEL_POINTS.map((point) => (
                <div
                  key={point.title}
                  className="ring-brand-100 flex items-start gap-3 rounded-xl bg-white/80 px-4 py-3 ring-1 ring-inset"
                >
                  <span className="bg-brand-100 text-brand-700 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">
                      {point.title}
                    </span>
                    <span className="block text-xs text-slate-600">{point.text}</span>
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-slate-500">
          Investments are subject to market risk. Past performance does not guarantee future
          results. Fund prices in this application are simulated for demonstration.
        </p>
      </main>
    </div>
  );
}
