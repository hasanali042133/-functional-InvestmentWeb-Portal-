import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.js';
import { initialsOf } from '@/lib/format.js';
import { cn } from '@/lib/cn.js';
import { Logo } from './Logo.jsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/products', label: 'Products' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/transactions', label: 'Transactions' },
];

const linkClasses = ({ isActive }) =>
  cn(
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  );

export function AppLayout() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu whenever the route changes.
  const currentPath = location.pathname;
  const [lastPath, setLastPath] = useState(currentPath);
  if (currentPath !== lastPath) {
    setLastPath(currentPath);
    if (menuOpen) setMenuOpen(false);
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <NavLink to="/dashboard" aria-label="Go to dashboard">
              <Logo />
            </NavLink>
            <nav className="hidden items-center gap-1 md:flex">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClasses}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
                {initialsOf(user?.fullName)}
              </span>
              <span className="max-w-36 truncate text-sm font-medium text-slate-700">
                {user?.fullName}
              </span>
            </div>

            <button
              type="button"
              onClick={signOut}
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:block"
            >
              Sign out
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              aria-expanded={menuOpen}
              aria-label="Toggle navigation menu"
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                {menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClasses}>
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="truncate text-sm text-slate-600">{user?.email}</span>
                <button
                  type="button"
                  onClick={signOut}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  Sign out
                </button>
              </div>
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
