import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.js';
import { initialsOf } from '@/lib/format.js';
import { cn } from '@/lib/cn.js';
import { Logo } from './Logo.jsx';
import { Footer } from './Footer.jsx';
import { ThemeToggle } from '@/components/ui/ThemeToggle.jsx';
import { NavSearch } from './NavSearch.jsx';

/** Shared wrapper so every nav icon lines up at the same weight and size. */
function Icon({ children, className }) {
  return (
    <svg
      className={cn('h-[18px] w-[18px] shrink-0', className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  },
  {
    to: '/products',
    label: 'Products',
    icon: (
      <>
        <path d="m12 3 9 4.5-9 4.5-9-4.5z" />
        <path d="m3 12 9 4.5 9-4.5" />
        <path d="m3 16.5 9 4.5 9-4.5" />
      </>
    ),
  },
  {
    to: '/portfolio',
    label: 'Portfolio',
    icon: (
      <>
        <path d="M12 3a9 9 0 1 0 9 9h-9z" />
        <path d="M15 3.5A9 9 0 0 1 20.5 9H15z" />
      </>
    ),
  },
  {
    to: '/transactions',
    label: 'Transactions',
    icon: (
      <>
        <path d="M4 7h11m0 0-3-3m3 3-3 3" />
        <path d="M20 17H9m0 0 3-3m-3 3 3 3" />
      </>
    ),
  },
];

/**
 * Navigation link.
 *
 * Plain text rather than a boxed control, with the current page carried by
 * weight and colour alone — on a header this crowded, four filled pills compete
 * with the account menu and the primary action beside them.
 */
function navLinkClasses({ isActive }) {
  return cn(
    'relative rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors duration-150',
    isActive
      ? 'text-brand-700 font-semibold'
      : 'font-medium text-slate-600 hover:text-slate-900',
  );
}

function UserMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // A menu that stays open after you click elsewhere, or that ignores Escape, is
  // the sort of small thing that makes an interface feel unfinished.
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-2.5 rounded-full py-1 pr-2 pl-1 transition-colors',
          open ? 'bg-slate-100' : 'hover:bg-slate-100',
        )}
      >
        <span className="from-brand-500 to-brand-700 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white shadow-sm">
          {initialsOf(user?.fullName)}
        </span>
        <span className="max-w-32 truncate text-sm font-medium text-slate-700">
          {user?.fullName}
        </span>
        <Icon className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')}>
          <path d="m6 9 6 6 6-6" />
        </Icon>
      </button>

      {open && (
        <div
          role="menu"
          className="animate-drop absolute right-0 mt-2 w-60 origin-top-right overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">{user?.fullName}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={onSignOut}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-rose-50 hover:text-rose-700"
          >
            <Icon>
              <path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </Icon>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function AppLayout() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Close the mobile menu whenever the route changes.
  const currentPath = location.pathname;
  const [lastPath, setLastPath] = useState(currentPath);
  if (currentPath !== lastPath) {
    setLastPath(currentPath);
    if (menuOpen) setMenuOpen(false);
  }

  // The header only earns a shadow once there is content underneath it to lift
  // away from; at the top of the page a flat border is quieter.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-dvh bg-slate-50">
      <header
        className={cn(
          'sticky top-0 z-30 border-b bg-white/80 backdrop-blur-md transition-shadow duration-200',
          scrolled ? 'border-slate-200 shadow-sm' : 'border-slate-200/70',
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <div className="flex flex-1 items-center gap-4">
            <NavLink
              to="/dashboard"
              aria-label="Go to dashboard"
              className="shrink-0 rounded-lg transition-opacity hover:opacity-80"
            >
              <Logo />
            </NavLink>

            {/* Given room on wide screens only: on a laptop the nav links and
                the account menu need the space more than search does. */}
            <NavSearch className="hidden w-full max-w-xs xl:block" />
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClasses}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-1">
            <ThemeToggle />
            <UserMenu user={user} onSignOut={signOut} />

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
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
          <nav className="animate-drop border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {/* Search lives in the header only from `xl` up, where there is
                  room beside the links. Without it here a phone would lose the
                  feature entirely. */}
              <NavSearch className="mb-2" />

              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-800'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    )
                  }
                >
                  <Icon>{item.icon}</Icon>
                  {item.label}
                </NavLink>
              ))}

              <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{user?.fullName}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                >
                  Sign out
                </button>
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* The page grows, the footer stays at the bottom of short screens. */}
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
        <main
          key={currentPath}
          className="animate-rise mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8"
        >
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}
