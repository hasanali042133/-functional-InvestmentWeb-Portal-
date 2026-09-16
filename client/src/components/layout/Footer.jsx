import { Link } from 'react-router-dom';
import { Logo } from './Logo.jsx';

const SECTIONS = [
  {
    title: 'Invest',
    links: [
      { to: '/products', label: 'Funds' },
      { to: '/portfolio', label: 'Portfolio' },
      { to: '/transactions', label: 'Transactions' },
    ],
  },
  {
    title: 'Account',
    links: [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/account/open', label: 'Account opening' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200/80 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
              Open an investment account online, invest in funds matched to your risk appetite, and
              watch your portfolio move with the market.
            </p>
          </div>

          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-xs font-semibold tracking-wide text-slate-900 uppercase">
                {section.title}
              </h2>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-600 transition-colors hover:text-brand-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/*
          The disclaimer sits in the footer of every signed-in page rather than
          only beside the invest button: it applies to every figure on every
          screen, not just to the moment money is committed.
        */}
        <div className="mt-8 border-t border-slate-200/80 pt-6">
          <p className="text-xs leading-relaxed text-slate-500">
            Investments are subject to market risk. Past performance does not guarantee future
            results, and the value of an investment can fall as well as rise. Fund prices in this
            application are simulated for demonstration.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            © {new Date().getFullYear()} Nivesta. Built as a practical assessment.
          </p>
        </div>
      </div>
    </footer>
  );
}
